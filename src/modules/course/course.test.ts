import { describe, expect, test } from "bun:test";
import type { IsoScene } from "@/modules/diagram/domain/scene";
import { getLesson } from "./application/get-lesson";
import { listLessons } from "./application/list-lessons";
import { recordProgress } from "./application/record-progress";
import type { Lesson } from "./domain/lesson";
import { validateLesson } from "./domain/lesson-validation";
import {
  EMPTY_PROGRESS,
  type Progress,
  percentDone,
  resumeStep,
  stepsDone,
  withStep,
} from "./domain/progress";
import type { ProgressRepository } from "./domain/progress-repository";
import { LESSONS } from "./infrastructure/content";
import { StaticLessonRepository } from "./infrastructure/static-lesson-repository";

const lesson = (slug: string, extra: Partial<Lesson> = {}): Lesson => ({
  slug,
  module: "Prueba",
  track: "principal",
  title: slug,
  summary: "",
  minutes: 1,
  goals: [],
  steps: [
    {
      title: "uno",
      kind: "tecnica",
      body: [],
      scene: {
        entities: [
          { id: "a", type: "block", x: 0, y: 0, label: "A" },
          { id: "b", type: "block", x: 4, y: 0, label: "B" },
        ],
        links: [{ from: "a", to: "b" }],
        flows: [{ route: ["a", "b"], kind: "request", rate: 1 }],
      },
    },
  ],
  ...extra,
});

class MemoryProgress implements ProgressRepository {
  saves = 0;
  constructor(private value: Progress = EMPTY_PROGRESS) {}
  load = () => this.value;
  save = (p: Progress) => {
    this.value = p;
    this.saves++;
  };
  subscribe = () => () => {};
}

describe("progreso (dominio)", () => {
  test("avanza pero nunca retrocede", () => {
    const a = withStep(EMPTY_PROGRESS, "x", 3);
    expect(a).toEqual({ x: 3 });
    expect(withStep(a, "x", 2)).toBe(a);
    expect(withStep(a, "x", 0)).toBe(a);
    expect(withStep(a, "y", 1)).toEqual({ x: 3, y: 1 });
  });

  test("pasos hechos, porcentaje y punto de reanudación", () => {
    expect(stepsDone({ x: 12 }, "x", 8)).toBe(8);
    expect(stepsDone({}, "x", 8)).toBe(0);
    expect(percentDone(2, 8)).toBe(25);
    expect(resumeStep(1, 8)).toBeNull();
    expect(resumeStep(4, 8)).toBe(4);
    expect(resumeStep(8, 8)).toBeNull();
  });
});

describe("validación de lecciones (dominio)", () => {
  test("acepta una lección coherente", () => {
    expect(validateLesson(lesson("ok"))).toEqual([]);
  });

  test("detecta enlaces y flujos rotos", () => {
    const bad = lesson("Mal Slug");
    (bad.steps[0].scene as IsoScene).links = [{ from: "a", to: "z" }];
    const problems = validateLesson(bad).join("\n");
    expect(problems).toContain("slug no válido");
    expect(problems).toContain('"z", que no existe');
    expect(problems).toContain('de "a" a "b" sin enlace');
  });
});

describe("casos de uso", () => {
  const repo = new StaticLessonRepository([lesson("uno"), lesson("dos")]);

  test("listLessons devuelve resúmenes en orden", async () => {
    const list = await listLessons(repo);
    expect(list.map((l) => l.slug)).toEqual(["uno", "dos"]);
    expect(list[0].steps).toBe(1);
  });

  test("getLesson incluye la siguiente lección", async () => {
    expect((await getLesson(repo, "uno"))?.next?.slug).toBe("dos");
    expect((await getLesson(repo, "dos"))?.next).toBeNull();
    expect(await getLesson(repo, "nada")).toBeNull();
  });

  test("recordProgress solo guarda cuando hay avance", () => {
    const progress = new MemoryProgress();
    recordProgress(progress, "uno", 2);
    recordProgress(progress, "uno", 1);
    recordProgress(progress, "uno", 2);
    expect(progress.load()).toEqual({ uno: 2 });
    expect(progress.saves).toBe(1);
  });
});

describe("contenido", () => {
  test("todas las lecciones publicadas son válidas y con slug único", () => {
    for (const l of LESSONS) expect(validateLesson(l), l.slug).toEqual([]);
    expect(new Set(LESSONS.map((l) => l.slug)).size).toBe(LESSONS.length);
  });

  test("el repositorio rechaza contenido roto", () => {
    const bad = lesson("roto");
    (bad.steps[0].scene as IsoScene).flows = [{ route: ["a", "c"], kind: "request", rate: 1 }];
    expect(() => new StaticLessonRepository([bad])).toThrow("no válida");
  });
});
