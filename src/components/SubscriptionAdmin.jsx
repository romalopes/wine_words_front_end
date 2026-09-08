import { useEffect, useState } from "react";
import { subscriptionsApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { isAdmin } from "../constants/roles";
import { Link } from "react-router-dom";

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  popular: false,
  visible: true,
  active: true,
  is_default: false,
  position: 0,
  monthly_price_cents: "",
  yearly_price_cents: "",
  currency: "AUD",
  selectedFeatureIds: [],
};

function priceCents(value) {
  const n = parseFloat(value);
  if (value === "" || value == null || Number.isNaN(n)) return null;
  return Math.round(n * 100);
}

function toForm(sub) {
  return {
    id: sub.id,
    name: sub.name || "",
    slug: sub.slug || "",
    description: sub.description || "",
    popular: Boolean(sub.popular),
    visible: sub.visible !== false,
    active: sub.active !== false,
    is_default: Boolean(sub.is_default),
    position: sub.position || 0,
    monthly_price_cents: sub.monthly_price_cents || "",
    yearly_price_cents: sub.yearly_price_cents || "",
    currency: sub.currency || "AUD",
    selectedFeatureIds: (sub.features || []).map((f) => f.id),
  };
}

function SubscriptionAdmin() {
  const { user } = useAuth();
  const isAdmin = isAdmin(user);

  const [plans, setPlans] = useState([]);
  const [allFeatures, setAllFeatures] = useState([]);
  const [editing, setEditing] = useState(null); // row object or "new"
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadPlans() {
    try {
      setLoading(true);
      const data = await subscriptionsApi.list({ auth: true });
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlans();
  }, []);

  function startNew() {
    setForm(EMPTY_FORM);
    setEditing("new");
    setError(null);
  }

  function startEdit(sub) {
    setForm(toForm(sub));
    setEditing(sub);
    setError(null);
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleFeature(id) {
    setForm((prev) => {
      const has = prev.selectedFeatureIds.includes(id);
      return {
        ...prev,
        selectedFeatureIds: has
          ? prev.selectedFeatureIds.filter((x) => x !== id)
          : [...prev.selectedFeatureIds, id],
      };
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        monthly_price_cents: priceCents(form.monthly_price_cents),
        yearly_price_cents: priceCents(form.yearly_price_cents),
        subscription_subscription_features_attributes: form.selectedFeatureIds.map(
          (featureId, index) => ({ subscription_feature_id: featureId, position: index }),
        ),
      };
      delete payload.selectedFeatureIds;

      if (editing === "new") {
        await subscriptionsApi.create(payload);
      } else if (editing) {
        await subscriptionsApi.update(editing.id, payload);
      }
      setEditing(null);
      setForm(EMPTY_FORM);
      await loadPlans();
    } catch (err) {
      setError(err.message || "Failed to save plan");
    } finally {
      setSaving(false);
    }
  }

  async function remove(sub) {
    if (!window.confirm(`Delete "${sub.name}"? This only works if no users are linked.`)) return;
    setError(null);
    try {
      await subscriptionsApi.destroy(sub.id);
      setPlans((prev) => prev.filter((x) => x.id !== sub.id));
    } catch (err) {
      setError(err.message || "Failed to delete plan");
    }
  }

  useEffect(() => {
    const byId = new Map();
    plans.forEach((p) => (p.features || []).forEach((f) => byId.set(f.id, f)));
    setAllFeatures(Array.from(byId.values()));
  }, [plans]);

  const fieldStyle = { marginBottom: 12 };

  if (!isAdmin) {
    return (
      <main className="wine-app">
        <p className="wine-management__empty-state">
          You do not have permission to manage subscriptions.
        </p>
        <Link to="/" className="auth-form__submit">
          Back to Dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="wine-app">
      <div className="wine-management__header">
        <h1>Subscriptions</h1>
        <p className="review-card__comment">
          Manage membership plans and their features. Plans with users or history cannot be
          deleted — deactivate or hide them instead.
        </p>
        <button type="button" className="auth-form__submit" onClick={startNew}>
          + Add plan
        </button>
      </div>

      {error && <p className="review-form__error">{error}</p>}
      {loading && <p className="wine-management__loading">Loading…</p>}
{editing && (
        <div className="review-card" style={{ margin: "16px 0" }}>
          <h2>{editing === "new" ? "New subscription" : `Edit ${editing.name}`}</h2>

          <div style={fieldStyle}>
            <label className="review-form__label">Name *</label>
            <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label className="review-form__label">Slug *</label>
            <input type="text" value={form.slug} onChange={(e) => update("slug", e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label className="review-form__label">Description</label>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label className="review-form__label">Yearly price (AUD, dollars)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.yearly_price_cents}
              onChange={(e) => update("yearly_price_cents", e.target.value)}
            />
          </div>
          <div style={fieldStyle}>
            <label className="review-form__label">Monthly price (AUD, dollars — reserved for future)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.monthly_price_cents}
              onChange={(e) => update("monthly_price_cents", e.target.value)}
            />
          </div>

          <div style={fieldStyle}>
            {[
              { key: "popular", label: "Most popular" },
              { key: "visible", label: "Visible on the website" },
              { key: "active", label: "Active (taking new subscriptions)" },
              { key: "is_default", label: "Default plan for new users" },
            ].map((opt) => (
              <label key={opt.key} style={{ display: "block", fontWeight: 400 }}>
                <input
                  type="checkbox"
                  checked={Boolean(form[opt.key])}
                  onChange={(e) => update(opt.key, e.target.checked)}
                />{" "}
                {opt.label}
              </label>
            ))}
          </div>

          <div style={fieldStyle}>
            <span className="review-form__label">Features</span>
            {allFeatures.map((f) => (
              <label key={f.id} style={{ display: "block", fontWeight: 400 }}>
                <input
                  type="checkbox"
                  checked={form.selectedFeatureIds.includes(f.id)}
                  onChange={() => toggleFeature(f.id)}
                />{" "}
                {f.name}
              </label>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button type="button" className="auth-form__submit" disabled={saving} onClick={save}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" className="auth-form__submit" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        {plans.map((sub) => (
          <div key={sub.id} className="review-card">
            <h3 className="review-card__title">
              {sub.name}
              {sub.popular && (
                <span
                  style={{
                    background: "#7f4f24", color: "#fff", borderRadius: 999,
                    padding: "2px 8px", fontSize: 11, fontWeight: 600, marginLeft: 8,
                  }}
                >
                  Popular
                </span>
              )}
              {!sub.active && <span style={{ color: "#b00", marginLeft: 8 }}>inactive</span>}
              {!sub.visible && <span style={{ color: "#888", marginLeft: 8 }}>hidden</span>}
            </h3>
            <p className="review-card__comment">
              {sub.yearly_price_cents ? `$${(sub.yearly_price_cents / 100).toFixed(0)} / yr` : "Free"}
            </p>
            <ul style={{ paddingLeft: 18, fontSize: 13 }}>
              {(sub.features || []).map((f) => (
                <li key={f.id}>{f.name}</li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button type="button" className="auth-form__submit" onClick={() => startEdit(sub)}>
                Edit
              </button>
              <button
                type="button"
                className="auth-form__submit"
                style={{ background: "#b00", color: "#fff" }}
                onClick={() => remove(sub)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {!loading && plans.length === 0 && (
        <p className="wine-management__empty-state">No subscriptions yet.</p>
      )}
    </main>
  );
}

export default SubscriptionAdmin;