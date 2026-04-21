import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../store/StoreProvider";
import styles from "./Header.module.css";

export default function Header() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const useStore = useAppStore();
  const logout = useStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const changeLanguage = (lng: string) => {
    localStorage.setItem("lang", lng);
    i18n.changeLanguage(lng);
  };

  const navItems = [
    { to: "/dashboard", label: t("nav.dashboard") },
    { to: "/transactions", label: t("nav.transactions") },
    { to: "/accounts", label: t("nav.accounts") },
    { to: "/budgets", label: t("nav.budgets") },
    { to: "/goals", label: t("nav.goals") },
    { to: "/reports", label: t("nav.reports") },
    { to: "/notifications", label: t("nav.notifications") },
    { to: "/profile", label: t("nav.profile") },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/dashboard" className={styles.logo}>
          FinArm
        </Link>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`${styles.navLink} ${
                location.pathname === item.to ? styles.active : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.rightSide}>
          <select
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value)}
            className={styles.langSelect}
          >
            <option value="hy">Հայ</option>
            <option value="en">EN</option>
            <option value="ru">RU</option>
          </select>
          <button className={styles.logoutBtn} onClick={handleLogout} title={t("nav.logout")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {t("nav.logout")}
          </button>
        </div>
      </div>
    </header>
  );
}