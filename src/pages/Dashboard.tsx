import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/StoreProvider";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import "./dashboard.css";

type AccountLike = {
  id: string | number;
  name: string;
  balance?: number | string;
  currency?: string;
  type?: string;
};

type TransactionLike = {
  id: string | number;
  type?: string;
  category?: string;
  amount?: number | string;
  currency?: string;
  txDate?: string;
  note?: string;
};

type GoalLike = {
  id: string | number;
  name: string;
  target?: number | string;
  targetAmount?: number | string;
  saved?: number | string;
  savedAmount?: number | string;
  currency?: string;
};

type BudgetLike = {
  id: string | number;
  category?: string;
  name?: string;
  limit?: number | string;
  amount?: number | string;
  spent?: number | string;
  used?: number | string;
  currency?: string;
};

const accountIcons: Record<string, string> = {
  cash: "💵",
  bank: "🏦",
  debit: "💳",
  credit: "🧾",
};

const transactionIcons: Record<string, string> = {
  income: "🟢",
  expense: "🔴",
  transfer: "🔁",
};

function normalizeType(type?: string) {
  return String(type ?? "").trim().toLowerCase();
}

function isIncome(type?: string) {
  const value = normalizeType(type);
  return value === "income" || value === "եկամուտ";
}

function isExpense(type?: string) {
  const value = normalizeType(type);
  return value === "expense" || value === "ծախս";
}

