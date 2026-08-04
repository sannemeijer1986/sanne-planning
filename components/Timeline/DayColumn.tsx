import { format } from "date-fns";
import styles from "./DayColumn.module.scss";

interface DayColumnProps {
  date: Date;
  width: number;
  editable?: boolean;
  onClick?: () => void;
}

export default function DayColumn({ date, width, editable, onClick }: DayColumnProps) {
  return (
    <div
      className={`${styles.column} ${editable ? styles.editable : ""}`}
      style={{ width }}
      onClick={onClick}
    >
      <span className={styles.weekday}>{format(date, "EEE")}</span>
      <span className={styles.date}>{format(date, "MMM d")}</span>
    </div>
  );
}
