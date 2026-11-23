"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LessonSummary } from "@/modules/course/application/lesson-summary";
import type { Lesson } from "@/modules/course/domain/lesson";
import { progressContainer } from "@/modules/course/infrastructure/progress-container";
import { EMPTY_SCENE, type PacketKind } from "@/modules/diagram/domain/scene";
import { useReducedMotion } from "@/ui/hooks/use-reduced-motion";
import { setUrlStep, useUrlStep } from "@/ui/hooks/use-url-step";
import { GuidePanel } from "./GuidePanel";
import { Hud } from "./Hud";
import { Sidebar } from "./Sidebar";
import { type StageHandle, StageView } from "./StageView";
import { Timeline } from "./Timeline";

const KIND_LABEL: Record<PacketKind, string> = {
  request: "petición",
  response: "respuesta",
  handshake: "negociación",
  query: "consulta",
  write: "escritura",
  slow: "petición lenta",
  drop: "borrado",
  ping: "sondeo",
};

function ToolButton({
  onClick,
  label,
  hint,
  children,
}: {
  onClick: () => void;
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={`${label} (${hint})`}
      className="grid size-9 place-items-center rounded-lg border border-line bg-surface/90 text-ink-2 backdrop-blur hover:text-ink"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}

export function LessonPlayer({
  lesson,
  lessons,
  next,
}: {
  lesson: Lesson;
  lessons: LessonSummary[];
  next: LessonSummary | null;
}) {
  const total = lesson.steps.length;
  const index = useUrlStep(total) - 1;
  const step = lesson.steps[index];
  const reduced = useReducedMotion();
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const paused = userPaused ?? reduced;
  const stage = useRef<StageHandle>(null);

  const go = useCallback(
    (i: number) => setUrlStep(Math.min(Math.max(0, i), total - 1) + 1),
    [total],
  );
  const replay = useCallback(() => {
    const prev = index > 0 ? lesson.steps[index - 1].scene : EMPTY_SCENE;
    stage.current?.replay(prev, lesson.steps[index].scene);
  }, [index, lesson]);
  const togglePause = useCallback(() => setUserPaused(!paused), [paused]);

  useEffect(() => {
    progressContainer.recordProgress(lesson.slug, index + 1);
  }, [lesson.slug, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const typing = !!target?.closest("input, textarea, select, [contenteditable]");
      if (typing) return;
      if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === "r" || e.key === "R") replay();
      else if (e.key === "0") stage.current?.fit();
      else if (e.key === " ") {
        // En un botón o enlace, Espacio conserva su función habitual.
        if (target?.closest("button, a")) return;
        togglePause();
      } else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, replay, togglePause]);

  const kinds = [...new Set(step.scene.flows.map((f) => f.kind))];

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[232px_minmax(0,1fr)_400px]">
      <aside className="hidden overflow-y-auto border-r border-line bg-surface xl:block">
        <Sidebar
          module={lesson.module}
          lessons={lessons}
          current={lesson.slug}
          goals={lesson.goals}
        />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-col">
        <div className="relative h-[52dvh] min-h-80 lg:h-auto lg:flex-1">
          <StageView
            ref={stage}
            scene={step.scene}
            paused={paused}
            label={`Diagrama animado: ${step.title}`}
          />
          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-3">
            <div className="pointer-events-auto">
              <Hud metrics={step.metrics ?? []} />
            </div>
            <div className="pointer-events-auto flex shrink-0 gap-1.5">
              <ToolButton onClick={replay} label="Repetir la animación" hint="R">
                <path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5" />
              </ToolButton>
              <ToolButton
                onClick={togglePause}
                label={paused ? "Reanudar el tráfico" : "Pausar el tráfico"}
                hint="Espacio"
              >
                {paused ? <path d="M8 5.5v13l10-6.5z" /> : <path d="M9 5v14M15 5v14" />}
              </ToolButton>
              <ToolButton
                onClick={() => stage.current?.fit()}
                label="Encuadrar el diagrama"
                hint="0"
              >
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
              </ToolButton>
            </div>
          </div>
          {kinds.length ? (
            <ul className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-x-3 gap-y-1 rounded-lg border border-line bg-surface/90 px-2.5 py-1.5 text-[11px] text-ink-2 backdrop-blur">
              {kinds.map((k) => (
                <li key={k} className="flex items-center gap-1.5">
                  <svg viewBox="-6 -6 12 12" className="size-3" aria-hidden="true">
                    <circle className={`pkt pkt--${k}`} r="4.4" />
                  </svg>
                  {KIND_LABEL[k]}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <Timeline steps={lesson.steps} index={index} onSelect={go} />
      </div>

      <aside className="min-h-0 border-t border-line bg-surface lg:border-l lg:border-t-0">
        <GuidePanel
          step={step}
          index={index}
          total={total}
          onPrev={() => go(index - 1)}
          onNext={() => go(index + 1)}
          nextLesson={next ? { href: `/leccion/${next.slug}`, title: next.title } : undefined}
        />
      </aside>
    </div>
  );
}
