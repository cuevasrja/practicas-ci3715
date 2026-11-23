import type { Lesson } from "@/modules/course/domain/lesson";
import type { Entity, Link } from "@/modules/diagram/domain/scene";

const cliente = (tags: string[]): Entity => ({
  id: "cli",
  type: "device",
  x: 0,
  y: 0,
  label: "Cliente",
  icon: "users",
  tone: "indigo",
  tags,
});
const equipo: Entity = {
  id: "eq",
  type: "block",
  x: 5,
  y: 0,
  label: "Equipo",
  icon: "server",
  tone: "slate",
};
const funcional: Entity = {
  id: "rf",
  type: "block",
  x: 5,
  y: -3,
  label: "Requerimiento funcional",
  tone: "cyan",
  tags: ["traducir audio a texto"],
};
const noFuncional = (tags: string[]): Entity => ({
  id: "rnf",
  type: "block",
  x: 5,
  y: 3,
  label: "Requerimiento no funcional",
  tone: "amber",
  tags,
});

const epica: Entity = {
  id: "epica",
  type: "block",
  x: 0,
  y: 0,
  label: "Épica",
  tone: "violet",
  tags: ["Traducir conversaciones"],
};
const historia = (n: 1 | 2 | 3, tags?: string[]): Entity => ({
  id: `h${n}`,
  type: "block",
  x: 4,
  y: (n - 2) * 4,
  label: `Historia ${n}`,
  tone: "cyan",
  tags,
});
const tarea = (n: 1 | 2): Entity => ({
  id: `t${n}`,
  type: "queue",
  x: 9,
  y: n === 1 ? -2 : 2,
  label: n === 1 ? "Tarea: capturar audio" : "Tarea: mostrar texto",
  tone: "slate",
});

const aHistoria = (n: 1 | 2 | 3): Link => ({ from: "epica", to: `h${n}`, via: "y" });
const aTarea = (n: 1 | 2): Link => ({ from: "h2", to: `t${n}`, via: "x" });
const arbol = [aHistoria(1), aHistoria(2), aHistoria(3)];

