import { useEffect, useRef, useState } from "react";
import styles from "../ApiHealth.module.css";
import { copyText } from "../../../utils/clipboard";
import type { ApiCheck } from "../../../services/apiHealth/apiHealthConfig";
import type { HealthCheckResult } from "../../../services/apiHealth/healthRunner";

type CopyState = "idle" | "copied" | "failed";

interface JsonBlockProps {
  label: string;
  data: unknown;
  copyable?: boolean;
}

function JsonBlock({ label, data, copyable = false }: JsonBlockProps) {
  let text: string;
  try {
    text = JSON.stringify(data, null, 2);
  } catch {
    text = String(data);
  }

  const [copyState, setCopyState] = useState<CopyState>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function handleCopy(): void {
    copyText(text)
      .then(() => setCopyState("copied"))
      .catch(() => setCopyState("failed"))
      .finally(() => {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopyState("idle"), 1500);
      });
  }

  return (
    <div className={styles.inspectorSection}>
      {copyable ? (
        <div className={styles.inspectorHeader}>
          <div className={styles.inspectorLabel}>{label}</div>
          <button
            type="button"
            className={`${styles.copyBtn}${
              copyState === "copied" ? ` ${styles.copyBtnCopied}` : ""
            }`}
            onClick={handleCopy}
          >
            {copyState === "copied" ? "Copied ✓" : copyState === "failed" ? "Failed" : "Copy"}
          </button>
        </div>
      ) : (
        <div className={styles.inspectorLabel}>{label}</div>
      )}
      <pre className={styles.inspectorCode}>
        <code>{text}</code>
      </pre>
    </div>
  );
}

export interface ResponseInspectorProps {
  check: ApiCheck | null | undefined;
  result: HealthCheckResult | null | undefined;
}

export default function ResponseInspector({
  check,
  result,
}: ResponseInspectorProps) {
  if (!check || !result) return null;

  const headers = result.requestHeaders || {};

  return (
    <div className={styles.inspector}>
      <JsonBlock label="Target Request" data={{ method: check.method, url: check.url }} />
      <JsonBlock label="Request Headers" data={headers} />
      <JsonBlock label="Response Meta" data={{ status: result.status, expectedStatus: result.expectedStatus }} />
      {result.error && (
        <JsonBlock label="Error" data={{ error: result.error, retried: result.retried }} />
      )}
      <JsonBlock label="Response Payload" data={result.payload ?? null} copyable />
    </div>
  );
}