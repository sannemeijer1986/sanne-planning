export const ITEM_COLORS = [
  "blue",
  "blue-dark",
  "purple",
  "purple-dark",
  "orange",
  "green",
  "green-dark",
  "gold",
  "gold-dark",
  "pink",
  "teal",
] as const;

export type ItemColor = (typeof ITEM_COLORS)[number];

// A day is divided into 4 quarters for sub-day snapping. startOffset/endOffset
// are 0-3, identifying which quarter of startDate/endDate the item begins/ends
// in (endOffset is inclusive of that quarter).
export const QUARTERS_PER_DAY = 4;

// "work" is a normal colored row item. "leave" spans the full height of the
// timeline for its date range (no row/color) to mark days off.
export const ITEM_KINDS = ["work", "leave"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

export interface TimelineItem {
  id: string;
  kind: ItemKind;
  startDate: string; // ISO yyyy-MM-dd, must fall on a weekday
  startOffset: number; // 0-3
  endDate: string; // ISO yyyy-MM-dd, must fall on a weekday
  endOffset: number; // 0-3, inclusive
  lane: number; // 0-indexed row; manually positioned by dragging, never auto-assigned. Unused for "leave".
  title: string;
  subtitle: string;
  color: ItemColor; // unused for "leave"
  createdAt: string;
  updatedAt: string;
}

// Point-in-time markers (e.g. deadlines) shown as a vertical divider on a
// single day, styled like the "Today" marker. One type today, more later.
export const MARKER_TYPES = ["deadline"] as const;
export type MarkerType = (typeof MARKER_TYPES)[number];

export const MARKER_TYPE_LABELS: Record<MarkerType, string> = {
  deadline: "Deadline",
};

// Smaller, pastel-toned palette kept distinct from ITEM_COLORS for contrast
// against the dark background.
export const MARKER_COLORS = ["blue", "pink", "green", "gold"] as const;
export type MarkerColor = (typeof MARKER_COLORS)[number];

// Same quarter-day granularity as item startOffset/endOffset (see QUARTERS_PER_DAY).
export const MARKER_QUARTER_LABELS = ["Morning", "Noon", "Afternoon", "Evening"] as const;

export interface DateMarker {
  id: string;
  date: string; // ISO yyyy-MM-dd
  offset: number; // 0-3, quarter of the day — see MARKER_QUARTER_LABELS
  type: MarkerType;
  title: string; // shown next to the line instead of the type label; falls back to it when empty
  color: MarkerColor;
  createdAt: string;
  updatedAt: string;
}

export type CreateMarkerInput = Pick<DateMarker, "date" | "offset" | "type" | "title" | "color">;
export type UpdateMarkerInput = Partial<Pick<DateMarker, "offset" | "type" | "title" | "color">>;

export interface PlanningData {
  items: TimelineItem[];
  notes?: string;
  markers?: DateMarker[];
}

export const NOTES_MAX_LENGTH = 4000;

export type CreateItemInput = Pick<
  TimelineItem,
  "kind" | "startDate" | "startOffset" | "endDate" | "endOffset" | "lane" | "title" | "subtitle" | "color"
>;

export type UpdateItemInput = Partial<CreateItemInput>;
