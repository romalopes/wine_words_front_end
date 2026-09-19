// Inline wine + vintage creation for the package line flow.
//
// Basic info only (name, colour, optional designation, first vintage year),
// with the producer pre-filled AND locked — the line belongs to this
// package's producer. Posts wine + first vintage in ONE wines#create request
// (vintages_attributes) and returns { wine, vintageId } via onCreated so the
// line form can select both immediately.
import { useState } from "react";
import { winesApi } from "../services/api";
import { DEFAULT_COLOR } from "../data/wineVolumes";
import styles from "./winePackages.module.css";

// Mirrors Wine::COLORS (the backend is the source of truth; the model
// validates presence, not inclusion, so an extra value here would still save).
const COLOR_OPTIONS = ["Red", "White", "Rosé", "Dessert"];

const currentYear = () => String(new Date().getFullYear());

function InlineWineCreateForm({
  producerId,
  producerName,
  defaultName = "",
  defaultVintageYear = "",
  onCreated,
  onCancel,
}) {
  const [form, setForm] = useState({
    name: defaultName,
    color: DEFAULT_COLOR,
    designation_name: "",
    vintage_year: defaultVintageYear || currentYear(),
  });
  const [noVintage, setNoVintage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!producerId) {
      setError("This package has no producer, so a wine cannot be created here.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // The Vintage model requires a year, so a non-vintage wine still stores
      // the current year alongside no_vintage: true.
      const year = noVintage ? currentYear() : form.vintage_year;
      const payload = {
        name: form.name,
        color: form.color,
        designation_name: form.designation_name || null,
        producer_id: Number(producerId),
        vintages_attributes: [{ year: Number(year), no_vintage: noVintage }],
      };

      const created = await winesApi.create(payload);
      const vintage = (created.vintages || []).find(
        (candidate) => String(candidate.year) === String(year),
      );

      if (!vintage?.id) {
        throw new Error("Wine was created but its vintage could not be resolved");
      }

      onCreated({ wine: created, vintageId: vintage.id });
    } catch (err) {
      setError(err.message || "Failed to create wine");
      setSaving(false);
    }
  }

  return (
    <form className={styles.inlineForm} onSubmit={handleSubmit}>
      <p className={styles.cellMuted}>
        New wine for <strong>{producerName || "this producer"}</strong>. It is created
        with its first vintage, so the line can be reviewed straight away.
      </p>

      {error && <p className="wine-management__error">{error}</p>}

      <div className={styles.filterField} style={{ flex: "1 1 14rem" }}>
        <label htmlFor="inline-wine-name">Wine name</label>
        <input
          id="inline-wine-name"
          type="text"
          required
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="e.g. Château Margaux"
        />
      </div>

      <div className={styles.filterField}>
        <label htmlFor="inline-wine-color">Colour</label>
        <select
          id="inline-wine-color"
          value={form.color}
          onChange={(event) => updateField("color", event.target.value)}
        >
          {COLOR_OPTIONS.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterField} style={{ flex: "1 1 12rem" }}>
        <label htmlFor="inline-wine-designation">Designation (optional)</label>
        <input
          id="inline-wine-designation"
          type="text"
          value={form.designation_name}
          onChange={(event) => updateField("designation_name", event.target.value)}
          placeholder="e.g. Estate"
        />
      </div>

      <div className={styles.filterField}>
        <label htmlFor="inline-wine-year">First vintage</label>
        <input
          id="inline-wine-year"
          type="number"
          min="1900"
          max="2100"
          required={!noVintage}
          disabled={noVintage}
          value={noVintage ? currentYear() : form.vintage_year}
          onChange={(event) => updateField("vintage_year", event.target.value)}
        />
      </div>

      <label className={styles.checkboxField} htmlFor="inline-wine-nv">
        <input
          id="inline-wine-nv"
          type="checkbox"
          checked={noVintage}
          onChange={(event) => setNoVintage(event.target.checked)}
        />
        Non-vintage (NV)
      </label>

      <div className={styles.inlineFormActions}>
        <button type="submit" className="wine-btn wine-btn--primary wine-btn--lg" disabled={saving}>
          {saving ? "Creating…" : "Create wine + vintage"}
        </button>
        <button type="button" className="wine-btn wine-btn--secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default InlineWineCreateForm;