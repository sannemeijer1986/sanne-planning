import { ITEM_COLORS, MARKER_COLORS, type ItemColor, type MarkerColor } from "@/types/planning";

function toLabel(value: string): string {
  const [base, variant] = value.split("-");
  const baseLabel = base.charAt(0).toUpperCase() + base.slice(1);
  return variant ? `${baseLabel} (${variant})` : baseLabel;
}

export const COLOR_SWATCHES: { value: ItemColor; label: string }[] = ITEM_COLORS.map((value) => ({
  value,
  label: toLabel(value),
}));

export const MARKER_COLOR_SWATCHES: { value: MarkerColor; label: string }[] = MARKER_COLORS.map(
  (value) => ({ value, label: toLabel(value) })
);
