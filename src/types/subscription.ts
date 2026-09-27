/**
 * A plan feature, as embedded in a plan's `features` array.
 *
 * `id` is the *feature's* id (`subscription_feature_id` on the join record),
 * which is what the admin form posts back — not the join row's own id.
 */
export interface SubscriptionFeature {
  id: number
  name: string
  position?: number
}

/**
 * A membership plan — `subscriptions_controller#subscription_json`.
 *
 * The field set is fixed by that serializer, so it is spelled out here instead
 * of carrying an open index signature. Admin-only fields (`slug`, `visible`,
 * `active`, `is_default`, `position`, `currency`) are always present in the
 * payload but only mean something to an admin; the public list endpoint
 * filters to `active.visible` records but still renders every key.
 */
export interface Subscription {
  id: number
  name: string
  slug: string
  description: string | null
  /** Marks the plan highlighted with a "Most popular" badge. */
  popular: boolean
  /** Whether the plan is offered on the public pricing page. */
  visible: boolean
  /** Whether the plan still accepts new subscriptions. */
  active: boolean
  /** Pre-selected for users who have not chosen a plan. */
  is_default: boolean
  /** Display order on the pricing page (ascending). */
  position: number
  monthly_price_cents: number | null
  yearly_price_cents: number | null
  currency: string
  features: SubscriptionFeature[]
}

/**
 * One entry of the `subscription_subscription_features_attributes` nested
 * attributes the API permits. `id` is the join record's id, used to update or
 * destroy an existing association rather than create a duplicate.
 */
export interface SubscriptionFeatureAttributes {
  id?: number
  subscription_feature_id: number
  position: number
  _destroy?: boolean
}

/** Body of `POST /subscriptions` and `PATCH /subscriptions/:id`. */
export interface SubscriptionWritePayload {
  name: string
  slug: string
  description: string | null
  popular: boolean
  visible: boolean
  active: boolean
  is_default: boolean
  position: number
  /** Dollars typed in the admin form are converted to cents before posting. */
  monthly_price_cents: number | null
  yearly_price_cents: number | null
  currency: string
  subscription_subscription_features_attributes: SubscriptionFeatureAttributes[]
}
