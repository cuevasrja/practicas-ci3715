import type { Lesson } from "@/modules/course/domain/lesson";
import { actor, alt, diagram, els, end, obj, ret, sync } from "./sequence-helpers";

// Registrar un gasto de grupo en Cuentas Claras.
const d = diagram(
  [
    actor("u", "Usuario"),
    obj("app", ":App"),
    obj("api", ":API"),
    obj("cu", ":RegistrarGastoDelGrupo"),
    obj("repo", ":RepositorioGrupos"),
    obj("grupo", ":Grupo"),
  ],
  [
    [sync("u", "app", "confirma el gasto")],
    [sync("app", "api", "POST /grupos/{id}/gastos (pagador, monto, participantes)")],
    [sync("api", "cu", "ejecutar(grupoId, pagador, monto, participantes)")],
    [sync("cu", "repo", "obtener(grupoId)"), ret("repo", "cu", "grupo")],
    [sync("cu", "grupo", "registrarGasto(pagador, monto, participantes)")],
    [alt("pagador es miembro"), ret("grupo", "cu", "gasto"), sync("cu", "repo", "guardar(grupo)")],
    [
      ret("cu", "api", "gasto"),
      ret("api", "app", "201 (gasto)"),
      ret("app", "u", "muestra el gasto y los saldos"),
    ],
    [
      els("pagador no es miembro"),
      ret("grupo", "cu", "ErrorPagador"),
      ret("cu", "api", "ErrorPagador"),
      ret("api", "app", "422 (motivo)"),
      ret("app", "u", "muestra el motivo"),
    ],
    [end],
  ],
);

export const clase08: Lesson = {
  slug: "clase-8-secuencia-de-diseno",
  module: "Secuencias de diseño",
  track: "principal",
  label: "Clase 8",
  title: "Diagramas de secuencia de diseño",
  summary:
    "Cómo se comunican los componentes reales para registrar un gasto de grupo: operaciones, parámetros, retornos y la rama de error.",
  minutes: 12,
  goals: [
    "Leer un diagrama de secuencia de diseño mensaje por mensaje",
    "Distinguir un mensaje síncrono de su retorno",
    "Convertir cada «si no» del enunciado en un alt con su guarda",
    "Comprobar que la respuesta llega siempre hasta el actor",
  ],
  steps: [
    {
      title: "Los participantes",
      kind: "tecnica",
      body: [
        "En análisis hablábamos de límite, control y entidad. En diseño los participantes son los componentes reales: la app, el API, el caso de uso, el repositorio y el objeto de dominio.",
        "El actor se dibuja como un muñeco con su rol. Cada objeto es una caja con nombre:Clase, y de cada uno baja una línea de vida punteada. El tiempo avanza hacia abajo.",
      ],
      note: "La regla de toda la clase: cada mensaje es una operación del receptor.",
      scene: d.at(0),
    },
    {
      title: "El actor inicia la interacción",
      kind: "tecnica",
      body: [
        "Todo empieza cuando el usuario hace algo: aquí, confirmar el gasto en la pantalla.",
        "El actor solo habla con la interfaz. Nunca con una entidad ni con la base de datos: ese es uno de los errores que más puntos resta.",
      ],
      changes: ["+ Usuario → :App"],
      scene: d.at(1),
    },
    {
      title: "La app llama al API",
      kind: "tecnica",
      body: [
        "La app no registra el gasto: se lo pide al servidor. Una llamada HTTP se escribe con el verbo, la ruta y los datos que viajan.",
        "Es un mensaje síncrono, línea continua con triángulo negro: la app queda esperando la respuesta. La barra sobre la línea de vida marca ese tiempo de espera.",
      ],
      changes: ["+ POST /grupos/{id}/gastos"],
      scene: d.at(2),
    },
    {
      title: "El API delega en el caso de uso",
      kind: "tecnica",
      body: [
        "El API traduce la petición HTTP en una llamada al caso de uso, que es quien coordina el trabajo.",
        "Los parámetros tienen que alcanzar: si más abajo hace falta el pagador, tiene que venir desde aquí. Un mensaje sin parámetros casi siempre está incompleto.",
      ],
      changes: ["+ ejecutar(grupoId, pagador, monto, participantes)"],
      scene: d.at(3),
    },
    {
      title: "Cargar el grupo",
      kind: "tecnica",
      body: [
        "El caso de uso solo tiene un identificador. Le pide el grupo al repositorio, que es el único que sabe cómo está guardado.",
        "La respuesta es un retorno: línea punteada, y la etiqueta dice qué valor vuelve. Dibujar un retorno con línea continua es otro error frecuente.",
      ],
      changes: ["+ obtener(grupoId)", "+ retorno: grupo"],
      scene: d.at(4),
    },
    {
      title: "El dominio decide",
      kind: "tecnica",
      body: [
        "Registrar el gasto es responsabilidad del grupo: es el experto, porque conoce a sus miembros.",
        "Esta operación tiene una precondición que puede fallar: el pagador debe ser miembro. Toda precondición que puede fallar necesita su alt o su break en el diagrama.",
      ],
      changes: ["+ registrarGasto(pagador, monto, participantes)"],
      scene: d.at(5),
    },
    {
      title: "alt: el pagador es miembro",
      kind: "tecnica",
      body: [
        "El recuadro alt reúne alternativas excluyentes. El operador va en la esquina y la guarda, entre corchetes, dice cuándo se toma esa rama.",
        "En el camino feliz el grupo devuelve el gasto y el caso de uso guarda el grupo actualizado.",
      ],
      changes: ["+ alt [pagador es miembro]", "+ guardar(grupo)"],
      scene: d.at(6),
    },
    {
      title: "La respuesta sube hasta el actor",
      kind: "solucion",
      body: [
        "El ciclo de vida de la petición no termina en el servidor. El resultado vuelve por el mismo camino: caso de uso, API con su código 201, app y, al final, lo que ve el usuario.",
        "Si el actor se queda sin respuesta, el diagrama está incompleto.",
      ],
      changes: ["+ 201 (gasto)", "+ La app muestra el gasto y los saldos"],
      scene: d.at(7),
    },
    {
      title: "else: el pagador no es miembro",
      kind: "problema",
      body: [
        "Cada «si no» del enunciado es otra rama del alt. Aquí el grupo responde con un error en lugar del gasto, y nada se guarda.",
        "El error también sube completo: el API lo convierte en un 422 con el motivo y la app se lo muestra al usuario. La rama que no se toma queda atenuada.",
      ],
      changes: ["+ else [pagador no es miembro]", "+ 422 (motivo)"],
      scene: d.at(8),
    },
    {
      title: "Resumen",
      kind: "resumen",
      body: [
        "Un diagrama de secuencia de diseño muestra quién llama a quién, con qué datos y qué vuelve, desde que el actor actúa hasta que recibe la respuesta.",
        "Antes de entregarlo, revisa: cada mensaje es una operación del receptor, los retornos van punteados, cada «si no» tiene su rama y las dos ramas terminan en el actor.",
      ],
      scene: d.at(9),
    },
  ],
};
