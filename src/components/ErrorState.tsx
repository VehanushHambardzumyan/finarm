import React from "react";
import styles from "./EmptyState.module.css";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry, className }) => (
  <div className={`${styles.empty} ${className || ""}`.trim()} style={{ color: '#c00' }}>
    <div className={styles.icon} style={{ fontSize: '2rem' }}>⚠️</div>
    <div className={styles.message}>{message}</div>
    {onRetry && (
      <button style={{ marginTop: 12 }} onClick={onRetry}>
        Retry
      </button>
    )}
  </div>
);

export default ErrorState;
