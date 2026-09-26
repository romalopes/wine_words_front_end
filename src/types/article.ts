import type { ImageDetail } from "./image"

export interface Article {
  id: number
  title: string
  slug?: string | null
  /** Short summary shown in cards and list views. */
  abstract?: string | null
  content?: string | null
  body?: string | null
  status: string
  published_at?: string | null
  user_id?: number | null
  /** Byline, computed by the Rails serializers (`user_name` else `email`). */
  author_name?: string | null
  tags?: string[]
  categories?: Array<{ id: number; name: string; slug: string }>
  category_ids?: number[]
  created_at?: string | null
  updated_at?: string | null
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
  [key: string]: unknown
}
