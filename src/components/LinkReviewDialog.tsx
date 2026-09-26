import { useEffect, useRef, useState } from "react";
import { reviewsApi, categoriesApi } from "../services/api";

function LinkReviewDialog({ entityId, entityName, excludeIds, onLinked, onClose }) {
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
        const data = await reviewsApi.all({ query: q, per_page: 8 });
        const items = Array.isArray(data) ? data : data?.items || [];
        if (!cancelled) setResults(items.slice(0, 8));
      } catch {
        if (!cancelled) setResults([]);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  async function handleLink(review) {
    setLinking(true);
    setError(null);
    try {
      await categoriesApi.linkReview(entityId, review.slug || review.id);
      onLinked?.(review);
    } catch (err) {
      setError(err.message || "Failed to link review");
      setLinking(false);
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose?.();
  }

  return (
    <div className="dialog-backdrop" onClick={handleBackdropClick} role="presentation">
      <div className="dialog" role="dialog" aria-modal="true" aria-label={`Link a review to ${entityName}`}>
        <div className="dialog__header">
          <h3 className="dialog__title">Link a Review</h3>
          <button type="button" className="dialog__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="dialog__subtitle">
          Search reviews by title or wine name to add them to <strong>{entityName}</strong>.
        </p>
        <input
          ref={inputRef}
          type="text"
          className="dialog__search-input"
          placeholder="Search reviews by title or wine…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {error && <p className="dialog__error">{error}</p>}
        <div className="dialog__results">
          {results === null ? (
            <p className="dialog__hint">Type at least 2 characters to search.</p>
          ) : results.length === 0 ? (
            <p className="dialog__hint">No reviews found.</p>
          ) : (
            <ul className="dialog__results-list">
              {results.map((review) => {
                const isLinked = (excludeIds || []).includes(review.id)
                  || (excludeIds || []).includes(review.slug);
                return (
                  <li key={review.id || review.slug} className="dialog__result-item">
                    <div className="dialog__result-info">
                      <strong className="dialog__result-name">{review.title}</strong>
                      {review.wine_name && (
                        <span className="dialog__result-meta">
                          {review.wine_name}
                          {review.vintage_year ? ` ${review.vintage_year}` : ""}
                        </span>
                      )}
                      {review.score != null && (
                        <span className="dialog__result-meta">Score: {review.score}</span>
                      )}
                    </div>
                    {isLinked ? (
                      <span className="dialog__linked-badge">Linked</span>
                    ) : (
                      <button
                        type="button"
                        className="dialog__link-btn"
                        disabled={linking}
                        onClick={() => handleLink(review)}
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

export default LinkReviewDialog;