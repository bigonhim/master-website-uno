"use client";

import { useState, type ReactNode } from "react";

import { move } from "./hooks";
import { cx } from "./ui";

/**
 * A list that can be put in order by dragging a row's handle, or with its
 * up and down buttons for anyone not using a mouse.
 */
export function SortableList<T>({
  items,
  getKey,
  onReorder,
  renderItem,
  label,
}: {
  items: T[];
  getKey: (item: T, index: number) => string | number;
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  /** Names a row for the buttons, e.g. "photo 2". */
  label: (item: T, index: number) => string;
}) {
  const [from, setFrom] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const reset = () => {
    setFrom(null);
    setOver(null);
  };

  return (
    <ol className="space-y-2">
      {items.map((item, index) => (
        <li
          key={getKey(item, index)}
          onDragOver={(e) => {
            if (from === null) return;
            e.preventDefault();
            setOver(index);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (from !== null) onReorder(move(items, from, index));
            reset();
          }}
          className={cx(
            "flex items-stretch gap-2 rounded-md bg-ink-0 ring-1 ring-ink-100 transition",
            from === index && "opacity-40",
            over === index && from !== null && from !== index && "ring-2 ring-primary-400",
          )}
        >
          <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 border-r border-ink-100 px-1.5 py-2">
            <button
              type="button"
              aria-label={`Move ${label(item, index)} up`}
              disabled={index === 0}
              onClick={() => onReorder(move(items, index, index - 1))}
              className="grid h-6 w-6 place-items-center rounded text-ink-500 hover:bg-ink-50 hover:text-primary-700 disabled:opacity-30"
            >
              <Chevron up />
            </button>
            <span
              draggable
              onDragStart={(e) => {
                setFrom(index);
                e.dataTransfer.effectAllowed = "move";
                const row = e.currentTarget.closest("li");
                if (row) e.dataTransfer.setDragImage(row, 16, 16);
              }}
              onDragEnd={reset}
              title="Drag to reorder"
              className="grid h-6 w-6 cursor-grab place-items-center text-ink-400 active:cursor-grabbing"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                {[6, 12, 18].map((y) =>
                  [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />),
                )}
              </svg>
            </span>
            <button
              type="button"
              aria-label={`Move ${label(item, index)} down`}
              disabled={index === items.length - 1}
              onClick={() => onReorder(move(items, index, index + 1))}
              className="grid h-6 w-6 place-items-center rounded text-ink-500 hover:bg-ink-50 hover:text-primary-700 disabled:opacity-30"
            >
              <Chevron />
            </button>
          </div>
          <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
        </li>
      ))}
    </ol>
  );
}

function Chevron({ up = false }: { up?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2.5]">
      <path d={up ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
