export const ITEM_COLORS = ["blue", "purple", "orange", "green", "pink", "teal"] as const;

export type ItemColor = (typeof ITEM_COLORS)[number];

// A day is divided into 4 quarters for sub-day snapping. startOffset/endOffset
// are 0-3, identifying which quarter of startDate/endDate the item begins/ends
// in (endOffset is inclusive of that quarter).
export const QUARTERS_PER_DAY = 4;

export interface TimelineItem {
  id: string;
  startDate: string; // ISO yyyy-MM-dd, must fall on a weekday
  startOffset: number; // 0-3
  endDate: string; // ISO yyyy-MM-dd, must fall on a weekday
  endOffset: number; // 0-3, inclusive
  title: string;
  subtitle: string;
  color: ItemColor;
  createdAt: string;
  updatedAt: string;
}

export interface PlanningData {
  items: TimelineItem[];
}

export type CreateItemInput = Pick<
  TimelineItem,
  "startDate" | "startOffset" | "endDate" | "endOffset" | "title" | "subtitle" | "color"
>;

export type UpdateItemInput = Partial<CreateItemInput>;
