import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useReturnToLink } from "./useReturnToLink.js";
import { useReturnTo } from "./useReturnTo.js";

// These two hooks power the "← Back to <origin>" links on every detail page.
// They are shared by Wine, Article, Review and (now) Wine Package detail, so a
// regression here silently breaks the return-trip on all of them.
function router(initialEntry) {
  return function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
    );
  };
}

describe("useReturnToLink", () => {
  it("records a WinePackage origin when linking into a review", () => {
    const { result } = renderHook(() => useReturnToLink(), {
      wrapper: router("/wine-packages/7"),
    });
    expect(result.current(`/reviews/chardonay-2026`)).toBe(
      `/reviews/chardonay-2026?returnTo=%2Fwine-packages%2F7`,
    );
  });

  it("does not record an origin from a non-detail page", () => {
    const { result } = renderHook(() => useReturnToLink(), {
      wrapper: router("/dashboard"),
    });
    expect(result.current(`/reviews/chardonay-2026`)).toBe(
      `/reviews/chardonay-2026`,
    );
  });

  it("passes the target through when it is not itself a detail page", () => {
    const { result } = renderHook(() => useReturnToLink(), {
      wrapper: router("/wine-packages/7"),
    });
    expect(result.current(`/wines`)).toBe(`/wines`);
  });
});

describe("useReturnTo", () => {
  it("parses a WinePackage origin with the human label", () => {
    const { result } = renderHook(() => useReturnTo(), {
      wrapper: router("/reviews/chardonay-2026?returnTo=%2Fwine-packages%2F7"),
    });
    expect(result.current).toEqual({
      path: "/wine-packages/7",
      label: "Wine Package",
    });
  });

  it("returns null when there is no returnTo param", () => {
    const { result } = renderHook(() => useReturnTo(), {
      wrapper: router("/reviews/chardonay-2026"),
    });
    expect(result.current).toBeNull();
  });

  it("falls back to the raw path type when the source is unknown", () => {
    const { result } = renderHook(() => useReturnTo(), {
      wrapper: router("/reviews/x?returnTo=/unknown-source/9"),
    });
    expect(result.current).toEqual({
      path: "/unknown-source/9",
      label: "unknown-source",
    });
  });
});
