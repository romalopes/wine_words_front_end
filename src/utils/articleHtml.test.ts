import { normalizeArticleBody } from "./articleHtml";

/**
 * The normaliser turns the two body shapes the API ships (legacy
 * `<div>…<br><br>…` and Trix block divs) into real paragraphs, and leaves
 * already-block markup alone.
 */
describe("normalizeArticleBody", () => {
  it("splits legacy <br><br> runs into paragraphs but keeps single <br>", () => {
    const html = "<div>One.<br><br>Two line one<br>Two line two<br><br>Three.</div>";
    expect(normalizeArticleBody(html)).toBe(
      "<p>One.</p><p>Two line one<br>Two line two</p><p>Three.</p>",
    );
  });

  it("treats whitespace between breaks as one paragraph break", () => {
    expect(normalizeArticleBody("<div>One.<br>\n<br>Two.</div>")).toBe(
      "<p>One.</p><p>Two.</p>",
    );
  });

  it("converts Trix blocks and drops blank Trix lines", () => {
    const html = "<div>First.</div><div><br></div><div>Second.</div>";
    expect(normalizeArticleBody(html)).toBe("<p>First.</p><p>Second.</p>");
  });

  it("flattens nested wrappers down to paragraphs", () => {
    const html = "<div><div>One.<br><br>Two.</div></div>";
    expect(normalizeArticleBody(html)).toBe("<p>One.</p><p>Two.</p>");
  });

  it("wraps a single-line block in one paragraph", () => {
    expect(normalizeArticleBody("<div>Just a line.</div>")).toBe(
      "<p>Just a line.</p>",
    );
  });

  it("splits bare text with hard breaks when there is no wrapper", () => {
    expect(normalizeArticleBody("One.<br><br>Two.")).toBe(
      "<p>One.</p><p>Two.</p>",
    );
  });

  it("leaves paragraphs, headings, figures and lists untouched", () => {
    const html =
      "<p>Keep.</p><h2>Heading</h2><figure><img src=\"/x.png\"><figcaption>C</figcaption></figure><ul><li>Item</li></ul>";
    expect(normalizeArticleBody(html)).toBe(html);
  });

  it("keeps single <br> content unwrapped", () => {
    const html = "One<br>Two";
    expect(normalizeArticleBody(html)).toBe(html);
  });

  it("returns an empty string for empty input", () => {
    expect(normalizeArticleBody("")).toBe("");
  });

  it("drops blocks that hold nothing but whitespace and line breaks", () => {
    expect(normalizeArticleBody("<div><br></div><div>  </div>")).toBe("");
  });
});
