import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  reviewsApi,
  winesApi,
  vintagesApi,
  categoriesApi,
} from "../services/api";
import { useCategoryOrder, sortCategoryNames } from "../hooks/useCategoryOrder";
import { useSelectedCategory } from "../hooks/useSelectedCategory";
import ReviewForm from "./ReviewForm";
import WineQuickCreate from "./WineQuickCreate";
import { useAuth } from "../contexts/AuthContext";
import { canManageWinesRole } from "../constants/roles";
import usePagedList from "../hooks/usePagedList";
import Pagination from "./Pagination";
import DOMPurify from "dompurify";

function excerpt(html, max = 50) {
  if (!html) return "";
  const stripped = html.replace(/<[^>]+>/g, "").trim();
  if (stripped.length <= max) return stripped;
  return stripped.slice(0, max) + "…";
}

function RichComment({ html }) {
  return (
    <div
      className="review-card__comment"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function Reviews() {
  const { user } = useAuth();
  const canSeeAll = canManageWinesRole(user);
  // Admins, Editors and Reviewers see the management filters and the
  // add button; Guests/Readers only see published reviews.
  const canManageContent = canManageWinesRole(user);
  const [myReviews, setMyReviews] = useState([]);
  const selectedCategory = useSelectedCategory();
  // Category name -> id map for resolving ?category= to category_id
  const [categoryNameToId, setCategoryNameToId] = useState({});

  useEffect(() => {
    categoriesApi
      .list()
      .then((cats) => {
        const map = {};
        (Array.isArray(cats) ? cats : []).forEach((c) => {
          map[c.name] = c.id;
        });
        setCategoryNameToId(map);
      })
      .catch(() => {});
  }, []);

  const categoryId = selectedCategory
    ? categoryNameToId[selectedCategory]
    : null;
  const isUncategorised = selectedCategory === "Uncategorised";

  // Paginated main feed (20 per page when a category is selected).
  // For "Uncategorised", send uncategorised=true instead of category_id.
  const feed = usePagedList({
    fetcher: (params) => reviewsApi.all(params),
    extraParams: isUncategorised
      ? { uncategorised: "true" }
      : categoryId
        ? { category_id: categoryId }
        : {},
    perPage: 20,
    enabled: Boolean(selectedCategory),
  });
  // When the selected category changes, hide the add form (user navigated away).
  useEffect(() => {
    setShowForm(false);
  }, [selectedCategory]);

  const loading = feed.loading;
  const [showForm, setShowForm] = useState(false);
  const [scope, setScope] = useState("all"); // "all" | "mine"
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingReview, setEditingReview] = useState(null);

  // Wine search state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null); // null = not searched yet
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Selection / creation flow
  const [selectedWine, setSelectedWine] = useState(null); // {id,name,slug,...,vintages}
  const [selectedVintageId, setSelectedVintageId] = useState("");
  const [showNewVintage, setShowNewVintage] = useState(false);
  const [newVintage, setNewVintage] = useState({ year: "", prompt: "" });
  const [creatingVintage, setCreatingVintage] = useState(false);
  const [vintageError, setVintageError] = useState(null);
  const [createdWineName, setCreatedWineName] = useState("");

  const searchTimerRef = useRef(null);

  // Reload the paginated feed (used after create/delete/status changes).
  const loadReviews = feed.reload;

  // All reviews, loaded once when no category is selected (grouped view).
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  async function loadGroups() {
    try {
      setLoadingGroups(true);
      const data = await reviewsApi.grouped();
      setGroups(Array.isArray(data) ? data : []);
    } catch {
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  }

  // Reload whichever feed is active (paginated when a category is selected,
  // the full grouped list otherwise).
  const reloadReviews = () => {
    if (selectedCategory) loadReviews();
    else loadGroups();
  };

  async function loadMyReviews() {
    try {
      const data = await reviewsApi.myReviews();
      setMyReviews(Array.isArray(data) ? data : []);
    } catch {
      setMyReviews([]);
    }
  }

  useEffect(() => {
    reloadReviews();
    if (user) loadMyReviews();
    else setMyReviews([]);
  }, [user, selectedCategory]);

  function canManage(review) {
    return Boolean(
      user && (canSeeAll || Number(review.user_id) === Number(user.id)),
    );
  }

  async function handleDelete(reviewId) {
    if (!window.confirm("Delete this review?")) return;
    try {
      await reviewsApi.destroy(reviewId);
      reloadReviews();
      loadMyReviews();
    } catch (err) {
      alert(err.message || "Failed to delete review");
    }
  }

  async function handleStatusChange(review, status) {
    try {
      await reviewsApi.update(review.id, {
        status,
        ...(status === "published"
          ? { published_at: new Date().toISOString() }
          : {}),
      });
      reloadReviews();
      loadMyReviews();
    } catch (err) {
      alert(
        err.message ||
          `Failed to ${status === "published" ? "publish" : "unpublish"}`,
      );
    }
  }

  async function performSearch(q) {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setSearchResults(null);
      setSelectedWine(null);
      return;
    }
    try {
      setSearching(true);
      setSearchError(null);
      const data = await winesApi.search(trimmed);
      setSearchResults(Array.isArray(data) ? data : []);
      setSelectedWine(null);
      setSelectedVintageId("");
      setShowNewVintage(false);
    } catch (err) {
      setSearchError(err.message || "Search failed");
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  }

  function handleSearchChange(e) {
    const value = e.target.value;
    setQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => performSearch(value), 300);
  }

  function handleSelectWine(wine) {
    setSelectedWine(wine);
    setSelectedVintageId("");
    setShowNewVintage(false);
    setVintageError(null);
  }

  async function handleCreateVintage(e) {
    e.preventDefault();
    setCreatingVintage(true);
    setVintageError(null);
    try {
      const created = await vintagesApi.create(selectedWine.slug, {
        year: parseInt(newVintage.year, 10),
        prompt: newVintage.prompt || null,
      });
      // Refresh the wine's vintage list with the new vintage and select it.
      const updatedWine = {
        ...selectedWine,
        vintages: [
          { id: created.id, year: created.year },
          ...(selectedWine.vintages || []),
        ],
      };
      setSelectedWine(updatedWine);
      setSelectedVintageId(created.id);
      setShowNewVintage(false);
      setNewVintage({ year: "", prompt: "" });
    } catch (err) {
      setVintageError(err.message || "Failed to create vintage");
    } finally {
      setCreatingVintage(false);
    }
  }

  function handleWineCreated({ slug, vintageId, name }) {
    setCreatedWineName(name);
    setSelectedWine({ slug, name, vintages: [{ id: vintageId }] });
    setSelectedVintageId(vintageId);
  }

  function closeForm() {
    setShowForm(false);
    setQuery("");
    setSearchResults(null);
    setSelectedWine(null);
    setSelectedVintageId("");
    setShowNewVintage(false);
    setNewVintage({ year: "", prompt: "" });
    setCreatedWineName("");
  }

  return (
    <main className="wine-app">
      <div className="wine-management__header">
        <div>
          <h1>{selectedCategory || "Reviews"}</h1>
          {selectedCategory && (
            <Link className="group-show-all" to="/reviews">
              ← Show all reviews
            </Link>
          )}
        </div>
        {canManageContent && (
          <button
            type="button"
            className="auth-form__submit"
            onClick={() => (showForm ? closeForm() : setShowForm(true))}
          >
            + Add Review
          </button>
        )}
      </div>

      {/* {!user && (
        <p className="wine-management__empty-state">
          Sign in to manage reviews
        </p>
      )} */}

      {showForm && (
        <div className="review-form-wrapper">
          {selectedVintageId && selectedWine ? (
            <>
              <div className="review-card review-card--draft">
                <div className="review-card__top">
                  <h3 className="review-card__title">{selectedWine.name}</h3>
                  <span className="review-card__status">
                    {selectedWine.vintages?.find(
                      (v) => String(v.id) === String(selectedVintageId),
                    )?.year || "Vintage"}
                  </span>
                </div>
              </div>
              <ReviewForm
                wineSlug={selectedWine.slug}
                wineName={selectedWine.name}
                vintageId={Number(selectedVintageId)}
                vintageNoVintage={
                  selectedWine.vintages?.find(
                    (v) => String(v.id) === String(selectedVintageId),
                  )?.no_vintage
                }
                vintageYear={
                  selectedWine.vintages?.find(
                    (v) => String(v.id) === String(selectedVintageId),
                  )?.year
                }
                onSaved={() => {
                  closeForm();
                  reloadReviews();
                }}
                onCancel={closeForm}
              />
            </>
          ) : (
            <div className="review-form">
              {/* Step 1: search for a wine */}
              {!selectedWine && (
                <>
                  <div className="review-form__field">
                    <label htmlFor="add-review-wine-search">
                      Search for a wine
                    </label>
                    <input
                      id="add-review-wine-search"
                      type="text"
                      value={query}
                      onChange={handleSearchChange}
                      placeholder="Start typing a wine name…"
                      autoFocus
                    />
                    {searching && (
                      <p className="wine-management__loading">Searching…</p>
                    )}
                    {searchError && (
                      <p className="review-form__error">{searchError}</p>
                    )}
                  </div>

                  {searchResults !== null && searchResults.length > 0 && (
                    <div className="review-form__field">
                      <span className="image-manager__label">
                        {searchResults.length} wine
                        {searchResults.length !== 1 ? "s" : ""} found — pick one
                      </span>
                      <div className="review-list">
                        {searchResults.map((wine) => (
                          <button
                            key={wine.slug}
                            type="button"
                            className="review-card"
                            onClick={() => handleSelectWine(wine)}
                          >
                            <div className="review-card__top">
                              <strong>{wine.name}</strong>
                              {wine.color && (
                                <span className="review-card__status">
                                  {wine.color}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {query.trim().length >= 2 &&
                    !searching &&
                    searchResults !== null &&
                    searchResults.length === 0 && (
                      <WineQuickCreate
                        defaultName={query.trim()}
                        onCreated={handleWineCreated}
                        onCancel={() => setSearchResults(null)}
                      />
                    )}
                </>
              )}

              {/* Step 2: vintage selection for the chosen (or new) wine */}
              {selectedWine && !selectedVintageId && (
                <>
                  <p className="wine-management__empty-state">
                    Reviewing <strong>{selectedWine.name}</strong>
                    {createdWineName ? " (just added)" : ""} — choose a vintage.
                  </p>

                  {(selectedWine.vintages || []).length > 0 ? (
                    <div className="review-form__field">
                      <span className="image-manager__label">Vintages</span>
                      <div className="review-list">
                        {selectedWine.vintages.map((vintage) => (
                          <button
                            key={vintage.id}
                            type="button"
                            className="review-card"
                            onClick={() => setSelectedVintageId(vintage.id)}
                          >
                            <div className="review-card__top">
                              <strong>{vintage.year}</strong>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="wine-management__empty-state">
                      No vintages yet for this wine.
                    </p>
                  )}

                  {showNewVintage ? (
                    <form
                      className="review-form"
                      onSubmit={handleCreateVintage}
                    >
                      <div className="review-form__field">
                        <label htmlFor="new-vintage-year">
                          New Vintage Year *
                        </label>
                        <input
                          id="new-vintage-year"
                          type="number"
                          required
                          min={1900}
                          max={new Date().getFullYear() + 5}
                          value={newVintage.year}
                          onChange={(e) =>
                            setNewVintage((prev) => ({
                              ...prev,
                              year: e.target.value,
                            }))
                          }
                          placeholder="e.g. 2021"
                        />
                      </div>
                      <div className="review-form__field">
                        <label htmlFor="new-vintage-prompt">
                          Prompt (optional)
                        </label>
                        <input
                          id="new-vintage-prompt"
                          type="text"
                          value={newVintage.prompt}
                          onChange={(e) =>
                            setNewVintage((prev) => ({
                              ...prev,
                              prompt: e.target.value,
                            }))
                          }
                          placeholder="Tasting notes for this vintage"
                        />
                      </div>
                      {vintageError && (
                        <p className="review-form__error">{vintageError}</p>
                      )}
                      <div className="review-form__actions">
                        <button
                          className="auth-form__submit"
                          type="submit"
                          disabled={creatingVintage}
                        >
                          {creatingVintage ? "Creating…" : "Create Vintage"}
                        </button>
                        <button
                          type="button"
                          className="review-form__cancel"
                          onClick={() => setShowNewVintage(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="review-form__actions">
                      <button
                        type="button"
                        className="auth-form__submit"
                        onClick={() => setShowNewVintage(true)}
                      >
                        + New Vintage
                      </button>
                      <button
                        type="button"
                        className="review-form__cancel"
                        onClick={() => {
                          setSelectedWine(null);
                          setSelectedVintageId("");
                        }}
                      >
                        Back to search
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {!showForm &&
        (loading ? (
          <p className="wine-management__loading">Loading reviews…</p>
        ) : (
          <>
            {/* Scope toggle: everyone's reviews vs my reviews */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {(!canManageContent
                ? []
                : [
                    { key: "all", label: "All Reviews" },
                    ...(user ? [{ key: "mine", label: "My Reviews" }] : []),
                  ]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className={`wine-segmented button ${scope === key ? "active" : ""}`}
                  style={{
                    border: "1px solid #d7c8bb",
                    borderRadius: "999px",
                    padding: "8px 14px",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    background: scope === key ? "#27615e" : "#fff",
                    color: scope === key ? "#f7fff9" : "#4f4440",
                    borderColor: scope === key ? "#27615e" : "#d7c8bb",
                  }}
                  onClick={() => setScope(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {canManageContent && (
              <>
                {/* Status filter: All / Draft / Published */}
                <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                  {["all", "draft", "published"].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      style={{
                        border: "1px solid #d7c8bb",
                        borderRadius: "999px",
                        padding: "6px 12px",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        background:
                          statusFilter === filter ? "#8a273c" : "#fff",
                        color: statusFilter === filter ? "#fff8f2" : "#4f4440",
                        borderColor:
                          statusFilter === filter ? "#8a273c" : "#d7c8bb",
                      }}
                      onClick={() => setStatusFilter(filter)}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </>
            )}

            <ReviewsList
              reviews={scope === "mine" ? myReviews : (selectedCategory ? feed.items : groups.flatMap((g) => g.reviews || []))}
              scope={scope}
              user={user}
              statusFilter={canManageContent ? statusFilter : "published"}
              canManage={canManage}
              editingReview={editingReview}
              setEditingReview={setEditingReview}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onSaved={() => {
                setEditingReview(null);
                reloadReviews();
                loadMyReviews();
              }}
            />

            {selectedCategory && scope === "all" && (
              <Pagination
                page={feed.page}
                totalPages={feed.totalPages}
                totalCount={feed.totalCount}
                onPageChange={feed.setPage}
              />
            )}
          </>
        ))}
    </main>
  );
}

function ReviewsList({
  reviews,
  scope,
  user,
  statusFilter,
  canManage,
  editingReview,
  setEditingReview,
  onDelete,
  onStatusChange,
  onSaved,
}) {
  const navigate = useNavigate();
  const categoryOrder = useCategoryOrder("sort_order_review");
  const selectedCategory = useSelectedCategory();
  const filtered = (
    statusFilter === "all"
      ? reviews
      : reviews.filter((r) => r?.status === statusFilter)
  ).filter((r) => {
    if (!selectedCategory) return true;
    const catNames = Array.isArray(r.categories)
      ? r.categories.map((c) => c.name)
      : [];
    if (catNames.length === 0) return selectedCategory === "Uncategorised";
    return catNames.includes(selectedCategory);
  });

  // Group by category
  const grouped = filtered.reduce((acc, review) => {
    const catNames = Array.isArray(review.categories)
      ? review.categories.map((c) => c.name)
      : [];
    const key = catNames.length > 0 ? catNames[0] : "Uncategorised";
    if (!acc[key]) acc[key] = [];
    acc[key].push(review);
    return acc;
  }, {});

  // Sort categories: by admin-defined sort order, Uncategorised last
  const sortedCategories = sortCategoryNames(
    Object.keys(grouped),
    categoryOrder,
  );

  if (scope === "mine" && !user) {
    return (
      <p className="wine-management__empty-state">
        Sign in to see your reviews.
      </p>
    );
  }
  if (filtered.length === 0) {
    return (
      <p className="wine-management__empty-state">
        {reviews.length === 0
          ? scope === "mine"
            ? "You haven't written any reviews yet."
            : "No reviews yet. Be the first!"
          : `No ${statusFilter} reviews.`}
      </p>
    );
  }

  // When a category is selected, show a flat list (no grouping).
  if (selectedCategory) {
    return (
      <div className="content-grid">
        {filtered.map((review) => (
          <div
            key={review.id}
            className="wine-management__card"
            onClick={() => navigate(`/reviews/${review.slug}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(`/reviews/${review.slug}`);
              }
            }}
          >
            <div className="wine-management__card-header">
              <h3>{review.title || "Untitled review"}</h3>
              <span
                className={`wine-management__color-badge wine-management__color-badge--${review.status}`}
              >
                {review.score}
              </span>
            </div>
            {(review.wine_name || review.vintage_year) && (
              <p className="wine-management__producer">
                {review.wine_name}
                {review.vintage_year ? ` ${review.vintage_year}` : ""}
              </p>
            )}
            {review.reviewer_name && (
              <p className="wine-management__region">
                by {review.reviewer_name}
              </p>
            )}
            {(review.drink_from != null || review.drink_to != null) && (
              <p className="wine-management__vintage-count">
                Drink {review.drink_from ?? ""}
                {review.drink_to != null ? `–${review.drink_to}` : ""}
                {review.drink_plus ? "+" : ""}
              </p>
            )}
            {excerpt(review.comment, 50) && (
              <p className="wine-management__region">
                {excerpt(review.comment, 50)}
              </p>
            )}
            {(Array.isArray(review.images) && review.images.length > 0
              ? review.images[0]
              : review.wine_image) && (
              <img
                src={
                  Array.isArray(review.images) && review.images.length > 0
                    ? review.images[0]
                    : review.wine_image
                }
                alt={review.title || review.wine_name || "review"}
                className="wine-management__thumb"
              />
            )}

            {canManage(review) && (
              <div
                className="wine-management__card-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="wine-management__edit-btn"
                  onClick={() => setEditingReview(review)}
                >
                  Edit
                </button>
                {review.status === "draft" ? (
                  <button
                    type="button"
                    className="wine-management__edit-btn"
                    onClick={() => onStatusChange(review, "published")}
                  >
                    Publish
                  </button>
                ) : (
                  <button
                    type="button"
                    className="wine-management__delete-btn"
                    onClick={() => onStatusChange(review, "draft")}
                  >
                    Unpublish
                  </button>
                )}
                <button
                  type="button"
                  className="wine-management__delete-btn"
                  onClick={() => onDelete(review.id)}
                  title="Delete review"
                >
                  ×
                </button>
              </div>
            )}

            {editingReview && editingReview.id === review.id && (
              <div
                className="review-form-wrapper"
                style={{ marginTop: 12 }}
                onClick={(e) => e.stopPropagation()}
              >
                <ReviewForm
                  wineSlug={review.wine_slug}
                  wineName={editingReview?.wine_name}
                  vintageId={review.vintage_id}
                  vintageYear={editingReview?.vintage_year}
                  review={editingReview}
                  onSaved={onSaved}
                  onCancel={() => setEditingReview(null)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // No category selected: grouped-by-category view.
  return (
    <div className="content-grid-groups">
      {sortedCategories.map((category) => (
        <section key={category} className="content-grid-group">
          <h2 className="content-grid-group__title">
            {category}
            <Link
              className="group-show-all"
              to={`/reviews?category=${encodeURIComponent(category)}`}
            >
              Show all ({grouped[category].length})
            </Link>
          </h2>
          <div className="content-grid">
            {grouped[category].slice(0, 12).map((review) => (
              <div
                key={review.id}
                className="wine-management__card"
                onClick={() => navigate(`/reviews/${review.slug}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/reviews/${review.slug}`);
                  }
                }}
              >
                <div className="wine-management__card-header">
                  <h3>{review.title || "Untitled review"}</h3>
                  <span
                    className={`wine-management__color-badge wine-management__color-badge--${review.status}`}
                  >
                    {review.score}
                  </span>
                </div>
                {(review.wine_name || review.vintage_year) && (
                  <p className="wine-management__region">
                    <Link
                      to={review.wine_slug ? `/wines/${review.wine_slug}` : "#"}
                      className="my-reviews__wine-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {review.wine_name || "Unknown wine"}
                      {review.vintage_year ? ` (${review.vintage_year})` : ""}
                    </Link>
                  </p>
                )}
                {review.reviewer_name && (
                  <p className="wine-management__region">
                    by {review.reviewer_name}
                  </p>
                )}
                {(review.drink_from != null || review.drink_to != null) && (
                  <p className="wine-management__vintage-count">
                    Drink {review.drink_from ?? ""}
                    {review.drink_to != null ? `–${review.drink_to}` : ""}
                    {review.drink_plus ? "+" : ""}
                  </p>
                )}
                {excerpt(review.comment, 50) && (
                  <p className="wine-management__region">
                    {excerpt(review.comment, 50)}
                  </p>
                )}
                {(Array.isArray(review.images) && review.images.length > 0
                  ? review.images[0]
                  : review.wine_image) && (
                  <img
                    src={
                      Array.isArray(review.images) && review.images.length > 0
                        ? review.images[0]
                        : review.wine_image
                    }
                    alt={review.title || review.wine_name || "review"}
                    className="wine-management__thumb"
                  />
                )}

                {canManage(review) && (
                  <div
                    className="wine-management__card-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="wine-management__edit-btn"
                      onClick={() => setEditingReview(review)}
                    >
                      Edit
                    </button>
                    {review.status === "draft" ? (
                      <button
                        type="button"
                        className="wine-management__edit-btn"
                        onClick={() => onStatusChange(review, "published")}
                      >
                        Publish
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="wine-management__delete-btn"
                        onClick={() => onStatusChange(review, "draft")}
                      >
                        Unpublish
                      </button>
                    )}
                    <button
                      type="button"
                      className="wine-management__delete-btn"
                      onClick={() => onDelete(review.id)}
                      title="Delete review"
                    >
                      ×
                    </button>
                  </div>
                )}

                {editingReview && editingReview.id === review.id && (
                  <div
                    className="review-form-wrapper"
                    style={{ marginTop: 12 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ReviewForm
                      wineSlug={review.wine_slug}
                      wineName={editingReview?.wine_name}
                      vintageId={review.vintage_id}
                      vintageYear={editingReview?.vintage_year}
                      review={editingReview}
                      onSaved={onSaved}
                      onCancel={() => setEditingReview(null)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default Reviews;
