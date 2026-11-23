"use client";

import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  window.addEventListener("popstate", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("popstate", cb);
  };
}

function read(): number {
  const n = Number(new URLSearchParams(window.location.search).get("paso"));
  return Number.isInteger(n) && n > 0 ? n : 1;
}

/** Paso actual (1-based) según `?paso=N`, sin remontar la página al cambiar. */
export function useUrlStep(total: number): number {
  const n = useSyncExternalStore(subscribe, read, () => 1);
  return Math.min(Math.max(1, n), total);
}

export function setUrlStep(n: number): void {
  if (read() === n) return;
  window.history.pushState(null, "", `?paso=${n}`);
  for (const cb of listeners) cb();
}
