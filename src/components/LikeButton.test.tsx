import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import LikeButton from "./LikeButton"
import { likesApi } from "../services/api"

vi.mock("../services/api", () => ({
  likesApi: { toggle: vi.fn() },
}))

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}))

describe("LikeButton", () => {
  beforeEach(() => {
    vi.mocked(likesApi.toggle).mockReset()
  })

  it("renders the server-provided count and liked state", () => {
    render(
      <MemoryRouter>
        <LikeButton kind="wine" identifier="some-wine" initialLiked initialCount={27} />
      </MemoryRouter>,
    )
    expect(screen.getByRole("button", { name: /Unlike \(27 likes\)/ })).toBeInTheDocument()
  })

  it("updates from the API response (server truth) on toggle", async () => {
    vi.mocked(likesApi.toggle).mockResolvedValue({ liked: true, likes_count: 28 })
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LikeButton kind="wine" identifier="some-wine" initialLiked={false} initialCount={27} />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: /Like \(27 likes\)/ }))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Unlike \(28 likes\)/ })).toBeInTheDocument()
    })
    expect(likesApi.toggle).toHaveBeenCalledWith("wine", "some-wine", false)
  })

  it("keeps the previous state when the request fails", async () => {
    vi.mocked(likesApi.toggle).mockRejectedValue(new Error("network down"))
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LikeButton kind="review" identifier="some-review" initialLiked={false} initialCount={5} />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: /Like \(5 likes\)/ }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/network down/)
    })
    // Count and label roll back to the pre-click values.
    expect(screen.getByRole("button", { name: /Like \(5 likes\)/ })).toBeInTheDocument()
  })
})
