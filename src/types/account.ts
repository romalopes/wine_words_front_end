// Account settings. These mirror `Api::V1::AccountsController#account_json`,
// which is deliberately a *narrow* payload — not the `User` serializer. It
// omits `id` and `email` and never nests a `User` object, so `Account` is
// declared standalone rather than extending `User`.

/**
 * The account's postal address, as returned by the API.
 *
 * The controller builds this object only when the account row is persisted
 * *and* has an address; otherwise it emits `null`. Every field is nullable
 * because `AccountAddress` allows nil for all of them.
 */
export interface AccountAddress {
  street_address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  /** Rails foreign key — an integer id, or null when no country is set. */
  country_id: number | null
}

/** GET /api/v1/account — the current user's account with a nested address. */
export interface Account {
  user_name: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  /** Bare ISO date ("1990-05-04"), or null. */
  date_of_birth: string | null
  /** Null until the account row and its address have been saved. */
  address: AccountAddress | null
}

export interface PasswordChange {
  current_password: string
  password: string
  password_confirmation: string
}

/**
 * PATCH /api/v1/account. The controller treats a *present* `user_name` as a
 * username change (`params.key?`), so every field is optional.
 */
export interface AccountUpdate {
  user_name?: string
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  date_of_birth?: string | null
  address?: {
    street_address: string | null
    city: string | null
    state: string | null
    postal_code: string | null
    country_id: string | number | null
  }
}
