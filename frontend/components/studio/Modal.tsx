"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cx } from "./ui";

/**
 * A native <dialog>: focus is trapped and restored, Escape closes it, and the
 * rest of the page is inert while it is open, all without a library.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "lg",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop lands on the dialog element itself.
        if (e.target === ref.current) onClose();
      }}
      className={cx(
        "m-auto max-h-[92dvh] w-[calc(100%-2rem)] overflow-hidden rounded-lg bg-ink-0 p-0 shadow-lg backdrop:bg-primary-950/60 backdrop:backdrop-blur-sm",
        size === "md" && "max-w-lg",
        size === "lg" && "max-w-3xl",
        size === "xl" && "max-w-6xl",
      )}
    >
      {open ? (
        <div className="flex max-h-[92dvh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-ink-100 px-5 py-4">
            <h2 className="text-h4 text-primary-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-md text-ink-600 hover:bg-ink-50"
            >
              <span className="sr-only">Close</span>
              <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
          {footer ? (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ink-100 bg-ink-25 px-5 py-3">
              {footer}
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
