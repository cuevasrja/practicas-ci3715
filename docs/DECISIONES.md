# Registro de decisiones de diseño

Cada entrada explica **por qué** el proyecto es como es. Sirve para no repetir
discusiones ya resueltas y para saber qué se rompe si se cambia algo.

Cómo usarlo:

- Una decisión por entrada, numerada (`D-001`, `D-002`…). Los números no se
  reutilizan.
- Las entradas no se reescriben. Si una decisión cambia, se marca la antigua
  como `Sustituida por D-0XX` y se escribe una nueva.
- Escribe una entrada cuando elijas entre alternativas reales, añadas una
  dependencia, o cambies una frontera o una convención. Un arreglo sin
  alternativas no necesita entrada.
- La plantilla está al final.

| Nº    | Decisión                                                 | Estado  |
| ----- | -------------------------------------------------------- | ------- |
| D-001 | Motor de animación propio sobre SVG                      | Vigente |
| D-002 | Escenas completas por paso, animadas por diferencia      | Vigente |
| D-003 | Lecciones como datos TypeScript, con contenido original  | Vigente |
| D-004 | El paso actual vive en la URL                            | Vigente |
| D-005 | Progreso en el navegador, sin cuentas                    | Vigente |
| D-006 | Identidad visual propia con variables CSS                | Vigente |
| D-007 | `params` se lee dentro de `<Suspense>`                   | Vigente |
| D-008 | Arquitectura hexagonal por módulos, vigilada por ESLint  | Vigente |
| D-009 | Puertos de repositorio aunque hoy solo haya un adaptador | Vigente |
| D-010 | `course` depende del dominio de `diagram`                | Vigente |
| D-011 | bun como gestor de paquetes y ejecutor de pruebas        | Vigente |
| D-012 | Biome como linter y formateador                          | Vigente |

---

## D-001 — Motor de animación propio sobre SVG

- **Fecha:** 2026-11-23
- **Estado:** Vigente

**Contexto.** El proyecto se inspira en designedtoscale.app, cuyas animaciones
no usan ninguna librería: un bucle `requestAnimationFrame` escribe atributos
SVG. Hacía falta decidir si reproducir esa técnica o apoyarse en una librería.

**Decisión.** Motor propio en TypeScript, sin dependencias de animación. Los
paquetes se colocan con `path.getPointAtLength()` y los enlaces se dibujan con
`stroke-dashoffset`.

**Alternativas descartadas.**

- GSAP o Motion: resuelven tweens, pero no el problema central (comparar dos
  escenas y simular tráfico continuo), que habría que escribir igualmente.
- React Flow: pensado para grafos editables, no para vistas isométricas.
- Canvas o WebGL: más rendimiento del necesario y se pierden el texto nítido,
  el estilo por CSS y la accesibilidad del SVG.

**Consecuencias.** Cero dependencias y control total del movimiento. A cambio,
el motor es código propio que hay que mantener, y con cientos de paquetes a la
vez el SVG sería un límite (hoy hay un tope de 240).

## D-002 — Escenas completas por paso, animadas por diferencia

- **Fecha:** 2026-11-23
- **Estado:** Vigente

**Contexto.** Un paso podría describir su escena entera o solo los cambios
respecto al paso anterior.

**Decisión.** Cada paso declara la escena completa. El motor compara la escena
anterior y la nueva por `id` y anima la diferencia.

**Alternativas descartadas.** Pasos como lista de operaciones («añade X»,
«mueve Y»): más cortos de escribir, pero obligan a reproducir todos los pasos
previos para saltar a uno, y hacen frágil ir hacia atrás.

**Consecuencias.** Se puede saltar a cualquier paso, retroceder y repetir una
transición sin estado acumulado. Las lecciones repiten datos entre pasos, lo
que se resuelve definiendo cada nodo como constante reutilizable.

## D-003 — Lecciones como datos TypeScript, con contenido original

- **Fecha:** 2026-11-23
- **Estado:** Vigente

**Contexto.** El sitio de referencia vende su temario completo. Este proyecto
es de aprendizaje y portafolio.

**Decisión.** Las lecciones son objetos TypeScript dentro del repositorio. Los
textos y diagramas se escriben desde cero; del sitio de referencia se toma la
técnica, no el contenido ni el estilo visual.

