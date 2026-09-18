// Small date helpers shared by the wine-package screens.
//
// The API sends calendar dates as bare ISO strings ("2026-10-15") and
// datetimes as full ISO timestamps. `new Date("2026-10-15")` is parsed as UTC
// midnight, which renders as the 14th anywhere west of Greenwich, so bare
// dates are parsed as *local* midnight instead.

const DAY_MS = 24 * 60 * 60 * 1000;
const BARE_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDate(value) {
  if (!value) return null;

  const bare = BARE_DATE.exec(String(value));
  if (bare) {
    const [, year, month, day] = bare;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(value) {
  const date = parseDate(value);
  return date ? date.toLocaleDateString() : null;
}

export function formatDateTime(value) {
  const date = parseDate(value);
  return date ? date.toLocaleString() : null;
}

// Whole days from today to the given calendar date (negative when past).
export function daysUntil(value) {
  const date = parseDate(value);
  if (!date) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((date - startOfToday) / DAY_MS);
}

// Human countdown for a review deadline: "Due in 12 days", "Due today",
// "Overdue by 3 days". Null when there is no deadline.
export function deadlineLabel(value) {
  const days = daysUntil(value);
  if (days === null) return null;
  if (days === 0) return "Due today";
  if (days > 0) return `Due in ${days} ${days === 1 ? "day" : "days"}`;

  const overdue = Math.abs(days);
  return `Overdue by ${overdue} ${overdue === 1 ? "day" : "days"}`;
}

// Today as a value an <input type="date"> accepts.
export function todayInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
