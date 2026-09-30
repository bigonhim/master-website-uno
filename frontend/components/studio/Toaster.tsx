"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { cx } from "./ui";

type Tone = "success" | "error" | "info";
type Toast = { id: number; tone: Tone; text: string };

const ToastContext = createContext<(text: string, tone?: Tone) => void>(() => {});

/** Brief confirmations ("Saved. Live on the site now.") in the corner. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((text: string, tone: Tone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((all) => [...all.slice(-3), { id, tone, text }]);
    window.setTimeout(
      () => setToasts((all) => all.filter((t) => t.id !== id)),
      tone === "error" ? 8000 : 4000,
    );
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[80] flex flex-col items-end gap-2 sm:left-auto sm:w-96"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={cx(
              "pointer-events-auto w-full animate-rise rounded-md px-4 py-3 text-body-sm font-semibold shadow-lg ring-1",
              toast.tone === "success" && "bg-primary-700 text-ink-0 ring-primary-800",
              toast.tone === "info" && "bg-ink-0 text-primary-900 ring-ink-200",
              toast.tone === "error" && "bg-danger text-ink-0 ring-danger",
            )}
          >
            {toast.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
