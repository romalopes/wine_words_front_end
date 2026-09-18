import { useState } from "react";
import { winePackageItemsApi } from "../services/api";
import styles from "./winePackages.module.css";

// Starts the ordinary review flow from a package line.
//
// The review itself is created by the backend through the normal Review path
// (same validations, slug and images as any other review) and is linked back to
// this line. Publishing it here releases the line; if it was the last one
// outstanding the package completes automatically.
function PackageReviewForm({ packageId, item, onSaved, onCancel }) {
  const [form, setForm] = useState({
    title: item.label === "Unmatched wine" ? "" : item.label,
    score: "",
    status: "draft",
    comment: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const review = await winePackageItemsApi.createReview(packageId, item.id, {
        title: form.title,
        score: Number(form.score),
        status: form.status,
        comment: form.comment || null,
        published_at: form.status === "published" ? new Date().toISOString() : null,
      });
      onSaved(review);
    } catch (err) {
      setError(err.message || "Failed to create the review");
      setSaving(false);
    }
  }

  return (
    <form className={styles.inlineForm} onSubmit={handleSubmit}>
      {error && <p className="wine-management__error">{error}</p>}

      <div className={styles.filterField} style={{ flex: "1 1 16rem" }}>
        <label htmlFor="review-title">Review title</label>
        <input
          id="review-title"
          type="text"
          required
          value={form.title}
          onChange={(event) => updateField("title", event.target.value)}
        />
      </div>

      <div className={styles.filterField}>
        <label htmlFor="review-score">Score</label>
        <input
          id="review-score"
          type="number"
          min="0"
          max="100"
          step="0.5"
          required
          value={form.score}
          onChange={(event) => updateField("score", event.target.value)}
        />
      </div>

      <div className={styles.filterField}>
        <label htmlFor="review-status">Status</label>
        <select
          id="review-status"
          value={form.status}
          onChange={(event) => updateField("status", event.target.value)}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <div className={styles.filterField} style={{ flex: "1 1 20rem" }}>
        <label htmlFor="review-comment">Tasting note</label>
        <textarea
          id="review-comment"
          rows="3"
          value={form.comment}
          onChange={(event) => updateField("comment", event.target.value)}
        />
      </div>

      <div className={styles.inlineFormActions}>
        <button type="submit" className="auth-form__submit" disabled={saving}>
          {saving ? "Creating…" : "Create Review"}
        </button>
        <button type="button" className={styles.actionButton} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default PackageReviewForm;