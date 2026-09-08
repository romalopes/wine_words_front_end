import { useCallback, useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { countriesApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { isAdmin, canManageGrapes } from "../constants/roles";

const emptyForm = {
  name: "",
  code: "",
  continent: "",
  flag_emoji: "",
  is_wine_country: false,
};

const CONTINENT_OPTIONS = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania",
];

function Countries() {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState("name");
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [mode, setMode] = useState("create");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [onlyWineCountries, setOnlyWineCountries] = useState(true);

  const canManage = isAdmin(user) || canManageGrapes(user);

  const sortedCountries = useMemo(() => {
    const source = onlyWineCountries
      ? countries.filter((c) => c.is_wine_country)
      : countries;
    const sorted = [...source];
    switch (sortBy) {
      case "continent":
        sorted.sort(
          (a, b) =>
            (a.continent || "").localeCompare(b.continent || "") ||
            (a.name || "").localeCompare(b.name || ""),
        );
        break;
      case "name":
      default:
        sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
    }
    return sorted;
  }, [countries, sortBy, onlyWineCountries]);

  const loadCountries = useCallback(async () => {
    try {
      setLoading(true);
      const data = await countriesApi.list();
      setCountries(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load countries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setMode("create");
    setEditingId(null);
    setShowForm(false);
    setForm(emptyForm);
  }

  function openCreateForm() {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      setError("Name and ISO code are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        continent: form.continent || null,
        flag_emoji: form.flag_emoji || null,
        is_wine_country: Boolean(form.is_wine_country),
      };
      if (mode === "edit" && editingId) {
        await countriesApi.update(editingId, payload);
        setNotice(`Country "${payload.name}" updated.`);
      } else {
        await countriesApi.create(payload);
        setNotice(`Country "${payload.name}" created.`);
      }
      resetForm();
      await loadCountries();
    } catch (err) {
      setError(err.message || "Failed to save country");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(country) {
    setMode("edit");
    setEditingId(country.id);
    setShowForm(true);
    setForm({
      name: country.name || "",
      code: country.code || "",
      continent: country.continent || "",
      flag_emoji: country.flag_emoji || "",
      is_wine_country: Boolean(country.is_wine_country),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(country) {
    if (
      !window.confirm(
        `Delete country "${country.name}"? This cannot be undone.`,
      )
    )
      return;
    setError(null);
    setNotice(null);
    try {
      await countriesApi.remove(country.id);
      setNotice(`Country "${country.name}" deleted.`);
      if (editingId === country.id) resetForm();
      await loadCountries();
    } catch (err) {
      setError(err.message || "Failed to delete country");
    }
  }

  return (
    <div className="grapes-page">
      <h1 className="grapes-page__title">Countries</h1>

      {error && <div className="flash flash--alert">{error}</div>}
      {notice && <div className="flash flash--notice">{notice}</div>}

      {canManage && showForm && (
        <section className="grape-form-section">
          <h2>{mode === "edit" ? "Edit Country" : "New Country"}</h2>
          <form onSubmit={handleSubmit} className="grape-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="country-name">Name *</label>
                <input
                  id="country-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Portugal"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="country-code">ISO code (2 letters) *</label>
                <input
                  id="country-code"
                  type="text"
                  maxLength={2}
                  value={form.code}
                  onChange={(e) => updateField("code", e.target.value)}
                  placeholder="e.g. PT"
                  required
                  style={{ textTransform: "uppercase" }}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="country-continent">Continent</label>
                <select
                  id="country-continent"
                  value={form.continent}
                  onChange={(e) => updateField("continent", e.target.value)}
                >
                  <option value="">Select continent...</option>
                  {CONTINENT_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="country-flag">Flag emoji</label>
                <input
                  id="country-flag"
                  type="text"
                  value={form.flag_emoji}
                  onChange={(e) => updateField("flag_emoji", e.target.value)}
                  placeholder="e.g. 🇵🇹"
                />
              </div>
            </div>
            <div className="form-group">
              <label
                htmlFor="country-is-wine-country"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <input
                  id="country-is-wine-country"
                  type="checkbox"
                  checked={Boolean(form.is_wine_country)}
                  onChange={(e) =>
                    updateField("is_wine_country", e.target.checked)
                  }
                />
                Wine country (shows in wine-country filtered lists)
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : mode === "edit" ? "Update" : "Create"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section>
        <div className="section-header">
          <h2 className="section-header__title">All Countries</h2>
          <div className="section-header__actions">
            <label className="region-tree-filter">
              <input
                type="checkbox"
                checked={onlyWineCountries}
                onChange={(e) => setOnlyWineCountries(e.target.checked)}
              />
              Only show wine countries
            </label>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort countries"
            >
              <option value="name">Name</option>
              <option value="continent">Continent</option>
            </select>
            {canManage && !showForm && (
              <button
                type="button"
                className="btn-primary"
                onClick={openCreateForm}
              >
                + Add New Country
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <p className="grapes-page__loading">Loading countries…</p>
        ) : sortedCountries.length === 0 ? (
          <p className="grapes-page__empty">No countries found.</p>
        ) : (
          <table className="grapes-table">
            <thead>
              <tr>
                <th>Flag</th>
                <th>Name</th>
                <th>Code</th>
                <th>Continent</th>
                <th>Producers</th>
                <th>Wines</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sortedCountries.map((country, index) => (
                <tr
                  key={country.id}
                  className={
                    index % 2 === 0 ? "grapes-row--even" : "grapes-row--odd"
                  }
                >
                  <td>{country.flag_emoji || "—"}</td>
                  <td>
                    <Link
                      to={`/countries/${country.slug}`}
                      className="grapes-table__link"
                    >
                      {country.name}
                    </Link>
                  </td>
                  <td>{country.code}</td>
                  <td>{country.continent || "—"}</td>
                  <td>
                    {country.producers_count > 0 ? (
                      <Link
                        to={`/countries/${country.slug}#producers`}
                        className="grapes-table__link"
                      >
                        {country.producers_count} producer
                        {country.producers_count !== 1 ? "s" : ""}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {country.wines_count > 0 ? (
                      <Link
                        to={`/countries/${country.slug}#wines`}
                        className="grapes-table__link"
                      >
                        {country.wines_count} wine
                        {country.wines_count !== 1 ? "s" : ""}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  {canManage && (
                    <td className="actions">
                      <Link
                        to={`/countries/${country.slug}`}
                        className="btn-action"
                      >
                        Show
                      </Link>
                      <button
                        type="button"
                        className="btn-action"
                        onClick={() => startEdit(country)}
                      >
                        Edit
                      </button>
                      {/* <button
                        type="button"
                        className="btn-action btn-action--delete"
                        onClick={() => handleDelete(country)}
                      >
                        Delete
                      </button> */}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default Countries;
