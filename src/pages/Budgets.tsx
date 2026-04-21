import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useAppStore } from "../store/StoreProvider";
import { useTranslation } from "react-i18next";
import { useAppToast } from "../utils/toast";
import { apiClient } from "../api/client";
import "./budgets.css";

type BudgetFormData = {
  period: "weekly" | "monthly" | "yearly";
  totalLimit: string | number;
};

type CategoryFormData = {
  category: string;
  limitAmount: string | number;
};

const CATEGORY_OPTIONS = [
  { value: "Սնունդ", key: "food", icon: "🍔" },
  { value: "Տրանսպորտ", key: "transport", icon: "🚕" },
  { value: "Կայք", key: "shopping", icon: "🛍️" },
  { value: "Հաշիվներ", key: "bills", icon: "💡" },
  { value: "Առողջություն", key: "health", icon: "💊" },
  { value: "Կրթություն", key: "education", icon: "📚" },
  { value: "Ժամանց", key: "entertainment", icon: "🎬" },
  { value: "Ճամփորդություն", key: "travel", icon: "✈️" },
  { value: "Խնայողություն", key: "savings", icon: "🏦" },
  { value: "Այլ", key: "other", icon: "📦" },
];

function getCategoryIcon(category: string) {
  return CATEGORY_OPTIONS.find((c) => c.value === category)?.icon || "🏷️";
}

function getPeriodDates(period: string): { start: Date; end: Date } {
  const now = new Date();
  if (period === "monthly") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    };
  }
  if (period === "weekly") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  // yearly
  return {
    start: new Date(now.getFullYear(), 0, 1),
    end: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
  };
}

