import type { Lesson } from "@/modules/course/domain/lesson";
import { bd, cola, escena, ficha, ida, nodo, persona, tabla, une, vuelta } from "./iso-helpers";

export const patronesCreacionales: Lesson = {
  slug: "patrones-creacionales",
  module: "Patrones de diseño",
  track: "catalogo",
  title: "Patrones creacionales",
  summary:
    "Cómo crear objetos: Factory Method, Abstract Factory, Builder, Object Pool, Prototype y Singleton.",
  minutes: 13,
  goals: [
    "Elegir un patrón creacional según qué hace difícil crear el objeto",
    "Explicar por qué una fábrica centraliza la validación",
    "Argumentar por qué Cuentas Claras evita el Singleton",
  ],
  steps: [
    {
      title: "Cómo crear objetos",
      kind: "tecnica",
      body: [
        "Los patrones creacionales separan a quien usa un objeto de la forma en que se crea. Sirven cuando crear no es tan simple como llamar a un constructor.",
        "Un patrón se justifica por un problema concreto. Aplicarlo donde no lo hay solo añade clases e indirección.",
      ],
      note: "El catálogo es el de Gamma, Helm, Johnson y Vlissides (1994), más Object Pool.",
      scene: escena([
        nodo("cli", 0, 0, "Quien usa", "cyan", { icon: "server" }),
        nodo("obj", 5, 0, "Objeto", "violet", { tags: ["¿quién lo crea?"] }),
      ]),
    },

    ...ficha(
      "Factory Method",
      {
        body: [
          "Dos casos de uso crean montos, cada uno a su manera. Uno comprueba que no sea negativo; el otro lo olvidó.",
          "Cuando la creación está repartida, la validación también lo está, y basta un descuido para que exista un valor inválido.",
        ],
        scene: escena(
          [
            nodo("a", 0, -4, "RegistrarGasto", "cyan", { icon: "server" }),
            nodo("b", 0, 4, "ImportarArchivo", "cyan", { icon: "server" }),
            nodo("monto", 6, 0, "Monto", "rose", { tags: ["a veces sin validar"] }),
          ],
          [une("a", "monto", { via: "x" }), une("b", "monto", { via: "x" })],
          [ida(["a", "monto"]), ida(["b", "monto"], "slow", 0.5)],
        ),
      },
      {
        body: [
          "La creación se concentra en una operación fábrica. Quien necesita un monto se lo pide a ella y recibe uno correcto, o un error.",
          "En la forma clásica, una subclase decide qué clase concreta crear. Conviene cuando una clase no puede anticipar qué objetos concretos necesitará.",
        ],
        enCuentasClaras:
          "las fábricas de Monto, Tasa y de los agregados centralizan la validación; no existe un valor inválido.",
        changes: ["+ FábricaDeMonto, único punto de creación"],
        scene: escena(
          [
            nodo("a", 0, -4, "RegistrarGasto", "cyan", { icon: "server" }),
            nodo("b", 0, 4, "ImportarArchivo", "cyan", { icon: "server" }),
            nodo("fab", 5, 0, "FábricaDeMonto", "amber", { tags: ["valida una vez"] }),
            nodo("monto", 10, 0, "Monto", "emerald", { tags: ["siempre válido"] }),
          ],
          [une("a", "fab", { via: "y" }), une("b", "fab", { via: "y" }), une("fab", "monto")],
          [ida(["a", "fab", "monto"]), ida(["b", "fab", "monto"])],
        ),
      },
    ),

    ...ficha(
      "Abstract Factory",
      {
        body: [
          "El programa arranca creando sus piezas una a una. En producción son reales; en las pruebas, simuladas.",
          "Si se mezclan por error, un repositorio real con un cliente simulado, el sistema arranca pero se comporta de forma incoherente.",
        ],
        scene: escena(
          [
            nodo("main", 0, 0, "Arranque", "cyan", { icon: "bolt" }),
            bd("repo", 6, -3, "RepositorioSQLite", "emerald", { tags: ["real"] }),
            nodo("cli", 6, 3, "ClienteSimulado", "rose", { icon: "globe", tags: ["de prueba"] }),
          ],
          [une("main", "repo", { via: "y" }), une("main", "cli", { via: "y" })],
          [ida(["main", "repo"]), ida(["main", "cli"], "slow", 0.5)],
        ),
      },
      {
        body: [
          "Una fábrica abstracta crea familias completas de objetos relacionados. El arranque elige una fábrica y de ella sale todo lo demás.",
          "Así es imposible mezclar familias. Conviene cuando el sistema debe funcionar con varias familias intercambiables: controladores, plataformas o entornos.",
        ],
        enCuentasClaras:
          "la familia real (SQLite, HTTP) y la de prueba (en memoria, simulada) se crean juntas en el arranque.",
        changes: ["+ Una fábrica por familia", "~ El arranque elige una sola fábrica"],
        scene: escena(
          [
            nodo("main", 0, 0, "Arranque", "cyan", { icon: "bolt" }),
            nodo("fr", 4, -4, "FábricaReal", "amber"),
            nodo("fp", 4, 4, "FábricaDePrueba", "slate"),
            bd("r1", 10, -6, "RepositorioSQLite"),
            nodo("r2", 10, -2, "ClienteHTTP", "emerald", { icon: "globe" }),
            bd("p1", 10, 2, "RepositorioEnMemoria", "slate"),
            nodo("p2", 10, 6, "ClienteSimulado", "slate", { icon: "globe" }),
          ],
          [
            une("main", "fr", { via: "y" }),
            une("main", "fp", { via: "y", style: "off" }),
            une("fr", "r1", { via: "y" }),
            une("fr", "r2", { via: "y" }),
            une("fp", "p1", { via: "y", style: "off" }),
            une("fp", "p2", { via: "y", style: "off" }),
          ],
          [ida(["main", "fr", "r1"]), ida(["main", "fr", "r2"])],
        ),
      },
    ),

    ...ficha(
      "Builder",
      {
        body: [
          "Una prueba necesita un grupo con tres miembros y dos gastos. El constructor pide una docena de argumentos, y la mitad no importan para esta prueba.",
          "Con tantos parámetros en fila es fácil equivocarse de orden, y al leer la llamada no se sabe qué significa cada uno.",
        ],
        scene: escena(
          [
            nodo("t", 0, 0, "Prueba", "cyan", { icon: "shield" }),
            nodo("g", 6, 0, "Grupo", "rose", { icon: "users", tags: ["12 argumentos"] }),
          ],
          [une("t", "g")],
          [ida(["t", "g"], "slow", 0.6)],
        ),
      },
      {
        body: [
          "Un constructor por pasos arma el objeto poco a poco. Cada paso tiene nombre, se indica solo lo que importa y el resto toma un valor por defecto.",
          "Conviene cuando un objeto tiene muchas partes opcionales o se construye en varias etapas, como una consulta.",
        ],
        enCuentasClaras:
          "construir los datos de prueba de un Grupo con miembros y gastos en una sola expresión legible.",
        changes: ["+ ConstructorDeGrupo, con pasos con nombre"],
        scene: escena(
          [
            nodo("t", 0, 0, "Prueba", "cyan", { icon: "shield" }),
            nodo("b", 5, 0, "ConstructorDeGrupo", "amber", {
              tags: ["conMiembros(3)", "conGasto(50)"],
            }),
            nodo("g", 11, 0, "Grupo", "emerald", { icon: "users", tags: ["listo"] }),
          ],
          [une("t", "b"), une("b", "g", { label: "construir()" })],
          [ida(["t", "b", "g"])],
        ),
      },
    ),

    ...ficha(
      "Object Pool",
      {
        body: [
          "El servidor abre una conexión a la base de datos por cada petición, la usa unos milisegundos y la cierra.",
          "Abrir una conexión es caro: negociar, autenticar, reservar memoria. Con mucho tráfico se va más tiempo en abrir y cerrar que en trabajar.",
        ],
        metrics: [{ label: "Conexiones abiertas", value: 300, unit: "/s" }],
        scene: escena(
          [
            nodo("srv", 0, 0, "Servidor", "cyan", { icon: "server" }),
            bd("db", 6, 0, "Base de datos", "emerald", {
              load: 0.92,
              tags: ["abrir · usar · cerrar"],
            }),
          ],
          [une("srv", "db", { heads: "both" })],
          [vuelta(["srv", "db"], "slow", 1.6, { speed: 2.2, dwellAt: { db: 0.7 } })],
        ),
      },
      {
        body: [
          "Un fondo guarda un número fijo de objetos ya creados. Quien necesita uno lo toma prestado y lo devuelve al terminar.",
          "Conviene cuando crear el objeto es costoso y se usan muchos durante poco tiempo: conexiones o hilos.",
        ],
        enCuentasClaras:
          "el fondo de conexiones a la base de datos del servidor, que provee el propio controlador o el ORM.",
        changes: ["+ Fondo de conexiones reutilizables"],
        metrics: [{ label: "Conexiones abiertas", value: 0, unit: "/s" }],
        scene: escena(
          [
            nodo("srv", 0, 0, "Servidor", "cyan", { icon: "server" }),
            cola("pool", 7, 0, "Fondo de conexiones", { tags: ["10 listas"] }),
            bd("db", 13, 0, "Base de datos", "emerald", { load: 0.3 }),
          ],
          [
            une("srv", "pool", { heads: "both", label: "adquirir / liberar" }),
            une("pool", "db", { heads: "both" }),
          ],
          [vuelta(["srv", "pool", "db"], "request", 1.8)],
        ),
      },
    ),

    ...ficha(
      "Prototype",
      {
        body: [
          "El alquiler se paga cada mes: mismo monto, mismos participantes, misma regla de división. El usuario lo vuelve a escribir entero cada vez.",
          "Crear desde cero algo casi idéntico a lo que ya existe es trabajo repetido y una ocasión de equivocarse.",
        ],
        scene: escena(
          [
            persona("u", 0, 0, "Usuario"),
            nodo("g", 6, 0, "Gasto: alquiler", "rose", {
              icon: "files",
              tags: ["todo a mano, otra vez"],
            }),
          ],
          [une("u", "g")],
          [ida(["u", "g"], "slow", 0.5)],
        ),
      },
      {
        body: [
          "El objeto existente sabe copiarse a sí mismo. La copia nace con todos sus datos y solo se cambia lo que varía, aquí la fecha.",
          "Conviene cuando crear desde cero es caro o complejo y ya hay un objeto parecido.",
        ],
        enCuentasClaras: "duplicar un gasto recurrente como plantilla para el mes siguiente.",
        changes: ["+ clonar(): la copia sale del original"],
        scene: escena(
          [
            persona("u", 0, 0, "Usuario"),
            nodo("g", 5, 0, "Alquiler · octubre", "amber", { icon: "files", tags: ["plantilla"] }),
            nodo("c", 11, 0, "Alquiler · noviembre", "emerald", { icon: "files", tags: ["copia"] }),
          ],
          [une("u", "g"), une("g", "c", { label: "clonar()" })],
          [ida(["u", "g", "c"])],
        ),
      },
    ),

    ...ficha(
      "Singleton",
      {
        title: "Singleton: la tentación",
        body: [
          "Singleton garantiza una sola instancia con un punto de acceso global. Resulta cómodo: cualquiera pide la hora al reloj sin que nadie se lo pase.",
          "Pero es estado global. Las dependencias quedan ocultas y las pruebas dependen unas de otras: una prueba no puede fijar la fecha sin afectar a las demás.",
        ],
        scene: escena(
          [
            nodo("a", 0, -4, "Caso de uso A", "cyan", { icon: "server" }),
            nodo("b", 0, 0, "Caso de uso B", "cyan", { icon: "server" }),
            nodo("t", 0, 4, "Prueba", "cyan", { icon: "shield" }),
            nodo("reloj", 6, 0, "Reloj global", "rose", { tags: ["estado global"] }),
          ],
          [une("a", "reloj", { via: "x" }), une("b", "reloj"), une("t", "reloj", { via: "x" })],
          [ida(["a", "reloj"]), ida(["b", "reloj"]), ida(["t", "reloj"], "slow", 0.5)],
        ),
      },
      {
        title: "Singleton: por qué se evita",
        body: [
          "La alternativa es recibir el reloj como un puerto. El programa real inyecta el del sistema; la prueba inyecta uno fijo.",
          "Singleton solo conviene cuando «exactamente una instancia» es una regla del dominio y no una comodidad.",
        ],
        enCuentasClaras:
          "se evita a propósito: Reloj y GeneradorId son puertos inyectados, para que las pruebas sean reproducibles.",
        changes: ["− Reloj global", "+ Un reloj inyectado para cada uso"],
        scene: escena(
          [
            nodo("a", 0, -3, "Caso de uso", "cyan", { icon: "server" }),
            nodo("t", 0, 3, "Prueba", "cyan", { icon: "shield" }),
            nodo("rs", 6, -3, "RelojDelSistema", "emerald"),
            nodo("rf", 6, 3, "RelojFijo", "emerald", { tags: ["2026-01-01"] }),
          ],
          [une("a", "rs"), une("t", "rf")],
          [ida(["a", "rs"]), ida(["t", "rf"])],
        ),
      },
    ),

    {
      title: "Resumen",
      kind: "resumen",
      body: [
        "Los seis responden a la misma pregunta, cómo crear un objeto sin atarse a su clase concreta, pero cada uno para una dificultad distinta.",
        "Antes de elegir, nombra qué hace difícil la creación: validar, elegir familia, demasiadas partes, coste o parecido con otro.",
      ],
      scene: escena([
        nodo("cli", 0, 0, "Quien usa", "cyan", { icon: "server" }),
        nodo("obj", 5, 0, "Objeto", "emerald"),
        tabla(-2, 5, "Cuándo usar cada uno", [
          ["Factory Method", "no sé qué clase crear"],
          ["Abstract Factory", "familias intercambiables"],
          ["Builder", "muchas partes opcionales"],
          ["Object Pool", "crear es caro"],
          ["Prototype", "ya hay uno parecido"],
          ["Singleton", "una sola, por regla"],
        ]),
      ]),
    },
  ],
};
