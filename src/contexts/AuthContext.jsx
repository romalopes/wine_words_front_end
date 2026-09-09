import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi, setAuthToken } from "../services/api.js";

const AuthContext = createContext(null);

const STORAGE_TOKEN_KEY = "wine_prediction_token";

function readStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_TOKEN_KEY);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readStoredToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(readStoredToken()));

  // Restore the session on mount when a token is stored.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const result = await authApi.me();
        if (!cancelled) setUser(result.user ?? null);
      } catch {
        window.localStorage.removeItem(STORAGE_TOKEN_KEY);
        setToken(null);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (token) {
      restore();
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistToken = useCallback((nextToken) => {
    setToken(nextToken);
    if (nextToken) {
      window.localStorage.setItem(STORAGE_TOKEN_KEY, nextToken);
    } else {
      window.localStorage.removeItem(STORAGE_TOKEN_KEY);
    }
    setAuthToken(nextToken);
  }, []);

  const signIn = useCallback(
    async ({ email, password }) => {
      const result = await authApi.signIn({ email, password });
      const nextToken = extractToken(result);
      persistToken(nextToken);
      setUser(result.user ?? null);
      return result.user;
    },
    [persistToken],
  );

  const signUp = useCallback(
    async ({ email, password, user_name }) => {
      const result = await authApi.signUp({ email, password, user_name });
      const nextToken = extractToken(result);
      persistToken(nextToken);
      setUser(result.user ?? null);
      return result.user;
    },
    [persistToken],
  );

  const resetPassword = useCallback(
    async ({ reset_password_token, password, password_confirmation }) => {
      const result = await authApi.resetPassword({
        reset_password_token,
        password,
        password_confirmation,
      });
      const nextToken = extractToken(result);
      persistToken(nextToken);
      setUser(result.user ?? null);
      return result.user;
    },
    [persistToken],
  );

  const refreshSession = useCallback(async () => {
    try {
      const result = await authApi.me();
      setUser(result.user ?? null);
      return result.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.signOut();
    } catch {
      // Ignore network errors on sign out; clear locally regardless.
    }
    persistToken(null);
    setUser(null);
  }, [persistToken]);

  const value = useMemo(
    () => ({
      user,
      token,
      session: token ? { token } : null,
      isAuthenticated: Boolean(token),
      loading,
      signIn,
      signUp,
      resetPassword,
      refreshSession,
      signOut,
    }),
    [user, token, loading, signIn, signUp, resetPassword, refreshSession, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function extractToken(response) {
  // devise-jwt returns the token in the Authorization header; the api layer
  // surfaces it on the response object.
  return response?.token || response?.authorization || null;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
