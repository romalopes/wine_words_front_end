import React from 'react';
import styles from './SearchHighlight.module.css';

interface SearchHighlightProps {
  text: string;
  query: string;
}

export const SearchHighlight: React.FC<SearchHighlightProps> = ({ text, query }) => {
  if (!query) return <span>{text}</span>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');

  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, index) =>
        part === '' ? null : regex.test(part) ? (
          <mark key={index} className={styles.highlight}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};