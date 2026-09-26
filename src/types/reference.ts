export interface Country {
  id: number
  name: string
  slug: string
  code?: string | null
  flag_emoji?: string | null
  [key: string]: unknown
}

export interface Region {
  id: number
  name: string
  slug: string
  country?: Country | null
  country_id?: number | null
  is_state?: boolean | null
  is_appellation?: boolean | null
  [key: string]: unknown
}
