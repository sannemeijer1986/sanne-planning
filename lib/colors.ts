import { ITEM_COLORS, type ItemColor } from "@/types/planning";

export const COLOR_SWATCHES: { value: ItemColor; label: string }[] = ITEM_COLORS.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));
