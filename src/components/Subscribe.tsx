import { useCallback, useEffect, useState } from "react";
import { subscriptionsApi, billingApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

function formatPrice(cents) {
  if (cents == null) return null;
  if (cents === 0) return "$0";
  return `$${(cents / 100).toFixed(0)}`;
}

function isFreePlan(plan) {
  return Boolean(
    plan && (plan.yearly_price_cents === 0 || plan.yearly_price_cents == null),
  );
}

function formatDate(value) {
  if (!value) return "your next renewal";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "your next renewal";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function newIdempotencyKey() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random()}`;
}

// One card renders every kind of plan — free and paid are just different rows
// of the same list. The small visual differences (price line, badge, CTA) are
// derived from the plan itself.
function PlanCard({ plan, isCurrent, onChoose, onManage, loadingPlanId }) {
  const isFree =
    plan.yearly_price_cents === 0 || plan.yearly_price_cents == null;
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

      {plan.description && (
        <p className="review-card__comment">{plan.description}</p>
      )}

      <p style={{ fontSize: 32, fontWeight: 700, margin: "8px 0" }}>
        {isFree ? "$0" : (yearly ?? "—")}
        {!isFree && (
          <span style={{ fontSize: 14, fontWeight: 400, color: "#666" }}>
            {" "}
            / year
          </span>
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
        title={isFree && isCurrent ? "FREE is your current plan" : undefined}
      >
        {busy
          ? "Processing…"
          : isFree
            ? isCurrent
              ? "Current plan"
              : "Login to choose"
            : isCurrent
              ? onManage
                ? "Manage subscription"
                : "Current plan"
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
  // Reconciliation with Stripe after returning from Checkout (no webhook needed).
  const [confirmState, setConfirmState] = useState(null); // null | "confirming" | "confirmed" | "error"
  const [confirmError, setConfirmError] = useState(null);
  // Plan-change (upgrade/downgrade) pre-approval state.
  const [changePreview, setChangePreview] = useState(null);
  const [changeError, setChangeError] = useState(null);
  const [changeBusy, setChangeBusy] = useState(false);
  const [changeNotice, setChangeNotice] = useState(null);

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

  // Self-heal: some auth paths (password-reset sign-in, impersonation) return a
  // user payload without the billing fields, which would leave every paid-plan
  // CTA disabled until a manual refresh. Fetch the full session once in that
  // case (GET /me always includes them, so this cannot loop).
  useEffect(() => {
    if (user && user.can_manage_billing === undefined) {
      refreshSession();
    }
  }, [user, refreshSession]);

  // Coming back from Stripe Checkout lands on
  // /subscribe?checkout=success&session_id=cs_... (or checkout=cancelled).
  // The plan is reconciled via POST /billing/confirm, which verifies the
  // Stripe session server-side and applies the subscription — the Stripe
  // webhook may not have been delivered yet in local dev.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const state = params.get("checkout");
    if (!state) return undefined;

    const sessionId = params.get("session_id");
    setCheckoutNotice(state === "success" ? "success" : "cancelled");
    window.history.replaceState({}, "", window.location.pathname);

    let retry;
    if (state === "success" && sessionId) {
      setConfirmState("confirming");
      setConfirmError(null);
      billingApi
        .confirm(sessionId)
        .then(() => {
          setConfirmState("confirmed");
          return refreshSession();
        })
        .catch((err) => {
          // Session not paid yet (202) or an error — surface it but still
          // refresh in case the webhook applied the plan in the meantime.
          setConfirmState("error");
          setConfirmError(err.message || "Could not confirm payment yet.");
          return refreshSession();
        })
        .then(() => {
          retry = setTimeout(() => refreshSession(), 3000);
        });
    } else {
      refreshSession();
      retry = setTimeout(() => refreshSession(), 3000);
    }

    return () => clearTimeout(retry);
  }, [refreshSession]);

  const currentPlanId = user?.subscription?.id;
  const currentPlan = plans.find((p) => p.id === currentPlanId);

  // Users on a paid plan go through the plan-change (preview/confirm) flow;
  // users on FREE (or no subscription) still use Checkout.
  const handleChoose = useCallback(
    async (planId) => {
      setError(null);
      setChangeNotice(null);
      setLoadingPlanId(planId);
      try {
        const onPaidPlan = currentPlan && !isFreePlan(currentPlan);
        if (onPaidPlan) {
          const preview = await billingApi.changePreview(planId);
          setLoadingPlanId(null);
          setChangeError(null);
          setChangePreview(preview);
        } else {
          const result = await billingApi.checkout(planId);
          window.location.href = result.url;
        }
      } catch (err) {
        setError(err.message || "Could not start plan change.");
        setLoadingPlanId(null);
      }
    },
    [currentPlan],
  );

  const handleChangeConfirm = useCallback(async () => {
    const targetId = changePreview?.target?.id;
    if (!targetId) return;
    setChangeBusy(true);
    setChangeError(null);
    try {
      const result = await billingApi.changeConfirm(
        targetId,
        newIdempotencyKey(),
      );
      const downgrade = changePreview.direction === "downgrade";
      const targetName = changePreview.target.name;
      setChangePreview(null);
      // A charge that needs authentication (3DS/SCA) comes back as an open
      // Stripe invoice: send the customer there to finish paying it.
      if (result?.hosted_invoice_url) {
        window.open(result.hosted_invoice_url, "_blank", "noopener,noreferrer");
      }
      setChangeNotice(
        downgrade
          ? `✅ Downgrade scheduled — you'll move to ${targetName} at ${formatDate(changePreview.current_period_end)}. Your current plan stays active until then.`
          : result?.hosted_invoice_url
            ? `💳 Almost there — complete the ${formatPrice(changePreview.due_today.amount_cents)} payment to activate ${targetName}.`
            : `✅ Upgrade started — ${targetName} will take effect as soon as payment is confirmed.`,
      );
      await refreshSession();
      setTimeout(() => refreshSession(), 3000);
    } catch (err) {
      setChangeError(err.message || "Could not confirm the change.");
    } finally {
      setChangeBusy(false);
      setLoadingPlanId(null);
    }
  }, [changePreview, refreshSession]);

  const handleCancelChange = useCallback(() => {
    setChangePreview(null);
    setChangeError(null);
  }, []);

  const handleManage = useCallback(async () => {
    setError(null);
    try {
      const result = await billingApi.portal();
      window.location.href = result.url;
    } catch (err) {
      setError(err.message || "Could not open billing portal.");
    }
  }, []);

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
          {confirmState === "confirming" &&
            "⏳ Confirming your payment with Stripe…"}
          {confirmState === "confirmed" &&
            "✅ Payment confirmed — your plan is now active."}
          {confirmState === "error" &&
            `⚠️ Payment received but activation needs a moment${confirmError ? `: ${confirmError}` : "."} If it still shows the old plan in a moment, refresh once more.`}
          {confirmState === null &&
            "✅ Payment received — your plan is being activated. This page will update automatically; if it still shows the old plan in a moment, refresh once more."}
        </p>
      )}
      {checkoutNotice === "cancelled" && (
        <p className="review-card__comment">
          Checkout cancelled — you have not been charged.
        </p>
      )}
      {changeNotice && (
        <p className="review-card__comment" style={{ fontWeight: 600 }}>
          {changeNotice}
        </p>
      )}
      {user?.subscription_change?.change_type === "downgrade" &&
        user?.subscription_change?.status === "scheduled" && (
          <p
            className="review-card__comment"
            style={{ fontWeight: 600, border: "1px solid #7f4f24", padding: 8 }}
          >
            ✅ Downgrade scheduled — you'll move to{" "}
            {user.subscription_change.to_subscription?.name} on{" "}
            {formatDate(user.subscription_change.effective_at)}. Your current
            plan stays active until then.
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
            const isFree = isFreePlan(plan);
            // Paid plans that aren't the current plan get a "Choose plan"
            // button (which routes to the change flow for existing paid
            // users). The current paid plan gets "Manage subscription".
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={isCurrent}
                onChoose={
                  !isFree && !isCurrent && canManageBilling
                    ? handleChoose
                    : undefined
                }
                onManage={
                  isCurrent && canManageBilling ? handleManage : undefined
                }
                loadingPlanId={loadingPlanId}
              />
            );
          })}
        </div>
      )}

      {changePreview && (
        <div
          className="review-card"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              maxWidth: 460,
              padding: 24,
              borderRadius: 12,
              background: "#fff",
              boxShadow: "0 12px 40px rgba(0,0,0,.25)",
            }}
          >
            <h2 style={{ margin: 0 }}>
              {changePreview.direction === "downgrade"
                ? `Downgrade to ${changePreview.target.name}`
                : `Upgrade to ${changePreview.target.name}`}
            </h2>
            <p className="review-card__comment">
              Current plan: <strong>{changePreview.current.name}</strong>
              {changePreview.direction === "downgrade" && (
                <span>
                  {" "}
                  — stays active until{" "}
                  {formatDate(changePreview.current_period_end)}
                </span>
              )}
            </p>
            <ul style={{ padding: 0, margin: "16px 0", listStyle: "none" }}>
              {changePreview.direction === "upgrade" && (
                <li>
                  Amount due today:{" "}
                  <strong>
                    {formatPrice(changePreview.due_today.amount_cents)}
                  </strong>
                </li>
              )}
              <li>
                Next renewal:{" "}
                <strong>
                  {formatPrice(changePreview.next_renewal.amount_cents)}
                </strong>{" "}
                on {formatDate(changePreview.current_period_end)}
              </li>
              {changePreview.direction === "downgrade" && (
                <li>
                  Amount due today: <strong>$0</strong>
                </li>
              )}
            </ul>
            {changeError && (
              <p className="review-form__error" role="alert">
                {changeError}
              </p>
            )}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                className="auth-form__submit"
                disabled={changeBusy}
                onClick={handleChangeConfirm}
              >
                {changeBusy
                  ? "Processing…"
                  : changePreview.direction === "downgrade"
                    ? "Confirm downgrade"
                    : `Confirm upgrade — ${formatPrice(changePreview.due_today.amount_cents)}`}
              </button>
              <button
                type="button"
                className="auth-form__submit"
                disabled={changeBusy}
                onClick={handleCancelChange}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Subscribe;
