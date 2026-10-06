import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Subscribe from "./Subscribe";
import type { Subscription } from "../types/subscription";

const mockList = vi.fn();
const mockCheckout = vi.fn();
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
    portal: vi.fn(),
  },
}));

const authState = {
  user: null as null | { subscription?: { id: number }; can_manage_billing?: boolean },
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

describe("Subscribe (logged in)", () => {
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
