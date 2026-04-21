import {useRef } from "react";
import { useAppStore } from "../store/StoreProvider";
import { useTranslation } from "react-i18next";
import styles from "../styles/forms.module.css";
import { writeFile, utils } from "xlsx";
import jsPDF from "jspdf";

export default function Settings() {
  const { t } = useTranslation();
  const useStore = useAppStore();
  const store = useStore();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const exportJson = () => {
    const snapshot = store.exportSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finarm-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const restore = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(String(e.target?.result));
        const res = store.importSnapshot(data);
        if (!res.ok) alert(t(res.message || "settings.restore.invalid"));
        else alert(t("settings.restored"));
      } catch (err) {
        alert(t("settings.restoreInvalidFile"));
      }
    };
    reader.readAsText(file);
  };

  const exportExcel = () => {
    const snapshot = store.exportSnapshot();
    const wb = utils.book_new();
    const users = Object.values(snapshot.users).map(u => ({ id: u.id, name: u.name, email: u.email }));
    const ws = utils.json_to_sheet(users);
    utils.book_append_sheet(wb, ws, "users");
    writeFile(wb, "finarm.xlsx");
    alert(t("settings.exportExcelSaved"));
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    const snapshot = store.exportSnapshot();
    doc.text("FinArm Export", 10, 10);
    doc.text(JSON.stringify(snapshot.currentUserId || "no user"), 10, 20);
    doc.save("finarm.pdf");
    alert(t("settings.exportPDFSaved"));
  };

  return (
    <div>
      <h2>{t("settings.title")}</h2>
      <div className={styles.card}>
        <button className={styles.btn} onClick={exportPdf}>{t("settings.exportPDF")}</button>
        <button className={styles.btn} onClick={exportExcel} style={{ marginLeft: 8 }}>{t("settings.exportExcel")}</button>
        <button className={styles.btn} onClick={exportJson} style={{ marginLeft: 8 }}>{t("settings.backup")}</button>
        <div style={{ marginTop: 8 }}>
          <input ref={fileRef} type="file" onChange={(e) => restore(e.target.files?.[0] || null)} />
        </div>
      </div>
    </div>
  );
}
