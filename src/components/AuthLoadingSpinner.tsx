import React from "react";
import styles from "./GlobalLoadingSpinner.module.css";

const AuthLoadingSpinner: React.FC = () => (
  <div className={styles['global-loading-overlay']}>
    <div className={styles['global-loading-spinner']}>
      <div className={styles.spinner}></div>
      <p className={styles['loading-message']}>Checking authentication…</p>
    </div>
  </div>
);

export default AuthLoadingSpinner;
