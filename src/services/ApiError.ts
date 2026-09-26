export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly data: unknown

  constructor(message: string, status: number, data: unknown, code?: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.data = data
    if (code !== undefined) this.code = code
  }
}
