import { useState, useEffect, useRef } from 'react';
import { buildQuery, parseQuery } from '../services/searchParams';
import type { SearchParams } from '../services/searchParams';
import type { Paginated, ResourceResponse } from '../types/common';

/** The single shape this hook hands to components. */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  totalPages: number;
  page: number;
  per_page: number;
}

/** Anything a list endpoint may hand back. */
export type SearchResponse<T> = ResourceResponse<T> | PaginatedResult<T>;

/**
 * The backend either returns a bare array or the Rails pagination envelope
 * (`{ items, page, per_page, total_count, total_pages }`, see `Paginated<T>`).
 * Normalise both — plus this hook's own shape, so a caller that already
 * normalises still works — into `PaginatedResult<T>`.
 */
export function toPaginatedResult<T>(
  raw: SearchResponse<T>,
  fallbackPerPage: number
): PaginatedResult<T> {
  if (Array.isArray(raw)) {
    return {
      data: raw,
      total: raw.length,
      totalPages: 1,
      page: 1,
      per_page: fallbackPerPage,
    };
  }
  const envelope = raw as Partial<Paginated<T>> & Partial<PaginatedResult<T>>;
  const items = Array.isArray(envelope.items)
    ? envelope.items
    : Array.isArray(envelope.data)
      ? envelope.data
      : [];
  const total = envelope.total_count ?? envelope.total ?? items.length;
  const perPage = envelope.per_page ?? fallbackPerPage;
  const totalPages =
    envelope.total_pages ?? Math.max(Math.ceil(total / (perPage || 1)), 1);
  return {
    data: items,
    total,
    totalPages: Math.max(totalPages, 1),
    page: envelope.page ?? 1,
    per_page: perPage,
  };
}

/**
 * Query keys owned by React Router rather than this hook. `category` is driven
 * by `useSelectedCategory()`, so the router location is its single source of
 * truth: if this hook read or wrote it too, the two would fight each other
 * (e.g. re-adding `?category=` after the user clicked "Show all").
 */
const ROUTER_OWNED_KEYS = ["category"];

/**
 * Hook to manage search state, filtering, sorting, pagination and fetching.
 * @param fetchFn Function that takes SearchParams and returns a list response
 * @param defaultParams Default search params (will be merged with parsed URL)
 */
export interface UseSearchOptions {
  /**
   * Minimum number of characters before `query` is sent to the API. Shorter
   * input is fetched as an empty query, so the listing stays unfiltered and no
   * search request is made while the user is still typing.
   */
  minQueryLength?: number;
}

export function useSearch<T>(
  fetchFn: (params: SearchParams) => Promise<SearchResponse<T>>,
  defaultParams: SearchParams = {},
  { minQueryLength = 0 }: UseSearchOptions = {}
) {
  // Initialize params from URL, then merge defaults (URL overrides defaults).
  // Router-owned keys are dropped so this hook can never stale-cache them.
  const [params, setParams] = useState<SearchParams>(() => {
    const urlParams = parseQuery(window.location.search.slice(1));
    ROUTER_OWNED_KEYS.forEach((key) => {
      delete urlParams[key];
    });
    return { ...defaultParams, ...urlParams };
  });

  const [data, setData] = useState<PaginatedResult<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the free-text query (300ms)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(params.query ?? ''), 300);
    return () => clearTimeout(handler);
  }, [params.query]);

  // Blank the term out until it is long enough to search on, so one- and
  // two-character input never triggers a search request.
  const trimmedQuery = String(debouncedQuery ?? "").trim();
  const effectiveQuery =
    trimmedQuery.length >= minQueryLength ? trimmedQuery : "";

  // Fetch whenever the debounced query, the page, or any filter/sort changes.
  useEffect(() => {
    const requestParams = { ...params, query: effectiveQuery };
    const fallbackPerPage = Number(requestParams.per_page) || 20;
    let cancelled = false;
    setLoading(true);
    fetchFn(requestParams)
      .then((raw) => {
        if (!cancelled) setData(toPaginatedResult(raw, fallbackPerPage));
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    // Guard against a slow earlier response overwriting a newer one.
    return () => {
      cancelled = true;
    };
  }, [effectiveQuery, params, fetchFn]);

  // Reset to page 1 when the search term, sort or filters change (so a new
  // search never lands on a stale page). The page itself is excluded from the
  // signature, otherwise `setPage` would immediately snap back to page 1 and
  // pagination would be unusable.
  const filterSignature = JSON.stringify({ ...params, page: undefined });
  const prevSignature = useRef(filterSignature);
  useEffect(() => {
    if (prevSignature.current === filterSignature) return;
    prevSignature.current = filterSignature;
    if ((params.page ?? 1) !== 1) {
      setParams(prev => ({ ...prev, page: 1 }));
    }
  }, [filterSignature, params.page]);

  // Sync the URL with `params`, touching only the keys this hook owns so the
  // router's own query keys (e.g. `category`) survive untouched.
  useEffect(() => {
    const next = new URLSearchParams(window.location.search);
    Object.keys(params).forEach((key) => next.delete(key));
    new URLSearchParams(buildQuery(params)).forEach((value, key) => {
      next.set(key, value);
    });
    const search = next.toString();
    const newUrl = `${window.location.pathname}${search ? `?${search}` : ""}`;
    window.history.replaceState({ path: newUrl }, "", newUrl);
  }, [params]);

  // Helper updaters for UI components. Returning the previous object when the
  // value is unchanged lets React bail out of the re-render, so a no-op update
  // cannot re-trigger the fetch/URL-sync effects.
  const setPage = (page: number) =>
    setParams(p => (p.page === page ? p : { ...p, page }));
  const setPerPage = (per: number) =>
    setParams(p => (p.per_page === per ? p : { ...p, per_page: per }));
  const setSort = (sort: string) =>
    setParams(p => (p.sort === sort ? p : { ...p, sort }));
  const setFilter = <K extends keyof SearchParams>(key: K, value: SearchParams[K]) =>
    setParams(p => (p[key] === value ? p : { ...p, [key]: value }));
  const removeFilter = (key: keyof SearchParams) =>
    setParams(p => {
      if (!(key in p)) return p;
      const { [key]: _, ...rest } = p;
      return rest;
    });

  return {
    data,
    loading,
    params,
    setPage,
    setPerPage,
    setSort,
    setFilter,
    removeFilter,
  };
}