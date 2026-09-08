import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usersApi, subscriptionsApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { isAdmin } from "../constants/roles";

function UserRoles() {
  const { user } = useAuth();
  const isAdminUser = isAdmin(user);

  const [allRoles, setAllRoles] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null); // null = not searched
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

  async function runSearch(q) {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults(null);
      return;
    }
    try {
      setSearching(true);
      setError(null);
      const data = await usersApi.search(trimmed);
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Search failed");
      setResults(null);
    } finally {
      setSearching(false);
    }
  }

  function handleSearchChange(e) {
    setQuery(e.target.value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => runSearch(e.target.value), 300);
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
      const roleIds = Array.from(selected[u.id] != null ? selected[u.id] : u.role_ids || []);
      const updated = await usersApi.assignRoles(u.id, roleIds);
      setResults((prev) =>
        (prev || []).map((x) =>
          x.id === u.id ? { ...x, roles: updated.roles, role_ids: updated.role_ids } : x,
        ),
      );
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
    if (!window.confirm("Change this user's subscription? This swaps their base role (Guest/Reader).")) return;
    setSavingSub(u.id);
    setError(null);
    try {
      const updated = await usersApi.assignSubscription(u.id, subscriptionId);
      setResults((prev) =>
        (prev || []).map((x) =>
          x.id === u.id
            ? { ...x, roles: updated.roles, role_ids: updated.role_ids, subscription: updated.subscription }
            : x,
        ),
      );
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
        Search for a user, then tick the roles they belong to. A user can be linked to many roles.
      </p>

      <div className="review-form__field">
        <input
          type="text"
          value={query}
          onChange={handleSearchChange}
          placeholder="Search by name or email…"
        />
        {searching && <p className="wine-management__loading">Searching…</p>}
        {error && <p className="review-form__error">{error}</p>}
      </div>

      {results !== null && results.length === 0 && (
        <p className="wine-management__empty-state">No users found.</p>
      )}

      <div className="review-list">
        {(results || []).map((u) => (
          <div key={u.id} className="review-card">
            <div className="review-card__top">
              <h3 className="review-card__title">{u.name || "(no name)"}</h3>
              <span className="review-card__comment">{u.email}</span>
            </div>
            {allRoles.map((role) => (
              <label key={role.id} style={{ display: "block", fontWeight: 400 }}>
                <input
                  type="checkbox"
                  checked={hasRole(u, role.id)}
                  onChange={(e) => toggleRole(u, role.id, e.target.checked)}
                />{" "}
                {role.name}
              </label>
            ))}
            <div style={{ marginTop: 10 }}>
              <label className="review-form__label" style={{ display: "block" }}>
                Subscription
              </label>
              <select
                value={u.subscription?.id ?? ""}
                disabled={savingSub === u.id}
                onChange={(e) => changeSubscription(u, Number(e.target.value))}
              >
                <option value="" disabled>
                  {savingSub === u.id ? "Assigning…" : "Select subscription"}
                </option>
                {subscriptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="auth-form__submit"
              disabled={saving === u.id}
              onClick={() => saveRoles(u)}
            >
              {saving === u.id ? "Saving…" : "Save roles"}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}

export default UserRoles;