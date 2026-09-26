export interface Grape {
  id: number
  name: string
  slug: string
  color?: string | null
  [key: string]: unknown
}

export interface Category {
  id: number
  name: string
  slug: string
  type?: string | null
  position?: number | null
  [key: string]: unknown
}

export interface TasteParameter {
  id: number
  slug: string
  label: string
  low: number
  high: number
  help?: string | null
}
