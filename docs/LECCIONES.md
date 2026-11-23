# Cómo escribir una lección

Una lección es un objeto `Lesson` en
`src/modules/course/infrastructure/content/`. No hay que tocar el motor.

## Pasos

1. Copia un archivo existente (el más sencillo es `cache.ts`).
2. Cambia `slug` (minúsculas y guiones), `module`, `title`, `summary`,
   `minutes` y `goals`.
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

## Texto

- Dos párrafos cortos por paso. El diagrama explica; el texto acompaña.
- Cada paso introduce una sola idea y un solo cambio visible.
- Empieza por un problema y termina con un `resumen` que incluya un `panel`.
- El contenido es original: no copies textos ni diagramas de otros cursos.
