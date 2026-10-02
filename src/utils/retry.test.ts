import { ApiError } from "../services/ApiError"
import { retryOnce } from "./retry"

const notFound = () => new ApiError("missing", 404, {})
const unauthorized = () => new ApiError("Test access required", 401, {})

describe("retryOnce", () => {
  it("resolves the first success without a second call", async () => {
    const fn = vi.fn().mockResolvedValue("ok")

    await expect(retryOnce(fn, { delayMs: 0 })).resolves.toBe("ok")
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("retries once after a boot-race 404 and resolves", async () => {
    const fn = vi.fn().mockRejectedValueOnce(notFound()).mockResolvedValueOnce("ok")

    await expect(retryOnce(fn, { delayMs: 0 })).resolves.toBe("ok")
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it("retries once after a network TypeError and resolves", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce("ok")

    await expect(retryOnce(fn, { delayMs: 0 })).resolves.toBe("ok")
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it("fails fast on non-transient statuses such as 401", async () => {
    const fn = vi.fn().mockRejectedValue(unauthorized())

    await expect(retryOnce(fn, { delayMs: 0 })).rejects.toThrow("Test access required")
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("propagates a second transient failure after exactly one retry", async () => {
    const fn = vi.fn().mockRejectedValue(notFound())

    await expect(retryOnce(fn, { delayMs: 0 })).rejects.toThrow("missing")
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
