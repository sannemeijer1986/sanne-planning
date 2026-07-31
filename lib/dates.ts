import {
  addDays,
  compareAsc,
  eachDayOfInterval,
  endOfWeek,
  format,
  isWeekend,
  parseISO,
  startOfWeek,
} from "date-fns";

export const ISO_DATE_FORMAT = "yyyy-MM-dd";

export function toISODate(date: Date): string {
  return format(date, ISO_DATE_FORMAT);
}

export function parseISODate(value: string): Date {
  return parseISO(value);
}

/** Moves a weekend date to the nearest weekday. "forward" -> next Monday, "backward" -> previous Friday. */
export function clampToWeekday(date: Date, direction: "forward" | "backward" = "forward"): Date {
  let result = date;
  while (isWeekend(result)) {
    result = addDays(result, direction === "forward" ? 1 : -1);
  }
  return result;
}

/** All weekdays (Mon-Fri) between start and end, inclusive. */
export function generateWeekdayRange(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end }).filter((d) => !isWeekend(d));
}

/** Weekday range spanning `monthsBack` months before and `monthsForward` months after `center`. */
export function generateDefaultRange(
  center: Date,
  monthsBack: number,
  monthsForward: number
): Date[] {
  const start = addDays(new Date(center.getFullYear(), center.getMonth() - monthsBack, 1), 0);
  const end = new Date(center.getFullYear(), center.getMonth() + monthsForward + 1, 0); // last day of that month
  return generateWeekdayRange(start, end);
}

export interface MonthLabel {
  label: string; // e.g. "April 2026"
  startIndex: number;
  span: number;
}

/** Groups a weekday array into contiguous month spans for header labels. */
export function buildMonthLabels(days: Date[]): MonthLabel[] {
  const labels: MonthLabel[] = [];
  days.forEach((day, index) => {
    const key = format(day, "yyyy-MM");
    const last = labels[labels.length - 1];
    if (last && last.label === key) {
      last.span += 1;
    } else {
      labels.push({ label: key, startIndex: index, span: 1 });
    }
  });
  return labels.map((l) => ({ ...l, label: format(parseISO(`${l.label}-01`), "MMMM yyyy") }));
}

/** ISO string -> column index, for O(1) lookups while positioning items. */
export function buildDayIndex(days: Date[]): Map<string, number> {
  const map = new Map<string, number>();
  days.forEach((day, index) => map.set(toISODate(day), index));
  return map;
}

/**
 * Column index for a date. Weekend dates resolve to the boundary before the
 * following Monday (used for the "Today" marker on a weekend).
 */
export function resolveColumnIndex(dayIndex: Map<string, number>, date: Date): number {
  const iso = toISODate(date);
  const direct = dayIndex.get(iso);
  if (direct !== undefined) return direct;
  const nextWeekday = clampToWeekday(date, "forward");
  return dayIndex.get(toISODate(nextWeekday)) ?? 0;
}

/** Column indices (Mon-Fri) belonging to the week containing `date`. */
export function currentWeekColumnIndices(dayIndex: Map<string, number>, date: Date): number[] {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  const weekdays = generateWeekdayRange(weekStart, weekEnd);
  return weekdays
    .map((d) => dayIndex.get(toISODate(d)))
    .filter((i): i is number => i !== undefined);
}

export function isValidRange(startDate: string, endDate: string): boolean {
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);
  if (isWeekend(start) || isWeekend(end)) return false;
  return compareAsc(start, end) <= 0;
}
