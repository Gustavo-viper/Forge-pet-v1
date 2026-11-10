import { useState } from "react";
import { cn } from "./ui";

/** Barras horizontais de uma única série (identidade pelo rótulo, magnitude pelo comprimento). */
export function HBarChart({ data, format = (v) => String(v), className }: { data: { label: string; value: number; sub?: string }[]; format?: (v: number) => string; className?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className={cn("space-y-3.5", className)}>
      {data.map((d) => (
        <li key={d.label} className="group" title={`${d.label}: ${format(d.value)}`}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-semibold text-ink-700">{d.label}</span>
            <span className="shrink-0 font-semibold text-ink-900 tabular-nums">{format(d.value)}{d.sub && <span className="ml-1.5 text-xs font-normal text-ink-400">{d.sub}</span>}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-nude-100">
            <div className="h-full rounded-full bg-rose-400 transition-all duration-700 group-hover:bg-rose-500" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Colunas verticais ao longo do tempo, com tooltip por coluna. */
export function ColumnChart({ data, format = (v) => String(v), height = 200 }: { data: { label: string; value: number; full?: string }[]; format?: (v: number) => string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const ticks = [1, 0.5, 0];
  const showEvery = data.length > 16 ? Math.ceil(data.length / 8) : 1;
  return (
    <div className="relative">
      <div className="flex gap-3">
        <div className="flex flex-col justify-between pb-6 text-right text-[10px] text-ink-400 tabular-nums" style={{ height }}>
          {ticks.map((t) => <span key={t}>{format(Math.round(max * t))}</span>)}
        </div>
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: height - 24 }}>
            {ticks.map((t) => <div key={t} className="border-t border-dashed border-nude-200" />)}
          </div>
          <div className="relative flex items-end gap-[2px]" style={{ height: height - 24 }} onMouseLeave={() => setHover(null)}>
            {data.map((d, i) => (
              <div key={i} className="flex h-full flex-1 cursor-default items-end" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}>
                <div className={cn("w-full rounded-t-[4px] transition-all duration-500", hover === i ? "bg-rose-600" : "bg-rose-400")} style={{ height: `${Math.max(d.value ? 2 : 0, (d.value / max) * 100)}%` }} />
              </div>
            ))}
            {hover !== null && (
              <div className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-ink-900 px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg"
                style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}>
                <p className="text-white/60">{data[hover].full ?? data[hover].label}</p>
                <p className="font-bold">{format(data[hover].value)}</p>
              </div>
            )}
          </div>
          <div className="mt-2 flex gap-[2px] text-[10px] text-ink-400">
            {data.map((d, i) => <span key={i} className="flex-1 truncate text-center">{i % showEvery === 0 ? d.label : ""}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
