/** The commentable types the API accepts (mirrors Comment::COMMENTABLE_TYPES). */
export type CommentableKind = "wine" | "review" | "article"

export interface CommentAuthor {
  id: number | null
  name: string
}

export interface CommentDTO {
  id: number
  /** Already a "[Comment deleted]" tombstone when `deleted` is true. */
  body: string
  deleted: boolean
  parent_id: number | null
  commentable_type: string
  commentable_id: number
  author: CommentAuthor
  created_at: string
  updated_at: string
  edited: boolean
  /** Resolved server-side: the UI renders exactly the actions the API allows. */
  editable: boolean
  deletable: boolean
  /** One level only — replies are never nested deeper. */
  replies: CommentDTO[]
}

export interface CommentThread {
  comments: CommentDTO[]
  comments_count: number
}