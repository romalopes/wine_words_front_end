export interface ShipmentEvent {
  id: number
  status: string
  event_at?: string | null
  location?: string | null
  message?: string | null
  external_id?: string | null
  created_at?: string | null
}

export interface ShipmentTracking {
  wine_package_id: number
  carrier?: string | null
  number?: string | null
  url?: string | null
  provider?: string | null
  provider_configured: boolean
  status?: string | null
  status_updated_at?: string | null
  estimated_delivery_at?: string | null
  delivered_at?: string | null
  delivered: boolean
  events: ShipmentEvent[]
  created_at?: string | null
  updated_at?: string | null
}
