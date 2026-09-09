import { useCallback, useEffect, useState } from "react";
import { subscriptionsApi, billingApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

function formatPrice(cents) {
  if (cents == null) return null;
  if (cents === 0) return "$0";
  return `$${(cents / 100).toFixed(0)}`;
}

// One card renders every kind of plan — free and paid are just different rows
// of the same list. The small visual differences (price line, badge, CTA) are
// derived from the plan itself.
function PlanCard({ plan, isCurrent, onChoose, onManage, loadingPlanId }) {
  const isFree = plan.yearly_price_cents === 0 || plan.yearly_price_cents == null;
  const yearly = formatPrice(plan.yearly_price_cents);
  const monthly = formatPrice(plan.monthly_price_cents);
  const busy = loadingPlanId === plan.id;

  return (
    <article
      className="review-card"
      style={isFree ? { maxWidth: 340, border: "1px dashed #ccc" } : undefined}
    >
      <div style={{ position: "relative" }}>
        {plan.popular && (
          <span
            className="review-card__badge"
            style={{
              background: "#7f4f24",
              color: "#fff",
              borderRadius: 999,
              padding: "2px 10px",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Most popular
          </span>
        )}
        <h2 className="review-card__title">{plan.name}</h2>
      </div>

      {plan.description && <p className="review-card__comment">{plan.description}</p>}

      <p style={{ fontSize: 32, fontWeight: 700, margin: "8px 0" }}>
        {isFree ? "$0" : (yearly ?? "—")}
        {!isFree && (
          <span style={{ fontSize: 14, fontWeight: 400, color: "#666" }}> / year</span>
        )}
      </p>
      {!isFree && monthly && (
        <p className="review-card__comment">or {monthly} billed monthly</p>
      )}

      <ul style={{ paddingLeft: 20, margin: "16px 0" }}>
        {(plan.features || []).map((f, i) => (
          <li key={f.id ?? i} style={{ marginBottom: 6, fontSize: 14 }}>
            ✓ {f.name}
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="auth-form__submit"
        disabled={!isFree && !onChoose && !onManage}
        onClick={() => {
          if (isFree && isCurrent) return;
          if (onManage) onManage();
          else if (onChoose) onChoose(plan.id);
        }}
        title={
          isFree
            ? "FREE is your current plan"
            : undefined
        }
      >
        {busy
          ? "Processing…"
          : isFree
            ? isCurrent
              ? "Current plan"
              : "Coming soon"
            : isCurrent
              ? "Current plan"
              : onManage
                ? "Manage subscription"
                : "Choose plan"}
      </button>
    </article>
  );
}

function Subscribe() {
  const { user, refreshSession } = useAuth();
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  // Set when the user returns from Stripe Checkout (?checkout=success|cancelled).
  const [checkoutNotice, setCheckoutNotice] = useState(null);

  useEffect(() => {
    let cancelled = false;
    subscriptionsApi
      .list()
      .then((data) => {
        if (!cancelled) setPlans(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load plans");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Coming back from Stripe Checkout lands on /subscribe?checkout=success
  // (or =cancelled). Show a status message, strip the query from the URL, and
  // refresh the session so the current-plan state reflects any activation the
  // webhook has already processed. The subscription itself is applied by the
  // Stripe webhook, which can lag the redirect by a moment — so retry the
  // refresh once after a short delay.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const state = params.get("checkout");
    if (!state) return undefined;

    setCheckoutNotice(state === "success" ? "success" : "cancelled");
    window.history.replaceState({}, "", window.location.pathname);

    refreshSession();
    const retry = setTimeout(() => refreshSession(), 3000);

    return () => clearTimeout(retry);
  }, [refreshSession]);

  const handleChoose = useCallback(
    async (planId) => {
      setError(null);
      setLoadingPlanId(planId);
      try {
        const result = await billingApi.checkout(planId);
        // Redirect to Stripe Checkout.
        window.location.href = result.url;
      } catch (err) {
        setError(err.message || "Could not start checkout.");
        setLoadingPlanId(null);
      }
    },
    [],
  );

  const handleManage = useCallback(async () => {
    setError(null);
    try {
      const result = await billingApi.portal();
      window.location.href = result.url;
    } catch (err) {
      setError(err.message || "Could not open billing portal.");
    }
  }, []);

  const currentPlanId = user?.subscription?.id;
  const canManageBilling = user?.can_manage_billing; // Stripe is available for this user

  // FREE first, then the paid tiers sorted by price.
  const free =
    plans.find((p) => p.yearly_price_cents === 0) ||
    plans.find((p) => p.name === "FREE");
  const paid = plans.filter((p) => p !== free);
  const orderedPlans = [
    ...(free ? [free] : []),
    ...paid.slice().sort((a, b) => a.yearly_price_cents - b.yearly_price_cents),
  ];

  return (
    <main className="wine-app">
      <div className="wine-management__header">
        <h1>Membership</h1>
        <p className="review-card__comment">
          Choose the plan that fits how you explore and share wine words.
        </p>
      </div>

      {loading && <p className="wine-management__loading">Loading plans…</p>}
      {error && <p className="review-form__error">{error}</p>}
      {checkoutNotice === "success" && (
        <p className="review-card__comment" style={{ fontWeight: 600 }}>
          ✅ Payment received — your plan is being activated. This page will
          update automatically; if it still shows the old plan in a moment,
          refresh once more.
        </p>
      )}
      {checkoutNotice === "cancelled" && (
        <p className="review-card__comment">
          Checkout cancelled — you have not been charged.
        </p>
      )}

      {!loading && !error && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 24,
            marginBottom: 32,
          }}
        >
          {orderedPlans.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const isFree = plan.yearly_price_cents === 0 || plan.yearly_price_cents == null;
            // Free plans: no checkout. Paid plans that aren't the current plan
            // get a "Choose plan" button (only if billing is configured).
            // The current paid plan gets a "Manage subscription" button.
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={isCurrent}
                onChoose={(!isFree && !isCurrent && canManageBilling) ? handleChoose : undefined}
                onManage={(isCurrent && canManageBilling) ? handleManage : undefined}
                loadingPlanId={loadingPlanId}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}

export default Subscribe;
