import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { articlesApi, reviewsApi } from "../services/api";
import { isAbortError } from "../hooks/useSearch";
import { useReturnToLink } from "../hooks/useReturnToLink";
import LikeButton from "./LikeButton";
import CommentLink from "./comments/CommentLink";
import type { Article } from "../types/article";
import type { Review } from "../types/review";

/** Strips HTML and truncates, for the one- or two-line preview under a title. */
function excerpt(text: string | null | undefined, max = 140): string {
  if (!text) return "";
  const stripped = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (stripped.length <= max) return stripped;
  return `${stripped.slice(0, max).trimEnd()}…`;
}

/** First attached image, falling back to the primary one. */
function coverImage(item: RelatedItem): string | null {
  if (Array.isArray(item.images) && item.images.length > 0) return item.images[0] ?? null;
  return item.primary_image ?? null;
}

/** Either kind of record the footer can list. */
type RelatedItem = Article | Review;

/**
 * The parts that differ between an article and a review. Everything else — the
 * markup, the abort handling, the "renders nothing when empty" contract — is
 * shared, so the two detail pages stay visually identical.
 */
const KINDS = {
  article: {
    heading: "More articles",
    seeAll: "/articles",
    detailPath: (id: string | number) => `/articles/${id}`,
    fetch: (
      id: string | number,
      params: { limit: number },
      options: { signal: AbortSignal },
    ) => articlesApi.related(id, params, options),
    // Articles preview their summary, falling back to the body.
    preview: (item: RelatedItem) => (item as Article).abstract || (item as Article).body,
    byline: (item: RelatedItem) => (item as Article).author_name,
  },
  review: {
    heading: "More reviews",
    seeAll: "/reviews",
    detailPath: (id: string | number) => `/reviews/${id}`,
    fetch: (
      id: string | number,
      params: { limit: number },
      options: { signal: AbortSignal },
    ) => reviewsApi.related(id, params, options),
    // A review's preview is its tasting note; there is no summary field.
    preview: (item: RelatedItem) => (item as Review).comment,
    byline: (item: RelatedItem) => (item as Review).reviewer_name,
  },
} as const;

export type RelatedKind = keyof typeof KINDS;

interface RelatedContentProps {
  kind: RelatedKind;
  /** The record being viewed; only its slug/id are used to build the request. */
  item: { slug?: string | null; id: number };
}

const LIMIT = 5;

/**
 * The "more <things>" footer below the comments on a detail page.
 *
 * Modeled on the Substack post footer: one row per record, text on the left
 * (title, preview, date • author, like/comment controls) and the cover image on
 * the right, then a "See all" link to the listing.
 *
 * The rows come from `GET /articles|reviews/:id/related`, which picks the newest
 * records across this one's categories and deals the slots round-robin when it
 * belongs to more than one. Nothing renders when the record is uncategorised or
 * every sibling is hidden — the footer is optional, it never breaks the page.
 */
export default function RelatedContent({ kind, item }: RelatedContentProps) {
  const returnToLink = useReturnToLink();
  const config = KINDS[kind];
  const [related, setRelated] = useState<RelatedItem[]>([]);

  const identifier = item.slug || item.id;

  useEffect(() => {
    if (!identifier) return;
    const controller = new AbortController();
    let cancelled = false;

    config
      .fetch(identifier, { limit: LIMIT }, { signal: controller.signal })
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
    // `config` is a constant per `kind`; the request is keyed on the record and
    // the kind, so neither the object identity nor the refetching matters.
  }, [identifier, kind, config]);

  if (related.length === 0) return null;

  return (
    <section className="wine-detail__section related">
      <h2>{config.heading}</h2>

      <div className="related__list">
        {related.map((row) => {
          const image = coverImage(row);
          const href = returnToLink(config.detailPath(row.slug || row.id));
          const preview = excerpt(config.preview(row));
          const byline = config.byline(row);

          return (
            <article key={row.id} className="related-row">
              <div className="related-row__body">
                <h3 className="related-row__title">
                  <Link to={href}>{row.title}</Link>
                </h3>

                {preview && <p className="related-row__excerpt">{preview}</p>}

                <p className="related-row__meta">
                  {row.published_at
                    ? new Date(row.published_at).toLocaleDateString()
                    : "Draft"}
                  {byline ? ` • ${byline}` : ""}
                </p>

                <div
                  className="related-row__actions"
                  onClick={(event) => event.stopPropagation()}
                >
                  <LikeButton
                    kind={kind}
                    identifier={row.slug || row.id}
                    // `?? null` rather than passing the value through: the
                    // button's props are `exactOptionalPropertyTypes`.
                    initialLiked={row.liked_by_current_user ?? null}
                    initialCount={row.likes_count ?? null}
                  />
                  <CommentLink kind={kind} identifier={row.slug || row.id} />
                </div>
              </div>

              {image && (
                <Link to={href} className="related-row__media" tabIndex={-1} aria-hidden="true">
                  <img
                    src={image}
                    alt=""
                    className="related-row__thumb"
                    loading="lazy"
                  />
                </Link>
              )}
            </article>
          );
        })}
      </div>

      <Link to={config.seeAll} className="group-show-all related__see-all">
        See all →
      </Link>
    </section>
  );
}
