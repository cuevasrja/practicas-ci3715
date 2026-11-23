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

| Nº    | Decisión                                                     | Estado               |
| ----- | ------------------------------------------------------------ | -------------------- |
| D-001 | Motor de animación propio sobre SVG                          | Vigente              |
| D-002 | Escenas completas por paso, animadas por diferencia          | Vigente              |
| D-003 | Lecciones como datos TypeScript, con contenido original      | Vigente              |
| D-004 | El paso actual vive en la URL                                | Vigente              |
| D-005 | Progreso en el navegador, sin cuentas                        | Vigente              |
| D-006 | Identidad visual propia con variables CSS                    | Sustituida por D-014 |
| D-007 | `params` se lee dentro de `<Suspense>`                       | Vigente              |
| D-008 | Arquitectura hexagonal por módulos, vigilada por ESLint      | Vigente              |
| D-009 | Puertos de repositorio aunque hoy solo haya un adaptador     | Vigente              |
| D-010 | `course` depende del dominio de `diagram`                    | Vigente              |
| D-011 | bun como gestor de paquetes y ejecutor de pruebas            | Vigente              |
| D-012 | Biome como linter y formateador                              | Vigente              |
| D-013 | Segundo tipo de diagrama (secuencia) detrás del mismo puerto | Vigente              |
| D-014 | Paleta y tipografía de las láminas del curso                 | Vigente              |
| D-015 | CI-3715 como flujo principal; lo anterior, material extra    | Vigente              |
| D-016 | Catálogo de estilos y patrones como recorrido aparte         | Vigente              |

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
- **Estado:** Sustituida por D-014 (se conserva el mecanismo de variables CSS)

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

## D-013 — Segundo tipo de diagrama (secuencia) detrás del mismo puerto

- **Fecha:** 2026-11-23
- **Estado:** Vigente

**Contexto.** El curso gira en torno al diagrama de secuencia de diseño, con
una notación obligatoria (puntas negras y blancas, retornos punteados,
fragmentos). El motor isométrico no sabe dibujarlo.

**Decisión.** `Scene` pasa a ser una unión de dos tipos: `IsoScene` y
`SequenceScene`. Cada uno tiene su adaptador SVG y ambos implementan el mismo
puerto `ScenePlayer`; un reproductor intermedio elige según `scene.kind`. La
geometría del diagrama (columnas, filas, fragmentos, barras, rama atenuada)
vive en el dominio y se prueba sin navegador.

Se mantiene D-002: cada paso declara la escena completa. El diagrama se
escribe una vez y cada paso solo cambia el `cursor`, el número de filas
visibles.

**Alternativas descartadas.**

- Mermaid: dibuja la notación, pero no permite revelar mensaje a mensaje,
  atenuar una rama ni seguir al mensaje con la cámara.
- Forzar la secuencia sobre el motor isométrico: no hay forma razonable de
  representar líneas de vida ni fragmentos con nodos y enlaces.
- Un puerto distinto para secuencias: la interfaz tendría que saber qué tipo
  de lección muestra.

**Consecuencias.** La interfaz no cambia según el tipo de lección, salvo la
leyenda y el botón de pausa. Hay dos adaptadores que mantener. El ancho de las
etiquetas se estima por número de caracteres, sin medir el texto: una
tipografía muy distinta obligaría a ajustar esa constante.

## D-014 — Paleta y tipografía de las láminas del curso

- **Fecha:** 2026-11-23
- **Estado:** Vigente. Sustituye a D-006.

**Contexto.** El contexto del curso define la paleta de las láminas (fondo
oscuro `#17252B`, menta `#2FA37A`, ámbar `#F2A541`, rojo `#D9534F`…) y pide
animaciones coherentes con ellas.

**Decisión.** La paleta del curso sustituye a la anterior en todo el sitio,
en tema claro y oscuro. Se conserva el mecanismo de D-006: todo color es una
variable CSS. Títulos en Caladea y texto en Carlito, los equivalentes libres
de Cambria y Calibri.

**Alternativas descartadas.**

- Aplicarla solo a los diagramas de secuencia: dos estilos en el mismo sitio.
- Servir Cambria y Calibri: son tipografías de Microsoft y no se pueden
  distribuir en la web. Si están instaladas en el equipo, se usan primero.

**Consecuencias.** El sitio y las láminas se ven como parte del mismo curso.
La menta de la paleta no da contraste suficiente como texto sobre fondo claro,
así que para texto y bordes se usa un tono más oscuro (`#1C7A5A`) y la menta
original queda para rellenos.

## D-015 — CI-3715 como flujo principal; lo anterior, material extra

- **Fecha:** 2026-11-23
- **Estado:** Vigente

**Contexto.** El sitio nació con tres lecciones de sistemas en producción.
Ahora es el material animado de CI-3715.

**Decisión.** Cada lección declara `track`: `principal` para las 11 clases,
en orden, y `extra` para las tres anteriores. La portada y la barra lateral
muestran primero el flujo principal por bloques. «Siguiente lección» no salta
de un recorrido al otro.

Las clases 8 a 11 usan diagramas de secuencia. Las clases 1 a 7 usan el motor
isométrico con las ideas de cada clase que ese motor representa bien.

**Consecuencias.** Quedan fuera de esta entrega las sesiones prácticas (8B,
9B, 10B…) y las ideas de las clases 1 a 7 que piden otro tipo de animación:
el planning poker, los sustantivos que se convierten en clases o la balanza
de Liskov. Los textos de las clases se redactaron a partir de
`docs/CONTEXTO-CURSO.md` y no los ha revisado todavía el profesor.

## D-016 — Catálogo de estilos y patrones como recorrido aparte

- **Fecha:** 2026-11-23
- **Estado:** Vigente

**Contexto.** Las clases 4, 5, 9 y 10 presentan muchos estilos de arquitectura
y patrones de diseño, pero cada lección del flujo principal solo anima dos o
tres. Se pidió tenerlos todos.

**Decisión.** Un tercer recorrido, `catalogo`, con seis lecciones agrupadas
por familia: dos de estilos y cuatro de patrones. Cada patrón es una ficha de
dos pasos, el problema sin el patrón y la solución con él, con la nota «En
Cuentas Claras» tomada de las láminas de la clase 5. Los estilos llevan uno o
dos pasos cada uno, con lo que resuelven y lo que cuestan.

El contenido sale de las láminas de las clases 4 y 5. Se añadió lo que faltaba
para que el catálogo estuviera completo: del libro base, par a par, tres
niveles y tuberías y filtros; del catálogo original de patrones, Memento e
Interpreter; y Flyweight, que las láminas listan sin desarrollar.

**Alternativas descartadas.**

- Una lección por patrón: 35 tarjetas en la portada y lecciones de tres pasos.
- Meterlos en las clases 4 y 5: las alargaría mucho más allá de lo que cubre
  una clase.
- Diagramas de clases, como en las láminas: el motor no los dibuja. Se usan
  escenas de objetos colaborando, que muestran el efecto del patrón pero no
  su estructura de clases.

**Consecuencias.** Se puede enlazar a un patrón concreto con `?paso=N`, pero
no hay una página propia por patrón ni un buscador. Las fichas de Flyweight,
Memento e Interpreter usan ejemplos que no vienen del material del curso y lo
dicen en su nota.

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
