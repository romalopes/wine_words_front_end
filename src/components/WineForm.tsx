import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  winesApi,
  tasteParametersApi,
  imagesApi,
  categoriesApi,
} from "../services/api";
import ImageManager from "./ImageManager";
import ProducerSearch from "./ProducerSearch";
import GrapeSearch from "./GrapeSearch";
import RegionSearch from "./RegionSearch";
import {
  VOLUMES,
  DEFAULT_VOLUME,
  DEFAULT_COLOR,
  DEFAULT_CLOSURE,
  DEFAULT_ALCOHOL_PERCENTAGE,
} from "../data/wineVolumes";

const INITIAL_VINTAGE = { year: "", prompt: "", price: "", no_vintage: false };

function WineForm() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(slug);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    color: DEFAULT_COLOR,
    closure: DEFAULT_CLOSURE,
    alcohol_percentage: String(DEFAULT_ALCOHOL_PERCENTAGE),
    volume_ml: String(DEFAULT_VOLUME),
    prompt: "",
    producer_id: "",
    producer_name: "",
    designation_name: "",
    category_ids: [],
    fortified: false,
    sparkling: false,
  });

  const [selectedGrapes, setSelectedGrapes] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [autoName, setAutoName] = useState(true);

  const [wineCategories, setWineCategories] = useState([]);
  const [vintages, setVintages] = useState([]);
  const [tasteParams, setTasteParams] = useState([]);
  const [tasteScores, setTasteScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [images, setImages] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [existingImageIds, setExistingImageIds] = useState([]);
  useEffect(() => {
    async function initFormData() {
      try {
        setLoading(true);
        // 1. Load taste parameters and wine categories (for this form)
        const [globalParams, wineCats] = await Promise.all([
          tasteParametersApi.list(),
          categoriesApi.list("wine"),
        ]);
        const paramsArray = Array.isArray(globalParams) ? globalParams : [];
        setTasteParams(paramsArray);
        setWineCategories(wineCats || []);

        // Set baseline defaults
        let initialScores = paramsArray.map((p) => ({
          id: null, // join table record id
          taste_parameter_id: p.id,
          taste_parameter_slug: p.slug,
          score: 3,
        }));

        // 2. If editing, load the wine and merge its existing scores
        if (isEditing) {
          const wineData = await winesApi.show(slug);

          setExistingImages(wineData.images || []);
          setExistingImageIds(wineData.image_ids || []);

          setFormData({
            id: wineData.id || null,
            name: wineData.name || "",
            color: wineData.color || DEFAULT_COLOR,
            closure: wineData.closure || DEFAULT_CLOSURE,
            alcohol_percentage:
              wineData.alcohol_percentage != null
                ? String(wineData.alcohol_percentage)
                : String(DEFAULT_ALCOHOL_PERCENTAGE),
            volume_ml:
              wineData.volume_ml != null
                ? String(wineData.volume_ml)
                : String(DEFAULT_VOLUME),
            prompt: wineData.prompt || "",
            producer_id: wineData.producer?.id || "",
            producer_name: wineData.producer?.name || "",
            designation_name: wineData.designation_name || "",
            category_ids: (wineData.categories || []).map((c) => c.id),
            sparkling: Boolean(wineData.sparkling),
            fortified: Boolean(wineData.fortified),
          });

          setSelectedGrapes(wineData.grapes || []);
          setAutoName(false);
          setSelectedRegions(wineData.regions || []);

          setVintages(
            (wineData.vintages || []).map((v) => ({
              id: v.id,
              year: v.year,
              prompt: v.prompt || "",
              price: v.price ?? "",
              no_vintage: Boolean(v.no_vintage),
            })),
          );

          if (wineData.parameters && wineData.parameters.length > 0) {
            initialScores = initialScores.map((scoreObj) => {
              const matchingParam = wineData.parameters.find(
                (wp) => wp.taste_parameter_id === scoreObj.taste_parameter_id,
              );
              if (matchingParam) {
                return {
                  ...scoreObj,
                  id: matchingParam.id,
                  score: matchingParam.score,
                };
              }
              return scoreObj;
            });
          }
        }

        setTasteScores(initialScores);
      } catch (err) {
        setError(err.message || "Failed to initialize form options");
      } finally {
        setLoading(false);
      }
    }

    initFormData();
  }, [slug, isEditing]);

  useEffect(() => {
    if (!autoName) return;
    const producer = (formData.producer_name || "").trim();
    const designation = (formData.designation_name || "").trim();
    const grape = (selectedGrapes[0] || {}).name;
    const grapeName = grape ? grape.trim() : "";
    const parts = [producer, designation, grapeName].filter(Boolean);
    const computed = parts.join(" ");
    setFormData((prev) => ({ ...prev, name: computed }));
  }, [
    formData.producer_name,
    formData.designation_name,
    selectedGrapes,
    autoName,
  ]);

  function handleChange(e) {
    if (e.target.name === "name" && autoName) setAutoName(false);
    const target = e.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setFormData((prev) => ({ ...prev, [target.name]: value }));
  }

  function handleVintageChange(index, field, value) {
    setVintages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function handleTasteChange(index, value) {
    setTasteScores((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], score: Number(value) };
      }
      return updated;
    });
  }

  function addVintage() {
    setVintages((prev) => [...prev, { ...INITIAL_VINTAGE }]);
  }

  function removeVintage(index) {
    setVintages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleProducerChange(id, name) {
    setFormData((prev) => ({
      ...prev,
      producer_id: id ? String(id) : "",
      producer_name: name || "",
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (!formData.producer_id) {
        throw new Error("Please select or create a producer");
      }

      const wineTasteParametersAttributes = tasteScores.map((ts) => ({
        id: ts.id || null,
        taste_parameter_id: ts.taste_parameter_id,
        taste_parameter_slug: ts.taste_parameter_slug,
        score: ts.score,
      }));

      const payload = {
        name: formData.name,
        color: formData.color,
        closure: formData.closure || null,
        alcohol_percentage: formData.alcohol_percentage
          ? parseFloat(formData.alcohol_percentage)
          : null,
        volume_ml: formData.volume_ml ? parseInt(formData.volume_ml, 10) : null,
        prompt: formData.prompt || null,
        producer_id: formData.producer_id
          ? parseInt(formData.producer_id, 10)
          : null,
        category_ids: formData.category_ids || [],
        sparkling: Boolean(formData.sparkling),
        fortified: Boolean(formData.fortified),
        grape_ids: selectedGrapes.map((g) => g.id),
        region_ids: selectedRegions.map((r) => r.id),
        vintages_attributes: vintages.map((v) => {
          const attr = {
            year: parseInt(v.year, 10),
            prompt: v.prompt || null,
            price:
              v.price === "" || v.price == null ? null : parseFloat(v.price),
            no_vintage: Boolean(v.no_vintage),
          };
          if (v.id) attr.id = v.id;
          return attr;
        }),
        wine_taste_parameters_attributes: wineTasteParametersAttributes,
      };

      if (isEditing) {
        await winesApi.update(slug, payload);
        if (images && images.length > 0) {
          await imagesApi.upload("wine", slug, images);
        }
        navigate(`/wines/${slug}`, { replace: true });
      } else {
        const result = await winesApi.create(payload);
        if (images && images.length > 0) {
          await imagesApi.upload("wine", result.slug, images);
        }
        navigate(`/wines/${result.slug}`, { replace: true });
      }
    } catch (err) {
      const messages =
        err.data?.errors?.join?.(", ") || err.data?.error || err.message;
      setError(messages || "Failed to save wine");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="wine-app">
        <p className="wine-management__loading">Loading…</p>
      </div>
    );
  }

  return (
    <div className="wine-app">
      <Link
        to={isEditing ? `/wines/${slug}` : "/wines"}
        className="wine-detail__back"
      >
        &larr; Back
      </Link>
      <div className="wine-management__header">
        <h1>{isEditing ? "Edit Wine" : "Add New Wine"}</h1>
      </div>
      {error && <p className="auth-form__error">{error}</p>}
      <form onSubmit={handleSubmit} className="wine-form">
        <div className="wine-form__fields">
          <div className="auth-form__field">
            <ProducerSearch
              value={formData.producer_name}
              onChange={handleProducerChange}
            />
          </div>
          <label className="auth-form__field">
            <span>Designation Name</span>
            <input
              type="text"
              name="designation_name"
              value={formData.designation_name}
              onChange={handleChange}
              placeholder="e.g. Reserve"
            />
          </label>
          <div className="auth-form__field">
            <GrapeSearch
              selected={selectedGrapes}
              onChange={setSelectedGrapes}
            />
          </div>
          <label className="auth-form__field">
            <span>Name *</span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              readOnly={autoName}
            />
          </label>
          <label
            className="auth-form__field"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <input
              type="checkbox"
              checked={autoName}
              onChange={() => setAutoName(autoName ? false : true)}
            />
            <span>Auto-generate name</span>
          </label>
          <div className="auth-form__field">
            <RegionSearch
              selected={selectedRegions}
              onChange={setSelectedRegions}
            />
          </div>
          <label className="auth-form__field auth-form__field--checkbox">
            <input
              type="checkbox"
              name="sparkling"
              checked={formData.sparkling}
              onChange={handleChange}
            />
            <span>Sparkling ✨</span>
          </label>
          <label className="auth-form__field auth-form__field--checkbox">
            <input
              type="checkbox"
              name="fortified"
              checked={formData.fortified}
              onChange={handleChange}
            />
            <span>Fortified 🍷</span>
          </label>
          <div className="auth-form__field">
            <span>Categories</span>
            <div className="category-checkboxes">
              {wineCategories.map((cat) => (
                <label key={cat.id} className="category-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.category_ids.includes(cat.id)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData((prev) => ({
                        ...prev,
                        category_ids: checked
                          ? [...prev.category_ids, cat.id]
                          : prev.category_ids.filter((id) => id !== cat.id),
                      }));
                    }}
                  />
                  {cat.name}
                </label>
              ))}
            </div>
          </div>
          <label className="auth-form__field">
            <span>Colour * </span>
            <select
              name="color"
              value={formData.color}
              onChange={handleChange}
              required
            >
              <option value="">Select colour…</option>
              <option value="Red">Red</option>
              <option value="White">White</option>
              <option value="Rosé">Rosé</option>
              <option value="Orange">Orange</option>
              <option value="Dessert">Dessert</option>
            </select>
          </label>
          <label className="auth-form__field">
            <span>Closure *</span>
            <select
              name="closure"
              value={formData.closure}
              onChange={handleChange}
              required
            >
              <option value="">Select closure…</option>
              <option value="Cork">Cork</option>
              <option value="Screw cap">Screw cap</option>
              <option value="Diam">Diam</option>
              <option value="Crownseal">Crownseal</option>
              <option value="Synthetic">Synthetic</option>
              <option value="Glass Stopper">Glass Stopper</option>
              <option value="Nomacorc PlantCorc">Nomacorc PlantCorc</option>
              <option value="Agglomerate">Agglomerate</option>
            </select>
          </label>
          <div className="wine-form__row">
            <label className="auth-form__field wine-form__row-item">
              <span>Alcohol % *</span>
              <input
                type="number"
                name="alcohol_percentage"
                value={formData.alcohol_percentage}
                onChange={handleChange}
                step="0.1"
                min="0"
                max="25"
                placeholder="e.g. 13.5"
                required
              />
            </label>
            <label className="auth-form__field wine-form__row-item">
              <span>Volume (ml) *</span>
              <select
                name="volume_ml"
                value={formData.volume_ml || ""}
                onChange={handleChange}
                required
              >
                {VOLUMES.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="auth-form__field">
            <span>Prompt (optional)</span>
            <textarea
              name="prompt"
              value={formData.prompt}
              onChange={handleChange}
              rows={3}
              placeholder="Description or notes about this wine"
            />
          </label>
        </div>

        <div className="wine-form__section">
          <div className="wine-form__vintages-header">
            <h2>Taste Parameters</h2>
          </div>
          <div className="wine-form__params">
            {tasteParams.map((tp, index) => {
              const currentScore = tasteScores[index]?.score ?? 3;
              return (
                <label className="wine-slider" key={tp.slug}>
                  <span className="wine-slider__top">
                    <strong>{tp.label}</strong>
                    <output>{currentScore}</output>
                  </span>
                  <input
                    max="5"
                    min="1"
                    type="range"
                    value={currentScore}
                    onChange={(e) => handleTasteChange(index, e.target.value)}
                  />
                  <span className="wine-slider__scale">
                    <small>{tp.low}</small>
                    <small>{tp.high}</small>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="wine-form__vintages">
          <div className="wine-form__vintages-header">
            <h2>Vintages</h2>
            <button
              type="button"
              className="wine-form__add-vintage"
              onClick={addVintage}
            >
              + Add Vintage
            </button>
          </div>
          {vintages.length === 0 && (
            <p className="wine-management__empty-state">
              No vintages added yet. Click "+ Add Vintage" to add one.
            </p>
          )}
          {vintages.map((vintage, index) => (
            <div key={index} className="wine-form__vintage-row">
              <label className="auth-form__field wine-form__vintage-year">
                <span>Year *</span>
                <input
                  type="number"
                  value={vintage.year}
                  onChange={(e) =>
                    handleVintageChange(index, "year", e.target.value)
                  }
                  min={1900}
                  max={new Date().getFullYear() + 5}
                  required
                  placeholder="e.g. 2020"
                />
              </label>
              <label className="auth-form__field">
                <span>Price</span>
                <input
                  type="number"
                  value={vintage.price}
                  onChange={(e) =>
                    handleVintageChange(index, "price", e.target.value)
                  }
                  min={0}
                  step={0.01}
                  placeholder="e.g. 89.50"
                />
              </label>
              <label
                className="auth-form__field"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(vintage.no_vintage)}
                  onChange={(e) =>
                    handleVintageChange(index, "no_vintage", e.target.checked)
                  }
                />
                <span>NV</span>
              </label>
              <label className="auth-form__field wine-form__vintage-prompt">
                <span>Prompt</span>
                <input
                  type="text"
                  value={vintage.prompt}
                  onChange={(e) =>
                    handleVintageChange(index, "prompt", e.target.value)
                  }
                  placeholder="Tasting notes for this vintage"
                />
              </label>
              <button
                type="button"
                className="wine-form__remove-vintage"
                onClick={() => removeVintage(index)}
                title="Remove vintage"
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        <div className="image-manager">
          <span className="image-manager__label">
            Images (click + to add, × to remove)
          </span>
          <ImageManager
            imageableType="wine"
            images={existingImages}
            imageIds={existingImageIds}
            imageableId={isEditing ? slug : null}
            onFilesChange={(files) => setImages(files)}
            onImagesChange={async () => {
              if (isEditing) {
                const reloaded = await winesApi.show(slug);
                setExistingImages(reloaded.images || []);
                setExistingImageIds(reloaded.image_ids || []);
              }
            }}
          />
        </div>

        <div className="wine-form__actions">
          <button
            type="submit"
            className="auth-form__submit"
            disabled={submitting}
          >
            {submitting ? "Saving…" : isEditing ? "Update Wine" : "Create Wine"}
          </button>
          <Link
            to={isEditing ? `/wines/${slug}` : "/wines"}
            className="wine-form__cancel"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default WineForm;
