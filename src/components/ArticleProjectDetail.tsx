import { useCallback, useEffect, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { articleProjectsApi } from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import { canManageAllPackages } from "../constants/roles"
import { errorMessage } from "../utils/errors"
import type { ArticleProjectDetail as ArticleProjectDetailType } from "../types/articleProject"
import ArticleProjectForm from "./ArticleProjectForm"

const readable = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())

function Stat({ label, value, tone }: { label: string; value: string; tone?: "danger" | "muted" }) {
  return <div className={`article-project-detail__stat${tone === "danger" ? " article-project-detail__stat--danger" : tone === "muted" ? " article-project-detail__stat--muted" : ""}`}><span className="article-project-detail__stat-label">{label}</span><strong className="article-project-detail__stat-value">{value}</strong></div>
}
export default function ArticleProjectDetail() {
  const { id } = useParams<{ id: string }>(); const navigate = useNavigate(); const location = useLocation(); const { user } = useAuth()
  const [project, setProject] = useState<ArticleProjectDetailType | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const editing = location.pathname.endsWith("/edit"); const [deleting, setDeleting] = useState(false)
  const load = useCallback(async () => { if (!id) return; try { setLoading(true); setError(null); setProject(await articleProjectsApi.show(id)) } catch (err) { setError(errorMessage(err, "Could not load Article Project")) } finally { setLoading(false) } }, [id])
  useEffect(() => { load() }, [load])
  if (loading) return <main className="wine-app"><p className="wine-management__loading">Loading Article Project…</p></main>
  if (error || !project) return <main className="wine-app"><p className="wine-management__error">{error ?? "Article Project not found."}</p><Link className="auth-form__submit" to="/article-projects">Back to Article Projects</Link></main>
  const manageable = canManageAllPackages(user) || Number(project.created_by.id) === Number(user?.id)
  async function destroy() { if (!window.confirm(`Delete Article Project “${project.name}”? This cannot be undone.`)) return; try { setDeleting(true); await articleProjectsApi.destroy(project.id); navigate("/article-projects") } catch (err) { setError(errorMessage(err, "Could not delete Article Project")); setDeleting(false) } }
  if (editing) return <ArticleProjectForm project={project} onSaved={(saved) => { setProject(saved); navigate(`/article-projects/${saved.id}`, { replace: true }) }} />
  const wordTarget = project.target_word_count
  const progress = wordTarget && project.actual_word_count ? Math.min(100, Math.round((project.actual_word_count / wordTarget) * 100)) : null
  return <main className="wine-app article-project-detail">
    <Link className="wine-detail__back" to="/article-projects">← Back to Article Projects</Link>
    <header className="article-project-detail__hero">
      <div className="article-project-detail__hero-main">
        <p className="wine-kicker">Editorial project</p>
        <div className="article-project-detail__title-row">
          <h1>{project.name}</h1>
          <div className="article-project-detail__badges">
            <span className="article-project-detail__badge">{readable(project.project_status)}</span>
            <span className="article-project-detail__badge article-project-detail__badge--draft">{readable(project.drafting_status)}</span>
            {project.overdue && <span className="article-project-detail__badge article-project-detail__badge--overdue">Overdue</span>}
          </div>
        </div>
        <p className="article-project-detail__subtitle">{project.publication ?? "No publication"} · Owned by {project.created_by.display_name ?? "Unknown"}{project.updated_at ? ` · Updated ${new Date(project.updated_at).toLocaleDateString()}` : ""}</p>
      </div>
      {manageable && <div className="article-project-detail__actions"><button className="auth-form__submit" onClick={() => navigate(`/article-projects/${project.id}/edit`)}>Edit Article Project</button><button className="review-form__cancel" disabled={deleting} onClick={destroy}>{deleting ? "Deleting…" : "Delete Article Project"}</button></div>}
    </header>
    {error && <p role="alert" className="article-project-detail__error">{error}</p>}
    <section className="article-project-detail__stats" aria-label="Project summary">
      <Stat label="Deadline" value={project.deadline ?? "No deadline"} tone={project.overdue ? "danger" : undefined} />
      <Stat label="Editor" value={project.editor_name ?? "Not assigned"} tone={project.editor_name ? undefined : "muted"} />
      <Stat label="Words" value={wordTarget ? `${project.actual_word_count ?? 0} / ${wordTarget}` : "—"} />
      <Stat label="Remaining" value={project.word_count_remaining ?? "—"} tone={project.word_count_remaining === null ? "muted" : undefined} />
      <Stat label="Wines" value={String(project.counts.total)} />
      <Stat label="Tasted" value={`${project.counts.tasted} / ${project.counts.total}`} />
    </section>
    {progress !== null && <div className="article-project-detail__progress" aria-label={`${progress}% of target word count written`}><span style={{ width: `${progress}%` }} /></div>}

    <div className="article-project-detail__two-col">
      <section className="article-project-detail__panel article-project-detail__panel--brief">
        <div className="article-project-detail__panel-heading"><h2>Overview</h2><span className="article-project-detail__badge article-project-detail__badge--draft">{readable(project.drafting_status)}</span></div>
        {project.description ? <p className="article-project-detail__description">{project.description}</p> : <p className="article-project-detail__empty">No brief added yet.</p>}
        <dl className="article-project-detail__meta">
          <div><dt>Deadline</dt><dd className={project.overdue ? "article-project-detail__meta--danger" : ""}>{project.deadline ?? "No deadline"}{project.overdue ? " · overdue" : ""}</dd></div>
          <div><dt>Editor</dt><dd>{project.editor_name ?? "Not assigned"}{project.editor_email ? ` · ${project.editor_email}` : ""}</dd></div>
          <div><dt>Owner</dt><dd>{project.created_by.display_name ?? "Unknown"}</dd></div>
          <div><dt>Word count</dt><dd>Target {project.target_word_count ?? "—"} · Actual {project.actual_word_count ?? "—"} · Remaining {project.word_count_remaining ?? "—"}</dd></div>
        </dl>
      </section>
      <section className="article-project-detail__panel">
        <div className="article-project-detail__panel-heading"><h2>Tasting pipeline</h2></div>
        <ul className="article-project-detail__pipeline">
          {([["Requested", project.counts.requested], ["Received", project.counts.received], ["Selected", project.counts.selected], ["Tasted", project.counts.tasted]] as const).map(([label, count]) => <li key={label}><span>{label}</span><strong>{count}</strong><div className="article-project-detail__bar"><i style={{ width: project.counts.total ? `${(count / project.counts.total) * 100}%` : "0%" }} /></div></li>)}
        </ul>
      </section>
    </div>
    <section className="article-project-detail__panel"><div className="article-project-detail__panel-heading"><h2>Article</h2></div>{project.article ? <Link className="article-project-detail__linked" to={`/articles/${project.article.slug ?? project.article.id}`}><span>{project.article.title}</span><em>{readable(project.article.status)}</em></Link> : <p className="article-project-detail__empty">No Article linked.</p>}</section>
    <section className="article-project-detail__panel"><div className="article-project-detail__panel-heading"><h2>Producers</h2><span className="article-project-detail__count">{project.article_project_producers.length}</span></div>{project.article_project_producers.length ? <ul className="article-project-detail__cards">{project.article_project_producers.map((row) => <li key={row.id}><div className="article-project-detail__card-head"><Link to={`/producers/${row.producer.slug ?? row.producer.id}`}>{row.producer.name}</Link><span className={`article-project-detail__badge${row.request_confirmed ? "" : row.contacted ? " article-project-detail__badge--draft" : " article-project-detail__badge--overdue"}`}>{row.request_confirmed ? "Confirmed" : row.contacted ? "Contacted" : "Not contacted"}</span></div>{row.notes && <p>{row.notes}</p>}</li>)}</ul> : <p className="article-project-detail__empty">No producers linked.</p>}</section>

    <section className="article-project-detail__panel"><div className="article-project-detail__panel-heading"><h2>Wines</h2><span className="article-project-detail__count">{project.article_project_vintages.length}</span></div>{project.article_project_vintages.length ? <ul className="article-project-detail__cards">{project.article_project_vintages.map((row) => <li key={row.id}><div className="article-project-detail__card-head">{row.vintage.wine_slug ? <Link to={`/wines/${row.vintage.wine_slug}`}>{row.vintage.display_name}{row.vintage.wine_name ? ` — ${row.vintage.wine_name}` : ""}</Link> : <strong>{row.vintage.display_name}</strong>}<div className="article-project-detail__chips">{(["requested", "received", "selected", "tasted"] as const).filter((flag) => row[flag]).map((flag) => <span key={flag} className="article-project-detail__chip">{readable(flag)}</span>)}</div></div>{row.date_received && <p>Received {row.date_received} · Condition: {readable(row.bottle_condition)}</p>}{row.notes && <p>{row.notes}</p>}</li>)}</ul> : <p className="article-project-detail__empty">No wines linked.</p>}</section>

    <section className="article-project-detail__panel"><div className="article-project-detail__panel-heading"><h2>Reviews</h2><span className="article-project-detail__count">{project.article_project_reviews.length}</span></div>{project.article_project_reviews.length ? <ul className="article-project-detail__cards">{project.article_project_reviews.map((row) => <li key={row.id}><div className="article-project-detail__card-head"><Link to={`/reviews/${row.review.slug ?? row.review.id}`}>{row.review.title}</Link>{row.review.wine_name && <span className="article-project-detail__chip">{row.review.wine_name}{row.review.vintage_year ? ` ${row.review.vintage_year}` : ""}</span>}</div></li>)}</ul> : <p className="article-project-detail__empty">No reviews linked.</p>}</section>
  </main>
}