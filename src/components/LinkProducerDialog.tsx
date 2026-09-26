import { useEffect, useRef, useState } from "react";
import { producersApi, categoriesApi, regionsApi, grapesApi, countriesApi } from "../services/api";

const LINK_ENDPOINTS = {
  category: (id) => (producerId) => categoriesApi.linkProducer(id, producerId),
  region: (id) => (producerId) => regionsApi.linkProducer(id, producerId),
  grape: (id) => (producerId) => grapesApi.linkProducer(id, producerId),
  country: (id) => (producerId) => countriesApi.linkProducer(id, producerId),
};

function LinkProducerDialog({ entityType, entityId, entityName, excludeIds, onLinked, onClose }) {
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
        const data = await producersApi.search(q);
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

  async function handleLink(producer) {
    setLinking(true);
    setError(null);
    try {
      const linkFn = LINK_ENDPOINTS[entityType];
      if (!linkFn) throw new Error(`Unsupported entity type: ${entityType}`);
      await linkFn(entityId)(producer.slug || producer.id);
      onLinked?.(producer);
    } catch (err) {
      setError(err.message || "Failed to link producer");
      setLinking(false);
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose?.();
  }

  return (
    <div className="dialog-backdrop" onClick={handleBackdropClick} role="presentation">
      <div className="dialog" role="dialog" aria-modal="true" aria-label={`Link a producer to ${entityName}`}>
        <div className="dialog__header">
          <h3 className="dialog__title">Link a Producer</h3>
          <button type="button" className="dialog__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="dialog__subtitle">
          Search producers by name to add them to <strong>{entityName}</strong>.
        </p>
        <input
          ref={inputRef}
          type="text"
          className="dialog__search-input"
          placeholder="Search producers by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {error && <p className="dialog__error">{error}</p>}
        <div className="dialog__results">
          {results === null ? (
            <p className="dialog__hint">Type at least 2 characters to search.</p>
          ) : results.length === 0 ? (
            <p className="dialog__hint">No producers found.</p>
          ) : (
            <ul className="dialog__results-list">
              {results.map((producer) => {
                const isLinked = (excludeIds || []).includes(producer.id)
                  || (excludeIds || []).includes(producer.slug);
                return (
                  <li key={producer.id || producer.slug} className="dialog__result-item">
                    <div className="dialog__result-info">
                      <strong className="dialog__result-name">{producer.name}</strong>
                      {producer.country && (
                        <span className="dialog__result-meta">{producer.country.name}</span>
                      )}
                      {producer.producer_type && (
                        <span className="dialog__result-meta">{producer.producer_type}</span>
                      )}
                    </div>
                    {isLinked ? (
                      <span className="dialog__linked-badge">Linked</span>
                    ) : (
                      <button
                        type="button"
                        className="dialog__link-btn"
                        disabled={linking}
                        onClick={() => handleLink(producer)}
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

export default LinkProducerDialog;
