import type { Lesson } from "@/modules/course/domain/lesson";
import { balanceoDeCarga } from "./balanceo-de-carga";
import { cacheLesson } from "./cache";
import { estilosClasicos } from "./catalogo-estilos-clasicos";
import { estilosDistribuidos } from "./catalogo-estilos-distribuidos";
import { patronesComportamiento1 } from "./catalogo-patrones-comportamiento-1";
import { patronesComportamiento2 } from "./catalogo-patrones-comportamiento-2";
import { patronesCreacionales } from "./catalogo-patrones-creacionales";
import { patronesEstructurales } from "./catalogo-patrones-estructurales";
import { cicloDeUnaPeticion } from "./ciclo-de-una-peticion";
import { clase01 } from "./clase-01-scrum";
import { clase02 } from "./clase-02-requerimientos";
import { clase03 } from "./clase-03-modelo-de-analisis";
import { clase04 } from "./clase-04-diseno-del-sistema";
import { clase05 } from "./clase-05-patrones-de-diseno";
import { clase06 } from "./clase-06-repaso-parcial-1";
import { clase07 } from "./clase-07-responsabilidades-y-contratos";
import { clase08 } from "./clase-08-secuencia-de-diseno";
import { clase09 } from "./clase-09-estilos-en-secuencia";
import { clase10 } from "./clase-10-patrones-de-comportamiento";
import { clase11 } from "./clase-11-repaso-parcial-2";

/** Temario: las clases del curso, en orden; después el catálogo y los extras. */
export const LESSONS: readonly Lesson[] = [
  clase01,
  clase02,
  clase03,
  clase04,
  clase05,
  clase06,
  clase07,
  clase08,
  clase09,
  clase10,
  clase11,
  estilosClasicos,
  estilosDistribuidos,
  patronesCreacionales,
  patronesEstructurales,
  patronesComportamiento1,
  patronesComportamiento2,
  cicloDeUnaPeticion,
  balanceoDeCarga,
  cacheLesson,
];
