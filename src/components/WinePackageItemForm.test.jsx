import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WinePackageItemForm from "./WinePackageItemForm";

// Partial mock: the real module is loaded and only the endpoints this form
// calls are replaced, so the test cannot break when unrelated exports change.
vi.mock("../services/api", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    winesApi: { search: vi.fn(), create: vi.fn() },
    vintagesApi: { create: vi.fn() },
    winePackageItemsApi: { create: vi.fn(), update: vi.fn(), destroy: vi.fn() },
  };
});

import { winesApi, vintagesApi, winePackageItemsApi } from "../services/api";

// The producer's catalogue, as GET /wines/search?producer_id=3 returns it.
const PRODUCER_WINES = [
  {
    id: 1,
    name: "Grange",
    slug: "grange",
    color: "Red",
    vintages: [
      { id: 11, year: 2018, no_vintage: false },
      { id: 12, year: 2020, no_vintage: false },
    ],
  },
  {
    id: 2,
    name: "Bin 389",
    slug: "bin-389",
    color: "Red",
    vintages: [{ id: 21, year: null, no_vintage: true }],
  },
];

function renderForm(overrides = {}) {
  return render(
    <WinePackageItemForm
      packageId={7}
      producerId={3}
      producerName="Penfolds"
      onSaved={vi.fn()}
      onCancel={vi.fn()}
      {...overrides}
    />,
  );
}

describe("WinePackageItemForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    winesApi.search.mockResolvedValue(PRODUCER_WINES);
    winesApi.create.mockResolvedValue({
      id: 9,
      name: "New Wine",
      slug: "new-wine",
      vintages: [{ id: 99, year: 2020, no_vintage: false }],
    });
    vintagesApi.create.mockResolvedValue({ id: 22, year: 2021, no_vintage: false });
    winePackageItemsApi.create.mockResolvedValue({ id: 5 });
    winePackageItemsApi.update.mockResolvedValue({ id: 5 });
    winePackageItemsApi.destroy.mockResolvedValue({});
  });

  it("lists the package producer's wines without typing a search", async () => {
    renderForm();

    await waitFor(() =>
      expect(winesApi.search).toHaveBeenCalledWith({ producerId: 3 }),
    );
  });

  it("renders the producer's wines and their vintages", async () => {
    const { container } = renderForm();

    await waitFor(() => expect(winesApi.search).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByRole("option", { name: /Grange/i })).toBeTruthy(),
    );
    expect(screen.getByRole("option", { name: /Bin 389/i })).toBeTruthy();

    // Selecting a wine exposes that wine's vintages.
    const wineSelect = container.querySelector("select");
    fireEvent.change(wineSelect, { target: { value: "1" } });

    await waitFor(() =>
      expect(screen.getByRole("option", { name: /2018/ })).toBeTruthy(),
    );
    expect(screen.getByRole("option", { name: /2020/ })).toBeTruthy();
  });

  it("refuses to submit a line without a vintage", async () => {
    const { container } = renderForm();

    await waitFor(() => expect(winesApi.search).toHaveBeenCalled());

    // Nothing picked at all. Choosing a wine preselects its newest vintage, so
    // the "no vintage" case only exists before any wine is chosen.
    fireEvent.submit(container.querySelector("form"));

    await waitFor(() => expect(winePackageItemsApi.create).not.toHaveBeenCalled());
    expect(
      screen.getByText(
        /Pick a wine and a vintage, or mark the line as not in the catalogue yet/i,
      ),
    ).toBeTruthy();
  });

  it("submits the selected vintage with the line", async () => {
    const { container } = renderForm();

    // The vintage select is only rendered once a wine is chosen, and the wine
    // select stays disabled until the catalogue arrives.
    await screen.findByRole("option", { name: /Grange/i });
    fireEvent.change(screen.getByLabelText(/^wine$/i), { target: { value: "1" } });

    fireEvent.change(await screen.findByLabelText(/^vintage$/i), {
      target: { value: "11" },
    });
    fireEvent.submit(container.querySelector("form"));

    await waitFor(() => expect(winePackageItemsApi.create).toHaveBeenCalled());
    const payload = winePackageItemsApi.create.mock.calls[0].at(-1);
    expect(payload).toMatchObject({ vintage_id: 11, review_requested: true });
    expect(winePackageItemsApi.create.mock.calls[0][0]).toBe(7);
  });

  it("allows adding a vintage to a wine already in the catalogue", async () => {
    renderForm();

    await screen.findByRole("option", { name: /Grange/i });
    fireEvent.change(screen.getByLabelText(/^wine$/i), { target: { value: "1" } });

    // The inline panel replaces the line form and posts its own request.
    fireEvent.click(await screen.findByRole("button", { name: /add a vintage/i }));

    fireEvent.change(await screen.findByLabelText(/^year$/i), {
      target: { value: "2021" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /^add vintage$/i }).closest("form"),
    );

    await waitFor(() => expect(vintagesApi.create).toHaveBeenCalled());
    expect(vintagesApi.create).toHaveBeenCalledWith("grange", {
      year: 2021,
      no_vintage: false,
    });
  });

  it("allows creating a wine that is not in the catalogue yet", async () => {
    renderForm();

    await screen.findByRole("option", { name: /Grange/i });

    fireEvent.click(await screen.findByRole("button", { name: /add a new wine/i }));

    const name = await screen.findByLabelText(/wine name/i);
    fireEvent.change(name, { target: { value: "New Wine" } });
    fireEvent.submit(name.closest("form"));

    await waitFor(() => expect(winesApi.create).toHaveBeenCalled());

    const payload = winesApi.create.mock.calls[0][0];
    // The producer is pre-filled from the package and locked in the form.
    expect(payload).toMatchObject({ name: "New Wine", producer_id: 3 });
    // The wine and its first vintage are created in one request.
    expect(payload.vintages_attributes).toHaveLength(1);
  });

  it("saves a line marked as not in the catalogue yet without a vintage", async () => {
    renderForm();

    await screen.findByRole("option", { name: /Grange/i });

    fireEvent.click(screen.getByLabelText(/not in the catalogue yet/i));
    fireEvent.submit(screen.getByRole("button", { name: /add line/i }).closest("form"));

    await waitFor(() => expect(winePackageItemsApi.create).toHaveBeenCalled());
    expect(winePackageItemsApi.create.mock.calls[0][0]).toBe(7);
    expect(winePackageItemsApi.create.mock.calls[0][1]).toMatchObject({
      vintage_id: null,
    });
  });
});