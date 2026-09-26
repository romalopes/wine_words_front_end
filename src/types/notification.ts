export interface Notification {
  id: number
  title?: string | null
  message?: string | null
  read_at?: string | null
  created_at?: string | null
  [key: string]: unknown
}

export interface Configuration {
  logs_saved_to_database?: boolean
  use_test_email?: boolean
  test_email?: string | null
  settings?: Setting[]
}

export interface Setting {
  id: number | string
  key: string
  value: unknown
  [key: string]: unknown
}
