import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { winesApi, categoriesApi } from "../services/api";
import { useSelectedCategory } from "../hooks/useSelectedCategory";
import { useAuth } from "../contexts/AuthContext";
import { canManageWinesRole } from "../constants/roles";
import usePagedList from "../hooks/usePagedList";
import Pagination from "./Pagination";
import WineAdvancedSearch from "./WineAdvancedSearch";

function WineList() {
  const { user } = useAuth();
  // Admins, Reviewers and Editors may add, edit or delete wines.
  const canManageWines = canManageWinesRole(user);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedProducer = searchParams.get("producer");
  const selectedCategory = useSelectedCategory();

  // --- Advanced search state ---------------------------------------------
  // null => normal browsing; an object => show the advanced-search results.
  const [searchFilters, setSearchFilters] = useState(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const advancedPaged = usePagedList({
    fetcher: (params) => winesApi.advancedSearch(params),
    extraParams: searchFilters || {},
    perPage: 20,
    enabled: searchFilters !== null,
    paramKey: "asearch_page",
  });

  function handleAdvancedSearch(filters) {
    setSearchFilters(filters);
  }

  function handleAdvancedClear() {
    setSearchFilters(null);
    if (!selectedCategory) loadGroups();
  }

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

  // Paginated list when a category is selected (server-side filtering).
  // For "Uncategorised", send uncategorised=true instead of category_id.
  const pagedWines = usePagedList({
    fetcher: (params) => winesApi.list(params),
    extraParams: isUncategorised
      ? { uncategorised: "true" }
      : categoryId
        ? { category_id: categoryId }
        : {},
    perPage: 20,
    enabled: Boolean(selectedCategory),
  });

  // Load server-side grouped wines (12 per category) for the no-category view.
  useEffect(() => {
    if (!selectedCategory) {
      loadGroups();
    } else {
      setLoading(false);
    }
  }, [selectedCategory]);

  async function loadGroups() {
    try {
      setLoading(true);
      setError(null);
      const data = await winesApi.grouped();
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load wines");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(wine, e) {
    e.stopPropagation();
    if (
      !window.confirm(`Delete "${wine.name}"? This action cannot be undone.`)
    ) {
      return;
    }
    try {
      await winesApi.destroy(wine.slug);
      if (selectedCategory) {
        pagedWines.reload();
      } else {
        // Re-fetch the grouped view (cheap: only 12 per category).
        loadGroups();
      }
    } catch (err) {
      alert(err.message || "Failed to delete wine");
    }
  }

  if (loading) {
    return (
      <div className="wine-app">
        <p className="wine-management__loading">Loading wines…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wine-app">
        <p className="wine-management__error">{error}</p>
        <button className="auth-form__submit" onClick={loadGroups}>
          Retry
        </button>
      </div>
    );
  }

  // --- Advanced search results: flat paginated list -----------------------
  if (searchFilters !== null) {
    return (
      <div className="wine-app">
        <div className="wine-management__header">
          <div>
            <p className="wine-kicker">Cellar</p>
            <h1>Advanced Search Results</h1>
          </div>
        </div>

        <WineAdvancedSearch
          open={advancedOpen}
          onToggleOpen={setAdvancedOpen}
          onSearch={handleAdvancedSearch}
          onClear={handleAdvancedClear}
        />

        {advancedPaged.loading ? (
          <p className="wine-management__loading">Searching wines…</p>
        ) : advancedPaged.error ? (
          <p className="wine-management__error">{advancedPaged.error}</p>
        ) : advancedPaged.items.length === 0 ? (
          <div className="wine-management__empty">
            <p>No wines match your search criteria.</p>
          </div>
        ) : (
          <>
            <div className="content-grid">
              {advancedPaged.items.map((wine) => (
                <div
                  key={wine.slug}
                  className="wine-management__card"
                  onClick={() => navigate(`/wines/${wine.slug}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/wines/${wine.slug}`);
                    }
                  }}
                >
                  {Array.isArray(wine.images) && wine.images.length > 0 && (
                    <img
                      src={wine.images[0]}
                      alt={wine.name}
                      className="wine-management__thumb"
                    />
                  )}
                  <div className="wine-management__card-header">
                    <h3>{wine.name}</h3>
                    <span
                      className={`wine-management__color-badge wine-management__color-badge--${wine.color}`}
                    >
                      {wine.color}
                    </span>
                  </div>
                  {wine.producer && (
                    <p className="wine-management__producer">
                      {wine.producer.name}
                    </p>
                  )}
                  {Array.isArray(wine.grapes) && wine.grapes.length > 0 && (
                    <p className="wine-management__grapes">
                      <strong>Grapes:</strong>{" "}
                      {wine.grapes.slice(0, 3).map((g) => g.name).join(", ")}
                      {wine.grapes.length > 3 ? "…" : ""}
                    </p>
                  )}
                  {Array.isArray(wine.regions) && wine.regions.length > 0 && (
                    <p className="wine-management__regions">
                      <strong>Regions:</strong>{" "}
                      {wine.regions
                        .slice(0, 3)
                        .map((r) => (r.name ? r.name : r))
                        .join(", ")}
                      {wine.regions.length > 3 ? "…" : ""}
                    </p>
                  )}
                  {wine.sparkling && (
                    <p className="wine-management__sparkling">✨ Sparkling</p>
                  )}
                  {wine.vintages_count > 0 && (
                    <p className="wine-management__vintage-count">
                      {wine.vintages_count} vintage
                      {wine.vintages_count !== 1 ? "s" : ""}
                    </p>
                  )}
                  {canManageWines && (
                    <div className="wine-management__card-actions">
                      <Link
                        to={`/wines/${wine.slug}/edit`}
                        className="wine-management__edit-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit
                      </Link>
                      <button
                        className="wine-management__delete-btn"
                        onClick={(e) => handleDelete(wine, e)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Pagination
              page={advancedPaged.page}
              totalPages={advancedPaged.totalPages}
              totalCount={advancedPaged.totalCount}
              onPageChange={advancedPaged.setPage}
            />
          </>
        )}
      </div>
    );
  }

  // --- Category selected: flat paginated list ---
  if (selectedCategory) {
    return (
      <div className="wine-app">
        <div className="wine-management__header">
          <div>
            <p className="wine-kicker">Cellar</p>
            <h1>"{selectedCategory}" Wines</h1>
            <Link className="group-show-all" to="/wines">
              ← Show all categories
            </Link>
          </div>
          {canManageWines && (
            <Link
              to="/wines/new"
              className="auth-form__submit wine-management__add-btn"
            >
              + Add Wine
            </Link>
          )}
        </div>

        {pagedWines.loading ? (
          <p className="wine-management__loading">Loading wines…</p>
        ) : pagedWines.items.length === 0 ? (
          <div className="wine-management__empty">
            <p>No wines found in this category.</p>
          </div>
        ) : (
          <>
            <div className="content-grid">
              {pagedWines.items.map((wine) => (
                <div
                  key={wine.slug}
                  className="wine-management__card"
                  onClick={() => navigate(`/wines/${wine.slug}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/wines/${wine.slug}`);
                    }
                  }}
                >
                  {Array.isArray(wine.images) && wine.images.length > 0 && (
                    <img
                      src={wine.images[0]}
                      alt={wine.name}
                      className="wine-management__thumb"
                    />
                  )}
                  <div className="wine-management__card-header">
                    <h3>{wine.name}</h3>
                    <span
                      className={`wine-management__color-badge wine-management__color-badge--${wine.color}`}
                    >
                      {wine.color}
                    </span>
                  </div>
                  {wine.producer && (
                    <p className="wine-management__producer">
                      {wine.producer.name}
                    </p>
                  )}
                  {Array.isArray(wine.grapes) && wine.grapes.length > 0 && (
                    <p className="wine-management__grapes">
                      <strong>Grapes:</strong>{" "}
                      {wine.grapes
                        .slice(0, 3)
                        .map((g) => g.name)
                        .join(", ")}
                      {wine.grapes.length > 3 ? "…" : ""}
                    </p>
                  )}
                  {Array.isArray(wine.regions) && wine.regions.length > 0 && (
                    <p className="wine-management__regions">
                      <strong>Regions:</strong>{" "}
                      {wine.regions
                        .slice(0, 3)
                        .map((r) => (r.name ? r.name : r))
                        .join(", ")}
                      {wine.regions.length > 3 ? "…" : ""}
                    </p>
                  )}
                  {wine.sparkling && (
                    <p className="wine-management__sparkling">✨ Sparkling</p>
                  )}
                  {wine.vintages_count > 0 && (
                    <p className="wine-management__vintage-count">
                      {wine.vintages_count} vintage
                      {wine.vintages_count !== 1 ? "s" : ""}
                    </p>
                  )}
                  {canManageWines && (
                    <div className="wine-management__card-actions">
                      <Link
                        to={`/wines/${wine.slug}/edit`}
                        className="wine-management__edit-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit
                      </Link>
                      <button
                        className="wine-management__delete-btn"
                        onClick={(e) => handleDelete(wine, e)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Pagination
              page={pagedWines.page}
              totalPages={pagedWines.totalPages}
              totalCount={pagedWines.totalCount}
              onPageChange={pagedWines.setPage}
            />
          </>
        )}
      </div>
    );
  }

  // --- No category selected: grouped-by-category view (12 per category) ---
  return (
    <div className="wine-app">
      <div className="wine-management__header">
        <div>
          <p className="wine-kicker">Cellar</p>
          <h1>Wine List</h1>
        </div>
        {canManageWines && (
          <Link
            to="/wines/new"
            className="auth-form__submit wine-management__add-btn"
          >
            + Add Wine
          </Link>
        )}
      </div>

      <WineAdvancedSearch
        open={advancedOpen}
        onToggleOpen={setAdvancedOpen}
        onSearch={handleAdvancedSearch}
        onClear={handleAdvancedClear}
      />

      {groups.length === 0 ? (
        <div className="wine-management__empty">
          <p>
            No wines found
            {canManageWines ? ". Start by adding a new wine!" : "."}
          </p>
          {canManageWines && (
            <Link to="/wines/new" className="auth-form__submit">
              + Add Your First Wine
            </Link>
          )}
        </div>
      ) : (
        <div className="content-grid-groups">
          {groups.map((group) => (
            <section key={group.category} className="content-grid-group">
              <h2 className="content-grid-group__title">
                {group.category}
                <Link
                  className="group-show-all"
                  to={`/wines?category=${encodeURIComponent(group.category)}`}
                >
                  Show all ({group.count})
                </Link>
              </h2>
              <div className="content-grid">
                {group.wines.map((wine) => (
                  <div
                    key={wine.slug}
                    className="wine-management__card"
                    onClick={() => navigate(`/wines/${wine.slug}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/wines/${wine.slug}`);
                      }
                    }}
                  >
                    {Array.isArray(wine.images) &&
                      wine.images.length > 0 && (
                        <img
                          src={wine.images[0]}
                          alt={wine.name}
                          className="wine-management__thumb"
                        />
                      )}
                    <div className="wine-management__card-header">
                      <h3>{wine.name}</h3>
                      <span
                        className={`wine-management__color-badge wine-management__color-badge--${wine.color}`}
                      >
                        {wine.color}
                      </span>
                    </div>
                    {wine.producer && (
                      <p className="wine-management__producer">
                        {wine.producer.name}
                      </p>
                    )}
                    {Array.isArray(wine.grapes) &&
                      wine.grapes.length > 0 && (
                        <p className="wine-management__grapes">
                          <strong>Grapes:</strong>{" "}
                          {wine.grapes
                            .slice(0, 3)
                            .map((g) => g.name)
                            .join(", ")}
                          {wine.grapes.length > 3 ? "…" : ""}
                        </p>
                      )}
                    {Array.isArray(wine.regions) &&
                      wine.regions.length > 0 && (
                        <p className="wine-management__regions">
                          <strong>Regions:</strong>{" "}
                          {wine.regions
                            .slice(0, 3)
                            .map((r) => (r.name ? r.name : r))
                            .join(", ")}
                          {wine.regions.length > 3 ? "…" : ""}
                        </p>
                      )}
                    {wine.sparkling && (
                      <p className="wine-management__sparkling">✨ Sparkling</p>
                    )}
                    {wine.vintages_count > 0 && (
                      <p className="wine-management__vintage-count">
                        {wine.vintages_count} vintage
                        {wine.vintages_count !== 1 ? "s" : ""}
                      </p>
                    )}
                    {canManageWines && (
                      <div className="wine-management__card-actions">
                        <Link
                          to={`/wines/${wine.slug}/edit`}
                          className="wine-management__edit-btn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Edit
                        </Link>
                        <button
                          className="wine-management__delete-btn"
                          onClick={(e) => handleDelete(wine, e)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default WineList;
