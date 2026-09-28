import React from 'react';
import styles from './SearchEmptyState.module.css';

interface SearchEmptyStateProps {
  query: string;
}

export const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({ query }) => {
  return (
    <div className={styles.container}>
      <p>No results found for “{query}”.</p>
      <p>Try adjusting your search terms or filters.</p>
    </div>
  );
};