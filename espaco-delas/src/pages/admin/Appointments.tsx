import { useMemo, useState } from "react";
import { CalendarPlus, ClipboardList, Download, Search } from "lucide-react";
import { useLookups, useStore } from "@/lib/store";
import { addDays, compareDateTime, formatDateShort, todayISO } from "@/lib/dates";
import { money } from "@/lib/format";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { Avatar, Button, Card, EmptyState, Input, Select, StatusBadge, STATUS_META, cn } from "@/components/ui";
import { AppointmentActions, AppointmentDetailModal, NewAppointmentModal, PageHeader, ServiceThumb } from "@/components/admin-shared";
import { downloadCSV } from "@/lib/csv";

type Period = "futuros" | "hoje" | "7d" | "passados" | "todos";

export default function Appointments() {
  const { db } = useStore();
  const { service, pro, client } = useLookups();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<AppointmentStatus | "all" | "acao">("all");
  const [proId, setProId] = useState("all");
  const [period, setPeriod] = useState<Period>("futuros");
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [creating, setCreating] = useState(false);
  const today = todayISO();

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return db.appointments
      .filter((a) => {
        if (status === "acao") { if (!(a.status === "pendente" || a.changeRequest)) return false; }
        else if (status !== "all" && a.status !== status) return false;
        if (proId !== "all" && a.professionalId !== proId) return false;
        if (period === "futuros" && a.date < today) return false;
        if (period === "hoje" && a.date !== today) return false;
        if (period === "7d" && (a.date < today || a.date > addDays(today, 7))) return false;
        if (period === "passados" && a.date >= today) return false;
        if (term) {
          const hay = `${client[a.clientId]?.name} ${client[a.clientId]?.phone} ${service[a.serviceId]?.name}`.toLowerCase();
          if (!hay.includes(term)) return false;
        }
        return true;
      })
      .sort((a, b) => (period === "passados" || period === "todos" ? compareDateTime(b, a) : compareDateTime(a, b)));
  }, [db.appointments, q, status, proId, period, today, client, service]);

  const exportCsv = () => downloadCSV("agendamentos.csv", [
    ["Data", "Hora", "Cliente", "Telefone", "Serviço", "Profissional", "Valor (demo)", "Status"],
    ...list.map((a) => [formatDateShort(a.date), a.time, client[a.clientId]?.name ?? "", client[a.clientId]?.phone ?? "", service[a.serviceId]?.name ?? "", pro[a.professionalId]?.name ?? "", a.price.toFixed(2).replace(".", ","), STATUS_META[a.status].label]),
  ]);

  const actionCount = db.appointments.filter((a) => a.status === "pendente" || a.changeRequest).length;

  return (
    <>
      <PageHeader title="Agendamentos" text={`${list.length} resultado(s) com os filtros atuais.`}
        actions={<><Button variant="outline" onClick={exportCsv} icon={<Download className="size-4" />}>Exportar CSV</Button><Button onClick={() => setCreating(true)} icon={<CalendarPlus className="size-4" />}>Novo agendamento</Button></>} />

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {([["futuros", "Próximos"], ["hoje", "Hoje"], ["7d", "Próximos 7 dias"], ["passados", "Anteriores"], ["todos", "Todos"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setPeriod(k)} className={cn("h-10 shrink-0 rounded-xl px-4 text-sm font-semibold transition", period === k ? "bg-ink-900 text-white" : "bg-white text-ink-500 ring-1 ring-nude-200 hover:text-ink-900")}>{l}</button>
        ))}
      </div>
      <Card className="mb-5 grid gap-3 p-3 sm:grid-cols-[1fr_200px_220px] sm:p-4">
        <Input placeholder="Buscar por cliente, telefone ou serviço" value={q} onChange={(e) => setQ(e.target.value)} leading={<Search className="size-4" />} className="h-11" />
        <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="h-11">
          <option value="all">Todos os status</option>
          <option value="acao">Aguardando ação ({actionCount})</option>
          {(Object.keys(STATUS_META) as AppointmentStatus[]).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </Select>
        <Select value={proId} onChange={(e) => setProId(e.target.value)} className="h-11">
          <option value="all">Todos os profissionais</option>
          {db.professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </Card>

      {list.length === 0 ? <Card><EmptyState icon={<ClipboardList className="size-6" />} title="Nenhum agendamento encontrado" text="Ajuste os filtros para ver outros resultados." /></Card> : (
        <>
          {/* Tabela (desktop) */}
          <Card className="hidden overflow-hidden lg:block">
            <table className="w-full text-sm">
              <thead className="bg-nude-50 text-left text-[11px] font-bold tracking-wider text-ink-400 uppercase">
                <tr><th className="px-5 py-3">Data</th><th className="px-3 py-3">Cliente</th><th className="px-3 py-3">Serviço</th><th className="px-3 py-3">Profissional</th><th className="px-3 py-3">Valor</th><th className="px-3 py-3">Status</th><th className="px-5 py-3 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-nude-100">
                {list.slice(0, 200).map((a) => (
                  <tr key={a.id} className="transition hover:bg-rose-50/40">
                    <td className="px-5 py-3"><button onClick={() => setDetail(a)} className="text-left"><p className="font-semibold">{formatDateShort(a.date)}</p><p className="text-xs text-ink-400">{a.time}</p></button></td>
                    <td className="px-3 py-3"><button onClick={() => setDetail(a)} className="flex items-center gap-2 text-left"><Avatar name={client[a.clientId]?.name ?? "?"} className="size-8 text-[11px]" /><span><span className="block font-semibold">{client[a.clientId]?.name}</span><span className="text-xs text-ink-400">{client[a.clientId]?.phone}</span></span></button></td>
                    <td className="px-3 py-3"><div className="flex items-center gap-2"><ServiceThumb id={a.serviceId} /><span>{service[a.serviceId]?.name}</span></div></td>
                    <td className="px-3 py-3 text-ink-700">{pro[a.professionalId]?.name}</td>
                    <td className="px-3 py-3 tabular-nums">{money(a.price)}</td>
                    <td className="px-3 py-3"><StatusBadge status={a.status} />{a.changeRequest && <p className="mt-1 text-[11px] font-semibold text-amber-700">↻ alteração solicitada</p>}</td>
                    <td className="px-5 py-3"><div className="flex justify-end"><AppointmentActions a={a} compact /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          {/* Cards (mobile) */}
          <div className="grid gap-3 lg:hidden">
            {list.slice(0, 100).map((a) => (
              <Card key={a.id} className="p-4">
                <button onClick={() => setDetail(a)} className="flex w-full items-start gap-3 text-left">
                  <ServiceThumb id={a.serviceId} />
                  <div className="min-w-0 flex-1"><p className="font-semibold">{client[a.clientId]?.name}</p><p className="text-xs text-ink-500">{service[a.serviceId]?.name} · {pro[a.professionalId]?.name.split(" ")[0]}</p><p className="text-xs text-ink-500">{formatDateShort(a.date)} às {a.time} · {money(a.price)}</p></div>
                  <StatusBadge status={a.status} />
                </button>
                <div className="mt-3"><AppointmentActions a={a} compact /></div>
              </Card>
            ))}
          </div>
        </>
      )}
      <AppointmentDetailModal appointment={detail} onClose={() => setDetail(null)} />
      <NewAppointmentModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
