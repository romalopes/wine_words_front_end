import { useEffect, useState } from "react"
import { categoriesApi } from "../services/api"

export type CategorySortKey = "sort_order_wine" | "sort_order_review" | "sort_order_article"
export type CategoryOrderMap = Record<string, number | null>

interface SortableCategory {
  name: string
  [key: string]: unknown
}

export function useCategoryOrder(sortKey: CategorySortKey): CategoryOrderMap {
  const [orderMap, setOrderMap] = useState<CategoryOrderMap>({})

  useEffect(() => {
    let cancelled = false
    categoriesApi
      .list()
      .then((cats: unknown) => {
        if (cancelled) return
        const map: CategoryOrderMap = {}
        const categories: SortableCategory[] = Array.isArray(cats) ? cats : []
        categories.forEach((category) => {
          const order = category[sortKey]
          map[category.name] = typeof order === "number" ? order : null
        })
        setOrderMap(map)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [sortKey])

  return orderMap
}

export function sortCategoryNames(names: readonly string[], orderMap: CategoryOrderMap): string[] {
  return [...names].sort((a, b) => {
    if (a === "Uncategorised") return 1
    if (b === "Uncategorised") return -1
    const oa = orderMap[a]
    const ob = orderMap[b]
    if (oa != null && ob != null) return oa - ob || a.localeCompare(b)
    if (oa != null) return -1
    if (ob != null) return 1
    return a.localeCompare(b)
  })
}

