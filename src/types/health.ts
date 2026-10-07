/**
 * Payload of `GET /api/v1/health` (public liveness) and
 * `GET /api/v1/health/detailed` (admin-only diagnostics). Mirrors
 * `Api::V1::HealthController`.
 */

/** ActiveRecord connection details. Every field is null when unavailable. */
export interface HealthDatabaseDetails {
  adapter: string | null
  database: string | null
  host: string | null
  port: number | string | null
  username: string | null
  encoding: string | null
  pool: number | null
  checkout_timeout: number | null
  reaping_frequency: number | null
  idle_timeout: number | null
}

/** ActiveStorage service details. */
export interface HealthStorageDetails {
  service: string | null
  service_class: string | null
  bucket: string | null
  region: string | null
  endpoint: string | null
  root: string | null
  public: boolean | null
}

/** Server-side runtime info. `render` is true when running on Render. */
export interface HealthServerInfo {
  rails_version: string | null
  ruby: string | null
  puma_workers: number | null
  hostname: string | null
  pid: number | null
  render: boolean
}

/** The request the health check itself arrived on. */
export interface HealthEndpointInfo {
  scheme: string
  host: string
  port: number
  base_url: string
  path: string
}

/**
 * The detailed payload. The nested sections are always present but can be
 * entirely null when the probe failed, so callers must narrow before reading.
 */
export interface DetailedHealthPayload {
  status: string
  service: string
  database: string
  storage: string
  environment: string | null
  version: string
  timestamp: string
  database_details: HealthDatabaseDetails | null
  storage_details: HealthStorageDetails | null
  server: HealthServerInfo | null
  endpoint: HealthEndpointInfo | null
}

/** The public liveness payload — a strict subset of the detailed one. */
export interface HealthPayload {
  status: string
  database: string
  version: string
}

/** The success payload of `POST /api/v1/health/email/test`. */
export interface HealthEmailTestPayload {
  status: string
  configured_transport: string
  effective_transport: string
  recipients: string[]
  message: string
  delivered_at: string
}
