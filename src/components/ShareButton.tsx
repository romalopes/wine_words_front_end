import { useState } from "react";
import { copyText } from "../utils/clipboard";

interface ShareButtonProps {
  /** What is being shared, for the accessible label ("this article"). */
  label?: string;
  className?: string;
}

/**
 * "Share" control for the detail pages: copies the current URL to the
 * clipboard and confirms inline, mirroring the Share affordance on the
 * reference publications (Substack / Jancis Robinson).
 */
export default function ShareButton({ label = "this page", className = "" }: ShareButtonProps) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function handleShare() {
    try {
      await copyText(window.location.href);
      setState("copied");
      window.setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("failed");
    }
  }

  const text =
    state === "copied" ? "Link copied!" : state === "failed" ? "Copy failed" : "Share";

  return (
    <button
      type="button"
      className={`article-page__share ${className}`.trim()}
      onClick={() => void handleShare()}
      aria-label={
        state === "copied" ? "Link copied" : `Copy link to ${label}`
      }
    >
      {text}
    </button>
  );
}
