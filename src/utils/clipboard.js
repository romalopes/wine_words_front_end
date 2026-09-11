/**
 * Copies the given text to the clipboard.
 *
 * Uses the async Clipboard API when available (secure context), and falls
 * back to the legacy `document.execCommand("copy")` approach for non-secure
 * contexts (e.g. plain HTTP on a LAN).
 *
 * Returns a Promise that resolves when the text has been written and rejects
 * if the copy could not be performed.
 */
export function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  // Fallback for non-secure contexts.
  return new Promise((resolve, reject) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy") ? resolve() : reject(new Error("copy failed"));
    } catch (err) {
      reject(err);
    } finally {
      document.body.removeChild(textarea);
    }
  });
}
