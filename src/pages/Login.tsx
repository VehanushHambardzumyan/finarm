import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../store/StoreProvider";
import s from "../styles/login.module.css";

const schema = z.object({
  identifier: z.string().min(1, "auth.required"),
  password: z.string().min(1, "auth.required"),
});

type Form = z.infer<typeof schema>;

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const useStore = useAppStore();
  const login = useStore((st) => st.login);
  const isLoading = useStore((st) => st.isAuthLoading);

  const { register, handleSubmit, formState, setError, clearErrors } =
    useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    clearErrors("root");
    try {
      const res = await login(data.identifier, data.password);
      if (res?.ok) {
        navigate("/dashboard");
        return;
      }
      setError("root", { message: res?.message || "auth.invalidCredentials" });
    } catch {
      setError("root", { message: "auth.unknownError" });
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
          <div className={s["login-title"]}>{t("appName")}</div>
          <div style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "0.3rem" }}>
            {t("auth.loginSubtitle")}
          </div>
        </div>

        {/* Form */}
        <form className={s["login-form"]} onSubmit={handleSubmit(onSubmit)}>

          <div className={s["login-field"]}>
            <label className={s["login-label"]}>{t("auth.emailOrPhone")}</label>
            <input
              className={s["login-input"]}
              placeholder={t("auth.emailPlaceholder")}
              autoComplete="username"
              {...register("identifier")}
            />
            {formState.errors.identifier && (
              <div className={s["login-error"]}>
                {t(String(formState.errors.identifier.message))}
              </div>
            )}
          </div>

          <div className={s["login-field"]}>
            <label className={s["login-label"]}>{t("auth.password")}</label>
            <input
              className={s["login-input"]}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
            />
            {formState.errors.password && (
              <div className={s["login-error"]}>
                {t(String(formState.errors.password.message))}
              </div>
            )}
          </div>

          {formState.errors.root && (
            <div className={s["login-error-box"]}>
              {t(String(formState.errors.root.message || "auth.invalidCredentials"))}
            </div>
          )}

          <button className={s["login-btn"]} type="submit" disabled={isLoading}>
            {isLoading ? t("common.loading") : t("auth.signIn")}
          </button>
        </form>

        {/* Footer */}
        <div className={s["login-footer"]}>
          <span style={{ color: "#475569", fontSize: "0.9rem" }}>
            {t("auth.noAccount")}{" "}
            <Link className={s["login-link"]} to="/register">
              {t("auth.createAccount")}
            </Link>
          </span>
        </div>

      </div>
    </div>
  );
}
