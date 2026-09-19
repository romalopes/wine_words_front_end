import {
  PACKAGE_STATUSES,
  badgeClass,
  itemReviewState,
  sourceLabel,
  statusLabel,
  statusTone,
} from "./winePackages.js";

// The package vocabulary is shared by the list, the detail page, the
// notifications list and the item form. These tests pin the parts the status
// pills and review badges depend on, so a label or a tone cannot drift
// silently away from the shared `.wine-badge` classes in index.css.
describe("constants/winePackages", () => {
  it("labels every known status and falls back for anything else", () => {
    PACKAGE_STATUSES.forEach((status) => {
      expect(statusLabel(status)).not.toBe(status);
    });

    expect(statusLabel("completed")).toBe("Completed");
    expect(statusLabel("in_transit")).toBe("In transit");
    expect(statusLabel(null)).toBe("Unknown");
    // An unknown enum value is shown as-is rather than swallowed.
    expect(statusLabel("something_new")).toBe("something_new");
  });

  it("gives every known status a tone, defaulting to neutral", () => {
    PACKAGE_STATUSES.forEach((status) => {
      expect(["neutral", "info", "warn", "ok", "bad"]).toContain(statusTone(status));
    });

    expect(statusTone("completed")).toBe("ok");
    expect(statusTone("arrived")).toBe("warn");
    expect(statusTone("rejected")).toBe("bad");
    expect(statusTone("unknown_status")).toBe("neutral");
  });

  it("builds a badge class and never drops the base class", () => {
    expect(badgeClass("ok")).toBe("wine-badge wine-badge--ok");
    expect(badgeClass("bad")).toBe("wine-badge wine-badge--bad");
    // An unrecognised tone must still render a visible pill, not "undefined".
    expect(badgeClass("not-a-tone")).toBe("wine-badge wine-badge--neutral");
  });

  it("reads a line's review state from the API payload", () => {
    // A line that was never requested for review.
    expect(itemReviewState({ review_requested: false })).toMatchObject({
      label: "Not requested",
      tone: "neutral",
    });

    // Requested, but no review written yet.
    expect(itemReviewState({ review_requested: true, reviewed: false })).toMatchObject({
      label: "Pending",
      tone: "warn",
    });

    // Requested with a draft in progress — started, not finished.
    expect(
      itemReviewState({
        review_requested: true,
        reviewed: false,
        review_id: 5,
        review_status: "draft",
      }),
    ).toMatchObject({ label: "Draft in progress", tone: "info" });

    // Published, so the line counts as done. The published status alone is not
    // enough — `reviewed` is what the backend derives from the review state.
    expect(
      itemReviewState({
        review_requested: true,
        reviewed: true,
        review_id: 5,
        review_status: "published",
      }),
    ).toMatchObject({ label: "Reviewed", tone: "ok" });
  });

  it("treats a missing item as not requested rather than throwing", () => {
    expect(itemReviewState(null)).toMatchObject({ label: "Not requested" });
    expect(itemReviewState(undefined)).toMatchObject({ label: "Not requested" });
  });

  it("labels the sources, falling back to the raw value", () => {
    expect(sourceLabel("unexpected")).toBe("Unexpected delivery");
    expect(sourceLabel("producer_request")).toBe("Producer request");
    expect(sourceLabel(null)).toBe("Unknown");
  });
});