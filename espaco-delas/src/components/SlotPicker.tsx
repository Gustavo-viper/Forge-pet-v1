import { Clock, Moon, Sun, Sunset } from "lucide-react";
import type { Slot } from "@/lib/availability";
import { toMin } from "@/lib/dates";
import { cn } from "./ui";

export function SlotPicker({ slots, value, onChange }: { slots: Slot[]; value: string | null; onChange: (t: string) => void }) {
  if (!slots.length)
    return (
      <div className="rounded-2xl border border-dashed border-nude-300 p-8 text-center text-sm text-ink-500">
        <Clock className="mx-auto mb-2 size-6 text-rose-300" /> Nenhum horário de atendimento nesta data.
      </div>
    );
  const groups = [
    { label: "Manhã", icon: Sun, list: slots.filter((s) => toMin(s.time) < 720) },
    { label: "Tarde", icon: Sunset, list: slots.filter((s) => toMin(s.time) >= 720 && toMin(s.time) < 1080) },
    { label: "Noite", icon: Moon, list: slots.filter((s) => toMin(s.time) >= 1080) },
  ].filter((g) => g.list.length);
  const free = slots.filter((s) => s.available).length;
  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-500">
        <strong className="text-ink-900">{free}</strong> {free === 1 ? "horário disponível" : "horários disponíveis"}
        {free < slots.length && <> · horários riscados estão ocupados ou bloqueados</>}
      </p>
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-ink-400 uppercase">
            <g.icon className="size-3.5" /> {g.label}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {g.list.map((s) => (
              <button key={s.time} type="button" disabled={!s.available} onClick={() => onChange(s.time)} aria-pressed={value === s.time}
                title={s.available ? "Disponível" : s.reason === "passado" ? "Horário já passou" : s.reason === "bloqueado" ? "Horário bloqueado" : "Horário ocupado"}
                className={cn(
                  "h-12 rounded-2xl text-[15px] font-semibold transition",
                  value === s.time ? "bg-rose-500 text-white shadow-soft" : s.available ? "border border-rose-200 bg-white text-ink-900 hover:border-rose-400 hover:bg-rose-50" : "cursor-not-allowed bg-nude-100 text-ink-400/60 line-through",
                )}>
                {s.time}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
