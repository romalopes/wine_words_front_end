import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import AboutPage from "./about/AboutPage";

function renderAboutPage() {
  return render(
    <MemoryRouter>
      <AboutPage />
    </MemoryRouter>,
  );
}

describe("AboutPage", () => {
  it("renders the hero content", () => {
    renderAboutPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Wine Words" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Curiosity matters more than jargon/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Browse Reviews" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "Read Articles" }),
    ).toBeInTheDocument();
  });

  it("renders the tablist with all six tabs", () => {
    renderAboutPage();

    const tablist = screen.getByRole("tablist");
    expect(tablist).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(6);
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "About",
      "Meet Kasia",
      "Philosophy",
      "Content",
      "Credentials",
      "Trade",
    ]);
  });

  it("shows the About panel by default and hides the others", () => {
    renderAboutPage();

    expect(screen.getByRole("tabpanel")).toHaveTextContent("Our Mission");
    expect(screen.queryByText("Professional Journey")).not.toBeInTheDocument();
  });

  it("switches panels when a tab is clicked without changing the URL", async () => {
    const user = userEvent.setup();
    renderAboutPage();

    await user.click(screen.getByRole("tab", { name: "Meet Kasia" }));

    const panel = screen.getByRole("tabpanel", { name: "Meet Kasia" });
    expect(panel).toBeInTheDocument();
    expect(screen.getByText(/My Wine Adviser/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /timeline/i })).toBeInTheDocument();

    // The URL never changes when switching tabs.
    expect(window.location.pathname).toBe("/");
  });

  it("moves to the next tab with the ArrowRight key", async () => {
    const user = userEvent.setup();
    renderAboutPage();

    const firstTab = screen.getByRole("tab", { name: "About" });
    firstTab.focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "Meet Kasia" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(firstTab).toHaveAttribute("aria-selected", "false");
  });

  it("shows the trade submission workflow and editorial policy on the Trade tab", async () => {
    const user = userEvent.setup();
    renderAboutPage();

    await user.click(screen.getByRole("tab", { name: "Trade" }));

    expect(
      screen.getByRole("img", { name: /submission workflow/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Editorial Independence")).toBeInTheDocument();
    expect(screen.getByText("trade@wine-words.com.au")).toBeInTheDocument();
  });

  it("shows the footer CTA at all times", () => {
    renderAboutPage();

    expect(screen.getByText("Join Wine Words")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Browse Reviews" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "Create Free Account" }),
    ).toHaveAttribute("href", "/login");
  });
});
