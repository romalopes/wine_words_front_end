import type { Category } from "./catalog"
import type { Grape } from "./catalog"
import type { Country, Region } from "./reference"
import type { Image } from "./image"

export interface Vintage {
  id: number
  year: number | null
  prompt?: string | null
  price?: number | null
  no_vintage?: boolean
  reviews_count?: number
}

export interface Wine {
  id: number
  slug: string
  name: string
  color?: string | null
  sparkling?: boolean | null
  fortified?: boolean | null
  closure?: string | null
  alcohol_percentage?: number | null
  volume_ml?: number | null
  volume_label?: string | null
  prompt?: string | null
  designation_name?: string | null
  producer?: ProducerSummary | null
  category?: string | null
  category_id?: number | null
  categories?: Category[]
  grapes?: Grape[]
  regions?: Region[]
  parameters?: WineTasteParameter[]
  vintages?: Vintage[]
  images?: Image[]
  image_ids?: number[]
  image_details?: Image[]
  primary_image?: string | null
  [key: string]: unknown
}

export interface ProducerSummary {
  id: number
  slug: string
  name: string
  address?: string | null
  email?: string | null
}

export interface WineTasteParameter {
  id: number
  taste_parameter_id: number
  taste_parameter_slug: string
  score: number
}

export interface WineListItem extends Wine {
  vintages_count?: number
}

export type { Country }
