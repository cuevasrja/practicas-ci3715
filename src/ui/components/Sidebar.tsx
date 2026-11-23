"use client";

import Link from "next/link";
import { groupByModule } from "@/modules/course/application/group-by-module";
import type { LessonSummary } from "@/modules/course/application/lesson-summary";
import { stepsDone } from "@/modules/course/domain/progress";
import { useProgress } from "@/ui/hooks/use-progress";

const TRACK_PREFIX = { principal: "", catalogo: "Catálogo · ", extra: "Extra · " } as const;

export function Sidebar({
  lessons,
  current,
  goals,
}: {
  lessons: LessonSummary[];
  current: string;
  goals: string[];
}) {
  const progress = useProgress();
  return (
    <nav aria-label="Lecciones" className="flex flex-col gap-5 p-4 text-[15px]">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">
          Al terminar podrás
        </p>
        <ul className="flex flex-col gap-2 text-sm leading-snug text-ink-2">
          {goals.map((g) => (
            <li key={g} className="flex gap-2">
              <span
                aria-hidden="true"
                className="mt-[7px] size-1.5 shrink-0 rounded-full bg-accent-fill"
              />
              {g}
            </li>
          ))}
        </ul>
      </div>
      {groupByModule(lessons).map(([module, group]) => (
        <div key={module}>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
            {TRACK_PREFIX[group[0].track]}
            {module}
          </p>
          <ol className="flex flex-col gap-0.5">
            {group.map((l) => {
              const done = stepsDone(progress, l.slug, l.steps);
              const active = l.slug === current;
              return (
                <li key={l.slug}>
                  <Link
                    href={`/leccion/${l.slug}`}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
                      active ? "bg-accent-soft font-bold text-ink" : "text-ink-2 hover:bg-bg"
                    }`}
                  >
                    <span className="w-5 shrink-0 text-right font-mono text-xs text-muted">
                      {l.label?.replace(/\D+/g, "") || "·"}
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
      ))}
    </nav>
  );
}
