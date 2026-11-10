import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarClock, CalendarDays, CalendarPlus, CalendarX2, Clock, History, LogOut, Mail, MapPin, Phone, Save, Sparkles, UserRound } from "lucide-react";
import { useLookups, useStore } from "@/lib/store";
import { compareDateTime, formatDateLong, formatDateShort, formatDuration, isPast, parseISODate, MONTHS, toMin, nowMinutes, todayISO } from "@/lib/dates";
import { firstName, isEmail, isPhone, maskPhone, money } from "@/lib/format";
import type { Appointment } from "@/lib/types";
import { Avatar, Button, ButtonLink, Card, ConfirmDialog, DemoTag, EmptyState, Field, Input, Logo, Modal, Photo, StatusBadge, Textarea, cn } from "@/components/ui";
import { useToast } from "@/components/toast";
import { ForgeSignature } from "@/layouts/PublicLayout";

type Tab = "agendamentos" | "historico" | "dados";

export default function ClientDashboard() {
  const { db, currentClient, logout } = useStore();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("agendamentos");
  if (!currentClient) return null;

  const mine = db.appointments.filter((a) => a.clientId === currentClient.id);
  const upcoming = mine.filter((a) => !isPast(a.date, a.time) && (a.status === "pendente" || a.status === "confirmado")).sort(compareDateTime);
  const history = mine.filter((a) => !upcoming.includes(a)).sort((a, b) => compareDateTime(b, a));
  const next = upcoming[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const spent = mine.filter((a) => a.status === "concluido").reduce((s, a) => s + a.price, 0);

  return (
    <div className="min-h-dvh bg-nude-50">
      <header className="sticky top-0 z-40 border-b border-nude-200/70 bg-nude-50/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-2">
            <ButtonLink to="/agendar" size="sm" className="hidden sm:inline-flex" icon={<CalendarPlus className="size-4" />}>Novo agendamento</ButtonLink>
            <Button size="sm" variant="ghost" onClick={() => { logout(); nav("/"); }} icon={<LogOut className="size-4" />}>Sair</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
        {/* Saudação */}
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="flex items-center gap-4">
            <Avatar name={currentClient.name} className="size-16 text-xl" />
            <div>
              <p className="text-sm text-ink-500">{greet},</p>
              <h1 className="font-serif text-4xl font-semibold sm:text-5xl">{firstName(currentClient.name)} <Sparkles className="inline size-7 text-gold-400" /></h1>
            </div>
          </div>
          <ButtonLink to="/agendar" size="lg" icon={<CalendarPlus className="size-5" />}>Novo agendamento</ButtonLink>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Próximos" value={upcoming.length} icon={CalendarClock} />
          <Stat label="Atendimentos realizados" value={mine.filter((a) => a.status === "concluido").length} icon={History} />
          <Stat label="Investido em você" value={money(spent)} icon={Sparkles} demo />
        </div>

        {/* Próximo agendamento */}
        <h2 className="mt-10 mb-4 font-serif text-2xl font-semibold">Próximo agendamento</h2>
        {next ? <NextCard a={next} /> : (
          <Card><EmptyState icon={<CalendarDays className="size-6" />} title="Nenhum horário marcado" text="Que tal reservar um momento só seu?" action={<ButtonLink to="/agendar" icon={<CalendarPlus className="size-4" />}>Agendar agora</ButtonLink>} /></Card>
        )}

        {/* Abas */}
        <div className="no-scrollbar mt-12 flex gap-2 overflow-x-auto border-b border-nude-200">
          {([["agendamentos", "Próximos", CalendarClock], ["historico", "Histórico", History], ["dados", "Meus dados", UserRound]] as const).map(([k, label, I]) => (
            <button key={k} onClick={() => setTab(k)} className={cn("-mb-px inline-flex h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition", tab === k ? "border-rose-500 text-rose-600" : "border-transparent text-ink-500 hover:text-ink-900")}>
              <I className="size-4" /> {label}
            </button>
          ))}
        </div>
        <div className="mt-6 animate-fade-in" key={tab}>
          {tab === "agendamentos" && (upcoming.length ? <div className="grid gap-3">{upcoming.map((a) => <AptRow key={a.id} a={a} actions />)}</div> : <Card><EmptyState icon={<CalendarClock className="size-6" />} title="Sem agendamentos futuros" /></Card>)}
          {tab === "historico" && (history.length ? <div className="grid gap-3">{history.map((a) => <AptRow key={a.id} a={a} />)}</div> : <Card><EmptyState icon={<History className="size-6" />} title="Seu histórico aparecerá aqui" /></Card>)}
          {tab === "dados" && <Profile />}
        </div>
      </div>
      <footer className="border-t border-nude-200 py-6 text-center"><ForgeSignature dark /></footer>
    </div>
  );
}

function Stat({ label, value, icon: I, demo }: { label: string; value: React.ReactNode; icon: typeof Clock; demo?: boolean }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500"><I className="size-6" strokeWidth={1.6} /></span>
      <div><p className="font-serif text-3xl font-semibold">{value}</p><p className="text-xs text-ink-500">{label} {demo && <DemoTag />}</p></div>
    </Card>
  );
}

