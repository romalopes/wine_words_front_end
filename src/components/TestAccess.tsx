import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useTestAccess } from "../contexts/TestAccessContext";
import "./TestAccess.css";

interface TestAccessGateProps {
  children: ReactNode;
}

/**
 * Private test-access gate — the first screen while the app is in its private
 * testing phase. Exchanges the password for a signed token via
 * POST /api/v1/test_access; the password itself never touches the client
 * bundle.
 */
function TestAccessPage() {
  const { authenticated, verifying, submit, exit } = useTestAccess();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!password.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await submit(password);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid password");
    } finally {
      setBusy(false);
    }
  };

  if (authenticated) {
    return (
      <div className="test-access-page">
        <div className="test-access-card">
          <div className="test-access-icon" aria-hidden="true">✔</div>
          <h1>Test access active</h1>
          <p className="test-access-sub">
            You have private test access to this application.
          </p>
          <button
            type="button"
            className="test-access-btn"
            onClick={() => window.history.back()}
          >
            Enter app
          </button>
          <button
            type="button"
            className="test-access-btn secondary"
            onClick={exit}
          >
            Exit Test Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="test-access-page">
      <div className="test-access-card">
        <div className="test-access-icon" aria-hidden="true">🔒</div>
        <h1>Private Test Access</h1>
        <p className="test-access-sub">
          This application is in private testing. Enter the test password to
          continue.
        </p>
        <form onSubmit={handleSubmit} className="test-access-form">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Test password"
            aria-label="Test password"
            autoFocus
            autoComplete="current-password"
          />
          <button type="submit" className="test-access-btn" disabled={busy || verifying}>
            {busy ? "Checking…" : "Enter"}
          </button>
        </form>
        {error && <p className="test-access-error">{error}</p>}
      </div>
    </div>
  );
}

/**
 * Renders only the gate page until test access is granted — no header, no
 * routes, no deep links.
 */
export function TestAccessGate({ children }: TestAccessGateProps) {
  const { authenticated, verifying } = useTestAccess();
  if (!authenticated && !verifying) return <TestAccessPage />;
  return children;
}

export default TestAccessPage;
