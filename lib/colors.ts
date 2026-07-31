import { ITEM_COLORS, type ItemColor } from "@/types/planning";

function toLabel(value: ItemColor): string {
  const [base, variant] = value.split("-");
  const baseLabel = base.charAt(0).toUpperCase() + base.slice(1);
  return variant ? `${baseLabel} (${variant})` : baseLabel;
}

export const COLOR_SWATCHES: { value: ItemColor; label: string }[] = ITEM_COLORS.map((value) => ({
  value,
  label: toLabel(value),
}));
