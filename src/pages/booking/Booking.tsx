import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, CalendarPlus, Check, CheckCircle2, Clock, LayoutDashboard, Lock, Mail, Phone, Scissors, UserRound, Wallet } from "lucide-react";
import { useLookups, useStore } from "@/lib/store";
import { getSlots } from "@/lib/availability";
import { addDays, formatDateLong, formatDuration, todayISO } from "@/lib/dates";
import { money } from "@/lib/format";
import { downloadICS } from "@/lib/ics";
import type { Appointment } from "@/lib/types";
import { ServiceCard } from "@/components/ServiceCard";
import { Calendar } from "@/components/Calendar";
import { SlotPicker } from "@/components/SlotPicker";
import { Avatar, Badge, Button, ButtonLink, Card, DemoTag, Logo, Photo, StatusBadge, cn } from "@/components/ui";
import { useToast } from "@/components/toast";

const DRAFT_KEY = "espaco-delas:booking-draft";
const STEPS = ["Serviço", "Profissional", "Data", "Horário", "Confirmação"];

interface Draft { step: number; serviceId: string | null; professionalId: string | null; date: string | null; time: string | null }
const empty: Draft = { step: 1, serviceId: null, professionalId: null, date: null, time: null };

function loadDraft(): Draft {
  try { return { ...empty, ...JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "{}") }; } catch { return empty; }
}

