import type { ApiRequester } from "./apiClient"
import type {
  AuthApi,
  IdentitiesApi,
  IdentityListResponse,
  IdentityResponse,
  SocialProvider,
} from "../types/api"
import type {
  AuthResponse,
  ResetPasswordPayload,
  SignInPayload,
  SignUpPayload,
  SocialSignInInput,
} from "../types/authentication"

export type { ApiRequester } from "./apiClient"

export function createAuthApi(request: ApiRequester): AuthApi {
  return {
    signIn(payload: SignInPayload): Promise<AuthResponse> {
      return request<AuthResponse>("/auth/sign_in", {
        method: "POST",
        body: { user: { email: payload.email, password: payload.password } },
      })
    },

    signUp(payload: SignUpPayload): Promise<AuthResponse> {
      const user = {
        email: payload.email,
        password: payload.password,
        password_confirmation: payload.password_confirmation,
        ...(payload.user_name ? { user_name: payload.user_name } : {}),
      }

      return request<AuthResponse>("/auth/sign_up", {
        method: "POST",
        body: { user },
      })
    },

    signOut(): Promise<unknown> {
      return request("/auth/sign_out", { method: "DELETE", auth: true })
    },

    forgotPassword(email: string): Promise<unknown> {
      return request("/auth/password", {
        method: "POST",
        body: { user: { email } },
      })
    },

    resetPassword(payload: ResetPasswordPayload): Promise<AuthResponse> {
      return request<AuthResponse>("/auth/password", {
        method: "PATCH",
        body: {
          user: {
            reset_password_token: payload.reset_password_token,
            password: payload.password,
            password_confirmation: payload.password_confirmation,
          },
        },
      })
    },

    me(): Promise<AuthResponse> {
      return request<AuthResponse>("/me", { auth: true })
    },

    socialSignIn(
      provider: SocialProvider,
      payload: SocialSignInInput = { credential: "" },
    ): Promise<AuthResponse> {
      if (payload.nonce) {
        return request<AuthResponse>(`/auth/${provider}`, {
          method: "POST",
          body: { credential: payload.credential, nonce: payload.nonce },
        })
      }

      return request<AuthResponse>(`/auth/${provider}`, {
        method: "POST",
        body: { credential: payload.credential },
      })
    },
  }
}

export function createIdentitiesApi(request: ApiRequester): IdentitiesApi {
  return {
    list(): Promise<IdentityListResponse> {
      return request<IdentityListResponse>("/auth/identities", { auth: true })
    },

    connect(
      provider: SocialProvider,
      payload: SocialSignInInput = { credential: "" },
    ): Promise<IdentityResponse> {
      if (payload.nonce) {
        return request<IdentityResponse>(`/auth/identities/${provider}`, {
          method: "POST",
          auth: true,
          body: { credential: payload.credential, nonce: payload.nonce },
        })
      }

      return request<IdentityResponse>(`/auth/identities/${provider}`, {
        method: "POST",
        auth: true,
        body: { credential: payload.credential },
      })
    },

    disconnect(id: number): Promise<unknown> {
      return request(`/auth/identities/${id}`, {
        method: "DELETE",
        auth: true,
      })
    },
  }
}
