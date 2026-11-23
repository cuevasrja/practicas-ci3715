import type { Lesson } from "@/modules/course/domain/lesson";
import type { Entity, Link } from "@/modules/diagram/domain/scene";
import { bd, escena, ficha, ida, nodo, persona, tabla, une, vuelta } from "./iso-helpers";

// --- State: una solicitud delega en su estado actual.
const usuario = persona("u", 0, 0, "Usuario");
const solicitud = (tags: string[]): Entity =>
  nodo("sol", 5, 0, "Solicitud", "cyan", { icon: "files", tags });
const estados = [
  nodo("pen", 11, -4, "Pendiente", "amber", { tags: ["aceptar() ✓"] }),
  nodo("ace", 11, 0, "Aceptada", "emerald", { tags: ["aceptar() ✗"] }),
  nodo("rec", 11, 4, "Rechazada", "slate", { tags: ["aceptar() ✗"] }),
];
const delega = (actual: string): Link[] => [
  une("u", "sol"),
  ...["pen", "ace", "rec"].map((id) =>
    une("sol", id, { via: "y", style: id === actual ? "solid" : "off" }),
  ),
];

// --- Strategy: reglas de división.
const reglasIds = ["ig", "pc", "mo", "ex"] as const;
const reglas = [
  nodo("ig", 11, -6, "PartesIguales", "violet"),
  nodo("pc", 11, -2, "PorPorcentajes", "violet"),
  nodo("mo", 11, 2, "PorMontos", "violet"),
  nodo("ex", 11, 6, "IgualesConExclusiones", "violet"),
];

