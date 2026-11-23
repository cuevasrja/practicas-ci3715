import { recordProgress } from "@/modules/course/application/record-progress";
import { LocalStorageProgressRepository } from "./local-storage-progress-repository";

/** Raíz de composición del lado cliente: progreso guardado en el navegador. */
const repository = new LocalStorageProgressRepository("sa:progreso");

export const progressContainer = {
  repository,
  recordProgress: (slug: string, step: number) => recordProgress(repository, slug, step),
};
