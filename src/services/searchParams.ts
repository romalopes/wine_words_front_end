export interface SearchParams {
  [key: string]: string | number | undefined;
  query?: string;
  page?: number;
  per_page?: number;
  sort?: string;
  // additional filter keys will be added dynamically
}

/**
 * Builds a query string from SearchParams, ignoring blank/null/undefined values.
 */
export function buildQuery(params: SearchParams): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    // numbers are fine
    searchParams.append(key, String(value));
  }
  return searchParams.toString();
}

/**
 * Parses a query string into SearchParams.
 * Numbers are parsed as numbers if they look like integers.
 */
export function parseQuery(searchString: string): SearchParams {
  const params: SearchParams = {};
  if (!searchString) return params;
  try {
    const searchParams = new URLSearchParams(searchString);
    for (const [key, value] of searchParams.entries()) {
      // Try to convert to number if applicable
      const num = Number(value);
      if (!isNaN(num) && value.trim() === String(num)) {
        params[key] = num;
      } else {
        params[key] = value;
      }
    }
  } catch {
    // fallback simple split
    searchString.split('&').forEach(pair => {
      const [key, val] = pair.split('=');
      if (key) {
        const decoded = decodeURIComponent(val || '');
        const num = Number(decoded);
        if (!isNaN(num) && decoded.trim() === String(num)) {
          params[key] = num;
        } else {
          params[key] = decoded;
        }
      }
    });
  }
  return params;
}