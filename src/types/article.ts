import type { Image } from "./image"

export interface Article {
  id: number
  title: string
  slug?: string | null
  content?: string | null
  status: string
  published_at?: string | null
  user_id?: number | null
  images?: Image[]
  image_ids?: number[]
  image_details?: Image[]
  primary_image?: string | null
  [key: string]: unknown
}
