"use client";

import { type Ref, useEffect, useImperativeHandle, useRef } from "react";
import type { ScenePlayer } from "@/modules/diagram/application/scene-player";
import type { Scene } from "@/modules/diagram/domain/scene";
import { createScenePlayer } from "@/modules/diagram/infrastructure/container";

export type StageHandle = {
  replay: (prev: Scene, current: Scene) => void;
  fit: () => void;
};

type Props = {
  scene: Scene;
  paused: boolean;
  label: string;
  ref?: Ref<StageHandle>;
};

/** Monta un ScenePlayer sobre un <svg> y lo mantiene sincronizado con la escena. */
export function StageView({ scene, paused, label, ref }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const stage = useRef<ScenePlayer | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const instance = createScenePlayer(svg, { reducedMotion });
    stage.current = instance;
    return () => {
      instance.destroy();
      stage.current = null;
    };
  }, []);

  useEffect(() => {
    stage.current?.goTo(scene);
  }, [scene]);

  useEffect(() => {
    stage.current?.setPaused(paused);
  }, [paused]);

  useImperativeHandle(
    ref,
    () => ({
      replay: (prev, current) => stage.current?.replay(prev, current),
      fit: () => stage.current?.fit(),
    }),
    [],
  );

  return <svg ref={svgRef} className="stage-svg" role="img" aria-label={label} />;
}
