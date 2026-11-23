import type { Lesson } from "@/modules/course/domain/lesson";
import type { Entity, Link } from "@/modules/diagram/domain/scene";

// --- Espagueti: todos dependen de todos.
const enredo: Entity[] = [
  { id: "ui", type: "block", x: 0, y: 0, label: "Interfaz", icon: "browser", tone: "cyan" },
  { id: "audio", type: "block", x: 4, y: -3, label: "Audio", tone: "slate" },
  { id: "trad", type: "block", x: 4, y: 3, label: "Traducción", tone: "slate" },
  { id: "hist", type: "block", x: 8, y: 0, label: "Historial", tone: "slate" },
  { id: "datos", type: "db", x: 12, y: 0, label: "Datos", tone: "emerald" },
];
const hilos: Link[] = [
  { from: "ui", to: "audio", via: "y", heads: "both" },
  { from: "ui", to: "trad", via: "y", heads: "both" },
  { from: "ui", to: "hist", heads: "both" },
  { from: "audio", to: "trad", heads: "both" },
  { from: "audio", to: "hist", via: "x", heads: "both" },
  { from: "trad", to: "hist", via: "x", heads: "both" },
  { from: "hist", to: "datos", heads: "both" },
  { from: "audio", to: "datos", via: "x", heads: "both" },
  { from: "trad", to: "datos", via: "x", heads: "both" },
];

// --- Capas.
const presentacion: Entity = {
  id: "ui",
  type: "block",
  x: 0,
  y: 0,
  label: "Presentación",
  icon: "browser",
  tone: "cyan",
  tags: ["«capa»"],
};
const logica: Entity = {
  id: "logica",
  type: "block",
  x: 5,
  y: 0,
  label: "Lógica",
  icon: "server",
  tone: "amber",
  tags: ["«capa»"],
};
const datos = (x: number): Entity => ({
  id: "datos",
  type: "db",
  x,
  y: 0,
  label: "Datos",
  tone: "emerald",
  tags: ["«capa»"],
});

// --- Particiones dentro de la capa de lógica (Cuentas Claras).
const particion = (id: string, y: number, label: string): Entity => ({
  id,
  type: "block",
  x: 5,
  y,
  label,
  icon: "server",
  tone: "amber",
});
const particiones = [
  particion("gastos", -4, "Gastos"),
  particion("grupos", 0, "Grupos"),
  particion("notif", 4, "Notificaciones"),
];
const hilosParticiones: Link[] = [
  { from: "ui", to: "gastos", via: "y", heads: "both" },
  { from: "ui", to: "grupos", heads: "both" },
  { from: "ui", to: "notif", via: "y", heads: "both" },
  { from: "gastos", to: "datos", via: "x", heads: "both" },
  { from: "grupos", to: "datos", heads: "both" },
  { from: "notif", to: "datos", via: "x", heads: "both" },
];

// --- Hexágono.
const dominio = (tags: string[]): Entity => ({
  id: "dom",
  type: "block",
  x: 5,
  y: 0,
  label: "Dominio",
  icon: "shield",
  tone: "emerald",
  tags,
});
const http: Entity = {
  id: "http",
  type: "block",
  x: 0,
  y: 0,
  label: "Adaptador HTTP",
  icon: "globe",
  tone: "cyan",
};
const hexLinks = (db: string): Link[] => [
  { from: "http", to: "dom", heads: "both", label: "puerto" },
  { from: "dom", to: db, heads: "both", label: "puerto" },
];

