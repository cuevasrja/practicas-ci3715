"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_PROGRESS, type Progress } from "@/modules/course/domain/progress";
import { progressContainer } from "@/modules/course/infrastructure/progress-container";

const { repository } = progressContainer;
const serverSnapshot = () => EMPTY_PROGRESS;

/** Progreso del estudiante, reactivo a cambios (también desde otras pestañas). */
export function useProgress(): Progress {
  return useSyncExternalStore(repository.subscribe, repository.load, serverSnapshot);
}
