import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  testAccessApi,
  getTestAccessToken,
  setTestAccessToken,
  clearTestAccessToken,
} from "../services/api.js";

const TestAccessContext = createContext(null);

export function TestAccessProvider({ children }) {
  const [token, setToken] = useState(() => getTestAccessToken());
  const [authenticated, setAuthenticated] = useState(() =>
    Boolean(getTestAccessToken()),
  );
  const [verifying, setVerifying] = useState(() =>
    Boolean(getTestAccessToken()),
  );

  // Boot-time access check:
  //   - with a stored token: verify it (expired/invalidated -> back to gate);
  //   - with no token: probe the API — while the server-side gate is disabled
  //     (no TEST_ACCESS_PASSWORD configured) the app is open, so auto-unlock
  //     instead of showing a meaningless password form. Setting the env var
  //     on the server makes this same probe return 401 -> the form appears,
  //     with no frontend redeploy needed.
  useEffect(() => {
    let cancelled = false;
    const stored = getTestAccessToken();
    setVerifying(true);
    testAccessApi
      .verify()
      .then((result) => {
        if (cancelled) return;
        if (result.authenticated) {
          setAuthenticated(true);
        } else {
          setTestAccessToken(null);
          setToken(null);
          setAuthenticated(false);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const gateRejection =
          err?.code === "test_access_required" || err?.status === 401;
        if (gateRejection) {
          // Token expired/invalidated, or the gate is enabled and no valid
          // token is stored — the password is required.
          setTestAccessToken(null);
          setToken(null);
          setAuthenticated(false);
        } else {
          // Transient/network failure: do not lock a possibly-valid user out.
          setAuthenticated(true);
        }
      })
      .finally(() => {
        if (!cancelled) setVerifying(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = useCallback(async (password) => {
    const result = await testAccessApi.submit(password);
    if (result.authenticated && (result.token || result.disabled)) {
      // A real signed token — or, while the server-side gate is disabled
      // (no TEST_ACCESS_PASSWORD configured), a session sentinel so the
      // boot-time verification keeps the app unlocked.
      const stored = result.token || "gate-disabled";
      setTestAccessToken(stored);
      setToken(stored);
      setAuthenticated(true);
    } else if (!result.authenticated) {
      throw new Error(result.error || "Invalid password");
    }
  }, []);

  const exit = useCallback(() => {
    clearTestAccessToken();
    setToken(null);
    setAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ token, authenticated, verifying, submit, exit }),
    [token, authenticated, verifying, submit, exit],
  );

  return (
    <TestAccessContext.Provider value={value}>
      {children}
    </TestAccessContext.Provider>
  );
}

export function useTestAccess() {
  const context = useContext(TestAccessContext);
  if (!context) {
    throw new Error("useTestAccess must be used within a TestAccessProvider");
  }
  return context;
}
