import type { ScenePlayer, ScenePlayerOptions } from "@/modules/diagram/application/scene-player";
import { SvgScenePlayer } from "./svg/svg-scene-player";

/** Raíz de composición: elige el adaptador que implementa ScenePlayer. */
export function createScenePlayer(
  svg: SVGSVGElement,
  options: ScenePlayerOptions = {},
): ScenePlayer {
  return new SvgScenePlayer(svg, options);
}
