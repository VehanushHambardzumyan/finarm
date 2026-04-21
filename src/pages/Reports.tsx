import { useMemo, useState } from "react";
import { useAppStore } from "../store/StoreProvider";
import { useTranslation } from "react-i18next";
import "./Reports.css";

type TransactionItem = {
  id?: string | number;
  type?: string;
  amount?: number | string;
  category?: string;
  txDate?: string;
  note?: string;
  currency?: string;
  title?: string;
  description?: string;
};

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getFirstDayOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

function normalizeDate(value?: string) {
  if (!value) return null;

  if (value.includes("T")) {
    return value.slice(0, 10);
  }

  if (value.includes(".")) {
    const [day, month, year] = value.split(".");
    if (!day || !month || !year) return null;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return value;
}

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

function getTransactionCategory(
  tx: TransactionItem,
  uncategorizedLabel: string
) {
  const raw = tx.category || tx.title || tx.description || tx.note || "";
  const cleaned = String(raw).trim();
  return cleaned || uncategorizedLabel;
}

export default function Reports() {
  const { t } = useTranslation();
  const useStore = useAppStore();

  const transactions = useStore((s) => s.transactions ?? []);
  const accounts = useStore((s) => s.accounts ?? []);

  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [distributionType, setDistributionType] = useState<"expense" | "income">("expense");

  const filteredTransactions = useMemo(() => {
    return (transactions as TransactionItem[]).filter((tx) => {
      const txDate = normalizeDate(tx.txDate);
      if (!txDate) return false;

      const validType = isIncome(tx.type) || isExpense(tx.type);
      if (!validType) return false;

      return txDate >= startDate && txDate <= endDate;
    });
  }, [transactions, startDate, endDate]);

  const incomeTransactions = useMemo(() => {
    return filteredTransactions.filter((tx) => isIncome(tx.type));
  }, [filteredTransactions]);

  const expenseTransactions = useMemo(() => {
    return filteredTransactions.filter((tx) => isExpense(tx.type));
  }, [filteredTransactions]);

  const totalIncome = useMemo(() => {
    return incomeTransactions.reduce(
      (sum, tx) => sum + Number(tx.amount ?? 0),
      0
    );
  }, [incomeTransactions]);

  const totalExpense = useMemo(() => {
    return expenseTransactions.reduce(
      (sum, tx) => sum + Number(tx.amount ?? 0),
      0
    );
  }, [expenseTransactions]);

  const balance = totalIncome - totalExpense;

  const sourceTransactions = useMemo(() => {
    return distributionType === "income"
      ? incomeTransactions
      : expenseTransactions;
  }, [distributionType, incomeTransactions, expenseTransactions]);

  const categoryDistribution = useMemo(() => {
    const grouped: Record<string, number> = {};

    sourceTransactions.forEach((tx) => {
      const category = getTransactionCategory(tx, t("reports.uncategorized"));
      grouped[category] = (grouped[category] || 0) + Number(tx.amount ?? 0);
    });

    return Object.entries(grouped)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [sourceTransactions, t]);

  const selectedCategoryTransactions = useMemo(() => {
    if (!selectedCategory) return [];

    return sourceTransactions.filter((tx) => {
      const category = getTransactionCategory(tx, t("reports.uncategorized"));
      return category === selectedCategory;
    });
  }, [sourceTransactions, selectedCategory, t]);

  const hasData = filteredTransactions.length > 0;

  const maxValue = Math.max(totalIncome, totalExpense, 1);
  const incomePercent = Math.round((totalIncome / maxValue) * 100);
  const expensePercent = Math.round((totalExpense / maxValue) * 100);

  const distributionTotal =
    distributionType === "income" ? totalIncome : totalExpense;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US").format(amount);
  };

  const exportCSV = () => {
    if (!startDate || !endDate) {
      alert(t("reports.exportPeriodRequired"));
      return;
    }

    const rows = [
      [
        t("reports.date"),
        t("reports.type"),
        t("reports.category"),
        t("reports.amount"),
        t("reports.currency"),
        t("reports.notes"),
      ],
      ...filteredTransactions.map((tx) => [
        normalizeDate(tx.txDate) || "",
        tx.type || "",
        getTransactionCategory(tx, t("reports.uncategorized")),
        String(tx.amount ?? 0),
        tx.currency || "",
        tx.note || "",
      ]),
    ];

    const csvContent = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `reports_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    if (!startDate || !endDate) {
      alert(t("reports.exportPeriodRequired"));
      return;
    }

    window.print();
  };

  return (
    <div className="reports-page">
      <div className="reports-hero">
        <div>
          <span className="reports-badge">📊 {t("reports.title")}</span>
          <h2 className="reports-title">{t("reports.title")}</h2>
          <p className="reports-subtitle">{t("reports.incomeVsExpense")}</p>
        </div>

        <div className="reports-actions">
          <button
            className="reports-secondary-btn"
            onClick={exportCSV}
            type="button"
          >
            📄 {t("reports.exportCsv")}
          </button>
          <button
            className="reports-primary-btn"
            onClick={exportPDF}
            type="button"
          >
            🖨️ {t("reports.exportPdf")}
          </button>
        </div>
      </div>

      <div className="reports-filter-card">
        <div className="reports-filter-group">
          <label>{t("reports.periodStart")}</label>
          <input
            type="date"
            className="reports-input"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setSelectedCategory(null);
            }}
          />
        </div>

        <div className="reports-filter-group">
          <label>{t("reports.periodEnd")}</label>
          <input
            type="date"
            className="reports-input"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setSelectedCategory(null);
            }}
          />
        </div>

        <div className="reports-filter-info">
          <span>📅 {t("reports.selectedRange")}</span>
          <strong>
            {startDate} — {endDate}
          </strong>
        </div>
      </div>

      {!hasData ? (
        <div className="reports-empty">
          <div className="reports-empty-icon">📭</div>
          <h3>{t("reports.noData")}</h3>
          <p>{t("reports.noDataDescription")}</p>
        </div>
      ) : (
        <>
          <div className="reports-stats-grid">
            <div className="report-stat-card income">
              <div className="report-stat-icon">💚</div>
              <div>
                <span className="report-stat-label">{t("reports.income")}</span>
                <strong className="report-stat-value">
                  {formatMoney(totalIncome)}
                </strong>
              </div>
            </div>

            <div className="report-stat-card expense">
              <div className="report-stat-icon">💸</div>
              <div>
                <span className="report-stat-label">{t("reports.expense")}</span>
                <strong className="report-stat-value">
                  {formatMoney(totalExpense)}
                </strong>
              </div>
            </div>

            <div className="report-stat-card balance">
              <div className="report-stat-icon">💼</div>
              <div>
                <span className="report-stat-label">{t("reports.balance")}</span>
                <strong className="report-stat-value">
                  {formatMoney(balance)}
                </strong>
              </div>
            </div>

            <div className="report-stat-card accounts">
              <div className="report-stat-icon">🏦</div>
              <div>
                <span className="report-stat-label">{t("reports.accounts")}</span>
                <strong className="report-stat-value">{accounts.length}</strong>
              </div>
            </div>
          </div>

          <div className="reports-card">
            <div className="reports-card-header">
              <h3>📈 {t("reports.incomeVsExpenseBlock")}</h3>
              <span className="reports-card-note">
                {startDate} — {endDate}
              </span>
            </div>

            <div className="comparison-list">
              <div className="comparison-item">
                <div className="comparison-row">
                  <strong>{t("reports.income")}</strong>
                  <span>{formatMoney(totalIncome)}</span>
                </div>
                <div className="comparison-bar income">
                  <div
                    className="comparison-bar-fill"
                    style={{ width: `${incomePercent}%` }}
                  />
                </div>
              </div>

              <div className="comparison-item">
                <div className="comparison-row">
                  <strong>{t("reports.expense")}</strong>
                  <span>{formatMoney(totalExpense)}</span>
                </div>
                <div className="comparison-bar expense">
                  <div
                    className="comparison-bar-fill"
                    style={{ width: `${expensePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="reports-sections-grid">
            <div className="reports-card">
              <div className="reports-card-header">
                <h3>🧾 {t("reports.categoryDistribution")}</h3>
                <span className="reports-card-note">
                  {t("reports.clickCategory")}
                </span>
              </div>

              <div className="distribution-switcher">
                <button
                  className={distributionType === "expense" ? "active" : ""}
                  onClick={() => {
                    setDistributionType("expense");
                    setSelectedCategory(null);
                  }}
                  type="button"
                >
                  💸 {t("reports.expense")}
                </button>

                <button
                  className={distributionType === "income" ? "active" : ""}
                  onClick={() => {
                    setDistributionType("income");
                    setSelectedCategory(null);
                  }}
                  type="button"
                >
                  💚 {t("reports.income")}
                </button>
              </div>

              <div className="category-list">
                {categoryDistribution.length === 0 ? (
                  <div className="mini-empty">
                    {distributionType === "expense"
                      ? t("reports.noExpenseCategories")
                      : t("reports.noIncomeCategories")}
                  </div>
                ) : (
                  categoryDistribution.map((item) => {
                    const percent =
                      distributionTotal > 0
                        ? Math.round((item.amount / distributionTotal) * 100)
                        : 0;

                    return (
                      <button
                        key={item.category}
                        className={`category-item ${
                          selectedCategory === item.category ? "active" : ""
                        }`}
                        onClick={() =>
                          setSelectedCategory(
                            selectedCategory === item.category
                              ? null
                              : item.category
                          )
                        }
                        type="button"
                      >
                        <div className="category-item-top">
                          <strong>{item.category}</strong>
                          <span>{formatMoney(item.amount)}</span>
                        </div>

                        <div className="category-bar">
                          <div
                            className="category-bar-fill"
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <div className="category-item-bottom">
                          <small>
                            {percent}% {t("reports.distributionTotal")}
                          </small>
                          <small>🔍 {t("reports.details")}</small>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="reports-card">
              <div className="reports-card-header">
                <h3>📂 {t("reports.drillDown")}</h3>
                <span className="reports-card-note">
                  {selectedCategory
                    ? `${t("reports.categoryLabel")}: ${selectedCategory}`
                    : t("reports.selectCategory")}
                </span>
              </div>

              {!selectedCategory ? (
                <div className="mini-empty">{t("reports.drillDownHint")}</div>
              ) : selectedCategoryTransactions.length === 0 ? (
                <div className="mini-empty">
                  {t("reports.noCategoryTransactions")}
                </div>
              ) : (
                <div className="drilldown-list">
                  {selectedCategoryTransactions.map((tx, index) => (
                    <div
                      key={tx.id || `${tx.txDate}-${index}`}
                      className="drilldown-item"
                    >
                      <div>
                        <strong>
                          {getTransactionCategory(
                            tx,
                            t("reports.uncategorized")
                          )}
                        </strong>
                        <p>
                          {normalizeDate(tx.txDate) || "—"}
                          {tx.note ? ` • ${tx.note}` : ""}
                        </p>
                      </div>

                      <span
                        className={`drilldown-amount ${
                          isIncome(tx.type) ? "income" : "expense"
                        }`}
                      >
                        {isIncome(tx.type) ? "+" : "-"}
                        {formatMoney(Number(tx.amount ?? 0))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="reports-card">
            <div className="reports-card-header">
              <h3>📋 {t("reports.overviewList")}</h3>
              <span className="reports-card-note">
                {t("reports.transactionsCount")}: {filteredTransactions.length}
              </span>
            </div>

            <div className="reports-table">
              <div className="reports-table-head">
                <span>{t("reports.date")}</span>
                <span>{t("reports.type")}</span>
                <span>{t("reports.category")}</span>
                <span>{t("reports.amount")}</span>
              </div>

              {filteredTransactions.map((tx, index) => (
                <div
                  className="reports-table-row"
                  key={tx.id || `${tx.txDate}-${index}`}
                >
                  <span>{normalizeDate(tx.txDate) || "—"}</span>
                  <span>{tx.type || "—"}</span>
                  <span>
                    {getTransactionCategory(tx, t("reports.uncategorized"))}
                  </span>
                  <strong>{formatMoney(Number(tx.amount ?? 0))}</strong>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}