import React from 'react';
import { useLoading } from './LoadingProvider';
import styles from './GlobalLoadingSpinner.module.css';

export const GlobalLoadingSpinner: React.FC = () => {
  const { loadingState } = useLoading();

  if (!loadingState.isLoading) {
    return null;
  }

  return (
    <div className={styles['global-loading-overlay']}>
      <div className={styles['global-loading-spinner']}>
        <div className={styles.spinner}></div>
        {loadingState.loadingMessage && (
          <p className={styles['loading-message']}>{loadingState.loadingMessage}</p>
        )}
      </div>
    </div>
  );
};