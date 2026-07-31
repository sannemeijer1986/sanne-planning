import { format } from "date-fns";
import styles from "./DayColumn.module.scss";

interface DayColumnProps {
  date: Date;
  width: number;
}

export default function DayColumn({ date, width }: DayColumnProps) {
  return (
    <div className={styles.column} style={{ width }}>
      <span className={styles.weekday}>{format(date, "EEE")}</span>
      <span className={styles.date}>{format(date, "MMM d")}</span>
    </div>
  );
}
