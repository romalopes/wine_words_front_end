import { createArticleProjectsApi } from "./articleProjectsApi"
import type { ApiRequester } from "./apiClient"

describe("createArticleProjectsApi", () => {
  const request = vi.fn() as unknown as ApiRequester
  const api = createArticleProjectsApi(request)

  beforeEach(() => {
    vi.mocked(request).mockReset()
  })

  it("uses the renamed authenticated list endpoint and serializes filters", async () => {
    vi.mocked(request).mockResolvedValueOnce([])

    await api.list({ page: 2, per_page: 20, query: "Barolo", overdue: true })

    expect(request).toHaveBeenCalledWith(
      "/article_projects?page=2&per_page=20&query=Barolo&overdue=true",
      { auth: true },
    )
  })

  it("wraps writes in the article_project payload key", async () => {
    vi.mocked(request).mockResolvedValueOnce({ id: 7, name: "Piedmont feature" })

    await api.create({
      name: "Piedmont feature",
      article_project_producers_attributes: [{ producer_id: 2, contacted: true }],
    })

    expect(request).toHaveBeenCalledWith("/article_projects", {
      method: "POST",
      auth: true,
      body: {
        article_project: {
          name: "Piedmont feature",
          article_project_producers_attributes: [{ producer_id: 2, contacted: true }],
        },
      },
    })
  })

  it("uses the authenticated compact lookup endpoint for form pickers", async () => {
    vi.mocked(request).mockResolvedValueOnce([])

    await api.lookup("vintage", "Barolo", 12)

    expect(request).toHaveBeenCalledWith(
      "/article_projects/lookup?kind=vintage&q=Barolo&producer_id=12",
      { auth: true },
    )
  })
})