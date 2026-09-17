import { APP_VERSION } from "../../constants/versions.js";
import {
  isValidArray,
  isHealthyDetailedPayload,
  isAuthMePayload,
  isProducerPayload,
  isSubscriptionListPayload,
  areSubscriptionFeaturesValid,
  hasStatusOk,
} from "./apiHealthValidators.js";

export const API_CATEGORIES = {
  SYSTEM: "System",
  AUTH: "Authentication",
  SECURITY: "Security Guards",
  REFERENCE: "Reference Data",
  PRODUCERS: "Producers",
  WINES: "Wines",
  SUBSCRIPTIONS: "Subscriptions",
  WRITE_SANDBOX: "Write Operations (Manual)",
};

export const DEFAULT_THRESHOLDS = {
  excellent: 200,
  good: 500,
  slow: 1000,
};

// Factory for the repetitive public list-style checks. Fills in the common
// defaults (GET, expect 200, no auth, plain array validation) and lets each
// check override anything else (e.g. latency thresholds or a custom validator).
const listCheck = ({
  id,
  category,
  name,
  url,
  validate = isValidArray,
  ...overrides
}) => ({
  id,
  category,
  name,
  method: "GET",
  url,
  expectedStatus: 200,
  requiresAuth: false,
  validate,
  ...overrides,
});

export const API_CHECKS = [
  {
    id: "system-liveness",
    category: API_CATEGORIES.SYSTEM,
    name: "Public Liveness Check",
    method: "GET",
    url: "/health",
    expectedStatus: 200,
    requiresAuth: false,
    validate: hasStatusOk,
  },
  {
    id: "system-detailed",
    category: API_CATEGORIES.SYSTEM,
    name: "Detailed Infrastructure Health",
    method: "GET",
    url: "/health/detailed",
    expectedStatus: 200,
    requiresAuth: true,
    validate: isHealthyDetailedPayload,
  },
  {
    id: "system-version-match",
    category: API_CATEGORIES.SYSTEM,
    name: "Backend Version Matches Frontend Constant",
    method: "GET",
    url: "/health/detailed",
    expectedStatus: 200,
    requiresAuth: true,
    // Compare the version reported by the Rails API (health response) against
    // the APP_VERSION constant expected by the frontend.
    validate: (data) => data?.version === APP_VERSION,
    describeFailure: (data) =>
      `Backend version "${data?.version ?? "unknown"}" does not match frontend APP_VERSION "${APP_VERSION}"`,
  },
  {
    id: "auth-me-valid",
    category: API_CATEGORIES.AUTH,
    name: "Authenticated Session Context",
    method: "GET",
    url: "/me",
    expectedStatus: 200,
    requiresAuth: true,
    validate: isAuthMePayload,
  },
  {
    id: "auth-me-rejected",
    category: API_CATEGORIES.SECURITY,
    name: "Unauthenticated Request Rejection",
    method: "GET",
    url: "/me",
    expectedStatus: 401,
    requiresAuth: false, // Intentionally exclude the auth header.
    validate: () => true,
  },
  listCheck({
    id: "ref-countries",
    category: API_CATEGORIES.REFERENCE,
    name: "Countries List",
    url: "/countries",
  }),
  listCheck({
    id: "ref-regions",
    category: API_CATEGORIES.REFERENCE,
    name: "Regions List",
    url: "/regions",
  }),
  listCheck({
    id: "ref-grapes",
    category: API_CATEGORIES.REFERENCE,
    name: "Grapes List",
    url: "/grapes",
  }),
  listCheck({
    id: "producers-list",
    category: API_CATEGORIES.PRODUCERS,
    name: "List Producers",
    url: "/producers",
    latencyThresholds: { excellent: 300, good: 700, slow: 1500 },
  }),
  listCheck({
    id: "wines-list",
    category: API_CATEGORIES.WINES,
    name: "List Wines",
    url: "/wines",
    latencyThresholds: { excellent: 300, good: 700, slow: 1500 },
  }),
  listCheck({
    id: "wines-grouped",
    category: API_CATEGORIES.WINES,
    name: "Grouped Wines (12 per category)",
    url: "/wines/grouped",
    latencyThresholds: { excellent: 300, good: 700, slow: 1500 },
    validate: (data) =>
      isValidArray(data) &&
      data.every(
        (g) =>
          typeof g.category === "string" &&
          typeof g.count === "number" &&
          isValidArray(g.wines),
      ),
    describeFailure: () =>
      "Expected an array of { category, count, wines } objects",
  }),
  listCheck({
    id: "reviews-grouped",
    category: API_CATEGORIES.REVIEWS,
    name: "Grouped Reviews (12 per category)",
    url: "/reviews/grouped",
    latencyThresholds: { excellent: 300, good: 700, slow: 1500 },
    validate: (data) =>
      isValidArray(data) &&
      data.every(
        (g) =>
          typeof g.category === "string" &&
          typeof g.count === "number" &&
          isValidArray(g.reviews),
      ),
    describeFailure: () =>
      "Expected an array of { category, count, reviews } objects",
  }),
  listCheck({
    id: "articles-grouped",
    category: API_CATEGORIES.ARTICLES,
    name: "Grouped Articles (12 per category)",
    url: "/articles/grouped",
    latencyThresholds: { excellent: 300, good: 700, slow: 1500 },
    validate: (data) =>
      isValidArray(data) &&
      data.every(
        (g) =>
          typeof g.category === "string" &&
          typeof g.count === "number" &&
          isValidArray(g.articles),
      ),
    describeFailure: () =>
      "Expected an array of { category, count, articles } objects",
  }),
  // Free and paid plans are just rows of the same public list, so a single
  // check validates both the payload shape and that features are exposed.
  listCheck({
    id: "subscriptions-list",
    category: API_CATEGORIES.SUBSCRIPTIONS,
    name: "List Subscriptions (Public Plans)",
    url: "/subscriptions",
    validate: (data) =>
      isSubscriptionListPayload(data) &&
      data.some((s) => (s.features || []).length > 0),
    describeFailure: () =>
      "No subscription plan returned a non-empty feature list",
  }),
  listCheck({
    id: "subscriptions-features",
    category: API_CATEGORIES.SUBSCRIPTIONS,
    name: "Subscription Feature Catalogue Integrity",
    method: "GET",
    url: "/subscriptions",
    validate: areSubscriptionFeaturesValid,
    describeFailure: () =>
      "Subscription features failed validation: every feature needs a numeric id and a non-empty name, plans must not duplicate features, free plans must have no features and paid plans must have at least one",
  }),
  // --- Write sandbox (manual trigger only, excluded from "Run All") ---
  {
    id: "write-producer-create-delete",
    category: API_CATEGORIES.WRITE_SANDBOX,
    name: "Create + Delete a Temporary Producer",
    method: "POST",
    url: "/producers",
    expectedStatus: 201,
    requiresAuth: true,
    requiresManualTrigger: true,
    description:
      "Creates a temporary producer (name suffixed with a timestamp) then deletes it. Self-cleaning.",
    validate: isProducerPayload,
  },
];

// A tiny helper to keep the config self-documenting.
export const isWriteCheck = (check) =>
  check.requiresManualTrigger === true ||
  check.category === API_CATEGORIES.WRITE_SANDBOX;

export const getCheckById = (id) => API_CHECKS.find((c) => c.id === id);
