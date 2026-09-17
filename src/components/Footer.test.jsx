import { render, screen } from "@testing-library/react";
import Footer from "./Footer.jsx";
import { APP_VERSION } from "../constants/versions.js";

describe("Footer", () => {
  it("renders the footer", () => {
    render(<Footer />);
    // The footer contains "Wine Words" and a version string. Query the
    // landmark via its role so the assertion matches the whole footer instead
    // of every ancestor whose textContent happens to include "Wine Words".
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent("Wine Words");
  });

  it("displays the application version", () => {
    render(<Footer />);
    expect(screen.getByText(`Version ${APP_VERSION}`)).toBeInTheDocument();
  });

  it("gets the version from APP_VERSION, not a hardcoded string", () => {
    render(<Footer />);
    const versionText = screen.getByText(/Version \d+\.\d+\.\d+/);
    expect(versionText).toHaveTextContent(APP_VERSION);
  });
});
