import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Notifications from "./Notifications.jsx";
import { onNotificationsChanged } from "../services/notificationEvents";

const mockList = vi.fn();
const mockMarkRead = vi.fn();
const mockMarkAllRead = vi.fn();

vi.mock("../services/api", () => ({
  notificationsApi: {
    list: (...args) => mockList(...args),
    markRead: (...args) => mockMarkRead(...args),
    markAllRead: (...args) => mockMarkAllRead(...args),
  },
  winePackagesApi: { list: vi.fn(), show: vi.fn() },
  winePackageItemsApi: { create: vi.fn(), update: vi.fn(), destroy: vi.fn() },
  shipmentTrackingsApi: { show: vi.fn() },
  winesApi: { search: vi.fn() },
  producersApi: { list: vi.fn() },
  usersApi: { search: vi.fn() },
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, user_name: "Reviewer", roles: ["Editor"] },
    loading: false,
  }),
}));

const notification = {
  id: 21,
  notification_type: "wine_package_deadline",
  message:
    "Penfolds: 2 review(s) still pending; the review deadline is in 5 days (2026-10-01).",
  wine_package_id: 7,
  producer_name: "Penfolds",
  package_status: "arrived",
  scheduled_date: "2026-09-26",
  sent_at: null,
  read_at: null,
  sent: false,
  read: false,
  created_at: "2026-09-18T09:00:00Z",
};

function renderNotifications() {
  return render(
    <MemoryRouter>
      <Notifications />
    </MemoryRouter>,
  );
}

describe("Notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue({
      items: [notification],
      page: 1,
      per_page: 20,
      total_count: 1,
      total_pages: 1,
    });
    mockMarkRead.mockResolvedValue({ ...notification, read: true });
    mockMarkAllRead.mockResolvedValue({ marked: 1 });
  });

  it("lists the reminder with a link back to its package", async () => {
    renderNotifications();

    expect(
      await screen.findByText(/2 review\(s\) still pending/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Penfolds" })).toHaveAttribute(
      "href",
      "/wine-packages/7",
    );
    expect(screen.getByText("Unread")).toBeInTheDocument();
    expect(screen.getByText("not sent yet")).toBeInTheDocument();
  });

  it("marks one notification read and reloads the list", async () => {
    const user = userEvent.setup();
    renderNotifications();

    await user.click(await screen.findByRole("button", { name: "Mark read" }));

    await waitFor(() => expect(mockMarkRead).toHaveBeenCalledWith(21));
    expect(mockList).toHaveBeenCalledTimes(2);
  });

  it("marks every notification read", async () => {
    const user = userEvent.setup();
    renderNotifications();

    await user.click(
      await screen.findByRole("button", { name: "Mark all read" }),
    );

    await waitFor(() => expect(mockMarkAllRead).toHaveBeenCalled());
  });

  it("tells the header bell after marking one notification read", async () => {
    const user = userEvent.setup();
    const listener = vi.fn();
    const unsubscribe = onNotificationsChanged(listener);
    renderNotifications();

    try {
      await user.click(
        await screen.findByRole("button", { name: "Mark read" }),
      );
      await waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
    } finally {
      unsubscribe();
    }
  });

  it("tells the header bell after marking all read", async () => {
    const user = userEvent.setup();
    const listener = vi.fn();
    const unsubscribe = onNotificationsChanged(listener);
    renderNotifications();

    try {
      await user.click(
        await screen.findByRole("button", { name: "Mark all read" }),
      );
      await waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
    } finally {
      unsubscribe();
    }
  });

  it("filters to unread notifications", async () => {
    const user = userEvent.setup();
    renderNotifications();

    await screen.findByText(/2 review\(s\) still pending/);
    await user.click(screen.getByLabelText("Unread only"));

    await waitFor(() =>
      expect(mockList).toHaveBeenCalledWith(
        expect.objectContaining({ unread: "true" }),
      ),
    );
  });

  it("shows an empty state", async () => {
    mockList.mockResolvedValue({
      items: [],
      page: 1,
      per_page: 20,
      total_count: 0,
      total_pages: 0,
    });
    renderNotifications();

    expect(await screen.findByText(/No notifications yet/)).toBeInTheDocument();
  });
});
