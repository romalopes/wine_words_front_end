import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, Link } from "react-router-dom";
import NotificationBell from "./NotificationBell.jsx";
import { emitNotificationsChanged } from "../services/notificationEvents";

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
    mockList.mockResolvedValue({
      items: [],
      page: 1,
      per_page: 1,
      total_count: 0,
      total_pages: 0,
    });
    renderBell();

    expect(
      await screen.findByRole("link", { name: /Notifications/ }),
    ).toHaveAttribute("href", "/notifications");
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
    expect(mockList).toHaveBeenCalledWith({
      unread: "true",
      page: 1,
      per_page: 1,
    });
  });

  it("shows no badge when everything is read", async () => {
    mockList.mockResolvedValue({
      items: [],
      page: 1,
      per_page: 1,
      total_count: 0,
      total_pages: 0,
    });
    renderBell();

    await screen.findByRole("link", { name: /Notifications/ });
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("stays usable when the request fails", async () => {
    mockList.mockRejectedValue(new Error("unauthorised"));
    renderBell();

    expect(
      await screen.findByRole("link", { name: /Notifications/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("re-checks the count when notifications change elsewhere", async () => {
    // Initially 3 unread, then everything read (e.g. after "Mark all read").
    mockList
      .mockResolvedValueOnce({
        items: [{}],
        page: 1,
        per_page: 1,
        total_count: 3,
        total_pages: 3,
      })
      .mockResolvedValue({
        items: [],
        page: 1,
        per_page: 1,
        total_count: 0,
        total_pages: 0,
      });
    renderBell();

    expect(await screen.findByText("3")).toBeInTheDocument();

    act(() => {
      emitNotificationsChanged();
    });

    await waitFor(() =>
      expect(screen.queryByText("3")).not.toBeInTheDocument(),
    );
    expect(mockList).toHaveBeenCalledTimes(2);
  });

  it("re-checks the count when navigating between pages", async () => {
    const user = userEvent.setup();
    mockList.mockResolvedValue({
      items: [],
      page: 1,
      per_page: 1,
      total_count: 0,
      total_pages: 0,
    });
    render(
      <MemoryRouter>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <NotificationBell />
                <Link to="/elsewhere">elsewhere</Link>
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole("link", { name: /Notifications/ });
    await user.click(screen.getByRole("link", { name: "elsewhere" }));

    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(2));
  });
});
