"use client";

import { useState } from "react";
import styles from "./EditModeToggle.module.scss";

interface EditModeToggleProps {
  editMode: boolean;
  onLogin: (password: string) => Promise<boolean>;
  onLogout: () => Promise<void>;
}

export default function EditModeToggle({ editMode, onLogin, onLogout }: EditModeToggleProps) {
  const [showForm, setShowForm] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    const ok = await onLogin(password);
    setSubmitting(false);
    if (ok) {
      setShowForm(false);
      setPassword("");
    } else {
      setError(true);
    }
  }

  if (editMode) {
    return (
      <div className={styles.wrapper}>
        <button
          type="button"
          className={`${styles.button} ${styles.editing}`}
          onClick={() => onLogout()}
        >
          Editing · Lock
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {showForm ? (
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="password"
            className={styles.input}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button type="submit" className={styles.submit} disabled={submitting}>
            Unlock
          </button>
        </form>
      ) : (
        <button type="button" className={styles.button} onClick={() => setShowForm(true)}>
          View only · Edit
        </button>
      )}
      {error && <span className={styles.error}>Wrong password</span>}
    </div>
  );
}
