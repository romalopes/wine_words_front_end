import { useEffect, useId, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { loadTrix } from "../utils/loadTrix";
import { normalizeArticleBody } from "../utils/articleHtml";
import { countWritingWords } from "../utils/writingText";
import { errorMessage } from "../utils/errors";
import "./RichTextEditor.css";

interface Attachment {
  file?: File;
  setAttributes: (attributes: { url: string; href: string }) => void;
  setUploadProgress: (progress: number) => void;
  remove: () => void;
}
interface AttachmentEvent extends Event { attachment: Attachment }
interface FileEvent extends Event { file: File }
type TrixElement = HTMLElement & {
  value: string;
  editor: { loadHTML: (html: string) => void };
};

export interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  label?: string;
  large?: boolean;
  uploadImage?: ((file: File) => Promise<string>) | undefined;
  onUploadingChange?: (uploading: boolean) => void;
}

export default function RichTextEditor({
  value = "", onChange, placeholder = "", label = "Rich text", large = false,
  uploadImage, onUploadingChange,
}: RichTextEditorProps) {
  const id = useId();
  const host = useRef<HTMLDivElement>(null);
  const element = useRef<TrixElement | null>(null);
  const latest = useRef({ value, onChange, placeholder, label, uploadImage, onUploadingChange });
  latest.current = { value, onChange, placeholder, label, uploadImage, onUploadingChange };
  const lastValue = useRef(value);
  const syncing = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadCount, setUploadCount] = useState(0);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    let disposed = false;
    let removeListeners = () => {};
    const pending = new Set<Attachment>();
    setLoadError(false);
    setReady(false);
    void loadTrix().then(() => {
      if (disposed || !host.current) return;
      const input = document.createElement("input");
      input.type = "hidden";
      input.id = `${id}-input`;
      input.value = latest.current.value;
      const editor = document.createElement("trix-editor") as TrixElement;
      editor.setAttribute("input", input.id);
      editor.setAttribute("aria-label", latest.current.label);
      editor.setAttribute("placeholder", latest.current.placeholder);
      element.current = editor;
      lastValue.current = latest.current.value;
      let initialized = false;
      const initialize = () => {
        initialized = true;
        // Props may have changed while Trix initialized.
        if (latest.current.value !== lastValue.current) {
          syncing.current = true;
          editor.editor.loadHTML(latest.current.value);
          syncing.current = false;
        }
        lastValue.current = latest.current.value;
        setReady(true);
      };
      const change = () => {
        if (!initialized || syncing.current) return;
        lastValue.current = editor.value;
        latest.current.onChange?.(editor.value);
      };
      const updatePending = () => {
        setUploadCount(pending.size);
        latest.current.onUploadingChange?.(pending.size > 0);
      };
      const accept = (event: Event) => {
        const { file } = event as FileEvent;
        const valid = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)
          && file.size <= 10 * 1024 * 1024;
        if (!latest.current.uploadImage || !valid) {
          event.preventDefault();
          setUploadError(!latest.current.uploadImage
            ? "Save this article or review first, then reopen it to add inline images."
            : "Choose a JPG, PNG, WebP or GIF image up to 10 MB.");
        }
      };
      const add = (event: Event) => {
        const { attachment } = event as AttachmentEvent;
        if (!attachment.file) return;
        const upload = latest.current.uploadImage;
        if (!upload) { attachment.remove(); return; }
        pending.add(attachment);
        updatePending();
        setUploadError(null);
        void upload(attachment.file).then((url) => {
          if (disposed || !pending.has(attachment)) return;
          const parsed = new URL(url, window.location.origin);
          if (!["https:", "http:"].includes(parsed.protocol)) throw new Error("Invalid image URL");
          attachment.setAttributes({ url: parsed.href, href: parsed.href });
          attachment.setUploadProgress(100);
        }).catch((error: unknown) => {
          if (disposed || !pending.has(attachment)) return;
          setUploadError(errorMessage(error, "Image upload failed. Please try adding it again."));
          attachment.remove();
        }).finally(() => {
          if (disposed) return;
          pending.delete(attachment);
          updatePending();
        });
      };
      const remove = (event: Event) => {
        pending.delete((event as AttachmentEvent).attachment);
        updatePending();
      };
      const listeners: [string, EventListener][] = [
        ["trix-initialize", initialize], ["trix-change", change],
        ["trix-file-accept", accept], ["trix-attachment-add", add],
        ["trix-attachment-remove", remove],
      ];
      listeners.forEach(([name, handler]) => editor.addEventListener(name, handler));
      host.current.replaceChildren(input, editor);
      removeListeners = () => {
        listeners.forEach(([name, handler]) => editor.removeEventListener(name, handler));
        // The generated toolbar is also owned by this mount.
        editor.parentElement?.replaceChildren();
      };
    }).catch(() => { if (!disposed) setLoadError(true); });
    return () => {
      disposed = true;
      removeListeners();
      element.current = null;
      latest.current.onUploadingChange?.(false);
    };
  }, [id, attempt]);

  useEffect(() => {
    const editor = element.current;
    if (!ready || !editor) return;
    editor.setAttribute("placeholder", placeholder);
    editor.setAttribute("aria-label", label);
    // Parent echoes of typing must not reset selection or Trix's undo history.
    if (value === lastValue.current) return;
    lastValue.current = value;
    syncing.current = true;
    editor.editor.loadHTML(value);
    syncing.current = false;
  }, [value, ready, placeholder, label]);

  const words = countWritingWords(value);
  return (
    <div className={`rich-text-editor${large ? " rich-text-editor--large" : ""}${uploadImage ? "" : " rich-text-editor--no-upload"}`}>
      <div className="rich-text-editor__tools">
        <span>{words} {words === 1 ? "word" : "words"}</span>
        <button type="button" className="btn-action" aria-pressed={preview} onClick={() => setPreview(!preview)}>
          {preview ? "Continue writing" : "Preview"}
        </button>
      </div>
      {!ready && !loadError && <p role="status">Loading editor…</p>}
      {loadError && <p role="alert">The editor could not load. Your text is preserved. <button type="button" onClick={() => setAttempt((n) => n + 1)}>Retry</button></p>}
      <div ref={host} hidden={preview || loadError} />
      {preview && <div aria-label={`${label} preview`} className="article-page__body trix-content rich-text-editor__preview" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(normalizeArticleBody(value)) }} />}
      <p className="rich-text-editor__hint">{uploadImage
        ? "Drop or paste images into the text (JPG, PNG, WebP or GIF, up to 10 MB). Uploaded images also appear in Images below. Removing an image from the text keeps it in the gallery."
        : "Save and reopen this draft to add inline images. You can also select images below when saving."}</p>
      {uploadCount > 0 && <p role="status">Uploading {uploadCount} {uploadCount === 1 ? "image" : "images"}… Wait before saving.</p>}
      {uploadError && <p role="alert">{uploadError}</p>}
    </div>
  );
}
