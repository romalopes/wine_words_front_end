/** Small badge showing the content source — render only for Admin/Editor. */
export default function SourceBadge({ source }: { source: string | null | undefined }) {
  const label = sourceLabel(source)
  if (!label) return null
  return (
    <span
      className="wine-management__color-badge wine-management__color-badge--source"
      title={`Source: ${label}`}
    >
      {label}
    </span>
  )
}

/** Human-readable label for the `source` column (manual/substack/wine_front). */
export function sourceLabel(source: string | null | undefined): string | null {
  if (!source) return null
  const labels: Record<string, string> = {
    manual: "Manual",
    substack: "Substack",
    wine_front: "WineFront",
  }
  return labels[source] ?? source
}

/** Selectable `source` values, in display order (used by the edit forms). */
export const SOURCE_OPTIONS: readonly string[] = ["manual", "substack", "wine_front"]
