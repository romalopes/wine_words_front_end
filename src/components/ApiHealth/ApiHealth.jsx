import { useMemo, useState } from "react";
import styles from "./ApiHealth.module.css";
import {
  API_CHECKS,
  API_CATEGORIES,
  isWriteCheck,
} from "../../services/apiHealth/apiHealthConfig.js";
import {
  runCheck,
  runWriteFlow,
} from "../../services/apiHealth/healthRunner.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { isAdmin } from "../../constants/roles.js";
import { BACK_END_VERSION } from "../../constants/versions.js";
import ResponseInspector from "./components/ResponseInspector.jsx";
import WriteSandbox from "./components/WriteSandbox.jsx";

const methodClass = {
  GET: styles.get,
  POST: styles.post,
  PATCH: styles.patch,
  DELETE: styles.delete,
};

function latencyClass(rating) {
  if (rating === "excellent") return styles.pass;
  if (rating === "good") return styles.neutral;
  return styles.fail;
}

function StatusBadge({ passed }) {
  const cls =
    passed == null ? styles.neutral : passed ? styles.pass : styles.fail;
  const label = passed == null ? "—" : passed ? "PASS" : "FAIL";
  return <span className={`${styles.badge} ${cls}`}>{label}</span>;
}

export default function ApiHealth() {
  const { user, token } = useAuth();
  const isAdmin = isAdmin(user);

  const [results, setResults] = useState({});
  const [running, setRunning] = useState({}); // checkId -> bool
  const [runningAll, setRunningAll] = useState(false);
  const [history, setHistory] = useState([]);
  const [openCategories, setOpenCategories] = useState({});
  const [expanded, setExpanded] = useState({}); // checkId -> bool

  const regularChecks = useMemo(
    () => API_CHECKS.filter((c) => !isWriteCheck(c)),
    [],
  );
  const writeChecks = useMemo(() => API_CHECKS.filter(isWriteCheck), []);
  const grouped = useMemo(() => {
    const map = {};
    regularChecks.forEach((check) => {
      if (!map[check.category]) map[check.category] = [];
      map[check.category].push(check);
    });
    return map;
  }, [regularChecks]);

  if (!isAdmin) {
    return (
      <main className={styles.container}>
        <p className={styles.statusText}>
          You do not have permission to view API health diagnostics.
        </p>
      </main>
    );
  }

  const getAuthToken = () => token || null;

  async function runSingle(check) {
    setRunning((prev) => ({ ...prev, [check.id]: true }));
    try {
      const result = await runCheck(check, { getAuthToken });
      setResults((prev) => ({ ...prev, [check.id]: result }));
      return result;
    } finally {
      setRunning((prev) => ({ ...prev, [check.id]: false }));
    }
  }

  async function runAll() {
    setRunningAll(true);
    try {
      const outs = await Promise.all(
        regularChecks.map((c) => runCheck(c, { getAuthToken })),
      );
      setResults((prev) => {
        const next = { ...prev };
        outs.forEach((r) => {
          next[r.id] = r;
        });
        return next;
      });
      const passed = outs.filter((r) => r.passed).length;
      const avgLatency = Math.round(
        outs.reduce((sum, r) => sum + (r.latencyMs || 0), 0) /
          Math.max(outs.length, 1),
      );
      setHistory((prev) =>
        [
          {
            at: new Date().toLocaleTimeString(),
            passed,
            failed: outs.length - passed,
            avgLatency,
          },
          ...prev,
        ].slice(0, 5),
      );
    } finally {
      setRunningAll(false);
    }
  }

  async function runWriteSingle(check) {
    setRunning((prev) => ({ ...prev, [check.id]: true }));
    try {
      const result = await runWriteFlow(check, { getAuthToken });
      setResults((prev) => ({ ...prev, [check.id]: result }));
    } finally {
      setRunning((prev) => ({ ...prev, [check.id]: false }));
    }
  }

  function toggleCategory(name) {
    setOpenCategories((prev) => ({ ...prev, [name]: !prev[name] }));
  }
  function toggleInspector(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const allResults = Object.values(results);
  const totalPassed = allResults.filter((r) => r.passed).length;
  const totalFailed = allResults.filter((r) => !r.passed).length;
  const avgLatency = allResults.length
    ? Math.round(
        allResults.reduce((s, r) => s + (r.latencyMs || 0), 0) /
          allResults.length,
      )
    : 0;

  const detailed = results["system-detailed"];
  const backendVersion = detailed?.payload?.version;
  const versionMatched = backendVersion
    ? backendVersion === BACK_END_VERSION
    : null;
  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>API Health &amp; Diagnostics</h1>
          <p className={styles.headerMeta}>
            {API_CHECKS.length} checks configured · backend{" "}
            <code>{BACK_END_VERSION}</code> · {new Date().toLocaleString()}
          </p>
        </div>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={runAll}
            disabled={runningAll}
          >
            {runningAll && <span className={styles.spinner} />} Run All Checks
          </button>
        </div>
      </div>

      {versionMatched != null && (
        <div
          className={`${styles.versionNotice} ${versionMatched ? styles.versionOk : styles.versionWarn}`}
        >
          {versionMatched
            ? `✓ Version match: backend ${backendVersion}`
            : `⚠ Version mismatch: backend reports ${backendVersion} but frontend expects ${BACK_END_VERSION}`}
        </div>
      )}

      {allResults.length > 0 && (
        <div className={styles.summaryBar}>
          <span className={styles.summaryStat}>
            <span className={styles.summaryLabel}>Passed</span>
            <span
              className={`${styles.summaryValue}`}
              style={{ color: "#137333" }}
            >
              {totalPassed}
            </span>
          </span>
          <span className={styles.summaryStat}>
            <span className={styles.summaryLabel}>Failed</span>
            <span
              className={`${styles.summaryValue}`}
              style={{ color: "#c5221f" }}
            >
              {totalFailed}
            </span>
          </span>
          <span className={styles.summaryStat}>
            <span className={styles.summaryLabel}>Avg Latency</span>
            <span className={`${styles.summaryValue}`}>{avgLatency}ms</span>
          </span>
        </div>
      )}

      {Object.entries(grouped).map(([category, checks]) => {
        const open = openCategories[category] !== false;
        return (
          <section key={category} className={styles.category}>
            <button
              type="button"
              className={styles.categoryHeader}
              onClick={() => toggleCategory(category)}
            >
              <span>{category}</span>
              <span className={styles.categorySummary}>{open ? "▲" : "▼"}</span>
            </button>
            {open && (
              <div className={styles.categoryBody}>
                {checks.map((check) => {
                  const result = results[check.id];
                  const isRunning = running[check.id];
                  const isExpanded = expanded[check.id];
                  return (
                    <div key={check.id}>
                      <div className={styles.row}>
                        <span
                          className={`${styles.methodPill} ${methodClass[check.method]}`}
                        >
                          {check.method}
                        </span>
                        <div className={styles.rowMeta}>
                          <p className={styles.rowName}>{check.name}</p>
                          <div className={styles.rowUrl}>{check.url}</div>
                        </div>
                        <StatusBadge passed={result?.passed} />
                        {result && (
                          <span className={styles.latency}>
                            <span
                              className={`${styles.badge} ${latencyClass(result.latencyRating)}`}
                            >
                              {result.latencyMs}ms
                            </span>
                            <span style={{ marginLeft: "0.4rem" }}>
                              {result.status}
                            </span>
                          </span>
                        )}
                        <button
                          type="button"
                          className={styles.btn}
                          disabled={isRunning || runningAll}
                          onClick={() => runSingle(check)}
                        >
                          {isRunning ? "Testing…" : "Test"}
                        </button>
                        <button
                          type="button"
                          className={styles.btn}
                          onClick={() => toggleInspector(check.id)}
                        >
                          {isExpanded ? "Hide Details" : "Show Details"}
                        </button>
                      </div>
                      {isExpanded && (
                        <ResponseInspector check={check} result={result} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      {writeChecks.map((check) => (
        <WriteSandbox
          key={check.id}
          check={check}
          result={results[check.id]}
          running={running[check.id]}
          onRun={() => runWriteSingle(check)}
        />
      ))}

      {history.length > 0 && (
        <div className={styles.history}>
          <h2 className={styles.historyTitle}>Run History (last 5)</h2>
          {history.map((h, i) => (
            <div key={i} className={styles.historyRow}>
              <span>{h.at}</span>
              <span className={`${styles.badge} ${styles.pass}`}>
                {h.passed} passed
              </span>
              <span className={`${styles.badge} ${styles.fail}`}>
                {h.failed} failed
              </span>
              <span>avg {h.avgLatency}ms</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