export const patronesComportamiento2: Lesson = {
  slug: "patrones-de-comportamiento-2",
  module: "Patrones de diseño",
  track: "catalogo",
  title: "Patrones de comportamiento II",
  summary:
    "Algoritmos y estados que varían: State, Strategy, Template Method, Visitor e Interpreter.",
  minutes: 13,
  goals: [
    "Distinguir State de Strategy por quién elige el comportamiento",
    "Comparar Template Method (herencia) con Strategy (composición)",
    "Explicar cuándo Visitor compensa su complejidad",
  ],
  steps: [
    {
      title: "Comportamiento que varía",
      kind: "tecnica",
      body: [
        "Estos cinco patrones atacan el mismo síntoma: un método que crece con un if por cada caso. Cada uno saca la variación a objetos propios.",
        "La diferencia está en qué varía, un algoritmo, un estado, un paso o una operación, y en quién elige.",
      ],
      scene: escena([nodo("a", 0, 0, "Un método", "rose", { tags: ["si… si no… si no…"] })]),
    },

    ...ficha(
      "State",
      {
        body: [
          "Una solicitud de amistad puede estar pendiente, aceptada, rechazada o cancelada, y cada operación se comporta distinto según el caso.",
          "Con una variable de estado y un if en cada método, tarde o temprano alguien olvida una comprobación y una solicitud ya aceptada se vuelve a aceptar.",
        ],
        scene: escena(
          [usuario, solicitud(["si estado == …", "aceptar() dos veces"])],
          [une("u", "sol")],
          [ida(["u", "sol"], "slow", 0.7)],
        ),
      },
      {
        body: [
          "La solicitud delega en un objeto que representa su estado actual. Cada estado sabe qué operaciones admite y cuál es el estado siguiente.",
          "Las operaciones válidas dependen del estado, y las transiciones prohibidas simplemente no existen.",
        ],
        enCuentasClaras:
          "Solicitud: Pendiente pasa a Aceptada, Rechazada o Cancelada. En Rust, un enum hace imposibles las transiciones inválidas.",
        changes: ["+ Un objeto por estado", "~ La solicitud delega en el estado actual"],
        scene: escena([usuario, solicitud(["estado: Pendiente"]), ...estados], delega("pen"), [
          vuelta(["u", "sol", "pen"]),
        ]),
      },
    ),
    {
      title: "State: la transición",
      kind: "tecnica",
      body: [
        "Al aceptar, es el propio estado Pendiente quien crea el estado siguiente y se lo asigna a la solicitud. Desde ese momento, la solicitud delega en Aceptada.",
        "Un segundo aceptar() llega a un estado que no lo admite. Nadie tuvo que escribir un if para evitarlo.",
      ],
      note: "La diferencia con Strategy: aquí decide el estado, no el cliente.",
      changes: ["~ El estado actual pasa a ser Aceptada"],
      scene: escena([usuario, solicitud(["estado: Aceptada"]), ...estados], delega("ace"), [
        ida(["u", "sol", "ace"], "drop", 0.7, { fail: 1 }),
      ]),
    },

    ...ficha(
      "Strategy",
      {
        body: [
          "Un gasto se puede dividir en partes iguales, por porcentajes, por montos fijos o excluyendo a algunos miembros.",
          "Con todo dentro del grupo, cada forma nueva de dividir obliga a modificar una clase que ya funcionaba y a volver a probarla entera.",
        ],
        scene: escena([
          nodo("g", 0, 0, "Grupo", "rose", {
            icon: "users",
            tags: ["si iguales…", "si porcentajes…", "si montos…"],
          }),
        ]),
      },
      {
        body: [
          "Cada algoritmo es un objeto detrás de una interfaz común. El grupo recibe una regla y la usa sin saber cuál es.",
          "Añadir una regla es añadir una clase. El cliente elige cuál usar en cada momento.",
        ],
        enCuentasClaras:
          "las reglas de división: PartesIguales, PorPorcentajes, PorMontos e IgualesConExclusiones.",
        changes: ["+ ReglaDivision «interface»", "+ Cuatro reglas intercambiables"],
        scene: escena(
          [
            nodo("g", 0, 0, "Grupo", "cyan", { icon: "users" }),
            nodo("r", 5, 0, "ReglaDivision", "amber", { icon: "split", tags: ["«interface»"] }),
            ...reglas,
          ],
          [
            une("g", "r"),
            ...reglasIds.map((id) =>
              une("r", id, { via: "y", style: id === "pc" ? "solid" : "off" }),
            ),
          ],
          [vuelta(["g", "r", "pc"])],
        ),
      },
    ),

    ...ficha(
      "Template Method",
      {
        body: [
          "El repositorio real y el de memoria deben comportarse igual. Hay una batería de pruebas para cada uno, casi idénticas: preparar, guardar, leer y comparar.",
          "Cuando se añade una prueba a una y se olvida en la otra, los dos adaptadores empiezan a divergir sin que nadie lo note.",
        ],
        scene: escena([
          nodo("a", 0, -3, "PruebasDeSQLite", "rose", {
            icon: "shield",
            tags: ["preparar · guardar · leer"],
          }),
          nodo("b", 0, 3, "PruebasEnMemoria", "rose", {
            icon: "shield",
            tags: ["preparar · guardar · leer"],
          }),
        ]),
      },
      {
        body: [
          "Una clase base fija los pasos del proceso en un método plantilla y deja algunos pasos abstractos. Cada subclase solo rellena lo que cambia.",
          "Aquí lo único distinto es cómo se crea el repositorio. Es la versión con herencia de la idea que Strategy resuelve con composición.",
        ],
        enCuentasClaras:
          "las pruebas de contrato: el mismo conjunto de pasos se ejecuta contra el adaptador real y contra el de prueba.",
        changes: ["+ PruebasDeContrato fija los pasos", "~ Cada subclase solo crea su repositorio"],
        scene: escena(
          [
            nodo("p", 0, 0, "PruebasDeContrato", "amber", {
              icon: "shield",
              tags: ["guardar · leer · comparar"],
            }),
            nodo("a", 6, -3, "ConSQLite", "emerald", { tags: ["crearRepositorio()"] }),
            nodo("b", 6, 3, "EnMemoria", "emerald", { tags: ["crearRepositorio()"] }),
          ],
          [une("p", "a", { via: "y", heads: "both" }), une("p", "b", { via: "y", heads: "both" })],
          [vuelta(["p", "a"], "request", 0.6), vuelta(["p", "b"], "request", 0.6)],
        ),
      },
    ),

    ...ficha(
      "Visitor",
      {
        body: [
          "Hay varios tipos de movimiento: ingreso, gasto y transferencia. Cada informe nuevo necesita una operación más en cada uno de ellos.",
          "La jerarquía es estable, pero las operaciones no paran de crecer, y cada una obliga a abrir todas las clases.",
        ],
        scene: escena([
          nodo("i", 0, -4, "Ingreso", "rose", { tags: ["totalizar()", "exportar()", "…"] }),
          nodo("g", 0, 0, "Gasto", "rose", { tags: ["totalizar()", "exportar()", "…"] }),
          nodo("t", 0, 4, "Transferencia", "rose", { tags: ["totalizar()", "exportar()", "…"] }),
        ]),
      },
      {
        body: [
          "La operación vive en un objeto visitante, con un método por cada tipo de elemento. Los elementos solo saben aceptar una visita.",
          "Un informe nuevo es un visitante nuevo; la jerarquía no se toca. Solo compensa si la jerarquía es estable: añadir un tipo de movimiento obliga a cambiar todos los visitantes.",
        ],
        enCuentasClaras:
          "informes sobre Ingreso, Gasto, Transferencia y Ajuste; en Rust, un match sobre el enum Movimiento cumple el mismo papel.",
        changes: ["+ InformeMensual como visitante", "~ Los movimientos solo exponen aceptar()"],
        scene: escena(
          [
            nodo("v", 0, 0, "InformeMensual", "amber", { icon: "files", tags: ["Visitor"] }),
            nodo("i", 6, -4, "Ingreso", "emerald", { tags: ["aceptar(v)"] }),
            nodo("g", 6, 0, "Gasto", "emerald", { tags: ["aceptar(v)"] }),
            nodo("t", 6, 4, "Transferencia", "emerald", { tags: ["aceptar(v)"] }),
          ],
          [
            une("v", "i", { via: "y", heads: "both" }),
            une("v", "g", { heads: "both" }),
            une("v", "t", { via: "y", heads: "both" }),
          ],
          [
            vuelta(["v", "i"], "query", 0.6),
            vuelta(["v", "g"], "query", 0.6),
            vuelta(["v", "t"], "query", 0.6),
          ],
        ),
      },
    ),

    ...ficha(
      "Interpreter",
      {
        body: [
          "El usuario quiere filtrar movimientos: «monto mayor que 50 y categoría comida». Mañana querrá otra combinación.",
          "Escribir una función por cada filtro posible no termina nunca. Hace falta poder combinar condiciones sencillas.",
        ],
        scene: escena(
          [
            persona("u", 0, 0, "Buscador", { tags: ["monto > 50 y comida"] }),
            bd("m", 6, 0, "Movimientos", "rose", { tags: ["una función por filtro"] }),
          ],
          [une("u", "m", { heads: "both" })],
          [vuelta(["u", "m"], "slow", 0.6)],
        ),
      },
      {
        body: [
          "Cada regla de un pequeño lenguaje es una clase con una operación interpretar(). Las expresiones se componen en árbol, como en un Composite, y se evalúan de la raíz a las hojas.",
          "Conviene para lenguajes sencillos y estables: filtros, reglas o fórmulas. Con una gramática grande es mejor usar un generador de analizadores.",
        ],
        enCuentasClaras:
          "este patrón no está en las láminas del curso; se incluye porque completa el catálogo original.",
        changes: ["+ Un árbol de expresiones", "~ Cada nodo sabe interpretarse"],
        scene: escena(
          [
            persona("u", 0, 0, "Buscador"),
            nodo("y", 5, 0, "Y", "amber", { icon: "split", tags: ["interpretar(mov)"] }),
            nodo("a", 11, -3, "MayorQue(monto, 50)", "emerald"),
            nodo("b", 11, 3, "EsCategoría(comida)", "emerald"),
          ],
          [
            une("u", "y", { heads: "both" }),
            une("y", "a", { via: "y", heads: "both" }),
            une("y", "b", { via: "y", heads: "both" }),
          ],
          [vuelta(["u", "y", "a"], "query", 0.7), vuelta(["u", "y", "b"], "query", 0.7)],
        ),
      },
    ),

    {
      title: "Resumen",
      kind: "resumen",
      body: [
        "State y Strategy tienen el mismo diagrama de clases. Se distinguen por quién elige: en Strategy el cliente, en State el propio estado al hacer la transición.",
        "Template Method fija el esqueleto con herencia; Strategy cambia el algoritmo entero con composición. Ante la duda, prefiere la composición.",
      ],
      scene: escena(
        [
          nodo("g", 0, 0, "Contexto", "cyan"),
          nodo("r", 5, 0, "Interfaz", "amber", { tags: ["«interface»"] }),
          nodo("x", 10, -3, "Variante A", "emerald"),
          nodo("z", 10, 3, "Variante B", "emerald"),
          tabla(0, 6, "Qué varía y quién elige", [
            ["State", "el estado · él mismo"],
            ["Strategy", "el algoritmo · el cliente"],
            ["Template Method", "un paso · la subclase"],
            ["Visitor", "la operación · el visitante"],
            ["Interpreter", "la expresión · su árbol"],
          ]),
        ],
        [une("g", "r"), une("r", "x", { via: "y" }), une("r", "z", { via: "y", style: "off" })],
        [vuelta(["g", "r", "x"])],
      ),
    },
  ],
};
