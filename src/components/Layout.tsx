import { useAutoNotifications } from "../hooks/useAutoNotifications";
import styles from "./Layout.module.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  useAutoNotifications();
  return <main className={styles.container}>{children}</main>;
}
