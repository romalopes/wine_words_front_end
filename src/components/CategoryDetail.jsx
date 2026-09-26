import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { categoriesApi, winesApi, reviewsApi, articlesApi } from "../services/api";
import WineTable from "./WineTable";
import ReviewTable from "./ReviewTable";
import ArticleTable from "./ArticleTable";
import Pagination from "./Pagination";
import usePagedList from "../hooks/usePagedList";
import BackToSource from "./BackToSource";

function CategoryDetail() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Three independent paginated lists — paging one does not disturb the others.
  const wines = usePagedList({
    fetcher: (params) => winesApi.list({ ...params, category_id: category?.id }),
    enabled: Boolean(category?.id),
  });
  const reviews = usePagedList({
    fetcher: (params) => reviewsApi.all({ ...params, category_id: category?.id }),
    enabled: Boolean(category?.id),
  });
  const articles = usePagedList({
    fetcher: (params) => articlesApi.list({ ...params, category_id: category?.id }),
    enabled: Boolean(category?.id),
  });

  useEffect(() => {
    setLoading(true);
    setError(null);
    setCategory(null);
    categoriesApi
      .show(slug)
      .then(setCategory)
      .catch((err) => setError(err.message || "Failed to load category"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="wine-app">
        <p className="wine-management__loading">Loading category…</p>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="wine-app">
        <p className="wine-management__error">{error || "Category not found."}</p>
        <Link to="/categories" className="auth-form__submit">
          Back to Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="wine-app">
      <BackToSource />
      <Link to="/categories" className="wine-detail__back">
        &larr; Back to Categories
      </Link>
      <div className="wine-management__header">
        <div>
          <p className="wine-kicker">Cellar</p>
          <h1>Category: {category.name}</h1>
        </div>
      </div>

      <section className="detail-card" style={{ padding: "1rem 1.5rem" }}>
        <h2>
          Wines{!wines.loading && ` (${wines.totalCount})`}
        </h2>
        {wines.loading ? (
          <p className="wine-management__loading">Loading wines…</p>
        ) : wines.items.length > 0 ? (
          <>
            <WineTable
              wines={wines.items}
              onDeleted={() => wines.reload()}
              linkContext={{ type: "category", id: category?.id, name: category.name }}
              onWineLinked={() => wines.reload()}
            />
            <Pagination
              page={wines.page}
              totalPages={wines.totalPages}
              totalCount={wines.totalCount}
              onPageChange={wines.setPage}
            />
          </>
        ) : (
          <p className="wine-management__empty-state">
            No wines in this category yet.
          </p>
        )}

      <section className="detail-card" style={{ padding: "1rem 1.5rem" }}>
        <h2>
          Reviews{!reviews.loading && ` (${reviews.totalCount})`}
        </h2>
        {reviews.loading ? (
          <p className="wine-management__loading">Loading reviews…</p>
        ) : (
          <>
            <ReviewTable
              reviews={reviews.items}
              linkContext={
                category
                  ? { type: "category", id: category.id, name: category.name }
                  : null
              }
              onReviewLinked={() => reviews.reload()}
            />
            {reviews.items.length > 0 && (
              <Pagination
                page={reviews.page}
                totalPages={reviews.totalPages}
                totalCount={reviews.totalCount}
                onPageChange={reviews.setPage}
              />
            )}
          </>
        )}
      </section>
      </section>

      <section className="detail-card" style={{ padding: "1rem 1.5rem" }}>
        <h2>
          Articles{!articles.loading && ` (${articles.totalCount})`}
        </h2>
        {articles.loading ? (
          <p className="wine-management__loading">Loading articles…</p>
        ) : (
          <>
            <ArticleTable
              articles={articles.items}
              linkContext={
                category
                  ? { type: "category", id: category.id, name: category.name }
                  : null
              }
              onArticleLinked={() => articles.reload()}
            />
            {articles.items.length > 0 && (
              <Pagination
                page={articles.page}
                totalPages={articles.totalPages}
                totalCount={articles.totalCount}
                onPageChange={articles.setPage}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default CategoryDetail;