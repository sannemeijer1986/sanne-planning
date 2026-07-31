import styles from "./CurrentWeekTint.module.scss";

interface CurrentWeekTintProps {
  left: number;
  width: number;
}

export default function CurrentWeekTint({ left, width }: CurrentWeekTintProps) {
  if (width <= 0) return null;
  return <div className={styles.tint} style={{ left, width }} />;
}
