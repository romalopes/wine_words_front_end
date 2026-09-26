import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { canManageWinesRole } from "../constants/roles";
import LinkArticleDialog from "./LinkArticleDialog";
import { useReturnToLink } from "../hooks/useReturnToLink";

// Shared table of articles (one article per row): Title, Author, Status and
// Published date. Rows navigate to the article detail page.
// When `linkContext` is provided, shows a "+ Link an Article" button that
// opens a dialog to search and link articles to the given entity.
function ArticleTable({ articles, linkContext, onArticleLinked }) {
  const { user } = useAuth();
  const canManage = canManageWinesRole(user);
  const navigate = useNavigate();
  const returnToLink = useReturnToLink();
  const [dialogOpen, setDialogOpen] = useState(false);
  const excludeIds = Array.isArray(articles)
    ? articles.flatMap((a) => [a.id, a.slug].filter(Boolean))
    : [];

  const linkButton = canManage && linkContext && (
    <div style={{ margin: "0 0 1rem" }}>
      <button
        type="button"
        className="btn-action"
        onClick={() => setDialogOpen(true)}
      >
        + Link an Article
      </button>
    </div>
  );

  if (!Array.isArray(articles) || articles.length === 0) {
    return (
      <>
        {linkButton}
        <p className="wine-management__empty-state">No articles yet.</p>
        {dialogOpen && (
          <LinkArticleDialog
            entityId={linkContext.id}
            entityName={linkContext.name}
            excludeIds={excludeIds}
            onClose={() => setDialogOpen(false)}
            onLinked={() => {
              setDialogOpen(false);
              onArticleLinked?.();
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
            <th>Title</th>
            <th>Author</th>
            <th>Status</th>
            <th>Published</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article, index) => (
            <tr
              key={article.slug || article.id}
              className={index % 2 === 0 ? "grapes-row--even" : "grapes-row--odd"}
              onClick={() => navigate(returnToLink(`/articles/${article.slug}`))}
              style={{ cursor: "pointer" }}
            >
              <td>
                <Link
                  to={returnToLink(`/articles/${article.slug}`)}
                  className="grapes-table__link"
                  onClick={(e) => e.stopPropagation()}
                >
                  {article.title}
                </Link>
              </td>
              <td>{article.author || "—"}</td>
              <td>{article.status || "—"}</td>
              <td>
                {article.published_at
                  ? new Date(article.published_at).toLocaleDateString()
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {dialogOpen && (
        <LinkArticleDialog
          entityId={linkContext.id}
          entityName={linkContext.name}
          excludeIds={excludeIds}
          onClose={() => setDialogOpen(false)}
          onLinked={() => {
            setDialogOpen(false);
            onArticleLinked?.();
          }}
        />
      )}
    </>
  );
}

export default ArticleTable;