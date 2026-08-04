"use client";

import { useState } from "react";
import { format } from "date-fns";
import { parseISODate } from "@/lib/dates";
import { MARKER_COLOR_SWATCHES } from "@/lib/colors";
import {
  MARKER_QUARTER_LABELS,
  MARKER_TYPES,
  MARKER_TYPE_LABELS,
  type MarkerColor,
  type MarkerType,
} from "@/types/planning";
import ConfirmDialog from "./ConfirmDialog";
import styles from "./ItemEditorPopover.module.scss";
import swatchStyles from "./MarkerEditorPopover.module.scss";

// Matches the exit animation duration in ItemEditorPopover.module.scss.
const CLOSE_ANIMATION_MS = 150;

interface MarkerEditorPopoverProps {
  mode: "create" | "edit";
  date: string;
  initialOffset?: number;
  initialType?: MarkerType;
  initialTitle?: string;
  initialColor?: MarkerColor;
  onSave: (values: { offset: number; type: MarkerType; title: string; color: MarkerColor }) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function MarkerEditorPopover({
  mode,
  date,
  initialOffset = 0,
  initialType = "deadline",
  initialTitle = "",
  initialColor = "blue",
  onSave,
  onCancel,
  onDelete,
}: MarkerEditorPopoverProps) {
  const [offset, setOffset] = useState(initialOffset);
  const [type, setType] = useState<MarkerType>(initialType);
  const [title, setTitle] = useState(initialTitle);
  const [color, setColor] = useState<MarkerColor>(initialColor);
  const [closing, setClosing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const dateLabel = format(parseISODate(date), "EEE, MMM d");

  function close(action: () => void) {
    setClosing(true);
    setTimeout(action, CLOSE_ANIMATION_MS);
  }

  function handleSave() {
    close(() => onSave({ offset, type, title: title.trim(), color }));
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
        <span className={styles.dates}>{dateLabel}</span>

        <label className={styles.field}>
          <span className={styles.label}>Type</span>
          <select
            className={swatchStyles.select}
            value={type}
            onChange={(e) => setType(e.target.value as MarkerType)}
            autoFocus
          >
            {MARKER_TYPES.map((t) => (
              <option key={t} value={t}>
                {MARKER_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.field}>
          <span className={styles.label}>Time of day</span>
          <div className={swatchStyles.quarterToggle}>
            {MARKER_QUARTER_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                className={`${swatchStyles.quarterOption} ${offset === i ? swatchStyles.quarterSelected : ""}`}
                onClick={() => setOffset(i)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Title</span>
          <input
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. DCA handoff"
            maxLength={80}
          />
        </label>

        <div className={styles.field}>
          <span className={styles.label}>Color</span>
          <div className={styles.swatches}>
            {MARKER_COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.value}
                type="button"
                aria-label={swatch.label}
                className={[
                  swatchStyles.swatch,
                  swatchStyles[`color-${swatch.value}`],
                  color === swatch.value ? swatchStyles.selected : "",
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
          message="Are you sure you want to delete this marker? This can't be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
