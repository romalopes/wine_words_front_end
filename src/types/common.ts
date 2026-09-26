export type QueryValue = string | number | boolean | null | undefined

export type QueryParams = Record<string, QueryValue | QueryValue[]>

export interface Paginated<T> {
  items: T[]
  page: number
  per_page?: number
  total_count?: number
  total_pages: number
}

export interface PaginationParams {
  page?: number
  per_page?: number
  [key: string]: QueryValue | QueryValue[] | undefined
}

export type ResourceResponse<T> = T[] | Paginated<T>

/**
 * Identifies the entity a link dialog should attach the selected record to.
 * `type` must match a key of the dialog's `LINK_ENDPOINTS` map
 * ("category" | "region" | "grape" | "producer" for wines).
 */
export type LinkEntityType = "category" | "region" | "grape" | "producer" | "country"

export interface LinkEntityContext {
  type: LinkEntityType
  id: number
  name?: string | null
}

export interface ApiResponse<T> {
  data: T
  status: number
}

