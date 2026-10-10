import { useEffect, useState } from "react";

/**
 * Detects whether an image is portrait (taller than wide) or landscape once it
 * has loaded, using its natural dimensions. Returns `null` until the image
 * loads (or when there is no src), so callers can render a neutral default.
 *
 * Used by the review/article hero figures to adapt layout to resolution:
 * landscape photos fill the column width, while portrait bottle shots stay
 * height-capped and centered instead of being stretched.
 */
export function useImageOrientation(src?: string | null): {
  orientation: "portrait" | "landscape" | null;
  handleLoad: (event: React.SyntheticEvent<HTMLImageElement>) => void;
} {
  const [orientation, setOrientation] = useState<
    "portrait" | "landscape" | null
  >(null);

  // Reset whenever the image source changes so a stale class can't linger.
  useEffect(() => {
    setOrientation(null);
  }, [src]);

  function handleLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    const img = event.currentTarget;
    const { naturalWidth, naturalHeight } = img;
    if (!naturalWidth || !naturalHeight) return;
    setOrientation(naturalHeight > naturalWidth ? "portrait" : "landscape");
  }

  return { orientation, handleLoad };
}

export default useImageOrientation;
