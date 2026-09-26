import { useState } from "react";
import styles from "../ApiHealth.module.css";
import ResponseInspector from "./ResponseInspector";
import type { ApiCheck } from "../../../services/apiHealth/apiHealthConfig";
import type { HealthCheckResult } from "../../../services/apiHealth/healthRunner";

export interface WriteSandboxProps {
  check: ApiCheck;
  onRun: () => void;
  result: HealthCheckResult | null | undefined;
  running: boolean;
}

export default function WriteSandbox({
  check,
  onRun,
  result,
  running,
}: WriteSandboxProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className={styles.writeSandbox}>
      <h3 className={styles.writeTitle}>Write Sandbox</h3>
      <p className={styles.writeDesc}>
        {check.description ||
          "These requests modify data and are excluded from “Run All Checks”. They require explicit manual confirmations."}
      </p>

      <button
        type="button"
        className={`${styles.btn} ${styles.btnDanger}`}
        disabled={running}
        onClick={() => setConfirming(true)}
      >
        {running ? "Running…" : "Run Write Test"}
      </button>

      {result && (
        <div style={{ marginTop: "0.9rem" }}>
          <span
            className={`${styles.badge} ${result.passed ? styles.pass : styles.fail}`}
          >
            {result.passed ? "PASS" : "FAIL"}
          </span>
          <span className={styles.statusText} style={{ marginLeft: "0.5rem" }}>
            {result.error || `Created + deleted temp producer in ${result.latencyMs}ms`}
          </span>
          <div style={{ marginTop: "0.6rem" }}>
            <ResponseInspector check={check} result={result} />
          </div>
        </div>
      )}

      {confirming && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal} role="dialog" aria-modal="true">
            <h4 style={{ marginTop: 0 }}>Confirm write test</h4>
            <p>
              This will create a temporary producer and then immediately delete
              it. No other data is modified. Continue?
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btn}
                onClick={() => setConfirming(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={() => {
                  setConfirming(false);
                  onRun();
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}