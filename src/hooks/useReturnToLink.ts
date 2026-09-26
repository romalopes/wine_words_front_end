import { useLocation } from "react-router-dom"

const DETAIL_RESOURCES = [
  "wines", "reviews", "articles", "producers", "grapes", "regions", "countries", "categories", "wine-packages",
] as const

function isDetailPath(path: string | null | undefined): boolean {
  if (!path) return false
  const segments = path.split("?")[0].split("/").filter(Boolean)
  const resource = segments[0]
  return segments.length >= 2 && resource != null && DETAIL_RESOURCES.some((item) => item === resource)
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

