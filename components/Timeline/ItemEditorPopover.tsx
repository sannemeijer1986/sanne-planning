"use client";

import { useState } from "react";
import { format } from "date-fns";
import { parseISODate } from "@/lib/dates";
import { COLOR_SWATCHES } from "@/lib/colors";
import type { ItemColor, ItemKind } from "@/types/planning";
import ConfirmDialog from "./ConfirmDialog";
import styles from "./ItemEditorPopover.module.scss";

// Matches the exit animation duration in ItemEditorPopover.module.scss.
const CLOSE_ANIMATION_MS = 150;

interface ItemEditorPopoverProps {
  mode: "create" | "edit";
  startDate: string;
  endDate: string;
  initialKind?: ItemKind;
  initialTitle?: string;
  initialSubtitle?: string;
  initialColor?: ItemColor;
  onSave: (values: { kind: ItemKind; title: string; subtitle: string; color: ItemColor }) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function ItemEditorPopover({
  mode,
  startDate,
  endDate,
  initialKind = "work",
  initialTitle = "",
  initialSubtitle = "",
  initialColor = "blue",
  onSave,
  onCancel,
  onDelete,
}: ItemEditorPopoverProps) {
  const [kind, setKind] = useState<ItemKind>(initialKind);
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [color, setColor] = useState<ItemColor>(initialColor);
  const [closing, setClosing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const dateRangeLabel =
    startDate === endDate
      ? format(parseISODate(startDate), "EEE, MMM d")
      : `${format(parseISODate(startDate), "EEE, MMM d")} – ${format(parseISODate(endDate), "EEE, MMM d")}`;

  function close(action: () => void) {
    setClosing(true);
    setTimeout(action, CLOSE_ANIMATION_MS);
  }

  function handleSave() {
    const finalTitle = title.trim();
    const finalSubtitle = subtitle.trim() || (kind === "leave" ? "On leave" : "");
    if (!finalTitle && !finalSubtitle) return;
    close(() => onSave({ kind, title: finalTitle, subtitle: finalSubtitle, color }));
  }

  function handleCancel() {
    close(onCancel);
  }

  function handleDelete() {
    if (onDelete) close(onDelete);
  }

  function handleDeleteRequest() {
    setConfirmingDelete(true);
  }

  return (
    <div
      className={`${styles.backdrop} ${closing ? styles.backdropClosing : ""}`}
      onClick={handleCancel}
    >
      <div
        className={`${styles.panel} ${closing ? styles.panelClosing : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <span className={styles.dates}>{dateRangeLabel}</span>

        <div className={styles.kindToggle}>
          <button
            type="button"
            className={`${styles.kindOption} ${kind === "work" ? styles.kindSelected : ""}`}
            onClick={() => setKind("work")}
          >
            Work
          </button>
          <button
            type="button"
            className={`${styles.kindOption} ${kind === "leave" ? styles.kindSelectedLeave : ""}`}
            onClick={() => setKind("leave")}
          >
            On leave
          </button>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Label</span>
          <input
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. Add bank 1.6"
            maxLength={80}
            autoFocus
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Title</span>
          <input
            className={styles.input}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder={kind === "leave" ? "On leave" : "Ex. Figma handoff"}
            maxLength={120}
          />
        </label>

        <div className={`${styles.field} ${kind !== "work" ? styles.fieldHidden : ""}`}>
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
            <button type="button" className={`${styles.button} ${styles.danger}`} onClick={handleDeleteRequest}>
              Delete
            </button>
          )}
          <div className={styles.actionsRight}>
            <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={handleCancel}>
              Cancel
            </button>
            <button type="button" className={`${styles.button} ${styles.primary}`} onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          message="Are you sure you want to delete this item? This can't be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
