// Social sign-in provider SDKs (Google, Apple, Microsoft, Facebook).
//
// Each provider's *official* JavaScript SDK is loaded on demand and used to
// obtain a credential (an ID token, or a Facebook access token). That credential
// is posted to the Rails API, which verifies it with the provider and resolves
// the application User.
//
// Two rules this module exists to enforce:
//
//   1. The browser never sends identity *claims* (email, user id, name) to the
//      backend as proof of anything — only the provider-issued credential.
//   2. Only public identifiers live here. Every secret (Google client secret,
//      Apple private key, Microsoft client secret, Facebook app secret) stays
//      in the API's environment and is never present in the React bundle.
//
// The scripts come from the providers' own CDNs; nothing is bundled or vendored.

const GOOGLE_SDK_URL = "https://accounts.google.com/gsi/client";
const APPLE_SDK_URL =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
const MICROSOFT_SDK_URL =
  "https://alcdn.msauth.net/browser/2.38.3/js/msal-browser.min.js";
const FACEBOOK_SDK_URL = "https://connect.facebook.net/en_US/sdk.js";

// Provider is not configured for this deployment (no client id in the Vite env).
export class ProviderUnavailableError extends Error {
  constructor(provider) {
    super(`${provider} sign-in is not available right now.`);
    this.name = "ProviderUnavailableError";
    this.provider = provider;
  }
}

// The person closed the provider popup without finishing, or the provider
// declined the request. Not an error worth showing as a failure.
export class ProviderCancelledError extends Error {
  constructor(provider) {
    super(`${provider} sign-in was cancelled.`);
    this.name = "ProviderCancelledError";
    this.provider = provider;
  }
}

// Only public, frontend-safe identifiers. Every value here is compiled into the
// Vite bundle, so nothing secret may ever be added.
const publicConfig = {
  google: () => ({
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  }),
  apple: () => ({
    clientId: import.meta.env.VITE_APPLE_CLIENT_ID,
    redirectURI: import.meta.env.VITE_APPLE_REDIRECT_URI || window.location.origin,
  }),
  microsoft: () => ({
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
    // Must match the API's MICROSOFT_TENANT_ID: "common" supports personal and
    // organisational accounts, see docs/social_authentication.md.
    tenant: import.meta.env.VITE_MICROSOFT_TENANT_ID || "common",
  }),
  facebook: () => ({
    appId: import.meta.env.VITE_FACEBOOK_APP_ID,
    graphVersion: import.meta.env.VITE_FACEBOOK_GRAPH_VERSION || "v21.0",
  }),
};

// Human labels for the sign-in buttons (also used by Account settings).
export const PROVIDER_LABELS = {
  google: "Google",
  apple: "Apple",
  microsoft: "Microsoft",
  facebook: "Facebook",
};

// Providers this deployment actually exposes a button for.
export function availableProviders() {
  return Object.keys(publicConfig).filter((provider) => {
    try {
      const config = publicConfig[provider]();
      return Boolean(provider === "facebook" ? config.appId : config.clientId);
    } catch {
      return false;
    }
  });
}

export function isConfigured(provider) {
  return availableProviders().includes(provider);
}

function requireClientId(provider, value) {
  if (!value) throw new ProviderUnavailableError(provider);
  return value;
}

// ---------------------------------------------------------------------------
// SDK loading
// ---------------------------------------------------------------------------

// Injects a provider's SDK script once and resolves when it has loaded.
const scriptPromises = new Map();

function loadScript(url) {
  if (scriptPromises.has(url)) return scriptPromises.get(url);

  const promise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing?.dataset.loaded === "true") {
      resolve();
      return;
    }

    const script = existing || document.createElement("script");
    script.src = url;
    script.async = true;
    script.defer = true;

    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    });
    script.addEventListener("error", () => {
      scriptPromises.delete(url);
      reject(new ProviderUnavailableError("This"));
    });

    if (!existing) document.head.appendChild(script);
  });

  scriptPromises.set(url, promise);
  return promise;
}