export const clase02: Lesson = {
  slug: "clase-2-requerimientos",
  module: "Proceso y análisis",
  track: "principal",
  label: "Clase 2",
  title: "Requerimientos",
  summary:
    "Un requerimiento es una promesa sobre lo que el sistema hará. Cómo volverlo verificable y cómo se organiza en épicas, historias y tareas.",
  minutes: 9,
  goals: [
    "Distinguir un requerimiento funcional de uno no funcional",
    "Reescribir un requerimiento ambiguo hasta que sea verificable",
    "Descomponer una épica en historias de usuario y tareas",
  ],
  steps: [
    {
      title: "Una promesa que no se puede comprobar",
      kind: "problema",
      body: [
        "El cliente del traductor pide que «la traducción sea rápida». El equipo asiente, pero cada persona entiende algo distinto por rápida.",
        "Un requerimiento es una promesa sobre lo que el sistema hará. Si no se puede verificar, nadie sabrá si se cumplió.",
      ],
      scene: {
        entities: [cliente(["«que sea rápida»"]), equipo],
        links: [{ from: "cli", to: "eq", style: "cut" }],
        flows: [{ route: ["cli", "eq"], kind: "drop", rate: 0.7, fail: 1 }],
      },
    },
    {
      title: "Funcionales y no funcionales",
      kind: "tecnica",
      body: [
        "Lo primero es separar dos cosas. Un requerimiento funcional dice qué hace el sistema: traducir audio a texto.",
        "Uno no funcional dice cómo lo hace: desempeño, usabilidad, confiabilidad, seguridad o restricciones de implementación. «Rápida» es de este tipo.",
      ],
      changes: ["+ Requerimiento funcional", "+ Requerimiento no funcional"],
      scene: {
        entities: [cliente(["pide un traductor"]), funcional, noFuncional(["«rápida»"])],
        links: [
          { from: "cli", to: "rf", via: "y" },
          { from: "cli", to: "rnf", via: "y" },
        ],
        flows: [
          { route: ["cli", "rf"], kind: "request", rate: 0.7 },
          { route: ["cli", "rnf"], kind: "request", rate: 0.7 },
        ],
      },
    },
    {
      title: "Hacerlo verificable",
      kind: "solucion",
      body: [
        "«Rápida» se reescribe hasta que se pueda medir: el texto traducido aparece en dos segundos o menos, en el 95 % de las frases.",
        "Verificable es uno de los siete criterios de validación. Los otros: completo, consistente, no ambiguo, correcto, realista y trazable.",
      ],
      note: "La prueba: ¿podrías escribir un caso de prueba que diga si se cumple o no?",
      changes: ["~ «rápida» pasa a tener un número y una condición"],
      scene: {
        entities: [
          cliente(["pide un traductor"]),
          funcional,
          noFuncional(["≤ 2 s", "en el 95 % de las frases"]),
        ],
        links: [
          { from: "cli", to: "rf", via: "y" },
          { from: "cli", to: "rnf", via: "y" },
        ],
        flows: [
          { route: ["cli", "rf"], kind: "request", rate: 0.7 },
          { route: ["cli", "rnf"], kind: "request", rate: 0.7 },
        ],
      },
    },
    {
      title: "De la épica a las historias",
      kind: "tecnica",
      body: [
        "En SCRUM los requerimientos viven en el backlog con distintos tamaños. Una épica es un objetivo grande, que no cabe en un sprint.",
        "Se parte en historias de usuario: trozos que sí caben y que entregan algo útil por sí solos.",
      ],
      changes: ["+ Épica", "+ Tres historias de usuario"],
      scene: {
        entities: [epica, historia(1), historia(2), historia(3)],
        links: arbol,
        flows: [
          { route: ["epica", "h1"], kind: "request", rate: 0.4 },
          { route: ["epica", "h2"], kind: "request", rate: 0.4 },
          { route: ["epica", "h3"], kind: "request", rate: 0.4 },
        ],
      },
    },
    {
      title: "La historia y sus tareas",
      kind: "tecnica",
      body: [
        "Una historia se escribe desde quien la necesita: «Como ‹rol›, quiero ‹acción› para ‹beneficio›», con criterios de aceptación que dicen cuándo está terminada.",
        "El equipo la descompone en tareas técnicas. La historia le habla al cliente; las tareas, al equipo.",
      ],
      changes: ["+ Dos tareas de la historia 2"],
      scene: {
        entities: [
          epica,
          historia(1),
          historia(2, ["Como turista, quiero…"]),
          historia(3),
          tarea(1),
          tarea(2),
        ],
        links: [...arbol, aTarea(1), aTarea(2)],
        flows: [
          { route: ["epica", "h2", "t1"], kind: "request", rate: 0.5 },
          { route: ["epica", "h2", "t2"], kind: "request", rate: 0.5 },
        ],
      },
    },
    {
      title: "Estimar entre todos",
      kind: "tecnica",
      body: [
        "Antes de comprometerse, el equipo estima cada historia en puntos. En el planning poker todos muestran su carta a la vez, para que nadie copie al de al lado.",
        "Se discuten los extremos, el más alto y el más bajo, y se repite la ronda hasta que los valores convergen.",
      ],
      changes: ["~ Cada historia recibe su estimación en puntos"],
      metrics: [{ label: "Puntos estimados", value: 16 }],
      scene: {
        entities: [
          epica,
          historia(1, ["3 puntos"]),
          historia(2, ["8 puntos"]),
          historia(3, ["5 puntos"]),
          tarea(1),
          tarea(2),
        ],
        links: [...arbol, aTarea(1), aTarea(2)],
        flows: [],
      },
    },
    {
      title: "Resumen",
      kind: "resumen",
      body: [
        "Un requerimiento que no se puede verificar no sirve. Los funcionales dicen qué hace el sistema y los no funcionales cómo lo hace.",
        "En el backlog se organizan por tamaño: del producto mínimo viable a la épica, la historia de usuario y la tarea.",
      ],
      scene: {
        entities: [
          epica,
          historia(1, ["3 puntos"]),
          historia(2, ["8 puntos"]),
          historia(3, ["5 puntos"]),
          tarea(1),
          tarea(2),
          {
            id: "tabla",
            type: "panel",
            x: -6,
            y: 5,
            label: "Siete criterios",
            rows: [
              ["Completo", "no falta nada"],
              ["Consistente", "sin contradicciones"],
              ["No ambiguo", "una sola lectura"],
              ["Correcto", "lo que se necesita"],
              ["Realista", "se puede construir"],
              ["Verificable", "se puede probar"],
              ["Trazable", "se sabe su origen"],
            ],
          },
        ],
        links: [...arbol, aTarea(1), aTarea(2)],
        flows: [],
      },
    },
  ],
};
