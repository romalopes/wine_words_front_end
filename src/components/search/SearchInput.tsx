import React, { useState, useEffect, useCallback } from 'react';
import styles from './SearchInput.module.css';

interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value = '',
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [debouncedValue, setDebouncedValue] = useState(inputValue);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, debounceMs);
    return () => clearTimeout(handler);
  }, [inputValue, debounceMs]);

  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  return (
    <input
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder={placeholder}
      className={styles.input}
    />
  );
};