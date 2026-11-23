import type { Lesson } from "@/modules/course/domain/lesson";
import type { Entity, Link } from "@/modules/diagram/domain/scene";

// --- Decorator: caché sobre el proveedor de tasas.
const saldo: Entity = {
  id: "saldo",
  type: "block",
  x: 0,
  y: 0,
  label: "CalcularSaldo",
  icon: "server",
  tone: "cyan",
};
const proveedor = (x: number, load: number): Entity => ({
  id: "prov",
  type: "block",
  x,
  y: 0,
  label: "ProveedorTasas",
  icon: "globe",
  tone: "slate",
  load,
});
const cache = (tags: string[]): Entity => ({
  id: "deco",
  type: "block",
  x: 5,
  y: 0,
  label: "TasasConCaché",
  icon: "bolt",
  tone: "amber",
  tags,
});

// --- Strategy: reglas para dividir un gasto.
const gasto: Entity = {
  id: "gasto",
  type: "block",
  x: 0,
  y: 0,
  label: "Gasto",
  icon: "files",
  tone: "cyan",
};
const regla: Entity = {
  id: "regla",
  type: "block",
  x: 4,
  y: 0,
  label: "ReglaDivision",
  icon: "split",
  tone: "amber",
  tags: ["«interface»"],
};
const estrategia = (id: string, y: number, label: string): Entity => ({
  id,
  type: "block",
  x: 9,
  y,
  label,
  tone: "violet",
});
const estrategias = [
  estrategia("iguales", -4, "PartesIguales"),
  estrategia("pct", 0, "PorPorcentaje"),
  estrategia("montos", 4, "PorMontos"),
];
const reglas = (activa: string): Link[] => [
  { from: "gasto", to: "regla" },
  ...["iguales", "pct", "montos"].map(
    (id): Link => ({
      from: "regla",
      to: id,
      via: "y",
      style: id === activa ? "solid" : "off",
    }),
  ),
];

// --- Proxy: carga perezosa del historial.
const pantalla: Entity = {
  id: "pant",
  type: "device",
  x: 0,
  y: 0,
  label: "Pantalla",
  icon: "browser",
  tone: "indigo",
};
const proxy: Entity = {
  id: "proxy",
  type: "block",
  x: 4,
  y: 0,
  label: "HistorialProxy",
  icon: "shield",
  tone: "amber",
  tags: ["Proxy"],
};
const historial = (tags: string[]): Entity => ({
  id: "real",
  type: "db",
  x: 9,
  y: 0,
  label: "Historial real",
  tone: "emerald",
  tags,
});

