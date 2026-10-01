import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import LikeButton from "./LikeButton";
import CommentLink from "./comments/CommentLink";
import type { Review } from "../types/review";
import { SearchHighlight } from "./search";

/** Strips HTML tags and truncates, for the plain-text line on a card. */
function excerpt(html: string | null | undefined, max = 50) {
  if (!html) return "";
  const stripped = html.replace(/<[^>]+>/g, "").trim();
  if (stripped.length <= max) return stripped;
  return stripped.slice(0, max) + "…";
}

export interface ReviewCardProps {
  review: Review;
  /** Search term to highlight in the title; omit outside search contexts. */
  query?: string;
  /** Whether to render the management (Edit / Publish / Delete) buttons. */
  canManage?: boolean;
  /** Opens the review — the card body is the click target. */
  onOpen: () => void;
  onEdit?: (() => void) | undefined;
  onToggleStatus?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
  /** Rendered inside the card, used for the inline edit form. */
  children?: ReactNode;
}

/**
 * A single review card in the category grid. Mirrors the `wine-management__card`
 * markup used by the other grouped listings, so the grid/typography match.
 *
 * Shared by the Reviews listing (which passes the management handlers) and the
 * article detail page (read-only: it just navigates to the review).
 */
export default function ReviewCard({
  review,
  query = "",
  canManage = false,
  onOpen,
  onEdit,
  onToggleStatus,
  onDelete,
  children,
}: ReviewCardProps) {
  const image =
    (Array.isArray(review.images) && review.images.length > 0
      ? review.images[0]
      : null) ??
    (typeof review.wine_image === "string" ? review.wine_image : null) ??
    review.primary_image ??
    null;
  const hasDrinkWindow = review.drink_from != null || review.drink_to != null;

  return (
    <div
      className="wine-management__card"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="wine-management__card-header">
        <h3>
          <SearchHighlight
            text={review.title || "Untitled review"}
            query={query}
          />
        </h3>
        {review.score != null && (
          <span
            className={`wine-management__color-badge wine-management__color-badge--${review.status}`}
          >
            {review.score}
          </span>
        )}
      </div>

      {(review.wine_name || review.vintage_year) && (
        <p className="wine-management__region">
          {review.wine_slug ? (
            <Link
              to={`/wines/${review.wine_slug}`}
              className="my-reviews__wine-link"
              onClick={(e) => e.stopPropagation()}
            >
              {review.wine_name || "Unknown wine"}
              {review.vintage_year ? ` (${review.vintage_year})` : ""}
            </Link>
          ) : (
            <>
              {review.wine_name}
              {review.vintage_year ? ` (${review.vintage_year})` : ""}
            </>
          )}
        </p>
      )}

      {review.reviewer_name && (
        <p className="wine-management__region">by {review.reviewer_name}</p>
      )}

      {hasDrinkWindow && (
        <p className="wine-management__vintage-count">
          Drink {review.drink_from ?? ""}
          {review.drink_to != null ? `–${review.drink_to}` : ""}
          {review.drink_plus ? "+" : ""}
        </p>
      )}

      {excerpt(review.comment, 50) && (
        <p className="wine-management__region">{excerpt(review.comment, 50)}</p>
      )}

      <div onClick={(e) => e.stopPropagation()}>
        <LikeButton
          kind="review"
          identifier={review.slug || review.id}
          initialLiked={review.liked_by_current_user}
          initialCount={review.likes_count}
        />
        <CommentLink kind="review" identifier={review.slug || review.id} />
      </div>

      {image && (
        <img
          src={image}
          alt={review.title || review.wine_name || "review"}
          className="wine-management__thumb"
        />
      )}

      {canManage && onEdit && onToggleStatus && onDelete && (
        <div
          className="wine-management__card-actions"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="wine-management__edit-btn"
            onClick={onEdit}
          >
            Edit
          </button>
          <button
            type="button"
            className="wine-management__edit-btn"
            onClick={onToggleStatus}
          >
            {review.status === "draft" ? "Publish" : "Unpublish"}
          </button>
          <button
            type="button"
            className="wine-management__delete-btn"
            onClick={onDelete}
            title="Delete review"
          >
            ×
          </button>
        </div>
      )}

      {children}
    </div>
  );
}
