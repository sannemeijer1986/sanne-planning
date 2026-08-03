"use client";

import { useState } from "react";
import styles from "./EditModeToggle.module.scss";

interface EditModeToggleProps {
  editMode: boolean;
  onLogin: (password: string) => Promise<{ ok: boolean; message?: string }>;
  onLogout: () => Promise<void>;
}

function LockIcon({ locked }: { locked: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      {locked ? (
        <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M8 11V7a4 4 0 0 1 7.5-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function EditModeToggle({ editMode, onLogin, onLogout }: EditModeToggleProps) {
  const [showForm, setShowForm] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await onLogin(password);
    setSubmitting(false);
    if (result.ok) {
      setShowForm(false);
      setPassword("");
    } else {
      setError(result.message || "Wrong password");
    }
  }

  function handleCloseForm() {
    setShowForm(false);
    setPassword("");
    setError(null);
  }

  if (editMode) {
    return (
      <div className={styles.wrapper}>
        <span className={styles.label}>Editing</span>
        <button
          type="button"
          className={`${styles.iconButton} ${styles.editing}`}
          onClick={() => onLogout()}
          aria-label="Lock"
          title="Lock"
        >
          <LockIcon locked={false} />
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
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleCloseForm}
            aria-label="Cancel"
            title="Cancel"
          >
            <CloseIcon />
          </button>
        </form>
      ) : (
        <>
          <span className={styles.label}>View only</span>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setShowForm(true)}
            aria-label="Unlock edit mode"
            title="Unlock edit mode"
          >
            <LockIcon locked={true} />
          </button>
        </>
      )}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