export const clase04: Lesson = {
  slug: "clase-4-diseno-del-sistema",
  module: "Diseño",
  track: "principal",
  label: "Clase 4",
  title: "Diseño del sistema y estilos de arquitectura",
  summary:
    "Cómo se parte un sistema en subsistemas y cómo se comunican: acoplamiento, capas, particiones y el hexágono.",
  minutes: 10,
  goals: [
    "Reconocer acoplamiento alto y cohesión baja en un diseño",
    "Distinguir una capa de una partición",
    "Explicar qué protege la arquitectura hexagonal",
  ],
  steps: [
    {
      title: "Espagueti",
      kind: "problema",
      body: [
        "El análisis dijo qué hace el sistema; el diseño decide cómo se parte en subsistemas. Si nadie lo decide, cada parte acaba llamando a todas las demás.",
        "Cada hilo es una dependencia. Con tantos, cambiar la base de datos obliga a revisar casi todo: eso es acoplamiento alto.",
      ],
      metrics: [{ label: "Dependencias", value: 9 }],
      scene: {
        entities: enredo,
        links: hilos,
        flows: [
          { route: ["ui", "audio", "trad", "hist", "datos"], kind: "request", rate: 0.5 },
          { route: ["ui", "trad", "datos"], kind: "request", rate: 0.5 },
          { route: ["ui", "hist", "audio", "datos"], kind: "request", rate: 0.5 },
        ],
      },
    },
    {
      title: "Ordenar en capas",
      kind: "tecnica",
      body: [
        "Una capa agrupa subsistemas que ofrecen servicios a la capa de arriba usando solo las de abajo. Presentación usa lógica, y lógica usa datos.",
        "Quedan pocas dependencias y todas apuntan en el mismo sentido. Dentro de cada capa, las cosas que cambian juntas viven juntas: cohesión alta.",
      ],
      changes: ["~ Tres capas en lugar de cinco piezas enredadas", "− Siete dependencias"],
      metrics: [{ label: "Dependencias", value: 2 }],
      scene: {
        entities: [presentacion, logica, datos(10)],
        links: [
          { from: "ui", to: "logica" },
          { from: "logica", to: "datos" },
        ],
        flows: [],
      },
    },
    {
      title: "La petición baja, la respuesta sube",
      kind: "tecnica",
      body: [
        "Una petición entra por arriba y baja capa por capa. La respuesta vuelve por el mismo camino.",
        "Una capa inferior no conoce a las superiores: nunca se llama hacia arriba. En una arquitectura cerrada, además, cada capa usa solo la inmediatamente inferior.",
      ],
      changes: ["~ El tráfico recorre las capas en orden"],
      metrics: [{ label: "Dependencias", value: 2 }],
      scene: {
        entities: [presentacion, logica, datos(10)],
        links: [
          { from: "ui", to: "logica", heads: "both" },
          { from: "logica", to: "datos", heads: "both" },
        ],
        flows: [{ route: ["ui", "logica", "datos"], kind: "request", rate: 0.8, bounce: true }],
      },
    },
    {
      title: "Particiones dentro de una capa",
      kind: "tecnica",
      body: [
        "Una capa se puede partir a lo ancho. Las particiones son subsistemas pares, uno por funcionalidad: en Cuentas Claras, gastos, grupos y notificaciones.",
        "Las capas separan por nivel de abstracción; las particiones, por tema. Un buen diseño tiene entre cinco y nueve subsistemas por nivel.",
      ],
      changes: ["~ La lógica se divide en tres particiones"],
      scene: {
        entities: [presentacion, ...particiones, datos(10)],
        links: hilosParticiones,
        flows: [
          { route: ["ui", "gastos", "datos"], kind: "request", rate: 0.5, bounce: true },
          { route: ["ui", "grupos", "datos"], kind: "request", rate: 0.5, bounce: true },
          { route: ["ui", "notif", "datos"], kind: "request", rate: 0.5, bounce: true },
        ],
      },
    },
    {
      title: "El hexágono: el dominio al centro",
      kind: "tecnica",
      body: [
        "La arquitectura hexagonal pone las reglas del negocio en el centro. El dominio no sabe si lo llaman por HTTP ni dónde se guardan los datos.",
        "Lo que sí define son puertos: interfaces que dicen qué necesita. Los adaptadores, en el borde, las implementan con una tecnología concreta.",
      ],
      changes: ["+ Dominio", "+ Adaptador HTTP", "+ Adaptador de base de datos"],
      scene: {
        entities: [
          http,
          dominio(["reglas del negocio"]),
          { id: "pg", type: "db", x: 10, y: 0, label: "Adaptador PostgreSQL", tone: "indigo" },
        ],
        links: hexLinks("pg"),
        flows: [{ route: ["http", "dom", "pg"], kind: "request", rate: 0.8, bounce: true }],
      },
    },
    {
      title: "Cambiar un adaptador",
      kind: "solucion",
      body: [
        "La aplicación de escritorio de Cuentas Claras guarda los datos en el dispositivo. Basta con cambiar el adaptador por otro que implemente el mismo puerto.",
        "El dominio no se toca. Esa es la ventaja que se compra con el trabajo extra de definir puertos.",
      ],
      changes: ["− Adaptador PostgreSQL", "+ Adaptador SQLite", "~ El dominio queda igual"],
      scene: {
        entities: [
          http,
          dominio(["sin cambios"]),
          { id: "sqlite", type: "db", x: 10, y: 0, label: "Adaptador SQLite", tone: "violet" },
        ],
        links: hexLinks("sqlite"),
        flows: [{ route: ["http", "dom", "sqlite"], kind: "request", rate: 0.8, bounce: true }],
      },
    },
    {
      title: "Resumen",
      kind: "resumen",
      body: [
        "El diseño del sistema reparte el trabajo en subsistemas con acoplamiento bajo y cohesión alta. Quien manda son los objetivos de diseño, que salen de los requerimientos no funcionales.",
        "Cada estilo responde a un objetivo distinto. Ninguno es mejor en general.",
      ],
      scene: {
        entities: [
          http,
          dominio(["reglas del negocio"]),
          { id: "sqlite", type: "db", x: 10, y: 0, label: "Adaptador SQLite", tone: "violet" },
          {
            id: "tabla",
            type: "panel",
            x: 0,
            y: 5,
            label: "Qué busca cada estilo",
            rows: [
              ["Capas", "cambiar una tecnología"],
              ["Cliente-servidor", "muchos clientes"],
              ["Microservicios", "despliegue aparte"],
              ["Eventos", "desacoplar"],
              ["Hexagonal", "proteger el dominio"],
            ],
          },
        ],
        links: hexLinks("sqlite"),
        flows: [{ route: ["http", "dom", "sqlite"], kind: "request", rate: 0.8, bounce: true }],
      },
    },
  ],
};
