import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { articlesApi } from "../services/api";
import ArticleForm from "./ArticleForm";
import ReviewCard from "./ReviewCard";
import LikeButton from "./LikeButton";
import CommentSection from "./comments/CommentSection";
import DOMPurify from "dompurify";
import { useAuth } from "../contexts/AuthContext";
import { canManageWinesRole } from "../constants/roles";
import type { Article } from "../types/article";
import { errorMessage } from "../utils/errors";
import BackToSource from "./BackToSource";
import { useReturnToLink } from "../hooks/useReturnToLink";

interface RichBodyProps {
  html: string;
}

function RichBody({ html }: RichBodyProps) {
  return (
    <div
      className="article-detail__body"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  );
}

function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const returnToLink = useReturnToLink();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadArticle = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const data = await articlesApi.show(slug);
      setArticle(data);
    } catch (err) {
      setError(errorMessage(err, "Failed to load article"));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  // Every action below edits or deletes the article on screen, so there is
  // nothing to act on until one has loaded.
  async function togglePublish() {
    if (!article) return;
    try {
      await articlesApi.update(article.id, {
        status: article.status === "draft" ? "published" : "draft",
      });
      loadArticle();
    } catch (err) {
      alert(errorMessage(err, "Failed to update article"));
    }
  }

  async function handleDelete() {
    if (!article) return;
    if (!window.confirm("Delete this article? This action cannot be undone.")) {
      return;
    }
    try {
      setDeleting(true);
      await articlesApi.destroy(article.id);
      navigate("/articles");
    } catch (err) {
      setError(errorMessage(err, "Failed to delete article"));
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="wine-app">
        <p className="wine-management__loading">Loading article…</p>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="wine-app">
        <p className="wine-management__error">{error || "Article not found."}</p>
        <Link to="/articles" className="auth-form__submit">
          Back to Articles
        </Link>
      </main>
    );
  }

  const canManage = canManageWinesRole(user);
  const isAuthor = Boolean(user && Number(article.user_id) === Number(user.id));
  const canEdit = canManage || isAuthor;
  // Reviews shown under the article: link must be published AND review published.
  const visibleReviews = (article.reviews || []).filter(
    (r) => r.link_status === "published" && r.status === "published",
  );
  // The serializer omits these collections entirely when empty, so they are
  // read once here into plain arrays the JSX below can rely on.
  const categories = article.categories ?? [];
  const tags = article.tags ?? [];
  const vintages = article.vintages ?? [];
  const producers = article.producers ?? [];

  return (
    <main className="wine-app">
      <BackToSource />
      <Link to="/articles" className="wine-detail__back">
        &larr; Back to Articles
      </Link>

      {Array.isArray(article.images) && article.images.length > 0 && (
        <div className="wine-detail__images">
          {article.images.map((src, i) => (
            <img key={i} src={src} alt={`${article.title} ${i + 1}`} />
          ))}
        </div>
      )}

      <div className="wine-detail__header">
        <div>
          <h1>{article.title}</h1>
          <LikeButton
            kind="article"
            identifier={article.slug || article.id}
            initialLiked={article.liked_by_current_user}
            initialCount={article.likes_count}
            onChange={({ liked, likes_count }) =>
              setArticle((prev) =>
                prev ? { ...prev, liked_by_current_user: liked, likes_count } : prev,
              )
            }
          />
        </div>
        <span className={`review-card__status ${article.status === "draft" ? "" : ""}`}>
          {article.status}
        </span>
      </div>

      <p className="review-card__comment">
        {categories.length > 0 ? (
          <>
            {categories.map((cat, i) => (
              <span key={cat.id}>
                <Link to={returnToLink(`/categories/${cat.slug}`)}>{cat.name}</Link>
                {i < categories.length - 1 ? ", " : ""}
              </span>
            ))}{" "}
            ·{" "}
          </>
        ) : null}
        {`by ${article.author_name}`}
        {article.published_at
          ? ` · ${new Date(article.published_at).toLocaleDateString()}`
          : ""}
        {tags.length > 0 ? ` — ${tags.join(", ")}` : ""}
      </p>

      {canEdit && (
        <div className="wine-detail__actions">
          {!editing && (
            <>
              <button type="button" className="auth-form__submit" onClick={() => setEditing(true)}>
                Edit Article
              </button>
              <button type="button" className="review-card__publish" onClick={togglePublish}>
                {article.status === "draft" ? "Publish" : "Unpublish"}
              </button>
              <button
                type="button"
                className="review-form__cancel"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete Article"}
              </button>
            </>
          )}
        </div>
      )}

      {editing ? (
        <div className="review-form-wrapper">
          <ArticleForm
            article={article}
            onSaved={() => {
              setEditing(false);
              loadArticle();
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <>
          {article.abstract && (
            <p className="wine-detail__prompt">{article.abstract}</p>
          )}
          {article.body && (
            <div className="wine-detail__section">
              <RichBody html={article.body} />
            </div>
          )}
        </>
      )}

      {visibleReviews.length > 0 && (
        <div className="wine-detail__section">
          <h2>Reviews</h2>
          {/* Same card grid as the Reviews listing, read-only: the whole card
              opens the review. */}
          <div className="content-grid">
            {visibleReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onOpen={() =>
                  navigate(returnToLink(`/reviews/${review.slug}`))
                }
              />
            ))}
          </div>
        </div>
      )}

      {(vintages.length > 0 || producers.length > 0) && (
        <div className="wine-detail__section">
          {vintages.length > 0 && (
            <>
              <h2>Wines &amp; vintages</h2>
              <ul>
                {vintages.map((vintage) => (
                  <li key={vintage.id}>
                    <Link to={returnToLink(`/wines/${vintage.wine_slug}`)}>
                      {vintage.wine_name} {vintage.year}
                    </Link>
                    {vintage.region ? ` — ${vintage.region}` : ""}
                  </li>
                ))}
              </ul>
            </>
          )}
          {producers.length > 0 && (
            <>
              <h2>Producers</h2>
              <ul>
                {producers.map((producer) => (
                  <li key={producer.id}>
                    <Link to={returnToLink(`/producers/${producer.slug}`)}>{producer.name}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <CommentSection kind="article" identifier={article.slug || article.id} />
    </main>
  );
}

export default ArticleDetail;