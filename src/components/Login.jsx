import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authApi } from "../services/api";
import {
  PROVIDER_LABELS,
  ProviderCancelledError,
  ProviderConfigurationError,
  ProviderUnavailableError,
  availableProviders,
  signInWith,
} from "../services/socialProviders";

const initialForm = {
  email: "",
  password: "",
  password_confirmation: "",
  user_name: "",
};

// Minimal brand marks, sized by .auth-card__social-btn svg. Kept inline so the
// buttons work with no icon dependency.
const PROVIDER_ICONS = {
  google: (
    <svg aria-hidden="true" height="18" viewBox="0 0 18 18" width="18">
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.96 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3-2.33Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  ),
  apple: (
    <svg aria-hidden="true" height="18" viewBox="0 0 18 18" width="18">
      <path
        d="M13.05 9.54c.02 2.2 1.93 2.93 1.96 2.94-.02.06-.31 1.06-1.02 2.1-.61.9-1.25 1.79-2.25 1.81-.98.02-1.3-.58-2.42-.58-1.13 0-1.48.56-2.42.6-.97.03-1.71-.97-2.33-1.86C3.28 12.7 2.28 9.02 3.6 6.62c.65-1.19 1.82-1.94 3.09-1.96.97-.02 1.88.65 2.42.65.54 0 1.55-.8 2.62-.68.45.02 1.7.18 2.5 1.36-.06.04-1.5.87-1.48 2.6M11.28 3.6c.48-.58.8-1.38.71-2.18-.69.03-1.52.46-2.01 1.03-.44.51-.83 1.33-.73 2.11.77.06 1.55-.39 2.03-.96"
        fill="#111"
      />
    </svg>
  ),
  microsoft: (
    <svg aria-hidden="true" height="18" viewBox="0 0 18 18" width="18">
      <path d="M1 1h7.6v7.6H1z" fill="#F25022" />
      <path d="M9.4 1H17v7.6H9.4z" fill="#7FBA00" />
      <path d="M1 9.4h7.6V17H1z" fill="#00A4EF" />
      <path d="M9.4 9.4H17V17H9.4z" fill="#FFB900" />
    </svg>
  ),
  facebook: (
    <svg aria-hidden="true" height="18" viewBox="0 0 18 18" width="18">
      <path
        d="M18 9a9 9 0 1 0-10.4 8.9v-6.3H5.3V9h2.3V7c0-2.3 1.4-3.6 3.4-3.6.98 0 2 .17 2 .17v2.2h-1.13c-1.11 0-1.46.7-1.46 1.4V9h2.5l-.4 2.6h-2.1v6.3A9 9 0 0 0 18 9Z"
        fill="#1877F2"
      />
    </svg>
  ),
};

