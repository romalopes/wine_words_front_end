import { useLocation } from "react-router-dom";

const LABELS = {
  wines: "Wine",
  reviews: "Review",
  articles: "Article",
  producers: "Producer",
  grapes: "Grape",
  regions: "Region",
  countries: "Country",
  "wine-packages": "Wine Package",
};

export function useReturnTo() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const returnTo = params.get("returnTo");

  if (!returnTo) return null;

  const segments = returnTo.split("/").filter(Boolean);
  const sourceType = segments[0] || "page";
  const label = LABELS[sourceType] || sourceType;

  return { path: returnTo, label };
}
