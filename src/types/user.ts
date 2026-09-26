/**
 * A *user-authored* tasting profile (`/wine_profiles`), distinct from the
 * static finder catalogue in `types/wineFinder.ts`. Deliberately not named
 * `WineProfile`, which is the catalogue's type.
 *
 * NOTE the `parameters` asymmetry with `Wine`: a profile serialises its
 * parameters as a Record of `{ [tasteParameterSlug]: score }` (see
 * `WineProfileSerializer#parameters`), whereas `WineSerializer#parameters`
 * returns an **array** of `{ taste_parameter_slug, score }`. Code that consumes
 * both must normalise — `src/components/Quiz.tsx#toScoreMap` does exactly that.
 */
export interface UserWineProfile {
  id?: number
  slug: string
  user_id?: number | null
  name?: string | null
  /** JSON text column — a list of grape names. */
  grapes?: string[]
  /** JSON text column — a list of region names. */
  regions?: string[]
  color?: string | null
  /** Free-text tasting note (a single string, not a list). */
  notes?: string | null
  serving?: string | null
  /** `{ acidity: 4, body: 2, ... }` — keyed by taste-parameter slug. */
  parameters?: Record<string, number>
}

export interface LogEntry {
  id?: number | string
  timestamp?: string | null
  level?: string | null
  message?: string | null
  [key: string]: unknown
}

import type { Paginated } from "./common"
import type { User } from "./authentication"

/**
 * A user row as the admin endpoints render it (`users#search`, `assign_roles`,
 * `assign_subscription`). Distinct from the `User` shape used for auth/`me`:
 * this one carries the numeric `role_ids` an admin's role checkboxes need and
 * an embedded subscription summary. See `users_controller#user_json`.
 */
export interface AdminUser {
  id: number
  email: string
  user_name: string | null
  /** Numeric role ids currently assigned — drives the role checkboxes. */
  role_ids: number[]
  /** Human-readable role names, e.g. ["Admin", "Reader"]. */
  roles: string[]
  subscription: SubscriptionSummary | null
}

/** The `{ id, name }` subscription stub embedded in user payloads. */
export interface SubscriptionSummary {
  id: number
  name: string
}

/**
 * One entry from `GET /api/v1/roles` — the admin role picker. The `name` is
 * already translated by the API (`Role.names[...]`), so it is display-ready.
 */
export interface RoleOption {
  id: number
  name: string
}

/**
 * The paginated envelope `users#search` returns when given a `page`. Reuses the
 * shared `Paginated<T>` rather than redeclaring it.
 */
export type AdminUserResults = Paginated<AdminUser>

export interface ImpersonationResponse {
  token: string
  impersonating: boolean
  effective_user: User
  real_user: User | null
}

