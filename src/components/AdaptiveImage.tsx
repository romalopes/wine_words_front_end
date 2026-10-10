import { useImageOrientation } from "../hooks/useImageOrientation";

interface AdaptiveImageProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * An `<img>` that adapts to its own resolution. Once loaded it tags itself with
 * `is-portrait` / `is-landscape` (via `useImageOrientation`) so CSS can keep
 * tall images uncropped while letting wide images fill the width. Use this
 * anywhere a fixed `object-fit: cover` box would clip portrait photos.
 */
export function AdaptiveImage({ src, alt, className }: AdaptiveImageProps) {
  const { orientation, handleLoad } = useImageOrientation(src);
  const classes = [className, orientation ? `is-${orientation}` : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <img
      src={src}
      alt={alt}
      className={classes || undefined}
      onLoad={handleLoad}
    />
  );
}

export default AdaptiveImage;
