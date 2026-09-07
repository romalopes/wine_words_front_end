const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

const TOKEN_STORAGE_KEY = "wine_prediction_token";

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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: payload,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson
    ? await response.json().catch(() => ({}))
    : await response.text();

  if (!response.ok) {
    const message =
      (isJson && (data?.error || data?.message)) ||
      (Array.isArray(data?.errors) && data.errors.join(", ")) ||
      (typeof data === "string" && data) ||
      `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
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
  signUp({ email, password, name }) {
    return request("/auth/sign_up", {
      method: "POST",
      body: {
        user: { name, email, password, password_confirmation: password },
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
  search(query) {
    return request(`/wines/search?q=${encodeURIComponent(query)}`, {
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
  search(q) {
    return request(`/users/search?q=${encodeURIComponent(q)}`, { auth: true });
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

export const billingApi = {
  checkout(subscriptionId) {
    return request("/billing/checkout", {
      method: "POST",
      auth: true,
      body: { subscription_id: subscriptionId },
    });
  },
  portal() {
    return request("/billing/portal", {
      method: "POST",
      auth: true,
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

export { API_BASE_URL };
