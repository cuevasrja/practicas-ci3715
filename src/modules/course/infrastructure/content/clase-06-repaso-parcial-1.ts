import type { Lesson } from "@/modules/course/domain/lesson";
import type { Entity, Link } from "@/modules/diagram/domain/scene";

const estudiante = (tags?: string[]): Entity => ({
  id: "est",
  type: "device",
  x: 0,
  y: 0,
  label: "Estudiante",
  icon: "users",
  tone: "indigo",
  tags,
});
const profesor: Entity = {
  id: "prof",
  type: "device",
  x: 0,
  y: 4,
  label: "Profesor",
  icon: "users",
  tone: "indigo",
};
const casoDeUso: Entity = {
  id: "cu",
  type: "block",
  x: 4,
  y: 0,
  label: "ReservarLaboratorio",
  tone: "amber",
  tags: ["caso de uso"],
};

const pieza = (id: string, x: number, y: number, tone: Entity["tone"]) => {
  return (label: string, tags: string[], type: Entity["type"] = "block"): Entity => ({
    id,
    type,
    x,
    y,
    label,
    tone,
    tags,
  });
};
const limite = pieza("lim", 4, 0, "cyan");
const control = pieza("ctl", 8, 0, "amber");
const reserva = pieza("res", 12, 0, "emerald");
const laboratorio = pieza("lab", 8, 4, "emerald");

const actores: Link[] = [
  { from: "est", to: "lim", heads: "both" },
  { from: "prof", to: "lim", via: "x", heads: "both" },
];
const objetos: Link[] = [
  ...actores,
  { from: "lim", to: "ctl", heads: "both" },
  { from: "ctl", to: "res", heads: "both" },
  { from: "ctl", to: "lab", heads: "both" },
];

