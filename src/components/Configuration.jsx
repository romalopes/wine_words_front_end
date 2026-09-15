import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { isAdmin } from "../constants/roles";
import { configurationApi } from "../services/api";

// Global Configuration page (admin-only). Edits the runtime settings stored
// in the backend's app_settings table. Each attribute is rendered as its own
// row; the first one is the "save logs to database" audit-trail toggle
// (default: true). New global attributes should follow the same pattern:
// add the default to the backend AppSetting model, expose it through
// /api/v1/configuration, then render a control row here.
function Configuration() {
  const { user } = useAuth();
  const isAdminUser = isAdmin(user);
  const [logsSaved, setLogsSaved] = useState(true);
  const [savedLogsSaved, setSavedLogsSaved] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    if (!isAdminUser) return;
    let cancelled = false;
    configurationApi
      .fetch()
      .then((data) => {
        if (cancelled) return;
        const value = data?.logs_saved_to_database !== false;
        setLogsSaved(value);
        setSavedLogsSaved(value);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load configuration.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdminUser]);

  if (!isAdminUser) {
    return (
      <main className="wine-management">
        <div className="wine-management__container">
          <h1>Configuration</h1>
          <p className="wine-management__hint">
            Access denied. Admin role required.
          </p>
        </div>
      </main>
    );
  }

  const dirty = logsSaved !== savedLogsSaved;

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data = await configurationApi.update(logsSaved);
      const value = data?.logs_saved_to_database !== false;
      setLogsSaved(value);
      setSavedLogsSaved(value);
      setSavedAt(new Date());
    } catch (err) {
      setError(err.message || "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="wine-management">
      <div className="wine-management__container">
        <h1>Configuration</h1>
        <p className="wine-management__hint">
          Global application settings. Changes take effect immediately for
          every user of the system.
        </p>

        {loading ? (
          <p className="wine-management__hint">Loading configuration…</p>
        ) : (
          <form onSubmit={handleSave}>
            <div className="wine-management__header">
              <div>
                <h2>Logs</h2>
              </div>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                margin: "8px 0",
              }}
            >
              <input
                type="checkbox"
                checked={logsSaved}
                onChange={(event) => setLogsSaved(event.target.checked)}
                disabled={saving}
              />
              Save logs to database
            </label>
            <p className="wine-management__hint">
              When enabled (default), every audited action is persisted to the
              database audit trail shown on the Logs page. When disabled, no
              new database log entries are written — the application log file
              is unaffected.
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                marginTop: 16,
              }}
            >
              <button
                type="submit"
                className="auth-form__submit"
                disabled={saving || !dirty}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              {savedAt && !error && (
                <span className="wine-management__hint">
                  Saved at {savedAt.toLocaleTimeString()}
                </span>
              )}
              {error && (
                <span className="wine-management__hint" role="alert">
                  {error}
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

export default Configuration;