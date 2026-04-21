import { useForm } from "react-hook-form";
import { useAppStore } from "../store/StoreProvider";
import { currencies, type Currency, type IncomeSource } from "../domain/types";
import { useTranslation } from "react-i18next";
import styles from "../styles/forms.module.css";

type IncomeFormValues = {
  name: string;
  amount: string;
  currency: Currency;
  frequency: string;
  active: boolean;
};

export default function Income() {
  const { t } = useTranslation();
  const useStore = useAppStore();

  const incomeSources = useStore((state) => state.incomeSources);
  const createIncomeSource = useStore((state) => state.createIncomeSource);
  const isLoadingIncomeSources = useStore((state) => state.isLoadingIncomeSources);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IncomeFormValues>({
    defaultValues: {
      name: "",
      amount: "",
      currency: "AMD",
      frequency: "",
      active: true,
    },
  });

  const onSubmit = async (data: IncomeFormValues) => {
    const amount = Number(data.amount);

    if (!Number.isFinite(amount) || amount <= 0) return;

    await createIncomeSource({
      name: data.name.trim(),
      amount,
      currency: data.currency,
      recurring: data.frequency.trim().length > 0,
    });

    reset();
  };

  return (
    <div>
      <h2>{t("income.addIncome")}</h2>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <input
          className={styles.input}
          placeholder={t("income.source")}
          {...register("name", { required: true })}
        />

        <input
          className={styles.input}
          type="number"
          step="0.01"
          placeholder={t("income.amount")}
          {...register("amount", { required: true })}
        />

        <select className={styles.input} {...register("currency")}>
          {currencies.map((cur) => (
            <option key={cur} value={cur}>
              {cur}
            </option>
          ))}
        </select>

        <input
          className={styles.input}
          placeholder={t("income.frequency")}
          {...register("frequency")}
        />

        <label>
          <input type="checkbox" {...register("active")} /> {t("income.active")}
        </label>

        <button className={styles.btn} type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("common.loading") : t("common.add")}
        </button>

        {errors.name && <div className={styles.error}>{t("income.nameRequired")}</div>}
        {errors.amount && <div className={styles.error}>{t("income.amountRequired")}</div>}
      </form>

      <h3>{t("income.history")}</h3>

      {isLoadingIncomeSources ? (
        <div>{t("common.loading")}</div>
      ) : incomeSources.length === 0 ? (
        <div>{t("income.empty")}</div>
      ) : (
        <ul>
          {incomeSources.map((item: IncomeSource) => (
            <li key={item.id}>
              {item.name} • {item.amount} {item.currency}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}