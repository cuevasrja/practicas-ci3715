import type { Lesson } from "@/modules/course/domain/lesson";
import { balanceoDeCarga } from "./balanceo-de-carga";
import { cacheLesson } from "./cache";
import { cicloDeUnaPeticion } from "./ciclo-de-una-peticion";

/** Temario, en el orden en que se muestra. */
export const LESSONS: readonly Lesson[] = [cicloDeUnaPeticion, balanceoDeCarga, cacheLesson];
