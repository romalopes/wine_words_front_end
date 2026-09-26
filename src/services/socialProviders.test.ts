// Tests for the Google Identity Services reason → error mapping in
// socialProviders.ts. The GSI SDK itself is faked: the "script load" is
// resolved by intercepting the <script> injection, and a fake
// `google.accounts.id` object records the notification listener so each test
// can replay a prompt moment (not-displayed reason) synchronously.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { GooglePromptMoment, GoogleSdk } from "../types/socialAuth";
import {
  ProviderCancelledError,
  ProviderConfigurationError,
  signInWithGoogle,
} from "./socialProviders";

/** The prompt-moment state a given test wants to simulate. */
interface NotificationFixture {
  notDisplayed?: boolean;
  reason?: string;
  skipped?: boolean;
}

function fakeNotification({
  notDisplayed,
  reason,
  skipped,
}: NotificationFixture): GooglePromptMoment {
  return {
    isNotDisplayed: () => Boolean(notDisplayed),
    getNotDisplayedReason: () => reason,
    isSkippedMoment: () => Boolean(skipped),
    isDismissedMoment: () => false,
  };
}

let promptListener: ((notification: GooglePromptMoment) => void) | null;

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test-client-id.apps.googleusercontent.com");

  // Resolve the injected GSI <script> immediately — jsdom never fetches it.
  vi.spyOn(document.head, "appendChild").mockImplementation((element) => {
    (element as HTMLScriptElement).dataset.loaded = "true";
    setTimeout(() => element.dispatchEvent(new Event("load")), 0);
    return element;
  });

  promptListener = null;
  const fakeGoogle: GoogleSdk = {
    accounts: {
      id: {
        initialize: vi.fn(),
        prompt: vi.fn((listener) => {
          promptListener = listener;
        }),
      },
    },
  };
  window.google = fakeGoogle;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  delete window.google;
});

function promptWith(notification: GooglePromptMoment) {
  const promise = signInWithGoogle();
  setTimeout(() => promptListener?.(notification), 0);
  return promise;
}

describe("signInWithGoogle prompt-moment handling", () => {
  it("surfaces unregistered_origin as a configuration error", async () => {
    await expect(
      promptWith(fakeNotification({ notDisplayed: true, reason: "unregistered_origin" })),
    ).rejects.toBeInstanceOf(ProviderConfigurationError);
    await expect(
      promptWith(fakeNotification({ notDisplayed: true, reason: "unregistered_origin" })),
    ).rejects.toThrow(/Authorized JavaScript origins/);
  });

  it("surfaces invalid_client as a configuration error", async () => {
    await expect(
      promptWith(fakeNotification({ notDisplayed: true, reason: "invalid_client" })),
    ).rejects.toThrow(ProviderConfigurationError);
  });

  it("surfaces missing_client_id as a configuration error", async () => {
    await expect(
      promptWith(fakeNotification({ notDisplayed: true, reason: "missing_client_id" })),
    ).rejects.toThrow(ProviderConfigurationError);
  });

  it("stays silent (cancelled) for non-configuration not-displayed reasons", async () => {
    await expect(
      promptWith(fakeNotification({ notDisplayed: true, reason: "suppressed_by_user" })),
    ).rejects.toBeInstanceOf(ProviderCancelledError);
  });

  it("stays silent (cancelled) for skipped moments", async () => {
    await expect(
      promptWith(fakeNotification({ skipped: true })),
    ).rejects.toBeInstanceOf(ProviderCancelledError);
  });

  it("passes the configured client id to GSI initialize", async () => {
    const promise = signInWithGoogle();
    setTimeout(() => promptListener?.(fakeNotification({ skipped: true })), 0);
    await expect(promise).rejects.toBeInstanceOf(ProviderCancelledError);
    const google = window.google;
    if (!google) throw new Error("the GSI fake was not installed");
    expect(google.accounts.id.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: "test-client-id.apps.googleusercontent.com" }),
    );
  });
});