export default function Booking() {
  const { db, currentClient, createAppointment } = useStore();
  const { service, pro } = useLookups();
  const toast = useToast();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [d, setD] = useState<Draft>(() => {
    const pre = params.get("servico");
    if (pre) return { ...empty, serviceId: pre, step: 2 };
    return loadDraft();
  });
  const [done, setDone] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (params.get("servico")) setParams({}, { replace: true });
  }, [params, setParams]);
  useEffect(() => { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)); }, [d]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [d.step, done]);

  const svc = d.serviceId ? service[d.serviceId] : undefined;
  const professional = d.professionalId ? pro[d.professionalId] : undefined;
  const services = db.services.filter((s) => s.active);
  const pros = useMemo(() => db.professionals.filter((p) => p.active && !!svc && p.serviceIds.includes(svc.id)), [db.professionals, svc]);
  const maxDate = addDays(todayISO(), db.settings.bookingWindowDays);
  const slots = useMemo(() => (svc && professional && d.date ? getSlots(db, { serviceId: svc.id, professionalId: professional.id, date: d.date }) : []), [db, svc, professional, d.date]);

  // Se o horário escolhido deixou de estar livre (ex.: outro agendamento), limpa a seleção.
  useEffect(() => {
    if (d.time && d.step >= 4 && slots.length && !slots.some((s) => s.time === d.time && s.available)) setD((x) => ({ ...x, time: null, step: Math.min(x.step, 4) }));
  }, [slots, d.time, d.step]);

  const nextAvailable = (proId: string) => {
    if (!svc) return null;
    for (let i = 0; i <= db.settings.bookingWindowDays; i++) {
      const date = addDays(todayISO(), i);
      const first = getSlots(db, { serviceId: svc.id, professionalId: proId, date }).find((s) => s.available);
      if (first) return { date, time: first.time };
    }
    return null;
  };

  const canNext = [!!svc, !!professional, !!d.date, !!d.time, false][d.step - 1];
  const go = (step: number) => setD((x) => ({ ...x, step }));

  const confirm = () => {
    if (!currentClient || !svc || !professional || !d.date || !d.time) return;
    setSaving(true);
    setTimeout(() => {
      const r = createAppointment({ clientId: currentClient.id, serviceId: svc.id, professionalId: professional.id, date: d.date!, time: d.time!, });
      setSaving(false);
      if (!r.ok) {
        toast(r.error, "error");
        setD((x) => ({ ...x, time: null, step: 4 }));
        return;
      }
      sessionStorage.removeItem(DRAFT_KEY);
      setDone(r.data);
    }, 700);
  };

  if (done) return <Success a={done} onNew={() => { setDone(null); setD(empty); }} />;

  return (
    <div className="min-h-dvh bg-nude-50 pb-32">
      <header className="sticky top-0 z-40 border-b border-nude-200/70 bg-nude-50/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/"><Logo /></Link>
          <Link to={currentClient ? "/cliente" : "/"} className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-500 hover:bg-white hover:text-rose-600">{currentClient ? "Meu painel" : "Sair"}</Link>
        </div>
        <Stepper step={d.step} onJump={(s) => s < d.step && go(s)} />
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 pt-8 lg:grid-cols-[1fr_340px]">
        <main key={d.step} className="animate-fade-up">
          {d.step === 1 && (
            <StepHead n={1} title="Escolha o serviço" text="Selecione o cuidado que você deseja. Valores e durações são demonstrativos." >
              <div className="grid gap-5 sm:grid-cols-2">
                {services.map((s) => (
                  <ServiceCard key={s.id} compact service={s} selected={d.serviceId === s.id} actionLabel="Escolher"
                    onBook={() => setD({ ...d, serviceId: s.id, professionalId: d.serviceId === s.id ? d.professionalId : null, date: null, time: null, step: 2 })} />
                ))}
              </div>
            </StepHead>
          )}

          {d.step === 2 && svc && (
            <StepHead n={2} title="Escolha o(a) profissional" text={`Profissionais que realizam ${svc.name.toLowerCase()}.`}>
              {pros.length === 0 ? (
                <Card className="p-8 text-center text-ink-500">Nenhum profissional disponível para este serviço no momento.</Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {pros.map((p) => {
                    const na = nextAvailable(p.id);
                    const sel = d.professionalId === p.id;
                    return (
                      <button key={p.id} type="button" onClick={() => setD({ ...d, professionalId: p.id, date: null, time: null, step: 3 })}
                        className={cn("group flex items-center gap-4 rounded-[28px] border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft", sel ? "border-rose-400 ring-4 ring-rose-100" : "border-nude-200 shadow-card")}>
                        <Photo src={p.photo} alt={p.name} className="size-24 shrink-0 rounded-3xl" />
                        <div className="min-w-0 flex-1">
                          <p className="font-serif text-xl leading-tight font-semibold">{p.name}</p>
                          <p className="text-sm text-gold-600">{p.role}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {p.serviceIds.slice(0, 3).map((id) => service[id] && <Badge key={id} tone="gray" className="normal-case tracking-normal">{service[id]!.name}</Badge>)}
                          </div>
                          <p className="mt-2 text-xs text-ink-500">
                            {na ? <>Próximo horário: <strong className="text-emerald-700">{na.date === todayISO() ? "hoje" : formatDateLong(na.date).split(",")[1]} às {na.time}</strong></> : "Sem horários na janela de agendamento"}
                          </p>
                        </div>
                        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border", sel ? "border-rose-500 bg-rose-500 text-white" : "border-nude-300 text-transparent")}><Check className="size-4" /></span>
                      </button>
                    );
                  })}
                </div>
              )}
            </StepHead>
          )}

          {d.step === 3 && svc && professional && (
            <StepHead n={3} title="Escolha a data" text={`Dias em que ${professional.name.split(" ")[0]} tem horários livres para ${formatDuration(svc.duration)} de atendimento.`}>
              <Card className="p-5 sm:p-8">
                <Calendar value={d.date} maxDate={maxDate} onChange={(date) => setD({ ...d, date, time: null, step: 4 })}
                  isAvailable={(iso) => getSlots(db, { serviceId: svc.id, professionalId: professional.id, date: iso }).some((s) => s.available)} />
              </Card>
            </StepHead>
          )}

          {d.step === 4 && svc && professional && d.date && (
            <StepHead n={4} title="Escolha o horário" text={<span className="inline-block first-letter:uppercase">{formatDateLong(d.date)}</span>}>
              <Card className="p-5 sm:p-8">
                <SlotPicker slots={slots} value={d.time} onChange={(time) => setD({ ...d, time })} />
              </Card>
            </StepHead>
          )}

          {d.step === 5 && svc && professional && d.date && d.time && (
            <StepHead n={5} title="Confirme seu agendamento" text="Revise os detalhes antes de confirmar.">
              <Card className="overflow-hidden">
                <div className="flex items-center gap-4 bg-gradient-to-r from-rose-50 to-nude-100 p-6">
                  <Photo src={svc.image} alt={svc.name} className="size-20 shrink-0 rounded-3xl" />
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.25em] text-gold-500 uppercase">{svc.category}</p>
                    <p className="font-serif text-3xl font-semibold">{svc.name}</p>
                  </div>
                </div>
                <dl className="grid gap-px bg-nude-100 sm:grid-cols-2">
                  {[
                    { icon: UserRound, k: "Profissional", v: professional.name },
                    { icon: CalendarDays, k: "Data", v: formatDateLong(d.date) },
                    { icon: Clock, k: "Horário", v: `${d.time} · ${formatDuration(svc.duration)}` },
                    { icon: Wallet, k: "Valor", v: <>{money(svc.price)} <DemoTag /></> },
                  ].map(({ icon: I, k, v }) => (
                    <div key={k} className="flex gap-3 bg-white p-5">
                      <I className="mt-0.5 size-5 text-rose-400" />
                      <div><dt className="text-xs font-bold tracking-wider text-ink-400 uppercase">{k}</dt><dd className="mt-0.5 font-semibold text-ink-900 first-letter:uppercase">{v}</dd></div>
                    </div>
                  ))}
                </dl>
                <div className="border-t border-nude-100 p-6">
                  <p className="mb-3 text-xs font-bold tracking-wider text-ink-400 uppercase">Seus dados</p>
                  {currentClient ? (
                    <div className="grid gap-2 text-sm sm:grid-cols-3">
                      <span className="inline-flex items-center gap-2"><UserRound className="size-4 text-rose-400" /> {currentClient.name}</span>
                      <span className="inline-flex items-center gap-2"><Phone className="size-4 text-rose-400" /> {currentClient.phone}</span>
                      <span className="inline-flex items-center gap-2 break-all"><Mail className="size-4 text-rose-400" /> {currentClient.email}</span>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-5">
                      <p className="flex items-center gap-2 font-semibold text-ink-900"><Lock className="size-4 text-rose-500" /> Entre na sua conta para confirmar</p>
                      <p className="mt-1 text-sm text-ink-500">Suas escolhas ficam salvas — você volta direto para esta etapa.</p>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <ButtonLink to="/entrar?next=/agendar" variant="primary">Entrar</ButtonLink>
                        <ButtonLink to="/cadastro?next=/agendar" variant="outline">Criar minha conta</ButtonLink>
                      </div>
                    </div>
                  )}
                </div>
                <p className="border-t border-nude-100 bg-nude-50 px-6 py-4 text-xs text-ink-500">
                  Cancelamentos e alterações podem ser solicitados pelo seu painel com até {db.settings.cancelPolicyHours}h de antecedência.
                </p>
              </Card>
              <Button size="lg" className="mt-6 w-full" disabled={!currentClient} loading={saving} onClick={confirm} icon={<CheckCircle2 className="size-5" />}>CONFIRMAR AGENDAMENTO</Button>
            </StepHead>
          )}

          {d.step > 1 && !svc && (
            <Card className="p-8 text-center">
              <p className="text-ink-500">O serviço selecionado não está mais disponível.</p>
              <Button className="mt-4" onClick={() => setD(empty)}>Recomeçar</Button>
            </Card>
          )}
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-40"><Summary d={d} /></div>
        </aside>
      </div>

      {/* Barra de ações fixa (mobile-first) */}
      {d.step < 5 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-nude-200 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
            {d.step > 1 ? (
              <Button variant="ghost" size="lg" onClick={() => go(d.step - 1)} icon={<ArrowLeft className="size-5" />} className="px-4">Voltar</Button>
            ) : (
              <Button variant="ghost" size="lg" onClick={() => nav("/")} icon={<ArrowLeft className="size-5" />} className="px-4">Início</Button>
            )}
            <div className="min-w-0 flex-1 truncate text-sm text-ink-500 lg:hidden">
              {svc && <><strong className="text-ink-900">{svc.name}</strong>{d.time && <> · {d.time}</>}</>}
            </div>
            <div className="hidden flex-1 lg:block" />
            <Button size="lg" disabled={!canNext} onClick={() => go(d.step + 1)} className="px-6">Continuar <ArrowRight className="size-5" /></Button>
          </div>
        </div>
      )}
      {d.step === 5 && (
        <div className="mx-auto max-w-6xl px-5 pt-4">
          <Button variant="ghost" onClick={() => go(4)} icon={<ArrowLeft className="size-4" />}>Alterar horário</Button>
        </div>
      )}
    </div>
  );
}

