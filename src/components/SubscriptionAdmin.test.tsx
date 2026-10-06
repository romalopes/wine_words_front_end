import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SubscriptionAdmin from "./SubscriptionAdmin";

const mockList = vi.fn();
const mockUpdate = vi.fn();

vi.mock("../services/api", () => ({
  subscriptionsApi: {
    list: (...args: unknown[]) => mockList(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    create: vi.fn(),
    destroy: vi.fn(),
  },
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1, display_name: "Admin", roles: ["Admin"] } }),
}));

// Prices are stored as integer cents by the API but the inputs are labelled and
// typed in dollars, so the conversion has to happen in both directions.
const plan = {
  id: 4,
  name: "Cellar",
  slug: "cellar",
  description: "Six bottles a year",
  popular: false,
  visible: true,
  active: true,
  is_default: false,
  position: 2,
  monthly_price_cents: 3900,
  yearly_price_cents: 46800,
  currency: "AUD",
  features: [],
};

function renderAdmin() {
  return render(
    <MemoryRouter>
      <SubscriptionAdmin />
    </MemoryRouter>,
  );
}

/**
 * The price input sitting beside a label. Each price field is a `<div>` holding a
 * `<label>` and its `<input>` as siblings, so look the input up from the shared
 * parent rather than from inside the label.
 */
function priceInput(labelText: RegExp): HTMLInputElement {
  const label = screen.getByText(labelText);
  const input = label.parentElement?.querySelector("input");
  if (!input) throw new Error(`no input found for ${String(labelText)}`);
  return input as HTMLInputElement;
}

describe("SubscriptionAdmin prices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue([plan]);
  });

  it("shows stored cents as dollars when editing a plan", async () => {
    renderAdmin();

    await waitFor(() => expect(mockList).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    await waitFor(() =>
      expect(priceInput(/yearly price/i).value).toBe("468.00"),
    );
    expect(priceInput(/monthly price/i).value).toBe("39.00");
  });

  it("sends the same cents back that the API gave it", async () => {
    renderAdmin();

    await waitFor(() => expect(mockList).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    await waitFor(() =>
      expect(priceInput(/yearly price/i).value).toBe("468.00"),
    );

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalled());
    expect(mockUpdate.mock.calls[0]?.[1]).toMatchObject({
      yearly_price_cents: 46800,
      monthly_price_cents: 3900,
    });
  });
});
