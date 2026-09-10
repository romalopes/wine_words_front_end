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
function PlanCard({ plan, isCurrent, isLowerTier, onChoose, onManage, loadingPlanId }) {
