import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Subscribe from "./Subscribe";
import type { Subscription } from "../types/subscription";

const mockList = vi.fn();
const mockCheckout = vi.fn();
const mockPortal = vi.fn();
const mockRefreshSession = vi.fn();

vi.mock("../services/api", () => ({
  subscriptionsApi: {
    list: (...args: unknown[]) => mockList(...args),
  },
  billingApi: {
    checkout: (...args: unknown[]) => mockCheckout(...args),
    changePreview: vi.fn(),
    changeConfirm: vi.fn(),
    confirm: vi.fn(),
    portal: (...args: unknown[]) => mockPortal(...args),
  },
}));

const authState = {
  user: null as null | {
    subscription?: { id: number } | null
    can_manage_billing?: boolean
  },
  refreshSession: (...args: unknown[]) => mockRefreshSession(...args),
};

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

function makePlan(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 1,
    name: "FREE",
    slug: "free",
    description: "Start exploring with free access.",
    popular: false,
    visible: true,
    active: true,
    is_default: true,
    position: 0,
    monthly_price_cents: null,
    yearly_price_cents: 0,
    currency: "USD",
    features: [],
    ...overrides,
  };
}

const freePlan = makePlan();
const paidPlan = makePlan({
  id: 2,
  name: "Enthusiast",
  slug: "enthusiast",
  description: "For regular tasters.",
  popular: true,
  is_default: false,
  position: 1,
  monthly_price_cents: 900,
  yearly_price_cents: 9000,
  features: [{ id: 1, name: "Unlimited reviews" }],
});

function LocationProbe() {
  const location = useLocation();
  return (
    <p data-testid="location">
      {location.pathname}
      {location.state ? JSON.stringify(location.state) : ""}
    </p>
  );
}

function renderSubscribe() {
  return render(
    <MemoryRouter initialEntries={["/subscribe"]}>
      <Routes>
        <Route path="/subscribe" element={<Subscribe />} />
        <Route path="/login" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  authState.user = null;
  mockList.mockResolvedValue([freePlan, paidPlan]);
});

describe("Subscribe (logged out)", () => {
  it("routes the FREE card to login instead of swallowing the click", async () => {
    const user = userEvent.setup();
    renderSubscribe();

    const freeButton = await screen.findByRole("button", { name: "Login to choose" });
    expect(freeButton).toBeEnabled();
    await user.click(freeButton);

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        '/login{"from":"/subscribe"}',
      );
    });
    expect(mockCheckout).not.toHaveBeenCalled();
  });

  it("keeps paid plans actionable via login instead of disabled", async () => {
    const user = userEvent.setup();
    renderSubscribe();

    const paidButton = await screen.findByRole("button", { name: "Login to choose plan" });
    expect(paidButton).toBeEnabled();
    await user.click(paidButton);

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        '/login{"from":"/subscribe"}',
      );
    });
    expect(mockCheckout).not.toHaveBeenCalled();
  });
});

describe("Subscribe (logged in, free tier)", () => {
  it("shows a disabled Current plan on FREE when the subscription id matches", async () => {
    authState.user = { subscription: { id: freePlan.id }, can_manage_billing: true };
    renderSubscribe();

    const freeButton = await screen.findByRole("button", { name: "Current plan" });
    expect(freeButton).toBeDisabled();
    expect(freeButton).toHaveAttribute("title", "FREE is your current plan");
    expect(screen.queryByRole("button", { name: /login to choose/i })).not.toBeInTheDocument();
  });

  it("shows a disabled Current plan on FREE for stale sessions without a subscription stub", async () => {
    // Sessions predating the backend's default-subscription backfill carry
    // `subscription: null` even though the account is on FREE.
    authState.user = { subscription: null, can_manage_billing: true };
    renderSubscribe();

    const freeButton = await screen.findByRole("button", { name: "Current plan" });
    expect(freeButton).toBeDisabled();
    expect(screen.queryByRole("button", { name: /login to choose/i })).not.toBeInTheDocument();
    expect(mockCheckout).not.toHaveBeenCalled();
  });
});

describe("Subscribe (logged in, paid tier)", () => {
  it("shows Manage subscription — not Current plan — on the FREE card", async () => {
    const user = userEvent.setup();
    authState.user = { subscription: { id: paidPlan.id }, can_manage_billing: true };
    mockPortal.mockResolvedValue({ url: "https://billing.stripe.com/p/session" });
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, href: "" },
      writable: true,
      configurable: true,
    });

    renderSubscribe();

    // The FREE card offers the Stripe portal (cancel/downgrade lives there —
    // this page has no downgrade-to-FREE path).
    const freeButtons = await screen.findAllByRole("button", { name: "Manage subscription" });
    expect(freeButtons).toHaveLength(2);
    await user.click(freeButtons[0]);

    await waitFor(() => {
      expect(mockPortal).toHaveBeenCalled();
    });
    expect(window.location.href).toBe("https://billing.stripe.com/p/session");
    expect(
      screen.queryByRole("button", { name: "Current plan" }),
    ).not.toBeInTheDocument();

    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it("starts checkout directly for paid plans without a login detour", async () => {
    const user = userEvent.setup();
    authState.user = { can_manage_billing: true };
    mockCheckout.mockResolvedValue({ url: "https://checkout.example/s/1" });
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, href: "" },
      writable: true,
      configurable: true,
    });

    renderSubscribe();

    const paidButton = await screen.findByRole("button", { name: "Choose plan" });
    await user.click(paidButton);

    await waitFor(() => {
      expect(mockCheckout).toHaveBeenCalledWith(paidPlan.id);
    });
    expect(window.location.href).toBe("https://checkout.example/s/1");

    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });
});
