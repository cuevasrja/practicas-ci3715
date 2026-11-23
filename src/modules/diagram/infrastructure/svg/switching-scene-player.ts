import type { ScenePlayer, ScenePlayerOptions } from "@/modules/diagram/application/scene-player";
import { EMPTY_SCENE, isSequence, type Scene } from "@/modules/diagram/domain/scene";
import { SvgScenePlayer } from "./svg-scene-player";
import { SvgSequencePlayer } from "./svg-sequence-player";

/**
 * Reproductor que acepta cualquier tipo de escena y delega en el adaptador
 * que sabe dibujarla. Al cambiar de tipo destruye uno y crea el otro sobre
 * el mismo <svg>.
 */
export class SwitchingScenePlayer implements ScenePlayer {
  private iso: SvgScenePlayer | null = null;
  private sequence: SvgSequencePlayer | null = null;
  private paused = false;

  constructor(
    private svg: SVGSVGElement,
    private options: ScenePlayerOptions = {},
  ) {}

  goTo(next: Scene, opts?: { instant?: boolean }): void {
    if (isSequence(next)) this.sequencePlayer().goTo(next, opts);
    else this.isoPlayer().goTo(next, opts);
  }

  replay(prev: Scene, current: Scene): void {
    if (isSequence(current)) {
      // Sin paso anterior del mismo diagrama, se repite desde el principio.
      const start = isSequence(prev) ? prev : { ...current, cursor: 0 };
      this.sequencePlayer().replay(start, current);
    } else {
      this.isoPlayer().replay(isSequence(prev) ? EMPTY_SCENE : prev, current);
    }
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    this.iso?.setPaused(paused);
  }

  fit(instant?: boolean): void {
    this.iso?.fit(instant);
    this.sequence?.fit(instant);
  }

  destroy(): void {
    this.iso?.destroy();
    this.sequence?.destroy();
    this.iso = null;
    this.sequence = null;
  }

  private isoPlayer(): SvgScenePlayer {
    if (this.sequence) {
      this.sequence.destroy();
      this.sequence = null;
    }
    if (!this.iso) {
      this.iso = new SvgScenePlayer(this.svg, this.options);
      this.iso.setPaused(this.paused || !!this.options.reducedMotion);
    }
    return this.iso;
  }

  private sequencePlayer(): SvgSequencePlayer {
    if (this.iso) {
      this.iso.destroy();
      this.iso = null;
    }
    this.sequence ??= new SvgSequencePlayer(this.svg, this.options);
    return this.sequence;
  }
}
