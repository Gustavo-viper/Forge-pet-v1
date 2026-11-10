import { useMemo, useState } from "react";
import { CalendarX2, CheckCheck, CircleDollarSign, Download, Receipt } from "lucide-react";
import { useLookups, useStore } from "@/lib/store";
import { addDays, formatDateShort, formatDayMonth, todayISO } from "@/lib/dates";
import { money } from "@/lib/format";
import { Card, DemoTag, cn, Button } from "@/components/ui";
import { KPI, PageHeader } from "@/components/admin-shared";
import { ColumnChart, HBarChart } from "@/components/charts";
import { downloadCSV } from "@/lib/csv";

export default function Reports() {
  const { db } = useStore();
  const { service, pro } = useLookups();
  const [days, setDays] = useState(30);
  const today = todayISO();
  const from = addDays(today, -(days - 1));

  const r = useMemo(() => {
    const inRange = db.appointments.filter((a) => a.date >= from && a.date <= today);
    const done = inRange.filter((a) => a.status === "concluido");
    const canceled = inRange.filter((a) => a.status === "cancelado");
    const revenue = done.reduce((s, a) => s + a.price, 0);
    const group = (key: (a: (typeof done)[number]) => string, name: (k: string) => string) => {
      const m = new Map<string, { n: number; v: number }>();
      done.forEach((a) => { const k = key(a); const x = m.get(k) ?? { n: 0, v: 0 }; x.n++; x.v += a.price; m.set(k, x); });
      return [...m.entries()].map(([k, x]) => ({ label: name(k), value: x.v, n: x.n })).sort((a, b) => b.value - a.value);
    };
    const bySvc = group((a) => a.serviceId, (k) => service[k]?.name ?? "Removido");
    const byPro = group((a) => a.professionalId, (k) => pro[k]?.name ?? "Removido");
    const series = Array.from({ length: days }, (_, i) => addDays(from, i)).map((d) => ({ label: formatDayMonth(d).split(" ")[0], full: formatDayMonth(d), value: done.filter((a) => a.date === d).reduce((s, a) => s + a.price, 0) }));
    const hours = new Map<string, number>();
    inRange.filter((a) => a.status !== "cancelado").forEach((a) => { const h = a.time.slice(0, 2) + "h"; hours.set(h, (hours.get(h) ?? 0) + 1); });
    const byHour = [...hours.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([label, value]) => ({ label, value }));
    return { inRange, done, canceled, revenue, bySvc, byPro, series, byHour, ticket: done.length ? revenue / done.length : 0 };
  }, [db.appointments, from, today, days, service, pro]);

  const exportCsv = () => downloadCSV(`relatorio-${days}d.csv`, [
    ["Relatório Espaço Delas (valores demonstrativos)", `${formatDateShort(from)} a ${formatDateShort(today)}`],
    [],
    ["Serviço", "Atendimentos", "Faturamento"], ...r.bySvc.map((x) => [x.label, x.n, x.value.toFixed(2).replace(".", ",")]),
    [],
    ["Profissional", "Atendimentos", "Faturamento"], ...r.byPro.map((x) => [x.label, x.n, x.value.toFixed(2).replace(".", ",")]),
  ]);

  return (
    <>
      <PageHeader title="Relatórios" text={`Período: ${formatDateShort(from)} a ${formatDateShort(today)} · todos os valores são demonstrativos.`}
        actions={<>
          <div className="flex rounded-2xl bg-white p-1 ring-1 ring-nude-200">
            {[7, 30, 90].map((d) => <button key={d} onClick={() => setDays(d)} className={cn("h-9 rounded-xl px-4 text-sm font-semibold transition", days === d ? "bg-rose-500 text-white" : "text-ink-500 hover:text-ink-900")}>{d} dias</button>)}
          </div>
          <Button variant="outline" onClick={exportCsv} icon={<Download className="size-4" />}>Exportar</Button>
        </>} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KPI label="Faturamento" value={money(r.revenue)} icon={CircleDollarSign} tone="gold" demo />
        <KPI label="Atendimentos realizados" value={r.done.length} icon={CheckCheck} />
        <KPI label="Ticket médio" value={money(r.ticket)} icon={Receipt} tone="ink" demo />
        <KPI label="Cancelamentos" value={r.canceled.length} icon={CalendarX2} hint={r.inRange.length ? `${Math.round((r.canceled.length / r.inRange.length) * 100)}% dos agendamentos` : undefined} />
      </div>
      <Card className="mt-6 p-5 sm:p-6">
        <div className="mb-6 flex items-center justify-between"><div><p className="font-serif text-2xl font-semibold">Faturamento diário</p><p className="text-xs text-ink-500">Passe o mouse (ou toque) nas colunas para ver os valores.</p></div><DemoTag /></div>
        <ColumnChart data={r.series} format={(v) => money(v).replace(",00", "")} height={240} />
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <p className="mb-5 font-serif text-2xl font-semibold">Faturamento por serviço</p>
          <HBarChart data={r.bySvc.map((x) => ({ ...x, sub: `${x.n} atend.` }))} format={money} />
        </Card>
        <Card className="p-5 sm:p-6">
          <p className="mb-5 font-serif text-2xl font-semibold">Faturamento por profissional</p>
          <HBarChart data={r.byPro.map((x) => ({ ...x, sub: `${x.n} atend.` }))} format={money} />
        </Card>
      </div>
      <Card className="mt-6 p-5 sm:p-6">
        <p className="font-serif text-2xl font-semibold">Horários de maior movimento</p>
        <p className="mb-6 text-xs text-ink-500">Agendamentos por hora de início (exceto cancelados).</p>
        <ColumnChart data={r.byHour} format={(v) => `${v}`} height={180} />
      </Card>
      <Card className="mt-6 overflow-hidden">
        <p className="p-5 font-serif text-2xl font-semibold sm:p-6">Tabela de serviços</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-nude-50 text-left text-[11px] font-bold tracking-wider text-ink-400 uppercase"><tr><th className="px-6 py-3">Serviço</th><th className="px-3 py-3 text-right">Atendimentos</th><th className="px-3 py-3 text-right">Faturamento</th><th className="px-6 py-3 text-right">Participação</th></tr></thead>
            <tbody className="divide-y divide-nude-100">
              {r.bySvc.map((x) => <tr key={x.label}><td className="px-6 py-3 font-semibold">{x.label}</td><td className="px-3 py-3 text-right tabular-nums">{x.n}</td><td className="px-3 py-3 text-right tabular-nums">{money(x.value)}</td><td className="px-6 py-3 text-right tabular-nums">{r.revenue ? Math.round((x.value / r.revenue) * 100) : 0}%</td></tr>)}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
