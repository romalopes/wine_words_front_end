import { useEffect, useMemo, useState } from "react";
import { winesApi, winePackageItemsApi } from "../services/api";
import InlineVintageCreateForm from "./InlineVintageCreateForm";
import InlineWineCreateForm from "./InlineWineCreateForm";
import styles from "./winePackages.module.css";

// Add or edit one wine line inside a package.
//
// The package's producer decides the catalogue on offer: the line lists that
// producer's wines and their vintages, so the reviewer picks a bottle instead of
// guessing a wine name. A wine or a vintage we have never recorded can be added
// right here (a new wine is created together with its first vintage), and the
// unmatched fallback stays for a bottle nobody can identify yet.
//
// We review a vintage of a wine — never a wine — so any line that is not
// unmatched carries a vintage_id.
function WinePackageItemForm({
  packageId,
  item,
  producerId,
  producerName,
  onSaved,
  onCancel,
}) {
  const [wines, setWines] = useState([]);
  const [loadingWines, setLoadingWines] = useState(false);
  const [filter, setFilter] = useState("");
  const [wineId, setWineId] = useState("");
  const [vintageId, setVintageId] = useState(
    item?.vintage_id ? String(item.vintage_id) : "",
  );
  const [panel, setPanel] = useState(null);
  const [unmatched, setUnmatched] = useState(Boolean(item) && !item.vintage_id);
  const [form, setForm] = useState({
    quantity: item?.quantity ?? 1,
    review_requested: item?.review_requested ?? true,
    condition: item?.condition || "",
    notes: item?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const editing = Boolean(item);

  const selectedWine = useMemo(
    () => wines.find((candidate) => String(candidate.id) === wineId) || null,
    [wines, wineId],
  );

  const visibleWines = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return wines;
    return wines.filter((candidate) => candidate.name.toLowerCase().includes(needle));
  }, [wines, filter]);

  // Load this producer's catalogue once; the reviewer filters it locally.
  useEffect(() => {
    if (!producerId) return undefined;

    let cancelled = false;

    async function load() {
      setLoadingWines(true);
      try {
        const data = await winesApi.search({ producerId });
        if (!cancelled) setWines(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load this producer's wines");
        }
      } finally {
        if (!cancelled) setLoadingWines(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [producerId]);

  // An edited line arrives without its wine, so recover it from the vintage.
  useEffect(() => {
    if (!item?.vintage_id || wineId || wines.length === 0) return;

    const owner = wines.find((candidate) =>
      (candidate.vintages || []).some(
        (vintage) => String(vintage.id) === String(item.vintage_id),
      ),
    );

    if (owner) {
      setWineId(String(owner.id));
      setUnmatched(false);
    }
  }, [wines, item, wineId]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function vintageLabel(vintage) {
    return vintage.no_vintage ? `NV (${vintage.year})` : String(vintage.year);
  }

  function chooseWine(nextId) {
    setWineId(nextId);
    setUnmatched(false);

    const next = wines.find((candidate) => String(candidate.id) === nextId);
    // Preselect the newest vintage; the reviewer can change it.
    setVintageId(next?.vintages?.[0]?.id ? String(next.vintages[0].id) : "");
  }

  function handleVintageCreated(vintage) {
    setPanel(null);
    setWines((current) =>
      current.map((candidate) =>
        String(candidate.id) === wineId
          ? { ...candidate, vintages: [...(candidate.vintages || []), vintage] }
          : candidate,
      ),
    );
    setVintageId(String(vintage.id));
  }

  function handleWineCreated({ wine, vintageId: createdVintageId }) {
    setPanel(null);
    setFilter("");
    setWines((current) =>
      [...current.filter((candidate) => candidate.id !== wine.id), wine].sort(
        (a, b) => a.name.localeCompare(b.name),
      ),
    );
    setWineId(String(wine.id));
    setVintageId(String(createdVintageId));
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
        setError("Pick a wine and a vintage, or mark the line as not in the catalogue yet.");
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

  // Creating a wine or a vintage takes over this form: both panels post their own
  // request, so they must not be nested inside the line's <form> element.
  if (panel === "wine") {
    return (
      <InlineWineCreateForm
        producerId={producerId}
        producerName={producerName}
        defaultName={filter.trim()}
        onCreated={handleWineCreated}
        onCancel={() => setPanel(null)}
      />
    );
  }

  if (panel === "vintage") {
    return (
      <InlineVintageCreateForm
        wine={selectedWine}
        onCreated={handleVintageCreated}
        onCancel={() => setPanel(null)}
      />
    );
  }

  return (
    <form className={styles.inlineForm} onSubmit={handleSubmit}>
      {error && <p className="wine-management__error">{error}</p>}

      {!unmatched && (
        <>
          <p className={styles.cellMuted}>
            Wines from <strong>{producerName || "this producer"}</strong>. Pick the wine
            and then the vintage that arrived — we review a vintage of a wine.
          </p>

          <div className={styles.filterField} style={{ flex: "1 1 12rem" }}>
            <label htmlFor="item-wine-filter">Filter wines</label>
            <input
              id="item-wine-filter"
              type="search"
              placeholder="Start typing a wine name…"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </div>

          <div className={styles.filterField} style={{ flex: "1 1 14rem" }}>
            <label htmlFor="item-wine">Wine</label>
            <select
              id="item-wine"
              value={wineId}
              disabled={loadingWines || visibleWines.length === 0}
              onChange={(event) => chooseWine(event.target.value)}
            >
              <option value="">
                {loadingWines
                  ? "Loading…"
                  : visibleWines.length === 0
                    ? "No wines to pick"
                    : "Select a wine…"}
              </option>
              {visibleWines.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </div>

          {selectedWine && (selectedWine.vintages || []).length > 0 && (
            <div className={styles.filterField}>
              <label htmlFor="item-vintage">Vintage</label>
              <select
                id="item-vintage"
                required
                value={vintageId}
                onChange={(event) => setVintageId(event.target.value)}
              >
                {(selectedWine.vintages || []).map((vintage) => (
                  <option key={vintage.id} value={vintage.id}>
                    {vintageLabel(vintage)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!loadingWines && wines.length === 0 && (
            <p className={styles.cellMuted}>
              {producerName || "This producer"} has no wines in the catalogue yet — add
              the first one below.
            </p>
          )}

          {selectedWine && (selectedWine.vintages || []).length === 0 && (
            <p className={styles.cellMuted}>
              <strong>{selectedWine.name}</strong> has no vintages recorded yet — add the
              vintage that arrived.
            </p>
          )}

          <div className={styles.inlineFormActions}>
            {selectedWine && (
              <button
                type="button"
                className="wine-btn wine-btn--secondary"
                onClick={() => setPanel("vintage")}
              >
                Add a vintage
              </button>
            )}
            <button
              type="button"
              className="wine-btn wine-btn--secondary"
              onClick={() => setPanel("wine")}
            >
              Add a new wine
            </button>
          </div>
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
        <button type="submit" className="wine-btn wine-btn--primary wine-btn--lg" disabled={saving}>
          {saving ? "Saving…" : editing ? "Save Line" : "Add Line"}
        </button>
        <button type="button" className="wine-btn wine-btn--secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default WinePackageItemForm;
