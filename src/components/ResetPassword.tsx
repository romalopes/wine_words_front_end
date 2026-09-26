import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Password reset page — reached from the "reset password" email link
// (/reset-password?reset_password_token=…). Sets the new password, is signed
// in automatically (the API issues a JWT), then redirects to the wines page.
function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetPasswordToken = searchParams.get("reset_password_token") || "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!resetPasswordToken) {
      setError("This reset link is invalid or expired.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword({
        reset_password_token: resetPasswordToken,
        password,
        password_confirmation: passwordConfirmation,
      });
      navigate("/wines", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to reset password");
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="reset-title">
        <p className="wine-kicker">Account recovery</p>
        <h1 id="reset-title">Choose a new password</h1>
        <p className="auth-card__intro">
          Enter a new password for your account. You'll be signed in right away.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-form__field">
            <span>New password</span>
            <input
              autoComplete="new-password"
              minLength={6}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <label className="auth-form__field">
            <span>Confirm new password</span>
            <input
              autoComplete="new-password"
              minLength={6}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              type="password"
              value={passwordConfirmation}
            />
          </label>

          {error ? (
            <p className="auth-form__error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            className="auth-form__submit"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Please wait..." : "Reset password"}
          </button>
        </form>

        <p className="auth-card__switch">
          <Link to="/login">Back to sign in</Link>
        </p>
      </section>
    </main>
  );
}

export default ResetPassword;