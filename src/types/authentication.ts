export interface User {
  id: number
  user_name?: string | null
  first_name?: string | null
  last_name?: string | null
  email: string
  admin?: boolean
  roles?: string[]
  subscription_id?: number | null
  [key: string]: unknown
}

export interface SignInPayload {
  email: string
  password: string
}

export interface SignUpPayload {
  email: string
  password: string
  password_confirmation: string
  user_name?: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  reset_password_token: string
  password: string
  password_confirmation: string
}

export interface SocialSignInInput {
  credential: string
  nonce?: string
}

export interface AuthResponse {
  user: User
  token?: string
  [key: string]: unknown
}

export interface Identity {
  id: number
  provider: string
  email?: string | null
  user_name?: string | null
  created_at?: string | null
  [key: string]: unknown
}
