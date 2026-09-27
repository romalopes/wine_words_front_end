import { useLocation } from "react-router-dom"

const DETAIL_RESOURCES = [
  "wines", "reviews", "articles", "producers", "grapes", "regions", "countries", "categories", "wine-packages",
] as const

function isDetailPath(path: string | null | undefined): boolean {
  if (!path) return false
  // Drop the query string. Destructuring with a default avoids indexing the
  // `split` result, which is `string | undefined` under
  // `noUncheckedIndexedAccess`.
  const [pathname = ""] = path.split("?")
  const segments = pathname.split("/").filter(Boolean)
  const resource = segments[0]
  // `segments[0]` is `string | undefined` under `noUncheckedIndexedAccess`; the
  // length check below already excludes the empty case, so this narrows it.
  return (
    segments.length >= 2 &&
    resource !== undefined &&
    DETAIL_RESOURCES.some((item) => item === resource)
  )
}

export type ReturnToLink = (targetPath: string) => string

export function useReturnToLink(): ReturnToLink {
  const location = useLocation()
  const currentPath = location.pathname + location.search

  return (targetPath) => {
    if (!targetPath) return targetPath
    if (!isDetailPath(targetPath) || !isDetailPath(location.pathname)) return targetPath

    const separator = targetPath.includes("?") ? "&" : "?"
    return `${targetPath}${separator}returnTo=${encodeURIComponent(currentPath)}`
  }
}

