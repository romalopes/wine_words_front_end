import { ApiError } from "../services/ApiError"

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string" && error) return error
  return fallback
}

export function errorStatus(error: unknown): number | null {
  if (error instanceof ApiError) return error.status
  if (error instanceof Error && "status" in error) {
    const status = (error as { status?: unknown }).status
    return typeof status === "number" ? status : null
  }
  return null
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/**
 * The parsed JSON body of a failed API response, when there is one. Always
 * returns an object so callers can probe optional flags without a null check.
 * Values are `unknown` — narrow them at the point of use.
 */
export function errorData(error: unknown): Record<string, unknown> {
  if (!(error instanceof ApiError)) return {}
  const { data } = error
  return data !== null && typeof data === "object"
    ? (data as Record<string, unknown>)
    : {}
}

/**
 * The human-readable failure text from an API error payload, or null.
 *
 * Rails validation failures come in three shapes across this API, so all are
 * normalised here rather than at each call site:
 *   `{ error: "..." }`                       — single message
 *   `{ errors: ["a", "b"] }`                 — flat list
 *   `{ errors: { name: ["can't be blank"] } }` — field => messages
 */
export function errorText(error: unknown): string | null {
  const data = errorData(error)
  const { error: message, errors } = data

  if (typeof message === "string" && message) return message

  if (Array.isArray(errors)) {
    const parts = errors.filter((entry): entry is string => typeof entry === "string")
    if (parts.length > 0) return parts.join(", ")
  }

  if (errors !== null && typeof errors === "object") {
    const parts = Object.values(errors).flatMap((entry) =>
      Array.isArray(entry) ? entry.filter((line): line is string => typeof line === "string") : [],
    )
    if (parts.length > 0) return parts.join(", ")
  }

  return null
}