function normalizeAmount(value?: number | string) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const useStore = useAppStore();

  const currentUser = useStore((s) => (s as any).currentUser);
  const accounts = useStore(
    (s) => (((s as any).accounts ?? []) as AccountLike[])
  );
  const transactions = useStore(
    (s) => (((s as any).transactions ?? []) as TransactionLike[])
  );
  const goals = useStore((s) => (((s as any).goals ?? []) as GoalLike[]));
  const budgets = useStore((s) => (((s as any).budgets ?? []) as BudgetLike[]));

  const mainCurrency =
    currentUser?.profile?.currency ||
    accounts?.[0]?.currency ||
    transactions?.[0]?.currency ||
    "AMD";

  const totalBalance = useMemo(() => {
    return accounts.reduce(
      (sum, account) => sum + normalizeAmount(account.balance),
      0
    );
  }, [accounts]);

  const normalizedTransactions = useMemo(() => {
    return transactions.map((tx) => ({
      ...tx,
      normalizedType: normalizeType(tx.type),
      normalizedAmount: normalizeAmount(tx.amount),
      normalizedCategory:
        String(tx.category || t("dashboard.uncategorized")).trim() ||
        t("dashboard.uncategorized"),
    }));
  }, [transactions, t]);

  const incomeTotal = useMemo(() => {
    return normalizedTransactions
      .filter((tx) => isIncome(tx.type))
      .reduce((sum, tx) => sum + tx.normalizedAmount, 0);
  }, [normalizedTransactions]);

  const expenseTotal = useMemo(() => {
    return normalizedTransactions
      .filter((tx) => isExpense(tx.type))
      .reduce((sum, tx) => sum + tx.normalizedAmount, 0);
  }, [normalizedTransactions]);

  const savingsTotal = useMemo(() => {
    return goals.reduce((sum, goal) => {
      const saved = normalizeAmount(goal.saved ?? goal.savedAmount);
      return sum + saved;
    }, 0);
  }, [goals]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        const aTime = a.txDate ? new Date(a.txDate).getTime() : 0;
        const bTime = b.txDate ? new Date(b.txDate).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [transactions]);

  const preparedGoals = useMemo(() => {
    return goals.slice(0, 3).map((goal) => {
      const target = normalizeAmount(goal.target ?? goal.targetAmount);
      const saved = normalizeAmount(goal.saved ?? goal.savedAmount);
      const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;

      return {
        id: goal.id,
        name: goal.name,
        target,
        saved,
        progress,
        currency: goal.currency || mainCurrency,
      };
    });
  }, [goals, mainCurrency]);

  const preparedBudgets = useMemo(() => {
    return budgets.slice(0, 3).map((budget) => {
      const limit = normalizeAmount(budget.limit ?? budget.amount);
      const spent = normalizeAmount(budget.spent ?? budget.used);
      const progress = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

      return {
        id: budget.id,
        title:
          budget.category ||
          budget.name ||
          t("dashboard.uncategorized"),
        limit,
        spent,
        progress,
        currency: budget.currency || mainCurrency,
      };
    });
  }, [budgets, mainCurrency, t]);

  const topExpenseCategories = useMemo(() => {
    return Object.entries(
      normalizedTransactions
        .filter((tx) => isExpense(tx.type))
        .reduce((acc, tx) => {
          const key = tx.normalizedCategory || t("dashboard.uncategorized");
          acc[key] = (acc[key] || 0) + tx.normalizedAmount;
          return acc;
        }, {} as Record<string, number>)
    )
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [normalizedTransactions, t]);

  // ── Monthly income vs expense (last 6 months) ──
  const monthlyChartData = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("hy-AM", { month: "short" });
      months.push({ key, label, income: 0, expense: 0 });
    }
    normalizedTransactions.forEach((tx) => {
      if (!tx.txDate) return;
      const txKey = String(tx.txDate).slice(0, 7);
      const slot = months.find((m) => m.key === txKey);
      if (!slot) return;
      if (isIncome(tx.type))   slot.income  += tx.normalizedAmount;
      if (isExpense(tx.type))  slot.expense += tx.normalizedAmount;
    });
    return months;
  }, [normalizedTransactions]);

  // ── Pie chart data (expense by category) ──
  const PIE_COLORS = ["#3b82f6","#0ea5e9","#8b5cf6","#f59e0b","#ef4444","#10b981","#f97316"];
  const pieData = topExpenseCategories.map((item) => ({ name: item.name, value: item.amount }));

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-left">
          <span className="dashboard-badge">
            👋 {t("dashboard.welcome", { name: currentUser?.name || "User" })}
          </span>
          <h1 className="dashboard-title">{t("dashboard.totalBalance")}</h1>
          <p className="dashboard-subtitle">
            {t(
              "dashboard.dashboardSubtitle",
              "Track your money, activity, and goals in one place."
            )}
          </p>
        </div>

        <div className="dashboard-hero-balance">
          <span>{t("dashboard.totalBalance")}</span>
          <strong>
            {totalBalance.toLocaleString()} {mainCurrency}
          </strong>
        </div>
      </section>

      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">💼</div>
          <div>
            <div className="dashboard-stat-value">
              {totalBalance.toLocaleString()} {mainCurrency}
            </div>
            <div className="dashboard-stat-label">
              {t("dashboard.totalBalance")}
            </div>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">🟢</div>
          <div>
            <div className="dashboard-stat-value">
              {incomeTotal.toLocaleString()} {mainCurrency}
            </div>
            <div className="dashboard-stat-label">{t("dashboard.income")}</div>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">🔴</div>
          <div>
            <div className="dashboard-stat-value">
              {expenseTotal.toLocaleString()} {mainCurrency}
            </div>
            <div className="dashboard-stat-label">{t("dashboard.expense")}</div>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">🎯</div>
          <div>
            <div className="dashboard-stat-value">
              {savingsTotal.toLocaleString()} {mainCurrency}
            </div>
            <div className="dashboard-stat-label">{t("dashboard.savings")}</div>
          </div>
        </div>
      </div>

      <section className="dashboard-panel">
        <div className="dashboard-section-header">
          <div>
            <h3 className="dashboard-section-title">
              ⚡ {t("dashboard.quickActions")}
            </h3>
            <p className="dashboard-section-text">
              {t(
                "dashboard.quickActionsSubtitle",
                "Jump quickly to your most common actions."
              )}
            </p>
          </div>
        </div>

        <div className="dashboard-actions-grid">
          <button type="button" className="dashboard-action-card" onClick={() => navigate("/transactions")}>
            <span className="dashboard-action-icon">💸</span>
            <span>{t("dashboard.addExpense")}</span>
          </button>

          <button type="button" className="dashboard-action-card" onClick={() => navigate("/transactions")}>
            <span className="dashboard-action-icon">💰</span>
            <span>{t("dashboard.addIncome")}</span>
          </button>

          <button type="button" className="dashboard-action-card" onClick={() => navigate("/accounts")}>
            <span className="dashboard-action-icon">🔄</span>
            <span>{t("dashboard.transfer")}</span>
          </button>

          <button type="button" className="dashboard-action-card" onClick={() => navigate("/budgets")}>
            <span className="dashboard-action-icon">📋</span>
            <span>{t("dashboard.createBudget")}</span>
          </button>
        </div>
      </section>

      {/* ── CHARTS ROW ── */}
      <div className="dashboard-main-grid">
        {/* Monthly Income vs Expense Bar Chart */}
        <section className="dashboard-panel">
          <div className="dashboard-section-header">
            <div>
              <h3 className="dashboard-section-title">
                📈 {t("dashboard.cashFlowOverview", "Եկամուտ / Ծախս ըստ ամիսների")}
              </h3>
              <p className="dashboard-section-text">
                {t("dashboard.cashFlowOverviewSubtitle", "Վերջին 6 ամիսների ամփոփ")}
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} width={48} />
              <Tooltip
                formatter={(v: number) => v.toLocaleString() + " " + mainCurrency}
                contentStyle={{ borderRadius: 12, fontSize: 13 }}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="income"  name={t("dashboard.income",  "Եկամուտ")} fill="#22c55e" radius={[6,6,0,0]} />
              <Bar dataKey="expense" name={t("dashboard.expense", "Ծախս")}    fill="#ef4444" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Expense by Category Pie Chart */}
        <section className="dashboard-panel">
          <div className="dashboard-section-header">
            <div>
              <h3 className="dashboard-section-title">
                🧾 {t("dashboard.topCategories", "Ծախսեր ըստ կատեգորիաների")}
              </h3>
              <p className="dashboard-section-text">
                {t("dashboard.topCategoriesSubtitle", "Ծախսերի բաշխում")}
              </p>
            </div>
          </div>
          {pieData.length === 0 ? (
            <div className="dashboard-empty-state small">
              <div className="dashboard-empty-icon">🪄</div>
              <h4>{t("dashboard.noExpenseData", "Ծախսեր չկան")}</h4>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${Math.round((percent ?? 0) * 100)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => v.toLocaleString() + " " + mainCurrency}
                  contentStyle={{ borderRadius: 12, fontSize: 13 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>

      <div className="dashboard-main-grid">
        <section className="dashboard-panel">
          <div className="dashboard-section-header">
            <div>
              <h3 className="dashboard-section-title">
                🕒 {t("dashboard.recentTransactions")}
              </h3>
              <p className="dashboard-section-text">
                {t(
                  "dashboard.recentTransactionsSubtitle",
                  "Your latest financial activity."
                )}
              </p>
            </div>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="dashboard-empty-state small">
              <div className="dashboard-empty-icon">🪄</div>
              <h4>{t("dashboard.noTransactions")}</h4>
            </div>
          ) : (
            <div className="dashboard-list">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="dashboard-list-item">
                  <div className="dashboard-list-item-left">
                    <div className="dashboard-list-icon">
                      {transactionIcons[normalizeType(tx.type)] || "📌"}
                    </div>
                    <div>
                      <div className="dashboard-list-title">
                        {tx.category || t("dashboard.uncategorized")}
                      </div>
                      <div className="dashboard-list-subtitle">
                        {tx.txDate ? tx.txDate.slice(0, 10) : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-list-amount">
                    {normalizeAmount(tx.amount).toLocaleString()}{" "}
                    {tx.currency || mainCurrency}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-section-header">
            <div>
              <h3 className="dashboard-section-title">
                🏦 {t("dashboard.accountsOverview")}
              </h3>
              <p className="dashboard-section-text">
                {t(
                  "dashboard.accountsOverviewSubtitle",
                  "Your account balances at a glance."
                )}
              </p>
            </div>
          </div>

          {accounts.length === 0 ? (
            <div className="dashboard-empty-state small">
              <div className="dashboard-empty-icon">🪄</div>
              <h4>{t("dashboard.noAccounts")}</h4>
            </div>
          ) : (
            <div className="dashboard-list">
              {accounts.slice(0, 5).map((account) => (
                <div key={account.id} className="dashboard-list-item">
                  <div className="dashboard-list-item-left">
                    <div className="dashboard-list-icon">
                      {accountIcons[normalizeType(account.type)] || "💼"}
                    </div>
                    <div>
                      <div className="dashboard-list-title">{account.name}</div>
                      <div className="dashboard-list-subtitle">
                        {account.type || "account"}
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-list-amount">
                    {normalizeAmount(account.balance).toLocaleString()}{" "}
                    {account.currency || mainCurrency}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="dashboard-main-grid">
        <section className="dashboard-panel">
          <div className="dashboard-section-header">
            <div>
              <h3 className="dashboard-section-title">
                🎯 {t("dashboard.goalsProgress")}
              </h3>
              <p className="dashboard-section-text">
                {t(
                  "dashboard.goalsProgressSubtitle",
                  "See how close you are to your savings goals."
                )}
              </p>
            </div>
          </div>

          {preparedGoals.length === 0 ? (
            <div className="dashboard-empty-state small">
              <div className="dashboard-empty-icon">🪄</div>
              <h4>{t("dashboard.noGoals")}</h4>
            </div>
          ) : (
            <div className="dashboard-card-list">
              {preparedGoals.map((goal) => (
                <div key={goal.id} className="dashboard-mini-card">
                  <div className="dashboard-mini-card-top">
                    <h4>{goal.name}</h4>
                    <span>{Math.round(goal.progress)}%</span>
                  </div>

                  <div className="dashboard-progress-track">
                    <div
                      className="dashboard-progress-fill"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>

                  <div className="dashboard-mini-card-meta">
                    <span>
                      {Number(goal.saved).toLocaleString()} {goal.currency}
                    </span>
                    <span>
                      / {Number(goal.target).toLocaleString()} {goal.currency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-section-header">
            <div>
              <h3 className="dashboard-section-title">
                📋 {t("dashboard.budgetSummary")}
              </h3>
              <p className="dashboard-section-text">
                {t(
                  "dashboard.budgetSummarySubtitle",
                  "Monitor how your budgets are being used."
                )}
              </p>
            </div>
          </div>

          {preparedBudgets.length === 0 ? (
            <div className="dashboard-empty-state small">
              <div className="dashboard-empty-icon">🪄</div>
              <h4>{t("dashboard.noBudgets")}</h4>
            </div>
          ) : (
            <div className="dashboard-card-list">
              {preparedBudgets.map((budget) => (
                <div key={budget.id} className="dashboard-mini-card">
                  <div className="dashboard-mini-card-top">
                    <h4>{budget.title}</h4>
                    <span>{Math.round(budget.progress)}%</span>
                  </div>

                  <div className="dashboard-progress-track">
                    <div
                      className={`dashboard-progress-fill ${
                        budget.progress >= 100
                          ? "danger"
                          : budget.progress >= 80
                          ? "warning"
                          : ""
                      }`}
                      style={{ width: `${budget.progress}%` }}
                    />
                  </div>

                  <div className="dashboard-mini-card-meta">
                    <span>
                      {budget.spent.toLocaleString()} {budget.currency}
                    </span>
                    <span>
                      / {budget.limit.toLocaleString()} {budget.currency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}