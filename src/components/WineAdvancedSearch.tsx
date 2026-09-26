import { useEffect, useState } from "react";
import RegionSearch from "./RegionSearch";
import GrapeSearch from "./GrapeSearch";
import { tasteParametersApi } from "../services/api";
import styles from "./WineAdvancedSearch.module.css";

// Mirrors Wine::COLORS and Wine::CLOSURES (wine.rb) in the Rails API.
const COLORS = ["Red", "White", "Rosé", "Dessert"];
const CLOSURES = [
  "Cork", "Screw cap", "Diam", "Crownseal", "Synthetic",
  "Glass Stopper", "Nomacorc PlantCorc", "Vino-Lok", "Agglomerate",
];

// Slugs must match Wine::TASTE_PARAMETER_FILTER_SLUGS in the API.
const TASTE_SLUGS = ["acidity", "alcohol-warmth", "body", "fruit-intensity", "sweetness", "tannin"];
const TASTE_MIN = 0;
const TASTE_MAX = 10;

const EMPTY_FORM = {
  name: "", producer_name: "", score_min: "", score_max: "",
  vintage_year_min: "", vintage_year_max: "", published_from: "", published_to: "",
  closure: "", color: "", price_min: "", price_max: "",
  drink_from_min: "", drink_from_max: "", drink_to_min: "", drink_to_max: "",
  alcohol_min: "", alcohol_max: "",
  sparkling: "", // "", "true", "false" — "" means "ignore"
  fortified: "",
};

const humanize = (slug) =>
  slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

