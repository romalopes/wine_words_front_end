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

export interface WinePackage {
  id: number
  producer_id?: number | null
  producer_name?: string | null
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
