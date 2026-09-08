import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { grapesApi, winesApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { isAdmin, canManageGrapes, canManageWinesRole } from "../constants/roles";
import WineTable from "./WineTable";
import BackToSource from "./BackToSource";
import { useReturnToLink } from "../hooks/useReturnToLink";

const emptyForm = {
  name: "",
  color: "",
  origin_country: "",
  main_regions: [],
  synonyms: [],
  is_blending_grape: false,
  notes: [],
  serving: "",
  relevance: "",
};

const COLOR_OPTIONS = [
  { value: "red", label: "Red" },
  { value: "white", label: "White" },
  { value: "rosé", label: "Rosé" },
  { value: "orange", label: "Orange" },
];

function GrapeDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const returnToLink = useReturnToLink();
  const [grape, setGrape] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newRegion, setNewRegion] = useState("");
  const [newSynonym, setNewSynonym] = useState("");
  const [newNote, setNewNote] = useState("");

  const isWineManager = isAdmin(user) || canManageGrapes(user);
  // Admins, Reviewers and Editors may link wines to this grape.
  const canLinkWines = canManageWinesRole(user);

  // Inline wine search for linking wines to this grape.
  const [wineQuery, setWineQuery] = useState("");
  const [wineResults, setWineResults] = useState(null);
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState(null);

  const loadGrape = useCallback(async () => {
    try {
      setLoading(true);
      const data = await grapesApi.show(slug);
      setGrape(data);
      setForm({
        name: data.name || "",
        color: data.color || "",
        origin_country: data.origin_country || "",
        main_regions: data.main_regions || [],
        synonyms: data.synonyms || [],
        is_blending_grape: !!data.is_blending_grape,
        notes: data.notes || [],
        serving: data.serving || "",
        relevance: data.relevance || "",
      });
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load grape");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadGrape();
  }, [loadGrape]);

  // Debounced wine search for the linking UI.
  useEffect(() => {
    if (!canLinkWines) return undefined;
    const query = wineQuery.trim();
    if (query.length < 2) {
      setWineResults(null);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const results = await winesApi.search(query);
        if (!cancelled) setWineResults(results.slice(0, 8));
      } catch {
        if (!cancelled) setWineResults([]);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [wineQuery, canLinkWines]);

  async function handleLinkWine(wine) {
    if (!window.confirm(`Add "${wine.name}" to "${grape.name}"?`)) return;
    setLinking(true);
    setLinkError(null);
    try {
      await grapesApi.linkWine(slug, wine.slug);
      await loadGrape();
    } catch (err) {
      setLinkError(err.message || "Failed to link wine");
    } finally {
      setLinking(false);
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addArrayField(field, value, setter) {
    if (!value.trim()) return;
    if (form[field].includes(value.trim())) return;
    updateField(field, [...form[field], value.trim()]);
    setter("");
  }

  function removeArrayField(field, index) {
    updateField(field, form[field].filter((_, i) => i !== index));
  }
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        relevance: form.relevance === "" ? null : parseInt(form.relevance, 10),
      };
      await grapesApi.update(slug, payload);
      setNotice(`Grape "${payload.name}" updated.`);
      setIsEditing(false);
      await loadGrape();
    } catch (err) {
      setError(err.message || "Failed to save grape");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete grape "${grape.name}"? This cannot be undone.`)) return;
    setError(null);
    setNotice(null);
    try {
      await grapesApi.remove(slug);
      navigate("/grapes", { state: { notice: `Grape "${grape.name}" deleted.` } });
    } catch (err) {
      setError(err.message || "Failed to delete grape");
    }
  }

  if (loading) return <p className="loading">Loading grape…</p>;
  if (!grape) return <p className="empty">Grape not found.</p>;

  return (
    <div className="grapes-page">
      <div className="grapes-page__header">
        <BackToSource />
        <Link to="/grapes" className="back-link">← All Grapes</Link>
        {isWineManager && !isEditing && (
          <button type="button" className="btn-primary" onClick={() => setIsEditing(true)}>
            Edit Grape
          </button>
        )}
      </div>

      {error && <div className="flash flash--alert">{error}</div>}
      {notice && <div className="flash flash--notice">{notice}</div>}

      {isEditing ? (
        <section className="grape-form-section">
          <h2>Edit Grape</h2>
          <form onSubmit={handleSubmit} className="grape-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="grape-name">Name *</label>
                <input
                  id="grape-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Cabernet Sauvignon"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="grape-color">Color</label>
                <select
                  id="grape-color"
                  value={form.color}
                  onChange={(e) => updateField("color", e.target.value)}
                >
                  <option value="">Select color...</option>
                  {COLOR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="grape-origin">Origin Country</label>
                <input
                  id="grape-origin"
                  type="text"
                  value={form.origin_country}
                  onChange={(e) => updateField("origin_country", e.target.value)}
                  placeholder="e.g. France"
                />
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.is_blending_grape}
                  onChange={(e) => updateField("is_blending_grape", e.target.checked)}
                />
                Blending grape
              </label>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="grape-relevance">Relevance</label>
                <input
                  id="grape-relevance"
                  type="number"
                  value={form.relevance}
                  onChange={(e) => updateField("relevance", e.target.value)}
                  placeholder="e.g. 100"
                />
              </div>
            </div>
            <ArrayFieldInput
              label="Main Regions"
              items={form.main_regions}
              newValue={newRegion}
              setNewValue={setNewRegion}
              onAdd={() => addArrayField("main_regions", newRegion, setNewRegion)}
              onRemove={(idx) => removeArrayField("main_regions", idx)}
              placeholder="Add a region and press Enter"
            />

            <ArrayFieldInput
              label="Synonyms"
              items={form.synonyms}
              newValue={newSynonym}
              setNewValue={setNewSynonym}
              onAdd={() => addArrayField("synonyms", newSynonym, setNewSynonym)}
              onRemove={(idx) => removeArrayField("synonyms", idx)}
              placeholder="Add a synonym and press Enter"
            />

            <ArrayFieldInput
              label="Notes"
              items={form.notes}
              newValue={newNote}
              setNewValue={setNewNote}
              onAdd={() => addArrayField("notes", newNote, setNewNote)}
              onRemove={(idx) => removeArrayField("notes", idx)}
              placeholder="Add a tasting note and press Enter"
            />

            <div className="form-group">
              <label htmlFor="grape-serving">Serving Suggestions</label>
              <textarea
                id="grape-serving"
                value={form.serving}
                onChange={(e) => updateField("serving", e.target.value)}
                placeholder="Food pairing suggestions..."
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Update Grape"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="button" className="btn-action btn-action--delete" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="grape-detail">
          <h1>{grape.name}</h1>
          <ul className="facts" aria-label="Grape details">
            {grape.color && (
              <li><strong>Color:</strong> {grape.color}</li>
            )}
            {grape.origin_country && (
              <li><strong>Origin Country:</strong> {grape.origin_country}</li>
            )}
            {grape.relevance != null && (
              <li><strong>Relevance:</strong> {grape.relevance}</li>
            )}
            <li><strong>Blending Grape:</strong> {grape.is_blending_grape ? "Yes" : "No"}</li>
            {grape.main_regions?.length > 0 && (
              <li><strong>Main Regions:</strong> {grape.main_regions.join(", ")}</li>
            )}
            {grape.synonyms?.length > 0 && (
              <li><strong>Synonyms:</strong> {grape.synonyms.join(", ")}</li>
            )}
            {grape.notes?.length > 0 && (
              <li><strong>Notes:</strong> {grape.notes.join(", ")}</li>
            )}
            {grape.serving && (
              <li><strong>Serving:</strong> {grape.serving}</li>
            )}
          </ul>

          {isWineManager && (
            <div className="grape-detail__wine-linker">
              <h2>Link a Wine</h2>
              <div className="review-form__field">
                <label htmlFor="grape-wine-search">
                  Search wines by name to add them to {grape.name}
                </label>
                <input
                  id="grape-wine-search"
                  type="text"
                  value={wineQuery}
                  onChange={(e) => setWineQuery(e.target.value)}
                  placeholder="Search wines by name…"
                />
              </div>
              {linkError && <p className="review-form__error">{linkError}</p>}
              {wineResults != null &&
                (wineResults.length === 0 ? (
                  <p className="wine-management__empty-state">No matching wines.</p>
                ) : (
                  <ul
                    className="wine-list"
                    style={{ display: "grid", gap: 6, listStyle: "none", padding: 0 }}
                  >
                    {wineResults.map((wine) => {
                      const linkedHere = wine.grapes?.some(
                        (g) => String(g.id) === String(grape.id),
                      );
                      return (
                        <li
                          key={wine.slug}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            border: "1px solid #d8c8c0",
                            borderRadius: 8,
                            padding: "8px 12px",
                            background: "#fff",
                          }}
                        >
                          <strong>{wine.name}</strong>
                          {linkedHere ? (
                            <span style={{ color: "#2e7d43", fontWeight: 700 }}>
                              Linked here ✓
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="review-form__status-btn"
                              disabled={linking}
                              onClick={() => handleLinkWine(wine)}
                            >
                              Link
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ))}
            </div>
          )}

          <div className="grape-detail__wines">
            <h2>Wines</h2>
            {grape.wines?.length > 0 ? (
              <WineTable
                wines={grape.wines}
                onDeleted={(deleted) =>
                  setGrape((prev) => ({
                    ...prev,
                    wines: prev.wines.filter((w) => w.slug !== deleted.slug),
                  }))
                }
                linkContext={{ type: "grape", id: grape.id, name: grape.name }}
                onWineLinked={() => {
                  grapesApi.show(grape.id).then(setGrape).catch(() => {});
                }}
              />
            ) : (
              <p className="empty">No wines are associated with this grape yet.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function ArrayFieldInput({ label, items, newValue, setNewValue, onAdd, onRemove, placeholder }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="array-input-group">
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
        />
        <button type="button" onClick={onAdd} className="btn-add">
          Add
        </button>
      </div>
      <ul className="tags-list">
        {items.map((item, idx) => (
          <li key={idx} className="tag">
            {item}
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="tag-remove"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GrapeDetail;
