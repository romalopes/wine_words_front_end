import type { ResourceResponse } from "../types/common"
import type {
  CategoriesApi,
  CategoryCounts,
  CategoryDetail,
  CountriesApi,
  GrapesApi,
  RegionsApi,
  StatsApi,
  TasteParametersApi,
} from "../types/api"
import type { Category, Grape, TasteParameter } from "../types/catalog"
import type { Country, Region } from "../types/reference"
import type { Stats } from "../types/notification"
import type { ApiRequester } from "./apiClient"

export function createTasteParametersApi(request: ApiRequester): TasteParametersApi {
  return { list: () => request<TasteParameter[]>("/taste_parameters") }
}

export function createCategoriesApi(request: ApiRequester): CategoriesApi {
  return {
    list(type = null) {
      const params = new URLSearchParams()
      if (type) params.set("type", type)
      return request<ResourceResponse<Category>>(`/categories${params.toString() ? `?${params}` : ""}`)
    },
    show: (id) => request<CategoryDetail>(`/categories/${id}`, { auth: true }),
    counts: () => request<CategoryCounts>("/categories/counts"),
    create: (data) => request<Category>("/categories", { method: "POST", auth: true, body: { category: data as unknown as Record<string, never> } }),
    update: (id, data) => request<Category>(`/categories/${id}`, { method: "PATCH", auth: true, body: { category: data as unknown as Record<string, never> } }),
    remove: (id) => request(`/categories/${id}`, { method: "DELETE", auth: true }),
    reorder: (type, orderedIds) => request("/categories/reorder", { method: "PATCH", auth: true, body: { type, ordered_ids: orderedIds } }),
    linkWine: (id, wineId) => request<Category>(`/categories/${id}/link_wine`, { method: "POST", auth: true, body: { wine_id: wineId } }),
    linkProducer: (id, producerId) => request<Category>(`/categories/${id}/link_producer`, { method: "POST", auth: true, body: { producer_id: producerId } }),
    linkReview: (id, reviewId) => request<Category>(`/categories/${id}/link_review`, { method: "POST", auth: true, body: { review_id: reviewId } }),
    linkArticle: (id, articleId) => request<Category>(`/categories/${id}/link_article`, { method: "POST", auth: true, body: { article_id: articleId } }),
  }
}

export function createGrapesApi(request: ApiRequester): GrapesApi {
  return {
    list: () => request<ResourceResponse<Grape>>("/grapes"),
    search: (query) => request<Grape[]>(`/grapes/search?q=${encodeURIComponent(query)}`),
    show: (id) => request<Grape>(`/grapes/${id}`),
    create: (data) => request<Grape>("/grapes", { method: "POST", auth: true, body: { grape: data as unknown as Record<string, never> } }),
    update: (id, data) => request<Grape>(`/grapes/${id}`, { method: "PATCH", auth: true, body: { grape: data as unknown as Record<string, never> } }),
    remove: (id) => request(`/grapes/${id}`, { method: "DELETE", auth: true }),
    linkWine: (id, wineId) => request<Grape>(`/grapes/${id}/link_wine`, { method: "POST", auth: true, body: { wine_id: wineId } }),
    linkProducer: (id, producerId) => request<Grape>(`/grapes/${id}/link_producer`, { method: "POST", auth: true, body: { producer_id: producerId } }),
  }
}

export function createCountriesApi(request: ApiRequester): CountriesApi {
  return {
    list: () => request<ResourceResponse<Country>>("/countries"),
    show: (id) => request<Country>(`/countries/${id}`),
    create: (data) => request<Country>("/countries", { method: "POST", auth: true, body: { country: data as unknown as Record<string, never> } }),
    update: (id, data) => request<Country>(`/countries/${id}`, { method: "PATCH", auth: true, body: { country: data as unknown as Record<string, never> } }),
    remove: (id) => request(`/countries/${id}`, { method: "DELETE", auth: true }),
    linkProducer: (id, producerId) => request<Country>(`/countries/${id}/link_producer`, { method: "POST", auth: true, body: { producer_id: producerId } }),
  }
}

export function createStatsApi(request: ApiRequester): StatsApi {
  return { get: () => request<Stats>("/stats", { auth: false }) }
}

export function createRegionsApi(request: ApiRequester): RegionsApi {
  return {
    list: () => request<Region[]>("/regions", { auth: false }),
    tree: () => request<Region[]>("/regions/tree", { auth: false }),
    show: (id) => request<Region>(`/regions/${id}`),
    create: (data) => request<Region>("/regions", { method: "POST", auth: true, body: { region: data as unknown as Record<string, never> } }),
    update: (id, data) => request<Region>(`/regions/${id}`, { method: "PATCH", auth: true, body: { region: data as unknown as Record<string, never> } }),
    linkWine: (id, wineId) => request<Region>(`/regions/${id}/link_wine`, { method: "POST", auth: true, body: { wine_id: wineId } }),
    linkProducer: (id, producerId) => request<Region>(`/regions/${id}/link_producer`, { method: "POST", auth: true, body: { producer_id: producerId } }),
    remove: (id) => request(`/regions/${id}`, { method: "DELETE", auth: true }),
  }
}
