import React from 'react';
import styles from './ActiveFilters.module.css';

interface ActiveFiltersProps {
  filters: Record<string, any>;
  onRemoveFilter: (key: string) => void;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filters,
  onRemoveFilter,
}) => {
  const filterEntries = Object.entries(filters).filter(([, value]) => value !== '' && value !== null && value !== undefined);

  return (
    <div className={styles.wrapper}>
      {filterEntries.map(([key, value]) => (
        <span key={key} className={styles.chip}>
          {key}: {String(value)}
          <button
            type="button"
            onClick={() => onRemoveFilter(key)}
            className={styles.remove}
            aria-label={`Remove ${key} filter`}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
};