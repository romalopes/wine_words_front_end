export interface WineProfile {
  id?: number
  slug: string
  user_id?: number | null
  name?: string | null
  grapes?: unknown[]
  regions?: unknown[]
  color?: string | null
  notes?: string | null
  serving?: string | null
  parameters?: Record<string, number>
  [key: string]: unknown
}

export interface LogEntry {
  id?: number | string
  timestamp?: string | null
  level?: string | null
  message?: string | null
  [key: string]: unknown
}

import type { User } from "./authentication"

export interface ImpersonationResponse {
  token: string
  impersonating: boolean
  effective_user: User
  real_user: User | null
}

