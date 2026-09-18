import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotificationBell from "./NotificationBell.jsx";

const mockList = vi.fn();

vi.mock("../services/api", () => ({
  notificationsApi: { list: (...args) => mockList(...args) },
}));

function renderBell() {
  return render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>,
  );
}

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("links to the notifications page", async () => {
    mockList.mockResolvedValue({ items: [], page: 1, per_page: 1, total_count: 0, total_pages: 0 });
    renderBell();

    expect(await screen.findByRole("link", { name: /Notifications/ })).toHaveAttribute(
      "href",
      "/notifications",
    );
  });

  it("shows the unread count from the paginated envelope", async () => {
    mockList.mockResolvedValue({
      items: [{}],
      page: 1,
      per_page: 1,
      total_count: 3,
      total_pages: 3,
    });
    renderBell();

    expect(await screen.findByText("3")).toBeInTheDocument();
    expect(mockList).toHaveBeenCalledWith({ unread: "true", page: 1, per_page: 1 });
  });

  it("shows no badge when everything is read", async () => {
    mockList.mockResolvedValue({ items: [], page: 1, per_page: 1, total_count: 0, total_pages: 0 });
    renderBell();

    await screen.findByRole("link", { name: /Notifications/ });
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("stays usable when the request fails", async () => {
    mockList.mockRejectedValue(new Error("unauthorised"));
    renderBell();

    expect(await screen.findByRole("link", { name: /Notifications/ })).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});