// Waits for a global the SDK installs (e.g. `google`, `AppleID`, `msal`, `FB`).
function waitForGlobal(name, { attempts = 50, interval = 100 } = {}) {
  return new Promise((resolve, reject) => {
    let tries = 0;
    const tick = () => {
      if (window[name]) {
        resolve(window[name]);
        return;
      }
      tries += 1;
      if (tries >= attempts) {
        reject(new ProviderUnavailableError(name));
        return;
      }
      window.setTimeout(tick, interval);
    };
    tick();
  });
}

// ---------------------------------------------------------------------------
// Nonce helpers (Apple requires the raw nonce to be sent alongside the token)
// ---------------------------------------------------------------------------

function newNonce() {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

// ---------------------------------------------------------------------------
// Google — Google Identity Services (One Tap / button credential)
// ---------------------------------------------------------------------------
//
// `initialize` + `prompt` yields an ID token (a JWT signed by Google). The API
// verifies the signature against Google's JWKS and re-checks issuer, audience,
// expiry and the email_verified claim. The email shown in the browser is never
// treated as proof of anything.
export async function signInWithGoogle() {
  const config = publicConfig.google();
  const clientId = requireClientId("Google", config.clientId);

  await loadScript(GOOGLE_SDK_URL);
  const google = await waitForGlobal("google");

  return new Promise((resolve, reject) => {
    let settled = false;

    google.accounts.id.initialize({
      client_id: clientId,
      // The API re-validates everything, so nothing here is trusted.
      callback: (response) => {
        settled = true;
        if (!response?.credential) {
          reject(new ProviderCancelledError("Google"));
          return;
        }
        resolve({ credential: response.credential });
      },
      cancel_on_tap_outside: true,
    });

    google.accounts.id.prompt((notification) => {
      // The person dismissed One Tap without choosing an account.
      if (settled) return;
      if (
        notification?.isNotDisplayed?.() ||
        notification?.isSkippedMoment?.() ||
        notification?.isDismissedMoment?.()
      ) {
        settled = true;
        reject(new ProviderCancelledError("Google"));
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Apple — Sign in with Apple JS
// ---------------------------------------------------------------------------
//
// Apple returns an identity token containing a `nonce` claim. We generate a raw
// nonce, send Apple its SHA-256 hash, and hand the raw value to the API with the
// token. The API re-hashes the raw nonce and compares it with the claim, so a
// captured identity token cannot be replayed on its own.
//
// Apple may also return a private relay address (…@privaterelay.appleid.com).
// The API treats Apple's `sub` as the identity and never auto-links an existing
// account on a relay address, so "Hide My Email" users still get exactly one
// account.
export async function signInWithApple() {
  const config = publicConfig.apple();
  const clientId = requireClientId("Apple", config.clientId);

  await loadScript(APPLE_SDK_URL);
  const apple = await waitForGlobal("AppleID");

  const rawNonce = newNonce();
  const hashedNonce = await sha256Hex(rawNonce);

  apple.auth.init({
    clientId,
    scope: "name email",
    redirectURI: config.redirectURI,
    usePopup: true,
    nonce: hashedNonce,
  });

  let data;
  try {
    data = await apple.auth.signIn();
  } catch (err) {
    // Apple reports a user-dismissed popup as "popup_closed_by_user".
    if (String(err?.error || err?.message || "").includes("popup_closed")) {
      throw new ProviderCancelledError("Apple");
    }
    throw err;
  }

  const identityToken = data?.authorization?.id_token;
  if (!identityToken) throw new ProviderCancelledError("Apple");

  return { credential: identityToken, nonce: rawNonce };
}

// ---------------------------------------------------------------------------
// Microsoft — Microsoft identity platform (MSAL browser SDK)
// ---------------------------------------------------------------------------
//
// Wine Prediction supports BOTH personal Microsoft accounts and organisational
// (work/school) accounts, so the default tenant is "common" (see
// docs/social_authentication.md). The tenant configured here must match the
// API's MICROSOFT_TENANT_ID, because the API independently re-checks the
// token's issuer and `tid` claim against that policy.
//
// Only the default OpenID scopes (openid profile email) are requested — no
// Microsoft Graph permission is asked for, because authentication needs nothing
// more than the ID token.
let msalInstance = null;
let msalClientId = null;

function microsoftAuthority(config) {
  return `https://login.microsoftonline.com/${config.tenant}`;
}

async function microsoftClient() {
  const config = publicConfig.microsoft();
  const clientId = requireClientId("Microsoft", config.clientId);

  await loadScript(MICROSOFT_SDK_URL);
  const msal = await waitForGlobal("msal");
  if (!msal?.PublicClientApplication) throw new ProviderUnavailableError("Microsoft");

  if (!msalInstance || msalClientId !== clientId) {
    msalInstance = new msal.PublicClientApplication({
      auth: {
        clientId,
        authority: microsoftAuthority(config),
        // Back to the app origin: the popup closes and MSAL hands the result
        // back in-page; there is no server redirect to the Rails API.
        redirectUri: window.location.origin,
      },
      // sessionStorage keeps MSAL's own cache out of the way of the app's JWT,
      // which lives in localStorage.
      cache: { cacheLocation: "sessionStorage" },
    });
    msalClientId = clientId;
  }

  await msalInstance.initialize?.();
  return msalInstance;
}

export async function signInWithMicrosoft() {
  const instance = await microsoftClient();

  try {
    const result = await instance.loginPopup({
      scopes: ["openid", "profile", "email"],
      prompt: "select_account",
    });

    if (!result?.idToken) throw new ProviderCancelledError("Microsoft");
    return { credential: result.idToken };
  } catch (err) {
    if (err?.errorCode === "user_cancelled") {
      throw new ProviderCancelledError("Microsoft");
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Facebook — Facebook Login (Meta)
// ---------------------------------------------------------------------------
//
// The SDK yields a short-lived *access token*, not a signed JWT, so the API
// verifies it server-side by calling Facebook's Graph API (debug_token +
// /me) with the app secret. A UID or email echoed to the frontend is never
// accepted as proof.
//
// Only `public_profile` and `email` are requested — the minimum needed to
// establish identity. Instagram is not a separate provider.
let facebookInitialised = false;

async function facebookClient() {
  const config = publicConfig.facebook();
  const appId = requireClientId("Facebook", config.appId);

  await loadScript(FACEBOOK_SDK_URL);
  const FB = await waitForGlobal("FB");

  if (!facebookInitialised) {
    FB.init({
      appId,
      cookie: false,
      xfbml: false,
      version: config.graphVersion,
    });
    facebookInitialised = true;
  }

  return FB;
}

export async function signInWithFacebook() {
  const FB = await facebookClient();

  const response = await new Promise((resolve) => {
    FB.login(resolve, { scope: "public_profile,email", return_scopes: true });
  });

  const accessToken = response?.authResponse?.accessToken;
  // A dismissal leaves status "unknown" with no authResponse.
  if (!accessToken) throw new ProviderCancelledError("Facebook");

  return { credential: accessToken };
}

// ---------------------------------------------------------------------------
// Dispatcher used by the Login card
// ---------------------------------------------------------------------------

const SIGN_IN_HANDLERS = {
  google: signInWithGoogle,
  apple: signInWithApple,
  microsoft: signInWithMicrosoft,
  facebook: signInWithFacebook,
};

// Runs the provider popup and returns { credential, nonce? } for the API.
export async function signInWith(provider) {
  const handler = SIGN_IN_HANDLERS[provider];
  if (!handler) throw new ProviderUnavailableError(provider);
  return handler();
}