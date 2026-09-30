export interface LikeState {
  liked: boolean
  likes_count: number
}

export type LikeableKind = "wine" | "review" | "article"

export interface Likeable {
  id: number
  likes_count?: number | null
  liked_by_current_user?: boolean | null
  [key: string]: unknown
}
