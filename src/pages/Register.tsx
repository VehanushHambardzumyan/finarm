import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../store/StoreProvider";
import s from "../styles/login.module.css";

const schema = z
  .object({
    email: z.string().optional(),
    phone: z.string().optional(),
    password: z.string().min(6, "auth.minPassword"),
    confirm: z.string().min(1, "auth.required"),
    name: z.string().min(1, "auth.required"),
  })
  .refine((d) => d.email || d.phone, {
    message: "auth.required",
    path: ["email"],
  })
  .refine((d) => d.password === d.confirm, {
    message: "auth.passwordMismatch",
    path: ["confirm"],
  });

type Form = z.infer<typeof schema>;

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const useStore = useAppStore();
  const registerUser = useStore((st) => st.register);
  const isLoading = useStore((st) => st.isAuthLoading);

  const { register, handleSubmit, formState, setError } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    const payload = {
      email: data.email?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      password: data.password,
      name: data.name.trim(),
    };

    const res = await registerUser(payload);
    if (res.ok) {
      navigate("/login");
    } else {
      setError("root", { message: res.message || "auth.registrationFailed" });
    }
  };

  return (
    <div className={s["login-bg"]}>
      <div className={s["login-card"]}>

        {/* Logo */}
        <div className={s["login-logo"]}>
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <path d="M15 4L26 10V20L15 26L4 20V10L15 4Z" fill="white" fillOpacity="0.95"/>
            <path d="M10 15H20M15 10V20" stroke="#1d4ed8" strokeWidth="2.4" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Heading */}
        <div style={{ textAlign: "center", width: "100%" }}>
          <div className={s["login-title"]}>{t("auth.createAccount")}</div>
          <div style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "0.3rem" }}>
            {t("auth.registerSubtitle")}
          </div>
        </div>

        {/* Form */}
        <form className={s["login-form"]} onSubmit={handleSubmit(onSubmit)}>

          <div className={s["login-field"]}>
            <label className={s["login-label"]}>{t("auth.name")}</label>
            <input
              className={s["login-input"]}
              placeholder={t("auth.namePlaceholder")}
              autoComplete="name"
              {...register("name")}
            />
            {formState.errors.name && (
              <div className={s["login-error"]}>{t(String(formState.errors.name.message))}</div>
            )}
          </div>

          <div className={s["login-field"]}>
            <label className={s["login-label"]}>{t("auth.emailOrPhone")}</label>
            <input
              className={s["login-input"]}
              placeholder={t("auth.emailPlaceholder")}
              autoComplete="email"
              {...register("email")}
            />
            <div className={s["login-or"]}>{t("auth.orSeparator")}</div>
            <input
              className={s["login-input"]}
              placeholder={t("auth.phonePlaceholder")}
              autoComplete="tel"
              {...register("phone")}
            />
            {formState.errors.email && (
              <div className={s["login-error"]}>{t(String(formState.errors.email.message))}</div>
            )}
          </div>

          <div className={s["login-field"]}>
            <label className={s["login-label"]}>{t("auth.password")}</label>
            <input
              className={s["login-input"]}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("password")}
            />
            {formState.errors.password && (
              <div className={s["login-error"]}>{t(String(formState.errors.password.message))}</div>
            )}
          </div>

          <div className={s["login-field"]}>
            <label className={s["login-label"]}>{t("auth.confirmPassword")}</label>
            <input
              className={s["login-input"]}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("confirm")}
            />
            {formState.errors.confirm && (
              <div className={s["login-error"]}>{t(String(formState.errors.confirm.message))}</div>
            )}
          </div>

          {formState.errors.root && (
            <div className={s["login-error-box"]}>
              {t(formState.errors.root.message || "auth.registrationFailed")}
            </div>
          )}

          <button className={s["login-btn"]} type="submit" disabled={isLoading}>
            {isLoading ? t("common.loading") : t("auth.createAccount")}
          </button>
        </form>

        {/* Footer */}
        <div className={s["login-footer"]}>
          <span style={{ color: "#475569", fontSize: "0.9rem" }}>
            {t("auth.haveAccount")}{" "}
            <Link className={s["login-link"]} to="/login">
              {t("auth.signIn")}
            </Link>
          </span>
        </div>

      </div>
    </div>
  );
}
