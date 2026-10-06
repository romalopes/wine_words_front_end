import type { ImageDetail } from "./image"
import type { Review } from "./review"
import type { Wine } from "./wine"

export interface WinePackageItem {
  id: number
  wine_package_id: number
  wine_id: number
  vintage_id?: number | null
  review_requested?: boolean
  review?: Review | null
  wine?: Wine | null
  [key: string]: unknown
}

/**
 * How far a package's requested reviews have got — `WinePackage#review_progress`.
 * `percent` is 100 when nothing was requested, and `pending` is always
 * `requested - reviewed`.
 */
export interface ReviewProgress {
  requested: number
  reviewed: number
  pending: number
  percent: number
}

/**
 * The lean `#index` payload (`WinePackageListSerializer`): list-only fields,
 * no `items`, no images, no workflow capabilities.
 */
export interface WinePackageListItem {
  id: number
  producer_id?: number | null
  producer_name?: string | null
  producer_slug?: string | null
  reviewer_id?: number | null
  /** Falls back to the reviewer's email when `display_name` is blank. */
  reviewer_name?: string | null
  status: string
  source?: string | null
  expected_at?: string | null
  arrived_at?: string | null
  review_deadline?: string | null
  reviewed_at?: string | null
  /** Number of wine lines on the package. */
  items_count: number
  pending_review_count: number
  review_progress: ReviewProgress
  auto_completed?: boolean | null
  tracking_status?: string | null
  /** True only for active packages whose deadline has passed. */
  overdue: boolean
  /** Negative once the deadline has passed. */
  days_until_deadline?: number | null
  [key: string]: unknown
}

export interface WinePackage {
  id: number
  producer_id?: number | null
  producer_name?: string | null
  /** Assigned reviewer (admin-only on write). */
  reviewer_id?: number | null
  /** How the package entered the workflow — see `sourceLabel`. */
  source?: string | null
  /** Bare `YYYY-MM-DD` date or a full ISO timestamp, as the API sent it. */
  expected_at?: string | null
  announced_at?: string | null
  arrived_at?: string | null
  review_deadline?: string | null
  reviewed_at?: string | null
  notes?: string | null
  status: string
  items?: WinePackageItem[]
  /**
   * Ordered image URL strings — `image_urls` in Rails (ImageAttributes).
   * NOTE: this is `string[]`, not `Image[]`. The rich per-image objects live in
   * `image_details`; `images` is the flat backward-compatible URL list.
   */
  images?: string[]
  /** Image record ids, position-ordered. */
  image_ids?: number[]
  /** Rich image objects: `{ id, url, filename, content_type, position, primary }`. */
  image_details?: ImageDetail[]
  /** URL of the primary (else first) image, or null when there are none. */
  primary_image?: string | null
  capabilities?: Record<string, boolean>
  [key: string]: unknown
}
