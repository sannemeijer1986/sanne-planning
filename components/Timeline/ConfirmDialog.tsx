"use client";

import styles from "./ItemEditorPopover.module.scss";

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
    >
      <div className={`${styles.panel} ${styles.confirmPanel}`} onClick={(e) => e.stopPropagation()}>
        <span className={styles.dates}>{message}</span>
        <div className={styles.actions}>
          <div className={styles.actionsRight}>
            <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className={`${styles.button} ${styles.dangerFilled}`} onClick={onConfirm}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
