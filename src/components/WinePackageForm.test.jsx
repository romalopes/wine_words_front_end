import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import WinePackageForm from "./WinePackageForm.jsx";

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockShow = vi.fn();
const mockProducerSearch = vi.fn().mockResolvedValue([]);
const mockProducerCreate = vi.fn();

vi.mock("../services/api", () => ({
  winePackagesApi: {
    create: (...args) => mockCreate(...args),
    update: (...args) => mockUpdate(...args),
    show: (...args) => mockShow(...args),
  },
  winePackageItemsApi: { create: vi.fn(), update: vi.fn(), destroy: vi.fn() },
  shipmentTrackingsApi: { show: vi.fn() },
  notificationsApi: { list: vi.fn() },
  winesApi: { search: vi.fn() },
  producersApi: {
    search: (...args) => mockProducerSearch(...args),
    create: (...args) => mockProducerCreate(...args),
  },
  usersApi: { search: vi.fn() },
}));

let currentUser = { id: 1, user_name: "Reviewer", roles: ["Editor"] };

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ user: currentUser, loading: false }),
}));

function todayInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function renderForm(path = "/wine-packages/new?mode=arrived") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<WinePackageForm />} path="/wine-packages/new" />
        <Route element={<WinePackageForm />} path="/wine-packages/:id/edit" />
      </Routes>
    </MemoryRouter>,
  );
}

describe("WinePackageForm (create)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = { id: 1, user_name: "Reviewer", roles: ["Editor"] };
    mockProducerSearch.mockResolvedValue([{ id: 3, name: "Penfolds" }]);
    mockCreate.mockResolvedValue({ id: 9 });
  });

  // The form uses ProducerSearch (type + pick), not a producer <select>.
  async function pickProducer(user, name = "Penfolds") {
    const input = await screen.findByPlaceholderText("Start typing a producer name…");
    await user.type(input, name.slice(0, 4));
    await screen.findByRole("button", { name });
    await user.click(screen.getByRole("button", { name }));
  }

  it("opens in 'Record Received Package' mode with today's arrival date", async () => {
    renderForm();

    expect(
      await screen.findByRole("heading", { name: "Record Received Package" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Arrived date")).toHaveValue(todayInputValue());
    expect(screen.getByLabelText("Review deadline")).toBeInTheDocument();
  });

  it("records a received package as arrived/unexpected with today's date", async () => {
    const user = userEvent.setup();
    renderForm();

    await screen.findByRole("heading", { name: "Record Received Package" });
    await pickProducer(user);
    await user.click(screen.getByRole("button", { name: "Create Package" }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        producer_id: 3,
        status: "arrived",
        source: "unexpected",
        arrived_at: todayInputValue(),
      }),
    );
  });

  it("adds an expected package as announced without an arrival date", async () => {
    const user = userEvent.setup();
    renderForm("/wine-packages/new?mode=announced");

    await screen.findByRole("heading", { name: "Add Expected Package" });
    expect(screen.queryByLabelText("Arrived date")).not.toBeInTheDocument();

    await pickProducer(user);
    await user.click(screen.getByRole("button", { name: "Create Package" }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "announced", source: "manual" }),
    );
    expect(mockCreate.mock.calls[0][0]).not.toHaveProperty("arrived_at");
  });

  it("switches the default source when the entry mode changes", async () => {
    const user = userEvent.setup();
    renderForm();

    await screen.findByRole("heading", { name: "Record Received Package" });
    await user.click(screen.getByRole("radio", { name: "Add Producer Request" }));

    expect(screen.getByLabelText("Source")).toHaveValue("producer_request");
  });
});

describe("WinePackageForm (edit)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = { id: 1, user_name: "Reviewer", roles: ["Editor"] };
    mockProducerSearch.mockResolvedValue([{ id: 3, name: "Penfolds" }]);
    mockShow.mockResolvedValue({
      id: 7,
      producer_id: 3,
      producer_name: "Penfolds",
      source: "unexpected",
      status: "arrived",
      expected_at: null,
      arrived_at: "2026-09-01T09:00:00Z",
      review_deadline: "2026-10-01",
      notes: "Left at reception",
      reviewer_id: 1,
    });
    mockUpdate.mockResolvedValue({ id: 7 });
  });

  it("loads the package and saves the editable fields", async () => {
    const user = userEvent.setup();
    renderForm("/wine-packages/7/edit");

    expect(await screen.findByRole("heading", { name: "Edit Package #7" })).toBeInTheDocument();
    expect(screen.getByLabelText("Review deadline")).toHaveValue("2026-10-01");

    await user.clear(screen.getByLabelText("Notes"));
    await user.type(screen.getByLabelText("Notes"), "Two bottles damaged");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalled());
    const [id, payload] = mockUpdate.mock.calls[0];
    expect(id).toBe("7");
    expect(payload).toMatchObject({ producer_id: 3, notes: "Two bottles damaged" });
    // Source and status belong to the workflow, not this form.
    expect(payload).not.toHaveProperty("status");
    expect(payload).not.toHaveProperty("source");
  });

  it("does not offer the reviewer field to a non-admin", async () => {
    renderForm("/wine-packages/7/edit");

    await screen.findByRole("heading", { name: "Edit Package #7" });
    expect(screen.queryByLabelText("Reviewer (user id)")).not.toBeInTheDocument();
  });
});