"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import styles from "./Snackbar.module.scss";

type SnackbarVariant = "error" | "info";

interface SnackbarState {
  id: number;
  message: string;
  variant: SnackbarVariant;
  closing: boolean;
}

interface SnackbarOptions {
  variant?: SnackbarVariant;
  duration?: number;
}

interface SnackbarContextValue {
  showSnackbar: (message: string, options?: SnackbarOptions) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error("useSnackbar must be used within a SnackbarProvider");
  return ctx;
}

const DEFAULT_DURATION = 3000;
const EXIT_DURATION = 180;

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const idRef = useRef(0);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSnackbar = useCallback((message: string, options?: SnackbarOptions) => {
    const id = ++idRef.current;
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (removeTimeoutRef.current) clearTimeout(removeTimeoutRef.current);

    setSnackbar({ id, message, variant: options?.variant ?? "info", closing: false });

    hideTimeoutRef.current = setTimeout(() => {
      setSnackbar((cur) => (cur?.id === id ? { ...cur, closing: true } : cur));
      removeTimeoutRef.current = setTimeout(() => {
        setSnackbar((cur) => (cur?.id === id ? null : cur));
      }, EXIT_DURATION);
    }, options?.duration ?? DEFAULT_DURATION);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {snackbar && (
        <div
          key={snackbar.id}
          className={`${styles.snackbar} ${styles[snackbar.variant]} ${
            snackbar.closing ? styles.closing : ""
          }`}
          role="status"
        >
          {snackbar.message}
        </div>
      )}
    </SnackbarContext.Provider>
  );
}
