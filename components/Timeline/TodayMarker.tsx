import styles from "./TodayMarker.module.scss";

interface TodayMarkerProps {
  left: number;
  variant?: "header" | "body";
  top?: number;
}

export default function TodayMarker({ left, variant = "body", top }: TodayMarkerProps) {
  if (variant === "header") {
    return (
      <div className={styles.headerMarker} style={{ left, top }}>
        <span className={styles.line} />
        <span className={styles.triangle} />
        <span className={styles.label}>Today</span>
      </div>
    );
  }
  return (
    <div className={styles.marker} style={{ left }}>
      <span className={styles.line} />
    </div>
  );
}
