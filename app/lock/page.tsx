"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import styles from "./lock.module.scss";

export default function LockPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    const res = await fetch("/api/auth/view-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.href = "/";
      return;
    }
    setSubmitting(false);
    setError(true);
  }

  return (
    <div className={styles.page}>
      <form className={styles.panel} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Sanne — Planning</h1>
        <p className={styles.subtitle}>This planner is private. Enter the password to continue.</p>
        <input
          type="password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
        />
        {error && <span className={styles.error}>Wrong password</span>}
        <button type="submit" className={styles.button} disabled={submitting}>
          {submitting ? "Checking…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