export const clase05: Lesson = {
  slug: "clase-5-patrones-de-diseno",
  module: "Diseño",
  track: "principal",
  label: "Clase 5",
  title: "Diseño de objetos y patrones",
  summary:
    "Un patrón es una solución probada a un problema que se repite. Decorator, Strategy y Proxy sobre Cuentas Claras.",
  minutes: 11,
  goals: [
    "Describir un patrón por su problema, su solución y sus consecuencias",
    "Explicar cómo Decorator añade comportamiento sin modificar una clase",
    "Diferenciar Strategy, Decorator y Proxy por lo que resuelven",
  ],
  steps: [
    {
      title: "Un problema que se repite",
      kind: "problema",
      body: [
        "Cuentas Claras maneja varias monedas. Cada vez que calcula un saldo pide la tasa de cambio a un servicio externo, que es lento y cobra por llamada.",
        "Es un problema que aparece una y otra vez en el software, y ya tiene soluciones probadas. A esas soluciones, con sus consecuencias conocidas, las llamamos patrones.",
      ],
      metrics: [
        { label: "Llamadas externas", value: 120, unit: "/min" },
        { label: "Espera", value: 400, unit: "ms" },
      ],
      scene: {
        entities: [saldo, proveedor(5, 0.92)],
        links: [{ from: "saldo", to: "prov", heads: "both" }],
        flows: [
          {
            route: ["saldo", "prov"],
            kind: "slow",
            rate: 1.6,
            bounce: true,
            speed: 2.2,
            dwellAt: { prov: 0.8 },
          },
        ],
      },
    },
    {
      title: "Decorator: envolver sin modificar",
      kind: "solucion",
      body: [
        "Un decorador envuelve al objeto original y ofrece la misma interfaz. Quien lo usa no nota la diferencia.",
        "Este recuerda las tasas ya pedidas. La llamada atraviesa la caché y solo llega al proveedor cuando no hay dato guardado. La clase del proveedor no se tocó.",
      ],
      changes: ["+ TasasConCaché, delante del proveedor"],
      metrics: [
        { label: "Llamadas externas", value: 4, unit: "/min" },
        { label: "Espera", value: 12, unit: "ms" },
      ],
      scene: {
        entities: [saldo, cache(["Decorator", "misma interfaz"]), proveedor(10, 0.1)],
        links: [
          { from: "saldo", to: "deco", heads: "both" },
          { from: "deco", to: "prov", heads: "both" },
        ],
        flows: [
          { route: ["saldo", "deco"], kind: "request", rate: 1.8, bounce: true },
          { route: ["deco", "prov"], kind: "query", rate: 0.3, bounce: true },
        ],
      },
    },
    {
      title: "Strategy: un if por cada caso",
      kind: "problema",
      body: [
        "Otro problema: un gasto compartido se puede dividir en partes iguales, por porcentaje o por montos fijos. Con un if por cada regla, la clase Gasto crece con cada regla nueva.",
        "Strategy saca cada algoritmo a su propio objeto, todos detrás de una misma interfaz. El gasto solo conoce la interfaz.",
      ],
      changes: ["+ ReglaDivision «interface»", "+ Tres reglas intercambiables"],
      scene: {
        entities: [gasto, regla, ...estrategias],
        links: reglas("iguales"),
        flows: [{ route: ["gasto", "regla", "iguales"], kind: "request", rate: 0.8, bounce: true }],
      },
    },
    {
      title: "Cambiar la regla sin tocar el gasto",
      kind: "solucion",
      body: [
        "Para dividir por porcentaje se le entrega al gasto otra regla. El código de Gasto es exactamente el mismo.",
        "En Strategy es el cliente quien elige el algoritmo. Guarda esa idea: será la diferencia con State en la clase 10.",
      ],
      changes: ["~ La regla activa pasa a ser PorPorcentaje"],
      scene: {
        entities: [gasto, regla, ...estrategias],
        links: reglas("pct"),
        flows: [{ route: ["gasto", "regla", "pct"], kind: "request", rate: 0.8, bounce: true }],
      },
    },
    {
      title: "Proxy: un sustituto ligero",
      kind: "tecnica",
      body: [
        "El historial de movimientos puede tener miles de filas, y la mayoría de las veces el usuario abre la pantalla sin mirarlo.",
        "Un proxy ocupa el lugar del objeto real con su misma interfaz. Mientras nadie pida el historial, no se carga nada.",
      ],
      changes: ["+ HistorialProxy", "~ El historial real sigue sin cargarse"],
      metrics: [{ label: "Movimientos cargados", value: 0 }],
      scene: {
        entities: [pantalla, proxy, historial(["sin cargar"])],
        links: [
          { from: "pant", to: "proxy", heads: "both" },
          { from: "proxy", to: "real", style: "off" },
        ],
        flows: [{ route: ["pant", "proxy"], kind: "request", rate: 1, bounce: true }],
      },
    },
    {
      title: "Cargar solo cuando hace falta",
      kind: "solucion",
      body: [
        "Cuando el usuario por fin abre el historial, el proxy carga el objeto real y le pasa la llamada. A partir de ahí se comporta como él.",
        "Proxy y Decorator se parecen en el dibujo. La diferencia es la intención: el decorador añade comportamiento; el proxy controla el acceso.",
      ],
      changes: ["~ El proxy carga el historial real"],
      metrics: [{ label: "Movimientos cargados", value: 2400 }],
      scene: {
        entities: [pantalla, proxy, historial(["cargado"])],
        links: [
          { from: "pant", to: "proxy", heads: "both" },
          { from: "proxy", to: "real", heads: "both" },
        ],
        flows: [{ route: ["pant", "proxy", "real"], kind: "request", rate: 1, bounce: true }],
      },
    },
    {
      title: "Resumen",
      kind: "resumen",
      body: [
        "Un patrón se evalúa por tres cosas: el problema que resuelve, la solución que propone y las consecuencias que trae. Aplicarlo donde no hay problema solo añade clases.",
        "El catálogo tiene tres familias: creacionales, estructurales y de comportamiento. Cuentas Claras evita a propósito el Singleton: el reloj y el generador de identificadores se inyectan.",
      ],
      scene: {
        entities: [
          pantalla,
          proxy,
          historial(["cargado"]),
          {
            id: "tabla",
            type: "panel",
            x: -1,
            y: 5,
            label: "Qué resuelve cada uno",
            rows: [
              ["Decorator", "añadir sin modificar"],
              ["Strategy", "algoritmos a elegir"],
              ["Proxy", "controlar el acceso"],
              ["Adapter", "traducir una interfaz"],
              ["Composite", "tratar árbol y hoja igual"],
            ],
          },
        ],
        links: [
          { from: "pant", to: "proxy", heads: "both" },
          { from: "proxy", to: "real", heads: "both" },
        ],
        flows: [{ route: ["pant", "proxy", "real"], kind: "request", rate: 1, bounce: true }],
      },
    },
  ],
};
