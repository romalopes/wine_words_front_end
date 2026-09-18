import { useCallback, useEffect, useState } from "react";
import { shipmentTrackingsApi } from "../services/api";
import { formatDate, formatDateTime } from "../utils/dates";
import styles from "./winePackages.module.css";

// Shipment tracking for a package: carrier, consignment number, the current
// status and the carrier's event history.
//
// Tracking is optional and carrier-independent: with no carrier credentials the
// row still works by hand, and "Refresh" simply reports that no live data was
// fetched. A carrier "Delivered" never marks the package as arrived — a
// reviewer always confirms that on the package itself.
function ShipmentTrackingPanel({ packageId, canManage, onChanged }) {
  const [tracking, setTracking] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({
    carrier: "",
    number: "",
    status: "",
    url: "",
    estimated_delivery_at: "",
  });
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await shipmentTrackingsApi.show(packageId);
      setTracking(data);
      setForm({
        carrier: data.carrier || "",
        number: data.number || "",
        status: data.status || "",
        url: data.url || "",
        estimated_delivery_at: data.estimated_delivery_at
          ? data.estimated_delivery_at.slice(0, 10)
          : "",
      });
    } catch (err) {
      // 404 simply means no tracking has been recorded yet.
      if (err?.status !== 404) setError(err.message || "Failed to load tracking");
    } finally {
      setLoaded(true);
    }
  }, [packageId]);

  useEffect(() => {
    load();
  }, [load]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const saved = await shipmentTrackingsApi.update(packageId, {
        carrier: form.carrier,
        number: form.number,
        status: form.status,
        url: form.url || null,
        estimated_delivery_at: form.estimated_delivery_at || null,
      });
      setTracking(saved);
      setMessage("Tracking saved.");
      if (onChanged) onChanged();
    } catch (err) {
      setError(err.message || "Failed to save tracking");
    } finally {
      setSaving(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    setMessage(null);

    try {
      const refreshed = await shipmentTrackingsApi.refresh(packageId);
      setTracking(refreshed);
      setForm((current) => ({
        ...current,
        status: refreshed.status || current.status,
        url: refreshed.url || current.url,
      }));
      setMessage(
        refreshed.provider_configured
          ? "Tracking refreshed from the carrier."
          : "No carrier credentials configured — the saved tracking was left unchanged.",
      );
      if (onChanged) onChanged();
    } catch (err) {
      setError(err.message || "Failed to refresh tracking");
    } finally {
      setRefreshing(false);
    }
  }

  if (!loaded) {
    return (
      <div className={styles.section}>
        <h2>Shipment tracking</h2>
        <p className={styles.cellMuted}>Loading tracking…</p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <h2>Shipment tracking</h2>

      {error && <p className="wine-management__error">{error}</p>}
      {message && <p className={styles.cellMuted}>{message}</p>}

      {tracking ? (
        <p className={styles.meta}>
          <span>
            <strong>{tracking.carrier || "Unknown carrier"}</strong>
            {tracking.number ? ` · ${tracking.number}` : ""}
          </span>
          <span>Status: {tracking.status || "—"}</span>
          {tracking.estimated_delivery_at && (
            <span>ETA {formatDate(tracking.estimated_delivery_at)}</span>
          )}
          {tracking.delivered_at && (
            <span className={styles.overdue}>
              Carrier reports delivered {formatDateTime(tracking.delivered_at)} — confirm arrival
            </span>
          )}
          {tracking.url && (
            <a href={tracking.url} target="_blank" rel="noreferrer">
              Track on carrier site
            </a>
          )}
          {!tracking.provider_configured && (
            <span className={styles.cellMuted}>
              No live carrier credentials — status is maintained by hand
            </span>
          )}
        </p>
      ) : (
        <p className={styles.cellMuted}>No tracking recorded for this package yet.</p>
      )}

      {Array.isArray(tracking?.events) && tracking.events.length > 0 && (
        <ul className={styles.cellMuted}>
          {tracking.events.map((event) => (
            <li key={event.id}>
              {formatDateTime(event.event_at) || "—"} · {event.status}
              {event.location ? ` · ${event.location}` : ""}
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <form className={styles.inlineForm} onSubmit={handleSave}>
          <div className={styles.filterField}>
            <label htmlFor="tracking-carrier">Carrier</label>
            <input
              id="tracking-carrier"
              type="text"
              placeholder="Australia Post"
              value={form.carrier}
              onChange={(event) => updateField("carrier", event.target.value)}
            />
          </div>
          <div className={styles.filterField}>
            <label htmlFor="tracking-number">Consignment number</label>
            <input
              id="tracking-number"
              type="text"
              value={form.number}
              onChange={(event) => updateField("number", event.target.value)}
            />
          </div>
          <div className={styles.filterField}>
            <label htmlFor="tracking-status">Status</label>
            <input
              id="tracking-status"
              type="text"
              placeholder="In transit"
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
            />
          </div>
          <div className={styles.filterField}>
            <label htmlFor="tracking-eta">Estimated delivery</label>
            <input
              id="tracking-eta"
              type="date"
              value={form.estimated_delivery_at}
              onChange={(event) => updateField("estimated_delivery_at", event.target.value)}
            />
          </div>
          <div className={styles.inlineFormActions}>
            <button type="submit" className="auth-form__submit" disabled={saving}>
              {saving ? "Saving…" : "Save tracking"}
            </button>
            <button
              type="button"
              className={styles.actionButton}
              onClick={handleRefresh}
              disabled={refreshing || !tracking?.number}
            >
              {refreshing ? "Refreshing…" : "Refresh from carrier"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ShipmentTrackingPanel;
