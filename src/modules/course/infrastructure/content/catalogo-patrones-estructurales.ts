import type { Lesson } from "@/modules/course/domain/lesson";
import { bd, escena, ficha, ida, nodo, persona, tabla, une, vuelta } from "./iso-helpers";

export const patronesEstructurales: Lesson = {
  slug: "patrones-estructurales",
  module: "Patrones de diseño",
  track: "catalogo",
  title: "Patrones estructurales",
  summary:
    "Cómo componer objetos: Adapter, Bridge, Composite, Facade, Decorator, Flyweight y Proxy.",
  minutes: 15,
  goals: [
    "Elegir un patrón estructural según qué se quiere componer",
    "Distinguir Adapter, Decorator y Proxy por su intención",
    "Explicar cómo Composite trata igual a una hoja y a un grupo",
  ],
  steps: [
    {
      title: "Cómo componer objetos",
      kind: "tecnica",
      body: [
        "Los patrones estructurales tratan de cómo se conectan los objetos para formar estructuras más grandes sin que cada cambio se propague a todo.",
        "Varios se parecen en el dibujo: un objeto delante de otro. Lo que los distingue es la intención, así que fíjate en qué problema resuelve cada uno.",
      ],
      scene: escena(
        [
          nodo("a", 0, 0, "Un objeto", "cyan"),
          nodo("b", 5, 0, "Otro objeto", "violet", { tags: ["¿cómo se conectan?"] }),
        ],
        [une("a", "b")],
      ),
    },

    ...ficha(
      "Adapter",
      {
        body: [
          "El servidor habla en su propio vocabulario: campos abreviados, otros nombres, otras unidades. Si el dominio lo usa tal cual, ese vocabulario se cuela en todo el código.",
          "Y la API no es nuestra: no podemos cambiarla para que encaje.",
        ],
        scene: escena(
          [
            nodo("dom", 0, 0, "Dominio local", "rose", {
              icon: "shield",
              tags: ["user_id? amt? ccy?"],
            }),
            nodo("api", 6, 0, "API del servidor", "slate", { icon: "globe" }),
          ],
          [une("dom", "api", { heads: "both" })],
          [vuelta(["dom", "api"], "slow", 0.7)],
        ),
      },
      {
        body: [
          "Un adaptador implementa la interfaz que el cliente espera y traduce cada llamada a la del objeto ajeno. El dominio sigue hablando su idioma.",
          "Conviene cuando lo adaptado ya existe, es inmutable o no conviene modificarlo: una librería, una API externa o un componente heredado.",
        ],
        enCuentasClaras:
          "ClienteSocial traduce la API del servidor al modelo local, como capa anticorrupción; el transporte Git envuelve la librería git2.",
        changes: ["+ ClienteSocial traduce entre los dos vocabularios"],
        scene: escena(
          [
            nodo("dom", 0, 0, "Dominio local", "emerald", {
              icon: "shield",
              tags: ["usuario, monto, moneda"],
            }),
            nodo("ad", 5, 0, "ClienteSocial", "amber", { icon: "split", tags: ["Adapter"] }),
            nodo("api", 10, 0, "API del servidor", "slate", { icon: "globe" }),
          ],
          [une("dom", "ad", { heads: "both" }), une("ad", "api", { heads: "both" })],
          [vuelta(["dom", "ad", "api"])],
        ),
      },
    ),

    ...ficha(
      "Bridge",
      {
        body: [
          "Hay dos cosas que varían a la vez: qué se exporta (el libro completo o un resumen) y dónde se guarda (un archivo JSON o uno cifrado).",
          "Con herencia hace falta una clase por combinación. Añadir un tercer almacén obliga a escribir dos clases más.",
        ],
        metrics: [{ label: "Clases", value: 4 }],
        scene: escena([
          nodo("a", 0, -2, "LibroEnJSON", "rose"),
          nodo("b", 6, -2, "LibroCifrado", "rose"),
          nodo("c", 0, 3, "ResumenEnJSON", "rose"),
          nodo("d", 6, 3, "ResumenCifrado", "rose"),
        ]),
      },
      {
        body: [
          "Bridge separa la abstracción de su implementación y las une con una referencia. Cada dimensión crece por su lado.",
          "Conviene cuando hay dos dimensiones que cambian de forma independiente. Un ejemplo conocido son los controladores de bases de datos.",
        ],
        enCuentasClaras:
          "exportar el libro (la abstracción) con almacenes intercambiables: archivo JSON o archivo cifrado.",
        changes: ["~ Dos jerarquías pequeñas en lugar de una que se multiplica"],
        metrics: [{ label: "Clases", value: 4 }],
        scene: escena(
          [
            nodo("exp", 0, 0, "Exportación", "cyan", { tags: ["libro | resumen"] }),
            nodo("alm", 5, 0, "Almacén", "amber", { tags: ["«interface»"] }),
            nodo("j", 10, -3, "ArchivoJSON", "emerald", { icon: "files" }),
            nodo("c", 10, 3, "ArchivoCifrado", "emerald", { icon: "shield" }),
          ],
          [
            une("exp", "alm", { label: "usa" }),
            une("alm", "j", { via: "y" }),
            une("alm", "c", { via: "y" }),
          ],
          [ida(["exp", "alm", "j"]), ida(["exp", "alm", "c"], "request", 0.4)],
        ),
      },
    ),

    ...ficha(
      "Composite",
      {
        body: [
          "Las categorías de gasto tienen subcategorías. El informe pregunta en cada paso si está ante una categoría simple o ante una que contiene otras.",
          "Cada operación nueva repite esa pregunta, y con tres niveles de anidamiento el código ya no se puede seguir.",
        ],
        scene: escena(
          [
            nodo("inf", 0, 0, "Informe", "rose", { tags: ["¿hoja o grupo?"] }),
            nodo("h", 6, -3, "Categoría simple", "slate"),
            nodo("g", 6, 3, "Categoría con hijas", "slate"),
          ],
          [une("inf", "h", { via: "y" }), une("inf", "g", { via: "y" })],
          [ida(["inf", "h"], "slow", 0.5), ida(["inf", "g"], "slow", 0.5)],
        ),
      },
      {
        body: [
          "La hoja y el grupo comparten una interfaz. El grupo implementa la operación pidiéndosela a sus hijos, y así recorre el árbol entero.",
          "Quien lo usa llama a la raíz y no necesita saber qué hay debajo. Conviene en toda jerarquía parte-todo.",
        ],
        enCuentasClaras:
          "categorías y subcategorías: un informe trata igual a una categoría hoja que a una con hijas.",
        changes: [
          "+ Una interfaz común para hoja y grupo",
          "~ La operación se propaga a las hijas",
        ],
        scene: escena(
          [
            nodo("inf", 0, 0, "Informe", "cyan"),
            nodo("com", 5, 0, "Comida", "amber", { tags: ["total()"] }),
            nodo("m", 10, -3, "Mercado", "emerald", { tags: ["total()"] }),
            nodo("r", 10, 3, "Restaurantes", "emerald", { tags: ["total()"] }),
          ],
          [une("inf", "com"), une("com", "m", { via: "y" }), une("com", "r", { via: "y" })],
          [vuelta(["inf", "com", "m"]), vuelta(["inf", "com", "r"])],
        ),
      },
    ),

    ...ficha(
      "Facade",
      {
        body: [
          "Para registrar un gasto, la pantalla llama al repositorio, al proveedor de tasas y al notificador, en el orden correcto.",
          "La interfaz conoce demasiados detalles del subsistema. Si cambia el orden o aparece un paso nuevo, hay que tocar todas las pantallas.",
        ],
        scene: escena(
          [
            persona("p", 0, 0, "Pantalla", { icon: "browser" }),
            bd("r", 6, -4, "RepositorioGrupos"),
            nodo("t", 6, 0, "ProveedorTasas", "slate", { icon: "globe" }),
            nodo("n", 6, 4, "Notificador", "slate"),
          ],
          [une("p", "r", { via: "y" }), une("p", "t"), une("p", "n", { via: "y" })],
          [vuelta(["p", "r"]), vuelta(["p", "t"]), ida(["p", "n"])],
        ),
      },
      {
        body: [
          "Una fachada ofrece una operación de alto nivel y orquesta por dentro las clases que hagan falta. El cliente solo la conoce a ella.",
          "No esconde el subsistema a la fuerza: lo simplifica para el uso habitual.",
        ],
        enCuentasClaras:
          "el comando de la interfaz solo llama a un caso de uso, que orquesta repositorios y puertos.",
        changes: ["+ RegistrarGasto como única entrada"],
        scene: escena(
          [
            persona("p", 0, 0, "Pantalla", { icon: "browser" }),
            nodo("f", 5, 0, "RegistrarGasto", "amber", { icon: "split", tags: ["Fachada"] }),
            bd("r", 11, -4, "RepositorioGrupos"),
            nodo("t", 11, 0, "ProveedorTasas", "slate", { icon: "globe" }),
            nodo("n", 11, 4, "Notificador", "slate"),
          ],
          [
            une("p", "f", { heads: "both" }),
            une("f", "r", { via: "y" }),
            une("f", "t"),
            une("f", "n", { via: "y" }),
          ],
          [vuelta(["p", "f", "r"]), vuelta(["p", "f", "t"]), ida(["p", "f", "n"], "request", 0.5)],
        ),
      },
    ),

    ...ficha(
      "Decorator",
      {
        body: [
          "El proveedor de tasas de cambio es lento, y a veces no hay red. Se quiere añadir una caché y un modo sin conexión.",
          "Meter ese código dentro del proveedor lo mezcla todo, y hacerlo en cada caso de uso lo repite por todas partes.",
        ],
        metrics: [{ label: "Espera", value: 400, unit: "ms" }],
        scene: escena(
          [
            nodo("cu", 0, 0, "Caso de uso", "cyan", { icon: "server" }),
            nodo("p", 6, 0, "ProveedorTasas", "rose", { icon: "globe", load: 0.9 }),
          ],
          [une("cu", "p", { heads: "both" })],
          [vuelta(["cu", "p"], "slow", 1.4, { speed: 2.2, dwellAt: { p: 0.8 } })],
        ),
      },
      {
        body: [
          "Cada decorador envuelve al objeto y ofrece su misma interfaz, añadiendo algo antes o después de delegar. Se apilan como capas.",
          "La llamada atraviesa la caché, luego el modo sin conexión, y solo si hace falta llega al proveedor real.",
        ],
        enCuentasClaras:
          "ProveedorTasas con caché y modo sin conexión envolviendo al proveedor real; el caso de uso no lo sabe.",
        changes: ["+ Caché", "+ Modo sin conexión", "~ El proveedor real no se modifica"],
        metrics: [{ label: "Espera", value: 12, unit: "ms" }],
        scene: escena(
          [
            nodo("cu", 0, 0, "Caso de uso", "cyan", { icon: "server" }),
            nodo("c", 4, 0, "ConCaché", "amber", { icon: "bolt" }),
            nodo("o", 8, 0, "SinConexión", "amber", { icon: "shield" }),
            nodo("p", 12, 0, "ProveedorTasas", "emerald", { icon: "globe", load: 0.1 }),
          ],
          [
            une("cu", "c", { heads: "both" }),
            une("c", "o", { heads: "both" }),
            une("o", "p", { heads: "both" }),
          ],
          [vuelta(["cu", "c"], "request", 1.6), vuelta(["c", "o", "p"], "query", 0.3)],
        ),
      },
    ),

    ...ficha(
      "Flyweight",
      {
        body: [
          "Cada movimiento guarda su propia copia de los datos de su moneda: código, nombre, símbolo y decimales. Hay decenas de miles de movimientos.",
          "Son miles de objetos idénticos ocupando memoria, cuando en realidad solo existen unas pocas monedas distintas.",
        ],
        metrics: [{ label: "Objetos Moneda", value: 50000 }],
        scene: escena(
          [
            nodo("m1", 0, -4, "Movimiento 1", "cyan"),
            nodo("m2", 0, 0, "Movimiento 2", "cyan"),
            nodo("m3", 0, 4, "Movimiento 3", "cyan"),
            nodo("u1", 6, -4, "USD", "rose", { tags: ["copia"] }),
            nodo("u2", 6, 0, "USD", "rose", { tags: ["copia"] }),
            nodo("u3", 6, 4, "USD", "rose", { tags: ["copia"] }),
          ],
          [une("m1", "u1"), une("m2", "u2"), une("m3", "u3")],
        ),
      },
      {
        body: [
          "Flyweight separa lo que es igual para todos, que se comparte, de lo que es propio de cada uno. Todos los movimientos en dólares apuntan al mismo objeto.",
          "Para compartirlo sin riesgo, el objeto debe ser inmutable. Conviene cuando hay muchísimos objetos con gran parte de su estado repetido.",
        ],
        enCuentasClaras:
          "este patrón está en el catálogo pero no se desarrolla en las láminas; las monedas de los movimientos son un caso natural.",
        changes: ["~ Una sola Moneda compartida por todos los movimientos"],
        metrics: [{ label: "Objetos Moneda", value: 3 }],
        scene: escena(
          [
            nodo("m1", 0, -4, "Movimiento 1", "cyan"),
            nodo("m2", 0, 0, "Movimiento 2", "cyan"),
            nodo("m3", 0, 4, "Movimiento 3", "cyan"),
            nodo("usd", 6, 0, "USD", "emerald", { tags: ["compartida", "inmutable"] }),
          ],
          [une("m1", "usd", { via: "x" }), une("m2", "usd"), une("m3", "usd", { via: "x" })],
          [
            ida(["m1", "usd"], "query", 0.5),
            ida(["m2", "usd"], "query", 0.5),
            ida(["m3", "usd"], "query", 0.5),
          ],
        ),
      },
    ),

    ...ficha(
      "Proxy",
      {
        body: [
          "Para mostrar el saldo de una cuenta, la pantalla carga el historial completo. Son cincuenta mil movimientos, y el usuario casi nunca los mira.",
          "Se paga el coste entero, en tiempo y en memoria, por algo que la mayoría de las veces no se usa.",
        ],
        metrics: [{ label: "Movimientos cargados", value: 50000 }],
        scene: escena(
          [
            persona("p", 0, 0, "Pantalla", { icon: "browser" }),
            bd("h", 6, 0, "Historial", "rose", { load: 1, tags: ["50 000 movimientos"] }),
          ],
          [une("p", "h", { heads: "both" })],
          [vuelta(["p", "h"], "slow", 1, { speed: 2, dwellAt: { h: 1 } })],
        ),
      },
      {
        body: [
          "Un proxy ocupa el lugar del objeto real con su misma interfaz y decide cuándo se llega a él. Este lo carga solo cuando alguien pide de verdad el historial.",
          "Sirve para retrasar, proteger o hacer remoto el acceso sin que el cliente lo note. El decorador añade comportamiento; el proxy controla el acceso.",
        ],
        enCuentasClaras:
          "carga perezosa del historial largo de una cuenta: no se traen 50 000 movimientos para mostrar un saldo.",
        changes: ["+ Proxy del historial", "~ El historial real no se carga todavía"],
        metrics: [{ label: "Movimientos cargados", value: 0 }],
        scene: escena(
          [
            persona("p", 0, 0, "Pantalla", { icon: "browser" }),
            nodo("x", 5, 0, "ProxyDeHistorial", "amber", { icon: "shield", tags: ["Proxy"] }),
            bd("h", 10, 0, "Historial", "emerald", { tags: ["sin cargar"] }),
          ],
          [une("p", "x", { heads: "both" }), une("x", "h", { style: "off" })],
          [vuelta(["p", "x"], "request", 1)],
        ),
      },
    ),

    {
      title: "Resumen",
      kind: "resumen",
      body: [
        "Adapter, Decorator y Proxy se dibujan casi igual: un objeto delante de otro. La pregunta que los separa es para qué está ahí.",
        "El adaptador cambia la interfaz, el decorador la mantiene y añade comportamiento, y el proxy la mantiene y controla el acceso.",
      ],
      scene: escena(
        [
          nodo("a", 0, 0, "Cliente", "cyan"),
          nodo("x", 5, 0, "Intermediario", "amber"),
          nodo("b", 10, 0, "Objeto real", "emerald"),
          tabla(0, 5, "Para qué sirve cada uno", [
            ["Adapter", "encajar una interfaz ajena"],
            ["Bridge", "dos dimensiones que varían"],
            ["Composite", "hoja y grupo por igual"],
            ["Facade", "simplificar un subsistema"],
            ["Decorator", "añadir sin modificar"],
            ["Flyweight", "compartir lo repetido"],
            ["Proxy", "controlar el acceso"],
          ]),
        ],
        [une("a", "x", { heads: "both" }), une("x", "b", { heads: "both" })],
        [vuelta(["a", "x", "b"])],
      ),
    },
  ],
};
