const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1").replace(/\/+$/, "");


const TOKEN_STORAGE_KEY = "wine_prediction_token";

// --- Private test-access gate ---------------------------------------------
// While the Rails API has TEST_ACCESS_PASSWORD configured, every request must
// carry a signed test-access token in the X-Test-Access-Token header. The
// token is exchanged for the password at /test_access (server-side check) and
// stored in sessionStorage — never the password itself, never localStorage.
export const TEST_ACCESS_STORAGE_KEY = "wine_words_test_access_token";

export function getTestAccessToken() {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(TEST_ACCESS_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setTestAccessToken(token) {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.sessionStorage.setItem(TEST_ACCESS_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(TEST_ACCESS_STORAGE_KEY);
    }
  } catch {
    // Storage may be unavailable (private mode); access just won't persist
    // across refreshes.
  }
}

export function clearTestAccessToken() {
  setTestAccessToken(null);
}

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
}

// Restore any previously stored token at module load.
if (typeof window !== "undefined") {
  authToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

// Raw bearer token for callers that manage their own fetch (e.g. the API-health
// runner). Read straight from storage — the single source of truth — rather
// than from React state, so a health check always uses the token that is
// actually persisted.
export function getAuthToken() {
  if (typeof window === "undefined") return authToken;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

// Serialize a params object into a "?a=1&b=2" query string, skipping
// undefined/null/empty values.
function buildQuery(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function request(
  path,
  { method = "GET", body, auth = false, headers = {} } = {},
) {
  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  let payload;
  if (body instanceof FormData) {
    // Let the browser set the multipart Content-Type boundary.
    payload = body;
  } else if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (auth && authToken) {
    requestHeaders.Authorization = `Bearer ${authToken}`;
  }

  // Private test-access gate: attach the signed token issued by /test_access
  // (no-op when absent — e.g. gate disabled).
  const testAccessToken = getTestAccessToken();
  if (testAccessToken) {
    requestHeaders["X-Test-Access-Token"] = testAccessToken;
  }

  const url = API_BASE_URL + path;
  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: payload,
    credentials: 'include',
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson
    ? await response.json().catch(() => ({}))
    : await response.text();

  if (!response.ok) {
    // Test-access token expired or invalidated mid-session: clear it and send
    // the user back to the gate page.
    if (
      response.status === 401 &&
      data?.code === "test_access_required" &&
      !window.location.pathname.startsWith("/test-access")
    ) {
      clearTestAccessToken();
      window.location.assign("/test-access?expired=1");
    }
    const message =
      (isJson && (data?.error || data?.message)) ||
      (Array.isArray(data?.errors) && data.errors.join(", ")) ||
      (typeof data === "string" && data) ||
      `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.code = data?.code;
    error.data = data;
    throw error;
  }

  // Surface the JWT issued by devise-jwt (sent in the Authorization header
  // on sign-in / sign-up responses).
  const authorizationHeader = response.headers.get("Authorization");
  if (authorizationHeader) {
    data.token = authorizationHeader.replace(/^Bearer\s+/i, "");
  }

  return data;
}

export const authApi = {
  signIn({ email, password }) {
    return request("/auth/sign_in", {
      method: "POST",
      body: { user: { email, password } },
    });
  },
  signUp({ email, password, password_confirmation, user_name }) {
    return request("/auth/sign_up", {
      method: "POST",
      body: {
        user: { user_name, email, password, password_confirmation },
      },
    });
  },
  signOut() {
    return request("/auth/sign_out", { method: "DELETE", auth: true });
  },
  forgotPassword(email) {
    return request("/auth/password", {
      method: "POST",
      body: { user: { email } },
    });
  },
  resetPassword({ reset_password_token, password, password_confirmation }) {
    return request("/auth/password", {
      method: "PATCH",
      body: {
        user: { reset_password_token, password, password_confirmation },
      },
    });
  },
  me() {
    return request("/me", { auth: true });
  },

  // Social sign-in. `credential` is whatever the provider SDK issued (a
  // Google/Microsoft ID token, an Apple identity token, a Facebook access
  // token) — never an email or user id, which the backend would not trust.
  // The response is the same { user: {...} } payload as signIn/signUp, with
  // the JWT in the Authorization header.
  socialSignIn(provider, { credential, nonce } = {}) {
    return request(`/auth/${provider}`, {
      method: "POST",
      body: { credential, nonce },
    });
  },
};

// Connected authentication methods for the signed-in user (Account settings):
// list, connect an additional provider, and disconnect one.
export const identitiesApi = {
  list() {
    return request("/auth/identities", { auth: true });
  },
  connect(provider, { credential, nonce } = {}) {
    return request(`/auth/identities/${provider}`, {
      method: "POST",
      auth: true,
      body: { credential, nonce },
    });
  },
  disconnect(id) {
    return request(`/auth/identities/${id}`, { method: "DELETE", auth: true });
  },
};

export const imagesApi = {
  upload(imageableType, imageableId, files) {
    const formData = new FormData();
    formData.append("imageable_type", imageableType);
    formData.append("imageable_id", imageableId);
    Array.from(files).forEach((file) => formData.append("images[]", file));
    return request("/images", {
      method: "POST",
      auth: true,
      body: formData,
    });
  },
  destroy(imageableType, imageableId, imageId) {
    return request(`/images/${imageId}?imageable_type=${imageableType}&imageable_id=${imageableId}`, {
      method: "DELETE",
      auth: true,
    });
  },
  reorder(imageableType, imageableId, orderedIds) {
    return request(`/images/reorder?imageable_type=${imageableType}&imageable_id=${imageableId}`, {
      method: "PATCH",
      auth: true,
      body: { image_ids: orderedIds },
    });
  },
  setPrimary(imageableType, imageableId, imageId) {
    return request(`/images/${imageId}/primary?imageable_type=${imageableType}&imageable_id=${imageableId}`, {
      method: "PATCH",
      auth: true,
    });
  },
};

export const winesApi = {
  list(params) {
    const query = params ? buildQuery(params) : "";
    return request(`/wines${query}`, { auth: false });
  },
  grouped(params) {
    const query = params ? buildQuery(params) : "";
    return request(`/wines/grouped${query}`, { auth: false });
  },
  search(query, options = {}) {
    // Also accepts { q, producerId } so a picker can list one producer's wines
    // without making the user guess a wine name. Plain-string callers stay working.
    const q = typeof query === "object" && query !== null ? query.q : query;
    const producerId =
      typeof query === "object" && query !== null
        ? query.producerId
        : options.producerId;
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (producerId) params.set("producer_id", String(producerId));
    return request(`/wines/search?${params.toString()}`, {
      auth: true,
    });
  },
  // Complex filter-driven search. Values that are empty/null are skipped;
  // arrays (region_ids, grape_ids) are serialised as repeated `key[]` params.
  advancedSearch(params) {
    const search = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v !== undefined && v !== null && v !== "") {
            search.append(`${key}[]`, String(v));
          }
        });
      } else {
        search.set(key, String(value));
      }
    });
    const qs = search.toString();
    return request(`/wines/advanced_search${qs ? `?${qs}` : ""}`, {
      auth: false,
    });
  },
  show(id) {
    return request(`/wines/${id}`);
  },
  create(wineData) {
    return request("/wines", {
      method: "POST",
      auth: true,
      body: { wine: wineData },
    });
  },
  update(id, wineData) {
    return request(`/wines/${id}`, {
      method: "PATCH",
      auth: true,
      body: { wine: wineData },
    });
  },
  destroy(id) {
    return request(`/wines/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
};

export const producersApi = {
  list(params) {
    const query = params ? buildQuery(params) : "";
    return request(`/producers${query}`);
  },
  search(query) {
    return request(`/producers/search?q=${encodeURIComponent(query)}`);
  },
  show(id) {
    return request(`/producers/${id}`);
  },
  create(producerData) {
    return request("/producers", {
      method: "POST",
      auth: true,
      body: { producer: producerData },
    });
  },
  update(id, producerData) {
    return request(`/producers/${id}`, {
      method: "PATCH",
      auth: true,
      body: { producer: producerData },
    });
  },
  destroy(id) {
    return request(`/producers/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
  uploadLogo(id, file) {
    const formData = new FormData();
    formData.append("logo", file);
    return request(`/producers/${id}/logo`, {
      method: "POST",
      auth: true,
      body: formData,
    });
  },
  removeLogo(id) {
    return request(`/producers/${id}/logo`, {
      method: "DELETE",
      auth: true,
    });
  },
  linkWine(id, wineId) {
    return request(`/producers/${id}/link_wine`, {
      method: "POST",
      auth: true,
      body: { wine_id: wineId },
    });
  },
};

export const wineProfilesApi = {
  list() {
    return request("/wine_profiles");
  },
  show(id) {
    return request(`/wine_profiles/${id}`);
  },
  search(query, limit = 10) {
    return request(
      `/wine_profiles/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    );
  },
};

export const userApi = {
  findUser(email) {
    return request(`/user/${email}`);
  },
};

export const usersApi = {
  roles() {
    return request("/roles", { auth: true });
  },
  search(q, page = 1) {
    return request(`/users/search?q=${encodeURIComponent(q)}&page=${page}`, { auth: true });
  },
  assignRoles(userId, roleIds) {
    return request(`/users/${userId}/assign_roles`, {
      method: "PATCH",
      auth: true,
      body: { role_ids: roleIds },
    });
  },
  assignSubscription(userId, subscriptionId) {
    return request(`/users/${userId}/assign_subscription`, {
      method: "PATCH",
      auth: true,
      body: { subscription_id: subscriptionId },
    });
  },
};

export const subscriptionsApi = {
  list({ auth = false } = {}) {
    return request("/subscriptions", { auth });
  },
  show(id) {
    return request(`/subscriptions/${id}`);
  },
  create(data) {
    return request("/subscriptions", {
      method: "POST",
      auth: true,
      body: { subscription: data },
    });
  },
  update(id, data) {
    return request(`/subscriptions/${id}`, {
      method: "PATCH",
      auth: true,
      body: { subscription: data },
    });
  },
  destroy(id) {
    return request(`/subscriptions/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
};

export const accountApi = {
  show() {
    return request("/account", { auth: true });
  },
  update(data) {
    return request("/account", {
      method: "PATCH",
      auth: true,
      body: data,
    });
  },
  changePassword(data) {
    return request("/account/password", {
      method: "PATCH",
      auth: true,
      body: data,
    });
  },
};

export const billingApi = {
  checkout(subscriptionId) {
    return request("/billing/checkout", {
      method: "POST",
      auth: true,
      body: { subscription_id: subscriptionId },
    });
  },
  confirm(sessionId) {
    return request("/billing/confirm", {
      method: "POST",
      auth: true,
      body: { session_id: sessionId },
    });
  },
  portal() {
    return request("/billing/portal", {
      method: "POST",
      auth: true,
    });
  },
  changePreview(subscriptionId) {
    return request("/billing/change/preview", {
      method: "POST",
      auth: true,
      body: { subscription_id: subscriptionId },
    });
  },
  changeConfirm(subscriptionId, idempotencyKey) {
    return request("/billing/change/confirm", {
      method: "POST",
      auth: true,
      body: { subscription_id: subscriptionId, idempotency_key: idempotencyKey },
    });
  },
};

export const tasteParametersApi = {
  list() {
    return request("/taste_parameters");
  },
};

export const vintagesApi = {
  create(wineSlug, vintageData) {
    return request(`/wines/${wineSlug}/vintages`, {
      method: "POST",
      auth: true,
      body: { vintage: vintageData },
    });
  },
};

export const reviewsApi = {
  all(params) {
    const query = params ? buildQuery(params) : "";
    return request(`/reviews${query}`, { auth: true });
  },
  list(wineSlug, vintageId) {
    return request(`/wines/${wineSlug}/vintages/${vintageId}/reviews`, {
      auth: true,
    });
  },
  show(id) {
    return request(`/reviews/${id}`, { auth: true });
  },
  create(wineSlug, vintageId, reviewData) {
    return request(`/wines/${wineSlug}/vintages/${vintageId}/reviews`, {
      method: "POST",
      auth: true,
      body: { review: reviewData },
    });
  },
  update(id, reviewData) {
    return request(`/reviews/${id}`, {
      method: "PATCH",
      auth: true,
      body: { review: reviewData },
    });
  },
  destroy(id) {
    return request(`/reviews/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
  myReviews() {
    return request("/reviews/my_reviews", { auth: true });
  },
  grouped(params) {
    const query = params ? buildQuery(params) : "";
    return request(`/reviews/grouped${query}`, { auth: true });
  },
};

export const articlesApi = {
  list(params) {
    const query = params ? buildQuery(params) : "";
    return request(`/articles${query}`, { auth: true });
  },
  myArticles() {
    return request("/articles/my_articles", { auth: true });
  },
  show(id) {
    return request(`/articles/${id}`, { auth: true });
  },
  create(articleData) {
    const isForm = articleData instanceof FormData;
    return request("/articles", {
      method: "POST",
      auth: true,
      body: isForm ? articleData : { article: articleData },
    });
  },
  update(id, articleData) {
    const isForm = articleData instanceof FormData;
    return request(`/articles/${id}`, {
      method: "PATCH",
      auth: true,
      body: isForm ? articleData : { article: articleData },
    });
  },
  destroy(id) {
    return request(`/articles/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
  grouped(params) {
    const query = params ? buildQuery(params) : "";
    return request(`/articles/grouped${query}`, { auth: true });
  },
};

export const categoriesApi = {
  list(type = null) {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    const query = params.toString();
    return request(`/categories${query ? `?${query}` : ""}`);
  },
  show(id) {
    return request(`/categories/${id}`, { auth: true });
  },
  counts() {
    return request("/categories/counts");
  },
  create(categoryData) {
    return request("/categories", {
      method: "POST",
      auth: true,
      body: { category: categoryData },
    });
  },
  update(id, categoryData) {
    return request(`/categories/${id}`, {
      method: "PATCH",
      auth: true,
      body: { category: categoryData },
    });
  },
  remove(id) {
    return request(`/categories/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
  reorder(type, orderedIds) {
    return request("/categories/reorder", {
      method: "PATCH",
      auth: true,
      body: { type, ordered_ids: orderedIds },
    });
  },
  linkWine(id, wineId) {
    return request(`/categories/${id}/link_wine`, {
      method: "POST",
      auth: true,
      body: { wine_id: wineId },
    });
  },
  linkProducer(id, producerId) {
    return request(`/categories/${id}/link_producer`, {
      method: "POST",
      auth: true,
      body: { producer_id: producerId },
    });
  },
  linkReview(id, reviewId) {
    return request(`/categories/${id}/link_review`, {
      method: "POST",
      auth: true,
      body: { review_id: reviewId },
    });
  },
  linkArticle(id, articleId) {
    return request(`/categories/${id}/link_article`, {
      method: "POST",
      auth: true,
      body: { article_id: articleId },
    });
  },
};

export const grapesApi = {
  list() {
    return request("/grapes");
  },
  search(query) {
    return request(`/grapes/search?q=${encodeURIComponent(query)}`);
  },
  show(id) {
    return request(`/grapes/${id}`);
  },
  create(grapeData) {
    return request("/grapes", {
      method: "POST",
      auth: true,
      body: { grape: grapeData },
    });
  },
  update(id, grapeData) {
    return request(`/grapes/${id}`, {
      method: "PATCH",
      auth: true,
      body: { grape: grapeData },
    });
  },
  remove(id) {
    return request(`/grapes/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
  linkWine(id, wineId) {
    return request(`/grapes/${id}/link_wine`, {
      method: "POST",
      auth: true,
      body: { wine_id: wineId },
    });
  },
  linkProducer(id, producerId) {
    return request(`/grapes/${id}/link_producer`, {
      method: "POST",
      auth: true,
      body: { producer_id: producerId },
    });
  },
};

export const countriesApi = {
  list() {
    return request("/countries");
  },
  show(id) {
    return request(`/countries/${id}`);
  },
  create(countryData) {
    return request("/countries", {
      method: "POST",
      auth: true,
      body: { country: countryData },
    });
  },
  update(id, countryData) {
    return request(`/countries/${id}`, {
      method: "PATCH",
      auth: true,
      body: { country: countryData },
    });
  },
  remove(id) {
    return request(`/countries/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
  linkProducer(id, producerId) {
    return request(`/countries/${id}/link_producer`, {
      method: "POST",
      auth: true,
      body: { producer_id: producerId },
    });
  },
};

export const statsApi = {
  get() {
    return request("/stats", { auth: false });
  },
};

export const regionsApi = {
  list() {
    return request("/regions", { auth: false });
  },
  tree() {
    return request("/regions/tree", { auth: false });
  },
  show(id) {
    return request(`/regions/${id}`);
  },
  create(regionData) {
    return request("/regions", {
      method: "POST",
      auth: true,
      body: { region: regionData },
    });
  },
  update(id, regionData) {
    return request(`/regions/${id}`, {
      method: "PATCH",
      auth: true,
      body: { region: regionData },
    });
  },
  linkWine(id, wineId) {
    return request(`/regions/${id}/link_wine`, {
      method: "POST",
      auth: true,
      body: { wine_id: wineId },
    });
  },
  linkProducer(id, producerId) {
    return request(`/regions/${id}/link_producer`, {
      method: "POST",
      auth: true,
      body: { producer_id: producerId },
    });
  },
  remove(id) {
    return request(`/regions/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
};

export const logsApi = {
  fetchLines(lines = 500) {
    return request(`/logs?lines=${lines}`, { auth: true });
  },
  // Database audit trail: paginated, filterable list. The backend returns the
  // Api::Paginatable envelope { items, page, per_page, total_count,
  // total_pages } when `page` is given, a plain array otherwise.
  fetchAuditLogs(params = {}) {
    return request(`/logs/audit${buildQuery(params)}`, { auth: true });
  },
  // A single audit entry with its associated objects and alive flags.
  fetchAuditLog(id) {
    return request(`/logs/${id}`, { auth: true });
  },
};

export const impersonationApi = {
  // Start impersonating a user. Returns { token, impersonating, effective_user, real_user }.
  // The new token (with impersonated_user_id claim) must be persisted via setAuthToken.
  start(userId) {
    return request("/impersonation", {
      method: "POST",
      auth: true,
      body: { user_id: userId },
    });
  },
  // Stop impersonating. Returns { token, impersonating, effective_user, real_user }.
  // The fresh token (without the claim) must be persisted via setAuthToken.
  stop() {
    return request("/impersonation", { method: "DELETE", auth: true });
  },
  // Check current impersonation status. Returns { impersonating, effective_user, real_user }.
  status() {
    return request("/impersonation/status", { auth: true });
  },
};

export const configurationApi = {
  // Admin-only global configuration. Returns { logs_saved_to_database,
  // use_test_email, test_email, settings: [...] }.
  fetch() {
    return request("/configuration", { auth: true });
  },
  update(payload) {
    return request("/configuration", {
      method: "PATCH",
      auth: true,
      body: payload,
    });
  },
};

// Custom (user-added) app_settings rows, nested under the configuration
// resource. Admin-only.
export const emailVerificationsApi = {
  // GET /api/v1/email-verifications/:token — consumes the token clicked from
  // the verification email. 422 when invalid/expired.
  verify(token) {
    return request(`/email-verifications/${encodeURIComponent(token)}`);
  },
  // POST /api/v1/email-verifications/resend — uniform 202 regardless of
  // whether the address exists / is already verified (no user enumeration).
  resend(emailAddress) {
    return request("/email-verifications/resend", {
      method: "POST",
      body: { email_address: emailAddress },
    });
  },
};

export const settingsApi = {
  list() {
    return request("/configuration/settings", { auth: true });
  },
  create({ key, value }) {
    return request("/configuration/settings", {
      method: "POST",
      auth: true,
      body: { key, value },
    });
  },
  update(id, { value }) {
    return request(`/configuration/settings/${id}`, {
      method: "PATCH",
      auth: true,
      body: { value },
    });
  },
  destroy(id) {
    return request(`/configuration/settings/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
};

// --- Wine packages: the reviewing workflow ---------------------------------
//
// A package is a producer shipment that a reviewer is responsible for. The
// backend exposes CRUD plus explicit workflow actions (never a free-form status
// write), so each action below maps to one route.
export const winePackagesApi = {
  // Paginated envelope when `page` is passed, a plain array otherwise.
  list(params) {
    const query = params ? buildQuery(params) : "";
    return request(`/wine_packages${query}`, { auth: true });
  },
  show(id) {
    return request(`/wine_packages/${id}`, { auth: true });
  },
  // `status` selects the entry point: "draft", "announced" (expected package),
  // "requested" (producer asked for a review) or "arrived" (received today).
  create(packageData) {
    return request("/wine_packages", {
      method: "POST",
      auth: true,
      body: { wine_package: packageData },
    });
  },
  // Status and source are workflow-owned and cannot be written here.
  update(id, packageData) {
    return request(`/wine_packages/${id}`, {
      method: "PATCH",
      auth: true,
      body: { wine_package: packageData },
    });
  },
  destroy(id) {
    return request(`/wine_packages/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
  // Arrival starts the review clock (arrived + 1 calendar month) and schedules
  // the deadline reminders. `params` may carry arrived_at / review_deadline.
  markArrived(id, params = {}) {
    return request(`/wine_packages/${id}/mark_arrived`, {
      method: "POST",
      auth: true,
      body: params,
    });
  },
  markInTransit(id) {
    return request(`/wine_packages/${id}/mark_in_transit`, {
      method: "POST",
      auth: true,
    });
  },
  // Deliberate completion, even with reviews still outstanding.
  markCompleted(id, params = {}) {
    return request(`/wine_packages/${id}/mark_completed`, {
      method: "POST",
      auth: true,
      body: params,
    });
  },
  reopen(id) {
    return request(`/wine_packages/${id}/reopen`, {
      method: "POST",
      auth: true,
    });
  },
  cancel(id) {
    return request(`/wine_packages/${id}/cancel`, {
      method: "POST",
      auth: true,
    });
  },
  accept(id) {
    return request(`/wine_packages/${id}/accept`, {
      method: "POST",
      auth: true,
    });
  },
  reject(id, reason) {
    return request(`/wine_packages/${id}/reject`, {
      method: "POST",
      auth: true,
      body: { rejection_reason: reason },
    });
  },
};

// The wine lines inside a package. `review_requested` is what makes a line
// block the package from completing.
export const winePackageItemsApi = {
  create(packageId, itemData) {
    return request(`/wine_packages/${packageId}/items`, {
      method: "POST",
      auth: true,
      body: { item: itemData },
    });
  },
  update(packageId, itemId, itemData) {
    return request(`/wine_packages/${packageId}/items/${itemId}`, {
      method: "PATCH",
      auth: true,
      body: { item: itemData },
    });
  },
  destroy(packageId, itemId) {
    return request(`/wine_packages/${packageId}/items/${itemId}`, {
      method: "DELETE",
      auth: true,
    });
  },
  // Creates the review through the ordinary review path and links it to the
  // line. Passing status: "published" creates and completes in one step.
  createReview(packageId, itemId, reviewData) {
    return request(
      `/wine_packages/${packageId}/items/${itemId}/create_review`,
      {
        method: "POST",
        auth: true,
        body: { review: reviewData },
      },
    );
  },
};

// Tracking is a singleton per package: read it, upsert it, refresh it from the
// carrier provider the backend resolves from the carrier name.
export const shipmentTrackingsApi = {
  show(packageId) {
    return request(`/wine_packages/${packageId}/shipment_tracking`, {
      auth: true,
    });
  },
  update(packageId, trackingData) {
    return request(`/wine_packages/${packageId}/shipment_tracking`, {
      method: "PATCH",
      auth: true,
      body: { shipment_tracking: trackingData },
    });
  },
  refresh(packageId) {
    return request(`/wine_packages/${packageId}/shipment_tracking/refresh`, {
      method: "POST",
      auth: true,
    });
  },
};

// The signed-in user's own notifications (review-deadline reminders).
export const notificationsApi = {
  list(params) {
    const query = params ? buildQuery(params) : "";
    return request(`/notifications${query}`, { auth: true });
  },
  markRead(id) {
    return request(`/notifications/${id}/mark_read`, {
      method: "PATCH",
      auth: true,
    });
  },
  markAllRead() {
    return request("/notifications/mark_all_read", {
      method: "PATCH",
      auth: true,
    });
  },
};

// --- Private test-access gate ---------------------------------------------
// Exchanges the entered password for a signed test-access token, and verifies
// the stored token on boot (the SPA calls this to detect expiry).
export const testAccessApi = {
  submit(password) {
    return request("/test_access", {
      method: "POST",
      body: { password },
    });
  },
  verify() {
    return request("/test_access");
  },
};

export { API_BASE_URL };
