import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { articlesApi, categoriesApi } from "../services/api";
import { errorMessage } from "../utils/errors";
import type { Article } from "../types/article";

interface LinkArticleDialogProps {
  entityId: number
  entityName?: string | null
  /** Ids *and* slugs already attached, shown with a "Linked" badge. */
  excludeIds?: Array<number | string>
  onLinked?: (article: Article) => void
  onClose?: () => void
}

function LinkArticleDialog({
  entityId,
  entityName,
  excludeIds,
  onLinked,
  onClose,
}: LinkArticleDialogProps) {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<Article[] | null>(null);
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
        const data = await articlesApi.list({ query: q, per_page: 8 });
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

  async function handleLink(article: Article) {
    setLinking(true);
    setError(null);
    try {
      await categoriesApi.linkArticle(entityId, article.slug || article.id);
      onLinked?.(article);
    } catch (err) {
      setError(errorMessage(err, "Failed to link article"));
      setLinking(false);
    }
  }

  function handleBackdropClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose?.();
  }

  return (
    <div className="dialog-backdrop" onClick={handleBackdropClick} role="presentation">
      <div className="dialog" role="dialog" aria-modal="true" aria-label={`Link an article to ${entityName}`}>
        <div className="dialog__header">
          <h3 className="dialog__title">Link an Article</h3>
          <button type="button" className="dialog__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="dialog__subtitle">
          Search articles by title to add them to <strong>{entityName}</strong>.
        </p>
        <input
          ref={inputRef}
          type="text"
          className="dialog__search-input"
          placeholder="Search articles by title…"
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
        />
        {error && <p className="dialog__error">{error}</p>}
        <div className="dialog__results">
          {results === null ? (
            <p className="dialog__hint">Type at least 2 characters to search.</p>
          ) : results.length === 0 ? (
            <p className="dialog__hint">No articles found.</p>
          ) : (
            <ul className="dialog__results-list">
              {results.map((article: Article) => {
                // `slug` is nullable, and `includes` does not accept undefined —
                // a record without a slug is matched on its id alone.
                const isLinked = (excludeIds || []).includes(article.id)
                  || (article.slug != null && (excludeIds || []).includes(article.slug));
                return (
                  <li key={article.id || article.slug} className="dialog__result-item">
                    <div className="dialog__result-info">
                      <strong className="dialog__result-name">{article.title}</strong>
                      {article.author_name && (
                        <span className="dialog__result-meta">{article.author_name}</span>
                      )}
                      {article.status && (
                        <span className="dialog__result-meta">{article.status}</span>
                      )}
                    </div>
                    {isLinked ? (
                      <span className="dialog__linked-badge">Linked</span>
                    ) : (
                      <button
                        type="button"
                        className="dialog__link-btn"
                        disabled={linking}
                        onClick={() => handleLink(article)}
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

export default LinkArticleDialog;