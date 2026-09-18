import { useState } from "react";
import { winesApi, winePackageItemsApi } from "../services/api";
import styles from "./winePackages.module.css";

// Add or edit one wine line inside a package.
//
// The wine is optional on purpose: an unexpected box may contain a wine that is
// not in the catalogue yet, and an unmatched line is still recorded (it just
// cannot produce a review until it is matched).
function WinePackageItemForm({ packageId, item, onSaved, onCancel }) {
  const [wineQuery, setWineQuery] = useState("");
  const [wineResults, setWineResults] = useState([]);
  const [wine, setWine] = useState(null);
  const [vintageId, setVintageId] = useState(item?.vintage_id ? String(item.vintage_id) : "");
  const [unmatched, setUnmatched] = useState(false);
  const [form, setForm] = useState({
    quantity: item?.quantity ?? 1,
    review_requested: item?.review_requested ?? true,
    condition: item?.condition || "",
    notes: item?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const editing = Boolean(item);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function searchWines(event) {
    event.preventDefault();
    const query = wineQuery.trim();
    if (query.length < 2) return;

    try {
      const data = await winesApi.search(query);
      setWineResults(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || "Could not search wines");
    }
  }

  function chooseWine(next) {
    setWine(next);
    setWineResults([]);
    setUnmatched(false);
    // Preselect the newest vintage; the reviewer can change it.
    setVintageId(next.vintages?.[0]?.id ? String(next.vintages[0].id) : "");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        quantity: Number(form.quantity) || 1,
        review_requested: Boolean(form.review_requested),
        condition: form.condition || null,
        notes: form.notes || null,
      };

      if (unmatched) {
        payload.vintage_id = null;
      } else if (vintageId) {
        payload.vintage_id = Number(vintageId);
      } else if (!editing) {
        setError("Pick a wine, or mark the line as not in the catalogue yet.");
        setSaving(false);
        return;
      }

      const saved = editing
        ? await winePackageItemsApi.update(packageId, item.id, payload)
        : await winePackageItemsApi.create(packageId, payload);

      onSaved(saved);
    } catch (err) {
      setError(err.message || "Failed to save this wine line");
      setSaving(false);
    }
  }

  return (
    <form className={styles.inlineForm} onSubmit={handleSubmit}>
      {error && <p className="wine-management__error">{error}</p>}

      {!editing && !unmatched && (
        <>
          <div className={styles.filterField}>
            <label htmlFor="item-wine">Wine</label>
            <input
              id="item-wine"
              type="search"
              placeholder="Search the catalogue"
              value={wineQuery}
              onChange={(event) => setWineQuery(event.target.value)}
            />
          </div>
          <button type="button" className={styles.actionButton} onClick={searchWines}>
            Search
          </button>

          {wineResults.length > 0 && (
            <div className={styles.filterField}>
              <label htmlFor="item-wine-pick">Match</label>
              <select
                id="item-wine-pick"
                value=""
                onChange={(event) => {
                  const picked = wineResults.find((w) => String(w.id) === event.target.value);
                  if (picked) chooseWine(picked);
                }}
              >
                <option value="">Select a wine…</option>
                {wineResults.map((result) => (
                  <option key={result.id} value={result.id}>
                    {result.name}
                    {result.producer?.name ? ` — ${result.producer.name}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {wine && wine.vintages?.length > 0 && (
            <div className={styles.filterField}>
              <label htmlFor="item-vintage">Vintage</label>
              <select
                id="item-vintage"
                value={vintageId}
                onChange={(event) => setVintageId(event.target.value)}
              >
                {wine.vintages.map((vintage) => (
                  <option key={vintage.id} value={vintage.id}>
                    {vintage.year}
                  </option>
                ))}
              </select>
            </div>
          )}

          {wine && wine.vintages?.length === 0 && (
            <p className={styles.cellMuted}>
              {wine.name} has no vintages yet — add one on the wine page first, or
              record this line as unmatched.
            </p>
          )}
        </>
      )}

      <label className={styles.checkboxField} htmlFor="item-unmatched">
        <input
          id="item-unmatched"
          type="checkbox"
          checked={unmatched}
          onChange={(event) => {
            setUnmatched(event.target.checked);
            if (event.target.checked) setVintageId("");
          }}
        />
        Not in the catalogue yet
      </label>

      <div className={styles.filterField}>
        <label htmlFor="item-quantity">Bottles</label>
        <input
          id="item-quantity"
          type="number"
          min="1"
          value={form.quantity}
          onChange={(event) => updateField("quantity", event.target.value)}
        />
      </div>

      <label className={styles.checkboxField} htmlFor="item-review-requested">
        <input
          id="item-review-requested"
          type="checkbox"
          checked={form.review_requested}
          onChange={(event) => updateField("review_requested", event.target.checked)}
        />
        Review requested
      </label>

      <div className={styles.filterField}>
        <label htmlFor="item-condition">Condition</label>
        <input
          id="item-condition"
          type="text"
          placeholder="sealed, damaged label…"
          value={form.condition}
          onChange={(event) => updateField("condition", event.target.value)}
        />
      </div>

      <div className={styles.filterField} style={{ flex: "1 1 14rem" }}>
        <label htmlFor="item-notes">Notes</label>
        <input
          id="item-notes"
          type="text"
          value={form.notes}
          onChange={(event) => updateField("notes", event.target.value)}
        />
      </div>

      <div className={styles.inlineFormActions}>
        <button type="submit" className="auth-form__submit" disabled={saving}>
          {saving ? "Saving…" : editing ? "Save Line" : "Add Line"}
        </button>
        <button type="button" className={styles.actionButton} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default WinePackageItemForm;
