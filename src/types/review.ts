import type { Image } from "./image"

export interface Review {
  id: number
  slug: string
  title: string
  comment?: string | null
  score?: number | null
  status: string
  drink_from?: number | null
  drink_to?: number | null
  drink_plus?: boolean | null
  user_id?: number | null
  reviewer_name?: string | null
  vintage_id?: number | null
  vintage_year?: number | null
  vintage_no_vintage?: boolean | null
  wine_name?: string | null
  wine_slug?: string | null
  category?: string | null
  categories?: Array<{ id: number; name: string; slug: string }>
  category_ids?: number[]
  images?: Image[]
  image_ids?: number[]
  image_details?: Image[]
  primary_image?: string | null
  published_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  [key: string]: unknown
}
