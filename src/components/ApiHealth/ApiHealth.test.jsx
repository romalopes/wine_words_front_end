import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ApiHealth from "./ApiHealth.jsx";
import { APP_VERSION } from "../../constants/versions.js";
import { API_CHECKS } from "../../services/apiHealth/apiHealthConfig.js";

// Mock the health runner so the component receives canned results instead of
// making real HTTP requests. `runWriteFlow` must be present too: the component
// imports it, and Vitest throws when a mocked module is missing a named export
// the importer asks for.
const mockRunCheck = vi.fn();
const mockRunWriteFlow = vi.fn();

vi.mock("../../services/apiHealth/healthRunner.js", () => ({
  runCheck: (...args) => mockRunCheck(...args),
  runWriteFlow: (...args) => mockRunWriteFlow(...args),
}));

// Mock the token getter so no real localStorage/network is touched.
vi.mock("../../services/api.js", () => ({
  getAuthToken: () => "fake-token",
}));

// Mock the auth context so the component doesn't try to talk to a real API.
// The user must be an Admin, otherwise the component renders the
// "no permission" message instead of the diagnostics UI.
vi.mock("../../contexts/AuthContext.jsx", () => ({
  useAuth: () => ({
    user: { id: 1, email: "admin@example.com", roles: ["Admin"] },
    isAuthenticated: true,
    loading: false,
  }),
}));

// The detailed check result is keyed by check id "system-detailed".
const detailedResult = {
  id: "system-detailed",
  name: "Detailed Infrastructure Health",
  category: "System",
  passed: true,
  status: 200,
  expectedStatus: 200,
  latencyMs: 120,
  latencyRating: "excellent",
  payload: { status: "ok", version: "0.0.20", service: "wine-api" },
  requestHeaders: {},
  error: null,
  retried: false,
};

const mismatchResult = {
  ...detailedResult,
  payload: { status: "ok", version: "0.0.19", service: "wine-api" },
};

// Locate the "Test" button that belongs to a given check row. Each row renders
// the check name and its action buttons inside the same `div[class*='row']`
// element, so we pick the button whose row text contains the check name. This
// avoids depending on DOM order or on the exact CSS-module class hashes.
function testButtonFor(checkName) {
  const buttons = screen.getAllByRole("button", { name: /^Test$/i });
  const button = buttons.find((b) =>
    b.closest("div[class*='row']")?.textContent?.includes(checkName),
  );
  if (!button) throw new Error(`No Test button found for "${checkName}"`);
  return button;
}

describe("ApiHealth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the health interface heading", () => {
    render(<ApiHealth />);
    expect(
      screen.getByRole("heading", { name: /API Health/i })
    ).toBeInTheDocument();
  });

  it("displays the backend/API version from the detailed check payload", async () => {
    mockRunCheck.mockResolvedValueOnce(detailedResult);

    render(<ApiHealth />);

    await userEvent.click(testButtonFor("Detailed Infrastructure Health"));

    // The backend version should appear in the version notice.
    await waitFor(() => {
      expect(screen.getByText(/backend 0\.0\.20/i)).toBeInTheDocument();
    });

    // The runner must be handed a token getter that reads the *persisted*
    // token, not a value from React state.
    const [, options] = mockRunCheck.mock.calls[0];
    expect(options.getAuthToken()).toBe("fake-token");
  });

  it("displays backend version 0.0.19 when the API reports 0.0.19, even though React is 0.0.20", async () => {
    mockRunCheck.mockResolvedValueOnce(mismatchResult);

    render(<ApiHealth />);

    await userEvent.click(testButtonFor("Detailed Infrastructure Health"));

    // Wait for the async update — the backend version must come from the API
    // response (0.0.19), not from APP_VERSION (0.0.20).
    await waitFor(() => {
      expect(
        screen.getByText(
          /Version mismatch: backend reports 0\.0\.19 but frontend expects 0\.0\.20/i
        )
      ).toBeInTheDocument();
    });

    // The header meta renders the backend version inside a <code> element.
    expect(screen.getByText("0.0.19", { selector: "code" })).toBeInTheDocument();

    // It must not claim the backend is on the frontend's version.
    expect(
      screen.queryByText(/Version match: backend 0\.0\.20/i)
    ).not.toBeInTheDocument();
  });

  it("the version match check validates against APP_VERSION", () => {
    const versionCheck = API_CHECKS.find((c) => c.id === "system-version-match");
    expect(versionCheck).toBeDefined();
    expect(versionCheck.validate({ version: APP_VERSION })).toBe(true);
    expect(versionCheck.validate({ version: "0.0.19" })).toBe(false);
  });
});
