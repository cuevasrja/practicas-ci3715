import type { Lesson } from "@/modules/course/domain/lesson";
import type { Entity, Flow, Link } from "@/modules/diagram/domain/scene";

const backlog = (tags?: string[]): Entity => ({
  id: "pb",
  type: "queue",
  x: 0,
  y: 0,
  label: "Product Backlog",
  tone: "amber",
  tags,
});
const planning: Entity = {
  id: "plan",
  type: "block",
  x: 4,
  y: 0,
  label: "Sprint Planning",
  icon: "users",
  tone: "cyan",
};
const sprint = (tags?: string[]): Entity => ({
  id: "sprint",
  type: "block",
  x: 8,
  y: 0,
  label: "Sprint",
  icon: "bolt",
  tone: "emerald",
  tags,
});
const incremento: Entity = {
  id: "inc",
  type: "block",
  x: 8,
  y: 4,
  label: "Incremento",
  icon: "files",
  tone: "violet",
};
const review: Entity = {
  id: "review",
  type: "block",
  x: 4,
  y: 4,
  label: "Sprint Review",
  icon: "users",
  tone: "indigo",
};
const retro: Entity = {
  id: "retro",
  type: "block",
  x: 0,
  y: 4,
  label: "Retrospectiva",
  icon: "shield",
  tone: "rose",
};

const l = (from: string, to: string): Link => ({ from, to });
const hastaIncremento = [l("pb", "plan"), l("plan", "sprint"), l("sprint", "inc")];
const hastaReview = [...hastaIncremento, l("inc", "review")];
const rueda = [...hastaReview, l("review", "retro"), l("retro", "pb")];

const tarjeta = (route: string[], rate = 0.6): Flow => ({ route, kind: "request", rate });

const cascada: Entity[] = [
  { id: "req", type: "block", x: 0, y: 0, label: "Requerimientos", tone: "slate" },
  { id: "dis", type: "block", x: 4, y: 0, label: "Diseño", tone: "slate" },
  { id: "cod", type: "block", x: 8, y: 0, label: "Código", tone: "slate" },
  { id: "pru", type: "block", x: 12, y: 0, label: "Pruebas", tone: "slate" },
  {
    id: "cli",
    type: "device",
    x: 16,
    y: 0,
    label: "Cliente",
    icon: "users",
    tone: "indigo",
    tags: ["lo ve al final"],
  },
];

