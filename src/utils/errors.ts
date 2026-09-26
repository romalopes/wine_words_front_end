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
