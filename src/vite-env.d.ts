/// <reference types="vite/client" />
/// <reference types="vitest" />
/// <reference types="vitest/globals" />

import type {
  AppleSdk,
  FacebookSdk,
  GoogleSdk,
  MsalSdk,
} from "./types/socialAuth"

declare global {
  /**
   * Each social SDK is loaded on demand from its own CDN and installs its own
   * global. They are declared here (rather than cast at each use site) so
   * `waitForGlobal` can resolve them by name. Every one of them is optional:
   * the script has not loaded until the corresponding sign-in is attempted.
   */
  interface Window {
    google?: GoogleSdk
    AppleID?: AppleSdk
    msal?: MsalSdk
    FB?: FacebookSdk
  }
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_APPLE_CLIENT_ID?: string
  readonly VITE_APPLE_REDIRECT_URI?: string
  readonly VITE_MICROSOFT_CLIENT_ID?: string
  readonly VITE_MICROSOFT_TENANT_ID?: string
  readonly VITE_FACEBOOK_APP_ID?: string
  readonly VITE_FACEBOOK_GRAPH_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

export {}

