import type { User } from "../types/authentication";

/**
 * The seeded FREE plan is `slug: "free"` / `is_default: true`, but the
 * session stub only carries `{ id, name }` — so the frontend identifies the
 * free tier by plan name. Matches "FREE" case-insensitively; anything else
 * (Consumer, Trade, …) counts as paid.
 */
export function isFreeSubscriptionName(name: string | null | undefined): boolean {
  return (name ?? "").trim().toLowerCase() === "free";
}

/**
 * Whether the visitor already holds a paid plan. Logged-out visitors and
 * accounts with a null subscription stub (the backend treats them as the
 * default FREE tier) are NOT paid subscribers.
 */
export function isPaidSubscriber(user: User | null | undefined): boolean {
  const name = user?.subscription?.name;
  if (!name) return false;
  return !isFreeSubscriptionName(name);
}
