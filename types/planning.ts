export const ITEM_COLORS = ["blue", "purple", "orange", "green", "pink", "teal"] as const;

export type ItemColor = (typeof ITEM_COLORS)[number];

export interface TimelineItem {
  id: string;
  startDate: string; // ISO yyyy-MM-dd, must fall on a weekday
  endDate: string; // ISO yyyy-MM-dd, inclusive, >= startDate, must fall on a weekday
  title: string;
  subtitle: string;
  color: ItemColor;
  createdAt: string;
  updatedAt: string;
}

export interface PlanningData {
  items: TimelineItem[];
}

export type CreateItemInput = Pick<TimelineItem, "startDate" | "endDate" | "title" | "subtitle" | "color">;

export type UpdateItemInput = Partial<CreateItemInput>;
