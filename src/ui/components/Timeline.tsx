"use client";

import type { Step } from "@/modules/course/domain/lesson";

export function Timeline({
  steps,
  index,
  onSelect,
}: {
  steps: Step[];
  index: number;
  onSelect: (i: number) => void;
}) {
  const pct = steps.length > 1 ? (index / (steps.length - 1)) * 100 : 100;
  return (
    <div className="border-t border-line bg-surface px-3 py-2.5">
      <div className="h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div
          className="h-full rounded-full bg-accent-fill transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="mt-2 flex gap-1 overflow-x-auto pb-0.5">
        {steps.map((s, i) => (
          <li key={s.title} className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={i === index ? "step" : undefined}
              title={s.title}
              className={`flex w-full min-w-9 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs ${
                i === index
                  ? "bg-accent-soft font-semibold text-ink"
                  : i < index
                    ? "text-ink-2 hover:bg-bg"
                    : "text-muted hover:bg-bg"
              }`}
            >
              <span className="font-mono">{i + 1}</span>
              <span className="hidden truncate 2xl:inline">{s.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
