import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { ApiError } from "../services/ApiError"
import ArticleProjectDetail from "./ArticleProjectDetail"

const show = vi.fn()
const destroy = vi.fn()
const createReviewFromNotebook = vi.fn()
const updateNotebook = vi.fn()

vi.mock("../services/api", () => ({
  articleProjectsApi: {
    show: (...args: unknown[]) => show(...args),
    destroy: (...args: unknown[]) => destroy(...args),
    createReviewFromNotebook: (...args: unknown[]) => createReviewFromNotebook(...args),
    updateNotebook: (...args: unknown[]) => updateNotebook(...args),
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
  beforeEach(() => { show.mockReset(); destroy.mockReset(); createReviewFromNotebook.mockReset(); updateNotebook.mockReset(); show.mockResolvedValue(project) })

  it("opens edit mode directly from the edit route", async () => {
    renderAt("/article-projects/9/edit")
    expect(await screen.findByText("Article Project form")).toBeInTheDocument()
  })

  it("switches to edit mode after clicking the Edit button", async () => {
    const user = userEvent.setup()
    renderAt("/article-projects/9?tab=wines-notes")

    await user.click(await screen.findByRole("button", { name: "Edit Article Project" }))

    expect(await screen.findByText("Article Project form")).toBeInTheDocument()
  })

  it("uses the tab query parameter and supports keyboard tab navigation", async () => {
    const user = userEvent.setup()
    renderAt("/article-projects/9?tab=article")

    const articleTab = await screen.findByRole("tab", { name: "Article" })
    expect(articleTab).toHaveAttribute("aria-selected", "true")
    expect(screen.getByText("No article is linked to this project yet.")).toBeInTheDocument()

    articleTab.focus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: "Wines & Notes" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByText("No wines linked.")).toBeInTheDocument()
  })

  it("confirms deletion, calls the API, and redirects to the list", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true)
    const user = userEvent.setup()
    destroy.mockResolvedValue(undefined)
    renderAt("/article-projects/9?tab=wines-notes")
    await user.click(await screen.findByRole("button", { name: "Delete Article Project" }))
    await waitFor(() => expect(destroy).toHaveBeenCalledWith(9))
    expect(confirm).toHaveBeenCalled()
    expect(await screen.findByText("Article Project list")).toBeInTheDocument()
    confirm.mockRestore()
  })

  it("creates a draft review from a notebook in the existing detail page", async () => {
    const user = userEvent.setup()
    const projectWithNotebook = {
      ...project,
      counts: { ...project.counts, total: 1 },
      article_project_vintages: [{
        id: 14,
        vintage: { id: 8, display_name: "Barolo 2022", year: 2022, wine_name: "Barolo", wine_slug: "barolo", producer_id: 3 },
        requested: false, received: false, selected: false, tasted: true,
        date_received: null, bottle_condition: "not_assessed", notes: null,
        article_project_notebooks: [{ id: 25, title: "Tasting notes", content: "Rose and cherry", position: 0, lock_version: 0 }],
      }],
    }
    show.mockResolvedValue(projectWithNotebook)
    createReviewFromNotebook.mockResolvedValue({ id: 31, slug: "tasting-notes", title: "Tasting notes", status: "draft", vintage_id: 8, vintage_year: 2022, wine_name: "Barolo" })

    renderAt("/article-projects/9?tab=wines-notes")
    await user.click(await screen.findByRole("button", { name: "Create draft review" }))

    await waitFor(() => expect(createReviewFromNotebook).toHaveBeenCalledWith(9, 14, 25))
    expect(await screen.findByText("Edit draft review")).toBeInTheDocument()
  })

  it("retains notebook edits and offers reload after an optimistic-lock conflict", async () => {
    const user = userEvent.setup()
    const projectWithNotebook = {
      ...project,
      counts: { ...project.counts, total: 1 },
      article_project_vintages: [{
        id: 14,
        vintage: { id: 8, display_name: "Barolo 2022", year: 2022, wine_name: "Barolo", wine_slug: "barolo", producer_id: 3 },
        requested: false, received: false, selected: false, tasted: true,
        date_received: null, bottle_condition: "not_assessed", notes: null,
        article_project_notebooks: [{ id: 25, title: "Tasting notes", content: "Rose and cherry", position: 0, lock_version: 0 }],
      }],
    }
    show.mockResolvedValue(projectWithNotebook)
    updateNotebook.mockRejectedValue(new ApiError("Notebook has changed. Reload and try again.", 409, {}))

    renderAt("/article-projects/9?tab=wines-notes")
    await user.click(await screen.findByRole("button", { name: "Edit notebook" }))
    const title = screen.getByLabelText("Notebook title")
    await user.clear(title)
    await user.type(title, "Unsaved tasting notes")
    await user.click(screen.getByRole("button", { name: "Save notebook" }))

    expect(await screen.findByText("Your unsaved notebook changes are still here.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Reload notebook" })).toBeInTheDocument()
    expect(title).toHaveValue("Unsaved tasting notes")
    expect(updateNotebook).toHaveBeenCalledWith(9, 14, 25, expect.objectContaining({ lock_version: 0 }))
  })
})