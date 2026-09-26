import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { canManageWinesRole } from "../constants/roles";
import LinkReviewDialog from "./LinkReviewDialog";
import { useReturnToLink } from "../hooks/useReturnToLink";

// Shared table of reviews (one review per row): Score, Wine, Vintage,
// Reviewer and Status. Rows navigate to the review detail page.
// When `linkContext` is provided, shows a "+ Link a Review" button that opens
// a dialog to search and link reviews to the given entity.
function ReviewTable({ reviews, linkContext, onReviewLinked }) {
  const { user } = useAuth();
  const canManage = canManageWinesRole(user);
  const navigate = useNavigate();
  const returnToLink = useReturnToLink();
  const [dialogOpen, setDialogOpen] = useState(false);
  const excludeIds = Array.isArray(reviews)
    ? reviews.flatMap((r) => [r.id, r.slug].filter(Boolean))
    : [];

  const linkButton = canManage && linkContext && (
    <div style={{ margin: "0 0 1rem" }}>
      <button
        type="button"
        className="btn-action"
        onClick={() => setDialogOpen(true)}
      >
        + Link a Review
      </button>
    </div>
  );

  if (!Array.isArray(reviews) || reviews.length === 0) {
    return (
      <>
        {linkButton}
        <p className="wine-management__empty-state">No reviews yet.</p>
        {dialogOpen && (
          <LinkReviewDialog
            entityId={linkContext.id}
            entityName={linkContext.name}
            excludeIds={excludeIds}
            onClose={() => setDialogOpen(false)}
            onLinked={() => {
              setDialogOpen(false);
              onReviewLinked?.();
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      {linkButton}
      <table className="grapes-table producers-table">
        <thead>
          <tr>
            <th>Score</th>
            <th>Wine</th>
            <th>Vintage</th>
            <th>Reviewer</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review, index) => (
            <tr
              key={review.slug || review.id}
              className={index % 2 === 0 ? "grapes-row--even" : "grapes-row--odd"}
              onClick={() => navigate(returnToLink(`/reviews/${review.slug}`))}
              style={{ cursor: "pointer" }}
            >
              <td>
                <strong>{review.score ?? "—"}</strong>
              </td>
              <td>
                {review.wine_slug ? (
                  <Link
                    to={returnToLink(`/wines/${review.wine_slug}`)}
                    className="grapes-table__link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {review.wine_name}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td>{review.vintage_year ?? "—"}</td>
              <td>{review.reviewer_name || "—"}</td>
              <td>{review.status || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {dialogOpen && (
        <LinkReviewDialog
          entityId={linkContext.id}
          entityName={linkContext.name}
          excludeIds={excludeIds}
          onClose={() => setDialogOpen(false)}
          onLinked={() => {
            setDialogOpen(false);
            onReviewLinked?.();
          }}
        />
      )}
    </>
  );
}

export default ReviewTable;