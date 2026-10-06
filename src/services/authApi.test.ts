import { createAuthApi } from "./authApi";
import type { ApiRequester } from "./apiClient";

it("sends signup names as account fields with email and password", async () => {
  const request = vi.fn().mockResolvedValue({});
  const api = createAuthApi(request as ApiRequester);
  await api.signUp({ email: "name@example.com", password: "password123", password_confirmation: "password123", first_name: "First", last_name: "Last" });
  expect(request).toHaveBeenCalledWith("/auth/sign_up", {
    method: "POST", body: { user: { email: "name@example.com", password: "password123", password_confirmation: "password123", first_name: "First", last_name: "Last" } },
  });
});
