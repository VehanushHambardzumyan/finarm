import React from "react";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, icon, className }) => (
  <div className={`${styles.empty} ${className || ""}`.trim()}>
    {icon && <div className={styles.icon}>{icon}</div>}
    <div className={styles.message}>{message}</div>
  </div>
);

export default EmptyState;
