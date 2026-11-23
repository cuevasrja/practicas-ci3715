"use client";

import { useEffect, useRef } from "react";
import type { Metric } from "@/modules/course/domain/lesson";

const fmt = new Intl.NumberFormat("es-ES");

function Counter({ value }: { value: number }) {
  const span = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);

  useEffect(() => {
    const node = span.current;
    if (!node) return;
    const from = shown.current;
    if (from === value) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shown.current = value;
      node.textContent = fmt.format(value);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 700);
      const v = from + (value - from) * (1 - (1 - t) ** 3);
      shown.current = v;
      node.textContent = fmt.format(Math.round(v));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span ref={span}>{fmt.format(value)}</span>;
}

export function Hud({ metrics }: { metrics: Metric[] }) {
  if (metrics.length === 0) return null;
  return (
    <dl className="flex flex-nowrap gap-1.5 overflow-x-auto whitespace-nowrap">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-lg border border-line bg-surface/90 px-2.5 py-1 backdrop-blur"
        >
          <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">{m.label}</dt>
          <dd className="font-mono text-sm font-semibold tabular-nums text-ink">
            <Counter value={m.value} />
            {m.unit ? (
              <span className="ml-0.5 text-xs font-normal text-muted">{m.unit}</span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
