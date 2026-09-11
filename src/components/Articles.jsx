import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { articlesApi, categoriesApi } from "../services/api";
import { useCategoryOrder, sortCategoryNames } from "../hooks/useCategoryOrder";
import { useSelectedCategory } from "../hooks/useSelectedCategory";
import ArticleForm from "./ArticleForm";
import { useAuth } from "../contexts/AuthContext";
import { canManageWinesRole } from "../constants/roles";
import usePagedList from "../hooks/usePagedList";
import Pagination from "./Pagination";

function excerpt(text, max = 50) {
  if (!text) return "";
  // Strip HTML tags for a plain-text excerpt
  const stripped = text.replace(/<[^>]+>/g, "").trim();
  if (stripped.length <= max) return stripped;
  return stripped.slice(0, max) + "…";
}

function Articles() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canSeeAll = canManageWinesRole(user);
  // Admins, Editors and Reviewers see the management filters and the
  // add button; Guests/Readers only see published articles.
  const canManageContent = canManageWinesRole(user);
  const categoryOrder = useCategoryOrder("sort_order_article");
  const selectedCategory = useSelectedCategory();
  const [myArticles, setMyArticles] = useState([]);
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
    fetcher: (params) => articlesApi.list(params),
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

  // Reload the paginated feed (used after create/delete/status changes).
  const loadArticles = feed.reload;

  // All articles, loaded once when no category is selected (grouped view).
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  async function loadGroups() {
    try {
      setLoadingGroups(true);
      const data = await articlesApi.grouped();
      setGroups(Array.isArray(data) ? data : []);
    } catch {
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  }

  // Reload whichever feed is active (paginated when a category is selected,
  // the full grouped list otherwise).
  const reloadArticles = () => {
    if (selectedCategory) loadArticles();
    else loadGroups();
  };

  const loadMyArticles = useCallback(async () => {
    try {
      const data = await articlesApi.myArticles();
      setMyArticles(Array.isArray(data) ? data : []);
    } catch {
      setMyArticles([]);
    }
  }, []);

  useEffect(() => {
    reloadArticles();
    if (user) loadMyArticles();
    else setMyArticles([]);
  }, [user, selectedCategory]);

  function canManage(article) {
    return Boolean(
      user && (canSeeAll || Number(article.user_id) === Number(user.id)),
    );
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this article?")) return;
    try {
      await articlesApi.destroy(id);
      reloadArticles();
    } catch (err) {
      alert(err.message || "Failed to delete article");
    }
  }

  async function togglePublish(article) {
    try {
      await articlesApi.update(article.id, {
        status: article.status === "draft" ? "published" : "draft",
      });
      reloadArticles();
    } catch (err) {
      alert(err.message || "Failed to update article");
    }
  }

  return (
    <main className="wine-app">
      <div className="wine-management__header">
        <div>
          <h1>{selectedCategory || "Articles"}</h1>
          {selectedCategory && (
            <Link className="group-show-all" to="/articles">
              ← Show all articles
            </Link>
          )}
        </div>
        {canManageContent && (
          <button
            type="button"
            className="auth-form__submit"
            onClick={() => setShowForm((prev) => !prev)}
          >
            {showForm ? "Close" : "+ Add Article"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="review-form-wrapper">
          <ArticleForm
            onSaved={() => {
              setShowForm(false);
              reloadArticles();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {!showForm &&
        (loading ? (
          <p className="wine-management__loading">Loading articles…</p>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {(!canManageContent
                ? []
                : [
                    { key: "all", label: "All Articles" },
                    ...(user ? [{ key: "mine", label: "My Articles" }] : []),
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

            {(() => {
              // Guests/Readers only ever see published articles.
              const effectiveScope = canManageContent ? scope : "all";
              const effectiveStatus = canManageContent
                ? statusFilter
                : "published";
              const source =
                effectiveScope === "mine"
                  ? myArticles
                  : selectedCategory
                    ? feed.items
                    : groups.flatMap((g) => g.articles);
              const filtered = (
                effectiveStatus === "all"
                  ? source
                  : source.filter((a) => a?.status === effectiveStatus)
              ).filter((a) => {
                if (!selectedCategory) return true;
                const catNames = Array.isArray(a.categories)
                  ? a.categories.map((c) => c.name)
                  : [];
                if (catNames.length === 0)
                  return selectedCategory === "Uncategorised";
                return catNames.includes(selectedCategory);
              });

              // Deduplicate by article id (guards against eager-load joins in the API
              // producing one row per article→category association).
              const seen = new Set();
              const deduped = filtered.filter((a) => {
                if (seen.has(a.id)) return false;
                seen.add(a.id);
                return true;
              });

              if (effectiveScope === "mine" && !user) {
                return (
                  <p className="wine-management__empty-state">
                    Sign in to see your articles.
                  </p>
                );
              }
              if (deduped.length === 0) {
                return (
                  <p className="wine-management__empty-state">
                    {source.length === 0
                      ? scope === "mine"
                        ? "You haven't written any articles yet."
                        : "No articles yet. Write the first one!"
                      : `No ${statusFilter} articles.`}
                  </p>
                );
              }

              // When a category is selected, show a flat list (no grouping).
              if (selectedCategory) {
                return (
                  <div className="content-grid">
                    {deduped.map((article) => (
                      <div
                        key={article.id}
                        className="wine-management__card"
                        onClick={() => navigate(`/articles/${article.slug}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(`/articles/${article.slug}`);
                          }
                        }}
                      >
                        {Array.isArray(article.images) &&
                          article.images.length > 0 && (
                            <img
                              src={article.images[0]}
                              alt={article.title}
                              className="wine-management__thumb"
                            />
                          )}
                        <div className="wine-management__card-header">
                          <h3>{article.title}</h3>
                          {canManageContent && (
                            <span
                              className={`wine-management__color-badge wine-management__color-badge--${article.status}`}
                            >
                              {article.status}
                            </span>
                          )}
                        </div>
                        <p className="wine-management__region">{`by ${article.author_name}`}</p>
                        {Array.isArray(article.tags) &&
                          article.tags.length > 0 && (
                            <p className="wine-management__vintage-count">
                              Tags: {article.tags.join(", ")}
                            </p>
                          )}
                        {excerpt(article.body, 50) && (
                          <p className="wine-management__region">
                            {excerpt(article.body, 50)}
                          </p>
                        )}

                        {canManage(article) && (
                          <div
                            className="wine-management__card-actions"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link
                              to={`/articles/${article.slug}/edit`}
                              className="wine-management__edit-btn"
                            >
                              Edit
                            </Link>
                            <button
                              type="button"
                              className={
                                article.status === "draft"
                                  ? "wine-management__edit-btn"
                                  : "wine-management__delete-btn"
                              }
                              onClick={() => togglePublish(article)}
                            >
                              {article.status === "draft"
                                ? "Publish"
                                : "Unpublish"}
                            </button>
                            <button
                              type="button"
                              className="wine-management__delete-btn"
                              onClick={() => handleDelete(article.id)}
                              title="Delete article"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              }

              // Group by category — an article can belong to multiple categories,
              // so it is listed under every category it is tagged with.
              const grouped = deduped.reduce((acc, article) => {
                const catNames = Array.isArray(article.categories)
                  ? article.categories.map((c) => c.name)
                  : [];
                if (catNames.length === 0) {
                  if (!acc["Uncategorised"]) acc["Uncategorised"] = [];
                  acc["Uncategorised"].push(article);
                } else {
                  catNames.forEach((name) => {
                    if (!acc[name]) acc[name] = [];
                    acc[name].push(article);
                  });
                }
                return acc;
              }, {});

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
                          to={`/articles?category=${encodeURIComponent(category)}`}
                        >
                          Show all ({grouped[category].length})
                        </Link>
                      </h2>
                      <div className="content-grid">
                        {grouped[category].slice(0, 12).map((article) => (
                          <div
                            key={article.id}
                            className="wine-management__card"
                            onClick={() => navigate(`/articles/${article.slug}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                navigate(`/articles/${article.slug}`);
                              }
                            }}
                          >
                            {Array.isArray(article.images) &&
                              article.images.length > 0 && (
                                <img
                                  src={article.images[0]}
                                  alt={article.title}
                                  className="wine-management__thumb"
                                />
                              )}
                            <div className="wine-management__card-header">
                              <h3>{article.title}</h3>
                              {canManageContent && (
                                <span
                                  className={`wine-management__color-badge wine-management__color-badge--${article.status}`}
                                >
                                  {article.status}
                                </span>
                              )}
                            </div>
                            <p className="wine-management__region">{`by ${article.author_name}`}</p>
                            {Array.isArray(article.tags) &&
                              article.tags.length > 0 && (
                                <p className="wine-management__vintage-count">
                                  Tags: {article.tags.join(", ")}
                                </p>
                              )}
                            {excerpt(article.body, 50) && (
                              <p className="wine-management__region">
                                {excerpt(article.body, 50)}
                              </p>
                            )}

                            {canManage(article) && (
                              <div
                                className="wine-management__card-actions"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Link
                                  to={`/articles/${article.slug}/edit`}
                                  className="wine-management__edit-btn"
                                >
                                  Edit
                                </Link>
                                <button
                                  type="button"
                                  className={
                                    article.status === "draft"
                                      ? "wine-management__edit-btn"
                                      : "wine-management__delete-btn"
                                  }
                                  onClick={() => togglePublish(article)}
                                >
                                  {article.status === "draft"
                                    ? "Publish"
                                    : "Unpublish"}
                                </button>
                                <button
                                  type="button"
                                  className="wine-management__delete-btn"
                                  onClick={() => handleDelete(article.id)}
                                  title="Delete article"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              );
            })()}

            {selectedCategory && scope !== "mine" && (
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

export default Articles;
