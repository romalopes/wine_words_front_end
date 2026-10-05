export type ArticleProjectStatus =
  | "initiated"
  | "planning"
  | "pending_wines"
  | "researching"
  | "tasting"
  | "final_draft"
  | "pending_editor_review"
  | "reviewed_by_editor"
  | "published"
  | "on_hold"
  | "cancelled"

export type DraftingStatus = "not_initiated" | "initiated" | "in_progress" | "finished"

export interface ArticleProjectOwner {
  id: number
  display_name: string | null
}

export interface ArticleProjectCounts {
  total: number
  requested: number
  received: number
  selected: number
  tasted: number
}

export interface ArticleProject {
  id: number
  name: string
  publication: string | null
  editor_name: string | null
  editor_email: string | null
  project_status: ArticleProjectStatus
  drafting_status: DraftingStatus
  deadline: string | null
  target_word_count: number | null
  overdue: boolean
  lock_version: number
  created_by: ArticleProjectOwner
  counts: ArticleProjectCounts
  description?: string | null
  actual_word_count?: number | null
  word_count_remaining?: number | null
  created_at: string | null
  updated_at: string | null
}

export interface ArticleProjectArticleLink {
  id: number
  slug: string | null
  title: string
  status: string
}

export interface ArticleProjectProducerLink {
  id: number
  producer: { id: number; name: string; slug: string | null }
  contacted: boolean
  request_confirmed: boolean
  notes: string | null
}

export interface ArticleProjectVintageLink {
  id: number
  vintage: { id: number; display_name: string; year: number | null; wine_name: string | null; wine_slug: string | null; producer_id: number | null }
  requested: boolean
  received: boolean
  selected: boolean
  tasted: boolean
  date_received: string | null
  bottle_condition: "not_assessed" | "good" | "damaged" | "leaking" | "other"
  notes: string | null
}

export interface ArticleProjectReviewLink {
  id: number
  review: { id: number; slug: string | null; title: string; wine_name: string | null; vintage_year: number | null }
}

export interface ArticleProjectDetail extends ArticleProject {
  article: ArticleProjectArticleLink | null
  article_project_producers: ArticleProjectProducerLink[]
  article_project_vintages: ArticleProjectVintageLink[]
  article_project_reviews: ArticleProjectReviewLink[]
}

export type ArticleProjectLookupKind = "article" | "producer" | "vintage" | "review"

export type ArticleProjectLookupItem =
  | ArticleProjectArticleLink
  | ArticleProjectProducerLink["producer"]
  | ArticleProjectVintageLink["vintage"]
  | ArticleProjectReviewLink["review"]

export interface ArticleProjectWritePayload {
  name?: string
  publication?: string | null
  editor_name?: string | null
  editor_email?: string | null
  project_status?: ArticleProjectStatus
  drafting_status?: DraftingStatus
  deadline?: string | null
  target_word_count?: number | null
  description?: string | null
  article_id?: number | null
  lock_version?: number
  article_project_producers_attributes?: Array<{ id?: number; producer_id?: number; contacted?: boolean; request_confirmed?: boolean; notes?: string | null; _destroy?: boolean }>
  article_project_vintages_attributes?: Array<{ id?: number; vintage_id?: number; requested?: boolean; received?: boolean; selected?: boolean; tasted?: boolean; date_received?: string | null; bottle_condition?: string; notes?: string | null; _destroy?: boolean }>
  article_project_reviews_attributes?: Array<{ id?: number; review_id?: number; _destroy?: boolean }>
  [key: string]: unknown
}