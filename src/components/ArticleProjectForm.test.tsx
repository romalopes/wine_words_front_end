import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { ApiError } from "../services/ApiError"
import ArticleProjectForm from "./ArticleProjectForm"

const create = vi.fn()
const lookup = vi.fn()

vi.mock("../services/api", () => ({
  articleProjectsApi: {
    create: (...args: unknown[]) => create(...args),
    lookup: (...args: unknown[]) => lookup(...args),
  },
}))

function renderForm() {
  return render(<MemoryRouter><ArticleProjectForm /></MemoryRouter>)
}

describe("ArticleProjectForm", () => {
  beforeEach(() => {
    create.mockReset()
    lookup.mockReset()
  })

  it("prevents duplicate picker links and builds the nested write payload", async () => {
    const user = userEvent.setup()
    lookup.mockResolvedValue([{ id: 4, name: "Piedmont Estate", slug: "piedmont-estate" }])
    create.mockResolvedValue({ id: 22 })
    renderForm()

    await user.type(screen.getByLabelText("Name"), "Piedmont feature")
    const producerSearch = screen.getByLabelText("Producer search")
    await user.type(producerSearch, "Pie")
    await user.click(await screen.findByRole("button", { name: "Add Piedmont Estate" }))
    await user.clear(producerSearch)
    await user.type(producerSearch, "Pie")
    await waitFor(() => expect(lookup).toHaveBeenCalledTimes(2))
    expect(screen.queryByRole("button", { name: "Add Piedmont Estate" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("checkbox", { name: /Contacted/i }))
    await user.click(screen.getByRole("button", { name: "Create Article Project" }))

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      name: "Piedmont feature",
      article_project_producers_attributes: [{ producer_id: 4, contacted: true, request_confirmed: false, notes: null }],
      article_project_vintages_attributes: [],
      article_project_reviews_attributes: [],
    }))
  })

  it("keeps form values and offers reload after an optimistic-lock conflict", async () => {
    const user = userEvent.setup()
    create.mockRejectedValue(new ApiError("Article project has changed. Reload and try again.", 409, {}))
    renderForm()
    const name = screen.getByLabelText("Name")
    await user.type(name, "Conflict-safe project")
    await user.click(screen.getByRole("button", { name: "Create Article Project" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Article project has changed")
    expect(screen.getByRole("button", { name: "Reload server version" })).toBeInTheDocument()
    expect(name).toHaveValue("Conflict-safe project")
  })
})