function Stepper({ step, onJump }: { step: number; onJump: (s: number) => void }) {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-3">
      <ol className="flex items-center gap-1.5 sm:gap-3">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = n < step ? "done" : n === step ? "current" : "todo";
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <button type="button" onClick={() => onJump(n)} disabled={n >= step} className="flex items-center gap-2" aria-current={state === "current" ? "step" : undefined}>
                <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition",
                  state === "done" && "bg-rose-500 text-white", state === "current" && "bg-ink-900 text-white ring-4 ring-rose-100", state === "todo" && "bg-nude-200 text-ink-400")}>
                  {state === "done" ? <Check className="size-4" /> : n}
                </span>
                <span className={cn("hidden text-xs font-semibold md:inline", state === "todo" ? "text-ink-400" : "text-ink-900")}>{label}</span>
              </button>
              {n < STEPS.length && <span className={cn("h-0.5 flex-1 rounded-full", n < step ? "bg-rose-400" : "bg-nude-200")} />}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs font-semibold text-ink-500 md:hidden">Etapa {step} de {STEPS.length} · {STEPS[step - 1]}</p>
    </div>
  );
}

function StepHead({ n, title, text, children }: { n: number; title: string; text?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-[11px] font-bold tracking-[0.3em] text-gold-500 uppercase">Etapa {n}</p>
      <h1 className="mt-1 font-serif text-4xl font-semibold sm:text-5xl">{title}</h1>
      {text && <p className="mt-2 text-ink-500">{text}</p>}
      <div className="mt-7">{children}</div>
    </section>
  );
}

