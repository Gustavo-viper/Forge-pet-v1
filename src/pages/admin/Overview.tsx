import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, CalendarCheck2, CalendarClock, CalendarPlus, CheckCheck, CircleDollarSign, Users } from "lucide-react";
import { useLookups, useStore } from "@/lib/store";
import { addDays, compareDateTime, formatDateShort, formatDayMonth, fromMin, toMin, todayISO, WEEKDAYS_SHORT, weekday } from "@/lib/dates";
import { money } from "@/lib/format";
import type { Appointment } from "@/lib/types";
import { Avatar, Button, ButtonLink, Card, DemoTag, EmptyState, StatusBadge } from "@/components/ui";
import { AppointmentActions, AppointmentDetailModal, KPI, NewAppointmentModal, PageHeader, ServiceThumb } from "@/components/admin-shared";
import { ColumnChart, HBarChart } from "@/components/charts";

export default function Overview() {
  const { db } = useStore();
  const { service, pro, client } = useLookups();
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [creating, setCreating] = useState(false);
  const today = todayISO();
  const apts = db.appointments;

  const stats = useMemo(() => {
    const todays = apts.filter((a) => a.date === today && a.status !== "cancelado").sort(compareDateTime);
    const future = apts.filter((a) => a.date > today && (a.status === "pendente" || a.status === "confirmado"));
    const done = apts.filter((a) => a.status === "concluido");
    const monthKey = today.slice(0, 7);
    const monthRevenue = done.filter((a) => a.date.startsWith(monthKey)).reduce((s, a) => s + a.price, 0);
    const pending = apts.filter((a) => (a.status === "pendente" || a.changeRequest) && a.date >= today).sort(compareDateTime);
    const bySvc = new Map<string, number>();
    apts.filter((a) => a.status !== "cancelado").forEach((a) => bySvc.set(a.serviceId, (bySvc.get(a.serviceId) ?? 0) + 1));
    const top = [...bySvc.entries()].map(([id, n]) => ({ label: service[id]?.name ?? "Removido", value: n })).sort((a, b) => b.value - a.value).slice(0, 6);
    const last14 = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13)).map((d) => ({
      label: `${WEEKDAYS_SHORT[weekday(d)]}`,
      full: formatDayMonth(d),
      value: done.filter((a) => a.date === d).reduce((s, a) => s + a.price, 0),
    }));
    return { todays, future, done, monthRevenue, pending, top, last14 };
  }, [apts, today, service]);

  return (
    <>
      <PageHeader title="Olá, equipe Espaço Delas" text="Resumo do salão em tempo real (dados demonstrativos)."
        actions={<><Button variant="outline" onClick={() => setCreating(true)} icon={<CalendarPlus className="size-4" />}>Novo agendamento</Button><ButtonLink to="/admin/agenda" icon={<CalendarClock className="size-4" />}>Abrir agenda</ButtonLink></>} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <KPI label="Agendamentos de hoje" value={stats.todays.length} icon={CalendarCheck2} hint={`${stats.todays.filter((a) => a.status === "pendente").length} pendente(s)`} />
        <KPI label="Agendamentos futuros" value={stats.future.length} icon={CalendarClock} hint="Próximos dias" tone="gold" />
        <KPI label="Clientes cadastrados" value={db.clients.length} icon={Users} tone="ink" hint={`${db.clients.filter((c) => c.createdAt.slice(0, 7) === today.slice(0, 7)).length} neste mês`} />
        <KPI label="Atendimentos realizados" value={stats.done.length} icon={CheckCheck} hint="Total histórico" />
        <div className="col-span-2 xl:col-span-1"><KPI label="Faturamento do mês" value={money(stats.monthRevenue)} icon={CircleDollarSign} tone="gold" demo hint="Atendimentos concluídos" /></div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div><p className="font-serif text-2xl font-semibold">Agenda de hoje</p><p className="text-xs text-ink-500">{formatDateShort(today)} · clique para ver detalhes</p></div>
            <Link to="/admin/agenda" className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:underline">Ver agenda <ArrowRight className="size-4" /></Link>
          </div>
          {stats.todays.length === 0 ? <EmptyState icon={<CalendarCheck2 className="size-6" />} title="Nenhum atendimento hoje" /> : (
            <ul className="divide-y divide-nude-100">
              {stats.todays.map((a) => (
                <li key={a.id}>
                  <button onClick={() => setDetail(a)} className="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition hover:bg-rose-50/60 sm:gap-4">
                    <div className="w-14 shrink-0 text-center"><p className="font-serif text-xl font-semibold">{a.time}</p><p className="text-[10px] text-ink-400">{fromMin(toMin(a.time) + a.duration)}</p></div>
                    <ServiceThumb id={a.serviceId} />
                    <div className="min-w-0 flex-1"><p className="truncate font-semibold">{client[a.clientId]?.name}</p><p className="truncate text-xs text-ink-500">{service[a.serviceId]?.name} · {pro[a.professionalId]?.name.split(" ")[0]}</p></div>
                    <StatusBadge status={a.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2"><AlertCircle className="size-5 text-gold-500" /><p className="font-serif text-2xl font-semibold">Aguardando ação</p></div>
          {stats.pending.length === 0 ? <EmptyState icon={<CheckCheck className="size-6" />} title="Tudo em dia!" text="Nenhuma reserva pendente ou pedido de alteração." /> : (
            <ul className="scrollbar-thin max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {stats.pending.slice(0, 8).map((a) => (
                <li key={a.id} className="rounded-2xl border border-nude-200 p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={client[a.clientId]?.name ?? "?"} className="size-9 text-xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{client[a.clientId]?.name}</p>
                      <p className="text-xs text-ink-500">{service[a.serviceId]?.name} · {formatDateShort(a.date)} {a.time}</p>
                      {a.changeRequest && <p className="mt-1.5 rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-800">Pedido de alteração: “{a.changeRequest.note}”</p>}
                    </div>
                  </div>
                  <div className="mt-3"><AppointmentActions a={a} compact /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex items-center justify-between"><div><p className="font-serif text-2xl font-semibold">Faturamento — últimos 14 dias</p><p className="text-xs text-ink-500">Atendimentos concluídos por dia</p></div><DemoTag /></div>
          <ColumnChart data={stats.last14} format={(v) => money(v).replace(",00", "")} height={220} />
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex items-center justify-between"><div><p className="font-serif text-2xl font-semibold">Serviços mais procurados</p><p className="text-xs text-ink-500">Número de agendamentos (exceto cancelados)</p></div><Link to="/admin/relatorios" className="text-sm font-semibold text-rose-600 hover:underline">Relatórios</Link></div>
          <HBarChart data={stats.top} format={(v) => `${v}`} />
        </Card>
      </div>

      <AppointmentDetailModal appointment={detail} onClose={() => setDetail(null)} />
      <NewAppointmentModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
