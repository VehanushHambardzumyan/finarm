import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useAppStore } from "../store/StoreProvider";
import { useTranslation } from "react-i18next";
import { useAppToast } from "../utils/toast";
import "./goals.css";

type GoalFormData = {
  title: string;
  targetAmount: string | number;
  deadline: string;
};

type ContributeFormData = {
  goalId: string;
  accountId: string;
  amount: string | number;
};

function isPastDeadline(deadline?: string | null, progress?: number) {
  if (!deadline) return false;
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return false;
  return d < new Date() && (progress || 0) < 100;
}

export default function Goals() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useAppToast();
  const useStore = useAppStore();

  const goals = useStore((s: any) => s.goals ?? []);
  const accounts = useStore((s: any) => s.accounts ?? []);
  const loadGoals = useStore((s: any) => s.loadGoals);
  const loadAccounts = useStore((s: any) => s.loadAccounts);
  const createGoal = useStore((s: any) => s.createGoal);
  const deleteGoal = useStore((s: any) => s.deleteGoal);
  const contributeToGoal = useStore((s: any) => s.contributeToGoal);
  const createTransaction = useStore((s: any) => s.createTransaction);

  const [editGoal, setEditGoal] = useState<any>(null);

  useEffect(() => {
    loadGoals?.();
    loadAccounts?.();
  }, [loadGoals, loadAccounts]);

  const { register, handleSubmit, reset } = useForm<GoalFormData>({
    defaultValues: { title: "", targetAmount: "", deadline: "" },
  });

  const {
    register: registerContribute,
    handleSubmit: handleSubmitContribute,
    reset: resetContribute,
    watch: watchContribute,
  } = useForm<ContributeFormData>({
    defaultValues: { goalId: "", accountId: "", amount: "" },
  });

  const selectedGoalId = watchContribute("goalId");
  const selectedAccountId = watchContribute("accountId");

  const preparedGoals = useMemo(() => {
    return goals.map((goal: any) => {
      const target = Number(goal.targetAmount ?? 0);
      const saved = Number(goal.currentAmount ?? 0);
      const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;

      let status = "active";
      if (progress >= 100) status = "completed";
      else if (isPastDeadline(goal.deadline, progress)) status = "overdue";

      return {
        ...goal,
        target,
        saved,
        progress,
        remaining: Math.max(target - saved, 0),
        status,
      };
    });
  }, [goals]);

  const totalTarget = preparedGoals.reduce((s: number, g: any) => s + g.target, 0);
  const totalSaved = preparedGoals.reduce((s: number, g: any) => s + g.saved, 0);
  const completedCount = preparedGoals.filter((g: any) => g.status === "completed").length;
  const overdueCount = preparedGoals.filter((g: any) => g.status === "overdue").length;

  const selectedGoal = preparedGoals.find((g: any) => String(g.id) === String(selectedGoalId));
  const selectedAccount = accounts.find((a: any) => String(a.id) === String(selectedAccountId));

  const onCreateGoal = async (data: GoalFormData) => {
    if (!data.title || !data.targetAmount) {
      showError(t("goals.fillRequired", "Լրացրեք պարտադիր դաշտերը"));
      return;
    }
    try {
      await createGoal({
        title: data.title,
        targetAmount: Number(data.targetAmount),
        deadline: data.deadline || undefined,
      });
      reset({ title: "", targetAmount: "", deadline: "" });
      showSuccess(t("goals.created", "Նպատակը ստեղծվեց"));
    } catch {
      showError(t("goals.createError", "Չհաջողվեց ստեղծել"));
    }
  };

  const onContribute = async (data: ContributeFormData) => {
    const goal = preparedGoals.find((g: any) => String(g.id) === String(data.goalId));
    const account = accounts.find((a: any) => String(a.id) === String(data.accountId));
    const amount = Number(data.amount || 0);

    if (!goal || !account || amount <= 0) {
      showError(t("goals.addMoneyError", "Սխալ տվյալներ"));
      return;
    }
    if (Number(account.balance || 0) < amount) {
      showError(t("goals.insufficientFunds", "Հաշվում բավարար գումար չկա"));
      return;
    }
    if (goal.status === "completed") {
      showError(t("goals.alreadyCompleted", "Նպատակն արդեն ավարտված է"));
      return;
    }

    try {
      await createTransaction({
        type: "expense",
        accountId: account.id,
        amount,
        currency: account.currency || "AMD",
        txDate: new Date().toISOString().slice(0, 10),
        category: t("goals.category", "Savings"),
        note: `${t("goals.goalNote", "Goal")}: ${goal.title}`,
      });
      await contributeToGoal(String(goal.id), amount);
      await loadGoals?.();
      await loadAccounts?.();
      resetContribute({ goalId: "", accountId: "", amount: "" });
      showSuccess(t("goals.moneyAdded", "Գումարը ավելացվեց"));
    } catch (err: any) {
      showError(err?.message || t("goals.addMoneyError", "Չհաջողվեց ավելացնել"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("goals.deleteConfirm", "Վստա՞հ եք, որ ուզում եք ջնջել"))) return;
    try {
      await deleteGoal(id);
      showSuccess(t("goals.deleted", "Ջնջվեց"));
    } catch {
      showError(t("goals.deleteError", "Չհաջողվեց ջնջել"));
    }
  };

  return (
    <div className="goals-page">
      <div className="goals-hero">
        <div>
          <p className="goals-eyebrow">🎯 {t("goals.title", "Նպատակներ")}</p>
          <h2 className="goals-title">{t("goals.title", "Նպատակներ")}</h2>
          <p className="goals-subtitle">
            {t("goals.description", "Ստեղծեք նպատակներ, կուտակեք գումար, հետևեք առաջընթացին։")}
          </p>
        </div>
        <div className="goals-hero-badge">
          <span>✨</span>
          <span>{t("goals.overview", "Ընդհանուր")}</span>
        </div>
      </div>

      <div className="goals-stats-grid">
        <div className="goals-stat-card">
          <div className="goals-stat-icon">🎯</div>
          <div>
            <div className="goals-stat-value">{totalTarget.toLocaleString()}</div>
            <div className="goals-stat-label">{t("goals.totalTarget", "Ընդհանուր թիրախ")}</div>
          </div>
        </div>
        <div className="goals-stat-card">
          <div className="goals-stat-icon">💰</div>
          <div>
            <div className="goals-stat-value">{totalSaved.toLocaleString()}</div>
            <div className="goals-stat-label">{t("goals.totalSaved", "Կուտակված")}</div>
          </div>
        </div>
        <div className="goals-stat-card">
          <div className="goals-stat-icon">✅</div>
          <div>
            <div className="goals-stat-value">{completedCount}</div>
            <div className="goals-stat-label">{t("goals.completedCount", "Ավարտված")}</div>
          </div>
        </div>
        <div className="goals-stat-card">
          <div className="goals-stat-icon">⏰</div>
          <div>
            <div className="goals-stat-value">{overdueCount}</div>
            <div className="goals-stat-label">{t("goals.overdueCount", "Ժամկետանց")}</div>
          </div>
        </div>
      </div>

      <div className="goals-top-grid">
        <section className="goals-panel">
          <div className="goals-panel-header">
            <div>
              <h3 className="goals-panel-title">➕ {t("goals.create", "Ստեղծել նպատակ")}</h3>
              <p className="goals-panel-text">
                {t("goals.createDescription", "Անվանումը և թիրախային գումարը պարտադիր են։")}
              </p>
            </div>
          </div>
          <form className="goals-form-grid" onSubmit={handleSubmit(onCreateGoal)}>
            <div className="goals-field">
              <label className="goals-label">{t("goals.name", "Անվանում")}</label>
              <input
                className="goals-input"
                placeholder={t("goals.namePlaceholder", "Օր. Նոր laptop")}
                {...register("title")}
              />
            </div>
            <div className="goals-field">
              <label className="goals-label">{t("goals.target", "Թիրախային գումար")}</label>
              <input
                type="number"
                className="goals-input"
                placeholder="500000"
                {...register("targetAmount")}
              />
            </div>
            <div className="goals-field">
              <label className="goals-label">{t("goals.deadline", "Վերջնաժամկետ")}</label>
              <input type="date" className="goals-input" {...register("deadline")} />
            </div>
            <button className="goals-primary-btn" type="submit">
              ✅ {t("goals.create", "Ստեղծել")}
            </button>
          </form>
        </section>

        <section className="goals-panel">
          <div className="goals-panel-header">
            <div>
              <h3 className="goals-panel-title">💸 {t("goals.addMoney", "Գումար ավելացնել")}</h3>
              <p className="goals-panel-text">
                {t("goals.addMoneyDescription", "Ընտրեք նպատակ, հաշիվ, և փոխանցեք գումար։")}
              </p>
            </div>
          </div>
          <form className="goals-form-grid" onSubmit={handleSubmitContribute(onContribute)}>
            <div className="goals-field">
              <label className="goals-label">{t("goals.selectGoal", "Ընտրեք նպատակ")}</label>
              <select className="goals-input" {...registerContribute("goalId")}>
                <option value="">{t("goals.selectGoal", "Ընտրեք նպատակ")}</option>
                {preparedGoals
                  .filter((g: any) => g.status !== "completed")
                  .map((goal: any) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title} ({Math.round(goal.progress)}%)
                    </option>
                  ))}
              </select>
            </div>
            <div className="goals-field">
              <label className="goals-label">{t("goals.fromAccount", "Հաշիվ")}</label>
              <select className="goals-input" {...registerContribute("accountId")}>
                <option value="">{t("goals.selectAccount", "Ընտրեք հաշիվ")}</option>
                {accounts.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {Number(a.balance || 0).toLocaleString()} {a.currency || "AMD"}
                  </option>
                ))}
              </select>
            </div>
            <div className="goals-field">
              <label className="goals-label">{t("goals.amount", "Գումար")}</label>
              <input
                type="number"
                className="goals-input"
                placeholder="25000"
                {...registerContribute("amount")}
              />
            </div>
            <button className="goals-secondary-btn" type="submit">
              🚀 {t("goals.addMoney", "Ավելացնել")}
            </button>
          </form>

          {(selectedGoal || selectedAccount) && (
            <div className="goals-helper-box">
              {selectedGoal && (
                <div className="goals-helper-item">
                  <span>{t("goals.selectedGoal", "Ընտրված նպատակ")}:</span>
                  <strong>
                    {selectedGoal.title} — {selectedGoal.saved.toLocaleString()} / {selectedGoal.target.toLocaleString()}
                  </strong>
                </div>
              )}
              {selectedAccount && (
                <div className="goals-helper-item">
                  <span>{t("goals.selectedAccount", "Ընտրված հաշիվ")}:</span>
                  <strong>
                    {selectedAccount.name} — {Number(selectedAccount.balance || 0).toLocaleString()} {selectedAccount.currency || "AMD"}
                  </strong>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <section className="goals-section">
        <div className="goals-section-header">
          <div>
            <h3 className="goals-section-title">🏷️ {t("goals.yourGoals", "Ձեր նպատակները")}</h3>
            <p className="goals-section-text">
              {t("goals.sectionSubtitle", "Հետևեք խնայողությունների առաջընթացին")}
            </p>
          </div>
        </div>

        {preparedGoals.length === 0 ? (
          <div className="goals-empty-state">
            <div className="goals-empty-icon">🪄</div>
            <h4>{t("goals.noGoals", "Նպատակներ չկան")}</h4>
            <p>{t("goals.emptyDescription", "Ստեղծեք ձեր առաջին նպատակը")}</p>
          </div>
        ) : (
          <div className="goals-cards-grid">
            {preparedGoals.map((goal: any) => (
              <article
                key={goal.id}
                className={`goals-card ${
                  goal.status === "completed" ? "completed" : goal.status === "overdue" ? "overdue" : ""
                }`}
              >
                <div className="goals-card-top">
                  <div className="goals-card-icon">
                    {goal.status === "completed" ? "🏆" : goal.status === "overdue" ? "⏰" : "🎯"}
                  </div>
                  <div
                    className={`goals-status-badge ${
                      goal.status === "completed" ? "success" : goal.status === "overdue" ? "danger" : "default"
                    }`}
                  >
                    {goal.status === "completed"
                      ? t("goals.completed", "Ավարտված")
                      : goal.status === "overdue"
                      ? t("goals.overdue", "Ժամկետանց")
                      : t("goals.active", "Ակտիվ")}
                  </div>
                </div>

                <div className="goals-card-body">
                  <h4 className="goals-card-name">{goal.title}</h4>
                  <p className="goals-card-deadline">
                    {goal.deadline
                      ? `${t("goals.deadline", "Վերջնաժամկետ")}: ${String(goal.deadline).slice(0, 10)}`
                      : t("goals.noDeadline", "Վերջնաժամկետ չկա")}
                  </p>

                  <div className="goals-money-row">
                    <div>
                      <div className="goals-money-label">{t("goals.target", "Թիրախ")}</div>
                      <div className="goals-money-value">{goal.target.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="goals-money-label">{t("goals.saved", "Կուտակված")}</div>
                      <div className="goals-money-value">{goal.saved.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="goals-progress-block">
                    <div className="goals-progress-head">
                      <span>{t("goals.progress", "Առաջընթաց")}</span>
                      <strong>{Math.round(goal.progress)}%</strong>
                    </div>
                    <div className="goals-progress-track">
                      <div
                        className={`goals-progress-fill ${
                          goal.status === "completed" ? "completed" : goal.status === "overdue" ? "overdue" : ""
                        }`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="goals-card-footer">
                  {goal.status === "completed" ? (
                    <span className="goals-footer-pill success">
                      {t("goals.goalReached", "Նպատակը հասցված է 🎉")}
                    </span>
                  ) : goal.status === "overdue" ? (
                    <span className="goals-footer-pill danger">
                      {t("goals.deadlinePassed", "Ժամկետն անց է կացել")}
                    </span>
                  ) : (
                    <span className="goals-footer-pill">
                      {t("goals.remaining", "Մնում է")}: {goal.remaining.toLocaleString()}
                    </span>
                  )}
                  <button
                    type="button"
                    className="goals-delete-btn"
                    onClick={() => handleDelete(String(goal.id))}
                  >
                    🗑️
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editGoal && (
        <div className="goals-modal-overlay" onClick={() => setEditGoal(null)}>
          <div className="goals-modal" onClick={(e) => e.stopPropagation()}>
            <button className="goals-close-btn" onClick={() => setEditGoal(null)}>×</button>
            <p>{editGoal.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}
