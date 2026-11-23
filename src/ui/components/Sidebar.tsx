"use client";

import Link from "next/link";
import type { LessonSummary } from "@/modules/course/application/lesson-summary";
import { stepsDone } from "@/modules/course/domain/progress";
import { useProgress } from "@/ui/hooks/use-progress";

export function Sidebar({
  module,
  lessons,
  current,
  goals,
}: {
  module: string;
  lessons: LessonSummary[];
  current: string;
  goals: string[];
}) {
  const progress = useProgress();
  return (
    <nav aria-label="Lecciones" className="flex flex-col gap-5 p-4 text-sm">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
          {module}
        </p>
        <ol className="flex flex-col gap-1">
          {lessons.map((l, i) => {
            const done = stepsDone(progress, l.slug, l.steps);
            const active = l.slug === current;
            return (
              <li key={l.slug}>
                <Link
                  href={`/leccion/${l.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 ${
                    active ? "bg-accent-soft font-semibold text-ink" : "text-ink-2 hover:bg-bg"
                  }`}
                >
                  <span className="font-mono text-xs text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{l.title}</span>
                  <span className="font-mono text-[11px] text-muted">
                    {done === l.steps ? "✓" : `${done}/${l.steps}`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Al terminar podrás
        </p>
        <ul className="flex flex-col gap-2 text-[13px] leading-snug text-ink-2">
          {goals.map((g) => (
            <li key={g} className="flex gap-2">
              <span
                aria-hidden="true"
                className="mt-[7px] size-1.5 shrink-0 rounded-full bg-accent"
              />
              {g}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
