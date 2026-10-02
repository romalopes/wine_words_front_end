import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { articlesApi } from "../services/api";
import { isAbortError } from "../hooks/useSearch";
import { useReturnToLink } from "../hooks/useReturnToLink";
import LikeButton from "./LikeButton";
import CommentLink from "./comments/CommentLink";
import type { Article } from "../types/article";

/** Strips HTML and truncates, for the one- or two-line preview under a title. */
function excerpt(text: string | null | undefined, max = 140): string {
  if (!text) return "";
  const stripped = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (stripped.length <= max) return stripped;
  return `${stripped.slice(0, max).trimEnd()}…`;
}

/** First attached image, falling back to the primary one. */
function coverImage(article: Article): string | null {
  if (Array.isArray(article.images) && article.images.length > 0) return article.images[0] ?? null;
  return article.primary_image ?? null;
}

interface RelatedArticlesProps {
  article: Article;
}

/**
 * The "more articles" footer below the comments on the article page.
 *
 * Modeled on the Substack post footer: one row per article, text on the left
 * (title, preview, date • author, like/comment controls) and the cover image on
 * the right, then a "See all" link to the Articles listing.
 *
 * The rows come from `GET /articles/:id/related`, which picks the newest
 * articles across this article's categories and deals the slots round-robin when
 * it belongs to more than one. Nothing renders when the article is uncategorised
 * or every sibling is hidden — the footer is optional, it never breaks the page.
 */
export default function RelatedArticles({ article }: RelatedArticlesProps) {
  const returnToLink = useReturnToLink();
  const [related, setRelated] = useState<Article[]>([]);

  const identifier = article.slug || article.id;

  useEffect(() => {
    if (!identifier) return;
    const controller = new AbortController();
    let cancelled = false;

    articlesApi
      .related(identifier, { limit: 5 }, { signal: controller.signal })
      .then((data) => {
        if (!cancelled) setRelated(Array.isArray(data) ? data : []);
      })
      .catch((error: unknown) => {
        // An aborted request is the unmount/navigate path, not a failure.
        if (!cancelled && !isAbortError(error)) setRelated([]);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [identifier]);

  if (related.length === 0) return null;

  return (
    <section className="wine-detail__section related-articles">
      <h2>More articles</h2>

      <div className="related-articles__list">
        {related.map((item) => {
          const image = coverImage(item);
          const href = returnToLink(`/articles/${item.slug || item.id}`);

          return (
            <article key={item.id} className="related-article">
              <div className="related-article__body">
                <h3 className="related-article__title">
                  <Link to={href}>{item.title}</Link>
                </h3>

                {excerpt(item.abstract || item.body) && (
                  <p className="related-article__excerpt">
                    {excerpt(item.abstract || item.body)}
                  </p>
                )}

                <p className="related-article__meta">
                  {item.published_at
                    ? new Date(item.published_at).toLocaleDateString()
                    : "Draft"}
                  {item.author_name ? ` • ${item.author_name}` : ""}
                </p>

                <div
                  className="related-article__actions"
                  onClick={(event) => event.stopPropagation()}
                >
                  <LikeButton
                    kind="article"
                    identifier={item.slug || item.id}
                    // `?? null` rather than passing the value through: the
                    // button's props are `exactOptionalPropertyTypes`.
                    initialLiked={item.liked_by_current_user ?? null}
                    initialCount={item.likes_count ?? null}
                  />
                  <CommentLink kind="article" identifier={item.slug || item.id} />
                </div>
              </div>

              {image && (
                <Link to={href} className="related-article__media" tabIndex={-1} aria-hidden="true">
                  <img
                    src={image}
                    alt=""
                    className="related-article__thumb"
                    loading="lazy"
                  />
                </Link>
              )}
            </article>
          );
        })}
      </div>

      <Link to="/articles" className="group-show-all related-articles__see-all">
        See all →
      </Link>
    </section>
  );
}
