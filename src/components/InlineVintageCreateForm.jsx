// Inline vintage creation for the package line flow.
//
// Used when the wine exists in the catalogue but the bottle in the box is a
// vintage we have not recorded yet. Posts to vintages#create (nested under the
// wine slug) and returns the new vintage via onCreated so it can be selected
// immediately. The Vintage model requires a year, so a non-vintage wine still
// stores the current year alongside no_vintage: true.
import { useState } from "react";
import { vintagesApi } from "../services/api";
import styles from "./winePackages.module.css";

const currentYear = () => String(new Date().getFullYear());

function InlineVintageCreateForm({ wine, defaultYear = "", onCreated, onCancel }) {
  const [year, setYear] = useState(defaultYear || currentYear());
  const [noVintage, setNoVintage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!wine?.slug) {
      setError("Select a wine before adding a vintage.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const storedYear = noVintage ? currentYear() : year;
      const created = await vintagesApi.create(wine.slug, {
        year: Number(storedYear),
        no_vintage: noVintage,
      });

      onCreated(created);
    } catch (err) {
      setError(err.message || "Failed to create vintage");
      setSaving(false);
    }
  }

  return (
    <form className={styles.inlineForm} onSubmit={handleSubmit}>
      <p className={styles.cellMuted}>
        Add a vintage to <strong>{wine?.name || "this wine"}</strong>.
      </p>

      {error && <p className="wine-management__error">{error}</p>}

      <div className={styles.filterField}>
        <label htmlFor="inline-vintage-year">Year</label>
        <input
          id="inline-vintage-year"
          type="number"
          min="1900"
          max="2100"
          required={!noVintage}
          disabled={noVintage}
          value={noVintage ? currentYear() : year}
          onChange={(event) => setYear(event.target.value)}
        />
      </div>

      <label className={styles.checkboxField} htmlFor="inline-vintage-nv">
        <input
          id="inline-vintage-nv"
          type="checkbox"
          checked={noVintage}
          onChange={(event) => setNoVintage(event.target.checked)}
        />
        Non-vintage (NV)
      </label>

      <div className={styles.inlineFormActions}>
        <button type="submit" className="wine-btn wine-btn--primary wine-btn--lg" disabled={saving}>
          {saving ? "Creating…" : "Add vintage"}
        </button>
        <button type="button" className="wine-btn wine-btn--secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default InlineVintageCreateForm;
