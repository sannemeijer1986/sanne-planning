"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useSnackbar } from "@/components/Snackbar/SnackbarProvider";
import { NOTES_MAX_LENGTH } from "@/types/planning";
import styles from "./NotesWidget.module.scss";

const SAVE_DEBOUNCE_MS = 800;
const SAVED_INDICATOR_MS = 1500;

function NoteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 4h9l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M14 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 13h8M8 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

interface NotesWidgetProps {
  editMode: boolean;
}

export default function NotesWidget({ editMode }: NotesWidgetProps) {
  const [open, setOpen] = useState(true);
  const [notes, setNotes] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedIndicatorRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    fetch("/api/notes")
      .then((res) => (res.ok ? res.json() : { notes: "" }))
      .then((data) => setNotes(data.notes ?? ""))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!open || !textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [notes, open]);

  function scheduleSave(value: string) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const res = await fetch("/api/notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: value }),
      }).catch(() => null);
      if (res?.ok) {
        setSaved(true);
        if (savedIndicatorRef.current) clearTimeout(savedIndicatorRef.current);
        savedIndicatorRef.current = setTimeout(() => setSaved(false), SAVED_INDICATOR_MS);
      }
    }, SAVE_DEBOUNCE_MS);
  }

  function handleChange(value: string) {
    setNotes(value);
    if (editMode) scheduleSave(value);
  }

  function handleTextareaPointerDown(e: ReactPointerEvent<HTMLTextAreaElement>) {
    if (!editMode) {
      e.preventDefault();
      showSnackbar("Can't edit in view mode", { variant: "error" });
    }
  }

  return (
    <div className={styles.wrapper}>
      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <span className={styles.title}>Notes</span>
            <div className={styles.headerRight}>
              {saved && <span className={styles.saved}>Saved</span>}
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setOpen(false)}
                aria-label="Close notes"
                title="Close notes"
              >
                <CloseIcon />
              </button>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={notes}
            onChange={(e) => handleChange(e.target.value)}
            onPointerDown={handleTextareaPointerDown}
            readOnly={!editMode}
            placeholder={editMode ? "Leave a note…" : "No notes yet."}
            maxLength={NOTES_MAX_LENGTH}
            disabled={!loaded}
          />
        </div>
      )}
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close notes" : "Open notes"}
        title="Notes"
      >
        <NoteIcon />
      </button>
    </div>
  );
}
