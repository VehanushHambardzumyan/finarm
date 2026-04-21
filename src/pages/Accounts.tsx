import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useAppStore } from "../store/StoreProvider";
import { useTranslation } from "react-i18next";
import { useAppToast } from "../utils/toast";
import type { AccountType, Currency } from "../domain/types";
import "./accounts.css";

type AccountFormData = {
  name: string;
  type: AccountType;
  balance: string | number;
  currency: Currency;
  creditLimit?: string | number;
};

export default function Accounts() {
  const { t } = useTranslation();
  const useStore = useAppStore();
  const { showSuccess, showError } = useAppToast();

  const accounts        = useStore((s: any) => s.accounts ?? []);
  const loadAccounts    = useStore((s: any) => s.loadAccounts);
  const createAccount   = useStore((s: any) => s.createAccount);
  const updateAccount   = useStore((s: any) => s.updateAccount);
  const deleteAccount   = useStore((s: any) => s.deleteAccount);
  const archiveAccount   = useStore((s: any) => s.archiveAccount);
  const unarchiveAccount = useStore((s: any) => s.unarchiveAccount);
  const createTransaction = useStore((s: any) => s.createTransaction);

  const accountMeta = useMemo(() => ({
    cash:    { icon: "💵", label: t("accounts.cashWallet"),    accentClass: "cash" },
    bank:    { icon: "🏦", label: t("accounts.bankAccount"),   accentClass: "bank" },
    card:    { icon: "💳", label: t("accounts.debitCard"),     accentClass: "card" },
    savings: { icon: "🏆", label: t("accounts.savingsAccount"), accentClass: "savings" },
    credit:  { icon: "🧾", label: t("accounts.creditCard"),    accentClass: "credit" },
  }), [t]);

  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm<AccountFormData>({
    defaultValues: { name: "", type: "cash", balance: "", currency: "AMD", creditLimit: "" },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    watch: watchEdit,
  } = useForm<AccountFormData>({
    defaultValues: { name: "", type: "cash", balance: "", currency: "AMD", creditLimit: "" },
  });

  const {
    register: registerTransfer,
    handleSubmit: handleSubmitTransfer,
    reset: resetTransfer,
  } = useForm<{ fromId: string; toId: string; amount: string }>({
    defaultValues: { fromId: "", toId: "", amount: "" },
  });

  useEffect(() => {
    loadAccounts?.();
  }, [loadAccounts]);

  const selectedType    = watch("type");
  const editType        = watchEdit("type");

  const activeAccounts   = accounts.filter((a: any) => !a.isArchived);
  const archivedAccounts = accounts.filter((a: any) => a.isArchived);

  const totalByCurrency = activeAccounts.reduce((acc: Record<string, number>, a: any) => {
    const c = a.currency || "AMD";
    acc[c] = (acc[c] || 0) + Number(a.balance || 0);
    return acc;
  }, {} as Record<string, number>);

  const mainCurrency = Object.entries(totalByCurrency).sort((a, b) => b[1] - a[1])[0]?.[0] || "AMD";
  const mainBalance  = totalByCurrency[mainCurrency] || 0;

  const onAddAccount = async (data: AccountFormData) => {
    try {
      await createAccount({
        name: data.name,
        type: data.type,
        balance: Number(data.balance) || 0,
        currency: data.currency,
        creditLimit: data.type === "credit" ? Number(data.creditLimit) || 0 : undefined,
        isArchived: false,
      });
      reset();
      showSuccess(t("accounts.created", "Հաշիվն ավելացվեց"));
    } catch (e: any) {
      showError(e?.message || t("accounts.createError", "Չհաջողվեց ավելացնել"));
    }
  };

  const openEdit = (account: any) => {
    setEditingAccount(account);
    resetEdit({
      name:        account.name,
      type:        account.type,
      balance:     account.balance,
      currency:    account.currency,
      creditLimit: account.creditLimit ?? "",
    });
  };

  const onEditAccount = async (data: AccountFormData) => {
    if (!editingAccount) return;
    try {
      await updateAccount(editingAccount.id, {
        name:        data.name,
        type:        data.type,
        currency:    data.currency,
        balance:     Number(data.balance),
        creditLimit: data.type === "credit" ? Number(data.creditLimit) || 0 : undefined,
      });
      setEditingAccount(null);
      showSuccess(t("accounts.updated", "Փոփոխությունները պահպանվեցին"));
    } catch (e: any) {
      showError(e?.message || t("accounts.updateError", "Չհաջողվեց պահպանել"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("accounts.deleteConfirm", "Վստա՞հ եք, որ ուզում եք ջնջել հաշիվը"))) return;
    try {
      await deleteAccount(id);
      showSuccess(t("accounts.deleted", "Հաշիվը ջնջվեց"));
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("linked transactions")) {
        showError(t("accounts.deleteHasTransactions", "Cannot delete account with linked transactions. Archive it instead."));
      } else {
        showError(msg || t("accounts.deleteError", "Չհաջողվեց ջնջել"));
      }
    }
  };

  const handleArchive = async (account: any) => {
    try {
      if (account.isArchived) {
        await unarchiveAccount(account.id);
        showSuccess(t("accounts.unarchived", "Հաշիվը վերականգնվեց"));
      } else {
        await archiveAccount(account.id);
        showSuccess(t("accounts.archived", "Հաշիվը արխիվացվեց"));
      }
    } catch (e: any) {
      showError(e?.message || t("accounts.archiveError", "Չհաջողվեց"));
    }
  };

  const onTransfer = async (data: { fromId: string; toId: string; amount: string }) => {
    if (!data.fromId || !data.toId || data.fromId === data.toId || !data.amount) {
      showError(t("accounts.transferError", "Սխալ տվյալներ"));
      return;
    }
    const fromAccount = accounts.find((a: any) => a.id === data.fromId);
    try {
      await createTransaction({
        type: "transfer",
        accountId: data.fromId,
        toAccountId: data.toId,
        amount: Number(data.amount),
        currency: fromAccount?.currency || "AMD",
        txDate: new Date().toISOString().slice(0, 10),
        note: t("accounts.transfer"),
      });
      resetTransfer();
      setShowTransferModal(false);
      showSuccess(t("accounts.transferSuccess", "Փոխանցումը կատարվեց"));
    } catch (e: any) {
      showError(e?.message || t("accounts.transferFailed", "Չհաջողվեց"));
    }
  };

  return (
    <div className="accounts-page">
      {/* HERO */}
      <div className="accounts-hero">
        <div>
          <p className="accounts-eyebrow">💼 {t("accounts.title", "Հաշիվներ")}</p>
          <h2 className="accounts-title">{t("accounts.title", "Հաշիվներ")}</h2>
          <p className="accounts-subtitle">{t("accounts.subtitle", "Կառավարեք ձեր ֆինանսական հաշիվները")}</p>
        </div>
        <div className="accounts-hero-actions">
          <button
            type="button"
            className="accounts-secondary-btn"
            onClick={() => setShowTransferModal(true)}
            disabled={activeAccounts.length < 2}
            title={activeAccounts.length < 2 ? t("accounts.transferNeedTwo", "Փոխանցման համար անհրաժեշտ է առնվազն 2 հաշիվ") : ""}
          >
            🔄 {t("accounts.transfer", "Փոխանցում")}
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="accounts-stats-grid">
        <div className="accounts-stat-card">
          <div className="accounts-stat-icon">📦</div>
          <div>
            <div className="accounts-stat-value">{activeAccounts.length}</div>
            <div className="accounts-stat-label">{t("accounts.totalAccounts", "Ակտիվ հաշիվներ")}</div>
          </div>
        </div>
        <div className="accounts-stat-card">
          <div className="accounts-stat-icon">💰</div>
          <div>
            <div className="accounts-stat-value">{Number(mainBalance).toLocaleString()} {mainCurrency}</div>
            <div className="accounts-stat-label">{t("accounts.balance", "Ընդհանուր մնացորդ")}</div>
          </div>
        </div>
        <div className="accounts-stat-card">
          <div className="accounts-stat-icon">🗄️</div>
          <div>
            <div className="accounts-stat-value">{archivedAccounts.length}</div>
            <div className="accounts-stat-label">{t("accounts.archived", "Արխիվ")}</div>
          </div>
        </div>
      </div>

      {/* ADD ACCOUNT */}
      <section className="accounts-form-panel">
        <h3 className="accounts-form-title">➕ {t("accounts.addAccount", "Ավելացնել հաշիվ")}</h3>
        <form onSubmit={handleSubmit(onAddAccount)} className="accounts-form">
          <div className="accounts-form-group">
            <label>{t("accounts.name", "Անվանում")}</label>
            <input placeholder={t("accounts.namePlaceholder", "Իմ հաշիվ")} {...register("name", { required: true })} />
          </div>
          <div className="accounts-form-group">
            <label>{t("accounts.type", "Տեսակ")}</label>
            <select {...register("type")}>
              {(Object.keys(accountMeta) as AccountType[]).map((k) => (
                <option key={k} value={k}>{accountMeta[k].icon} {accountMeta[k].label}</option>
              ))}
            </select>
          </div>
          <div className="accounts-form-group">
            <label>{t("accounts.initialBalance", "Մնացորդ")}</label>
            <input type="number" placeholder="0" {...register("balance")} />
          </div>
          <div className="accounts-form-group">
            <label>{t("accounts.currency", "Արժույթ")}</label>
            <select {...register("currency")}>
              <option value="AMD">AMD</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          {selectedType === "credit" && (
            <div className="accounts-form-group">
              <label>{t("accounts.creditLimit", "Վարկային սահման")}</label>
              <input type="number" placeholder="0" {...register("creditLimit")} />
            </div>
          )}
          <button type="submit" className="accounts-primary-btn">
            {t("accounts.add", "Ավելացնել")}
          </button>
        </form>
      </section>

      {/* ACTIVE ACCOUNTS LIST */}
      <section className="accounts-section">
        <h3 className="accounts-section-title">🏦 {t("accounts.yourAccounts", "Ձեր հաշիվները")}</h3>
        {activeAccounts.length === 0 ? (
          <div className="accounts-empty">
            <div>🪄</div>
            <p>{t("accounts.noAccounts", "Հաշիվներ չկան")}</p>
          </div>
        ) : (
          <div className="accounts-cards-grid">
            {activeAccounts.map((a: any) => {
              const meta = accountMeta[a.type as AccountType] || accountMeta.cash;
              return (
                <div key={a.id} className={`accounts-card ${meta.accentClass}`}>
                  <div className="accounts-card-top">{meta.icon}</div>
                  <div className="accounts-card-body">
                    <h4>{a.name}</h4>
                    <p className="accounts-card-type">{meta.label}</p>
                    <p className="accounts-card-balance">
                      {Number(a.balance).toLocaleString()} {a.currency}
                    </p>
                    {a.creditLimit != null && Number(a.creditLimit) > 0 && (
                      <p className="accounts-card-credit">
                        {t("accounts.limit", "Limit")}: {Number(a.creditLimit).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="accounts-card-actions">
                    <button
                      type="button"
                      className="accounts-edit-btn"
                      onClick={() => openEdit(a)}
                    >
                      ✏️ {t("accounts.edit", "Խմբ.")}
                    </button>
                    <button
                      type="button"
                      className="accounts-archive-btn"
                      onClick={() => handleArchive(a)}
                    >
                      📦 {t("accounts.archive", "Արխիվ")}
                    </button>
                    <button
                      type="button"
                      className="accounts-delete-btn"
                      onClick={() => handleDelete(a.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* TRANSFER SECTION */}
      <section className="accounts-transfer-section">
        <h3 className="accounts-section-title">🔄 {t("accounts.transfer", "Փոխանցում հաշիվների միջև")}</h3>
        {activeAccounts.length < 2 ? (
          <div className="accounts-transfer-hint">
            <span>ℹ️</span>
            <p>{t("accounts.transferNeedTwo", "Փոխանցման համար անհրաժեշտ է առնվազն 2 ակտիվ հաշիվ")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmitTransfer(onTransfer)} className="accounts-transfer-form">
            <div className="accounts-transfer-row">
              <div className="accounts-form-group">
                <label>{t("accounts.from", "Ումից")}</label>
                <select {...registerTransfer("fromId", { required: true })}>
                  <option value="">{t("accounts.selectAccount", "Ընտրեք")}</option>
                  {activeAccounts.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {Number(a.balance).toLocaleString()} {a.currency}
                    </option>
                  ))}
                </select>
              </div>

              <div className="accounts-transfer-arrow">→</div>

              <div className="accounts-form-group">
                <label>{t("accounts.to", "Ումին")}</label>
                <select {...registerTransfer("toId", { required: true })}>
                  <option value="">{t("accounts.selectAccount", "Ընտրեք")}</option>
                  {activeAccounts.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {Number(a.balance).toLocaleString()} {a.currency}
                    </option>
                  ))}
                </select>
              </div>

              <div className="accounts-form-group">
                <label>{t("accounts.amount", "Գումար")}</label>
                <input
                  type="number"
                  min="1"
                  placeholder="0"
                  {...registerTransfer("amount", { required: true })}
                />
              </div>

              <button type="submit" className="accounts-primary-btn accounts-transfer-btn">
                🔄 {t("accounts.transfer", "Փոխանցել")}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ARCHIVED ACCOUNTS */}
      {archivedAccounts.length > 0 && (
        <section className="accounts-section">
          <button
            type="button"
            className="accounts-toggle-archived"
            onClick={() => setShowArchived((v) => !v)}
          >
            🗄️ {t("accounts.archivedAccounts", "Արխիվ")} ({archivedAccounts.length}){" "}
            {showArchived ? "▲" : "▼"}
          </button>
          {showArchived && (
            <div className="accounts-cards-grid accounts-archived">
              {archivedAccounts.map((a: any) => {
                const meta = accountMeta[a.type as AccountType] || accountMeta.cash;
                return (
                  <div key={a.id} className={`accounts-card ${meta.accentClass} archived`}>
                    <div className="accounts-card-top">{meta.icon}</div>
                    <div className="accounts-card-body">
                      <h4>{a.name}</h4>
                      <p className="accounts-card-type">{meta.label}</p>
                      <p className="accounts-card-balance">
                        {Number(a.balance).toLocaleString()} {a.currency}
                      </p>
                    </div>
                    <div className="accounts-card-actions">
                      <button
                        type="button"
                        className="accounts-archive-btn"
                        onClick={() => handleArchive(a)}
                      >
                        ♻️ {t("accounts.unarchive", "Վերականգնել")}
                      </button>
                      <button
                        type="button"
                        className="accounts-delete-btn"
                        onClick={() => handleDelete(a.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* EDIT MODAL */}
      {editingAccount && (
        <div className="accounts-modal-overlay" onClick={() => setEditingAccount(null)}>
          <div className="accounts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="accounts-modal-header">
              <h3>{t("accounts.editAccount", "Խմբագրել հաշիվը")}</h3>
              <button type="button" className="accounts-close-btn" onClick={() => setEditingAccount(null)}>×</button>
            </div>
            <form onSubmit={handleSubmitEdit(onEditAccount)} className="accounts-form">
              <div className="accounts-form-group">
                <label>{t("accounts.name", "Անվանում")}</label>
                <input {...registerEdit("name", { required: true })} />
              </div>
              <div className="accounts-form-group">
                <label>{t("accounts.type", "Տեսակ")}</label>
                <select {...registerEdit("type")}>
                  {(Object.keys(accountMeta) as AccountType[]).map((k) => (
                    <option key={k} value={k}>{accountMeta[k].icon} {accountMeta[k].label}</option>
                  ))}
                </select>
              </div>
              <div className="accounts-form-group">
                <label>{t("accounts.balance", "Մնացորդ")}</label>
                <input type="number" {...registerEdit("balance")} />
              </div>
              <div className="accounts-form-group">
                <label>{t("accounts.currency", "Արժույթ")}</label>
                <select {...registerEdit("currency")}>
                  <option value="AMD">AMD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              {editType === "credit" && (
                <div className="accounts-form-group">
                  <label>{t("accounts.creditLimit", "Վարկային սահման")}</label>
                  <input type="number" {...registerEdit("creditLimit")} />
                </div>
              )}
              <div className="accounts-modal-actions">
                <button type="button" className="accounts-secondary-btn" onClick={() => setEditingAccount(null)}>
                  {t("accounts.cancel", "Չեղարկել")}
                </button>
                <button type="submit" className="accounts-primary-btn">
                  {t("accounts.save", "Պահպանել")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {showTransferModal && (
        <div className="accounts-modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="accounts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="accounts-modal-header">
              <h3>🔄 {t("accounts.transfer", "Փոխանցում")}</h3>
              <button type="button" className="accounts-close-btn" onClick={() => setShowTransferModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitTransfer(onTransfer)} className="accounts-form">
              <div className="accounts-form-group">
                <label>{t("accounts.from", "Ումից")}</label>
                <select {...registerTransfer("fromId", { required: true })}>
                  <option value="">{t("accounts.selectAccount", "Ընտրեք")}</option>
                  {activeAccounts.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {Number(a.balance).toLocaleString()} {a.currency}
                    </option>
                  ))}
                </select>
              </div>
              <div className="accounts-form-group">
                <label>{t("accounts.to", "Ումին")}</label>
                <select {...registerTransfer("toId", { required: true })}>
                  <option value="">{t("accounts.selectAccount", "Ընտրեք")}</option>
                  {activeAccounts.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {Number(a.balance).toLocaleString()} {a.currency}
                    </option>
                  ))}
                </select>
              </div>
              <div className="accounts-form-group">
                <label>{t("accounts.amount", "Գումար")}</label>
                <input type="number" min="1" placeholder="0" {...registerTransfer("amount", { required: true })} />
              </div>
              <div className="accounts-modal-actions">
                <button type="button" className="accounts-secondary-btn" onClick={() => setShowTransferModal(false)}>
                  {t("accounts.cancel", "Չեղարկել")}
                </button>
                <button type="submit" className="accounts-primary-btn">
                  {t("accounts.transfer", "Փոխանցել")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
