import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usersApi, subscriptionsApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { isAdmin } from "../constants/roles";

function UserRoles() {
  const { user, startImpersonation } = useAuth();
  const isAdminUser = isAdmin(user);

  const [allRoles, setAllRoles] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [query, setQuery] = useState("");
  // Pagination envelope from the API: { items, page, per_page, total_count, total_pages }.
  // null = not loaded yet.
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState({}); // userId -> Set(roleId)
  const [saving, setSaving] = useState(null);
  const [savingSub, setSavingSub] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    usersApi
      .roles()
      .then((data) => setAllRoles(Array.isArray(data) ? data : []))
      .catch(() => ({}));
    subscriptionsApi
      .list({ auth: true })
      .then((data) => setSubscriptions(Array.isArray(data) ? data : []))
      .catch(() => ({}));
  }, []);

  async function runSearch(q, page = 1) {
    const trimmed = q.trim();
    try {
      setSearching(true);
      setError(null);
      // Blank query returns the full user list; both shapes are paginated.
      const data = await usersApi.search(trimmed, page);
      setResults(data?.items ? data : { items: Array.isArray(data) ? data : [], page: 1, total_pages: 1 });
    } catch (err) {
      setError(err.message || "Search failed");
      setResults(null);
    } finally {
      setSearching(false);
    }
  }

  // Load the first page of users on mount (20 per page).
  useEffect(() => {
    runSearch("");
  }, []);

  function handleSearchChange(e) {
    setQuery(e.target.value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => runSearch(e.target.value, 1), 300); // new search → page 1
  }

  function goToPage(page) {
    runSearch(query, page);
  }

  // Patch one user inside the current page's items.
  function updateItem(userId, patch) {
    setResults((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((x) => (x.id === userId ? { ...x, ...patch } : x)),
          }
        : prev,
    );
  }

  function hasRole(u, roleId) {
    if (selected[u.id]) return selected[u.id].has(roleId);
    return (u.role_ids || []).includes(roleId);
  }

  function toggleRole(u, roleId, checked) {
    setSelected((prev) => {
      const set = new Set(prev[u.id] != null ? prev[u.id] : u.role_ids || []);
      if (checked) set.add(roleId);
      else set.delete(roleId);
      return { ...prev, [u.id]: set };
    });
  }

  async function saveRoles(u) {
    setSaving(u.id);
    setError(null);
    try {
      const roleIds = Array.from(
        selected[u.id] != null ? selected[u.id] : u.role_ids || [],
      );
      const updated = await usersApi.assignRoles(u.id, roleIds);
      updateItem(u.id, {
        roles: updated.roles,
        role_ids: updated.role_ids,
      });
      setSelected((prev) => {
        const next = { ...prev };
        delete next[u.id];
        return next;
      });
    } catch (err) {
      setError(err.message || "Failed to save roles");
    } finally {
      setSaving(null);
    }
  }

  async function changeSubscription(u, subscriptionId) {
    if (
      !window.confirm(
        "Change this user's subscription? This swaps their base role (Guest/Reader).",
      )
    )
      return;
    setSavingSub(u.id);
    setError(null);
    try {
      const updated = await usersApi.assignSubscription(u.id, subscriptionId);
      updateItem(u.id, {
        roles: updated.roles,
        role_ids: updated.role_ids,
        subscription: updated.subscription,
      });
    } catch (err) {
      setError(err.message || "Failed to change subscription");
    } finally {
      setSavingSub(null);
    }
  }

  if (!isAdminUser) {
    return (
      <main className="wine-app">
        <p className="wine-management__empty-state">
          You do not have permission to manage users.
        </p>
        <Link to="/" className="auth-form__submit">
          Back to Dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="wine-app">
      <div className="wine-management__header">
        <h1>Users &amp; Roles</h1>
      </div>
      <p className="review-card__comment">
        Search for a user, then tick the roles they belong to. A user can be
        linked to many roles.
      </p>

      <div className="review-form__field">
        <input
          type="text"
          value={query}
          onChange={handleSearchChange}
          placeholder="Search by username or email…"
        />
        {searching && <p className="wine-management__loading">Searching…</p>}
        {error && <p className="review-form__error">{error}</p>}
      </div>

      {results !== null && results.items.length === 0 && (
        <p className="wine-management__empty-state">No users found.</p>
      )}

      <div className="admin-users">
        {(results?.items || []).map((u) => (
          <div key={u.id} className="admin-user-card">
            <div className="admin-user-info">
              <span className="admin-user-name" title={u.user_name || ""}>
                {u.user_name || "(no name)"}
              </span>
              <span className="admin-user-email" title={u.email}>
                {u.email}
              </span>
            </div>
            <div className="admin-user-roles">
              {(u.roles || []).map((r) => (
                <span key={r} className="role-badge">
                  {r}
                </span>
              ))}
            </div>
            <div className="admin-user-actions">
              {allRoles.map((role) => {
                // An admin must not revoke their own Admin role (backend also
                // rejects it with 422) — avoid the self-lockout.
                const isOwnAdminRole =
                  role.name === "Admin" && u.id === user?.id;
                return (
                  <label
                    key={role.id}
                    className="role-check"
                    title={isOwnAdminRole ? "You cannot revoke your own Admin role" : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={hasRole(u, role.id)}
                      disabled={isOwnAdminRole}
                      onChange={(e) => toggleRole(u, role.id, e.target.checked)}
                    />
                    {role.name}
                  </label>
                );
              })}
              <label className="admin-user-subscription">
                Subscription
                <select
                  value={u.subscription?.id ?? ""}
                  disabled={savingSub === u.id}
                  onChange={(e) => changeSubscription(u, Number(e.target.value))}
                >
                  <option value="" disabled>
                    {savingSub === u.id ? "Assigning…" : "Select"}
                  </option>
                  {subscriptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="admin-pagination__btn"
                disabled={saving === u.id}
                onClick={() => saveRoles(u)}
              >
                {saving === u.id ? "Saving…" : "Save roles"}
              </button>
              {!u.roles?.includes("Admin") && (
                <button
                  type="button"
                  className="admin-pagination__btn"
                  title={`Act as ${u.user_name || u.email}`}
                  aria-label={`Act as ${u.user_name || u.email}`}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Act as ${u.user_name || u.email}? You will operate as this user until you stop.`,
                      )
                    ) {
                      startImpersonation(u.id).catch((err) =>
                        setError(err.message || "Failed to start impersonation"),
                      );
                    }
                  }}
                >
                  Act as user
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {results && results.total_pages > 1 && (
        <div className="admin-pagination">
          <button
            type="button"
            className="admin-pagination__btn"
            disabled={searching || results.page <= 1}
            onClick={() => goToPage(results.page - 1)}
          >
            ← Previous
          </button>
          <span>
            Page {results.page} of {results.total_pages}
            {typeof results.total_count === "number" &&
              ` (${results.total_count} users)`}
          </span>
          <button
            type="button"
            className="admin-pagination__btn"
            disabled={searching || results.page >= results.total_pages}
            onClick={() => goToPage(results.page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </main>
  );
}

export default UserRoles;
