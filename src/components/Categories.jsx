import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { categoriesApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { canManageWinesRole } from "../constants/roles";

const TYPE_TABS = [
  { key: "wine", label: "Wine categories", sortKey: "sort_order_wine", flag: "for_wine" },
  { key: "review", label: "Review categories", sortKey: "sort_order_review", flag: "for_review" },
  { key: "article", label: "Article categories", sortKey: "sort_order_article", flag: "for_article" },
];

const emptyForm = {
  name: "",
  for_wine: false,
  for_review: false,
  for_article: false,
};

function Categories() {
  const { user } = useAuth();
  const canManage = canManageWinesRole(user);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [mode, setMode] = useState("create"); // "create" | "edit"
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("wine");
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await categoriesApi.list();
      setCategories(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
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
        name: form.name.trim(),
        for_wine: form.for_wine,
        for_review: form.for_review,
        for_article: form.for_article,
      };
      if (mode === "edit" && editingId) {
        await categoriesApi.update(editingId, payload);
        setNotice(`Category "${payload.name}" updated.`);
      } else {
        await categoriesApi.create(payload);
        setNotice(`Category "${payload.name}" created.`);
      }
      resetForm();
      await loadCategories();
    } catch (err) {
      setError(err.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(category) {
    setMode("edit");
    setEditingId(category.id);
    setForm({
      name: category.name || "",
      for_wine: !!category.for_wine,
      for_review: !!category.for_review,
      for_article: !!category.for_article,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(category) {
    const message = 'Delete category' + JSON.stringify(category.name) + '? This cannot be undone.';
    if (!window.confirm(message)) return;
    setError(null);
    setNotice(null);
    try {
      await categoriesApi.remove(category.id);
      setNotice('Category "' + category.name + '" deleted.');
      if (editingId === category.id) { resetForm(); }
      await loadCategories();
    } catch (err) {
      setError(err.message || 'Failed to delete category');
    }
  }



  const tab = TYPE_TABS.find((t) => t.key === activeTab);
  const tabCategories = categories
    .filter((c) => c[tab.flag])
    .sort((a, b) => (a[tab.sortKey] ?? 9999) - (b[tab.sortKey] ?? 9999));

  function handleDragStart(category) {
    setDragId(category.id);
  }

  function handleDragOver(e, category) {
    e.preventDefault();
    setDragOverId(category.id);
  }

  function handleDragLeave() {
    setDragOverId(null);
  }

  async function handleDrop(e, targetCategory) {
    e.preventDefault();
    setDragOverId(null);
    const sourceId = dragId;
    setDragId(null);
    if (!sourceId || sourceId === targetCategory.id) return;

    // Reorder locally, then persist the new order to the backend immediately.
    const ids = tabCategories.map((c) => c.id);
    const fromIndex = ids.indexOf(sourceId);
    const toIndex = ids.indexOf(targetCategory.id);
    if (fromIndex === -1 || toIndex === -1) return;
    ids.splice(toIndex, 0, ids.splice(fromIndex, 1)[0]);

    setCategories((prev) =>
      prev.map((c) => {
        const index = ids.indexOf(c.id);
        return index === -1 ? c : { ...c, [tab.sortKey]: index + 1 };
      }),
    );

    try {
      await categoriesApi.reorder(tab.key, ids);
      setNotice(`Order saved for ${tab.label.toLowerCase()}.`);
    } catch (err) {
      setError(err.message || "Failed to save new order");
    }
    await loadCategories();
  }

  return (
    <div className="wine-app">
      <div className="wine-management__header">
        <div>
          <p className="wine-kicker">Settings</p>
          <h1>Categories</h1>
        </div>
      </div>

      {notice && <p className="wine-management__notice">{notice}</p>}
      {error && <p className="wine-management__error">{error}</p>}

      <section className="wine-panel" style={{ marginBottom: "1.5rem" }}>
        <h2>{mode === "edit" ? `Edit: ${form.name}` : "New category"}</h2>
        {canManage ? (
        <form onSubmit={handleSubmit} className="category-form">
          <div className="category-form__row">
            <label htmlFor="category-name">Name</label>
            <input
              id="category-name"
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g. Red blends"
            />
          </div>
          <fieldset className="category-form__toggles">
            <legend>Applies to</legend>
            {TYPE_TABS.map((t) => (
              <label key={t.flag} className="category-form__toggle">
                <input
                  type="checkbox"
                  checked={form[t.flag]}
                  onChange={(e) => updateField(t.flag, e.target.checked)}
                />
                {t.flag.replace("for_", "").replace(/^\w/, (m) => m.toUpperCase())}
              </label>
            ))}
          </fieldset>
          <div className="category-form__actions">
            <button type="submit" className="auth-form__submit" disabled={saving}>
              {saving ? "Saving…" : mode === "edit" ? "Update category" : "Create category"}
            </button>
            {mode === "edit" && (
              <button type="button" className="card-action" onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>
        </form>
        ) : (
          <p className="wine-management__hint">Only Admin and Editor can manage categories.</p>
        )}
      </section>

      <div className="category-tabs" role="tablist">
        {TYPE_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={activeTab === t.key}
            className={`category-tab${activeTab === t.key ? " category-tab--active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="lede" style={{ fontSize: "0.85rem" }}>
        Drag and drop to reorder — every move is saved immediately.
      </p>

      {loading ? (
        <p className="wine-management__loading">Loading categories…</p>
      ) : tabCategories.length === 0 ? (
        <p className="wine-management__empty">No categories for this type yet.</p>
      ) : (
        <ul className="category-list">
          {tabCategories.map((category) => (
            <li
              key={category.id}
              className={`category-list__item${dragOverId === category.id ? " category-list__item--over" : ""}${dragId === category.id ? " category-list__item--dragging" : ""}`}
              draggable={canManage}
              onDragStart={canManage ? () => handleDragStart(category) : undefined}
              onDragOver={canManage ? (e) => handleDragOver(e, category) : undefined}
              onDragLeave={canManage ? handleDragLeave : undefined}
              onDrop={canManage ? (e) => handleDrop(e, category) : undefined}
              onDragEnd={canManage ? () => {
                setDragId(null);
                setDragOverId(null);
              } : undefined}
            >
              {canManage && (
              <span className="category-list__handle" aria-hidden="true">⠿</span>
              )}
              <span className="category-list__order">{category[tab.sortKey] ?? "—"}</span>
              <span className="category-list__name">
                <Link to={`/categories/${category.slug}`}>{category.name}</Link>
              </span>
              {canManage && (
              <>
              <button
                type="button"
                className="card-action"
                onClick={() => startEdit(category)}
              >
                Edit
              </button>
              <button
                type="button"
                className="card-action card-action--delete"
                onClick={() => handleDelete(category)}
              >
                Delete
              </button>
              </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Categories;