**Alternativas descartadas.** MDX o un CMS: útiles con muchos autores, pero
aquí añadirían infraestructura sin beneficio y perderían la comprobación de
tipos sobre las escenas.

**Consecuencias.** El compilador y `validateLesson()` detectan lecciones mal
formadas. Añadir una lección exige tocar código; si algún día escriben
personas no técnicas, se añade otro adaptador de `LessonRepository` (D-009).

## D-004 — El paso actual vive en la URL

- **Fecha:** 2026-11-23
- **Estado:** Vigente

**Contexto.** El paso podía guardarse en estado de React, en un segmento de
ruta (`/leccion/x/3`) o en un parámetro.

**Decisión.** Parámetro `?paso=N`, actualizado con `history.pushState` y leído
con `useSyncExternalStore` (`src/ui/hooks/use-url-step.ts`).

**Alternativas descartadas.**

- Estado de React: se pierde al recargar y no se puede enlazar a un paso.
- Segmento de ruta: cada paso sería una navegación que desmonta el escenario y
  corta la animación.
- `useSearchParams`: obliga a envolver en `<Suspense>` y afecta al
  prerenderizado con Cache Components.

**Consecuencias.** Se puede enlazar a un paso, recargar y usar «atrás» sin
remontar el diagrama. El HTML prerenderizado siempre muestra el paso 1 y el
cliente salta al correcto al hidratar.

## D-005 — Progreso en el navegador, sin cuentas

- **Fecha:** 2026-11-23
- **Estado:** Vigente

**Contexto.** El proyecto es abierto, sin pagos ni usuarios.

**Decisión.** El progreso se guarda en `localStorage` (clave `sa:progreso`)
como el paso más alto alcanzado por lección.

**Consecuencias.** No hace falta backend y el sitio puede desplegarse como
estático. El progreso no viaja entre dispositivos. Pasarlo a servidor es un
adaptador nuevo de `ProgressRepository`.

## D-006 — Identidad visual propia con variables CSS

- **Fecha:** 2026-11-23
- **Estado:** Vigente

**Contexto.** El sitio de referencia tiene un estilo muy reconocible (papel
cálido, tipografía monoespaciada, contornos gruesos) que no debía imitarse.

**Decisión.** Paleta fría (pizarra e índigo), tipografía Geist y volúmenes
suaves. Todos los colores son variables CSS en `globals.css` con valor para
tema claro y oscuro; el tema se fija con `data-theme` en `<html>` antes del
primer pintado.

**Consecuencias.** Cambiar la paleta es editar un archivo. Los componentes y el
SVG no pueden usar colores fijos.

## D-007 — `params` se lee dentro de `<Suspense>`

- **Fecha:** 2026-11-23
- **Estado:** Vigente

**Contexto.** Con Cache Components, Next avisa en desarrollo si una ruta
dinámica lee `params` fuera de `<Suspense>`, porque puede bloquear la
navegación.

**Decisión.** La página `/leccion/[slug]` devuelve un `<Suspense>` con un
esqueleto y lee el `slug` en un componente hijo.

**Alternativas descartadas.** `export const instant = false`: silencia el
aviso aceptando una navegación bloqueante.

**Consecuencias.** Las tres lecciones siguen prerenderizándose enteras. Un slug
inexistente responde con código 200 y muestra el «no encontrado» dentro del
flujo, porque el esqueleto se envía antes de conocer el resultado.

## D-008 — Arquitectura hexagonal por módulos, vigilada por ESLint

- **Fecha:** 2026-11-23
- **Estado:** Vigente

**Contexto.** La primera versión separaba `engine/`, `lessons/`, `lib/` y
`components/`. El motor ya era independiente de React, pero nada lo
garantizaba y la interfaz importaba directamente la clase que dibuja.

**Decisión.** Dos módulos, `diagram` y `course`, cada uno con `domain`,
`application` e `infrastructure`; `ui` y `app` son adaptadores primarios. La
interfaz entra por el `container` de cada módulo. Las fronteras se comprueban
con `no-restricted-imports` y `no-restricted-globals`.

**Alternativas descartadas.**

