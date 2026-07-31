"use client";

import type { PointerEvent } from "react";
import type { TimelineItem } from "@/types/planning";
import styles from "./ItemBlock.module.scss";

export type DragMode = "move" | "resize-start" | "resize-end";

interface ItemBlockProps {
  item: TimelineItem;
  left: number;
  width: number;
  top: number;
  height?: number; // overrides the default row height for full-height "leave" bands
  editable: boolean;
  isDragging?: boolean;
  onDragStart?: (item: TimelineItem, mode: DragMode, e: PointerEvent) => void;
}

export default function ItemBlock({
  item,
  left,
  width,
  top,
  height,
  editable,
  isDragging,
  onDragStart,
}: ItemBlockProps) {
  const isLeave = item.kind === "leave";
  const className = [
    styles.item,
    isLeave ? styles.leave : styles[`color-${item.color}`],
    editable ? styles.editable : "",
    isDragging ? styles.dragging : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      style={{ left, width, top, ...(height !== undefined ? { height } : {}) }}
      onPointerDown={editable ? (e) => onDragStart?.(item, "move", e) : undefined}
    >
      {isLeave ? (
        <span className={styles.leaveLabel}>{item.title || "On leave"}</span>
      ) : (
        <div className={styles.text}>
          <span className={styles.title}>{item.title}</span>
          <span className={styles.subtitle}>{item.subtitle}</span>
        </div>
      )}
      {editable && (
        <>
          <div
            className={`${styles.handle} ${styles.handleLeft}`}
            onPointerDown={(e) => {
              e.stopPropagation();
              onDragStart?.(item, "resize-start", e);
            }}
          />
          <div
            className={`${styles.handle} ${styles.handleRight}`}
            onPointerDown={(e) => {
              e.stopPropagation();
              onDragStart?.(item, "resize-end", e);
            }}
          />
        </>
      )}
    </div>
  );
}
