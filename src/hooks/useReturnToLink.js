import { useLocation } from "react-router-dom";

const DETAIL_RESOURCES = [
  "wines",
  "reviews",
  "articles",
  "producers",
  "grapes",
  "regions",
  "countries",
  "categories",
  "wine-packages",
];

function isDetailPath(path) {
  if (!path) return false;
  const segments = path.split("?")[0].split("/").filter(Boolean);
  return segments.length >= 2 && DETAIL_RESOURCES.includes(segments[0]);
}

export function useReturnToLink() {
  const location = useLocation();
  const currentPath = location.pathname + location.search;

  return (targetPath) => {
    if (!targetPath) return targetPath;
    if (!isDetailPath(targetPath)) return targetPath;
    if (!isDetailPath(location.pathname)) return targetPath;

    const separator = targetPath.includes("?") ? "&" : "?";
    return `${targetPath}${separator}returnTo=${encodeURIComponent(currentPath)}`;
  };
}
