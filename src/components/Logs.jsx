import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { isAdmin } from "../constants/roles";
import { logsApi } from "../services/api";

const LINE_COUNT_OPTIONS = [100, 250, 500, 1000, 2000];

function Logs() {
  const { user, token } = useAuth();
  const isAdminUser = isAdmin(user);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lineCount, setLineCount] = useState(500);

  async function fetchLogs() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await logsApi.fetchLines(lineCount);
      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (err) {
      setError(err.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, lineCount]);

  if (!isAdminUser) {
    return (
      <main className="wine-management">
        <div className="wine-management__container">
          <h1>Logs</h1>
          <p className="wine-management__hint">Access denied. Admin role required.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="wine-management">
      <div className="wine-management__container">
        <h1>Application Logs</h1>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <label htmlFor="line-count" style={{ fontSize: 14 }}>
            Show last:
          </label>
          <select
            id="line-count"
            value={lineCount}
            onChange={(e) => setLineCount(parseInt(e.target.value, 10))}
            disabled={loading}
          >
            {LINE_COUNT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} lines
              </option>
            ))}
          </select>
          <button
            type="button"
            className="auth-form__submit"
            disabled={loading}
            onClick={fetchLogs}
            style={{ marginLeft: "auto" }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <p style={{ color: "#b00", marginBottom: 12 }}>{error}</p>
        )}

        <pre style={{
          background: "#1e1e1e",
          color: "#d4d4d4",
          padding: 16,
          borderRadius: 6,
          fontSize: 12,
          lineHeight: 1.5,
          overflow: "auto",
          maxHeight: "calc(100vh - 220px)",
          fontFamily: "monospace",
          margin: 0,
        }}>
          {logs.length === 0 && !loading && "No log entries found."}
          {logs.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </pre>
      </div>
    </main>
  );
}

export default Logs;
