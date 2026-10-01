// Test setup for Vitest. Registered as `setupFiles` in vite.config.js, so it
// runs once before every test file.
import "@testing-library/jest-dom"
import { vi } from "vitest"

// jsdom does not implement scrollIntoView, so any component that scrolls an
// element into view throws. Components here call it to follow a #hash deep link
// (see CommentSection), so stub it once globally rather than per test file.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn()
}

