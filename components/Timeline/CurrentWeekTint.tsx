import styles from "./CurrentWeekTint.module.scss";

interface CurrentWeekTintProps {
  left: number;
  width: number;
  variant?: "header" | "body";
  top?: number;
}

export default function CurrentWeekTint({ left, width, variant = "body", top }: CurrentWeekTintProps) {
  if (width <= 0) return null;
  return (
    <div
      className={variant === "header" ? styles.tintHeader : styles.tint}
      style={{ left, width, top }}
    />
  );
}
