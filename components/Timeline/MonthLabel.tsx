import styles from "./MonthLabel.module.scss";

interface MonthLabelProps {
  label: string;
  left: number;
  width: number;
}

export default function MonthLabel({ label, left, width }: MonthLabelProps) {
  return (
    <div className={styles.label} style={{ left, width }}>
      {label}
    </div>
  );
}
