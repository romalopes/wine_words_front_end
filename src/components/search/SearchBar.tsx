import React from 'react';
import styles from './SearchBar.module.css';
import { SearchInput } from './SearchInput';
import { ActiveFilters } from './ActiveFilters';
import { SortDropdown } from './SortDropdown';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  activeFilters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  sortOptions: { value: string; label: string }[];
  currentSort: string;
  onSortChange: (value: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  onSearch,
  activeFilters,
  onFilterChange,
  sortOptions,
  currentSort,
  onSortChange,
}) => {
  return (
    <div className={styles.container}>
      <SearchInput
        placeholder={placeholder}
        onChange={onSearch}
      />
      <div className={styles.controls}>
        <ActiveFilters
          filters={activeFilters}
          onFilterChange={onFilterChange}
        />
        <SortDropdown
          options={sortOptions}
          value={currentSort}
          onChange={onSortChange}
        />
      </div>
    </div>
  );
};