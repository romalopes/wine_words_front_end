import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { reviewsApi } from "../services/api";
import ReviewForm from "./ReviewForm";
import { useAuth } from "../contexts/AuthContext";
import { canManageWinesRole } from "../constants/roles";
import DOMPurify from "dompurify";
import BackToSource from "./BackToSource";
import { useReturnToLink } from "../hooks/useReturnToLink";

function RichComment({ html }) {
  return (
    <div
      className="review-card__comment"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  );
}

function ReviewDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const returnToLink = useReturnToLink();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner =
    Boolean(user && review && Number(review.user_id) === Number(user.id));
  const canEdit = canManageWinesRole(user) || isOwner;

  const loadReview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reviewsApi.show(slug);
      setReview(data);
    } catch (err) {
      setError(err.message || "Failed to load review");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  async function handleDelete() {
    if (
      !window.confirm(
        "Delete this review? This action cannot be undone.",
      )
    ) {
      return;
    }
    try {
      setDeleting(true);
      await reviewsApi.destroy(review.id);
      navigate("/reviews");
    } catch (err) {
      setError(err.message || "Failed to delete review");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="wine-app">
        <p className="wine-management__loading">Loading review…</p>
      </main>
    );
  }

  if (error || !review) {
    return (
      <main className="wine-app">
        <p className="wine-management__error">{error || "Review not found."}</p>
        <Link to="/reviews" className="auth-form__submit">
          Back to Reviews
        </Link>
      </main>
    );
  }

  return (
    <main className="wine-app">
      <BackToSource />
      <Link to="/reviews" className="wine-detail__back">
        &larr; Back to Reviews
      </Link>

      {Array.isArray(review.images) && review.images.length > 0 && (
        <div className="wine-detail__images">
          {review.images.map((src, i) => (
            <img key={i} src={src} alt={`${review.title} ${i + 1}`} />
          ))}
        </div>
      )}

      {error && <p className="wine-management__error">{error}</p>}

      {canEdit && !editing && (
        <div className="review-form__actions">
          <button
            type="button"
            className="auth-form__submit"
            onClick={() => setEditing(true)}
          >
            Edit Review
          </button>
          <button
            type="button"
            className="review-form__cancel"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete Review"}
          </button>
        </div>
      )}

      {canEdit && editing && (
        <ReviewForm
          review={review}
          vintageYear={review.vintage_year}
          onSaved={() => {
            setEditing(false);
            loadReview();
          }}
          onCancel={() => setEditing(false)}
        />
      )}

      <div className="wine-detail__header">
        <h1>{review.title || "Untitled review"}</h1>
        <span className="review-card__score">{review.score}</span>
      </div>

      <p className="review-card__comment">
        {review.wine_name && (
          <>
            <Link to={returnToLink(`/wines/${review.wine_slug}`)}>
              {review.wine_name}
              {review.vintage_year ? ` ${review.vintage_year}` : ""}
            </Link>
            {" · "}
          </>
        )}
        {`by ${review.reviewer_name}`}
        {review.published_at && (
          <>
            {" · "}
            {new Date(review.published_at).toLocaleDateString()}
          </>
        )}
        <span className={`review-card__status`}> {review.status}</span>
      </p>

      {Array.isArray(review.categories) && review.categories.length > 0 && (
        <p className="review-card__comment">
          Categories:{" "}
          {review.categories.map((cat, i) => (
            <span key={cat.id}>
              <Link to={returnToLink(`/categories/${cat.slug}`)}>{cat.name}</Link>
              {i < review.categories.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      )}

      {review.comment && (
        <div className="wine-detail__section">
          <RichComment html={review.comment} />
        </div>
      )}
    </main>
  );
}

export default ReviewDetail;
