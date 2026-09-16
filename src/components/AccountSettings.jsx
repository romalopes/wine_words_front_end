import { useCallback, useEffect, useState } from "react";
import { accountApi, countriesApi, identitiesApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import {
  PROVIDER_LABELS,
  ProviderCancelledError,
  availableProviders,
  signInWith,
} from "../services/socialProviders";

const emptyAccount = {
  user_name: "",
  first_name: "",
  last_name: "",
  phone: "",
  date_of_birth: "",
  address: {
    street_address: "",
    city: "",
    state: "",
    postal_code: "",
    country_id: "",
  },
};

function str(v) {
  return v === null || v === undefined ? "" : String(v);
}

function Field({ label, children, wide }) {
  return (
    <label className={`auth-form__field${wide ? " account-fields--wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

// Collects every message from the API's errors object (hash of
// field => [messages]) into one readable line.
function flattenErrors(errors) {
  if (!errors) return "";
  return Object.entries(errors)
    .map(([field, messages]) => {
      const list = Array.isArray(messages) ? messages : [messages];
      return `${field.replace(/_/g, " ")} ${list.join(", ")}`;
    })
    .join(" · ");
}

function parseApiError(err, fallback) {
  let message = err.message || fallback;
  try {
    const parsed = JSON.parse(err.message);
    if (parsed && parsed.errors) message = flattenErrors(parsed.errors);
  } catch {
    /* err.message is not JSON — use as-is */
  }
  return message;
}

export default function AccountSettings() {
  const { refreshSession } = useAuth();
  const [form, setForm] = useState(emptyAccount);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [passwords, setPasswords] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  // Connected sign-in methods (Google / Apple / Microsoft / Facebook).
  const [identities, setIdentities] = useState([]);
  const [passwordAuthentication, setPasswordAuthentication] = useState(true);
  const [identitiesLoading, setIdentitiesLoading] = useState(true);
  const [identitiesNotice, setIdentitiesNotice] = useState(null);
  const [identitiesError, setIdentitiesError] = useState(null);
  const [connectingProvider, setConnectingProvider] = useState(null);
  const [disconnectingId, setDisconnectingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([accountApi.show(), countriesApi.list().catch(() => [])])
      .then(([account, countryList]) => {
        if (cancelled) return;
        setForm({
          user_name: str(account.user_name),
          first_name: str(account.first_name),
          last_name: str(account.last_name),
          phone: str(account.phone),
          date_of_birth: str(account.date_of_birth),
          address: {
            street_address: str(account.address?.street_address),
            city: str(account.address?.city),
            state: str(account.address?.state),
            postal_code: str(account.address?.postal_code),
            country_id: str(account.address?.country_id),
          },
        });
        setCountries(Array.isArray(countryList) ? countryList : []);
      })
      .catch((err) => {
        if (!cancelled) setProfileError(err.message || "Failed to load account.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadIdentities = useCallback(async () => {
    setIdentitiesLoading(true);
    setIdentitiesError(null);
    try {
      const data = await identitiesApi.list();
      setIdentities(Array.isArray(data?.identities) ? data.identities : []);
      setPasswordAuthentication(data?.password_authentication !== false);
    } catch (err) {
      setIdentitiesError(err.message || "Failed to load sign-in methods.");
    } finally {
      setIdentitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIdentities();
  }, [loadIdentities]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setAddressField(key, value) {
    setForm((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileNotice(null);
    setProfileError(null);
    try {
      await accountApi.update({
        user_name: form.user_name,
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        phone: form.phone || null,
        date_of_birth: form.date_of_birth || null,
        address: {
          street_address: form.address.street_address || null,
          city: form.address.city || null,
          state: form.address.state || null,
          postal_code: form.address.postal_code || null,
          country_id: form.address.country_id || null,
        },
      });
      setProfileNotice("Account updated.");
      refreshSession(); // the header shows user_name — keep it in sync
    } catch (err) {
      setProfileError(parseApiError(err, "Could not save your account."));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordNotice(null);
    setPasswordError(null);
    try {
      await accountApi.changePassword(passwords);
      setPasswordNotice("Password updated.");
      setPasswords({ current_password: "", password: "", password_confirmation: "" });
    } catch (err) {
      setPasswordError(parseApiError(err, "Could not change your password."));
    } finally {
      setSavingPassword(false);
    }
  }

  // Runs the provider popup and hands the resulting credential to the API.
  // The frontend never asserts who the user is — the backend verifies it.
  async function handleConnect(provider) {
    setConnectingProvider(provider);
    setIdentitiesNotice(null);
    setIdentitiesError(null);
    try {
      const { credential, nonce } = await signInWith(provider);
      await identitiesApi.connect(provider, { credential, nonce });
      setIdentitiesNotice(`${PROVIDER_LABELS[provider] || provider} connected.`);
      await loadIdentities();
    } catch (err) {
      // Dismissing the provider popup is not an error worth showing.
      if (err instanceof ProviderCancelledError) return;
      setIdentitiesError(
        err.message || `Could not connect ${PROVIDER_LABELS[provider] || provider}.`
      );
    } finally {
      setConnectingProvider(null);
    }
  }

  async function handleDisconnect(identity) {
    setDisconnectingId(identity.id);
    setIdentitiesNotice(null);
    setIdentitiesError(null);
    try {
      await identitiesApi.disconnect(identity.id);
      setIdentitiesNotice(
        `${PROVIDER_LABELS[identity.provider] || identity.provider} disconnected.`
      );
      await loadIdentities();
    } catch (err) {
      // The API refuses to remove the last remaining sign-in method.
      setIdentitiesError(err.message || "Could not disconnect that sign-in method.");
    } finally {
      setDisconnectingId(null);
    }
  }

  // Providers this deployment exposes that are not connected yet.
  const connectedProviders = identities.map((identity) => identity.provider);
  const connectable = availableProviders().filter(
    (provider) => !connectedProviders.includes(provider)
  );

  return (
    <main className="wine-app">
      <div className="wine-management__header">
        <h1>Account settings</h1>
        <p className="review-card__comment">
          Manage your username, personal information, address and password.
        </p>
      </div>

      {loading && <p className="wine-management__loading">Loading account…</p>}

      {!loading && (
        <div className="account-grid">
          <section className="account-card">
            <form className="auth-form" onSubmit={handleSaveProfile}>
              <h2 className="account-card__title">Profile</h2>
              {profileNotice && (
                <p className="review-form__success">{profileNotice}</p>
              )}
              {profileError && <p className="review-form__error">{profileError}</p>}

              <h3 className="account-section-title account-section-title--first">
                Username
              </h3>
              <Field label="Username">
                <input
                  type="text"
                  value={form.user_name}
                  onChange={(e) => setField("user_name", e.target.value)}
                  required
                  minLength={2}
                  maxLength={40}
                  autoComplete="username"
                />
                <small className="account-field-hint">
                  2–40 characters. Letters, digits, spaces, dots, dashes and
                  underscores.
                </small>
              </Field>

              <h3 className="account-section-title">Personal information</h3>
              <div className="account-fields">
                <Field label="First name">
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setField("first_name", e.target.value)}
                    maxLength={80}
                  />
                </Field>
                <Field label="Last name">
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setField("last_name", e.target.value)}
                    maxLength={80}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    maxLength={40}
                  />
                </Field>
                <Field label="Date of birth">
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => setField("date_of_birth", e.target.value)}
                  />
                </Field>
              </div>

              <h3 className="account-section-title">Address</h3>
              <div className="account-fields">
                <Field label="Street" wide>
                  <input
                    type="text"
                    value={form.address.street_address}
                    onChange={(e) => setAddressField("street_address", e.target.value)}
                    maxLength={200}
                  />
                </Field>
                <Field label="City">
                  <input
                    type="text"
                    value={form.address.city}
                    onChange={(e) => setAddressField("city", e.target.value)}
                  />
                </Field>
                <Field label="State">
                  <input
                    type="text"
                    value={form.address.state}
                    onChange={(e) => setAddressField("state", e.target.value)}
                  />
                </Field>
                <Field label="Postal code">
                  <input
                    type="text"
                    value={form.address.postal_code}
                    onChange={(e) => setAddressField("postal_code", e.target.value)}
                    maxLength={20}
                  />
                </Field>
                <Field label="Country">
                  <select
                    value={form.address.country_id}
                    onChange={(e) => setAddressField("country_id", e.target.value)}
                  >
                    <option value="">— Select country —</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <button
                type="submit"
                className="auth-form__submit"
                disabled={savingProfile}
              >
                {savingProfile ? "Saving…" : "Save profile"}
              </button>
            </form>
          </section>

          <section className="account-card">
            <form
              className="auth-form account-security-form"
              onSubmit={handleChangePassword}
            >
              <h2 className="account-card__title">Security</h2>
              <p className="account-card__lede">
                Choose a strong password you don't use anywhere else.
              </p>
              {passwordNotice && (
                <p className="review-form__success">{passwordNotice}</p>
              )}
              {passwordError && <p className="review-form__error">{passwordError}</p>}
              <Field label="Current password">
                <input
                  type="password"
                  value={passwords.current_password}
                  onChange={(e) =>
                    setPasswords((p) => ({ ...p, current_password: e.target.value }))
                  }
                  required
                  autoComplete="current-password"
                />
              </Field>
              <Field label="New password">
                <input
                  type="password"
                  value={passwords.password}
                  onChange={(e) =>
                    setPasswords((p) => ({ ...p, password: e.target.value }))
                  }
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirm new password">
                <input
                  type="password"
                  value={passwords.password_confirmation}
                  onChange={(e) =>
                    setPasswords((p) => ({
                      ...p,
                      password_confirmation: e.target.value,
                    }))
                  }
                  required
                  autoComplete="new-password"
                />
              </Field>
              <button
                type="submit"
                className="auth-form__submit"
                disabled={savingPassword}
              >
                {savingPassword ? "Updating…" : "Change password"}
              </button>
            </form>
          </section>

          <section className="account-card">
            <div className="auth-form account-security-form">
              <h2 className="account-card__title">Sign-in methods</h2>
              <p className="account-card__lede">
                Use a social account as well as your password. Connecting a
                provider never changes your plan or your permissions.
              </p>

              {identitiesNotice && (
                <p className="review-form__success">{identitiesNotice}</p>
              )}
              {identitiesError && (
                <p className="review-form__error">{identitiesError}</p>
              )}

              {identitiesLoading ? (
                <p className="wine-management__loading">Loading sign-in methods…</p>
              ) : (
                <>
                  <ul className="account-identities">
                    {passwordAuthentication && (
                      <li className="account-identity">
                        <span className="account-identity__label">
                          Email &amp; password
                        </span>
                        <span className="account-identity__meta">Connected</span>
                      </li>
                    )}
                    {identities.map((identity) => (
                      <li className="account-identity" key={identity.id}>
                        <span className="account-identity__label">
                          {PROVIDER_LABELS[identity.provider] || identity.provider}
                        </span>
                        <span className="account-identity__meta">
                          {identity.email || "Connected"}
                        </span>
                        <button
                          type="button"
                          className="account-identity__action"
                          onClick={() => handleDisconnect(identity)}
                          disabled={disconnectingId === identity.id}
                        >
                          {disconnectingId === identity.id
                            ? "Disconnecting…"
                            : "Disconnect"}
                        </button>
                      </li>
                    ))}
                  </ul>

                  {connectable.length > 0 && (
                    <>
                      <h3 className="account-section-title">Connect another</h3>
                      <div className="auth-card__social-buttons">
                        {connectable.map((provider) => (
                          <button
                            key={provider}
                            type="button"
                            className={`auth-card__social-btn auth-card__social-btn--${provider}`}
                            onClick={() => handleConnect(provider)}
                            disabled={connectingProvider !== null}
                          >
                            {connectingProvider === provider
                              ? `Connecting ${PROVIDER_LABELS[provider]}…`
                              : `Connect ${PROVIDER_LABELS[provider]}`}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
