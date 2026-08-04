import type { MarkerColor } from "@/types/planning";
import styles from "./EventMarker.module.scss";

interface EventMarkerProps {
  left: number;
  label?: string;
  color: MarkerColor;
  variant?: "header" | "body";
  top?: number;
  onClick?: () => void;
}

export default function EventMarker({
  left,
  label = "",
  color,
  variant = "body",
  top,
  onClick,
}: EventMarkerProps) {
  const colorClass = styles[`color-${color}`];

  if (variant === "header") {
    return (
      <div
        className={`${styles.headerMarker} ${colorClass} ${onClick ? styles.clickable : ""}`}
        style={{ left, top }}
        onClick={onClick}
      >
        <span className={styles.line} />
        <span className={styles.triangle} />
        <span className={styles.label}>{label}</span>
      </div>
    );
  }
  return (
    <div className={`${styles.marker} ${colorClass}`} style={{ left }}>
      <span className={styles.line} />
    </div>
  );
}
