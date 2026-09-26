import { useLocation } from "react-router-dom"

const LABELS: Readonly<Record<string, string>> = {
  wines: "Wine",
  reviews: "Review",
  articles: "Article",
  producers: "Producer",
  grapes: "Grape",
  regions: "Region",
  countries: "Country",
  "wine-packages": "Wine Package",
}

export interface ReturnTarget {
  path: string
  label: string
}

export function useReturnTo(): ReturnTarget | null {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const returnTo = params.get("returnTo")

  if (!returnTo) return null

  const segments = returnTo.split("/").filter(Boolean)
  const sourceType = segments[0] || "page"
  const label = LABELS[sourceType] || sourceType

  return { path: returnTo, label }
}

