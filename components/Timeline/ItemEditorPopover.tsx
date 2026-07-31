"use client";

import { useState } from "react";
import { format } from "date-fns";
import { parseISODate } from "@/lib/dates";
import { COLOR_SWATCHES } from "@/lib/colors";
import type { ItemColor } from "@/types/planning";
import styles from "./ItemEditorPopover.module.scss";

interface ItemEditorPopoverProps {
  mode: "create" | "edit";
  startDate: string;
  endDate: string;
  initialTitle?: string;
  initialSubtitle?: string;
  initialColor?: ItemColor;
  onSave: (values: { title: string; subtitle: string; color: ItemColor }) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function ItemEditorPopover({
  mode,
  startDate,
  endDate,
  initialTitle = "",
  initialSubtitle = "",
  initialColor = "blue",
  onSave,
  onCancel,
  onDelete,
}: ItemEditorPopoverProps) {
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [color, setColor] = useState<ItemColor>(initialColor);

  const dateRangeLabel =
    startDate === endDate
      ? format(parseISODate(startDate), "EEE, MMM d")
      : `${format(parseISODate(startDate), "EEE, MMM d")} – ${format(parseISODate(endDate), "EEE, MMM d")}`;

  function handleSave() {
    if (!title.trim() && !subtitle.trim()) return;
    onSave({ title: title.trim(), subtitle: subtitle.trim(), color });
  }

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <span className={styles.dates}>{dateRangeLabel}</span>

        <label className={styles.field}>
          <span className={styles.label}>Title</span>
          <input
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            autoFocus
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Subtitle</span>
          <input
            className={styles.input}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            maxLength={120}
          />
        </label>

        <div className={styles.field}>
          <span className={styles.label}>Color</span>
          <div className={styles.swatches}>
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.value}
                type="button"
                aria-label={swatch.label}
                className={[
                  styles.swatch,
                  styles[`color-${swatch.value}`],
                  color === swatch.value ? styles.selected : "",
                ].join(" ")}
                onClick={() => setColor(swatch.value)}
              />
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          {mode === "edit" && onDelete && (
            <button type="button" className={`${styles.button} ${styles.danger}`} onClick={onDelete}>
              Delete
            </button>
          )}
          <div className={styles.actionsRight}>
            <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className={`${styles.button} ${styles.primary}`} onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
