import { act, renderHook } from "@testing-library/react";
import { useWritingDraft } from "./useWritingDraft";

beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
const key = "wine-words:writing:1:article:1";

it("debounces edits, flushes on exit, and does not save untouched server text", () => {
  const view = renderHook(({ body }) => useWritingDraft(key, { body }), { initialProps: { body: "server" } });
  act(() => vi.advanceTimersByTime(1000));
  expect(localStorage.getItem(key)).toBeNull();
  view.rerender({ body: "edited" });
  act(() => vi.advanceTimersByTime(750));
  expect(JSON.parse(localStorage.getItem(key)!).fields.body).toBe("edited");
  view.rerender({ body: "last keystroke" });
  view.unmount();
  expect(JSON.parse(localStorage.getItem(key)!).fields.body).toBe("last keystroke");
});

it("offers recovery without overwriting current content or the recovery copy", () => {
  localStorage.setItem(key, JSON.stringify({ fields: { body: "recovered" }, savedAt: "2026-10-06" }));
  const view = renderHook(({ body }) => useWritingDraft(key, { body }), { initialProps: { body: "server" } });
  expect(view.result.current.pending?.fields.body).toBe("recovered");
  view.rerender({ body: "new edits" });
  act(() => vi.advanceTimersByTime(1000));
  expect(JSON.parse(localStorage.getItem(key)!).fields.body).toBe("recovered");
  act(() => view.result.current.discard());
  act(() => vi.advanceTimersByTime(750));
  expect(JSON.parse(localStorage.getItem(key)!).fields.body).toBe("new edits");
});

it("clears a successful save without recreating the draft during unmount", () => {
  const view = renderHook(({ body }) => useWritingDraft(key, { body }), { initialProps: { body: "server" } });
  view.rerender({ body: "new edits" });
  act(() => view.result.current.clear());
  view.unmount();
  expect(localStorage.getItem(key)).toBeNull();
});

it("isolates recovery by account and record", () => {
  localStorage.setItem(key, JSON.stringify({ fields: { body: "private" }, savedAt: "2026-10-06" }));
  const view = renderHook(({ draftKey }) => useWritingDraft(draftKey, { body: "server" }), { initialProps: { draftKey: key } });
  expect(view.result.current.pending?.fields.body).toBe("private");
  view.rerender({ draftKey: "wine-words:writing:2:article:1" });
  expect(view.result.current.pending).toBeNull();
});

it("reports storage failures without interrupting editing", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Quota exceeded"); });
  const view = renderHook(({ body }) => useWritingDraft(key, { body }), { initialProps: { body: "server" } });
  view.rerender({ body: "new edits" });
  act(() => vi.advanceTimersByTime(750));
  expect(view.result.current.status).toContain("Could not save");
});

it("removes stale recovery when edits are undone back to the saved text", () => {
  const view = renderHook(({ body }) => useWritingDraft(key, { body }), { initialProps: { body: "server" } });
  view.rerender({ body: "edited" });
  act(() => vi.advanceTimersByTime(750));
  view.rerender({ body: "server" });
  view.unmount();
  expect(localStorage.getItem(key)).toBeNull();
});

it("keeps writing entered while a server save is in flight", () => {
  const view = renderHook(({ body }) => useWritingDraft(key, { body }), { initialProps: { body: "submitted" } });
  const savedRequestCompleted = view.result.current.clear;
  view.rerender({ body: "typed during save" });
  act(() => savedRequestCompleted());
  view.unmount();
  expect(JSON.parse(localStorage.getItem(key)!).fields.body).toBe("typed during save");
});
