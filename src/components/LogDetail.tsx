import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { logsApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { isAdmin } from "../constants/roles";
import { errorMessage } from "../utils/errors";
import type { AuditLog } from "../types/user";

/**
 * Renders a timestamp, echoing the raw value back if it is unparseable. Kept
 * local rather than using `utils/dates` because a malformed timestamp in an
 * audit record should be shown verbatim, not replaced with a dash.
 */
function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

/** One `[label, value]` row of the definition list. */
type LogField = [label: string, value: string | number | null];

/** Detail view for a single audit-log record. Admin only. */
function LogDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdminUser = isAdmin(user);

  const [log, setLog] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdminUser) return undefined;

    // Captured as a const so the narrowing below survives into the closure.
    const logId = id;
    let cancelled = false;

    async function fetchLog() {
      if (!logId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await logsApi.fetchAuditLog(logId);
        if (!cancelled) setLog(data);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Failed to load log"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLog();

    return () => {
      cancelled = true;
    };
  }, [id, isAdminUser]);

  if (!isAdminUser) {
    return (
      <main className="wine-management">
        <div className="wine-management__container">
          <h1>Audit Log</h1>
          <p className="wine-management__hint">
            Access denied. Admin role required.
          </p>
          <Link to="/admin/logs" className="auth-form__submit">
            ← Back to audit log
          </Link>
        </div>
      </main>
    );
  }

  // The request id links back to the filtered list, so it is rendered as a link
  // rather than plain text.
  const fields: LogField[] = log
    ? [
        ["Description", log.description],
        [
          "User",
          log.user
            ? `${log.user.user_name ?? "—"} (${log.user.email})`
            : "— (anonymous/system)",
        ],
        ["Action", log.action],
        ["Method", log.method],
        ["Path", log.path],
        ["Status", log.status],
        ["Request ID", log.request_id],
        ["IP address", log.ip_address],
        ["User agent", log.user_agent],
        ["Logged at", formatDateTime(log.created_at)],
      ]
    : [];

  return (
    <main className="wine-management">
      <div className="wine-management__container">
        <h1>Audit Log #{id}</h1>
        <p>
          <Link to="/admin/logs">← Back to audit log</Link>
        </p>

        {loading && <p className="wine-management__loading">Loading…</p>}
        {error && <p className="review-form__error">{error}</p>}

        {log && (
          <div className="review-card">
            <dl style={{ margin: 0 }}>
              {fields.map(([label, value]) => (
                <div
                  key={label}
                  style={{ display: "flex", gap: 8, padding: "4px 0" }}
                >
                  <dt
                    className="review-form__label"
                    style={{ minWidth: 120, margin: 0 }}
                  >
                    {label}
                  </dt>
                  <dd style={{ margin: 0, overflowWrap: "anywhere" }}>
                    {log.request_id && label === "Request ID" ? (
                      <Link
                        to={`/admin/logs?request_id=${encodeURIComponent(log.request_id)}`}
                      >
                        {value}
                      </Link>
                    ) : (
                      (value ?? "—")
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <h3 style={{ marginTop: 16 }}>Affected objects</h3>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {(log.objects || []).map((object) => (
                <li
                  key={`${object.type}-${object.id}`}
                  style={{ padding: "2px 0" }}
                >
                  {object.type} #{object.id}
                  {object.label ? ` — ${object.label}` : ""}
                  {object.alive === false && (
                    <span style={{ color: "#b00" }}> (deleted)</span>
                  )}
                  {object.alive === true && (
                    <span style={{ color: "#080" }}> (exists)</span>
                  )}
                </li>
              ))}
              {(!log.objects || log.objects.length === 0) && <li>None</li>}
            </ul>
          </div>
        )}

        {!loading && !error && !log && (
          <p className="wine-management__empty-state">Log entry not found.</p>
        )}
      </div>
    </main>
  );
}

export default LogDetail;