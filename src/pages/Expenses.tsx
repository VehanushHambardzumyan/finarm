import { useForm } from "react-hook-form";
import { useAppStore } from "../store/StoreProvider";
import { useTranslation } from "react-i18next";
import styles from "../styles/forms.module.css";
import { useAppToast } from "../utils/toast";

const categories = ["food", "transport", "utilities", "entertainment", "others"];

export default function Expenses() {
  const { t } = useTranslation();
  const useStore = useAppStore();
  const user = useStore((s: any) => s.currentUser);
  const accounts = useStore((s: any) => s.accounts ?? []);
  const transactions = useStore((s: any) => s.transactions ?? []);
  const createTransaction = useStore((s: any) => s.createTransaction || s.addTransaction);
  const { register, handleSubmit, formState, reset } = useForm();
  const { showSuccess, showError } = useAppToast();

  if (!user) return null;

  const onSubmit = async (data: any) => {
    const payload = {
      accountId: String(data.accountId),
      type: "expense" as const,
      amount: Number(data.amount),
      currency: data.currency || "AMD",
      category: data.category || undefined,
      txDate: data.date ? new Date(data.date).toISOString() : undefined,
      note: data.notes?.trim() || undefined,
    };

    console.log("Submit clicked");
    console.log("Expense payload:", payload);

    try {
      await createTransaction(payload as any);
      showSuccess(t("expenses.saved"));
      reset();
    } catch (error) {
      console.error("Failed to save expense:", error);
      showError(t("expenses.blocked"));
    }
  };

  return (
    <div>
      <h2>{t("expenses.quickAdd")}</h2>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <select className={styles.input} {...register("accountId", { required: true })}>
          <option value="">{t("expenses.selectAccount")}</option>
          {accounts.map((a: any) => (
            <option key={a.id} value={a.id}>
              {a.name} ({Number(a.balance ?? 0).toLocaleString()})
            </option>
          ))}
        </select>

        <input
          className={styles.input}
          type="number"
          step="0.01"
          placeholder={t("expenses.amount")}
          {...register("amount", { required: true, min: 0.01 })}
        />

        <select className={styles.input} {...register("category")}>
          <option value="">{t("expenses.selectCategory") || "Ընտրել կատեգորիա"}</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {t(`expenses.${c}`) || c}
            </option>
          ))}
        </select>

        <textarea
          className={styles.input}
          placeholder={t("transactions.notes")}
          {...register("notes")}
        />

        <button className={styles.btn} type="submit">
          {t("common.add")}
        </button>

        {Object.keys(formState.errors).length > 0 && (
          <div className={styles.error}>{JSON.stringify(formState.errors)}</div>
        )}
      </form>

      <h3>{t("transactions.title")}</h3>
      <ul>
        {transactions
          .filter((tx: any) => tx.type === "expense")
          .map((tx: any) => (
            <li key={tx.id}>
              {tx.txDate?.slice(0, 10)} • {tx.category} • {tx.amount} {tx.currency}
            </li>
          ))}
      </ul>
    </div>
  );
}