- Capas globales (`src/domain`, `src/application`…): mezclan el motor y el
  temario, que cambian por motivos distintos.
- Solo convención, sin lint: las fronteras se erosionan, sobre todo con
  agentes de IA escribiendo código.

**Consecuencias.** El dominio se prueba sin navegador y cambiar SVG por otra
tecnología no toca la interfaz. Hay más archivos y más indirección de la que
el tamaño actual exige: es un coste aceptado a cambio de fronteras claras.

## D-009 — Puertos de repositorio aunque hoy solo haya un adaptador

- **Fecha:** 2026-11-23
- **Estado:** Vigente

**Contexto.** Las lecciones son datos en memoria y el progreso está en
`localStorage`; se podrían importar directamente.

**Decisión.** `LessonRepository` y `ProgressRepository` son puertos del
dominio. `LessonRepository` es asíncrono aunque el adaptador actual no lo
necesite. `ProgressRepository` es síncrono y con `subscribe`, porque lo
consume `useSyncExternalStore`.

**Consecuencias.** Pasar a un CMS o a una API no cambia casos de uso ni
interfaz. Si el progreso se mueve a servidor, el puerto síncrono obligará a
que el adaptador mantenga una copia local y sincronice en segundo plano.

## D-010 — `course` depende del dominio de `diagram`

- **Fecha:** 2026-11-23
- **Estado:** Vigente

**Contexto.** Un paso de lección contiene una escena, así que los dos módulos
no pueden ser totalmente independientes.

**Decisión.** `course/domain` importa los tipos de `diagram/domain`. La
dependencia es de un solo sentido y ESLint impide la contraria.

**Alternativas descartadas.** Un módulo `shared` con el modelo de escena:
separaría el modelo de las funciones que lo interpretan (`diff`, `iso`).

**Consecuencias.** El motor puede reutilizarse en otro proyecto sin llevarse
el temario. Cambiar el modelo de escena afecta a todas las lecciones.

## D-011 — bun como gestor de paquetes y ejecutor de pruebas

- **Fecha:** 2026-11-23
- **Estado:** Vigente

**Decisión.** bun instala dependencias, ejecuta los scripts y corre las
pruebas (`bun test`), sin Jest ni Vitest.

**Consecuencias.** Una herramienta menos que configurar. Las pruebas no tienen
DOM, lo que encaja con probar solo dominio y aplicación; probar el adaptador
SVG exigiría añadir un entorno de navegador.

## D-012 — Biome como linter y formateador

- **Fecha:** 2026-11-23
- **Estado:** Vigente. Cambia la herramienta de D-008; la decisión de vigilar
  las fronteras sigue igual.

**Contexto.** El proyecto nació con ESLint y `eslint-config-next`, sin
formateador. Se pidió cambiar el linter por Biome.

**Decisión.** Biome hace lint y formato con una sola dependencia y un solo
archivo (`biome.jsonc`). Se activan sus reglas recomendadas y los dominios
`next` y `react`. Las fronteras de capas se expresan con `noRestrictedImports`
y `noRestrictedGlobals` dentro de `overrides`, un bloque por capa y módulo.

**Alternativas descartadas.** Mantener ESLint solo para las fronteras: dos
herramientas y dos configuraciones para lo que Biome ya cubre.

**Consecuencias.**

- Una herramienta menos y comprobaciones casi instantáneas.
- La configuración es JSON: no admite constantes, así que las listas de
  imports prohibidos se repiten en cada bloque y hay que copiarlas al añadir
  un módulo.
- Se pierden las reglas de `eslint-config-next` que Biome no tiene en su
  dominio `next`; no se ha hecho un inventario de cuáles son.
- El formato pasa a ser obligatorio: `bun run lint` falla si un archivo no
  está formateado.

---

## Plantilla

```markdown
## D-0XX — Título corto de la decisión

- **Fecha:** AAAA-MM-DD
- **Estado:** Vigente | Sustituida por D-0XX

**Contexto.** Qué problema había y qué lo hacía una decisión real.

**Decisión.** Qué se eligió.

**Alternativas descartadas.** Qué más se consideró y por qué no.

**Consecuencias.** Qué se gana, qué se pierde y qué habría que tocar para
cambiarla.
```
