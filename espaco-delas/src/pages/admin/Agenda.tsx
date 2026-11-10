import { useMemo, useState } from "react";
import { Ban, CalendarPlus, ChevronLeft, ChevronRight, Lock, Trash2 } from "lucide-react";
import { useLookups, useStore } from "@/lib/store";
import { addDays, formatDateLong, formatDayMonth, fromMin, startOfWeek, toMin, todayISO, weekday, WEEKDAYS_SHORT } from "@/lib/dates";
import { workingWindow } from "@/lib/availability";
import type { Appointment } from "@/lib/types";
import { Avatar, Button, Card, IconButton, Modal, Select, STATUS_META, cn } from "@/components/ui";
import { AppointmentDetailModal, BlockModal, NewAppointmentModal, PageHeader } from "@/components/admin-shared";
import { useToast } from "@/components/toast";

const ROW = 30; // minutos por linha
const ROW_PX = 52;
const PX = ROW_PX / ROW;

export default function Agenda() {
  const { db, removeBlock } = useStore();
  const { service, client } = useLookups();
  const toast = useToast();
  const [view, setView] = useState<"dia" | "semana">("dia");
  const [date, setDate] = useState(todayISO());
  const [proFilter, setProFilter] = useState("all");
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [creating, setCreating] = useState<{ date?: string; professionalId?: string } | null>(null);
  const [blocking, setBlocking] = useState<{ date?: string; professionalId?: string; start?: string; end?: string } | null>(null);
  const [cellMenu, setCellMenu] = useState<{ date: string; professionalId: string; time: string } | null>(null);

  const pros = db.professionals.filter((p) => p.active && (proFilter === "all" || p.id === proFilter));
  const biz = db.businessHours[weekday(date)];
  const open = biz.enabled ? toMin(biz.start) : 9 * 60;
  const close = biz.enabled ? toMin(biz.end) : 19 * 60;
  const rows = Array.from({ length: Math.ceil((close - open) / ROW) }, (_, i) => open + i * ROW);
  const dayApts = db.appointments.filter((a) => a.date === date && a.status !== "cancelado");
  const dayBlocks = db.blocks.filter((b) => b.date === date);
  const step = view === "dia" ? 1 : 7;
  const weekStart = startOfWeek(date);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const counts = useMemo(() => {
    const list = view === "dia" ? dayApts : db.appointments.filter((a) => a.status !== "cancelado" && a.date >= weekStart && a.date <= addDays(weekStart, 6));
    const f = proFilter === "all" ? list : list.filter((a) => a.professionalId === proFilter);
    return { total: f.length, pend: f.filter((a) => a.status === "pendente").length };
  }, [view, dayApts, db.appointments, weekStart, proFilter]);

  return (
    <>
      <PageHeader title="Agenda" text="Consulte, confirme, cancele, reagende e bloqueie horários."
        actions={<>
          <Button variant="outline" onClick={() => setBlocking({ date })} icon={<Ban className="size-4" />}>Bloquear horário</Button>
          <Button onClick={() => setCreating({ date })} icon={<CalendarPlus className="size-4" />}>Novo agendamento</Button>
        </>} />

      <Card className="mb-5 flex flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-2">
          <IconButton label="Anterior" onClick={() => setDate(addDays(date, -step))} className="ring-1 ring-nude-200"><ChevronLeft className="size-5" /></IconButton>
          <Button variant="secondary" size="sm" onClick={() => setDate(todayISO())}>Hoje</Button>
          <IconButton label="Próximo" onClick={() => setDate(addDays(date, step))} className="ring-1 ring-nude-200"><ChevronRight className="size-5" /></IconButton>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="ml-1 h-10 rounded-xl border border-nude-200 px-3 text-sm" aria-label="Escolher data" />
        </div>
        <p className="font-serif text-xl font-semibold first-letter:uppercase lg:flex-1 lg:text-center">
          {view === "dia" ? formatDateLong(date) : `${formatDayMonth(weekStart)} – ${formatDayMonth(addDays(weekStart, 6))}`}
          <span className="ml-2 font-sans text-xs font-semibold text-ink-400">{counts.total} atend. · {counts.pend} pend.</span>
        </p>
        <div className="flex items-center gap-2">
          <Select value={proFilter} onChange={(e) => setProFilter(e.target.value)} className="h-10 min-w-0 flex-1 text-sm lg:w-52">
            <option value="all">Todos os profissionais</option>
            {db.professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <div className="flex rounded-xl bg-nude-100 p-1">
            {(["dia", "semana"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={cn("h-8 rounded-lg px-3 text-sm font-semibold capitalize transition", view === v ? "bg-white text-rose-600 shadow" : "text-ink-500")}>{v}</button>
            ))}
          </div>
        </div>
      </Card>

      <div className="mb-4 flex flex-wrap gap-4 text-xs text-ink-500">
        {(["pendente", "confirmado", "concluido"] as const).map((s) => <span key={s} className="inline-flex items-center gap-1.5"><span className={cn("size-2.5 rounded-full", STATUS_META[s].dot)} /> {STATUS_META[s].label}</span>)}
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-[repeating-linear-gradient(45deg,#e4cdbd,#e4cdbd_3px,#f8f0ea_3px,#f8f0ea_6px)]" /> Bloqueado / fora do expediente</span>
      </div>

      {view === "dia" ? (
        !biz.enabled ? (
          <Card className="p-10 text-center text-ink-500">O salão está fechado neste dia (ajuste em <strong>Horários de funcionamento</strong>).</Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="scrollbar-thin overflow-x-auto">
              <div className="grid" style={{ gridTemplateColumns: `64px repeat(${pros.length}, minmax(190px, 1fr))` }}>
                <div className="sticky left-0 z-20 border-b border-nude-100 bg-white" />
                {pros.map((p) => {
                  const win = workingWindow(db, p.id, date);
                  return (
                    <div key={p.id} className="flex items-center gap-2.5 border-b border-l border-nude-100 bg-white p-3">
                      <Avatar src={p.photo} name={p.name} className="size-9" />
                      <div className="min-w-0"><p className="truncate text-sm font-semibold">{p.name.split(" ").slice(0, 2).join(" ")}</p><p className="text-[11px] text-ink-400">{win ? `${fromMin(win[0])}–${fromMin(win[1])}` : "Folga"}</p></div>
                    </div>
                  );
                })}
                <div className="sticky left-0 z-10 bg-white">
                  {rows.map((m) => <div key={m} className="border-b border-nude-100 pr-2 text-right text-[11px] text-ink-400" style={{ height: ROW_PX }}><span className="relative top-1">{m % 60 === 0 ? fromMin(m) : ""}</span></div>)}
                </div>
                {pros.map((p) => {
                  const win = workingWindow(db, p.id, date);
                  return (
                    <div key={p.id} className="relative border-l border-nude-100">
                      {rows.map((m) => {
                        const inWin = win && m >= win[0] && m < win[1];
                        return (
                          <button key={m} type="button" disabled={!inWin} onClick={() => setCellMenu({ date, professionalId: p.id, time: fromMin(m) })}
                            aria-label={`${p.name} ${fromMin(m)}`}
                            className={cn("block w-full border-b border-nude-100 transition", m % 60 === 0 && "border-nude-200", inWin ? "hover:bg-rose-50/70" : "cursor-not-allowed bg-[repeating-linear-gradient(45deg,#f8f0ea,#f8f0ea_6px,#fdf9f6_6px,#fdf9f6_12px)]")}
                            style={{ height: ROW_PX }} />
                        );
                      })}
                      {dayBlocks.filter((b) => b.professionalId === "all" || b.professionalId === p.id).map((b) => (
                        <div key={b.id} className="absolute inset-x-1 flex items-start justify-between gap-1 overflow-hidden rounded-xl border border-nude-300 bg-[repeating-linear-gradient(45deg,#e4cdbd55,#e4cdbd55_6px,#f8f0ea_6px,#f8f0ea_12px)] p-2 text-[11px] font-semibold text-ink-500"
                          style={{ top: (toMin(b.start) - open) * PX + 1, height: Math.max(22, (toMin(b.end) - toMin(b.start)) * PX - 2) }}>
                          <span className="flex items-center gap-1 truncate"><Lock className="size-3 shrink-0" /> {b.reason}</span>
                          <button onClick={() => { removeBlock(b.id); toast("Bloqueio removido."); }} aria-label="Remover bloqueio" className="rounded-md p-0.5 hover:bg-white"><Trash2 className="size-3.5" /></button>
                        </div>
                      ))}
                      {dayApts.filter((a) => a.professionalId === p.id).map((a) => (
                        <button key={a.id} onClick={() => setDetail(a)}
                          className={cn("absolute inset-x-1 overflow-hidden rounded-xl border-l-4 p-2 text-left text-xs shadow-sm transition hover:z-10 hover:shadow-soft",
                            a.status === "pendente" && "border-amber-400 bg-amber-50", a.status === "confirmado" && "border-rose-500 bg-rose-50", a.status === "concluido" && "border-sky-400 bg-sky-50")}
                          style={{ top: (toMin(a.time) - open) * PX + 1, height: a.duration * PX - 2 }}>
                          <p className="font-bold text-ink-900">{a.time} · {client[a.clientId]?.name.split(" ")[0]}</p>
                          <p className="truncate text-ink-500">{service[a.serviceId]?.name}</p>
                          {a.changeRequest && <p className="mt-0.5 truncate font-semibold text-amber-700">↻ alteração solicitada</p>}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
            {pros.length === 0 && <p className="p-8 text-center text-ink-500">Nenhum profissional ativo.</p>}
          </Card>
        )
      ) : (
        <div className="scrollbar-thin -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="grid min-w-[980px] grid-cols-7 gap-3">
            {weekDays.map((d) => {
              const list = db.appointments.filter((a) => a.date === d && a.status !== "cancelado" && (proFilter === "all" || a.professionalId === proFilter)).sort((a, b) => a.time.localeCompare(b.time));
              const closed = !db.businessHours[weekday(d)].enabled;
              const blocks = db.blocks.filter((b) => b.date === d && (proFilter === "all" || b.professionalId === "all" || b.professionalId === proFilter));
              return (
                <div key={d} className={cn("flex min-h-[420px] flex-col rounded-3xl border bg-white", d === todayISO() ? "border-rose-300 ring-4 ring-rose-50" : "border-nude-200")}>
                  <button onClick={() => { setDate(d); setView("dia"); }} className="border-b border-nude-100 p-3 text-left hover:bg-rose-50/50">
                    <p className="text-[11px] font-bold tracking-wider text-ink-400 uppercase">{WEEKDAYS_SHORT[weekday(d)]}</p>
                    <p className="font-serif text-2xl font-semibold">{formatDayMonth(d)}</p>
                    <p className="text-[11px] text-ink-400">{closed ? "Fechado" : `${list.length} atendimento(s)`}</p>
                  </button>
                  <div className="flex-1 space-y-2 p-2">
                    {blocks.map((b) => <div key={b.id} className="flex items-center gap-1 rounded-xl bg-nude-100 px-2 py-1.5 text-[11px] text-ink-500"><Lock className="size-3" /> {b.start}–{b.end} {b.reason}</div>)}
                    {list.map((a) => (
                      <button key={a.id} onClick={() => setDetail(a)} className={cn("w-full rounded-xl border-l-4 p-2 text-left text-xs transition hover:shadow-soft",
                        a.status === "pendente" && "border-amber-400 bg-amber-50", a.status === "confirmado" && "border-rose-500 bg-rose-50", a.status === "concluido" && "border-sky-400 bg-sky-50")}>
                        <p className="font-bold">{a.time} · {client[a.clientId]?.name.split(" ")[0]}</p>
                        <p className="truncate text-ink-500">{service[a.serviceId]?.name}</p>
                      </button>
                    ))}
                    {!closed && <button onClick={() => setCreating({ date: d, professionalId: proFilter === "all" ? undefined : proFilter })} className="w-full rounded-xl border border-dashed border-nude-300 py-2 text-xs font-semibold text-ink-400 hover:border-rose-300 hover:text-rose-600 disabled:opacity-40" disabled={d < todayISO()}>+ agendar</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal open={!!cellMenu} onClose={() => setCellMenu(null)} size="sm" title={cellMenu ? `${cellMenu.time} · ${db.professionals.find((p) => p.id === cellMenu.professionalId)?.name.split(" ")[0]}` : ""} subtitle="O que deseja fazer neste horário?">
        <div className="grid gap-3">
          <Button size="lg" disabled={!!cellMenu && cellMenu.date < todayISO()} onClick={() => { setCreating({ date: cellMenu!.date, professionalId: cellMenu!.professionalId }); setCellMenu(null); }} icon={<CalendarPlus className="size-5" />}>Novo agendamento</Button>
          <Button size="lg" variant="outline" onClick={() => { const t = toMin(cellMenu!.time); setBlocking({ date: cellMenu!.date, professionalId: cellMenu!.professionalId, start: cellMenu!.time, end: fromMin(t + 60) }); setCellMenu(null); }} icon={<Ban className="size-5" />}>Bloquear este horário</Button>
        </div>
      </Modal>
      <AppointmentDetailModal appointment={detail} onClose={() => setDetail(null)} />
      <NewAppointmentModal open={!!creating} preset={creating ?? undefined} onClose={() => setCreating(null)} />
      {blocking && <BlockModal open preset={blocking} onClose={() => setBlocking(null)} />}
    </>
  );
}
