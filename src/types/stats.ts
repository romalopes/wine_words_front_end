/**
 * Payload of `GET /api/v1/stats` (StatsController#index). Every counter is
 * always present, so these are required rather than optional — the controller
 * renders all four keys on every response. `reviews` counts published only and
 * `articles` is scoped to the current user when authenticated.
 */
export interface Stats {
  producers: number
  wines: number
  reviews: number
  articles: number
}
