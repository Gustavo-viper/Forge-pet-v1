import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTHS, WEEKDAYS_SHORT, parseISODate, toISODate, todayISO } from "@/lib/dates";
import { cn } from "./ui";

interface Props {
  value: string | null;
  onChange: (iso: string) => void;
  isAvailable: (iso: string) => boolean;
  minDate?: string;
  maxDate?: string;
}

export function Calendar({ value, onChange, isAvailable, minDate = todayISO(), maxDate }: Props) {
  const initial = value ? parseISODate(value) : parseISODate(minDate);
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const today = todayISO();

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const out: (string | null)[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= days; d++) out.push(toISODate(new Date(cursor.getFullYear(), cursor.getMonth(), d)));
    while (out.length % 7) out.push(null);
    return out;
  }, [cursor]);

  const minMonth = parseISODate(minDate);
  const canPrev = cursor > new Date(minMonth.getFullYear(), minMonth.getMonth(), 1);
  const maxMonth = maxDate ? parseISODate(maxDate) : null;
  const canNext = !maxMonth || cursor < new Date(maxMonth.getFullYear(), maxMonth.getMonth(), 1);

  return (
    <div className="select-none">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" aria-label="Mês anterior" disabled={!canPrev} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="flex size-11 items-center justify-center rounded-2xl border border-nude-200 text-ink-700 transition hover:bg-rose-50 disabled:opacity-30">
          <ChevronLeft className="size-5" />
        </button>
        <p className="font-serif text-2xl font-semibold">
          {MONTHS[cursor.getMonth()]} <span className="text-ink-400">{cursor.getFullYear()}</span>
        </p>
        <button type="button" aria-label="Próximo mês" disabled={!canNext} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="flex size-11 items-center justify-center rounded-2xl border border-nude-200 text-ink-700 transition hover:bg-rose-50 disabled:opacity-30">
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold tracking-wider text-ink-400 uppercase">
        {WEEKDAYS_SHORT.map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {cells.map((iso, i) => {
          if (!iso) return <div key={i} />;
          const out = iso < minDate || (maxDate && iso > maxDate);
          const avail = !out && isAvailable(iso);
          const selected = iso === value;
          return (
            <button key={iso} type="button" disabled={!avail} onClick={() => onChange(iso)} aria-pressed={selected}
              aria-label={`${parseISODate(iso).getDate()} de ${MONTHS[parseISODate(iso).getMonth()]}${avail ? "" : " (indisponível)"}`}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-2xl text-[15px] font-semibold transition",
                selected ? "bg-rose-500 text-white shadow-soft" : avail ? "bg-rose-50/60 text-ink-900 hover:bg-rose-100" : "text-ink-400/50 line-through decoration-ink-400/30",
              )}>
              {parseISODate(iso).getDate()}
              {iso === today && !selected && <span className="absolute bottom-1.5 size-1 rounded-full bg-gold-500" />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded bg-rose-100" /> Disponível</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded bg-rose-500" /> Selecionado</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-gold-500" /> Hoje</span>
      </div>
    </div>
  );
}