function canChange(a: Appointment, hours: number) {
  const diffDays = (parseISODate(a.date).getTime() - parseISODate(todayISO()).getTime()) / 86400000;
  const minutes = diffDays * 1440 + toMin(a.time) - nowMinutes();
  return minutes >= hours * 60;
}

function NextCard({ a }: { a: Appointment }) {
  const { service, pro } = useLookups();
  const svc = service[a.serviceId];
  const p = pro[a.professionalId];
  const { db } = useStore();
  const d = parseISODate(a.date);
  return (
    <Card className="overflow-hidden">
      <div className="grid sm:grid-cols-[200px_1fr]">
        <div className="relative">
          <Photo src={svc?.image} alt={svc?.name ?? ""} className="h-40 w-full sm:h-full" />
          <div className="absolute top-4 left-4 rounded-2xl bg-white/95 px-4 py-2 text-center shadow-soft backdrop-blur">
            <p className="font-serif text-3xl leading-none font-semibold text-rose-600">{d.getDate()}</p>
            <p className="text-[10px] font-bold tracking-wider text-ink-500 uppercase">{MONTHS[d.getMonth()].slice(0, 3)}</p>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-serif text-3xl font-semibold">{svc?.name}</p>
            <StatusBadge status={a.status} />
          </div>
          <div className="mt-4 grid gap-3 text-sm text-ink-700 sm:grid-cols-2">
            <span className="inline-flex items-center gap-2 first-letter:uppercase"><CalendarDays className="size-4 text-rose-400" /> <span className="first-letter:uppercase">{formatDateLong(a.date)}</span></span>
            <span className="inline-flex items-center gap-2"><Clock className="size-4 text-rose-400" /> {a.time} · {formatDuration(a.duration)}</span>
            <span className="inline-flex items-center gap-2"><Avatar src={p?.photo} name={p?.name ?? ""} className="size-6 text-[9px]" /> {p?.name}</span>
            <span className="inline-flex items-center gap-2"><MapPin className="size-4 text-rose-400" /> {db.settings.address}</span>
          </div>
          {a.changeRequest && <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">Alteração solicitada — aguardando o salão: “{a.changeRequest.note}”</p>}
          <div className="mt-5"><AptActions a={a} /></div>
        </div>
      </div>
    </Card>
  );
}

function AptActions({ a }: { a: Appointment }) {
  const { db, setAppointmentStatus, requestChange } = useStore();
  const toast = useToast();
  const [cancel, setCancel] = useState(false);
  const [change, setChange] = useState(false);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const allowed = canChange(a, db.settings.cancelPolicyHours);
  const submitChange = (e: FormEvent) => {
    e.preventDefault();
    if (note.trim().length < 5) return setErr("Descreva brevemente o novo dia/horário desejado.");
    requestChange(a.id, note.trim());
    toast("Solicitação enviada! O salão vai entrar em contato para confirmar o novo horário.");
    setChange(false);
    setNote("");
  };
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={!allowed || !!a.changeRequest} onClick={() => setChange(true)} icon={<CalendarClock className="size-4" />}>Solicitar alteração</Button>
        <Button size="sm" variant="danger" disabled={!allowed} onClick={() => setCancel(true)} icon={<CalendarX2 className="size-4" />}>Cancelar</Button>
      </div>
      {!allowed && <p className="mt-2 text-xs text-ink-400">Alterações online até {db.settings.cancelPolicyHours}h antes. Fale com o salão: {db.settings.whatsapp}.</p>}
      <ConfirmDialog open={cancel} onClose={() => setCancel(false)} danger confirmLabel="Sim, cancelar" title="Cancelar agendamento?"
        message={<>O horário de <strong>{formatDateShort(a.date)} às {a.time}</strong> será liberado na agenda do salão.</>}
        onConfirm={() => { setAppointmentStatus(a.id, "cancelado"); toast("Agendamento cancelado. O horário foi liberado na agenda."); }} />
      <Modal open={change} onClose={() => setChange(false)} title="Solicitar alteração" subtitle={`Atual: ${formatDateShort(a.date)} às ${a.time}`}
        footer={<><Button variant="ghost" onClick={() => setChange(false)}>Voltar</Button><Button type="submit" form="change-form">Enviar solicitação</Button></>}>
        <form id="change-form" onSubmit={submitChange}>
          <Field label="Qual dia e horário você prefere?" error={err} required hint="Ex.: sexta-feira à tarde, após as 15h.">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Conte para nós sua preferência" />
          </Field>
          <p className="mt-4 text-xs text-ink-500">Seu horário atual permanece reservado até o salão confirmar a alteração.</p>
        </form>
      </Modal>
    </>
  );
}

