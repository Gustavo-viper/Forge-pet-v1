import { useMemo, useState, type ReactNode } from "react";
import { Ban, CalendarClock, Check, CheckCheck, Clock, Mail, Phone, X } from "lucide-react";
import type { Appointment, Block } from "@/lib/types";
import { useLookups, useStore } from "@/lib/store";
import { getSlots } from "@/lib/availability";
import { addDays, formatDateLong, formatDuration, fromMin, toMin, todayISO } from "@/lib/dates";
import { money } from "@/lib/format";
import { Avatar, Button, Card, ConfirmDialog, DemoTag, Field, Input, Modal, Photo, Select, StatusBadge, cn } from "./ui";
import { Calendar } from "./Calendar";
import { SlotPicker } from "./SlotPicker";
import { RescheduleModal } from "./RescheduleModal";
import { useToast } from "./toast";

export function PageHeader({ title, text, actions }: { title: string; text?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">{title}</h1>
        {text && <p className="mt-1 text-sm text-ink-500">{text}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function KPI({ label, value, icon: I, hint, tone = "rose", demo }: { label: string; value: ReactNode; icon: typeof Clock; hint?: ReactNode; tone?: "rose" | "gold" | "ink"; demo?: boolean }) {
  const tones = { rose: "bg-rose-50 text-rose-500", gold: "bg-[#fbf4e4] text-gold-500", ink: "bg-nude-100 text-ink-700" };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className={cn("flex size-11 items-center justify-center rounded-2xl", tones[tone])}><I className="size-5" strokeWidth={1.8} /></span>
        {demo && <DemoTag />}
      </div>
      <p className="mt-4 font-serif text-[34px] leading-none font-semibold tabular-nums">{value}</p>
      <p className="mt-1.5 text-sm font-semibold text-ink-700">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-400">{hint}</p>}
    </Card>
  );
}

/** Ações administrativas de um agendamento: confirmar, concluir, cancelar, reagendar. */
export function AppointmentActions({ a, compact, onDone }: { a: Appointment; compact?: boolean; onDone?: () => void }) {
  const { setAppointmentStatus, dismissChangeRequest } = useStore();
  const toast = useToast();
  const [cancel, setCancel] = useState(false);
  const [resched, setResched] = useState(false);
  const active = a.status === "pendente" || a.status === "confirmado";
  const size = compact ? "sm" : "md";
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {a.status === "pendente" && <Button size={size} onClick={() => { setAppointmentStatus(a.id, "confirmado"); toast("Reserva confirmada."); onDone?.(); }} icon={<Check className="size-4" />}>Confirmar</Button>}
        {a.status === "confirmado" && <Button size={size} variant="secondary" onClick={() => { setAppointmentStatus(a.id, "concluido"); toast("Atendimento marcado como concluído."); onDone?.(); }} icon={<CheckCheck className="size-4" />}>Concluir</Button>}
        {(active || a.status === "cancelado") && <Button size={size} variant="outline" onClick={() => setResched(true)} icon={<CalendarClock className="size-4" />}>Reagendar</Button>}
        {active && <Button size={size} variant="danger" onClick={() => setCancel(true)} icon={<X className="size-4" />}>Cancelar</Button>}
        {a.changeRequest && <Button size={size} variant="ghost" onClick={() => { dismissChangeRequest(a.id); toast("Solicitação recusada; horário mantido.", "info"); }}>Manter horário</Button>}
      </div>
      <ConfirmDialog open={cancel} onClose={() => setCancel(false)} danger title="Cancelar reserva?" confirmLabel="Cancelar reserva"
        message="O horário será liberado imediatamente na agenda e ficará disponível para novos agendamentos."
        onConfirm={() => { setAppointmentStatus(a.id, "cancelado"); toast("Reserva cancelada e horário liberado."); onDone?.(); }} />
      {resched && <RescheduleModal appointment={a} onClose={() => { setResched(false); onDone?.(); }} />}
    </>
  );
}

export function AppointmentDetailModal({ appointment, onClose }: { appointment: Appointment | null; onClose: () => void }) {
  const { db } = useStore();
  const { service, pro, client } = useLookups();
  const a = appointment ? db.appointments.find((x) => x.id === appointment.id) ?? null : null;
  if (!a) return null;
  const svc = service[a.serviceId];
  const p = pro[a.professionalId];
  const c = client[a.clientId];
  return (
    <Modal open onClose={onClose} size="lg" title={svc?.name ?? "Agendamento"} subtitle={`Código ${a.id.slice(-6).toUpperCase()}`}>
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={a.status} />
        <span className="text-sm text-ink-500 first-letter:uppercase">{formatDateLong(a.date)} · {a.time}–{fromMin(toMin(a.time) + a.duration)}</span>
      </div>
      {a.changeRequest && <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800"><strong>Cliente solicitou alteração:</strong> “{a.changeRequest.note}”</div>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Card className="p-4 shadow-none">
          <p className="mb-3 text-xs font-bold tracking-wider text-ink-400 uppercase">Cliente</p>
          <div className="flex items-center gap-3"><Avatar name={c?.name ?? "?"} /><p className="font-semibold">{c?.name ?? "Cliente removido"}</p></div>
          {c && <div className="mt-3 space-y-1.5 text-sm text-ink-500"><p className="flex items-center gap-2"><Phone className="size-4" /> {c.phone}</p><p className="flex items-center gap-2 break-all"><Mail className="size-4" /> {c.email}</p></div>}
        </Card>
        <Card className="p-4 shadow-none">
          <p className="mb-3 text-xs font-bold tracking-wider text-ink-400 uppercase">Atendimento</p>
          <div className="flex items-center gap-3"><Avatar src={p?.photo} name={p?.name ?? "?"} /><div><p className="font-semibold">{p?.name}</p><p className="text-xs text-ink-500">{p?.role}</p></div></div>
          <div className="mt-3 space-y-1.5 text-sm text-ink-500">
            <p className="flex items-center gap-2"><Clock className="size-4" /> {formatDuration(a.duration)}</p>
            <p className="flex items-center gap-2">{money(a.price)} <DemoTag /></p>
          </div>
        </Card>
      </div>
      {!!a.history?.length && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-bold tracking-wider text-ink-400 uppercase">Histórico</p>
          <ol className="space-y-2 border-l-2 border-rose-100 pl-4 text-sm">
            {a.history.map((h, i) => <li key={i}><span className="text-ink-700">{h.text}</span> <span className="text-xs text-ink-400">· {new Date(h.at).toLocaleString("pt-BR")}</span></li>)}
          </ol>
        </div>
      )}
      <div className="mt-6 border-t border-nude-100 pt-5"><AppointmentActions a={a} /></div>
    </Modal>
  );
}

/** Admin cria um agendamento para um cliente (ex.: atendimento por telefone/WhatsApp). */
export function NewAppointmentModal({ open, onClose, preset }: { open: boolean; onClose: () => void; preset?: { date?: string; professionalId?: string } }) {
  if (!open) return null;
  return <NewAppointmentInner onClose={onClose} preset={preset} />;
}
function NewAppointmentInner({ onClose, preset }: { onClose: () => void; preset?: { date?: string; professionalId?: string } }) {
  const { db, createAppointment } = useStore();
  const toast = useToast();
  const services = db.services.filter((s) => s.active);
  const [clientId, setClientId] = useState(db.clients[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const pros = db.professionals.filter((p) => p.active && p.serviceIds.includes(serviceId));
  const [proId, setProId] = useState(preset?.professionalId ?? "");
  const effectivePro = pros.some((p) => p.id === proId) ? proId : pros[0]?.id ?? "";
  const [date, setDate] = useState<string | null>(preset?.date && preset.date >= todayISO() ? preset.date : null);
  const [time, setTime] = useState<string | null>(null);
  const slots = useMemo(() => (date && effectivePro ? getSlots(db, { serviceId, professionalId: effectivePro, date }) : []), [db, serviceId, effectivePro, date]);
  const save = () => {
    if (!date || !time || !clientId) return;
    const r = createAppointment({ clientId, serviceId, professionalId: effectivePro, date, time, status: "confirmado" });
    if (!r.ok) return toast(r.error, "error");
    toast("Agendamento criado e adicionado à agenda.");
    onClose();
  };
  return (
    <Modal open onClose={onClose} size="xl" title="Novo agendamento" subtitle="Registre um atendimento feito por telefone, WhatsApp ou balcão."
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button disabled={!date || !time || !clientId} onClick={save}>Criar agendamento</Button></>}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Cliente" required><Select value={clientId} onChange={(e) => setClientId(e.target.value)}>{db.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Serviço" required><Select value={serviceId} onChange={(e) => { setServiceId(e.target.value); setTime(null); }}>{services.map((s) => <option key={s.id} value={s.id}>{s.name} · {formatDuration(s.duration)}</option>)}</Select></Field>
        <Field label="Profissional" required><Select value={effectivePro} onChange={(e) => { setProId(e.target.value); setTime(null); }}>{pros.length ? pros.map((p) => <option key={p.id} value={p.id}>{p.name}</option>) : <option value="">Nenhum profissional</option>}</Select></Field>
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <Calendar value={date} maxDate={addDays(todayISO(), db.settings.bookingWindowDays)} onChange={(d) => { setDate(d); setTime(null); }}
          isAvailable={(d) => !!effectivePro && getSlots(db, { serviceId, professionalId: effectivePro, date: d }).some((s) => s.available)} />
        <div>{date ? <SlotPicker slots={slots} value={time} onChange={setTime} /> : <p className="rounded-2xl bg-nude-100 p-6 text-center text-sm text-ink-500">Selecione uma data.</p>}</div>
      </div>
    </Modal>
  );
}

export function BlockModal({ open, onClose, preset }: { open: boolean; onClose: () => void; preset?: Partial<Block> }) {
  const { db, addBlock } = useStore();
  const toast = useToast();
  const [f, setF] = useState({ professionalId: preset?.professionalId ?? "all", date: preset?.date ?? todayISO(), start: preset?.start ?? "12:00", end: preset?.end ?? "13:00", reason: "" });
  const [err, setErr] = useState("");
  if (!open) return null;
  const conflicts = db.appointments.filter((a) => a.status !== "cancelado" && a.date === f.date && (f.professionalId === "all" || a.professionalId === f.professionalId) && toMin(a.time) < toMin(f.end) && toMin(a.time) + a.duration > toMin(f.start));
  const save = () => {
    if (!f.date || !f.start || !f.end) return setErr("Preencha data e horários.");
    if (toMin(f.end) <= toMin(f.start)) return setErr("O horário final deve ser maior que o inicial.");
    addBlock({ ...f, reason: f.reason.trim() || "Horário bloqueado" });
    toast("Horário bloqueado. Ele não aparecerá mais como disponível.");
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="Bloquear horário" subtitle="Impede novos agendamentos no período escolhido."
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={save} icon={<Ban className="size-4" />}>Bloquear</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Profissional" className="sm:col-span-2"><Select value={f.professionalId} onChange={(e) => setF({ ...f, professionalId: e.target.value })}><option value="all">Todo o salão</option>{db.professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
        <Field label="Data" required className="sm:col-span-2"><Input type="date" min={todayISO()} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Início" required><Input type="time" step={900} value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></Field>
        <Field label="Fim" required><Input type="time" step={900} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></Field>
        <Field label="Motivo" className="sm:col-span-2"><Input placeholder="Ex.: reunião, curso, almoço" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
      </div>
      {err && <p className="mt-3 text-sm font-medium text-red-600">{err}</p>}
      {conflicts.length > 0 && <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-800">Atenção: existem {conflicts.length} agendamento(s) neste período. Eles serão mantidos — reagende-os se necessário.</p>}
    </Modal>
  );
}

export function ServiceThumb({ id }: { id: string }) {
  const { service } = useLookups();
  const s = service[id];
  return <Photo src={s?.image} alt={s?.name ?? ""} className="size-10 shrink-0 rounded-xl" />;
}

