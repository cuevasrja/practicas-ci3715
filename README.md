# CI-3715 animado

Material animado de CI-3715 Ingeniería de Software (Universidad Simón Bolívar).
Cada clase es una lección por pasos con un diagrama que avanza mientras un
panel explica qué ocurre: escenas isométricas para las clases 1 a 7 y
diagramas de secuencia de diseño para las clases 8 a 11. Incluye un catálogo
de estilos de arquitectura y patrones de diseño, y tres lecciones extra sobre
sistemas en producción.

## Empezar

```
bun install
bun dev
```

Abre <http://localhost:3000>.

| Comando          | Qué hace                   |
| ---------------- | -------------------------- |
| `bun dev`        | Servidor de desarrollo     |
| `bun run check`  | Tipos, lint y pruebas      |
| `bun run format` | Aplica el formato de Biome |
| `bun test`       | Pruebas                    |
| `bun run build`  | Compilación de producción  |

## En una lección

`←` `→` cambian de paso · `R` repite la animación · `Espacio` pausa el tráfico
(en las escenas isométricas) · `0` reencuadra · rueda y arrastre para zoom y
movimiento.

## Documentación

- [`docs/CONTEXTO-CURSO.md`](docs/CONTEXTO-CURSO.md): contenido del curso y notación.
- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md): capas, módulos y cómo extender.
- [`docs/LECCIONES.md`](docs/LECCIONES.md): cómo escribir una lección.
- [`docs/DECISIONES.md`](docs/DECISIONES.md): por qué el proyecto es como es.
- [`CHANGELOG.md`](CHANGELOG.md): qué cambió en cada versión.
- [`AGENTS.md`](AGENTS.md): instrucciones para agentes de IA.
