import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { reviewsApi, categoriesApi } from "../services/api";
import { useCategoryOrder, sortCategoryNames } from "../hooks/useCategoryOrder";
import ReviewForm from "./ReviewForm";
import WineQuickCreate from "./WineQuickCreate";
import { useAuth } from "../contexts/AuthContext";
import { canManageWinesRole } from "../constants/roles";
import Pagination from "./Pagination";
import { useSearch } from "../hooks/useSearch";
import type { SearchParams } from "../services/searchParams";
import type { Review } from "../types/review";
import type { ReviewGroup } from "../types/api";
import { SearchBar, SearchHighlight } from "./search";
import styles from "./ReviewsSearch.module.css";

function excerpt(html: string | null | undefined, max = 50) {
  if (!html) return "";
  const stripped = html.replace(/<[^>]+>/g, "").trim();
  if (stripped.length <= max) return stripped;
  return stripped.slice(0, max) + "…";
}

interface InlineReviewEditProps {
  review: Review;
  editingReview: Review | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * The inline edit form rendered inside a card when its Edit button is pressed.
 * `ReviewForm` owns its own field state, so this only has to decide whether the
 * card is the one being edited.
 */
function InlineReviewEdit({
  review,
  editingReview,
  onClose,
  onSaved,
}: InlineReviewEditProps) {
  if (!editingReview || editingReview.id !== review.id) return null;
  return (
    <div
      className="review-form-wrapper"
      style={{ marginTop: 12 }}
      onClick={(e) => e.stopPropagation()}
    >
      <ReviewForm
        review={editingReview}
        vintageYear={editingReview.vintage_year ?? null}
        vintageNoVintage={editingReview.vintage_no_vintage === true}
        onSaved={onSaved}
        onCancel={onClose}
      />
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
  query: string;
  canManage: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  /** Rendered inside the card, used for the inline edit form. */
  children?: ReactNode;
}

/**
 * A single review card in the category grid. Mirrors the `wine-management__card`
 * markup used by the other grouped listings, so the grid/typography match.
 */
function ReviewCard({
  review,
  query,
  canManage,
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

      {image && (
        <img
          src={image}
          alt={review.title || review.wine_name || "review"}
          className="wine-management__thumb"
        />
      )}

      {canManage && (
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

function Reviews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canSeeAll = canManageWinesRole(user);
  const canManageContent = canManageWinesRole(user);
  const categoryOrder = useCategoryOrder("sort_order_review");
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [mineLoaded, setMineLoaded] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category") ?? null;
  const [categoryNameToId, setCategoryNameToId] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    categoriesApi
      .list()
      .then((cats) => {
        const map: Record<string, number> = {};
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

  // Content managers can act on any review; everyone else only on their own.
  function canManage(review: Review) {
    return Boolean(
      user && (canSeeAll || Number(review.user_id) === Number(user.id)),
    );
  }

  // Scope and status filters
  const [scope, setScope] = useState("all"); // "all" | "mine"
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "draft" | "published"

  // Bumped by `reload()` after a create/edit/delete. It is part of the fetch
  // callback's identity, so changing it forces a refetch even when the page
  // number and filters are unchanged.
  const [reloadToken, setReloadToken] = useState(0);

  // Fetch function for useSearch. Every non-search filter is passed as a
  // primitive dependency so the callback identity stays stable between
  // renders; otherwise useSearch would refetch on every single render.
  const fetchReviews = useCallback(
    async (params: SearchParams) => {
      const merged = {
        scope,
        status: statusFilter === "all" ? undefined : statusFilter,
        ...(isUncategorised
          ? { uncategorised: "true" }
          : categoryId
            ? { category_id: categoryId }
            : {}),
        ...params,
      };
      if (merged.per_page === undefined) merged.per_page = 20;
      return reviewsApi.all(merged);
    },
    [scope, statusFilter, isUncategorised, categoryId, reloadToken],
  );

  const {
    data,
    loading: listLoading,
    params,
    setPage,
    setSort,
    setFilter,
    removeFilter,
  } = useSearch(fetchReviews, {
    page: 1,
    per_page: 20,
    sort: "relevance",
  });

  // All reviews grouped by category. The paginated feed only backs the
  // "category selected" listing; with no category selected the page renders
  // the grouped view instead (cards capped at 12 per section).
  const [groups, setGroups] = useState<ReviewGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const loadGroups = useCallback(async () => {
    try {
      setLoadingGroups(true);
      const rows = await reviewsApi.grouped();
      setGroups(Array.isArray(rows) ? rows : []);
    } catch {
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  // Load the grouped view whenever the listing is not scoped to one category.
  useEffect(() => {
    if (selectedCategory) return;
    void loadGroups();
  }, [selectedCategory, loadGroups]);

  // The grouped view has its own loader, so either one counts as "loading".
  const loading =
    listLoading || (!selectedCategory && scope !== "mine" && loadingGroups);

  // Refetch the active listing. Bumping the token guarantees a request even
  // when the page number is already 1 and no filter changed.
  const reload = () => {
    setReloadToken((token) => token + 1);
    setPage(1);
    if (!selectedCategory) void loadGroups();
  };

  // Quick-create state for the add-review form.
  const [selectedWine, setSelectedWine] = useState<{
    slug?: string;
    name?: string;
  } | null>(null);
  const [selectedVintage, setSelectedVintage] = useState<{
    id?: number;
    year?: number | string;
    no_vintage?: boolean;
  } | null>(null);
  // Add-review form visibility and the review currently being edited.
  // `ReviewForm` owns its own field state, so only the wine selection and the
  // review being edited need to live here.
  const [showForm, setShowForm] = useState(false);
  const toggleFilterDrawer = () => {
    // Placeholder for filter drawer toggle logic
  };
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const clearWineSelection = () => {
    setSelectedWine(null);
    setSelectedVintage(null);
  };

  // WineQuickCreate hands back the slug/id of the wine it just created.
  const handleWineCreated = ({
    slug,
    vintageId,
    name,
  }: {
    slug: string;
    vintageId: number;
    name: string;
  }) => {
    setSelectedWine({ slug, name });
    setSelectedVintage({ id: vintageId });
  };

  const closeForm = () => {
    setShowForm(false);
    clearWineSelection();
  };
  const cancelForm = () => {
    setShowForm(false);
    clearWineSelection();
  };

  const onSaved = () => {
    closeForm();
    void loadMyReviews();
    reload();
  };

  const loadMyReviews = useCallback(async () => {
    setMineLoaded(false);
    try {
      const resp = await reviewsApi.myReviews();
      setMyReviews(Array.isArray(resp) ? resp : []);
    } catch (err) {
      console.error("Failed to fetch my reviews", err);
      setMyReviews([]);
    } finally {
      setMineLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadMyReviews();
  }, []);

  // Status change and delete handlers
  const onStatusChange = async (review: Review, newStatus: string) => {
    try {
      await reviewsApi.update(review.id, { status: newStatus });
      if (scope === "mine") {
        setMyReviews((prev) =>
          prev.map((r) =>
            r.id === review.id ? { ...r, status: newStatus } : r,
          ),
        );
      }
      reload();
    } catch (err) {
      console.error("Failed to update review status", err);
    }
  };

  const onDelete = async (id: number) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await reviewsApi.destroy(id);
      if (scope === "mine") {
        setMyReviews((prev) => prev.filter((r) => r.id !== id));
      }
      reload();
    } catch (err) {
      console.error("Failed to delete review", err);
    }
  };

  // Active-filter chips shown in the search bar.
  const activeFilters: Record<string, string> = {};
  if (scope !== "all") activeFilters.scope = scope;
  if (statusFilter !== "all") activeFilters.status = statusFilter;
  if (selectedCategory) activeFilters.category = selectedCategory;

  // Each chip is backed by a different owner, so removal is dispatched per key
  // rather than funnelled through the search hook's params.
  const handleRemoveFilter = (key: string) => {
    if (key === "scope") return setScope("all");
    if (key === "status") return setStatusFilter("all");
    if (key === "sort") return setSort("relevance");
    if (key === "category") {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("category");
        return next;
      });
      return;
    }
    removeFilter(key as keyof SearchParams);
  };
  const quickCreateProps = {
    ...(selectedWine?.slug != null ? { wineSlug: selectedWine.slug } : {}),
    ...(selectedWine?.name != null ? { wineName: selectedWine.name } : {}),
    ...(selectedVintage?.id != null ? { vintageId: selectedVintage.id } : {}),
  };

  return (
    <main className="wine-app">
      <div className="wine-management__header">
        <div>
          <h1>Reviews</h1>
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

      {showForm && (
        <div className="review-form-wrapper">
          <WineQuickCreate
            onCreated={handleWineCreated}
            onCancel={cancelForm}
          />
          <ReviewForm
            {...quickCreateProps}
            vintageNoVintage={selectedVintage?.no_vintage === true}
            vintageYear={
              typeof selectedVintage?.year === "number"
                ? selectedVintage.year
                : null
            }
            onSaved={onSaved}
            onCancel={cancelForm}
          />
        </div>
      )}

      {/* Search bar */}
      <SearchBar
        placeholder="Search reviews…"
        onSearch={setFilter.bind(null, "query")}
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        sortOptions={[
          { value: "relevance", label: "Relevance" },
          { value: "recent", label: "Most recent" },
          { value: "oldest", label: "Oldest" },
          { value: "score_high", label: "Score high→low" },
          { value: "score_low", label: "Score low→high" },
        ]}
        currentSort={(params.sort as string) ?? "relevance"}
        onSortChange={setSort}
        showFilterButton={true}
        onFilterToggle={toggleFilterDrawer}
      />

      
      {!showForm && loading ? (
        <p className="wine-management__loading">Loading reviews…</p>
      ) : (
        <>
          {/* Scope: everyone's reviews vs my reviews */}
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
                onClick={() => setScope(key as "all" | "mine")}
              >
                {label}
              </button>
            ))}
          </div>

          {canManageContent && (
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
                    background: statusFilter === filter ? "#8a273c" : "#fff",
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
          )}

          {(() => {
            // Guests/Readers only ever see published reviews.
            const effectiveScope = canManageContent ? scope : "all";
            const effectiveStatus = canManageContent
              ? statusFilter
              : "published";
            const source: Review[] =
              effectiveScope === "mine"
                ? myReviews
                : true
                  ? (data?.data ?? [])
                  : groups.flatMap((group) =>
                      Array.isArray(group.reviews) ? group.reviews : [],
                    );
            const filtered = (
              effectiveStatus === "all"
                ? source
                : source.filter((r) => r?.status === effectiveStatus)
            ).filter((r) => {
              if (!selectedCategory) return true;
              const catNames = Array.isArray(r.categories)
                ? r.categories.map((c) => c.name)
                : [];
              if (catNames.length === 0)
                return selectedCategory === "Uncategorised";
              return catNames.includes(selectedCategory);
            });

            // Deduplicate by review id (guards against eager-load joins in the
            // API producing one row per review→category association).
            const seen = new Set<number>();
            const deduped = filtered.filter((r) => {
              if (seen.has(r.id)) return false;
              seen.add(r.id);
              return true;
            });

            if (effectiveScope === "mine" && !user) {
              return (
                <p className="wine-management__empty-state">
                  Sign in to see your reviews.
                </p>
              );
            }
            if (effectiveScope === "mine" && !mineLoaded) {
              return (
                <p className="wine-management__loading">Loading reviews…</p>
              );
            }
            if (deduped.length === 0) {
              return (
                <p className="wine-management__empty-state">
                  {params.query
                    ? `No reviews matching “${params.query}”.`
                    : source.length === 0
                      ? effectiveScope === "mine"
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
                  {deduped.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      query={String(params.query ?? "")}
                      onOpen={() => navigate(`/reviews/${review.slug}`)}
                      canManage={canManage(review)}
                      onEdit={() => setEditingReview(review)}
                      onToggleStatus={() =>
                        onStatusChange(
                          review,
                          review.status === "draft" ? "published" : "draft",
                        )
                      }
                      onDelete={() => onDelete(review.id)}
                    >
                      <InlineReviewEdit
                        review={review}
                        editingReview={editingReview}
                        onSaved={onSaved}
                        onClose={() => setEditingReview(null)}
                      />
                    </ReviewCard>
                  ))}
                </div>
              );
            }

            // Group by category — a review can belong to multiple categories,
            // so it is listed under every category it is tagged with.
            const grouped = deduped.reduce(
              (acc, review) => {
                const catNames = Array.isArray(review.categories)
                  ? review.categories.map((c) => c.name)
                  : [];
                if (catNames.length === 0) {
                  if (!acc["Uncategorised"]) acc["Uncategorised"] = [];
                  acc["Uncategorised"].push(review);
                } else {
                  catNames.forEach((name) => {
                    if (!acc[name]) acc[name] = [];
                    acc[name].push(review);
                  });
                }
                return acc;
              },
              {} as Record<string, Review[]>,
            );

            // True per-category totals from the grouped API (the rendered cards
            // are capped at 12 per group, so counts can't be derived from
            // `grouped`).
            const groupCounts =
              effectiveScope === "mine" || selectedCategory
                ? null
                : Object.fromEntries(
                    groups.map((g) => [
                      g.category,
                      g.count ?? (g.reviews || []).length,
                    ]),
                  );

            // Sort categories: by admin-defined sort order, Uncategorised last
            const sortedCategories = sortCategoryNames(
              Object.keys(grouped),
              categoryOrder,
            );

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
                        Show all (
                        {groupCounts?.[category] ??
                          grouped[category]?.length ??
                          0}
                        )
                      </Link>
                    </h2>
                    <div className="content-grid">
                      {(grouped[category] ?? []).slice(0, 12).map((review) => (
                        <ReviewCard
                          key={review.id}
                          review={review}
                          query={String(params.query ?? "")}
                          onOpen={() => navigate(`/reviews/${review.slug}`)}
                          canManage={canManage(review)}
                          onEdit={() => setEditingReview(review)}
                          onToggleStatus={() =>
                            onStatusChange(
                              review,
                              review.status === "draft" ? "published" : "draft",
                            )
                          }
                          onDelete={() => onDelete(review.id)}
                        >
                          <InlineReviewEdit
                            review={review}
                            editingReview={editingReview}
                            onSaved={onSaved}
                            onClose={() => setEditingReview(null)}
                          />
                        </ReviewCard>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            );
          })()}

          {selectedCategory && (
            <Pagination
              page={params.page ?? 1}
              totalPages={data?.totalPages ?? 1}
              totalCount={data?.total ?? 0}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </main>
  );
}

export default Reviews;
