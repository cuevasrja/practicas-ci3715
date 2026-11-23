import type { Lesson } from "@/modules/course/domain/lesson";
import type { Entity, Link } from "@/modules/diagram/domain/scene";

const controlador: Entity = {
  id: "ctl",
  type: "block",
  x: 0,
  y: 0,
  label: ":ControladorGastos",
  icon: "split",
  tone: "cyan",
};
const grupo = (tags?: string[]): Entity => ({
  id: "grupo",
  type: "block",
  x: 6,
  y: 0,
  label: ":Grupo",
  icon: "users",
  tone: "emerald",
  tags,
});
const gasto = (tags?: string[]): Entity => ({
  id: "gasto",
  type: "block",
  x: 12,
  y: 0,
  label: ":Gasto",
  icon: "files",
  tone: "amber",
  tags,
});
const regla: Entity = {
  id: "regla",
  type: "block",
  x: 12,
  y: 6,
  label: ":ReglaDivision",
  icon: "split",
  tone: "violet",
};

const m1: Link = { from: "ctl", to: "grupo", label: "1: registrarGasto" };
const m1Rechazado: Link = { ...m1, style: "cut" };
const m11: Link = { from: "grupo", to: "gasto", label: "1.1: create" };
const m12: Link = { from: "gasto", to: "regla", label: "1.2: repartir" };

export const clase07: Lesson = {
  slug: "clase-7-responsabilidades-y-contratos",
  module: "Diseño",
  track: "principal",
  label: "Clase 7",
  title: "Responsabilidades y contratos",
  summary:
    "Antes de dibujar mensajes hay que decidir quién es responsable de qué y qué promete cada operación.",
  minutes: 10,
  goals: [
    "Asignar una responsabilidad con Experto, Creador y Controlador",
    "Leer un diagrama de comunicación con mensajes numerados",
    "Escribir la precondición, la postcondición y el invariante de una operación",
  ],
  steps: [
    {
      title: "¿Quién hace qué?",
      kind: "problema",
      body: [
        "Hay que registrar un gasto en un grupo de Cuentas Claras. Tenemos los objetos, pero falta decidir cuál de ellos hace cada cosa.",
        "Una responsabilidad puede ser de conocer (sus datos, los objetos con los que se relaciona) o de hacer (calcular, crear, coordinar). GRASP da criterios para repartirlas.",
      ],
      scene: { entities: [controlador, grupo()], links: [], flows: [] },
    },
    {
      title: "Controlador",
      kind: "tecnica",
      body: [
        "El evento que llega de fuera lo recibe un objeto controlador. No hace el trabajo: lo encarga a quien corresponde.",
        "En un diagrama de comunicación los mensajes se numeran. Este es el 1.",
      ],
      changes: ["+ 1: registrarGasto(datos)"],
      scene: {
        entities: [controlador, grupo()],
        links: [m1],
        flows: [{ route: ["ctl", "grupo"], kind: "request", rate: 0.8 }],
      },
    },
    {
      title: "Experto en información",
      kind: "tecnica",
      body: [
        "¿Por qué el mensaje va al grupo? Porque es el experto: la responsabilidad se le da a quien tiene los datos para cumplirla.",
        "El grupo conoce a sus miembros, así que es el único que puede comprobar que el pagador pertenece a él.",
      ],
      changes: ["~ El grupo es el experto: conoce a sus miembros"],
      scene: {
        entities: [controlador, grupo(["conoce a sus miembros"])],
        links: [m1],
        flows: [{ route: ["ctl", "grupo"], kind: "request", rate: 0.8 }],
      },
    },
    {
      title: "Creador",
      kind: "tecnica",
      body: [
        "¿Quién crea el gasto? Quien lo contiene o lo usa de cerca. Los gastos pertenecen al grupo, así que lo crea el grupo.",
        "Es el mensaje 1.1: ocurre dentro del 1, y por eso cuelga de su número.",
      ],
      changes: ["+ :Gasto", "+ 1.1: create"],
      scene: {
        entities: [controlador, grupo(["conoce a sus miembros"]), gasto()],
        links: [m1, m11],
        flows: [{ route: ["ctl", "grupo", "gasto"], kind: "request", rate: 0.8 }],
      },
    },
    {
      title: "Delegar el reparto",
      kind: "tecnica",
      body: [
        "Repartir el monto entre los participantes no es asunto del grupo ni del controlador. El gasto se lo pide a su regla de división.",
        "Cada objeto hace poco y conoce a pocos: bajo acoplamiento y alta cohesión, los otros dos criterios de GRASP.",
      ],
      changes: ["+ :ReglaDivision", "+ 1.2: repartir(monto, participantes)"],
      scene: {
        entities: [controlador, grupo(["conoce a sus miembros"]), gasto(), regla],
        links: [m1, m11, m12],
        flows: [
          { route: ["ctl", "grupo", "gasto", "regla"], kind: "request", rate: 0.7, bounce: true },
        ],
      },
    },
    {
      title: "Precondición",
      kind: "problema",
      body: [
        "Un contrato dice qué promete cada operación. La precondición es lo que debe cumplirse antes de llamar: aquí, que el pagador sea miembro del grupo.",
        "Si no se cumple, la llamada se rechaza y no pasa nada más: ni se crea el gasto ni se reparte.",
      ],
      changes: ["− La llamada se rechaza: el pagador no es miembro"],
      scene: {
        entities: [controlador, grupo(["pre: pagador es miembro"]), gasto(), regla],
        links: [m1Rechazado, m11, m12],
        flows: [{ route: ["ctl", "grupo"], kind: "drop", rate: 0.8, fail: 1 }],
      },
    },
    {
      title: "Postcondición e invariante",
      kind: "solucion",
      body: [
        "Si la precondición se cumple, la operación corre. La postcondición es lo que garantiza al terminar: el gasto quedó registrado en el grupo.",
        "El invariante es lo que siempre es cierto, antes y después: los saldos del grupo suman cero.",
      ],
      note: "Liskov con contratos: una subclase no puede exigir más en la precondición ni prometer menos en la postcondición.",
      changes: ["~ La llamada pasa y se cumple el contrato"],
      scene: {
        entities: [
          controlador,
          grupo(["inv: los saldos suman 0"]),
          gasto(["post: gasto registrado"]),
          regla,
        ],
        links: [m1, m11, m12],
        flows: [
          { route: ["ctl", "grupo", "gasto", "regla"], kind: "request", rate: 0.7, bounce: true },
        ],
      },
    },
    {
      title: "Resumen",
      kind: "resumen",
      body: [
        "Primero se reparten las responsabilidades y después se dibujan los mensajes. Cada mensaje del diagrama será una operación del objeto que lo recibe.",
        "Y cada operación tiene su contrato. En la clase 8 verás que toda precondición que puede fallar se convierte en un alt del diagrama de secuencia.",
      ],
      scene: {
        entities: [
          controlador,
          grupo(),
          gasto(),
          regla,
          {
            id: "tabla",
            type: "panel",
            x: 2,
            y: 7,
            label: "Criterios y contrato",
            rows: [
              ["Experto", "quien tiene los datos"],
              ["Creador", "quien lo contiene"],
              ["Controlador", "recibe el evento"],
              ["Precondición", "antes de llamar"],
              ["Postcondición", "al terminar"],
              ["Invariante", "siempre"],
            ],
          },
        ],
        links: [m1, m11, m12],
        flows: [
          { route: ["ctl", "grupo", "gasto", "regla"], kind: "request", rate: 0.7, bounce: true },
        ],
      },
    },
  ],
};
