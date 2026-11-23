import type { ScenePlayer, ScenePlayerOptions } from "@/modules/diagram/application/scene-player";
import { SwitchingScenePlayer } from "./svg/switching-scene-player";

/**
 * Raíz de composición: elige el adaptador que implementa ScenePlayer. Hoy es
 * SVG, con un reproductor por tipo de escena (isométrica o de secuencia).
 */
export function createScenePlayer(
  svg: SVGSVGElement,
  options: ScenePlayerOptions = {},
): ScenePlayer {
  return new SwitchingScenePlayer(svg, options);
}
