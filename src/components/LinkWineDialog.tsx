import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { winesApi, categoriesApi, regionsApi, grapesApi, producersApi } from "../services/api";
import { errorMessage } from "../utils/errors";
import type { LinkEntityType } from "../types/common";
import type { WineListItem } from "../types/wine";

/**
 * The catalog entities a wine can be attached to — a subset of the shared
 * `LinkEntityType`, which also allows "country".
 */
export type WineLinkTarget = "category" | "region" | "grape" | "producer";

/**
 * `linkWine` differs per catalog entity but has the same shape everywhere, so
 * the dialog picks the right one from `entityType` at call time. Deliberately a
 * *partial* map over `LinkEntityType`: callers pass the wider shared union, and
 * the unsupported keys stay `undefined` so the runtime guard below still fires
 * for a "country" target rather than silently doing nothing.
 */
const LINK_ENDPOINTS: Partial<
  Record<LinkEntityType, (entityId: number) => (wineId: number | string) => Promise<unknown>>
> = {
  category: (id) => (wineId) => categoriesApi.linkWine(id, wineId),
  region: (id) => (wineId) => regionsApi.linkWine(id, wineId),
  grape: (id) => (wineId) => grapesApi.linkWine(id, wineId),
  producer: (id) => (wineId) => producersApi.linkWine(id, wineId),
};

interface LinkWineDialogProps {
  entityType: LinkEntityType
  entityId: number
  entityName?: string | null
  /** Ids *and* slugs already attached, shown with a "Linked" badge. */
  excludeIds?: Array<number | string>
  onLinked?: (wine: WineListItem) => void
  onClose?: () => void
}

function LinkWineDialog({
  entityType,
  entityId,
  entityName,
  excludeIds,
  onLinked,
  onClose,
}: LinkWineDialogProps) {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<WineListItem[] | null>(null);
  const [linking, setLinking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const data = await winesApi.search(q);
        if (!cancelled) setResults(data.slice(0, 8));
      } catch {
        if (!cancelled) setResults([]);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  async function handleLink(wine: WineListItem) {
    setLinking(true);
    setError(null);
    try {
      const linkFn = LINK_ENDPOINTS[entityType];
      if (!linkFn) throw new Error(`Unsupported entity type: ${entityType}`);
      await linkFn(entityId)(wine.slug || wine.id);
      onLinked?.(wine);
    } catch (err) {
      setError(errorMessage(err, "Failed to link wine"));
      setLinking(false);
    }
  }

  function handleBackdropClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose?.();
  }

  return (
    <div className="dialog-backdrop" onClick={handleBackdropClick} role="presentation">
      <div className="dialog" role="dialog" aria-modal="true" aria-label={`Link a wine to ${entityName}`}>
        <div className="dialog__header">
          <h3 className="dialog__title">Link a Wine</h3>
          <button type="button" className="dialog__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="dialog__subtitle">
          Search wines by name to add them to <strong>{entityName}</strong>.
        </p>
        <input
          ref={inputRef}
          type="text"
          className="dialog__search-input"
          placeholder="Search wines by name…"
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
        />
        {error && <p className="dialog__error">{error}</p>}
        <div className="dialog__results">
          {results === null ? (
            <p className="dialog__hint">Type at least 2 characters to search.</p>
          ) : results.length === 0 ? (
            <p className="dialog__hint">No wines found.</p>
          ) : (
            <ul className="dialog__results-list">
              {results.map((wine: WineListItem) => {
                const isLinked = (excludeIds || []).includes(wine.id)
                  || (excludeIds || []).includes(wine.slug);
                return (
                  <li key={wine.id || wine.slug} className="dialog__result-item">
                    <div className="dialog__result-info">
                      <strong className="dialog__result-name">{wine.name}</strong>
                      {wine.producer && (
                        <span className="dialog__result-meta">{wine.producer.name}</span>
                      )}
                      {wine.vintages && wine.vintages.length > 0 && (
                        <span className="dialog__result-meta">
                          {wine.vintages.map((v) => v.year).join(", ")}
                        </span>
                      )}
                    </div>
                    {isLinked ? (
                      <span className="dialog__linked-badge">Linked</span>
                    ) : (
                      <button
                        type="button"
                        className="dialog__link-btn"
                        disabled={linking}
                        onClick={() => handleLink(wine)}
                      >
                        {linking ? "Linking…" : "Link"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default LinkWineDialog;
