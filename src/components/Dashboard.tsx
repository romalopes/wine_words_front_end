import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { articlesApi, reviewsApi, statsApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const dashboardCards = [
  { title: "Producers", bandColor: "#6b5855", to: "/producers", cta: "Browse wineries →" },
  { title: "Wines", bandColor: "#c49b38", to: "/wines", cta: "Explore the catalogue →" },
  { title: "Reviews", bandColor: "#d47386", to: "/reviews", cta: "Read reviews →" },
  { title: "Articles", bandColor: "#c49b38", to: "/articles", cta: "Read articles →" },
];

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ producers: 0, wines: 0, reviews: 0, articles: 0 });
  const [recentArticles, setRecentArticles] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);

  useEffect(() => {
    statsApi.get().then(setStats).catch(() => {});
    articlesApi.list().then((data) => setRecentArticles((Array.isArray(data) ? data : []).slice(0, 10))).catch(() => setRecentArticles([]));
    reviewsApi.all().then((data) => setRecentReviews((Array.isArray(data) ? data : []).slice(0, 10))).catch(() => setRecentReviews([]));
  }, []);

  const statsMap = { Producers: stats.producers, Wines: stats.wines, Reviews: stats.reviews, Articles: stats.articles };

  return (
    <main className="wine-app">
      <p className="lede" style={{ marginBottom: "1.5rem" }}>
        Welcome{user ? `, ${user.email.split("@")[0]}` : ""} to Wine Words. Your cellar command centre.
      </p>
      {!user && (
        <p style={{ marginBottom: "1.5rem" }}>
          <Link className="text-link" to="/login">Sign in or create an account</Link> to save tasting profiles and write reviews.
        </p>
      )}
      <div className="content-grid" style={{ marginBottom: "2rem" }}>
        {dashboardCards.map((card) => (
          <Link key={card.title} to={card.to} className="wine-management__card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", textDecoration: "none", color: "inherit" }}>
            <div style={{ height: "0.5rem", background: card.bandColor }} />
            <div style={{ padding: "1.1rem" }}>
              <h2 style={{ fontSize: "1.25rem", marginBottom: "0.3rem" }}>{card.title}</h2>
              <p style={{ color: "#6b5855", fontSize: "0.9rem", marginBottom: "0.7rem" }}>
                {statsMap[card.title] || 0} {card.title.toLowerCase()} in the library.
              </p>
              <span style={{ display: "inline-block", background: "#f3e9e3", borderRadius: "99px", color: "#6b2834", fontSize: "0.78rem", fontWeight: 600, padding: "0.22rem 0.5rem" }}>
                {card.cta}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {recentArticles.length > 0 && (
        <>
          <h2 style={{ marginTop: "2rem", marginBottom: "1rem" }}>Latest Articles</h2>
          <div className="content-grid" style={{ marginBottom: "2rem" }}>
            {recentArticles.map((article) => (
              <Link key={article.id} to={`/articles/${article.slug}`} className="wine-management__card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", textDecoration: "none", color: "inherit" }}>
                {Array.isArray(article.images) && article.images.length > 0 && (
                  <img src={article.images[0]} alt={article.title} style={{ width: "100%", height: "8rem", objectFit: "cover" }} />
                )}
                <div style={{ height: "0.5rem", background: "#8a273c" }} />
                <div style={{ padding: "1.1rem" }}>
                  <h3 style={{ fontSize: "1.1rem", marginBottom: "0.3rem" }}>{article.title}</h3>
                  <p style={{ color: "#6b5855", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                    {[article.category, `by ${article.author_name}`].filter(Boolean).join(" · ")}
                  </p>
                  {article.abstract && <p style={{ color: "#6b5855", fontSize: "0.85rem", lineHeight: 1.5 }}>{String(article.abstract).slice(0, 120)}...</p>}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {recentReviews.length > 0 && (
        <>
          <h2 style={{ marginTop: "2rem", marginBottom: "1rem" }}>Latest Reviews</h2>
          <div className="content-grid">
            {recentReviews.map((review) => (
              <Link key={review.id} to={`/reviews/${review.slug}`} className="wine-management__card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", textDecoration: "none", color: "inherit" }}>
                <div style={{ height: "0.5rem", background: "#d47386" }} />
                <div style={{ padding: "1.1rem" }}>
                  <h3 style={{ fontSize: "1.1rem", marginBottom: "0.3rem" }}>{review.title || "Untitled review"}</h3>
                  <p style={{ color: "#6b5855", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Score {review.score} · by {review.reviewer_name}</p>
                  {review.comment && <p style={{ color: "#6b5855", fontSize: "0.85rem", lineHeight: 1.5 }}>{String(review.comment).replace(/<[^>]+>/g, "").slice(0, 120)}...</p>}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

export default Dashboard;
