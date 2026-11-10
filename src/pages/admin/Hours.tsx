import { useState } from "react";
import { Ban, Lock, Save, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { WEEKDAYS, formatDateShort, toMin, todayISO } from "@/lib/dates";
import type { WorkDay } from "@/lib/types";
import { Button, Card, EmptyState, Field, IconButton, Select, Toggle, cn } from "@/components/ui";
import { BlockModal, PageHeader } from "@/components/admin-shared";
import { useToast } from "@/components/toast";

export default function Hours() {
  const { db, setBusinessHours, saveSettings, removeBlock } = useStore();
  const toast = useToast();
  const [hours, setHours] = useState<WorkDay[]>(db.businessHours.map((d) => ({ ...d })));
  const [interval, setInterval] = useState(db.settings.slotInterval);
  const [windowDays, setWindowDays] = useState(db.settings.bookingWindowDays);
  const [blocking, setBlocking] = useState(false);
  const [err, setErr] = useState("");
  const set = (i: number, patch: Partial<WorkDay>) => setHours(hours.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const blocks = db.blocks.filter((b) => b.date >= todayISO()).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const proName = (id: string) => (id === "all" ? "Todo o salão" : db.professionals.find((p) => p.id === id)?.name ?? "—");

  const save = () => {
    if (hours.some((d) => d.enabled && toMin(d.end) <= toMin(d.start))) return setErr("Verifique os horários: o fechamento deve ser após a abertura.");
    setErr("");
    setBusinessHours(hours);
    saveSettings({ ...db.settings, slotInterval: interval, bookingWindowDays: windowDays });
    toast("Horários salvos. Os horários disponíveis para clientes foram atualizados.");
  };

  return (
    <>
      <PageHeader title="Horários de funcionamento" text="Controle quando o salão atende e quais horários ficam disponíveis para agendamento online."
        actions={<Button onClick={save} icon={<Save className="size-4" />}>Salvar alterações</Button>} />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card className="p-5 sm:p-6">
          <p className="font-serif text-2xl font-semibold">Expediente do salão</p>
          <p className="mb-5 text-xs text-ink-500">Cada profissional ainda pode ter seu próprio horário dentro deste período.</p>
          <div className="space-y-2">
            {hours.map((d, i) => (
              <div key={i} className={cn("flex flex-wrap items-center gap-3 rounded-2xl border p-3 sm:flex-nowrap", d.enabled ? "border-nude-200" : "border-transparent bg-nude-50")}>
                <Toggle checked={d.enabled} onChange={(enabled) => set(i, { enabled })} label={WEEKDAYS[i]} />
                <span className="w-24 font-semibold">{WEEKDAYS[i]}</span>
                {d.enabled ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input type="time" step={900} value={d.start} onChange={(e) => set(i, { start: e.target.value })} className="h-11 min-w-0 flex-1 rounded-xl border border-nude-200 px-3" aria-label={`Abertura ${WEEKDAYS[i]}`} />
                    <span className="text-ink-400">até</span>
                    <input type="time" step={900} value={d.end} onChange={(e) => set(i, { end: e.target.value })} className="h-11 min-w-0 flex-1 rounded-xl border border-nude-200 px-3" aria-label={`Fechamento ${WEEKDAYS[i]}`} />
                  </div>
                ) : <span className="text-sm text-ink-400">Fechado</span>}
              </div>
            ))}
          </div>
          {err && <p className="mt-3 text-sm font-medium text-red-600">{err}</p>}
          <div className="mt-6 grid gap-4 border-t border-nude-100 pt-6 sm:grid-cols-2">
            <Field label="Intervalo entre horários" hint="Ex.: 30 min → 09:00, 09:30, 10:00…">
              <Select value={interval} onChange={(e) => setInterval(Number(e.target.value))}>{[15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutos</option>)}</Select>
            </Field>
            <Field label="Antecedência máxima" hint="Até quantos dias à frente o cliente pode agendar.">
              <Select value={windowDays} onChange={(e) => setWindowDays(Number(e.target.value))}>{[7, 14, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} dias</option>)}</Select>
            </Field>
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div><p className="font-serif text-2xl font-semibold">Bloqueios</p><p className="text-xs text-ink-500">Feriados, cursos, folgas e pausas.</p></div>
            <Button size="sm" variant="outline" onClick={() => setBlocking(true)} icon={<Ban className="size-4" />}>Bloquear</Button>
          </div>
          {blocks.length === 0 ? <EmptyState icon={<Lock className="size-6" />} title="Nenhum bloqueio futuro" /> : (
            <ul className="space-y-2">
              {blocks.map((b) => (
                <li key={b.id} className="flex items-center gap-3 rounded-2xl border border-nude-200 p-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-nude-100 text-ink-500"><Lock className="size-4" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{b.reason}</p><p className="text-xs text-ink-500">{formatDateShort(b.date)} · {b.start}–{b.end} · {proName(b.professionalId)}</p></div>
                  <IconButton label="Remover bloqueio" onClick={() => { removeBlock(b.id); toast("Bloqueio removido; horários liberados."); }} className="hover:text-red-600"><Trash2 className="size-4" /></IconButton>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      {blocking && <BlockModal open onClose={() => setBlocking(false)} />}
    </>
  );
}
