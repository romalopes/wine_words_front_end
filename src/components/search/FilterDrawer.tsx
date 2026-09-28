import React from "react";
import styles from "./FilterDrawer.module.css";

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  currentFilters: Record<string, any>;
  onApply: (filters: Record<string, any>) => void;
  onReset: () => void;
  children?: React.ReactNode;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  open,
  onClose,
  currentFilters,
  onApply,
  onReset,
  children,
}) => {
  if (!open) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <h3>Filters</h3>
          <button className={styles.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        <div className={styles.footer}>
          <button className={styles.button} onClick={onReset}>
            Reset
          </button>
          <button
            className={`${styles.button} ${styles.primary}`}
            onClick={() => onApply(currentFilters)}
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
};
