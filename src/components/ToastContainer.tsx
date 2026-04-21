import React from 'react';
import { useToast } from './ToastProvider';
import type { ToastType } from './ToastProvider';
import styles from './ToastContainer.module.css';
const getToastIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'info':
      return 'ℹ';
    default:
      return '';
  }
};

const getToastClass = (type: ToastType) => {
  switch (type) {
    case 'success':
      return styles['toast--success'];
    case 'error':
      return styles['toast--error'];
    case 'warning':
      return styles['toast--warning'];
    case 'info':
      return styles['toast--info'];
    default:
      return '';
  }
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className={styles['toast-container']}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${styles.toast} ${getToastClass(toast.type)}`}
          onClick={() => removeToast(toast.id)}
        >
          <span className={styles.toast__icon}>{getToastIcon(toast.type)}</span>
          <span className={styles.toast__message}>{toast.message}</span>
          <button
            className={styles.toast__close}
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};