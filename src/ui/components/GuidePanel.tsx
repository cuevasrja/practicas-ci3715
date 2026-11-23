"use client";

import Link from "next/link";
import type { Step, StepKind } from "@/modules/course/domain/lesson";

const KIND: Record<StepKind, { label: string; cls: string }> = {
  problema: { label: "Problema", cls: "text-bad border-bad/40" },
  tecnica: { label: "Técnica", cls: "text-accent border-accent/40" },
  solucion: { label: "Solución", cls: "text-ok border-ok/40" },
  resumen: { label: "Resumen", cls: "text-ink-2 border-line" },
};

const CHANGE: Record<string, string> = {
  "+": "text-ok",
  "~": "text-warn",
  "−": "text-bad",
  "-": "text-bad",
};

export function GuidePanel({
  step,
  index,
  total,
  onPrev,
  onNext,
  nextLesson,
}: {
  step: Step;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  nextLesson?: { href: string; title: string };
}) {
  const kind = KIND[step.kind];
  const last = index === total - 1;
  return (
    <section aria-live="polite" className="flex h-full flex-col">
      <div key={index} className="guide-in flex-1 overflow-y-auto p-5">
        <div className="flex items-center gap-2 text-xs">
          <span className={`rounded-full border px-2 py-0.5 font-semibold ${kind.cls}`}>
            {kind.label}
          </span>
          <span className="font-mono text-muted">
            Paso {index + 1} de {total}
          </span>
        </div>
        <h2 className="mt-3 text-xl font-semibold leading-tight tracking-tight text-ink">
          {step.title}
        </h2>
        <div className="mt-3 flex flex-col gap-3 text-[15px] leading-relaxed text-ink-2">
          {step.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        {step.note ? (
          <p className="mt-4 rounded-lg border-l-2 border-accent bg-accent-soft px-3 py-2.5 text-sm leading-relaxed text-ink">
            {step.note}
          </p>
        ) : null}
        {step.changes?.length ? (
          <div className="mt-5">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
              Qué cambia en el diagrama
            </p>
            <ul className="flex flex-col gap-1 font-mono text-[12.5px] text-ink-2">
              {step.changes.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className={`font-bold ${CHANGE[c[0]] ?? "text-muted"}`}>{c[0]}</span>
                  <span>{c.slice(1).trim()}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2 border-t border-line p-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={index === 0}
          className="shrink-0 whitespace-nowrap rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-ink-2 hover:bg-bg disabled:opacity-40"
        >
          ← Anterior
        </button>
        {last && nextLesson ? (
          <Link
            href={nextLesson.href}
            className="ml-auto truncate rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-surface hover:opacity-90"
          >
            Siguiente lección: {nextLesson.title} →
          </Link>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={last}
            className="ml-auto rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-surface hover:opacity-90 disabled:opacity-40"
          >
            Siguiente →
          </button>
        )}
      </div>
    </section>
  );
}