// Sliders for the six searchable taste parameters (0-10 scale). Sliders at
// the extremes mean the parameter is not filtered.
function TasteParameterRanges({ taste, labels, onChange }) {
  return (
    <div className={`${styles.field} ${styles.fieldWide}`}>
      <span className={styles.sectionTitle}>
        Taste parameters <span className={styles.labelSub}>(move a slider to filter — score 0-10)</span>
      </span>
      <div className={styles.tasteGrid}>
        {TASTE_SLUGS.map((slug) => {
          const range = taste[slug] || { min: TASTE_MIN, max: TASTE_MAX };
          const active = range.min > TASTE_MIN || range.max < TASTE_MAX;
          return (
            <div key={slug} className={styles.tasteItem} style={active ? { borderColor: "#8a5a44" } : undefined}>
              <span className={styles.tasteName}>
                {labels[slug] || humanize(slug)}{active && " ✓"}
              </span>
              <div className={styles.tasteInputs}>
                <input type="range" min={TASTE_MIN} max={TASTE_MAX} value={range.min}
                  aria-label={`${slug} minimum`} onChange={(e) => onChange(slug, "min", e.target.value)} />
                <span className={styles.tasteValue}>{range.min} – {range.max}</span>
                <input type="range" min={TASTE_MIN} max={TASTE_MAX} value={range.max}
                  aria-label={`${slug} maximum`} onChange={(e) => onChange(slug, "max", e.target.value)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Min/max numeric range field pair for `base` + "_min" / "_max" form keys.
function RangeField({ base, label, hint, form, onChange, ...inputProps }) {
  return (
    <>
      <span className={styles.sectionTitle}>{label}</span>
      <div className={styles.field}>
        <label className={styles.label}>Min <span className={styles.labelSub}>({hint})</span></label>
        <input className={styles.input} type="number" name={`${base}_min`}
          value={form[`${base}_min`]} onChange={onChange} {...inputProps} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Max</label>
        <input className={styles.input} type="number" name={`${base}_max`}
          value={form[`${base}_max`]} onChange={onChange} {...inputProps} />
      </div>
    </>
  );
}

// Complex search form for the wines page. Every field is optional; blank
// values are stripped before the search runs.
export default function WineAdvancedSearch({ onSearch, onClear, open, onToggleOpen }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedGrapes, setSelectedGrapes] = useState([]);
  // slug -> { min, max }; full-range bounds mean "not filtered".
  const [taste, setTaste] = useState({});
  const [tasteLabels, setTasteLabels] = useState({});

  // Load the taste parameter catalogue once for friendly labels.
  useEffect(() => {
    let cancelled = false;
    tasteParametersApi.list().then((params) => {
      if (cancelled) return;
      const labels = {};
      (Array.isArray(params) ? params : []).forEach((tp) => {
        labels[tp.slug] = tp.label || humanize(tp.slug);
      });
      setTasteLabels(labels);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleTasteChange = (slug, bound, value) =>
    setTaste((prev) => ({
      ...prev,
      [slug]: { min: TASTE_MIN, max: TASTE_MAX, ...prev[slug], [bound]: Number(value) },
    }));

  function handleClear() {
    setForm(EMPTY_FORM);
    setSelectedRegions([]);
    setSelectedGrapes([]);
    setTaste({});
    onClear();
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Strip every blank value: only non-empty fields become query params.
    const params = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== "" && v != null),
    );
    if (selectedRegions.length > 0) params.region_ids = selectedRegions.map((r) => r.id);
    if (selectedGrapes.length > 0) params.grape_ids = selectedGrapes.map((g) => g.id);
    TASTE_SLUGS.forEach((slug) => {
      const range = taste[slug];
      if (!range) return;
      if (range.min > TASTE_MIN) params[`${slug}_min`] = range.min;
      if (range.max < TASTE_MAX) params[`${slug}_max`] = range.max;
    });
    onSearch(params);
    onToggleOpen(false);
  }

  const numRange = (base, label, hint, extra = {}) => (
    <RangeField key={base} base={base} label={label} hint={hint} form={form} onChange={handleChange} {...extra} />
  );

  const triSelect = (name, label) => (
    <label key={name} className={styles.checkbox}>
      {label}
      <select className={styles.select} name={name} value={form[name]} onChange={handleChange} style={{ width: "auto" }}>
        <option value="">Any</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    </label>
  );

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Advanced Wine Search</h2>
        <button type="button"
          className={`${styles.toggleBtn} ${open ? styles.toggleBtnActive : ""}`}
          onClick={() => onToggleOpen(!open)}>
          {open ? "Hide form" : "Show form"}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit}>
          <fieldset className={styles.section}>
            <div className={styles.grid}>
              <span className={styles.sectionTitle}>Wine</span>
              <div className={styles.field}>
                <label className={styles.label}>Name of wine</label>
                <input className={styles.input} type="text" name="name" value={form.name}
                  onChange={handleChange} placeholder="e.g. Bin 389" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Name of producer</label>
                <input className={styles.input} type="text" name="producer_name" value={form.producer_name}
                  onChange={handleChange} placeholder="e.g. Penfolds" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Color</label>
                <select className={styles.select} name="color" value={form.color} onChange={handleChange}>
                  <option value="">Any</option>
                  {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Type of closure</label>
                <select className={styles.select} name="closure" value={form.closure} onChange={handleChange}>
                  <option value="">Any</option>
                  {CLOSURES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Alcohol %</label>
                <div className={styles.rangePair}>
                  <input className={styles.input} type="number" step="0.1" name="alcohol_min"
                    value={form.alcohol_min} onChange={handleChange} placeholder="Min" />
                  <span className={styles.dateSeparator}>–</span>
                  <input className={styles.input} type="number" step="0.1" name="alcohol_max"
                    value={form.alcohol_max} onChange={handleChange} placeholder="Max" />
                </div>
              </div>
              <div className={`${styles.field} ${styles.fieldWide}`}>
                <div className={styles.checkboxRow}>
                  {triSelect("sparkling", "Sparkling")}
                  {triSelect("fortified", "Fortified")}
                </div>
              </div>

              <span className={styles.sectionTitle}>Vintages &amp; reviews</span>
              {numRange("vintage_year", "Vintage year", "year", { step: 1, min: 1900 })}
              {numRange("price", "Price of vintage", "currency", { step: "0.01", min: 0 })}
              {numRange("score", "Review score", "0-100", { step: 0.5, min: 0, max: 100 })}
              {numRange("drink_from", "Drink from (year)", "year", { step: 1 })}
              {numRange("drink_to", "Drink to (year)", "year", { step: 1 })}

              <div className={`${styles.field} ${styles.fieldWide}`}>
                <label className={styles.label}>Review published between</label>
                <div className={styles.dateRange}>
                  <input className={styles.input} type="date" name="published_from" value={form.published_from}
                    onChange={handleChange} aria-label="Published from" />
                  <span className={styles.dateSeparator}>→</span>
                  <input className={styles.input} type="date" name="published_to" value={form.published_to}
                    onChange={handleChange} aria-label="Published to" />
                </div>
              </div>

              <div className={`${styles.field} ${styles.fieldWide}`}>
                <label className={styles.label}>Country or Region</label>
                <RegionSearch selected={selectedRegions} onChange={setSelectedRegions} />
              </div>

              <div className={`${styles.field} ${styles.fieldWide}`}>
                <label className={styles.label}>Grape</label>
                <GrapeSearch selected={selectedGrapes} onChange={setSelectedGrapes} />
              </div>

              <TasteParameterRanges taste={taste} labels={tasteLabels} onChange={handleTasteChange} />
            </div>
          </fieldset>

          <div className={styles.actions}>
            <button type="submit" className={styles.searchBtn}>Search wines</button>
            <button type="button" className={styles.clearBtn} onClick={handleClear}>Clear</button>
          </div>
        </form>
      )}
    </div>
  );
}
