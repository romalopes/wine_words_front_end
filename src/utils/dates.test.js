import { parseDate, formatDate, daysUntil, deadlineLabel, todayInputValue } from "./dates.js";

// These helpers exist because bare ISO dates ("2026-10-15") must be read as
// LOCAL midnight. `new Date("2026-10-15")` is UTC midnight, which renders as the
// 14th west of Greenwich — a review deadline silently moving a day is exactly
// the bug this guards against.
describe("utils/dates", () => {
  it("parses a bare ISO date as local midnight", () => {
    const date = parseDate("2026-10-15");

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(9); // October (zero-based)
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(0);
  });

  it("parses full timestamps and rejects junk", () => {
    expect(parseDate("2026-10-15T09:30:00Z")).toBeInstanceOf(Date);
    expect(parseDate("")).toBeNull();
    expect(parseDate(null)).toBeNull();
    expect(parseDate("not a date")).toBeNull();
  });

  it("formats a date and returns null when there is nothing to format", () => {
    expect(formatDate("2026-10-15")).toMatch(/15/);
    expect(formatDate(null)).toBeNull();
  });

  it("counts whole days from today, negative when past", () => {
    expect(daysUntil(todayInputValue())).toBe(0);
    expect(daysUntil(null)).toBeNull();

    const past = new Date();
    past.setDate(past.getDate() - 3);
    const month = String(past.getMonth() + 1).padStart(2, "0");
    const day = String(past.getDate()).padStart(2, "0");
    expect(daysUntil(`${past.getFullYear()}-${month}-${day}`)).toBe(-3);
  });

  it("describes a deadline in human terms", () => {
    expect(deadlineLabel(todayInputValue())).toBe("Due today");
    expect(deadlineLabel(null)).toBeNull();

    const inThree = new Date();
    inThree.setDate(inThree.getDate() + 3);
    const month = String(inThree.getMonth() + 1).padStart(2, "0");
    const day = String(inThree.getDate()).padStart(2, "0");
    expect(deadlineLabel(`${inThree.getFullYear()}-${month}-${day}`)).toBe("Due in 3 days");

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yMonth = String(yesterday.getMonth() + 1).padStart(2, "0");
    const yDay = String(yesterday.getDate()).padStart(2, "0");
    expect(deadlineLabel(`${yesterday.getFullYear()}-${yMonth}-${yDay}`)).toBe("Overdue by 1 day");
  });

  it("gives an <input type=date> friendly value", () => {
    expect(todayInputValue()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});