export const clase06: Lesson = {
  slug: "clase-6-repaso-parcial-1",
  module: "Diseño",
  track: "principal",
  label: "Clase 6",
  title: "Repaso del primer parcial",
  summary:
    "El método paso a paso para la parte escrita, aplicado al ejercicio de reservas de laboratorio.",
  minutes: 8,
  goals: [
    "Seguir un método ordenado para la parte escrita del parcial",
    "Pasar del enunciado a los objetos de análisis",
    "Convertir los objetos de análisis en un diseño por capas",
  ],
  steps: [
    {
      title: "Leer y marcar el enunciado",
      kind: "tecnica",
      body: [
        "El ejercicio: un sistema para reservar laboratorios. Antes de dibujar nada, se lee el texto completo y se marca: personas, cosas que el sistema recuerda y acciones.",
        "En la parte de selección, la técnica es otra: descarta primero las opciones falsas, cada una con su razón.",
      ],
      scene: {
        entities: [estudiante(["reservar un laboratorio"])],
        links: [],
        flows: [],
      },
    },
    {
      title: "Actores y casos de uso",
      kind: "tecnica",
      body: [
        "Las personas del texto son los actores: el estudiante y el profesor. Lo que quieren lograr son los casos de uso.",
        "Cada caso de uso se describe con la plantilla: actores, flujo de eventos, condiciones de entrada y de salida.",
      ],
      changes: ["+ Profesor", "+ Caso de uso ReservarLaboratorio"],
      scene: {
        entities: [estudiante(), profesor, casoDeUso],
        links: [
          { from: "est", to: "cu" },
          { from: "prof", to: "cu", via: "x" },
        ],
        flows: [
          { route: ["est", "cu"], kind: "request", rate: 0.6 },
          { route: ["prof", "cu"], kind: "request", rate: 0.4 },
        ],
      },
    },
    {
      title: "Objetos de análisis",
      kind: "tecnica",
      body: [
        "El caso de uso se reparte en objetos. La pantalla de reservas es el límite, un objeto de control coordina y las entidades guardan lo que persiste: la reserva y el laboratorio.",
        "Recuerda la regla de la clase 3: los actores solo hablan con el límite.",
      ],
      changes: ["− El caso de uso se reparte en objetos", "+ Límite, control y dos entidades"],
      scene: {
        entities: [
          estudiante(),
          profesor,
          limite("PantallaReservas", ["«boundary»"]),
          control("ControlReserva", ["«control»"]),
          reserva("Reserva", ["«entity»"]),
          laboratorio("Laboratorio", ["«entity»"]),
        ],
        links: objetos,
        flows: [
          { route: ["est", "lim", "ctl", "res"], kind: "request", rate: 0.6, bounce: true },
          { route: ["prof", "lim", "ctl", "lab"], kind: "request", rate: 0.4, bounce: true },
        ],
      },
    },
    {
      title: "Del análisis al diseño",
      kind: "tecnica",
      body: [
        "Cada objeto de análisis tiene su traducción: el límite pasa a ser la interfaz o un controlador, el control un servicio de aplicación, y la entidad un objeto de dominio más su repositorio.",
        "Con eso salen las capas: presentación, aplicación, dominio y datos.",
      ],
      changes: ["~ Los mismos objetos, ahora como componentes por capa"],
      scene: {
        entities: [
          estudiante(),
          profesor,
          limite("AppWeb", ["«presentación»"]),
          control("ReservarLaboratorio", ["«aplicación»"]),
          reserva("Reserva", ["«dominio»"]),
          laboratorio("RepositorioReservas", ["«datos»"], "db"),
        ],
        links: objetos,
        flows: [
          { route: ["est", "lim", "ctl", "res"], kind: "request", rate: 0.6, bounce: true },
          { route: ["est", "lim", "ctl", "lab"], kind: "query", rate: 0.5, bounce: true },
        ],
      },
    },
    {
      title: "Un patrón, con su justificación",
      kind: "solucion",
      body: [
        "Si el ejercicio pide un patrón, no basta con nombrarlo. Hay que decir qué problema resuelve aquí y qué consecuencia trae.",
        "Una reserva pasa por estados (pendiente, confirmada, cancelada) y se comporta distinto en cada uno. Ese es el problema que resuelve State.",
      ],
      changes: ["~ La reserva usa el patrón State"],
      scene: {
        entities: [
          estudiante(),
          profesor,
          limite("AppWeb", ["«presentación»"]),
          control("ReservarLaboratorio", ["«aplicación»"]),
          reserva("Reserva", ["State", "pendiente → confirmada"]),
          laboratorio("RepositorioReservas", ["«datos»"], "db"),
        ],
        links: objetos,
        flows: [
          { route: ["est", "lim", "ctl", "res"], kind: "request", rate: 0.6, bounce: true },
          { route: ["est", "lim", "ctl", "lab"], kind: "query", rate: 0.5, bounce: true },
        ],
      },
    },
    {
      title: "Resumen",
      kind: "resumen",
      body: [
        "El método es siempre el mismo y va en orden. Saltarse el primer paso es la causa más habitual de un diagrama al que le faltan piezas.",
        "Practica con el simulacro de la cafetería siguiendo estos mismos pasos.",
      ],
      scene: {
        entities: [
          estudiante(),
          profesor,
          limite("AppWeb", ["«presentación»"]),
          control("ReservarLaboratorio", ["«aplicación»"]),
          reserva("Reserva", ["«dominio»"]),
          laboratorio("RepositorioReservas", ["«datos»"], "db"),
          {
            id: "tabla",
            type: "panel",
            x: 0,
            y: 9,
            label: "Método para la parte escrita",
            rows: [
              ["1", "leer y marcar el texto"],
              ["2", "actores y casos de uso"],
              ["3", "límite, control, entidad"],
              ["4", "capas y subsistemas"],
              ["5", "patrón justificado"],
            ],
          },
        ],
        links: objetos,
        flows: [{ route: ["est", "lim", "ctl", "res"], kind: "request", rate: 0.6, bounce: true }],
      },
    },
  ],
};
