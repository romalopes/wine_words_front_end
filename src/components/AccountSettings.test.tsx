import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountSettings from "./AccountSettings";
import { accountApi } from "../services/api";

const refreshSession = vi.fn();
vi.mock("../contexts/AuthContext", () => ({ useAuth: () => ({ refreshSession }) }));
vi.mock("../services/api", () => ({
  accountApi: {
    show: vi.fn().mockResolvedValue({ first_name: "Élodie", last_name: "Smith", phone: null, date_of_birth: null, address: null }),
    update: vi.fn().mockResolvedValue({}),
  },
  countriesApi: { list: vi.fn().mockResolvedValue([]) },
  identitiesApi: { list: vi.fn().mockResolvedValue({ identities: [], password_authentication: true }) },
}));
vi.mock("../services/socialProviders", () => ({
  availableProviders: () => [], providerLabel: (value: string) => value,
  signInWith: vi.fn(), ProviderCancelledError: class extends Error {},
}));

it("loads the account names, saves changes without username, and refreshes the header", async () => {
  const user = userEvent.setup();
  render(<AccountSettings />);
  expect(await screen.findByLabelText("First name")).toHaveValue("Élodie");
  expect(screen.getByLabelText("Last name")).toHaveValue("Smith");
  expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument();
  await user.clear(screen.getByLabelText("Last name"));
  await user.type(screen.getByLabelText("Last name"), "O’Connor");
  await user.click(screen.getByRole("button", { name: "Save profile" }));
  await waitFor(() => expect(refreshSession).toHaveBeenCalled());
  expect(accountApi.update).toHaveBeenCalledWith(expect.objectContaining({ first_name: "Élodie", last_name: "O’Connor" }));
  expect(vi.mocked(accountApi.update).mock.calls[0]![0]).not.toHaveProperty("user_name");
  expect(vi.mocked(accountApi.update).mock.calls[0]![0]).not.toHaveProperty("display_name");
});
