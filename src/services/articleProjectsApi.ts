import type { ArticleProjectsApi } from "../types/api"
import type { ArticleProject, ArticleProjectDetail, ArticleProjectLookupItem, ArticleProjectLookupKind } from "../types/articleProject"
import type { QueryParams, ResourceResponse } from "../types/common"
import type { ApiRequester } from "./apiClient"
import { buildQuery } from "./apiClient"

function queryPath(params?: QueryParams): string {
  return `/article_projects${buildQuery(params ?? {})}`
}

export function createArticleProjectsApi(request: ApiRequester): ArticleProjectsApi {
  return {
    list(params) {
      return request<ResourceResponse<ArticleProject>>(queryPath(params), { auth: true })
    },
    show(id) {
      return request<ArticleProjectDetail>(`/article_projects/${id}`, { auth: true })
    },
    lookup(kind: ArticleProjectLookupKind, query: string, producerId?: number) {
      return request<ArticleProjectLookupItem[]>(`/article_projects/lookup${buildQuery({ kind, q: query, producer_id: producerId })}`, { auth: true })
    },
    create(payload) {
      return request<ArticleProject>("/article_projects", {
        method: "POST",
        auth: true,
        body: { article_project: payload as Record<string, never> },
      })
    },
    update(id, payload) {
      return request<ArticleProject>(`/article_projects/${id}`, {
        method: "PATCH",
        auth: true,
        body: { article_project: payload as Record<string, never> },
      })
    },
    destroy(id) {
      return request(`/article_projects/${id}`, { method: "DELETE", auth: true })
    },
  }
}