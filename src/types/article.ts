import type { ImageDetail } from "./image"

export interface Article {
  id: number
  title: string
  likes_count?: number
  liked_by_current_user?: boolean
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
  /** `tag_names` is the same list already comma-joined for the text input. */
  tag_names?: string
  categories?: Array<{ id: number; name: string; slug: string }>
  category_ids?: number[]
  /** Linked producers, as `{ id, name, slug }` stubs (ArticleSerializer). */
  producers?: Array<{ id: number; name: string; slug: string }>
  producer_ids?: number[]
  /**
   * Linked vintages, flattened with the owning wine's name/slug and its first
   * region, so a review list can be grouped by vintage without a second fetch.
   */
  vintages?: Array<{
    id: number
    year: number | null
    name: string
    wine_name: string | null
    wine_slug: string | null
    region: string | null
  }>
  vintage_ids?: number[]
  /** Linked reviews plus the per-link status from the `article_reviews` join. */
  reviews?: Array<{
    id: number
    slug: string
    title: string
    score: number | null
    status: string
    comment: string | null
    reviewer_name: string
    link_status?: string | null
  }>
  review_ids?: number[]
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
