import { runCheck } from "./healthRunner";
import type { ApiCheck } from "./apiHealthConfig";

const emailCheck: ApiCheck = {
  id: "email-send-test",
  category: "Email Diagnostics",
  name: "Send Test E-mail",
  method: "POST",
  url: "/health/email/test",
  expectedStatus: 200,
  requiresAuth: true,
};

describe("runCheck", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards a supplied JSON body to authenticated POST checks", async () => {
    const body = JSON.stringify({
      to: "ops@example.com",
      content: "Email delivery diagnostic",
      subject: "Test message",
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "delivered" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      runCheck(emailCheck, { getAuthToken: () => "test-token", body }),
    ).resolves.toMatchObject({ passed: true, status: 200 });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/health\/email\/test$/),
      expect.objectContaining({
        method: "POST",
        body,
        headers: expect.objectContaining({
          Accept: "application/json",
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        }),
      }),
    );
  });
});