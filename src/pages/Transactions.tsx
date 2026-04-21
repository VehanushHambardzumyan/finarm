import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../store/StoreProvider";
import { useAppToast } from "../utils/toast";
import { useTranslation } from "react-i18next";
import "./transactions.css";

type TransactionType = "income" | "expense" | "transfer";

type EditableTransaction = {
  id: string;
  txDate: string;
  type: TransactionType;
  amount: number | string;
  currency: string;
  category: string;
  accountId: string;
  toAccountId: string;
  notes: string;
};

const defaultForm: EditableTransaction = {
  id: "",
  txDate: new Date().toISOString().split("T")[0],
  type: "expense",
  amount: "",
  currency: "AMD",
  category: "",
  accountId: "",
  toAccountId: "",
  notes: "",
};

function normalizeDateForInput(value: string) {
  if (!value) return "";
  if (value.includes(".")) {
    const [day, month, year] = value.split(".");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  if (value.includes("T")) {
    return value.slice(0, 10);
  }
  return value;
}

function normalizeType(type?: string): TransactionType {
  const value = String(type ?? "").trim().toLowerCase();
  if (value === "income" || value === "եկամուտ") return "income";
  if (value === "expense" || value === "ծախս") return "expense";
  return "transfer";
}

export default function Transactions() {
  const { t } = useTranslation();
  const useStore = useAppStore();

  const transactions = useStore((s: any) => s.transactions ?? []);
  const accounts = useStore((s: any) => s.accounts ?? []);
  const loadTransactions = useStore((s: any) => s.loadTransactions);
  const loadAccounts = useStore((s: any) => s.loadAccounts);
  const deleteTransaction = useStore((s: any) => s.deleteTransaction);
  const createTransaction =
    useStore((s: any) => s.createTransaction || s.addTransaction);
  const updateTransaction =
    useStore((s: any) => s.updateTransaction || s.editTransaction);

  const { showSuccess, showError } = useAppToast();

  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState<EditableTransaction>(defaultForm);

  useEffect(() => {
    loadTransactions?.();
    loadAccounts?.();
  }, [loadTransactions, loadAccounts]);

  const categories = useMemo(() => {
    const unique = new Set<string>();

    transactions.forEach((tx: any) => {
      if (tx.category && String(tx.category).trim()) {
        unique.add(String(tx.category).trim());
      }
    });

    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx: any) => {
        const txType = normalizeType(tx.type);
        const txDate = normalizeDateForInput(tx.txDate || tx.date || "");
        const txCategory = String(tx.category || "").trim().toLowerCase();
        const query = searchTerm.trim().toLowerCase();

        if (typeFilter !== "all" && txType !== typeFilter) return false;
        if (startDate && new Date(txDate) < new Date(startDate)) return false;
        if (endDate && new Date(txDate) > new Date(endDate)) return false;

        if (
          categoryFilter &&
          txCategory !== categoryFilter.trim().toLowerCase()
        ) {
          return false;
        }

        if (query) {
          const accountName = accounts.find(
            (acc: any) => acc.id === tx.accountId
          )?.name;
          const toAccountName = accounts.find(
            (acc: any) => acc.id === tx.toAccountId
          )?.name;

          const text = [
            tx.category,
            (tx as any).note,
            tx.currency,
            tx.type,
            tx.amount,
            tx.txDate,
            accountName,
            toAccountName,
          ]
            .map((v) => String(v ?? "").toLowerCase())
            .join(" ");

          if (!text.includes(query)) return false;
        }

        return true;
      })
      .slice()
      .sort(
        (a: any, b: any) =>
          new Date(normalizeDateForInput(b.txDate || b.date || "")).getTime() -
          new Date(normalizeDateForInput(a.txDate || a.date || "")).getTime()
      );
  }, [
    transactions,
    accounts,
    typeFilter,
    categoryFilter,
    searchTerm,
    startDate,
    endDate,
  ]);

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((tx: any) => normalizeType(tx.type) === "income")
      .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter((tx: any) => normalizeType(tx.type) === "expense")
      .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
  }, [filteredTransactions]);

  const balance = totalIncome - totalExpense;

  const openAddModal = (type: TransactionType) => {
    setIsEditMode(false);
    setForm({
      ...defaultForm,
      type,
      txDate: new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (tx: any) => {
    setIsEditMode(true);
    const rawDate = normalizeDateForInput(tx.txDate || tx.date || "");
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      ? rawDate
      : new Date().toISOString().split("T")[0];
    setForm({
      id: tx.id,
      txDate: validDate,
      type: normalizeType(tx.type),
      amount: tx.amount,
      currency: tx.currency || "AMD",
      category: tx.category || "",
      accountId: tx.accountId || "",
      toAccountId: tx.toAccountId || "",
      notes: (tx as any).note || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setForm(defaultForm);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      t("transactions.deleteConfirm", "Վստա՞հ եք, որ ուզում եք ջնջել գործարքը։")
    );
    if (!confirmed) return;

    try {
      await deleteTransaction(id);
      showSuccess(t("transactions.deleted", "Գործարքը ջնջվեց"));
    } catch (error: any) {
      showError(
        error?.message ||
          error?.response?.data?.message ||
          t("transactions.deleteError", "Չհաջողվեց ջնջել")
      );
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.amount || !form.txDate) {
      showError(t("transactions.fillRequired", "Լրացրեք պարտադիր դաշտերը"));
      return;
    }

    if (Number(form.amount) <= 0 || Number.isNaN(Number(form.amount))) {
      showError(
        t(
          "transactions.amountInvalid",
          "Գումարը պետք է լինի 0-ից մեծ և վավեր թիվ"
        )
      );
      return;
    }

    if (
      (form.type === "income" || form.type === "expense") &&
      !form.category.trim()
    ) {
      showError(t("transactions.categoryRequired", "Կատեգորիան պարտադիր է"));
      return;
    }

    if (!form.accountId) {
      showError(t("transactions.accountRequired", "Ընտրեք հաշիվը"));
      return;
    }

    if (form.type === "transfer") {
      if (!form.toAccountId) {
        showError(
          t(
            "transactions.transferAccountsRequired",
            "Ընտրեք փոխանցման երկու հաշիվները"
          )
        );
        return;
      }

      if (form.accountId === form.toAccountId) {
        showError(
          t(
            "transactions.transferAccountsDifferent",
            "Փոխանցման հաշիվները պետք է տարբեր լինեն"
          )
        );
        return;
      }
    }

    const payload = {
      type: form.type,
      amount: Number(form.amount),
      currency: form.currency,
      category: form.type === "transfer" ? undefined : form.category,
      txDate: form.txDate,
      accountId: form.accountId,
      toAccountId:
        form.type === "transfer" ? form.toAccountId : undefined,
      note: form.notes || undefined,
    };

    try {
      console.log("SENDING PAYLOAD:", payload);

      if (isEditMode) {
        await updateTransaction(form.id, payload);
        showSuccess(t("transactions.updated", "Թարմացվեց"));
      } else {
        await createTransaction(payload);
        showSuccess(t("transactions.created", "Ավելացվեց"));
      }

      await loadTransactions?.();
      await loadAccounts?.();

      closeModal();
    } catch (error: any) {
      console.error("SAVE TRANSACTION ERROR:", error);
      console.error("SAVE TRANSACTION ERROR MESSAGE:", error?.message);
      showError(
        Array.isArray(error?.message)
          ? error.message.join(", ")
          : error?.response?.data?.message ||
              error?.message ||
              "Չհաջողվեց պահպանել"
      );
    }
  };

  const resetFilters = () => {
    setTypeFilter("all");
    setCategoryFilter("");
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
  };

  const getTypeLabel = (type: string) => {
    const normalized = normalizeType(type);
    if (normalized === "income") return t("transactions.income", "Եկամուտ");
    if (normalized === "expense") return t("transactions.expense", "Ծախս");
    return t("transactions.transfer", "Տրանսֆեր");
  };

  const getTypeIcon = (type: string) => {
    const normalized = normalizeType(type);
    if (normalized === "income") return "💚";
    if (normalized === "expense") return "💸";
    return "🔄";
  };

  const getAccountName = (accountId?: string) => {
    if (!accountId) return "—";
    const account = accounts.find((a: any) => a.id === accountId);
    return account?.name || "—";
  };

  return (
    <div className="transactions-page">
      <div className="transactions-hero">
        <div>
          <span className="transactions-badge">
            💳 {t("transactions.title", "Գործարքներ")}
          </span>
          <h1 className="transactions-title">
            {t("transactions.title", "Գործարքներ")}
          </h1>
          <p className="transactions-subtitle">
            {t(
              "transactions.subtitle",
              "Կառավարեք ձեր եկամուտներն ու ծախսերը մեկ վայրից։"
            )}
          </p>
        </div>

        <div className="transactions-hero-actions">
          <button
            className="transactions-primary-btn"
            onClick={() => openAddModal("income")}
            type="button"
          >
            ➕ {t("transactions.addIncome", "Եկամուտ")}
          </button>

          <button
            className="transactions-dark-btn"
            onClick={() => openAddModal("expense")}
            type="button"
          >
            ➖ {t("transactions.addExpense", "Ծախս")}
          </button>

          <button
            className="transactions-secondary-btn"
            onClick={() => openAddModal("transfer")}
            type="button"
          >
            🔄 {t("transactions.addTransfer", "Փոխանցում")}
          </button>
        </div>
      </div>

      <div className="transactions-summary-grid">
        <div className="transactions-summary-card income">
          <div className="transactions-summary-icon">💚</div>
          <div>
            <span>{t("transactions.income", "Եկամուտ")}</span>
            <strong>+ {totalIncome.toLocaleString()} AMD</strong>
          </div>
        </div>

        <div className="transactions-summary-card expense">
          <div className="transactions-summary-icon">💸</div>
          <div>
            <span>{t("transactions.expense", "Ծախս")}</span>
            <strong>- {totalExpense.toLocaleString()} AMD</strong>
          </div>
        </div>

        <div className="transactions-summary-card balance">
          <div className="transactions-summary-icon">💼</div>
          <div>
            <span>{t("transactions.balance", "Մնացորդ")}</span>
            <strong>{balance.toLocaleString()} AMD</strong>
          </div>
        </div>
      </div>

      <div className="transactions-filter-card">
        <div className="transactions-filter-item">
          <label>{t("transactions.search", "Որոնել")}</label>
          <input
            type="text"
            placeholder={t("transactions.searchPlaceholder", "Որոնել գործարքներ")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="transactions-filter-item">
          <label>{t("transactions.type", "Տեսակ")}</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
          >
            <option value="all">{t("transactions.all", "Բոլորը")}</option>
            <option value="income">{t("transactions.income", "Եկամուտ")}</option>
            <option value="expense">{t("transactions.expense", "Ծախս")}</option>
            <option value="transfer">
              {t("transactions.transfer", "Տրանսֆեր")}
            </option>
          </select>
        </div>

        <div className="transactions-filter-item">
          <label>{t("transactions.category", "Կատեգորիա")}</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">
              {t("transactions.allCategories", "Բոլոր կատեգորիաները")}
            </option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="transactions-filter-item">
          <label>{t("transactions.startDate", "Սկիզբ")}</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="transactions-filter-item">
          <label>{t("transactions.endDate", "Ավարտ")}</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="transactions-filter-actions">
          <button
            className="transactions-secondary-btn"
            onClick={resetFilters}
            type="button"
          >
            {t("transactions.reset", "Reset")}
          </button>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="transactions-empty-state">
          <div className="transactions-empty-icon">🪄</div>
          <h3>{t("transactions.noTransactions", "Գործարքներ չկան")}</h3>
          <p>
            {t(
              "transactions.noTransactionsDescription",
              "Ավելացրեք ձեր առաջին գործարքը"
            )}
          </p>

          <div className="transactions-empty-actions">
            <button
              className="transactions-primary-btn"
              onClick={() => openAddModal("income")}
              type="button"
            >
              ➕ {t("transactions.addIncome", "Եկամուտ")}
            </button>

            <button
              className="transactions-dark-btn"
              onClick={() => openAddModal("expense")}
              type="button"
            >
              ➖ {t("transactions.addExpense", "Ծախս")}
            </button>
          </div>
        </div>
      ) : (
        <div className="transactions-table-wrap">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>{t("transactions.date", "Ամսաթիվ")}</th>
                <th>{t("transactions.category", "Կատեգորիա")}</th>
                <th>{t("transactions.type", "Տեսակ")}</th>
                <th>{t("transactions.account", "Հաշիվ")}</th>
                <th>{t("transactions.amount", "Գումար")}</th>
                <th>{t("transactions.actions", "Գործողություններ")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx: any) => {
                const normalizedType = normalizeType(tx.type);

                return (
                  <tr key={tx.id}>
                    <td>{(() => {
                      const d = normalizeDateForInput(tx.txDate || tx.date || "");
                      return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "—";
                    })()}</td>
                    <td>
                      {tx.category ||
                        t("transactions.uncategorized", "Առանց կատեգորիայի")}
                    </td>
                    <td>
                      <span className={`transactions-type-badge ${normalizedType}`}>
                        {getTypeIcon(normalizedType)} {getTypeLabel(normalizedType)}
                      </span>
                    </td>
                    <td>
                      {normalizedType === "transfer"
                        ? `${getAccountName(tx.accountId)} → ${getAccountName(
                            tx.toAccountId
                          )}`
                        : getAccountName(tx.accountId)}
                    </td>
                    <td
                      className={
                        normalizedType === "income"
                          ? "transactions-amount-income"
                          : normalizedType === "expense"
                          ? "transactions-amount-expense"
                          : "transactions-amount-transfer"
                      }
                    >
                      {normalizedType === "income"
                        ? "+"
                        : normalizedType === "expense"
                        ? "-"
                        : ""}
                      {Number(tx.amount || 0).toLocaleString()} {tx.currency || "AMD"}
                    </td>
                    <td>
                      <div className="transactions-row-actions">
                        <button
                          className="transactions-edit-btn"
                          onClick={() => openEditModal(tx)}
                          type="button"
                        >
                          ✏️ {t("transactions.edit", "Edit")}
                        </button>

                        <button
                          className="transactions-delete-btn"
                          onClick={() => handleDelete(tx.id)}
                          type="button"
                        >
                          🗑️ {t("transactions.delete", "Delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="transactions-modal-overlay">
          <div className="transactions-modal">
            <div className="transactions-modal-header">
              <h3>
                {isEditMode
                  ? t("transactions.editTransaction", "Թարմացնել գործարքը")
                  : t("transactions.newTransaction", "Նոր գործարք")}
              </h3>
              <button
                className="transactions-close-btn"
                onClick={closeModal}
                type="button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="transactions-modal-form">
              <div className="transactions-form-group">
                <label>{t("transactions.date", "Ամսաթիվ")}</label>
                <input
                  type="date"
                  value={form.txDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, txDate: e.target.value }))
                  }
                />
              </div>

              <div className="transactions-form-group">
                <label>{t("transactions.type", "Տեսակ")}</label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      type: e.target.value as TransactionType,
                    }))
                  }
                >
                  <option value="income">{t("transactions.income", "Եկամուտ")}</option>
                  <option value="expense">{t("transactions.expense", "Ծախս")}</option>
                  <option value="transfer">{t("transactions.transfer", "Տրանսֆեր")}</option>
                </select>
              </div>

              <div className="transactions-form-group">
                <label>{t("transactions.account", "Հաշիվ")}</label>
                <select
                  value={form.accountId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, accountId: e.target.value }))
                  }
                >
                  <option value="">
                    {t("transactions.selectAccount", "Ընտրեք հաշիվը")}
                  </option>
                  {accounts.map((account: any) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.currency || "AMD"})
                    </option>
                  ))}
                </select>
              </div>

              {form.type === "transfer" && (
                <div className="transactions-form-group">
                  <label>{t("transactions.toAccount", "Դեպի հաշիվ")}</label>
                  <select
                    value={form.toAccountId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, toAccountId: e.target.value }))
                    }
                  >
                    <option value="">
                      {t("transactions.selectToAccount", "Ընտրեք ստացող հաշիվը")}
                    </option>
                    {accounts
                      .filter((account: any) => account.id !== form.accountId)
                      .map((account: any) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.currency || "AMD"})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="transactions-form-group">
                <label>{t("transactions.amount", "Գումար")}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t("transactions.amountPlaceholder", "Մուտքագրեք գումարը")}
                  value={form.amount}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                />
              </div>

              <div className="transactions-form-group">
                <label>{t("transactions.currency", "Արժույթ")}</label>
                <select
                  value={form.currency}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, currency: e.target.value }))
                  }
                >
                  <option value="AMD">AMD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              {form.type !== "transfer" && (
                <div className="transactions-form-group full">
                  <label>{t("transactions.category", "Կատեգորիա")}</label>
                  <input
                    placeholder={t(
                      "transactions.categoryPlaceholder",
                      "Օր. Սնունդ, Տրանսպորտ, Աշխատավարձ"
                    )}
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, category: e.target.value }))
                    }
                  />
                </div>
              )}

              <div className="transactions-form-group full">
                <label>{t("transactions.notes", "Նշում")}</label>
                <textarea
                  placeholder={t("transactions.notesPlaceholder", "Լրացուցիչ նշում")}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                />
              </div>

              <div className="transactions-modal-actions">
                <button
                  type="button"
                  className="transactions-secondary-btn"
                  onClick={closeModal}
                >
                  {t("transactions.close", "Փակել")}
                </button>

                <button type="submit" className="transactions-primary-btn">
                  {isEditMode
                    ? t("transactions.update", "Թարմացնել")
                    : t("transactions.save", "Պահպանել")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}