function Summary({ d }: { d: Draft }) {
  const { service, pro } = useLookups();
  const svc = d.serviceId ? service[d.serviceId] : undefined;
  const p = d.professionalId ? pro[d.professionalId] : undefined;
  const rows = [
    { icon: Scissors, k: "Serviço", v: svc?.name },
    { icon: UserRound, k: "Profissional", v: p?.name },
    { icon: CalendarDays, k: "Data", v: d.date ? formatDateLong(d.date) : undefined },
    { icon: Clock, k: "Horário", v: d.time ? `${d.time}${svc ? ` · ${formatDuration(svc.duration)}` : ""}` : undefined },
  ];
  return (
    <Card className="p-6">
      <p className="font-serif text-2xl font-semibold">Seu agendamento</p>
      <ul className="mt-5 space-y-4">
        {rows.map(({ icon: I, k, v }) => (
          <li key={k} className="flex gap-3">
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", v ? "bg-rose-50 text-rose-500" : "bg-nude-100 text-ink-400")}><I className="size-4" /></span>
            <div className="min-w-0"><p className="text-[11px] font-bold tracking-wider text-ink-400 uppercase">{k}</p><p className={cn("text-sm font-semibold first-letter:uppercase", v ? "text-ink-900" : "text-ink-400")}>{v ?? "—"}</p></div>
          </li>
        ))}
      </ul>
      {svc && (
        <div className="mt-6 flex items-end justify-between border-t border-nude-100 pt-5">
          <span className="text-sm text-ink-500">Total <DemoTag /></span>
          <span className="font-serif text-3xl font-semibold text-rose-600">{money(svc.price)}</span>
        </div>
      )}
    </Card>
  );
}

function Success({ a, onNew }: { a: Appointment; onNew: () => void }) {
  const { db, currentClient } = useStore();
  const { service, pro } = useLookups();
  const svc = service[a.serviceId];
  const p = pro[a.professionalId];
  return (
    <div className="bg-grain flex min-h-dvh items-center justify-center bg-nude-50 px-5 py-12">
      <div className="w-full max-w-lg animate-scale-in text-center">
        <div className="relative mx-auto flex size-24 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-rose-200 opacity-40" />
          <span className="relative flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-soft"><Check className="size-12" strokeWidth={2.5} /></span>
        </div>
        <h1 className="mt-8 font-serif text-4xl font-semibold sm:text-5xl">Agendamento realizado com sucesso!</h1>
        <p className="mt-3 text-ink-500">Obrigada{currentClient ? `, ${currentClient.name.split(" ")[0]}` : ""}! Estamos te esperando. {a.status === "pendente" && "O salão confirmará sua reserva em breve."}</p>
        <Card className="mt-8 overflow-hidden text-left">
          <div className="flex items-center gap-4 border-b border-nude-100 p-5">
            <Avatar src={p?.photo} name={p?.name ?? ""} className="size-14" />
            <div className="flex-1"><p className="font-serif text-2xl font-semibold">{svc?.name}</p><p className="text-sm text-ink-500">com {p?.name}</p></div>
            <StatusBadge status={a.status} />
          </div>
          <div className="grid grid-cols-2 gap-4 p-5 text-sm">
            <div><p className="text-xs font-bold tracking-wider text-ink-400 uppercase">Data</p><p className="font-semibold first-letter:uppercase">{formatDateLong(a.date)}</p></div>
            <div><p className="text-xs font-bold tracking-wider text-ink-400 uppercase">Horário</p><p className="font-semibold">{a.time} · {formatDuration(a.duration)}</p></div>
            <div><p className="text-xs font-bold tracking-wider text-ink-400 uppercase">Valor</p><p className="font-semibold">{money(a.price)} <DemoTag /></p></div>
            <div><p className="text-xs font-bold tracking-wider text-ink-400 uppercase">Código</p><p className="font-mono font-semibold uppercase">{a.id.slice(-6)}</p></div>
          </div>
          <p className="bg-nude-50 px-5 py-3 text-xs text-ink-500">{db.settings.address} · {db.settings.city}</p>
        </Card>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ButtonLink to="/cliente" size="lg" icon={<LayoutDashboard className="size-5" />}>Voltar ao meu painel</ButtonLink>
          <Button size="lg" variant="outline" onClick={() => downloadICS(a, svc, p, db.settings)} icon={<CalendarPlus className="size-5" />}>Adicionar à agenda</Button>
        </div>
        <button onClick={onNew} className="mt-4 text-sm font-semibold text-rose-600 hover:underline">Fazer outro agendamento</button>
      </div>
    </div>
  );
}
