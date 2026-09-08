import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { regionsApi, countriesApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { isAdmin, canManageGrapes } from "../constants/roles";

const emptyForm = {
  name: "",
  country_id: "",
  parent_id: "",
  is_state: false,
  is_appellation: false,
};

function typeLabel(region) {
  const labels = [];
  if (region.is_state) labels.push("State");
  if (region.is_appellation) labels.push("Appellation");
  return labels.length > 0 ? labels.join(" / ") : "Region";
}

// Tree node component for displaying regions recursively
function RegionTreeNode({ node, level, targetRegionId }) {
  const hasChildren = node.children && node.children.length > 0;
  const isCurrentRegion = node.id === targetRegionId;
  const wineCount = node.wine_count || 0;
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="region-tree-node">
      <div
        className="region-tree-node__content"
        style={{ paddingLeft: `${level * 1.5}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="region-tree__toggle region-tree__toggle--btn"
            onClick={toggleExpand}
            aria-expanded={isExpanded}
          >
            {isExpanded ? "-" : "+"}
          </button>
        ) : (
          <span className="region-tree__toggle region-tree__toggle--leaf">
            {" "}
          </span>
        )}
        <Link
          to={`/regions/${node.slug}`}
          className={`region-tree-node__name ${isCurrentRegion ? "region-tree-node__name--active" : ""}`}
        >
          {node.name}
          {hasChildren && (
            <span className="region-tree-node__type"> ({typeLabel(node)})</span>
          )}
        </Link>
        {wineCount > 0 && (
          <span className="region-tree-node__wine-count">
            {wineCount} wine{wineCount === 1 ? "" : "s"}
          </span>
        )}
      </div>
      {hasChildren && isExpanded && node.children && (
        <div className="region-tree-node__children">
          {node.children.map((child) => (
            <RegionTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              targetRegionId={targetRegionId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Regions() {
  const { user } = useAuth();
  const canManage = isAdmin(user) || canManageGrapes(user);
  const [treeData, setTreeData] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [mode, setMode] = useState("create");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [expandedCountries, setExpandedCountries] = useState(new Set());
  const [targetRegionId, setTargetRegionId] = useState(null);
  const [showOnlyWithWines, setShowOnlyWithWines] = useState(true);

  const displayTree = showOnlyWithWines
    ? treeData.filter((c) => (c.wine_count || 0) > 0)
    : treeData;

  const loadTreeData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await regionsApi.tree();
      setTreeData(Array.isArray(data) ? data : []);
      if (Array.isArray(data)) {
        const australiaIndex = data.findIndex(
          (c) => c.name.toLowerCase() === "australia",
        );
        if (australiaIndex !== -1) {
          setExpandedCountries(new Set([data[australiaIndex].id]));
        }
      }
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load regions tree");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTreeData();
    regionsApi
      .list()
      .then((data) => setCountries(Array.isArray(data) ? data : []))
      .catch(() => {});
    countriesApi
      .list()
      .then((data) => setCountries(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [loadTreeData]);

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

  function toggleCountry(countryId) {
    setExpandedCountries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(countryId)) {
        newSet.delete(countryId);
      } else {
        newSet.add(countryId);
      }
      return newSet;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.country_id) {
      setError("Name and Country are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        country_id: form.country_id ? parseInt(form.country_id, 10) : null,
        parent_id: form.parent_id ? parseInt(form.parent_id, 10) : null,
        is_state: form.is_state,
        is_appellation: form.is_appellation,
      };
      if (mode === "edit" && editingId) {
        await regionsApi.update(editingId, payload);
        setNotice(`Region "${payload.name}" updated.`);
      } else {
        await regionsApi.create(payload);
        setNotice(`Region "${payload.name}" created.`);
      }
      resetForm();
      await loadTreeData();
    } catch (err) {
      setError(err.message || "Failed to save region");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(region) {
    setMode("edit");
    setEditingId(region.id);
    setForm({
      name: region.name,
      country_id: region.country_id,
      parent_id: region.parent_id,
      is_state: region.is_state,
      is_appellation: region.is_appellation,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(region) {
    if (window.confirm(`Delete region "${region.name}"?`)) {
      try {
        await regionsApi.remove(region.id);
        setNotice(`Region "${region.name}" deleted.`);
        await loadTreeData();
      } catch (err) {
        setError(err.message || "Failed to delete region");
      }
    }
  }

  return (
    <div className="grapes-page">
      {error && <div className="flash flash--alert">{error}</div>}
      {notice && <div className="flash flash--notice">{notice}</div>}

      <section>
        <div className="section-header">
          <h2 className="section-header__title">Regions Tree</h2>
          <div className="section-header__actions">
            {canManage && !showForm && (
              <button
                type="button"
                className="btn-primary"
                onClick={openCreateForm}
              >
                + Add Region
              </button>
            )}
          </div>
        </div>

      {showForm && (
        <section>
          <div className="grapes-page__form-container">
            <form className="grape-form" onSubmit={handleSubmit}>
              <h2>{mode === "edit" ? "Edit Region" : "New Region"}</h2>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="region-name">Name *</label>
                  <input
                    type="text"
                    id="region-name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="region-country">Country *</label>
                  <select
                    id="region-country"
                    value={form.country_id}
                    onChange={(e) => updateField("country_id", e.target.value)}
                    disabled={saving || countries.length === 0}
                  >
                    <option value="">Select a country</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.flag_emoji} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="region-parent">Parent Region</label>
                  <select
                    id="region-parent"
                    value={form.parent_id || ""}
                    onChange={(e) =>
                      updateField("parent_id", e.target.value || null)
                    }
                    disabled={saving}
                  >
                    <option value="">No parent (top-level region)</option>
                    {countries
                      .map((c) =>
                        c.regions
                          ?.filter((r) => r.parent_id === null)
                          .map((r) => (
                            <option key={r.id + "-parent"} value={r.id}>
                              {r.name} ({c.name})
                            </option>
                          )),
                      )
                      .flat(2)
                      .filter(Boolean) || []}
                  </select>
                </div>
                <div className="form-group">
                  <div className="checkbox-label">
                    <input
                      type="checkbox"
                      id="region-is-state"
                      checked={form.is_state}
                      onChange={(e) =>
                        updateField("is_state", e.target.checked)
                      }
                    />
                    <label htmlFor="region-is-state">is State?</label>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <div className="checkbox-label">
                  <input
                    type="checkbox"
                    id="region-is-appellation"
                    checked={form.is_appellation}
                    onChange={(e) =>
                      updateField("is_appellation", e.target.checked)
                    }
                  />
                  <label htmlFor="region-is-appellation">is Appellation?</label>
                </div>
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {mode === "edit" ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

        <div className="region-tree-filter">
          <label className="region-tree-filter__label">
            <input
              type="checkbox"
              checked={showOnlyWithWines}
              onChange={(e) => setShowOnlyWithWines(e.target.checked)}
            />
            Only countries with wines
          </label>
        </div>

        {loading ? (
          <p className="grapes-page__loading">Loading regions…</p>
        ) : displayTree.length === 0 ? (
          <p className="grapes-page__empty">No countries or regions found.</p>
        ) : (
          <div className="region-tree-container">
            {displayTree.map((country) => {
              const countryWineCount = country.wine_count || 0;

              if (!country.regions?.length) return null;

              return (
                <div key={country.id} className="region-tree-country">
                  <div
                    className="region-tree-country__header"
                    onClick={() => toggleCountry(country.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleCountry(country.id);
                      }
                    }}
                  >
                    <span className="region-tree-country__toggle">
                      {expandedCountries.has(country.id) ? "-" : "+"}
                    </span>

                    <span className="region-tree-country__flag">
                      {country.flag_emoji}
                    </span>

                    <span className="region-tree-country__name">
                      {country.name}
                    </span>

                    <span className="region-tree-country__count">
                      {countryWineCount} wine{countryWineCount === 1 ? "" : "s"}
                    </span>
                  </div>

                  {expandedCountries.has(country.id) && (
                    <div className="region-tree-country__regions">
                      {country.regions?.map((region) => (
                        <RegionTreeNode
                          key={region.id}
                          node={region}
                          level={1}
                          targetRegionId={targetRegionId}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}

export default Regions;
