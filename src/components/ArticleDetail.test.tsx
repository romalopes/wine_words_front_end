import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ArticleDetail from "./ArticleDetail";

/**
 * The article page renders its linked reviews with the shared `ReviewCard`
 * (the same card the /reviews grid uses) instead of its own stub markup.
 */
const mockShow = vi.fn();

vi.mock("../services/api", () => ({
  articlesApi: {
    show: (...args: unknown[]) => mockShow(...args),
    update: vi.fn().mockResolvedValue({}),
    destroy: vi.fn().mockResolvedValue({}),
  },
  likesApi: { toggle: vi.fn().mockResolvedValue({ liked: true, likes_count: 1 }) },
}));

// Anonymous: the like control renders read-only, so nothing hits the API.
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, loading: false }),
}));

// Only mounted behind interaction / at the bottom of the page.
vi.mock("./ArticleForm", () => ({ default: () => null }));
vi.mock("./comments/CommentSection", () => ({ default: () => null }));

interface ReviewStub {
  id: number;
  slug: string;
  title: string;
  score: number | null;
  status: string;
  comment: string | null;
  reviewer_name: string;
  link_status: string;
  wine_name?: string;
  wine_slug?: string;
  vintage_year?: number;
}

function makeReview(overrides: Partial<ReviewStub> = {}): ReviewStub {
  return {
    id: 1,
    slug: "a-lovely-wine",
    title: "A lovely wine",
    score: 92,
    status: "published",
    comment: "<p>Very nice.</p>",
    reviewer_name: "Reviewer",
    link_status: "published",
    ...overrides,
  };
}

function makeArticle(reviews: ReviewStub[]) {
  return {
    id: 7,
    title: "Barolo vertical",
    slug: "barolo-vertical",
    status: "published",
    author_name: "Editor",
    user_id: 2,
    body: "<p>Article body.</p>",
    reviews,
  };
}

function renderAt(path: string, reviews: ReviewStub[]) {
  mockShow.mockResolvedValue(makeArticle(reviews));

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/articles/:slug" element={<ArticleDetail />} />
        <Route path="/reviews/:slug" element={<p>review detail page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

/** The cards the reviews section renders, in DOM order. */
function reviewCards(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(".content-grid .wine-management__card"));
}

beforeEach(() => {
  mockShow.mockReset();
});

describe("ArticleDetail reviews", () => {
  it("renders each linked review as a card in the reviews grid", async () => {
    renderAt("/articles/barolo-vertical", [
      makeReview({ id: 1, title: "First review", score: 97 }),
      makeReview({ id: 2, slug: "second", title: "Second review", score: 80 }),
    ]);

    expect(await screen.findByRole("heading", { name: "Reviews" })).toBeInTheDocument();

    await waitFor(() => expect(reviewCards()).toHaveLength(2));
    expect(screen.getByText("First review")).toBeInTheDocument();
    expect(screen.getByText("Second review")).toBeInTheDocument();

    // Card contents match the /reviews card: score badge, byline, excerpt.
    expect(screen.getAllByText("97").length).toBe(1);
    expect(screen.getAllByText("by Reviewer")).toHaveLength(2);
    expect(screen.getAllByText("Very nice.").length).toBe(2);
    expect(reviewCards()[0]?.querySelector(".wine-management__card-header")).not.toBeNull();
  });

  it("hides reviews whose link or whose own status is not published", async () => {
    renderAt("/articles/barolo-vertical", [
      makeReview({ id: 1, title: "Visible" }),
      makeReview({ id: 2, title: "Unpublished link", link_status: "draft" }),
      makeReview({ id: 3, title: "Draft review", status: "draft" }),
    ]);

    await waitFor(() => expect(reviewCards()).toHaveLength(1));
    expect(screen.getByText("Visible")).toBeInTheDocument();
    expect(screen.queryByText("Unpublished link")).not.toBeInTheDocument();
    expect(screen.queryByText("Draft review")).not.toBeInTheDocument();
  });

  it("opens the review when its card is clicked", async () => {
    const user = userEvent.setup();
    renderAt("/articles/barolo-vertical", [makeReview({ id: 1, slug: "a-lovely-wine" })]);

    const card = await waitFor(() => {
      const [found] = reviewCards();
      if (!found) throw new Error("review card not rendered");
      return found;
    });

    await user.click(card);
    expect(await screen.findByText("review detail page")).toBeInTheDocument();
  });

  it("omits the section entirely when the article has no visible reviews", async () => {
    renderAt("/articles/barolo-vertical", []);
    await screen.findByRole("heading", { name: "Barolo vertical", level: 1 });

    expect(screen.queryByRole("heading", { name: "Reviews" })).not.toBeInTheDocument();
    expect(reviewCards()).toHaveLength(0);
  });
});
