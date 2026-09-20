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

  // Boot-time verification: if the stored token has expired (or was
  // invalidated), fall back to the gate.
  useEffect(() => {
    let cancelled = false;
    const stored = getTestAccessToken();
    if (!stored) return undefined;

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
    if (result.authenticated && result.token) {
      setTestAccessToken(result.token);
      setToken(result.token);
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
