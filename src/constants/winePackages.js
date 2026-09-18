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
