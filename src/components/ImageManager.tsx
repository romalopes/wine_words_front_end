import { useRef, useState } from "react";
import { imagesApi } from "../services/api";

// Interactive image manager used by the wine, review and article forms.
// Existing images can be reordered, promoted to primary, previewed in a
// lightbox and removed. New files upload immediately when imageableId is set,
// otherwise they are staged locally and reported via onFilesChange.
// Reorder / set-primary persist to the API; errors surface inline.
function ImageManager({
  imageableType,
  images = [],
  imageIds = [],
  imageableId,
  onFilesChange,
  onImagesChange,
}) {
  const [pending, setPending] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const currentImages = images.map((src, i) => ({ src, id: imageIds?.[i] }));

  function resetError() {
    if (error) setError(null);
  }

  async function handleFiles(files) {
    const list = Array.from(files || []);
    if (list.length === 0) return;
    resetError();
    if (imageableId) {
      setBusy(true);
      try {
        await imagesApi.upload(imageableType, imageableId, list);
        onImagesChange && onImagesChange();
      } catch (err) {
        setError(err.message || "Failed to upload image");
      } finally {
        setBusy(false);
      }
    } else {
      const next = [...pending, ...list];
      setPending(next);
      onFilesChange && onFilesChange(next);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSetPrimary(id) {
    if (!imageableId || !id) return;
    setBusy(true);
    resetError();
    try {
      await imagesApi.setPrimary(imageableType, imageableId, id);
      onImagesChange && onImagesChange();
    } catch (err) {
      setError(err.message || "Failed to set primary image");
    } finally {
      setBusy(false);
    }
  }

  function move(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= currentImages.length) return;
    const orderedIds = currentImages.map((img) => img.id);
    [orderedIds[index], orderedIds[target]] = [orderedIds[target], orderedIds[index]];
    setBusy(true);
    imagesApi
      .reorder(imageableType, imageableId, orderedIds)
      .then(() => onImagesChange && onImagesChange())
      .catch((err) => setError(err.message || "Failed to reorder images"))
      .finally(() => setBusy(false));
  }

  async function handleRemove(index, id) {
    setBusy(true);
    resetError();
    try {
      if (imageableId && id) {
        await imagesApi.destroy(imageableType, imageableId, id);
        onImagesChange && onImagesChange();
      } else {
        const next = pending.filter((_, i) => i !== index);
        setPending(next);
        onFilesChange && onFilesChange(next);
      }
    } catch (err) {
      setError(err.message || "Failed to remove image");
    } finally {
      setBusy(false);
    }
  }

  const previewIndex = preview ? currentImages.findIndex((img) => img.src === preview.src) : -1;
  function closePreview() {
    setPreview(null);
  }

  return (
    <div className="image-manager">
      {error && (
        <p className="image-manager__error" role="alert">
          {error}{" "}
          <button type="button" className="image-manager__error-dismiss" onClick={resetError}>
            dismiss
          </button>
        </p>
      )}

      <div
        className={`image-manager__dropzone${dragOver ? " image-manager__dropzone--over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current && inputRef.current.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current && inputRef.current.click();
          }
        }}
      >
        <span className="image-manager__dropzone-text">+ Add images</span>
        <span className="image-manager__dropzone-hint">Drag &amp; drop images here or click to browse</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="image-manager__input"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {currentImages.length > 0 && (
        <div className="image-manager__grid">
          {currentImages.map((img, i) => (
            <div key={img.id ?? i} className="image-manager__card">
              <button
                type="button"
                className="image-manager__thumb-btn"
                onClick={() => setPreview(img)}
                aria-label={`Preview image ${i + 1}`}
              >
                <img src={img.src} alt={`attachment ${i + 1}`} className="image-manager__thumb" />
              </button>
              <div className="image-manager__controls">
                <button type="button" className="image-manager__control" onClick={() => move(i, -1)} disabled={busy || i === 0} aria-label={`Move image ${i + 1} up`}>
                  ↑
                </button>
                <button type="button" className="image-manager__control" onClick={() => move(i, 1)} disabled={busy || i === currentImages.length - 1} aria-label={`Move image ${i + 1} down`}>
                  ↓
                </button>
                <button type="button" className="image-manager__control" onClick={() => handleSetPrimary(img.id)} disabled={busy || !img.id} aria-label={`Set image ${i + 1} as primary`}>
                  ★
                </button>
                <button type="button" className="image-manager__control image-manager__control--danger" onClick={() => handleRemove(i, img.id)} disabled={busy} aria-label={`Remove image ${i + 1}`}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div className="image-manager__grid">
          {pending.map((file, i) => (
            <div key={`p${i}`} className="image-manager__card image-manager__card--pending">
              <img src={URL.createObjectURL(file)} alt={`new ${i + 1}`} className="image-manager__thumb" />
              <div className="image-manager__controls">
                <button type="button" className="image-manager__control image-manager__control--danger" onClick={() => handleRemove(i)} aria-label={`Remove new image ${i + 1}`}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div className="image-manager__lightbox" onClick={closePreview}>
          <div className="image-manager__lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="image-manager__lightbox-close" onClick={closePreview} aria-label="Close preview">
              ×
            </button>
            {previewIndex > 0 && (
              <button type="button" className="image-manager__lightbox-nav image-manager__lightbox-nav--prev" onClick={() => setPreview(currentImages[previewIndex - 1])} aria-label="Previous image">
                ‹
              </button>
            )}
            <img src={preview.src} alt="Preview" className="image-manager__lightbox-img" />
            {previewIndex < currentImages.length - 1 && (
              <button type="button" className="image-manager__lightbox-nav image-manager__lightbox-nav--next" onClick={() => setPreview(currentImages[previewIndex + 1])} aria-label="Next image">
                ›
              </button>
            )}
            <div className="image-manager__lightbox-actions">
              <button type="button" onClick={() => handleSetPrimary(preview.id)} disabled={busy || !preview.id}>
                Set as primary
              </button>
              <button type="button" onClick={() => handleRemove(previewIndex, preview.id)} disabled={busy}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageManager;