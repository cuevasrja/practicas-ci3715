# Cómo escribir una lección

Una lección es un objeto `Lesson` en
`src/modules/course/infrastructure/content/`. No hay que tocar el motor.

## Pasos

1. Copia un archivo existente (el más sencillo es `cache.ts`).
2. Cambia `slug` (minúsculas y guiones), `module`, `track`, `label`, `title`,
   `summary`, `minutes` y `goals`. Las clases del curso llevan
   `track: "principal"` y `label: "Clase N"`; las del catálogo,
   `track: "catalogo"`; el material complementario, `track: "extra"`.
3. Escribe los pasos.
4. Añade la lección a `LESSONS` en `content/index.ts`, en el orden del temario.
5. Ejecuta `bun test`: valida todos los enlaces y flujos.
6. Ábrela en `bun dev` y recorre los pasos con `→`.

## Un paso

```ts
{
  title: "Un balanceador en medio",
  kind: "tecnica",            // problema | tecnica | solucion | resumen
  body: ["Párrafo 1.", "Párrafo 2."],
  note: "Idea destacada (opcional).",
  changes: ["+ Balanceador", "~ El tráfico se reparte", "− Servidor 3"],
  metrics: [{ label: "Errores", value: 0, unit: "%" }],
  scene: { entities: [...], links: [...], flows: [...] },
}
```

**Cada paso declara la escena completa**, no los cambios respecto al anterior.
El motor compara las dos escenas por `id` y anima la diferencia. Por eso:

- Para que un nodo se mantenga, usa el mismo `id` en ambos pasos.
- Para que se mueva, cambia su `x` o `y`.
- Para que desaparezca, no lo incluyas.
- Cambiar el `type` de un `id` lo sustituye (sale uno y entra otro).

Define cada nodo una vez como constante o función y reutilízalo en los pasos.

## La rejilla

Proyección isométrica: `+x` va hacia abajo a la derecha y `+y` hacia abajo a la
izquierda. Deja unas 4 celdas entre nodos conectados.

Los enlaces siguen los ejes. Si dos nodos no están alineados, el enlace hace un
codo; `via: "x"` sale primero por el eje x y `via: "y"` por el eje y. Comprueba
que la esquina del codo no cae sobre otro nodo.

## Entidades

| `type`   | Uso                                                    |
| -------- | ------------------------------------------------------ |
| `block`  | Servidor, servicio, balanceador                        |
| `device` | Navegador, clientes                                    |
| `db`     | Base de datos o almacén (cilindro)                     |
| `queue`  | Cola                                                   |
| `zone`   | Área en el suelo que agrupa nodos (`w`, `d` en celdas) |
| `panel`  | Tarjeta de resumen con `rows: [etiqueta, valor][]`     |

Campos opcionales: `icon`, `tone`, `load` (0–1, dibuja un medidor), `dead`
(nodo caído) y `tags` (etiquetas cortas encima).

- `tone`: `slate`, `indigo`, `cyan`, `amber`, `rose`, `emerald`, `violet`.
- `icon`: `server`, `globe`, `browser`, `users`, `database`, `bolt`, `split`,
  `files`, `shield`.

## Enlaces

`{ from, to, label?, style?, heads?, via? }`

- `style`: `solid` (por defecto), `off` (punteado, inactivo) o `cut` (rojo,
  roto).
- `heads`: `end` (por defecto), `both` o `none`.

## Flujos

`{ route, kind, rate, bounce?, fail?, speed?, dwellAt? }`

- `route`: ids de nodos; cada par consecutivo necesita un enlace entre ellos.
- `kind`: `request`, `response`, `handshake`, `query`, `write`, `slow`, `drop`,
  `ping`. Decide el color y la velocidad base.
- `rate`: paquetes por segundo. Entre 0,4 y 3 se lee bien.
- `bounce`: el paquete vuelve al origen.
- `fail`: probabilidad (0–1) de fallar al llegar al final.
- `dwellAt`: segundos de espera dentro de un nodo, por ejemplo `{ db: 1.2 }`
  para mostrar una consulta lenta.

Un flujo idéntico en dos pasos seguidos continúa sin cortes; si cambia
cualquier campo se reinicia.

## Fichas del catálogo

Las lecciones del catálogo (`catalogo-*.ts`, con `track: "catalogo"`) explican
un estilo o un patrón por ficha. Los atajos de `content/iso-helpers.ts`
acortan las escenas, y `ficha()` genera los dos pasos de un patrón:

```ts
...ficha(
  "Adapter",
  {
    body: ["El problema, sin el patrón.", "Por qué duele."],
    scene: escena([nodo("dom", 0, 0, "Dominio"), nodo("api", 6, 0, "API")], [une("dom", "api")]),
  },
  {
    body: ["Qué hace el patrón.", "Cuándo conviene."],
    enCuentasClaras: "dónde aparece en el proyecto.",
    changes: ["+ ClienteSocial"],
    scene: escena([...], [...], [vuelta(["dom", "ad", "api"])]),
  },
),
```

Los títulos salen solos («Adapter: el problema» y «Adapter: la solución»); se
pueden cambiar con `title`. Reutiliza los mismos `id` en las dos escenas para
que los nodos se queden en su sitio y solo entre lo que aporta el patrón.

| Atajo                                        | Qué crea                |
| -------------------------------------------- | ----------------------- |
| `nodo(id, x, y, texto, tono?, extra?)`       | Bloque                  |
| `persona(id, x, y, texto, extra?)`           | Dispositivo o actor     |
| `bd(id, x, y, texto, tono?, extra?)`         | Base de datos           |
| `cola(id, x, y, texto, extra?)`              | Cola                    |
| `zona(id, x, y, ancho, fondo, texto, tono?)` | Área que agrupa nodos   |
| `tabla(x, y, título, filas)`                 | Panel de resumen        |
| `une(de, a, extra?)`                         | Enlace                  |
| `ida(ruta, tipo?, ritmo?, extra?)`           | Tráfico en un sentido   |
| `vuelta(ruta, tipo?, ritmo?, extra?)`        | Tráfico de ida y vuelta |

## Lecciones con diagrama de secuencia

Las clases 8 a 11 usan un diagrama de secuencia en lugar de la escena
isométrica. El más sencillo para copiar es
`clase-08-secuencia-de-diseno.ts`.

El diagrama se escribe una vez, por tramos, con los atajos de
`content/sequence-helpers.ts`. Cada tramo es lo que revela un paso:

```ts
const d = diagram(
  [actor("u", "Usuario"), obj("app", ":App"), ext("pas", ":Pasarela")],
  [
    [sync("u", "app", "confirma el gasto")], // tramo 1
    [sync("app", "pas", "cobrar(monto)"), ret("pas", "app", "ok")], // tramo 2
    [alt("aprobado"), ret("app", "u", "recibo")], // tramo 3
    [els("rechazado"), ret("app", "u", "motivo"), end], // tramo 4
  ],
);
// En cada paso:  scene: d.at(n)   -> los n primeros tramos a la vista
```

`d.at(0)` muestra solo los participantes. No hay que contar filas.

| Atajo                                         | Qué dibuja                                                        |
| --------------------------------------------- | ----------------------------------------------------------------- |
| `actor(id, rol)`                              | Muñeco con su rol                                                 |
| `obj(id, ":Clase", estereotipo?)`             | Caja; el estereotipo va en cursiva encima, sin comillas angulares |
| `ext(id, ":Clase")`                           | Caja gris con `«sistema externo»`                                 |
| `sync(de, a, texto)`                          | Línea continua, triángulo negro                                   |
| `async_(de, a, texto)`                        | Línea continua, triángulo blanco. Nunca lleva retorno             |
| `ret(de, a, texto)`                           | Línea punteada, etiqueta gris en cursiva                          |
| `create(de, a)`                               | Línea punteada; la caja de `a` aparece a esa altura               |
| `self(id, texto)`                             | Mensaje a sí mismo                                                |
| `alt`, `opt`, `loop`, `brk`, `par` `(guarda)` | Abre un fragmento                                                 |
| `els(guarda)`                                 | Siguiente rama de un `alt`                                        |
| `end`                                         | Cierra el fragmento                                               |
| `stage(texto)`                                | Línea que separa dos etapas                                       |

Qué hace el motor por su cuenta:

- Las barras de activación salen de emparejar cada `sync` con su `ret`.
- Mientras se recorre una rama de un `alt`, las otras ramas se atenúan.
- Una etiqueta larga se parte en dos líneas antes de su lista de parámetros.
- La cámara sigue al mensaje actual si el diagrama no cabe a un tamaño legible.

Sigue la notación de `docs/CONTEXTO-CURSO.md`: llamadas HTTP como
`VERBO /ruta (datos)` con su código de retorno, y una redirección como `302`
al navegador seguida de una petición nueva del navegador.

## Texto

- Dos párrafos cortos por paso. El diagrama explica; el texto acompaña.
- Cada paso introduce una sola idea y un solo cambio visible.
- Empieza por un problema y termina con un `resumen` que incluya un `panel`.
- Las clases de CI-3715 siguen `docs/CONTEXTO-CURSO.md`: mismos ejemplos,
  nombres de participantes y notación.
- El material extra es original: no copies textos ni diagramas de otros cursos.
