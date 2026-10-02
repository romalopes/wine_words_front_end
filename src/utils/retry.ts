import { errorStatus } from "./errors"

const DEFAULT_DELAY_MS = 400

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * True for failures the dev server can produce before it is fully ready:
 * a 404 means Rails answered while its routes were still being drawn (the
 * routes-reload window on the first requests after `rails s`), and a fetch
 * TypeError means the connection failed outright (server still booting).
 * 401/403/500 are real answers and must surface immediately.
 */
function isTransientBootFailure(error: unknown): boolean {
  return errorStatus(error) === 404 || error instanceof TypeError
}

/**
 * Run `fn` once; if it fails with a transient boot failure, wait `delayMs`
 * and try exactly once more. Any other error — and a second failure — is
 * rethrown unchanged.
 *
 * Used by probes that must exist on a healthy server (categories list/counts,
 * the test-access check): without a retry a boot-race 404 leaves the nav
 * dropdowns empty until the user manually reloads the page, because the
 * callers deliberately swallow these errors.
 */
export async function retryOnce<T>(
  fn: () => Promise<T>,
  {
    delayMs = DEFAULT_DELAY_MS,
    isTransient = isTransientBootFailure,
  }: {
    delayMs?: number
    isTransient?: (error: unknown) => boolean
  } = {},
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (!isTransient(error)) throw error
    await wait(delayMs)
    return fn()
  }
}
