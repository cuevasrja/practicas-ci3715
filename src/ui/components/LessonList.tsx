"use client";

import Link from "next/link";
import type { LessonSummary } from "@/modules/course/application/lesson-summary";
import { percentDone, resumeStep, stepsDone } from "@/modules/course/domain/progress";
import { useProgress } from "@/ui/hooks/use-progress";

const TRACK_LABEL = { principal: "Clase", catalogo: "Catálogo", extra: "Extra" } as const;

export function LessonList({ lessons }: { lessons: LessonSummary[] }) {
  const progress = useProgress();
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {lessons.map((l) => {
        const done = stepsDone(progress, l.slug, l.steps);
        const pct = percentDone(done, l.steps);
        const resume = resumeStep(done, l.steps);
        const href = resume ? `/leccion/${l.slug}?paso=${resume}` : `/leccion/${l.slug}`;
        return (
          <li key={l.slug}>
            <Link
              href={href}
              className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-accent"
            >
              <span className="font-mono text-xs text-muted">
                {l.label ?? TRACK_LABEL[l.track]} · {l.minutes} min · {l.steps} pasos
              </span>
              <span className="mt-2 font-display text-xl font-bold leading-snug text-ink">
                {l.title}
              </span>
              <span className="mt-2 flex-1 text-[15px] leading-relaxed text-ink-2">
                {l.summary}
              </span>
              <span className="mt-5 flex items-center gap-3">
                <span
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
                  aria-hidden="true"
                >
                  <span
                    className="block h-full rounded-full bg-accent-fill"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="text-xs font-medium text-ink-2 group-hover:text-accent">
                  {done === 0
                    ? "Empezar"
                    : done === l.steps
                      ? "Completada"
                      : `Continuar · ${pct} %`}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
