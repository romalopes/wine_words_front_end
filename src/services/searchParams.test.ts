import { effectiveSearchTerm, MIN_SEARCH_LENGTH } from "./searchParams";

describe("effectiveSearchTerm", () => {
  it("defaults to a three-character minimum", () => {
    expect(MIN_SEARCH_LENGTH).toBe(3);
  });

  it("blanks terms shorter than the minimum", () => {
    expect(effectiveSearchTerm("")).toBe("");
    expect(effectiveSearchTerm("b")).toBe("");
    expect(effectiveSearchTerm("ba")).toBe("");
  });

  it("keeps terms at or above the minimum", () => {
    expect(effectiveSearchTerm("bar")).toBe("bar");
    expect(effectiveSearchTerm("barolo")).toBe("barolo");
  });

  it("trims surrounding whitespace before measuring", () => {
    expect(effectiveSearchTerm("  ba  ")).toBe("");
    expect(effectiveSearchTerm("  bar  ")).toBe("bar");
  });

  it("treats URL-parsed numbers as strings", () => {
    expect(effectiveSearchTerm(123)).toBe("123");
    expect(effectiveSearchTerm(undefined)).toBe("");
  });

  it("honours a custom minimum", () => {
    expect(effectiveSearchTerm("ba", 2)).toBe("ba");
    expect(effectiveSearchTerm("b", 2)).toBe("");
  });
});
