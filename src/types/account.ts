import type { User } from "./authentication"

export interface Account extends Partial<User> {
  id: number
  email: string
}

export interface PasswordChange {
  current_password: string
  password: string
  password_confirmation: string
}

export interface AccountUpdate {
  user_name?: string
  first_name?: string
  last_name?: string
}
