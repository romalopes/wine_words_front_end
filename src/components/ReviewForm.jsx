import { useEffect, useRef, useState } from "react";
import {
  reviewsApi,
  imagesApi,
  categoriesApi,
  winesApi,
  winePackageItemsApi,
} from "../services/api";
import ImageManager from "./ImageManager";
import RichTextEditor from "./RichTextEditor";

function ReviewForm({
  wineSlug,
  vintageId,
  vintageYear,
  wineName,
  vintageNoVintage,
  review,
  onSaved,
  onCancel,
  // Package mode: when both are present the review is created through the
  // package item endpoint, which creates it via the ordinary Review path and
  // links it back to the line in the same request.
  packageId,
  packageItemId,
}) {
  const packageMode = packageId != null && packageItemId != null;
  const isEditing = Boolean(review);

  // Auto-generated title: "Review of {Wine} - {Year|NV}" (create only).
  const autoTitle = wineName
    ? `${wineName} ${vintageNoVintage ? "NV" : vintageYear || "NV"}`
    : "";
  const titleEditedRef = useRef(Boolean(review?.title));

  const [form, setForm] = useState(
    review
      ? {
          title: review.title || "",
          comment: review.comment || "",
          score: review.score ?? 80,
          status: review.status || "draft",
          drink_from: review.drink_from ?? "",
          drink_to: review.drink_to ?? "",
          drink_plus: Boolean(review.drink_plus),
          category_ids: (review.categories || []).map((c) => c.id),
          vintage_id: review.vintage_id ?? null,
        }
      : {
          title: autoTitle,
          comment: "",
          score: 80,
          status: "draft",
          drink_from: "",
          drink_to: "",
          drink_plus: false,
          category_ids: [],
        },
  );

  // Edit mode: wine/vintage picker state.
  const [changingWine, setChangingWine] = useState(false);
  const [wineQuery, setWineQuery] = useState("");
  const [wineResults, setWineResults] = useState(null);
  const [pickedWine, setPickedWine] = useState(null); // {name, vintages}
  const [pickedVintage, setPickedVintage] = useState(
    review
      ? {
          id: review.vintage_id,
          year: review.vintage_year,
          wineName: review.wine_name,
        }
      : null,
  );

  // Debounced wine search for the edit-mode picker.
  useEffect(() => {
    if (!isEditing || !changingWine) return undefined;
    const q = wineQuery.trim();
    if (q.length < 2) {
      setWineResults(null);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const data = await winesApi.search(q);
        if (!cancelled) setWineResults(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setWineResults([]);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [wineQuery, changingWine, isEditing]);

  function pickWine(wine) {
    setPickedWine(wine);
    setPickedVintage(null);
  }

  function pickVintage(vintage) {
    setPickedVintage({
      id: vintage.id,
      year: vintage.no_vintage ? "NV" : vintage.year,
      wineName: pickedWine?.name || review?.wine_name,
    });
    setForm((prev) => ({ ...prev, vintage_id: vintage.id }));
    setChangingWine(false);
    setWineQuery("");
    setWineResults(null);
  }

  // Keep the title in sync when the wine/vintage changes, until the user edits it.
  useEffect(() => {
    if (isEditing) return;
    if (titleEditedRef.current) return;
    setForm((prev) => ({ ...prev, title: autoTitle }));
  }, [autoTitle, isEditing]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [images, setImages] = useState(null);
  const [existingImages, setExistingImages] = useState(review?.images || []);
  const [existingImageIds, setExistingImageIds] = useState(
    review?.image_ids || [],
  );
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const allCategories = await categoriesApi.list();
        const reviewCategories = allCategories
          .filter((c) => c.for_review)
          .sort((a, b) => a.sort_order_review - b.sort_order_review);
        setCategories(reviewCategories);
      } catch {
        setCategories([]);
      }
    }
    loadCategories();
  }, []);
  function updateField(field) {
    return (e) => {
      let value;
      if (field === "drink_plus") {
        value = e.target.checked;
      } else if (
        field === "score" ||
        field === "drink_from" ||
        field === "drink_to"
      ) {
        value = e.target.value === "" ? "" : Number(e.target.value);
      } else {
        value = e.target.value;
      }
      setForm((prev) => ({ ...prev, [field]: value }));
      if (field === "title") titleEditedRef.current = true;
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...form,
        published_at:
          form.status === "published" ? new Date().toISOString() : null,
        drink_from: form.drink_from === "" ? null : Number(form.drink_from),
        drink_to: form.drink_to === "" ? null : Number(form.drink_to),
        drink_plus: Boolean(form.drink_plus),
      };

      if (isEditing) {
        if (packageMode) {
          throw new Error(
            "A package review cannot be edited here. Open the review page instead.",
          );
        }
        await reviewsApi.update(review.id, {
          ...payload,
          vintage_id: pickedVintage?.id ?? review.vintage_id,
        });
        if (images && images.length > 0) {
          await imagesApi.upload("review", review.id, images);
        }
        onSaved();
      } else if (packageMode) {
        // Package mode is create-only: the backend creates the review through
        // the ordinary Review path and links it to the line atomically.
        const saved = await winePackageItemsApi.createReview(packageId, packageItemId, payload);
        if (images && images.length > 0 && saved?.id) {
          await imagesApi.upload("review", saved.id, images);
        }
        onSaved(saved);
      } else {
        const saved = await reviewsApi.create(wineSlug, vintageId, payload);
        if (images && images.length > 0 && saved?.id) {
          await imagesApi.upload("review", saved.id, images);
        }
        onSaved(saved);
      }
    } catch (err) {
      setError(err.message || "Failed to save review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      {isEditing && (
        <div className="review-form__field">
          <label>Wine &amp; Vintage</label>
          {!changingWine ? (
            <div className="review-list">
              <div className="review-card">
                <div className="review-card__top">
                  <strong>{pickedVintage?.wineName || wineName || "—"}</strong>
                  <span className="review-card__status">
                    {pickedVintage?.year || vintageYear || "Vintage"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn-action"
                onClick={() => setChangingWine(true)}
              >
                Change wine/vintage
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={wineQuery}
                onChange={(e) => setWineQuery(e.target.value)}
                placeholder="Search for a wine…"
                autoFocus
              />
              {wineResults !== null &&
                wineResults.length > 0 &&
                !pickedWine && (
                  <div className="review-list">
                    {wineResults.map((wine) => (
                      <button
                        key={wine.slug}
                        type="button"
                        className="review-card"
                        onClick={() => pickWine(wine)}
                      >
                        <div className="review-card__top">
                          <strong>{wine.name}</strong>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              {pickedWine && (
                <>
                  <p className="wine-management__empty-state">
                    Reviewing <strong>{pickedWine.name}</strong> — choose a
                    vintage.
                  </p>
                  <div className="review-list">
                    {(pickedWine.vintages || []).map((vintage) => (
                      <button
                        key={vintage.id}
                        type="button"
                        className="review-card"
                        onClick={() => pickVintage(vintage)}
                      >
                        <div className="review-card__top">
                          <strong>
                            {vintage.no_vintage ? "NV" : vintage.year}
                          </strong>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="review-form__cancel"
                    onClick={() => {
                      setPickedWine(null);
                      setWineQuery("");
                      setWineResults(null);
                    }}
                  >
                    Back to wine search
                  </button>
                </>
              )}
              <button
                type="button"
                className="review-form__cancel"
                onClick={() => setChangingWine(false)}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}
      <div className="review-form__field">
        <label htmlFor="review-title">Title</label>
        <input
          id="review-title"
          type="text"
          required
          value={form.title}
          onChange={updateField("title")}
          placeholder="Give your review a short title"
        />
      </div>

      <div className="review-form__field">
        <label htmlFor="review-score">Score</label>
        <div className="review-form__score-row">
          <input
            id="review-score"
            type="range"
            min={0}
            max={100}
            step={1}
            value={form.score}
            onChange={updateField("score")}
          />
          <output className="review-form__score-value">{form.score}</output>
        </div>
      </div>

      <div className="review-form__field">
        <label htmlFor="review-drink-from">Drink From</label>
        <div className="review-form__score-row">
          <input
            id="review-drink-from"
            type="number"
            min={vintageYear || 1900}
            value={form.drink_from}
            onChange={updateField("drink_from")}
            placeholder={vintageYear ? `e.g. ${vintageYear}` : "e.g. 2026"}
          />
        </div>
      </div>
      <div className="review-form__field">
        <label htmlFor="review-drink-to">Drink To</label>
        <div className="review-form__score-row">
          <input
            id="review-drink-to"
            type="number"
            min={form.drink_from === "" ? undefined : form.drink_from}
            value={form.drink_to}
            onChange={updateField("drink_to")}
            placeholder="e.g. 2035"
          />
        </div>
      </div>
      <div
        className="review-form__field"
        style={{ display: "flex", alignItems: "center", gap: 8 }}
      >
        <input
          id="review-drink-plus"
          type="checkbox"
          checked={form.drink_plus}
          onChange={updateField("drink_plus")}
        />
        <label htmlFor="review-drink-plus" style={{ margin: 0 }}>
          Drinking window can be extended (+)
        </label>
      </div>
      <div className="review-form__field">
        <span>Categories</span>
        <div className="category-checkboxes">
          {categories.map((category) => (
            <label key={category.id} className="category-checkbox">
              <input
                type="checkbox"
                checked={form.category_ids.includes(category.id)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setForm((prev) => ({
                    ...prev,
                    category_ids: checked
                      ? [...prev.category_ids, category.id]
                      : prev.category_ids.filter((id) => id !== category.id),
                  }));
                }}
              />
              {category.name}
            </label>
          ))}
        </div>
      </div>
      <div className="review-form__field">
        <span className="image-manager__label">Comment</span>
        <RichTextEditor
          value={form.comment}
          onChange={(html) => setForm((prev) => ({ ...prev, comment: html }))}
          placeholder="What did you think of this vintage?"
        />
      </div>

      <div className="review-form__field">
        <span className="image-manager__label">
          Images (click + to add, × to remove)
        </span>
        <ImageManager
          imageableType="review"
          images={existingImages}
          imageIds={existingImageIds}
          imageableId={isEditing ? review.id : null}
          onFilesChange={(files) => setImages(files)}
          onImagesChange={async () => {
            if (isEditing) {
              const reloaded = await reviewsApi.show(review.id);
              setExistingImages(reloaded.images || []);
              setExistingImageIds(reloaded.image_ids || []);
            }
          }}
        />
      </div>

      <div className="review-form__status-row">
        <button
          type="button"
          className={`review-form__status-btn ${form.status === "draft" ? "review-form__status-btn--active" : ""}`}
          onClick={() => setForm((prev) => ({ ...prev, status: "draft" }))}
        >
          Save as Draft
        </button>
        <button
          type="button"
          className={`review-form__status-btn ${form.status === "published" ? "review-form__status-btn--active" : ""}`}
          onClick={() => setForm((prev) => ({ ...prev, status: "published" }))}
        >
          Publish
        </button>
      </div>

      {error && <p className="review-form__error">{error}</p>}

      <div className="review-form__actions">
        <button
          className="auth-form__submit"
          type="submit"
          disabled={submitting}
        >
          {submitting
            ? "Saving..."
            : isEditing
              ? "Update Review"
              : "Submit Review"}
        </button>
        {onCancel && (
          <button
            type="button"
            className="review-form__cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default ReviewForm;
