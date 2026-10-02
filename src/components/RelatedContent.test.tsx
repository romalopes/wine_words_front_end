import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RelatedContent from "./RelatedContent";
import type { RelatedKind } from "./RelatedContent";

/**
 * The "more articles" / "more reviews" footer shared by both detail pages,
 * modeled on the Substack post footer: text on the left, cover image on the
 * right, and a "See all" link.
 */
const mockArticleRelated = vi.fn();
const mockReviewRelated = vi.fn();

vi.mock("../services/api", () => ({
  articlesApi: {
    related: (...args: unknown[]) => mockArticleRelated(...args),
  },
  reviewsApi: {
    related: (...args: unknown[]) => mockReviewRelated(...args),
  },
  likesApi: { toggle: vi.fn().mockResolvedValue({ liked: true, likes_count: 1 }) },
}));

// Anonymous: the like control renders read-only, so nothing hits the API.
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, loading: false }),
}));

interface RelatedRow {
  id: number;
  slug: string;
  title: string;
  abstract?: string | null;
  comment?: string | null;
  author_name?: string | null;
  reviewer_name?: string | null;
  published_at?: string | null;
  images?: string[];
  likes_count?: number;
}

function makeRow(overrides: Partial<RelatedRow> = {}): RelatedRow {
  return {
    id: 1,
    slug: "hunter-valley-summer-whites",
    title: "Hunter Valley Series: Emerging summer whites",
    abstract: "Forget Semillon for a moment.",
    author_name: "Wine Words",
    reviewer_name: "Wine Words",
    published_at: "2026-08-05T05:43:00Z",
    likes_count: 2,
    ...overrides,
  };
}

const ARTICLE_ITEM = {
  id: 7,
  title: "Yangarra",
  slug: "yangarra-high-sands-grenache",
  status: "published",
};

const REVIEW_ITEM = {
  id: 8,
  title: "Yangarra High Sands Grenache 2017",
  slug: "yangarra-high-sands-grenache-2017",
  status: "published",
};

function renderFooter(
  kind: RelatedKind,
  rows: RelatedRow[] | Error,
  item: { id: number; slug: string } = ARTICLE_ITEM,
) {
  const mock = kind === "article" ? mockArticleRelated : mockReviewRelated;
  mock.mockReturnValue(
    rows instanceof Error ? Promise.reject(rows) : Promise.resolve(rows),
  );
  const base = `/${kind === "article" ? "articles" : "reviews"}`;

  return render(
    <MemoryRouter initialEntries={[`${base}/${item.slug}`]}>
      <RelatedContent kind={kind} item={item} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockArticleRelated.mockReset();
  mockReviewRelated.mockReset();
});

describe("RelatedContent", () => {
  it("asks the articles API for five related articles for this article's slug", async () => {
    renderFooter("article", [makeRow()]);

    expect(await screen.findByText("Hunter Valley Series: Emerging summer whites")).toBeInTheDocument();
    expect(mockArticleRelated).toHaveBeenCalledWith(
      "yangarra-high-sands-grenache",
      { limit: 5 },
      expect.objectContaining({ signal: expect.anything() }),
    );
  });

  it("asks the reviews API and previews the tasting note on the review page", async () => {
    renderFooter(
      "review",
      [
        makeRow({
          id: 11,
          slug: "emidio-pepe-2014",
          title: "Review: Emidio Pepe Montepulciano 2014",
          abstract: null,
          comment: "<p>Dark cherry, dried herb, a long finish.</p>",
          reviewer_name: "Anderson",
          author_name: null,
        }),
      ],
      REVIEW_ITEM,
    );

    expect(await screen.findByText("More reviews")).toBeInTheDocument();
    expect(mockReviewRelated).toHaveBeenCalledWith(
      "yangarra-high-sands-grenache-2017",
      { limit: 5 },
      expect.objectContaining({ signal: expect.anything() }),
    );
    // The review preview is the tasting note, tag-stripped, and the byline is
    // the reviewer rather than an article author.
    expect(screen.getByText("Dark cherry, dried herb, a long finish.")).toBeInTheDocument();
    expect(screen.getByText(/Anderson/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See all →" })).toHaveAttribute(
      "href",
      "/reviews",
    );
  });

  it("renders one row per article with the title, preview and meta line", async () => {
    renderFooter("article", [
      makeRow({ id: 1, title: "First" }),
      makeRow({ id: 2, slug: "second", title: "Second" }),
    ]);

    expect(await screen.findByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getAllByText("Forget Semillon for a moment.")).toHaveLength(2);
    expect(screen.getAllByText(/Wine Words/).length).toBeGreaterThan(0);
    // Each row links to its own article detail page. `useReturnToLink` appends
    // the `returnTo` breadcrumb because the test is already on a detail page.
    expect(screen.getByRole("link", { name: "First" })).toHaveAttribute(
      "href",
      expect.stringContaining("/articles/hunter-valley-summer-whites"),
    );
  });

  it("puts the cover image on the right of the row's text", async () => {
    renderFooter("article", [makeRow({ images: ["https://example.test/cover.png"] })]);

    const row = (await screen.findByText("Hunter Valley Series: Emerging summer whites")).closest(
      ".related-row",
    );
    const thumb = row?.querySelector(".related-row__thumb");

    expect(thumb).not.toBeNull();
    expect(thumb).toHaveAttribute("src", "https://example.test/cover.png");
    // The media column is the grid's second column, so it follows the text block
    // in the DOM. (jsdom does not apply index.css, so no computed style here.)
    const body = row?.querySelector(".related-row__body") as HTMLElement | null;
    const media = row?.querySelector(".related-row__media") as HTMLElement | null;
    expect(body).not.toBeNull();
    expect(media).not.toBeNull();
    expect(
      (body as HTMLElement).compareDocumentPosition(media as HTMLElement) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("omits the thumbnail when the article has no image", async () => {
    renderFooter("article", [makeRow({ images: [] })]);

    await screen.findByText("Hunter Valley Series: Emerging summer whites");
    expect(document.querySelector(".related-row__thumb")).toBeNull();
  });

  it("links to the articles listing below the list", async () => {
    renderFooter("article", [makeRow()]);

    const seeAll = await screen.findByRole("link", { name: /see all/i });
    expect(seeAll).toHaveAttribute("href", "/articles");
  });

  it("renders nothing when there are no related articles", async () => {
    const { container } = renderFooter("article", []);

    await waitFor(() => expect(mockArticleRelated).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the review has no related reviews", async () => {
    // An uncategorised review now falls back server-side, but an empty response
    // is still possible (nothing else visible yet); the footer must stay hidden.
    const { container } = renderFooter("review", [], REVIEW_ITEM);

    await waitFor(() => expect(mockReviewRelated).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the request fails", async () => {
    const { container } = renderFooter("article", new Error("boom"));

    // waitFor settles the rejected promise inside act(), so the `.catch` state
    // update has already happened by the assertion.
    await waitFor(() => expect(mockArticleRelated).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
