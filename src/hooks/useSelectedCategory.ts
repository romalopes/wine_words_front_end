import { useSearchParams } from "react-router-dom"

export function useSelectedCategory(): string | null {
  const [searchParams] = useSearchParams()
  return searchParams.get("category")
}

