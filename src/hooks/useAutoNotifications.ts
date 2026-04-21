import { useEffect, useRef } from "react";
import { useAppStore } from "../store/StoreProvider";
import { apiClient } from "../api/client";

/**
 * Ավտոմատ ստեղծում է համակարգային ծանուցումներ հայերեն.
 *  - Բյուջե 80%+ → warning
 *  - Բյուջե 100%+ → exceeded
 *  - Նպատակ 100% → completed
 *
 * sessionStorage-ն օգտագործում ենք duplicate-ից խուսափելու համար
 * (session-ի ընթացքում նույն notification-ը կրկին չի ուղարկվի)
 */

function getPeriodDates(period: string): { start: Date; end: Date } {
  const now = new Date();
  if (period === "monthly") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end:   new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    };
  }
  if (period === "weekly") {
    const day  = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now); start.setDate(diff); start.setHours(0, 0, 0, 0);
    const end   = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  return {
    start: new Date(now.getFullYear(), 0, 1),
    end:   new Date(now.getFullYear(), 11, 31, 23, 59, 59),
  };
}

function alreadySent(key: string): boolean {
  return sessionStorage.getItem(key) === "1";
}

function markSent(key: string) {
  sessionStorage.setItem(key, "1");
}

export function useAutoNotifications() {
  const useStore     = useAppStore();
  const isAuth       = useStore((s: any) => s.isAuthenticated);
  const budgets      = useStore((s: any) => s.budgets      ?? []);
  const transactions = useStore((s: any) => s.transactions ?? []);
  const goals        = useStore((s: any) => s.goals        ?? []);
  const loadNotifications = useStore((s: any) => s.loadNotifications);

  // Throttle: don't check more than once per minute
  const lastCheck = useRef(0);

  useEffect(() => {
    if (!isAuth) return;
    const now = Date.now();
    if (now - lastCheck.current < 60_000) return;
    lastCheck.current = now;

    const created: Promise<any>[] = [];

    // ── Budget categories ──────────────────────────────────────────
    budgets.forEach((budget: any) => {
      const { start, end } = getPeriodDates(budget.period);
      const categories = (budget.categories ?? []) as any[];

      categories.forEach((cat: any) => {
        const spent = transactions
          .filter((tx: any) => {
            const type = String(tx.type || "").toLowerCase();
            const txDate = tx.txDate ? new Date(tx.txDate) : null;
            return (
              type === "expense" &&
              String(tx.category || "").trim() === cat.category &&
              txDate && txDate >= start && txDate <= end
            );
          })
          .reduce((s: number, tx: any) => s + Number(tx.amount || 0), 0);

        const limit    = Number(cat.limitAmount || 0);
        if (limit <= 0) return;
        const progress = (spent / limit) * 100;

        const key100 = `notif_budget_${budget.id}_${cat.id}_100`;
        const key80  = `notif_budget_${budget.id}_${cat.id}_80`;

        if (progress >= 100 && !alreadySent(key100)) {
          markSent(key100);
          created.push(
            apiClient.createNotification({
              type:    "budget_exceeded",
              message: `⚠️ Բյուջե "${cat.category}" — սահմանաչափը գերազանցված է (${Math.round(progress)}%)`,
            })
          );
        } else if (progress >= 80 && progress < 100 && !alreadySent(key80)) {
          markSent(key80);
          created.push(
            apiClient.createNotification({
              type:    "budget_warning",
              message: `🟡 Բյուջե "${cat.category}" — ${Math.round(progress)}% ծախսված`,
            })
          );
        }
      });
    });

    // ── Goals ──────────────────────────────────────────────────────
    goals.forEach((goal: any) => {
      const target  = Number(goal.targetAmount || 0);
      const current = Number(goal.currentAmount || 0);
      if (target <= 0) return;

      const key = `notif_goal_${goal.id}_done`;
      if (current >= target && !alreadySent(key)) {
        markSent(key);
        created.push(
          apiClient.createNotification({
            type:    "goal_completed",
            message: `🏆 Նպատակ "${goal.title}" — հասցված է! Շնորհավո՛ր`,
          })
        );
      }

      // Overdue warning
      if (goal.deadline) {
        const deadline = new Date(goal.deadline);
        const overKey  = `notif_goal_${goal.id}_overdue`;
        if (deadline < new Date() && current < target && !alreadySent(overKey)) {
          markSent(overKey);
          created.push(
            apiClient.createNotification({
              type:    "goal_overdue",
              message: `⏰ Նպատակ "${goal.title}" — վերջնաժամկետն անց է կացել`,
            })
          );
        }
      }
    });

    if (created.length > 0) {
      Promise.allSettled(created).then(() => {
        loadNotifications?.();
      });
    }
  }, [isAuth, budgets, transactions, goals, loadNotifications]);
}