function Login() {
  const { user, signIn, signUp, socialSignIn } = useAuth();
  const [mode, setMode] = useState("signIn");
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Provider whose popup is currently open, so only that button shows as busy.
  const [pendingProvider, setPendingProvider] = useState(null);

  const isSignUp = mode === "signUp";
  const isForgot = mode === "forgot";
  // Only providers with a client id configured for this build are offered;
  // the same backend still validates the credential.
  const providers = availableProviders();
  const navigate = useNavigate();

  function updateField(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  function toggleMode(nextMode) {
    setMode(nextMode);
    setFormError(null);
    setSuccess(null);
    setForm(initialForm);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setSuccess(null);

    try {
      const { email, password, password_confirmation, user_name } = form;

      if (isForgot) {
        if (!email) {
          setFormError("Enter your account email.");
          return;
        }
        const result = await authApi.forgotPassword(email);
        setSuccess(result.message || "Reset instructions sent.");
        setForm(initialForm);
        return;
      }

      if (!email || !password) {
        setFormError("Email and password are required.");
        return;
      }
      if (isSignUp && password.length < 6) {
        setFormError("Password must be at least 6 characters long.");
        return;
      }
      if (isSignUp && password !== password_confirmation) {
        setFormError("Passwords do not match.");
        return;
      }

      if (isSignUp) {
        await signUp({
          email,
          password,
          password_confirmation,
          user_name: user_name.trim(),
        });
      } else {
        await signIn({ email, password });
      }

      navigate("/wines", { replace: true });
    } catch (error) {
      console.error(error);
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
// "Continue with <provider>": run the provider's popup, then hand the
  // provider-issued credential to the API. The API verifies it and returns the
  // same session payload as email/password, so nothing after this point needs
  // to know how the person signed in.
  const handleSocial = async (provider) => {
    setFormError(null);
    setSuccess(null);
    setPendingProvider(provider);

    try {
      const { credential, nonce } = await signInWith(provider);
      await socialSignIn(provider, { credential, nonce });
      navigate("/wines", { replace: true });
    } catch (error) {
      // Closing the popup is a normal thing to do, not a failure. A
      // misconfigured provider (e.g. an unauthorised Google origin) IS a
      // failure worth showing, with the actionable detail attached.
      if (error instanceof ProviderConfigurationError) {
        console.error(error);
        setFormError(error.message);
      } else if (!(error instanceof ProviderCancelledError)) {
        console.error(error);
        setFormError(
          error instanceof ProviderUnavailableError
            ? error.message
            : error.message || `Could not sign in with ${PROVIDER_LABELS[provider]}.`,
        );
      }
    } finally {
      setPendingProvider(null);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        {user ? (
          <p className="auth-card__status">
            You are already signed in as {user.email}.
          </p>
        ) : (
          <>
            <p className="wine-kicker">
              {isForgot
                ? "Account recovery"
                : isSignUp
                  ? "Create account"
                  : "Welcome back"}
            </p>
            <h1 id="auth-title">
              {isForgot
                ? "Reset your password"
                : isSignUp
                  ? "Join Wine Words"
                  : "Sign in to Wine Words"}
            </h1>
            <p className="auth-card__intro">
              {isForgot
                ? "Enter your account email and we'll send you a link to set a new password."
                : isSignUp
                  ? "Save tasting profiles, track the wines you have tried, and sync your quiz results across devices."
                  : "Access your saved tasting profiles and continue where you left off in the quiz."}
            </p>

            {success ? (
              <p className="auth-card__status">{success}</p>
            ) : (
              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                {isSignUp && !isForgot ? (
                  <label className="auth-form__field">
                    <span>User Name</span>
                    <input
                      autoComplete="username"
                      name="user_name"
                      onChange={updateField("user_name")}
                      type="text"
                      value={form.user_name}
                      minLength={2}
                      maxLength={40}
                      required
                    />
                  </label>
                ) : null}

                <label className="auth-form__field">
                  <span>Email</span>
                  <input
                    autoComplete="email"
                    name="email"
                    onChange={updateField("email")}
                    required
                    type="email"
                    value={form.email}
                  />
                </label>

                {!isForgot ? (
                  <label className="auth-form__field">
                    <span>Password</span>
                    <input
                      autoComplete={
                        isSignUp ? "new-password" : "current-password"
                      }
                      minLength={6}
                      name="password"
                      onChange={updateField("password")}
                      required
                      type="password"
                      value={form.password}
                    />
                  </label>
                ) : null}

                {isSignUp ? (
                  <label className="auth-form__field">
                    <span>Confirm password</span>
                    <input
                      autoComplete="new-password"
                      minLength={6}
                      name="password_confirmation"
                      onChange={updateField("password_confirmation")}
                      required
                      type="password"
                      value={form.password_confirmation}
                    />
                  </label>
                ) : null}

                {formError ? (
                  <p className="auth-form__error" role="alert">
                    {formError}
                  </p>
                ) : null}

                <button
                  className="auth-form__submit"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting
                    ? "Please wait..."
                    : isForgot
                      ? "Send reset link"
                      : isSignUp
                        ? "Create account"
                        : "Sign in"}
                </button>
              </form>
            )}

            {!isForgot && providers.length > 0 ? (
              <>
                <div className="auth-card__divider">
                  <span>OR</span>
                </div>
                <div className="auth-card__social-buttons">
                  {providers.map((provider) => (
                    <button
                      className={`auth-card__social-btn auth-card__social-btn--${provider}`}
                      disabled={isSubmitting || pendingProvider !== null}
                      key={provider}
                      onClick={() => handleSocial(provider)}
                      type="button"
                    >
                      {PROVIDER_ICONS[provider]}
                      <span>
                        {pendingProvider === provider
                          ? "Connecting..."
                          : `Continue with ${PROVIDER_LABELS[provider]}`}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {!isForgot && !isSignUp && (
              <p className="auth-card__switch">
                <button onClick={() => toggleMode("forgot")} type="button">
                  Forgot your password?
                </button>
              </p>
            )}

            <p className="auth-card__switch">
              {isForgot ? (
                <>
                  Remembered it?{" "}
                  <button onClick={() => toggleMode("signIn")} type="button">
                    Sign in
                  </button>
                </>
              ) : isSignUp ? (
                <>
                  Already have an account?{" "}
                  <button onClick={() => toggleMode("signIn")} type="button">
                    Sign in instead
                  </button>
                </>
              ) : (
                <>
                  New to Cellar Signal?{" "}
                  <button onClick={() => toggleMode("signUp")} type="button">
                    Create an account
                  </button>
                </>
              )}
            </p>
          </>
        )}

        <Link className="text-link" to="/wines">
          Back to wine list
        </Link>
      </section>
    </main>
  );
}

export default Login;