function AptRow({ a, actions }: { a: Appointment; actions?: boolean }) {
  const { service, pro } = useLookups();
  const svc = service[a.serviceId];
  const p = pro[a.professionalId];
  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="flex flex-1 items-center gap-4">
        <Photo src={svc?.image} alt={svc?.name ?? ""} className="size-16 shrink-0 rounded-2xl" />
        <div className="min-w-0">
          <p className="font-semibold text-ink-900">{svc?.name ?? "Serviço removido"}</p>
          <p className="text-sm text-ink-500">{formatDateShort(a.date)} às {a.time} · {p?.name ?? "—"}</p>
          <p className="text-xs text-ink-400">{money(a.price)} · {formatDuration(a.duration)}</p>
        </div>
      </div>
      <div className="flex flex-col items-start gap-3 sm:items-end">
        <StatusBadge status={a.status} />
        {actions && <AptActions a={a} />}
      </div>
    </Card>
  );
}

function Profile() {
  const { currentClient, updateClient } = useStore();
  const toast = useToast();
  const c = currentClient!;
  const [f, setF] = useState({ name: c.name, phone: c.phone, email: c.email, password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = useMemo(() => f.name !== c.name || f.phone !== c.phone || f.email !== c.email || !!f.password, [f, c]);
  const save = (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 3) er.name = "Informe seu nome completo.";
    if (!isPhone(f.phone)) er.phone = "Telefone inválido.";
    if (!isEmail(f.email)) er.email = "E-mail inválido.";
    if (f.password && f.password.length < 6) er.password = "Mínimo de 6 caracteres.";
    setErrors(er);
    if (Object.keys(er).length) return;
    const r = updateClient(c.id, { name: f.name.trim(), phone: f.phone, email: f.email.trim().toLowerCase(), ...(f.password ? { password: f.password } : {}) });
    if (!r.ok) return setErrors({ email: r.error });
    setF((x) => ({ ...x, password: "" }));
    toast("Dados atualizados com sucesso.");
  };
  return (
    <Card className="p-6 sm:p-8">
      <form onSubmit={save} noValidate className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome completo" error={errors.name} required><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} leading={<UserRound className="size-4" />} invalid={!!errors.name} /></Field>
        <Field label="Telefone" error={errors.phone} required><Input value={f.phone} onChange={(e) => setF({ ...f, phone: maskPhone(e.target.value) })} leading={<Phone className="size-4" />} invalid={!!errors.phone} /></Field>
        <Field label="E-mail" error={errors.email} required><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} leading={<Mail className="size-4" />} invalid={!!errors.email} /></Field>
        <Field label="Nova senha" error={errors.password} hint="Deixe em branco para manter a atual."><Input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="••••••" invalid={!!errors.password} /></Field>
        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-400">Cliente desde {formatDateShort(c.createdAt.slice(0, 10))}</p>
          <Button type="submit" disabled={!dirty} icon={<Save className="size-4" />}>Salvar alterações</Button>
        </div>
      </form>
    </Card>
  );
}
