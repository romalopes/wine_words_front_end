import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import ArticleProjectDetail from "./ArticleProjectDetail"

const show = vi.fn()
const destroy = vi.fn()

vi.mock("../services/api", () => ({
  articleProjectsApi: {
    show: (...args: unknown[]) => show(...args),
    destroy: (...args: unknown[]) => destroy(...args),
  },
}))
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: 4, roles: ["Reviewer"] } }),
}))
vi.mock("./ArticleProjectForm", () => ({ default: () => <p>Article Project form</p> }))

const project = {
  id: 9, name: "Barolo feature", publication: "Wine Journal", editor_name: null, editor_email: null,
  project_status: "planning", drafting_status: "initiated", deadline: null, target_word_count: 1200,
  overdue: false, lock_version: 0, created_by: { id: 4, display_name: "Reviewer" }, counts: { total: 0, requested: 0, received: 0, selected: 0, tasted: 0 },
  description: null, actual_word_count: null, word_count_remaining: null, created_at: null, updated_at: null,
  article: null, article_project_producers: [], article_project_vintages: [], article_project_reviews: [],
}

function renderAt(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/article-projects/:id" element={<ArticleProjectDetail />} /><Route path="/article-projects/:id/edit" element={<ArticleProjectDetail />} /><Route path="/article-projects" element={<p>Article Project list</p>} /></Routes></MemoryRouter>)
}

describe("ArticleProjectDetail", () => {
  beforeEach(() => { show.mockReset(); destroy.mockReset(); show.mockResolvedValue(project) })

  it("opens edit mode directly from the edit route", async () => {
    renderAt("/article-projects/9/edit")
    expect(await screen.findByText("Article Project form")).toBeInTheDocument()
  })

  it("switches to edit mode after clicking the Edit button", async () => {
    const user = userEvent.setup()
    renderAt("/article-projects/9")

    await user.click(await screen.findByRole("button", { name: "Edit Article Project" }))

    expect(await screen.findByText("Article Project form")).toBeInTheDocument()
  })

  it("confirms deletion, calls the API, and redirects to the list", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true)
    const user = userEvent.setup()
    destroy.mockResolvedValue(undefined)
    renderAt("/article-projects/9")
    await user.click(await screen.findByRole("button", { name: "Delete Article Project" }))
    await waitFor(() => expect(destroy).toHaveBeenCalledWith(9))
    expect(confirm).toHaveBeenCalled()
    expect(await screen.findByText("Article Project list")).toBeInTheDocument()
    confirm.mockRestore()
  })
})