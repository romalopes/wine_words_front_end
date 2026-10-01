import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import CommentLink from "./CommentLink"

describe("CommentLink", () => {
  it.each([
    ["wine" as const, "chateau-x", "/wines/chateau-x#comments"],
    ["review" as const, "my-review", "/reviews/my-review#comments"],
    ["article" as const, "my-article", "/articles/my-article#comments"],
  ])("points a %s card at its detail page's comment anchor", (kind, identifier, href) => {
    render(
      <MemoryRouter>
        <CommentLink kind={kind} identifier={identifier} />
      </MemoryRouter>,
    )
    expect(screen.getByRole("link", { name: /comments/i })).toHaveAttribute("href", href)
  })

  it("renders nothing without an identifier", () => {
    const { container } = render(
      <MemoryRouter>
        <CommentLink kind="wine" identifier={null} />
      </MemoryRouter>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("does not let the click reach the card's own click handler", async () => {
    const onCardClick = vi.fn()
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        {/* Mirrors the real card: a clickable wrapper containing the link. */}
        <div onClick={onCardClick}>
          <CommentLink kind="wine" identifier="chateau-x" />
        </div>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("link", { name: /comments/i }))
    // The link navigated on its own; the card's handler must not also fire, or
    // the user would land on the detail page WITHOUT the #comments anchor.
    expect(onCardClick).not.toHaveBeenCalled()
  })

  it("carries the listing path so the Back link returns to the right page", () => {
    render(
      <MemoryRouter>
        <CommentLink kind="wine" identifier="chateau-x" returnTo="/wines?page=3" />
      </MemoryRouter>,
    )
    expect(screen.getByRole("link", { name: /comments/i }).getAttribute("href")).toContain(
      "returnTo=%2Fwines%3Fpage%3D3",
    )
  })
})