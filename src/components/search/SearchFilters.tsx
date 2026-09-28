import React from 'react';
import styles from './SearchFilters.module.css';
import { FilterDrawer } from './FilterDrawer';

interface SearchFiltersProps {
  open: boolean;
  onToggle: () => void;
  currentFilters: Record<string, any>;
  onApply: (filters: Record<string, any>) => void;
  onReset: () => void;
  children?: React.ReactNode; // filter controls to render inside drawer
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  open,
  onToggle,
  currentFilters,
  onApply,
  onReset,
  children,
}) => {
  const activeCount = Object.entries(currentFilters).filter(([, v]) => v !== '' && v !== null && v !== undefined).length;

  return (
    <>
      <button className={styles.button} onClick={onToggle} aria-label="Open filters">
        Filters
        {activeCount > 0 && (
          <span className={styles.badge}>{activeCount}</span>
        )}
      </button>
      <FilterDrawer
        open={open}
        onClose={onToggle}
        currentFilters={currentFilters}
        onApply={onApply}
        onReset={onReset}
      >
        {children}
      </FilterDrawer>
    </>
  );
};