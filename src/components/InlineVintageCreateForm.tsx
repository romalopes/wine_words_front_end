// Inline vintage creation for the package line flow.
//
// Used when the wine exists in the catalogue but the bottle in the box is a
// vintage we have not recorded yet. Posts to vintages#create (nested under the
// wine slug) and returns the new vintage via onCreated so it can be selected
// immediately. The Vintage model requires a year, so a non-vintage wine still
// stores the current year alongside no_vintage: true.
import { useState } from "react";
import type { FormEvent } from "react";
import { vintagesApi } from "../services/api";
import { errorMessage } from "../utils/errors";
import styles from "./winePackages.module.css";

const currentYear = (): string => String(new Date().getFullYear());

interface InlineVintageCreateFormProps {
  /** The wine the new vintage belongs to; may be null before one is chosen. */
  wine: { slug?: string | null; name?: string | null } | null;
  defaultYear?: string;
  onCreated: (created: Awaited<ReturnType<typeof vintagesApi.create>>) => void;
  onCancel: () => void;
}

function InlineVintageCreateForm({
  wine,
  defaultYear = "",
  onCreated,
  onCancel,
}: InlineVintageCreateFormProps) {
  const [year, setYear] = useState<string>(defaultYear || currentYear());
  const [noVintage, setNoVintage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createVintage(event?: FormEvent<HTMLFormElement>): Promise<void> {
    event?.preventDefault();
    event?.stopPropagation();

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
      setError(errorMessage(err, "Failed to create vintage"));
      setSaving(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    void createVintage(event);
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
        <button
          type="button"
          className="wine-btn wine-btn--primary wine-btn--lg"
          disabled={saving}
          onClick={() => void createVintage()}
        >
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
