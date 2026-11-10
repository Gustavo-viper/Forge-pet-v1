import { Clock, Sparkles } from "lucide-react";
import type { Service } from "@/lib/types";
import { formatDuration } from "@/lib/dates";
import { money } from "@/lib/format";
import { Badge, Button, DemoTag, Photo, cn } from "./ui";

export function ServiceCard({ service, onBook, selected, compact, actionLabel = "Agendar" }: { service: Service; onBook: () => void; selected?: boolean; compact?: boolean; actionLabel?: string }) {
  return (
    <article className={cn("group flex flex-col overflow-hidden rounded-[28px] border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-soft",
      selected ? "border-rose-400 ring-4 ring-rose-100" : "border-nude-200/80 shadow-card")}>
      <div className="relative">
        <Photo src={service.image} alt={service.name} className={cn("w-full", compact ? "aspect-[16/9]" : "aspect-[4/3]")} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge tone="gold" className="bg-white/90 backdrop-blur">{service.audience}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-[11px] font-bold tracking-[0.25em] text-gold-500 uppercase">{service.category}</p>
        <h3 className="mt-1.5 font-serif text-[26px] leading-tight font-semibold text-ink-900">{service.name}</h3>
        <p className={cn("mt-2 flex-1 text-sm leading-relaxed text-ink-500", compact && "line-clamp-2")}>{service.description}</p>
        <div className="mt-5 flex items-end justify-between gap-3 border-t border-nude-100 pt-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-3xl font-semibold text-rose-600">{money(service.price)}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-ink-500">
              <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {formatDuration(service.duration)}</span>
              <DemoTag />
            </div>
          </div>
          <Button onClick={onBook} variant={selected ? "primary" : "secondary"} icon={<Sparkles className="size-4" />}>{selected ? "Selecionado" : actionLabel}</Button>
        </div>
      </div>
    </article>
  );
}
