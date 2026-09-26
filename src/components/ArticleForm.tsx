import { useEffect, useRef, useState } from "react";
import { articlesApi, categoriesApi, winesApi, producersApi, reviewsApi } from "../services/api";
import ImageManager from "./ImageManager";
import RichTextEditor from "./RichTextEditor";

function ArticleForm({ article, onSaved, onCancel }) {
  const isEditing = Boolean(article);

  const [form, setForm] = useState({
    title: article?.title || "",
    abstract: article?.abstract || "",
    body: article?.body || "",
    category_ids: (article?.categories || []).map((c) => c.id),
    tag_names: (article?.tags || []).join(", "),
    producer_ids: article?.producers?.map((p) => p.id) || [],
    status: article?.status || "draft",
  });
  // Selected vintages keep the wine context so reviews can be listed per vintage.
  const [selectedVintages, setSelectedVintages] = useState(
    (article?.vintages || []).map((v) => ({
      id: v.id,
      year: v.year,
      name: v.name,
      wine_slug: v.wine_slug,
    })),
  );
  const [linkedReviewIds, setLinkedReviewIds] = useState(
    (article?.reviews || [])
      .filter((r) => r.link_status === "published" || r.link_status === undefined)
      .map((r) => r.id),
  );
  const [categories, setCategories] = useState([]);
  const [producers, setProducers] = useState([]);
  const [wineQuery, setWineQuery] = useState("");
  const [wineResults, setWineResults] = useState([]);
  const [searchingWines, setSearchingWines] = useState(false);
  const [producerQuery, setProducerQuery] = useState("");
  const [producerResults, setProducerResults] = useState([]);
  const [searchingProducers, setSearchingProducers] = useState(false);
  const [reviewsByVintage, setReviewsByVintage] = useState({});
  const searchTimer = useRef(null);
  const producerSearchTimer = useRef(null);
  const [images, setImages] = useState(null);
  const [existingImages, setExistingImages] = useState(article?.images || []);
  const [existingImageIds, setExistingImageIds] = useState(article?.image_ids || []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => {});
    producersApi.list().then((data) => setProducers(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  // On edit, pre-existing vintages never run through toggleVintage, so their
  // reviews would stay "Loading…" forever. Fetch them once on mount.
  useEffect(() => {
    if (!isEditing || selectedVintages.length === 0) return;
    let cancelled = false;
    Promise.all(
      selectedVintages.map(async (v) => {
        if (!v.wine_slug) return { id: v.id, reviews: [] };
        try {
          const list = await reviewsApi.list(v.wine_slug, v.id);
          return { id: v.id, reviews: Array.isArray(list) ? list : [] };
        } catch {
          return { id: v.id, reviews: [] };
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      const next = {};
      results.forEach((r) => {
        next[r.id] = r.reviews;
      });
      setReviewsByVintage((prev) => ({ ...prev, ...next }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced wine search for the vintage picker.
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!wineQuery.trim()) {
      setWineResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearchingWines(true);
      try {
        const results = await winesApi.search(wineQuery.trim());
        setWineResults(Array.isArray(results) ? results : []);
      } catch {
        setWineResults([]);
      } finally {
        setSearchingWines(false);
      }
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [wineQuery]);

  // Debounced producer search for the producer picker.
  useEffect(() => {
    if (producerSearchTimer.current) clearTimeout(producerSearchTimer.current);
    if (!producerQuery.trim()) {
      setProducerResults([]);
      return;
    }
    producerSearchTimer.current = setTimeout(async () => {
      setSearchingProducers(true);
      try {
        const results = await producersApi.search(producerQuery.trim());
        setProducerResults(Array.isArray(results) ? results : []);
      } catch {
        setProducerResults([]);
      } finally {
        setSearchingProducers(false);
      }
    }, 300);
    return () => clearTimeout(producerSearchTimer.current);
  }, [producerQuery]);

  function isVintageSelected(id) {
    return selectedVintages.some((v) => v.id === id);
  }

  async function toggleVintage(vintage, wine) {
    if (isVintageSelected(vintage.id)) {
      setSelectedVintages((prev) => prev.filter((v) => v.id !== vintage.id));
      return;
    }
    setSelectedVintages((prev) => [
      ...prev,
      { id: vintage.id, year: vintage.year, name: `${wine.name} ${vintage.year}`, wine_slug: wine.slug },
    ]);
    // Load this vintage's published reviews so they can be linked.
    if (!reviewsByVintage[vintage.id]) {
      try {
        const list = await reviewsApi.list(wine.slug, vintage.id);
        setReviewsByVintage((prev) => ({
          ...prev,
          [vintage.id]: Array.isArray(list) ? list : [],
        }));
      } catch {
        setReviewsByVintage((prev) => ({ ...prev, [vintage.id]: [] }));
      }
    }
  }

  function toggleReview(reviewId) {
    setLinkedReviewIds((prev) =>
      prev.includes(reviewId)
        ? prev.filter((id) => id !== reviewId)
        : [...prev, reviewId],
    );
  }

  function isProducerSelected(id) {
    return form.producer_ids.includes(id);
  }

  function toggleProducer(producer) {
    const id = Number(producer.id);
    setForm((prev) => ({
      ...prev,
      producer_ids: isProducerSelected(id)
        ? prev.producer_ids.filter((pid) => pid !== id)
        : [...prev.producer_ids, id],
    }));
    setProducerQuery("");
    setProducerResults([]);
  }

  function removeProducer(id) {
    setForm((prev) => ({
      ...prev,
      producer_ids: prev.producer_ids.filter((pid) => pid !== id),
    }));
  }

  function updateField(field) {
    return (e) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };
  }

  async function save(payload) {
    if (isEditing) {
      return articlesApi.update(article.id, payload);
    }
    return articlesApi.create(payload);
  }

  function buildPayload() {
    return {
      title: form.title,
      abstract: form.abstract,
      body: form.body,
      status: form.status,
      category_ids: form.category_ids || [],
      tag_names: form.tag_names,
      vintage_ids: selectedVintages.map((v) => v.id),
      review_ids: linkedReviewIds,
      producer_ids: form.producer_ids,
    };
  }

  function buildFormData() {
    const formData = new FormData();
    formData.append("article[title]", form.title);
    formData.append("article[abstract]", form.abstract);
    formData.append("article[body]", form.body);
    formData.append("article[status]", form.status);
    (form.category_ids || []).forEach((id) => formData.append("article[category_ids][]", id));
    formData.append("article[tag_names]", form.tag_names);
    selectedVintages.forEach((v) => formData.append("article[vintage_ids][]", v.id));
    linkedReviewIds.forEach((id) => formData.append("article[review_ids][]", id));
    if (form.producer_ids.length > 0) {
      form.producer_ids.forEach((id) => formData.append("article[producer_ids][]", id));
    }
    Array.from(images).forEach((file) => formData.append("article[images][]", file));
    return formData;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // When new images are chosen, send multipart so Rails can attach them.
      const payload = images && images.length > 0 ? buildFormData() : buildPayload();
      await save(payload);
      onSaved();
    } catch (err) {
      setError(err.message || "Failed to save article");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <div className="review-form__field">
        <label htmlFor="article-title">Title</label>
        <input
          id="article-title"
          type="text"
          required
          value={form.title}
          onChange={updateField("title")}
          placeholder="Article title"
        />
      </div>

      <div className="review-form__field">
        <label htmlFor="article-abstract">Abstract</label>
        <textarea
          id="article-abstract"
          rows={3}
          value={form.abstract}
          onChange={updateField("abstract")}
          placeholder="A short summary shown in listings"
        />
      </div>

      <div className="review-form__field">
        <span className="image-manager__label">Body</span>
        <RichTextEditor
          value={form.body}
          onChange={(html) =>
            setForm((prev) => ({ ...prev, body: html }))
          }
          placeholder="Write your story…"
        />
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
        <label htmlFor="article-tags">Tags (comma separated)</label>
        <input
          id="article-tags"
          type="text"
          value={form.tag_names}
          onChange={updateField("tag_names")}
          placeholder="wine, region, vintage"
        />
      </div>

      <div className="review-form__field">
        <label htmlFor="article-wine-search">Wine vintages</label>
        <input
          id="article-wine-search"
          type="text"
          value={wineQuery}
          onChange={(e) => setWineQuery(e.target.value)}
          placeholder="Type to search wines…"
        />
        {searchingWines && <p className="review-card__comment">Searching…</p>}
        {!searchingWines && wineQuery.trim() && (
          <div className="wine-search-results">
            {wineResults.length === 0 && <p className="review-card__comment">No wines found.</p>}
            {wineResults.map((wine) => (
              <div key={wine.slug} className="wine-search-result">
                <strong>{wine.name}</strong>
                <div className="wine-search-result__vintages">
                  {(wine.vintages || []).length === 0 && (
                    <span className="review-card__comment">No vintages</span>
                  )}
                  {(wine.vintages || []).map((vintage) => (
                    <button
                      key={vintage.id}
                      type="button"
                      className={`review-form__status-btn ${isVintageSelected(vintage.id) ? "review-form__status-btn--active" : ""}`}
                      onClick={() => toggleVintage(vintage, wine)}
                    >
                      {vintage.year}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedVintages.length > 0 && (
          <div className="selected-vintages">
            <p className="review-card__comment">Selected vintages (click to remove):</p>
            <div className="wine-search-result__vintages">
              {selectedVintages.map((vintage) => (
                <button
                  key={vintage.id}
                  type="button"
                  className="review-form__status-btn review-form__status-btn--active"
                  onClick={() =>
                    setSelectedVintages((prev) => prev.filter((v) => v.id !== vintage.id))
                  }
                >
                  {vintage.name || `${vintage.wine_slug} ${vintage.year}`} ✕
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="review-form__field">
        <span className="image-manager__label">
          Reviews (optional — pick from the selected vintages)
        </span>
        {selectedVintages.length === 0 && (
          <p className="review-card__comment">Select some vintages above to see their reviews.</p>
        )}
        {selectedVintages.map((vintage) => {
          const list = reviewsByVintage[vintage.id];
          return (
            <div key={vintage.id} className="vintage-reviews">
              <strong>{vintage.name}</strong>
              {list === undefined && <p className="review-card__comment">Loading reviews…</p>}
              {Array.isArray(list) && list.length === 0 && (
                <p className="review-card__comment">No reviews for this vintage.</p>
              )}
              {Array.isArray(list) &&
                list.map((review) => (
                  <label key={review.id} style={{ display: "block", fontWeight: 400 }}>
                    <input
                      type="checkbox"
                      checked={linkedReviewIds.includes(review.id)}
                      onChange={() => toggleReview(review.id)}
                    />{" "}
                    {review.title || "Untitled"} (score {review.score})
                  </label>
                ))}
            </div>
          );
        })}
      </div>

      <div className="review-form__field">
        <label htmlFor="article-producers">Producers</label>
        <div className="producer-picker">
          <input
            type="text"
            id="article-producers"
            value={producerQuery}
            onChange={(e) => setProducerQuery(e.target.value)}
            placeholder="Search producers to add…"
            autoComplete="off"
          />
          {searchingProducers && <p className="wine-management__loading">Searching…</p>}
          {producerResults.length > 0 && (
            <div className="review-list">
              {producerResults.map((producer) => (
                <button
                  key={producer.id}
                  type="button"
                  className="review-card"
                  onClick={() => toggleProducer(producer)}
                >
                  <div className="review-card__top">
                    <strong>{producer.name}</strong>
                  </div>
                  {producer.address && (
                    <span className="review-card__comment">{producer.address}</span>
                  )}
                </button>
              ))}
            </div>
          )}
          {form.producer_ids.length > 0 && (
            <div className="producer-picker__chips">
              {form.producer_ids.map((id) => {
                const producer = producers.find((p) => Number(p.id) === Number(id));
                return (
                  <span key={id} className="vintage-chip">
                    <strong>{producer ? producer.name : `Producer #${id}`}</strong>
                    <button
                      type="button"
                      className="vintage-chip__remove"
                      onClick={() => removeProducer(id)}
                      title="Remove producer"
                    >
                      &times;
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="review-form__field">
        <span className="image-manager__label">Images (top of the article — click + to add, × to remove)</span>
        <ImageManager
          imageableType="article"
          images={existingImages}
          imageIds={existingImageIds}
          imageableId={isEditing ? article.id : null}
          onFilesChange={(files) => setImages(files)}
          onImagesChange={async () => {
            if (isEditing) {
              const reloaded = await articlesApi.show(article.id);
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
        <button className="auth-form__submit" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : isEditing ? "Update Article" : "Create Article"}
        </button>
        {onCancel && (
          <button type="button" className="review-form__cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default ArticleForm;