import { useEffect, useRef, useState } from "react";
import { winesApi, categoriesApi, regionsApi, grapesApi, producersApi } from "../services/api";

const LINK_ENDPOINTS = {
  category: (id) => (wineId) => categoriesApi.linkWine(id, wineId),
  region: (id) => (wineId) => regionsApi.linkWine(id, wineId),
  grape: (id) => (wineId) => grapesApi.linkWine(id, wineId),
  producer: (id) => (wineId) => producersApi.linkWine(id, wineId),
};

function LinkWineDialog({ entityType, entityId, entityName, excludeIds, onLinked, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

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

  async function handleLink(wine) {
    setLinking(true);
    setError(null);
    try {
      const linkFn = LINK_ENDPOINTS[entityType];
      if (!linkFn) throw new Error(`Unsupported entity type: ${entityType}`);
      await linkFn(entityId)(wine.slug || wine.id);
      onLinked?.(wine);
    } catch (err) {
      setError(err.message || "Failed to link wine");
      setLinking(false);
    }
  }

  function handleBackdropClick(e) {
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
          onChange={(e) => setQuery(e.target.value)}
        />
        {error && <p className="dialog__error">{error}</p>}
        <div className="dialog__results">
          {results === null ? (
            <p className="dialog__hint">Type at least 2 characters to search.</p>
          ) : results.length === 0 ? (
            <p className="dialog__hint">No wines found.</p>
          ) : (
            <ul className="dialog__results-list">
              {results.map((wine) => {
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
