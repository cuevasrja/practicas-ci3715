import type { Lesson } from "@/modules/course/domain/lesson";
import type { Entity, Flow, Link } from "@/modules/diagram/domain/scene";

const usuario: Entity = {
  id: "u",
  type: "device",
  x: 0,
  y: 0,
  label: "Usuario",
  icon: "users",
  tone: "indigo",
  tags: ["TraducirAudio"],
};
const limite: Entity = {
  id: "lim",
  type: "block",
  x: 4,
  y: 0,
  label: "PantallaTraduccion",
  icon: "browser",
  tone: "cyan",
  tags: ["«boundary»"],
};
const control: Entity = {
  id: "ctl",
  type: "block",
  x: 8,
  y: 0,
  label: "ControlTraduccion",
  icon: "split",
  tone: "amber",
  tags: ["«control»"],
};
const sesion: Entity = {
  id: "ses",
  type: "block",
  x: 8,
  y: 5,
  label: "SesionTraduccion",
  icon: "files",
  tone: "emerald",
  tags: ["«entity»"],
};
const segmento: Entity = {
  id: "seg",
  type: "block",
  x: 13,
  y: 5,
  label: "Segmento",
  icon: "files",
  tone: "emerald",
  tags: ["«entity»"],
};

const entra: Link = { from: "u", to: "lim", heads: "both" };
const coordina: Link = { from: "lim", to: "ctl", heads: "both" };
const consulta: Link = { from: "ctl", to: "ses", heads: "both" };
const compone: Link = { from: "ses", to: "seg", label: "1 a muchos" };

const recorrido = (route: string[]): Flow => ({ route, kind: "request", rate: 0.7, bounce: true });

export const clase03: Lesson = {
  slug: "clase-3-modelo-de-analisis",
  module: "Proceso y análisis",
  track: "principal",
  label: "Clase 3",
  title: "Modelo de análisis",
  summary:
    "Describir el problema con objetos del dominio antes de decidir cómo se implementa: entidad, límite y control.",
  minutes: 9,
  goals: [
    "Clasificar un objeto como entidad, límite o control",
    "Explicar por qué el actor nunca habla con una entidad",
    "Aplicar las heurísticas de Abbott a un texto",
  ],
  steps: [
    {
      title: "El problema, no la solución",
      kind: "tecnica",
      body: [
        "El análisis describe el problema en el lenguaje del dominio, sin decidir todavía cómo se implementa. Nada de bases de datos ni de pantallas concretas.",
        "Partimos de un caso de uso del traductor: TraducirAudio. La pregunta es qué objetos hacen falta para que ocurra.",
      ],
      note: "Tres modelos lo describen: funcional (casos de uso), de objetos (clases) y dinámico (secuencia y estados).",
      scene: { entities: [usuario], links: [], flows: [] },
    },
    {
      title: "Objetos límite",
      kind: "tecnica",
      body: [
        "Un objeto límite representa la interacción con un actor. Todo lo que el usuario ve o toca pasa por uno.",
        "Aquí es la pantalla de traducción. En el diagrama se marca con el estereotipo «boundary».",
      ],
      changes: ["+ PantallaTraduccion «boundary»"],
      scene: { entities: [usuario, limite], links: [entra], flows: [recorrido(["u", "lim"])] },
    },
    {
      title: "Objetos de control",
      kind: "tecnica",
      body: [
        "Un objeto de control coordina un caso de uso: sabe en qué orden ocurren las cosas, pero no guarda información del negocio.",
        "Suele haber uno por caso de uso. Nace cuando el caso empieza y deja de hacer falta cuando termina.",
      ],
      changes: ["+ ControlTraduccion «control»"],
      scene: {
        entities: [usuario, limite, control],
        links: [entra, coordina],
        flows: [recorrido(["u", "lim", "ctl"])],
      },
    },
    {
      title: "Objetos entidad",
      kind: "tecnica",
      body: [
        "Una entidad es información que persiste: lo que el sistema recuerda cuando el caso de uso ya terminó.",
        "La sesión de traducción sabe de qué idioma a qué idioma se traduce. El mensaje entra siempre por el límite, pasa por el control y llega a la entidad.",
      ],
      changes: ["+ SesionTraduccion «entity»"],
      scene: {
        entities: [usuario, limite, control, sesion],
        links: [entra, coordina, consulta],
        flows: [recorrido(["u", "lim", "ctl", "ses"])],
      },
    },
    {
      title: "El actor no toca las entidades",
      kind: "problema",
      body: [
        "Un error típico es dibujar al actor hablando directamente con una entidad. Así el modelo ya no dice quién valida ni quién coordina.",
        "La regla: los actores solo se comunican con objetos límite. Si el usuario necesita algo de la sesión, lo pide por la pantalla.",
      ],
      changes: ["− El atajo del usuario a la entidad no es válido"],
      scene: {
        entities: [usuario, limite, control, sesion],
        links: [entra, coordina, consulta, { from: "u", to: "ses", via: "y", style: "cut" }],
        flows: [
          recorrido(["u", "lim", "ctl", "ses"]),
          { route: ["u", "ses"], kind: "drop", rate: 0.5, fail: 1 },
        ],
      },
    },
    {
      title: "Asociaciones entre entidades",
      kind: "tecnica",
      body: [
        "Las entidades se relacionan entre sí. Una sesión está formada por segmentos: cada trozo de audio con su texto original y su traducción.",
        "Es una composición: si se borra la sesión, sus segmentos desaparecen con ella. En una agregación, las partes sobrevivirían al todo.",
      ],
      changes: ["+ Segmento «entity»", "+ Composición: una sesión, muchos segmentos"],
      scene: {
        entities: [usuario, limite, control, sesion, segmento],
        links: [entra, coordina, consulta, compone],
        flows: [recorrido(["u", "lim", "ctl", "ses", "seg"])],
      },
    },
    {
      title: "Resumen",
      kind: "resumen",
      body: [
        "El modelo de análisis reparte el caso de uso en tres tipos de objetos: límite para hablar con los actores, control para coordinar y entidad para recordar.",
        "Para encontrarlos en un texto sirven las heurísticas de Abbott: fíjate en los sustantivos, los verbos y los adjetivos.",
      ],
      scene: {
        entities: [
          usuario,
          limite,
          control,
          sesion,
          segmento,
          {
            id: "tabla",
            type: "panel",
            x: -3,
            y: 6,
            label: "Heurísticas de Abbott",
            rows: [
              ["Sustantivo propio", "instancia"],
              ["Sustantivo común", "clase"],
              ["Verbo de acción", "operación"],
              ["«es un»", "herencia"],
              ["«tiene»", "agregación"],
              ["Adjetivo", "atributo"],
            ],
          },
        ],
        links: [entra, coordina, consulta, compone],
        flows: [recorrido(["u", "lim", "ctl", "ses", "seg"])],
      },
    },
  ],
};
