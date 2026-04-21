import React from "react";
import styles from "./GlobalLoadingSpinner.module.css";

const LoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <div className={styles['global-loading-overlay']} style={{ position: 'static', background: 'none' }}>
    <div className={styles['global-loading-spinner']}>
      <div className={styles.spinner}></div>
      {message && <p className={styles['loading-message']}>{message}</p>}
    </div>
  </div>
);

export default LoadingSpinner;
