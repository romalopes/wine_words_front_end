import { useEffect, useRef } from "react";

// Load Trix (the same rich-text editor the Rails app uses) from the CDN once.
let trixLoadPromise = null;

function loadTrix() {
  if (!trixLoadPromise) {
    trixLoadPromise = new Promise((resolve) => {
      if (window.customElements && window.customElements.get("trix-editor")) {
        resolve();
        return;
      }
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/trix@2.1.15/dist/trix.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/trix@2.1.15/dist/trix.umd.min.js";
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }
  return trixLoadPromise;
}

/**
 * Minimal Trix wrapper. Renders a rich-text toolbar/editor and reports
 * sanitized-by-Trix HTML through `onChange`. `value` is only used for the
 * initial content (like a defaultValue).
 */
function RichTextEditor({ value = "", onChange, placeholder = "" }) {
  const hostRef = useRef(null);
  const inputIdRef = useRef(
    `trix-input-${Math.random().toString(36).slice(2, 10)}`,
  );

  useEffect(() => {
    let cancelled = false;

    loadTrix().then(() => {
      if (cancelled || !hostRef.current) return;

      // Clear any previous mount (e.g. React strict-mode double render).
      hostRef.current.innerHTML = "";

      const input = document.createElement("input");
      input.type = "hidden";
      input.id = inputIdRef.current;
      input.value = value || "";
      hostRef.current.appendChild(input);

      const editor = document.createElement("trix-editor");
      editor.setAttribute("input", inputIdRef.current);
      if (placeholder) editor.setAttribute("placeholder", placeholder);
      hostRef.current.appendChild(editor);

      editor.addEventListener("trix-change", () => {
        onChange && onChange(editor.value || "");
      });
    });

    return () => {
      cancelled = true;
    };
    // Intentionally mount-once: Trix manages its own DOM afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <style>{`
        .rich-text-editor trix-editor {
          background: #fff;
          border: 1px solid #d8c8c0;
          border-radius: .45rem;
          min-height: 8rem;
        }
        .rich-text-editor trix-toolbar { border: none; }
        .rich-text-editor trix-toolbar .trix-button-group {
          border-color: #d8c8c0;
        }
        .rich-text-editor trix-editor:empty::before {
          content: attr(placeholder);
          color: #6b5855;
        }
      `}</style>
      <div className="rich-text-editor" ref={hostRef} />
    </>
  );
}

export default RichTextEditor;