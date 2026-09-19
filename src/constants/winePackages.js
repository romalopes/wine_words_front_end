// Shared vocabulary for the wine-package screens, mirroring the backend's
// string-backed enums (WinePackage::STATUSES / SOURCES). Keeping the labels and
// badge tones in one place means the list, the detail page and the form can
// never drift apart.

export const PACKAGE_STATUSES = [
  "draft",
  "requested",
  "accepted",
  "rejected",
  "announced",
  "in_transit",
  "arrived",
  "reviewing",
  "completed",
  "cancelled",
];

export const PACKAGE_SOURCES = [
  "manual",
  "unexpected",
  "producer_request",
  "producer_announcement",
];

const STATUS_LABELS = {
  draft: "Draft",
  requested: "Requested",
  accepted: "Accepted",
  rejected: "Rejected",
  announced: "Announced",
  in_transit: "In transit",
  arrived: "Arrived",
  reviewing: "Reviewing",
  completed: "Completed",
  cancelled: "Cancelled",
};

const SOURCE_LABELS = {
  manual: "Manual",
  unexpected: "Unexpected delivery",
  producer_request: "Producer request",
  producer_announcement: "Producer announcement",
};

// Badge tone: neutral / info / warn / ok / bad.
const STATUS_TONES = {
  draft: "neutral",
  requested: "info",
  accepted: "info",
  rejected: "bad",
  announced: "info",
  in_transit: "info",
  arrived: "warn",
  reviewing: "warn",
  completed: "ok",
  cancelled: "neutral",
};

export function statusLabel(status) {
  return STATUS_LABELS[status] || status || "Unknown";
}

export function sourceLabel(source) {
  return SOURCE_LABELS[source] || source || "Unknown";
}

export function statusTone(status) {
  return STATUS_TONES[status] || "neutral";
}

// Presentation for the shared `.wine-badge` pill in index.css. Kept beside the
// tones for the same reason the labels live here: one place to change.
const BADGE_TONE_CLASSES = {
  neutral: "wine-badge--neutral",
  info: "wine-badge--info",
  warn: "wine-badge--warn",
  ok: "wine-badge--ok",
  bad: "wine-badge--bad",
};

export function badgeClass(tone) {
  return `wine-badge ${BADGE_TONE_CLASSES[tone] || BADGE_TONE_CLASSES.neutral}`;
}

// The review state of one line in a package. A line is reviewed as a VINTAGE of
// a wine, so it reads: not requested → pending → draft in progress → reviewed.
export const ITEM_REVIEW_STATES = {
  notRequested: { label: "Not requested", tone: "neutral" },
  pending: { label: "Pending", tone: "warn" },
  draft: { label: "Draft in progress", tone: "info" },
  reviewed: { label: "Reviewed", tone: "ok" },
};

export function itemReviewState(item) {
  if (!item || !item.review_requested) return ITEM_REVIEW_STATES.notRequested;
  if (item.reviewed) return ITEM_REVIEW_STATES.reviewed;
  if (item.review_id && item.review_status === "draft") return ITEM_REVIEW_STATES.draft;
  return ITEM_REVIEW_STATES.pending;
}

