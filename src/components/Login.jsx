import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authApi } from "../services/api";

const initialForm = { email: "", password: "", user_name: "" };

function Login() {
  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState("signIn");
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === "signUp";
  const isForgot = mode === "forgot";
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
      const { email, password, user_name } = form;

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

      if (isSignUp) {
        await signUp({ email, password, user_name: user_name.trim() });
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
