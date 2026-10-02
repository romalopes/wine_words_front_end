import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RelatedArticles from "./RelatedArticles";

/**
 * The article page's "more articles" footer, modeled on the Substack post
 * footer: text on the left, cover image on the right, and a "See all" link.
 */
const mockRelated = vi.fn();

vi.mock("../services/api", () => ({
  articlesApi: {
    related: (...args: unknown[]) => mockRelated(...args),
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
  author_name?: string | null;
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
    published_at: "2026-08-05T05:43:00Z",
    likes_count: 2,
    ...overrides,
  };
}

function renderFooter(rows: RelatedRow[] | Error) {
  mockRelated.mockReturnValue(rows instanceof Error ? Promise.reject(rows) : Promise.resolve(rows));
  return render(
    <MemoryRouter initialEntries={["/articles/yangarra-high-sands-grenache"]}>
      <RelatedArticles
        article={{ id: 7, title: "Yangarra", slug: "yangarra-high-sands-grenache", status: "published" }}
      />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockRelated.mockReset();
});

describe("RelatedArticles", () => {
  it("asks the API for five related articles for this article's slug", async () => {
    renderFooter([makeRow()]);

    expect(await screen.findByText("Hunter Valley Series: Emerging summer whites")).toBeInTheDocument();
    expect(mockRelated).toHaveBeenCalledWith(
      "yangarra-high-sands-grenache",
      { limit: 5 },
      expect.objectContaining({ signal: expect.anything() }),
    );
  });

  it("renders one row per article with the title, preview and meta line", async () => {
    renderFooter([
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
    renderFooter([makeRow({ images: ["https://example.test/cover.png"] })]);

    const row = (await screen.findByText("Hunter Valley Series: Emerging summer whites")).closest(
      ".related-article",
    );
    const thumb = row?.querySelector(".related-article__thumb");

    expect(thumb).not.toBeNull();
    expect(thumb).toHaveAttribute("src", "https://example.test/cover.png");
    // The media column is the grid's second column, so it follows the text block
    // in the DOM. (jsdom does not apply index.css, so no computed style here.)
    const body = row?.querySelector(".related-article__body") as HTMLElement | null;
    const media = row?.querySelector(".related-article__media") as HTMLElement | null;
    expect(body).not.toBeNull();
    expect(media).not.toBeNull();
    expect(
      (body as HTMLElement).compareDocumentPosition(media as HTMLElement) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("omits the thumbnail when the article has no image", async () => {
    renderFooter([makeRow({ images: [] })]);

    await screen.findByText("Hunter Valley Series: Emerging summer whites");
    expect(document.querySelector(".related-article__thumb")).toBeNull();
  });

  it("links to the articles listing below the list", async () => {
    renderFooter([makeRow()]);

    const seeAll = await screen.findByRole("link", { name: /see all/i });
    expect(seeAll).toHaveAttribute("href", "/articles");
  });

  it("renders nothing when there are no related articles", async () => {
    const { container } = renderFooter([]);

    await waitFor(() => expect(mockRelated).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the request fails", async () => {
    const { container } = renderFooter(new Error("boom"));

    // waitFor settles the rejected promise inside act(), so the `.catch` state
    // update has already happened by the assertion.
    await waitFor(() => expect(mockRelated).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