export default function Budgets() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useAppToast();
  const useStore = useAppStore();

  const budgets = useStore((s: any) => s.budgets ?? []);
  const transactions = useStore((s: any) => s.transactions ?? []);
  const loadBudgets = useStore((s: any) => s.loadBudgets);
  const loadTransactions = useStore((s: any) => s.loadTransactions);
  const createBudget = useStore((s: any) => s.createBudget);
  const deleteBudget = useStore((s: any) => s.deleteBudget);

  const [addingCategoryBudgetId, setAddingCategoryBudgetId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  useEffect(() => {
    loadBudgets?.();
    loadTransactions?.();
  }, [loadBudgets, loadTransactions]);

  const { register: registerBudget, handleSubmit: handleSubmitBudget, reset: resetBudget } =
    useForm<BudgetFormData>({ defaultValues: { period: "monthly", totalLimit: "" } });

  const { register: registerCategory, handleSubmit: handleSubmitCategory, reset: resetCategory } =
    useForm<CategoryFormData>({ defaultValues: { category: "", limitAmount: "" } });

  const preparedBudgets = useMemo(() => {
    return budgets.map((budget: any) => {
      const { start, end } = getPeriodDates(budget.period);
      const categories = (budget.categories ?? []) as any[];

      const categoriesWithSpent = categories.map((cat: any) => {
        const spent = transactions
          .filter((tx: any) => {
            const txType = String(tx.type || "").toLowerCase();
            const txCategory = String(tx.category || "").trim();
            const txDate = tx.txDate ? new Date(tx.txDate) : null;
            return (
              txType === "expense" &&
              txCategory === cat.category &&
              txDate &&
              txDate >= start &&
              txDate <= end
            );
          })
          .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

        const limit = Number(cat.limitAmount || 0);
        const progress = limit > 0 ? (spent / limit) * 100 : 0;
        return {
          ...cat,
          spent,
          progress,
          remaining: Math.max(limit - spent, 0),
          isWarning: progress >= 80 && progress < 100,
          isOver: progress >= 100,
        };
      });

      const totalSpent = categoriesWithSpent.reduce((s: number, c: any) => s + c.spent, 0);
      const totalLimit = Number(budget.totalLimit || 0);
      const overallProgress = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

      return {
        ...budget,
        categories: categoriesWithSpent,
        totalSpent,
        overallProgress,
        isWarning: overallProgress >= 80 && overallProgress < 100,
        isOver: overallProgress >= 100,
      };
    });
  }, [budgets, transactions]);

  const totalBudgetLimit = preparedBudgets.reduce((s: number, b: any) => s + Number(b.totalLimit || 0), 0);
  const totalSpent = preparedBudgets.reduce((s: number, b: any) => s + b.totalSpent, 0);
  const warningsCount = preparedBudgets.filter((b: any) => b.isWarning).length;
  const overspentCount = preparedBudgets.filter((b: any) => b.isOver).length;

  const onCreateBudget = async (data: BudgetFormData) => {
    if (!data.totalLimit || Number(data.totalLimit) <= 0) {
      showError(t("budgets.fillRequired", "Լրացրեք բոլոր դաշտերը"));
      return;
    }
    try {
      await createBudget({ period: data.period, totalLimit: Number(data.totalLimit) });
      resetBudget({ period: "monthly", totalLimit: "" });
      showSuccess(t("budgets.created", "Բյուջեն ստեղծվեց"));
    } catch (err: any) {
      showError(err?.message || t("budgets.createError", "Չհաջողվեց ստեղծել"));
    }
  };

  const onAddCategory = async (data: CategoryFormData) => {
    const budgetId = addingCategoryBudgetId;
    if (!budgetId || !data.category || !data.limitAmount || Number(data.limitAmount) <= 0) {
      showError(t("budgets.fillRequired", "Լրացրեք բոլոր դաշտերը"));
      return;
    }
    try {
      await apiClient.createBudgetCategory(budgetId, {
        category: data.category,
        limitAmount: Number(data.limitAmount),
      });
      await loadBudgets?.();
      resetCategory({ category: "", limitAmount: "" });
      setAddingCategoryBudgetId(null);
      showSuccess(t("budgets.categoryAdded", "Կատեգորիան ավելացվեց"));
    } catch (err: any) {
      showError(err?.message || t("budgets.categoryError", "Չհաջողվեց ավելացնել"));
    }
  };

  const handleDeleteCategory = async (budgetId: string, categoryId: string) => {
    if (!window.confirm(t("budgets.deleteCategoryConfirm", "Ջնջե՞լ կատեգորիան"))) return;
    setDeletingCategoryId(categoryId);
    try {
      await apiClient.deleteBudgetCategory(budgetId, categoryId);
      await loadBudgets?.();
      showSuccess(t("budgets.categoryDeleted", "Կատեգորիան ջնջվեց"));
    } catch {
      showError(t("budgets.deleteCategoryError", "Չհաջողվեց ջնջել"));
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!window.confirm(t("budgets.deleteConfirm", "Ջնջե՞լ բյուջեն"))) return;
    try {
      await deleteBudget(id);
      showSuccess(t("budgets.deleted", "Բյուջեն ջնջվեց"));
    } catch {
      showError(t("budgets.deleteError", "Չհաջողվեց ջնջել"));
    }
  };

  const periodLabel = (p: string) => {
    if (p === "monthly") return t("budgets.monthly", "Ամսական");
    if (p === "weekly") return t("budgets.weekly", "Շաբաթական");
    return t("budgets.yearly", "Տարեկան");
  };

  return (
    <div className="budgets-page">
      <div className="budgets-hero">
        <div>
          <p className="budgets-eyebrow">📊 {t("budgets.title", "Բյուջե")}</p>
          <h2 className="budgets-title">{t("budgets.title", "Բյուջե")}</h2>
          <p className="budgets-subtitle">
            {t("budgets.description", "Կառավարեք ծախսերի սահմանաչափերը ըստ կատեգորիաների։")}
          </p>
        </div>
        <div className="budgets-hero-badge">
          <span>✨</span>
          <span>{t("budgets.overview", "Ընդհանուր")}</span>
        </div>
      </div>

      <div className="budgets-stats-grid">
        <div className="budgets-stat-card">
          <div className="budgets-stat-icon">💼</div>
          <div>
            <div className="budgets-stat-value">{totalBudgetLimit.toLocaleString()}</div>
            <div className="budgets-stat-label">{t("budgets.monthlyTotal", "Ընդհանուր սահմանաչափ")}</div>
          </div>
        </div>
        <div className="budgets-stat-card">
          <div className="budgets-stat-icon">💸</div>
          <div>
            <div className="budgets-stat-value">{totalSpent.toLocaleString()}</div>
            <div className="budgets-stat-label">{t("budgets.totalSpent", "Ծախսված")}</div>
          </div>
        </div>
        <div className="budgets-stat-card">
          <div className="budgets-stat-icon">🟡</div>
          <div>
            <div className="budgets-stat-value">{warningsCount}</div>
            <div className="budgets-stat-label">{t("budgets.warningCount", "80% հասած")}</div>
          </div>
        </div>
        <div className="budgets-stat-card">
          <div className="budgets-stat-icon">🔴</div>
          <div>
            <div className="budgets-stat-value">{overspentCount}</div>
            <div className="budgets-stat-label">{t("budgets.overspentCount", "Գերծախսված")}</div>
          </div>
        </div>
      </div>

      <section className="budgets-panel budgets-create-panel">
        <div className="budgets-panel-header budgets-create-header">
          <div>
            <h3 className="budgets-panel-title">
              <span className="budgets-title-icon">➕</span>
              {t("budgets.createBudget", "Ստեղծել բյուջե")}
            </h3>
            <p className="budgets-panel-text">
              {t("budgets.createDescription", "Ընտրեք ժամանակաշրջան և ընդհանուր սահմանաչափ")}
            </p>
          </div>
        </div>
        <form className="budgets-form-grid budgets-form-grid--better" onSubmit={handleSubmitBudget(onCreateBudget)}>
          <div className="budgets-field budgets-field-card">
            <label className="budgets-label">{t("budgets.period", "Ժամանակաշրջան")}</label>
            <select className="budgets-input budgets-input--lg" {...registerBudget("period")}>
              <option value="monthly">{t("budgets.monthly", "Ամսական")}</option>
              <option value="weekly">{t("budgets.weekly", "Շաբաթական")}</option>
              <option value="yearly">{t("budgets.yearly", "Տարեկան")}</option>
            </select>
          </div>
          <div className="budgets-field budgets-field-card">
            <label className="budgets-label">{t("budgets.totalLimit", "Ընդհանուր սահմանաչափ")}</label>
            <input
              type="number"
              className="budgets-input budgets-input--lg"
              placeholder="300000"
              {...registerBudget("totalLimit")}
            />
          </div>
          <div className="budgets-form-actions">
            <button className="budgets-primary-btn budgets-primary-btn--wide" type="submit">
              <span>✅</span>
              <span>{t("budgets.createBudget", "Ստեղծել բյուջե")}</span>
            </button>
          </div>
        </form>
      </section>

      <section className="budgets-section">
        <div className="budgets-section-header">
          <div>
            <h3 className="budgets-section-title">🏷️ {t("budgets.categoryBudgets", "Բյուջեներ")}</h3>
            <p className="budgets-section-text">
              {t("budgets.sectionSubtitle", "Ընթացիկ ծախսերի առաջընթաց")}
            </p>
          </div>
        </div>

        {preparedBudgets.length === 0 ? (
          <div className="budgets-empty-state">
            <div className="budgets-empty-icon">🪄</div>
            <h4>{t("dashboard.noBudgets", "Բյուջե չկա")}</h4>
            <p>{t("budgets.emptyDescription", "Ստեղծեք բյուջե ծախսերը հետևելու համար")}</p>
          </div>
        ) : (
          <div className="budgets-cards-grid">
            {preparedBudgets.map((budget: any) => (
              <article
                key={budget.id}
                className={`budgets-card ${budget.isOver ? "over" : budget.isWarning ? "warning" : ""}`}
              >
                <div className="budgets-card-top">
                  <div className="budgets-card-icon">📊</div>
                  <div className={`budgets-status-badge ${budget.isOver ? "danger" : budget.isWarning ? "warning" : "ok"}`}>
                    {periodLabel(budget.period)}
                  </div>
                  <button
                    type="button"
                    className="budgets-delete-btn"
                    onClick={() => handleDeleteBudget(String(budget.id))}
                    title={t("budgets.delete", "Ջնջել")}
                  >
                    🗑️
                  </button>
                </div>

                <div className="budgets-card-body">
                  <div className="budgets-money-row">
                    <div>
                      <div className="budgets-money-label">{t("budgets.limit", "Սահմանաչափ")}</div>
                      <div className="budgets-money-value">{Number(budget.totalLimit).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="budgets-money-label">{t("budgets.spent", "Ծախսված")}</div>
                      <div className="budgets-money-value">{budget.totalSpent.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="budgets-progress-block">
                    <div className="budgets-progress-head">
                      <span>{t("budgets.usedPercent", "Ծախսված")}</span>
                      <strong>{Math.round(budget.overallProgress)}%</strong>
                    </div>
                    <div className="budgets-progress-track">
                      <div
                        className={`budgets-progress-fill ${budget.isOver ? "over" : budget.isWarning ? "warning" : ""}`}
                        style={{ width: `${Math.min(budget.overallProgress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Categories */}
                  {budget.categories.length > 0 && (
                    <div className="budgets-category-list">
                      {budget.categories.map((cat: any) => (
                        <div key={cat.id} className={`budgets-category-row ${cat.isOver ? "over" : cat.isWarning ? "warning" : ""}`}>
                          <div className="budgets-category-left">
                            <span className="budgets-category-icon">{getCategoryIcon(cat.category)}</span>
                            <span className="budgets-category-name">
                              {(() => {
                                const opt = CATEGORY_OPTIONS.find((o) => o.value === cat.category);
                                return opt ? t(`categories.${opt.key}`, cat.category) : cat.category;
                              })()}
                            </span>
                          </div>
                          <div className="budgets-category-right">
                            <span className="budgets-category-amounts">
                              {cat.spent.toLocaleString()} / {Number(cat.limitAmount).toLocaleString()}
                            </span>
                            <span className={`budgets-category-pct ${cat.isOver ? "danger" : cat.isWarning ? "warning" : ""}`}>
                              {Math.round(cat.progress)}%
                            </span>
                            <button
                              type="button"
                              className="budgets-category-delete"
                              disabled={deletingCategoryId === cat.id}
                              onClick={() => handleDeleteCategory(String(budget.id), String(cat.id))}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add category inline */}
                  {addingCategoryBudgetId === String(budget.id) ? (
                    <form
                      className="budgets-add-category-form"
                      onSubmit={handleSubmitCategory(onAddCategory)}
                    >
                      <select className="budgets-input" {...registerCategory("category")}>
                        <option value="">{t("budgets.selectCategory", "Կատեգորիա")}</option>
                        {CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.icon} {t(`categories.${opt.key}`, opt.value)}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        className="budgets-input"
                        placeholder={t("budgets.limit", "Սահմանաչափ")}
                        {...registerCategory("limitAmount")}
                      />
                      <div className="budgets-category-form-actions">
                        <button type="submit" className="budgets-primary-btn">
                          {t("budgets.add", "Ավելացնել")}
                        </button>
                        <button
                          type="button"
                          className="budgets-secondary-btn"
                          onClick={() => setAddingCategoryBudgetId(null)}
                        >
                          {t("budgets.cancel", "Չեղարկել")}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="budgets-add-category-btn"
                      onClick={() => {
                        setAddingCategoryBudgetId(String(budget.id));
                        resetCategory({ category: "", limitAmount: "" });
                      }}
                    >
                      ➕ {t("budgets.addCategory", "Ավելացնել կատեգորիա")}
                    </button>
                  )}
                </div>

                <div className="budgets-card-footer">
                  {budget.isOver ? (
                    <>
                      <span className="budgets-remaining-label">{t("budgets.overspent", "Գերծախս")}</span>
                      <span className="budgets-remaining-value danger">
                        +{Math.abs(Number(budget.totalLimit) - budget.totalSpent).toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="budgets-remaining-label">{t("budgets.remaining", "Մնացել է")}</span>
                      <span className="budgets-remaining-value">
                        {Math.max(Number(budget.totalLimit) - budget.totalSpent, 0).toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
