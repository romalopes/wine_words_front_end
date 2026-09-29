import {
  isSearchIndexHealthy,
  isSearchIndexPayload,
  describeSearchIndexFailure,
} from "./apiHealthValidators";

/**
 * The search-index check exists because the failure it catches is invisible:
 * an unbuilt tsvector answers every `?query=` with an empty list, so the API
 * looks healthy while search silently returns nothing.
 */
describe("search index health validators", () => {
  const healthy = {
    status: "ok",
    reviews: { total: 48, indexed: 48, missing: 0 },
    articles: { total: 12, indexed: 12, missing: 0 },
  };

  it("accepts a fully built index", () => {
    expect(isSearchIndexPayload(healthy)).toBe(true);
    expect(isSearchIndexHealthy(healthy)).toBe(true);
  });

  it("rejects a payload that is missing the vector counts", () => {
    expect(isSearchIndexPayload({ status: "ok" })).toBe(false);
    expect(isSearchIndexPayload(null)).toBe(false);
    expect(isSearchIndexHealthy({ status: "degraded" })).toBe(false);
  });

  it("fails when rows were never indexed", () => {
    const degraded = {
      status: "degraded",
      reviews: { total: 48, indexed: 0, missing: 48 },
      articles: { total: 12, indexed: 12, missing: 0 },
    };

    expect(isSearchIndexHealthy(degraded)).toBe(false);
  });

  it("names the unindexed counts and the repair command", () => {
    const degraded = {
      status: "degraded",
      reviews: { total: 48, indexed: 0, missing: 48 },
      articles: { total: 12, indexed: 0, missing: 12 },
    };

    expect(describeSearchIndexFailure(degraded)).toBe(
      "48 review(s) and 12 article(s) are not indexed, so search cannot find them — run `bin/rails search:reindex`",
    );
  });

  it("explains the expected shape when the payload is unrecognisable", () => {
    expect(describeSearchIndexFailure(null)).toContain("reviews: { total, missing }");
  });
});
