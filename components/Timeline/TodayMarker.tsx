import styles from "./TodayMarker.module.scss";

interface TodayMarkerProps {
  left: number;
}

export default function TodayMarker({ left }: TodayMarkerProps) {
  return (
    <div className={styles.marker} style={{ left }}>
      <span className={styles.label}>Today</span>
    </div>
  );
}