export const clase01: Lesson = {
  slug: "clase-1-scrum",
  module: "Proceso y análisis",
  track: "principal",
  label: "Clase 1",
  title: "Ingeniería de software ágil y SCRUM",
  summary:
    "Por qué se entrega en ciclos cortos y cómo gira un sprint: del backlog al incremento, la revisión y la retrospectiva.",
  minutes: 9,
  goals: [
    "Explicar por qué el software se construye en ciclos cortos",
    "Nombrar los roles, artefactos y eventos de SCRUM",
    "Seguir una historia desde el backlog hasta el incremento",
  ],
  steps: [
    {
      title: "Todo de una sola vez",
      kind: "problema",
      body: [
        "El software es complejo y cambia mientras se construye. Si el trabajo avanza en fases largas, una detrás de otra, el cliente solo ve el resultado al final.",
        "Para entonces lo que pidió ya cambió, y corregir el rumbo cuesta todo lo que se hizo antes.",
      ],
      metrics: [
        { label: "Primera entrega", value: 11, unit: "semanas" },
        { label: "Revisiones del cliente", value: 1 },
      ],
      scene: {
        entities: cascada,
        links: [l("req", "dis"), l("dis", "cod"), l("cod", "pru"), l("pru", "cli")],
        flows: [{ route: ["req", "dis", "cod", "pru", "cli"], kind: "slow", rate: 0.25 }],
      },
    },
    {
      title: "Entregar en ciclos cortos",
      kind: "tecnica",
      body: [
        "El enfoque ágil parte el trabajo en ciclos de duración fija llamados sprints. Cada sprint toma un poco del Product Backlog y termina con un incremento: software que funciona.",
        "El Manifiesto Ágil lo resume en cuatro valores; uno de ellos es preferir el software que funciona a la documentación exhaustiva.",
      ],
      changes: ["+ Product Backlog", "+ Sprint Planning", "+ Sprint", "+ Incremento"],
      metrics: [
        { label: "Primera entrega", value: 2, unit: "semanas" },
        { label: "Revisiones del cliente", value: 5 },
      ],
      scene: {
        entities: [backlog(["historias ordenadas"]), planning, sprint(), incremento],
        links: hastaIncremento,
        flows: [tarjeta(["pb", "plan", "sprint", "inc"])],
      },
    },
    {
      title: "Tres roles",
      kind: "tecnica",
      body: [
        "El Product Owner decide qué se construye y en qué orden: es quien ordena el backlog. El equipo de desarrollo decide cómo y construye el incremento.",
        "El Scrum Master no manda: cuida que el proceso se cumpla y quita los impedimentos que frenan al equipo.",
      ],
      changes: ["~ Cada parte del ciclo tiene un responsable"],
      scene: {
        entities: [
          {
            id: "sm",
            type: "zone",
            x: 4,
            y: 2,
            w: 13,
            d: 9,
            label: "Scrum Master: cuida el proceso",
            tone: "cyan",
          },
          backlog(["Product Owner"]),
          planning,
          sprint(["Equipo de desarrollo"]),
          incremento,
        ],
        links: hastaIncremento,
        flows: [tarjeta(["pb", "plan", "sprint", "inc"])],
      },
    },
    {
      title: "Dentro del sprint",
      kind: "tecnica",
      body: [
        "En el Sprint Planning el equipo elige las historias que cabe terminar: eso es el Sprint Backlog. Durante el sprint, ese alcance no se cambia.",
        "Cada día, en el Daily, el equipo se sincroniza en quince minutos: qué se hizo, qué sigue y qué estorba.",
      ],
      changes: ["~ El sprint tiene duración fija y una reunión diaria"],
      scene: {
        entities: [
          backlog(["Product Owner"]),
          planning,
          sprint(["Daily · 15 min", "día 4 de 10"]),
          incremento,
        ],
        links: hastaIncremento,
        flows: [tarjeta(["pb", "plan", "sprint", "inc"])],
      },
    },
    {
      title: "Mostrar lo construido",
      kind: "tecnica",
      body: [
        "Al cerrar el sprint, el equipo muestra el incremento en el Sprint Review. El cliente lo prueba y opina sobre algo real, no sobre un documento.",
        "Lo que se aprende ahí cambia el orden del backlog para el sprint siguiente.",
      ],
      changes: ["+ Sprint Review"],
      scene: {
        entities: [backlog(), planning, sprint(), incremento, review],
        links: hastaReview,
        flows: [tarjeta(["pb", "plan", "sprint", "inc", "review"])],
      },
    },
    {
      title: "Mejorar la forma de trabajar",
      kind: "solucion",
      body: [
        "La Retrospectiva mira al equipo, no al producto: qué funcionó, qué no y qué se va a cambiar en el próximo sprint.",
        "Con ella se cierra la rueda. El siguiente sprint empieza con un backlog reordenado y un equipo que trabaja un poco mejor.",
      ],
      changes: ["+ Retrospectiva", "~ El ciclo se cierra y vuelve a empezar"],
      metrics: [
        { label: "Sprints", value: 5 },
        { label: "Semanas", value: 11 },
      ],
      scene: {
        entities: [backlog(), planning, sprint(), incremento, review, retro],
        links: rueda,
        flows: [tarjeta(["pb", "plan", "sprint", "inc", "review", "retro", "pb"], 0.7)],
      },
    },
    {
      title: "Resumen",
      kind: "resumen",
      body: [
        "SCRUM entrega valor en ciclos cortos y aprende de cada uno. Tiene tres roles, tres artefactos y cuatro eventos dentro de un sprint de duración fija.",
        "En el laboratorio lo vivirás durante 11 semanas, construyendo un traductor en tiempo real en equipos de 4 a 5 personas.",
      ],
      scene: {
        entities: [
          backlog(),
          planning,
          sprint(),
          incremento,
          review,
          retro,
          {
            id: "tabla",
            type: "panel",
            x: -6,
            y: 8,
            label: "SCRUM en una tabla",
            rows: [
              ["Roles", "PO · SM · equipo"],
              ["Artefactos", "backlogs · incremento"],
              ["Eventos", "Planning · Daily"],
              ["", "Review · Retro"],
              ["Sprint", "duración fija"],
            ],
          },
        ],
        links: rueda,
        flows: [tarjeta(["pb", "plan", "sprint", "inc", "review", "retro", "pb"], 0.7)],
      },
    },
  ],
};
