import type { Image } from "./image"
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
  images?: Image[]
  image_ids?: number[]
  image_details?: Image[]
  primary_image?: string | null
  capabilities?: Record<string, boolean>
  [key: string]: unknown
}
