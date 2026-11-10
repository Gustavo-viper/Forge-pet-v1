import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { useStore } from "@/lib/store";
import { WEEKDAYS, WEEKDAYS_SHORT, toMin, todayISO } from "@/lib/dates";
import type { Professional, WorkDay } from "@/lib/types";
import { Avatar, Badge, Button, Card, ConfirmDialog, EmptyState, Field, IconButton, Input, Modal, Textarea, Toggle, cn } from "@/components/ui";
import { PageHeader } from "@/components/admin-shared";
import { ImageInput } from "@/components/ImageInput";
import { useToast } from "@/components/toast";

export default function Professionals() {
  const { db, saveProfessional, deleteProfessional } = useStore();
  const toast = useToast();
  const [edit, setEdit] = useState<Professional | "new" | null>(null);
  const [del, setDel] = useState<Professional | null>(null);
  const svcName = (id: string) => db.services.find((s) => s.id === id)?.name;
  return (
    <>
      <PageHeader title="Profissionais" text="Equipe, especialidades, agendas individuais e disponibilidade." actions={<Button onClick={() => setEdit("new")} icon={<Plus className="size-4" />}>Cadastrar profissional</Button>} />
      {db.professionals.length === 0 ? <Card><EmptyState icon={<UserRound className="size-6" />} title="Nenhum profissional" /></Card> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {db.professionals.map((p) => {
            const upcoming = db.appointments.filter((a) => a.professionalId === p.id && a.date >= todayISO() && a.status !== "cancelado").length;
            return (
              <Card key={p.id} className={cn("p-5", !p.active && "opacity-70")}>
                <div className="flex items-start gap-4">
                  <Avatar src={p.photo} name={p.name} className="size-16 text-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-2xl leading-tight font-semibold">{p.name}</p>
                    <p className="text-sm text-gold-600">{p.role}</p>
                    <Badge tone={p.active ? "green" : "gray"} className="mt-2">{p.active ? "Disponível" : "Indisponível"}</Badge>
                  </div>
                  <Toggle checked={p.active} label="Disponível" onChange={(v) => { saveProfessional({ ...p, active: v }); toast(v ? `${p.name.split(" ")[0]} disponível para agendamentos.` : `${p.name.split(" ")[0]} indisponível para novos agendamentos.`, "info"); }} />
                </div>
                <p className="mt-4 text-xs font-bold tracking-wider text-ink-400 uppercase">Especialidades</p>
                <div className="mt-2 flex flex-wrap gap-1.5">{p.serviceIds.map((id) => svcName(id) && <Badge key={id} tone="rose" className="normal-case tracking-normal">{svcName(id)}</Badge>)}{!p.serviceIds.length && <span className="text-xs text-ink-400">Nenhuma</span>}</div>
                <p className="mt-4 text-xs font-bold tracking-wider text-ink-400 uppercase">Horários de trabalho</p>
                <div className="mt-2 grid grid-cols-7 gap-1 text-center">
                  {p.schedule.map((d, i) => (
                    <div key={i} className={cn("rounded-lg py-1.5 text-[10px] font-semibold", d.enabled ? "bg-rose-50 text-rose-700" : "bg-nude-100 text-ink-400")} title={d.enabled ? `${WEEKDAYS[i]}: ${d.start}–${d.end}` : `${WEEKDAYS[i]}: folga`}>
                      {WEEKDAYS_SHORT[i]}<br /><span className="font-normal">{d.enabled ? d.start.slice(0, 2) + "–" + d.end.slice(0, 2) : "—"}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-nude-100 pt-4">
                  <p className="text-xs text-ink-500"><strong className="text-ink-900">{upcoming}</strong> agendamento(s) futuros</p>
                  <div className="flex gap-1">
                    <IconButton label="Editar" onClick={() => setEdit(p)}><Pencil className="size-4" /></IconButton>
                    <IconButton label="Excluir" onClick={() => setDel(p)} className="hover:text-red-600"><Trash2 className="size-4" /></IconButton>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {edit && <ProForm p={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} danger confirmLabel="Excluir" title="Excluir profissional?"
        message={<>Remover <strong>{del?.name}</strong> da equipe? Os agendamentos existentes permanecem no histórico. Dica: você pode apenas marcá-lo(a) como indisponível.</>}
        onConfirm={() => { if (del) { deleteProfessional(del.id); toast("Profissional removido."); } }} />
    </>
  );
}

const defaultSchedule = (): WorkDay[] => [0, 1, 2, 3, 4, 5, 6].map((d) => ({ enabled: d !== 0, start: "09:00", end: d === 6 ? "15:00" : "18:00" }));

function ProForm({ p, onClose }: { p: Professional | null; onClose: () => void }) {
  const { db, saveProfessional } = useStore();
  const toast = useToast();
  const [f, setF] = useState<Omit<Professional, "id">>({
    name: p?.name ?? "", role: p?.role ?? "", photo: p?.photo ?? "", bio: p?.bio ?? "",
    serviceIds: p?.serviceIds ?? [], schedule: p?.schedule.map((d) => ({ ...d })) ?? defaultSchedule(), active: p?.active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const setDay = (i: number, patch: Partial<WorkDay>) => setF({ ...f, schedule: f.schedule.map((d, j) => (j === i ? { ...d, ...patch } : d)) });
  const toggleSvc = (id: string) => setF({ ...f, serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter((x) => x !== id) : [...f.serviceIds, id] });
  const save = (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 3) er.name = "Informe o nome.";
    if (f.role.trim().length < 3) er.role = "Informe a função/cargo.";
    if (!f.serviceIds.length) er.services = "Selecione ao menos uma especialidade.";
    if (f.schedule.some((d) => d.enabled && toMin(d.end) <= toMin(d.start))) er.schedule = "Em algum dia o horário final é anterior ao inicial.";
    setErrors(er);
    if (Object.keys(er).length) return;
    saveProfessional({ ...f, id: p?.id, name: f.name.trim(), role: f.role.trim() });
    toast(p ? "Profissional atualizado. A agenda já reflete as mudanças." : "Profissional cadastrado.");
    onClose();
  };
  return (
    <Modal open onClose={onClose} size="xl" title={p ? "Editar profissional" : "Cadastrar profissional"}
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" form="pro-form">Salvar</Button></>}>
      <form id="pro-form" onSubmit={save} noValidate className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Field label="Foto"><ImageInput round value={f.photo} onChange={(photo) => setF({ ...f, photo })} /></Field>
          <Field label="Nome completo" error={errors.name} required><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} invalid={!!errors.name} /></Field>
          <Field label="Função / especialidade principal" error={errors.role} required><Input placeholder="Ex.: Hair stylist" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} invalid={!!errors.role} /></Field>
          <Field label="Mini bio"><Textarea value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></Field>
          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink-700">Serviços que realiza <span className="text-rose-500">*</span></p>
            <div className="flex flex-wrap gap-2">
              {db.services.map((s) => (
                <button key={s.id} type="button" onClick={() => toggleSvc(s.id)} aria-pressed={f.serviceIds.includes(s.id)}
                  className={cn("h-9 rounded-xl px-3 text-sm font-semibold ring-1 transition", f.serviceIds.includes(s.id) ? "bg-rose-500 text-white ring-rose-500" : "bg-white text-ink-700 ring-nude-200 hover:ring-rose-300")}>{s.name}</button>
              ))}
            </div>
            {errors.services && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.services}</p>}
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-nude-50 p-4">
            <div><p className="text-sm font-semibold">Disponível para agendamentos</p><p className="text-xs text-ink-500">Desative em férias ou afastamentos.</p></div>
            <Toggle checked={f.active} onChange={(active) => setF({ ...f, active })} label="Disponível" />
          </div>
        </div>
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink-700">Horários de trabalho</p>
          <p className="mb-3 text-xs text-ink-500">A disponibilidade final respeita também o horário de funcionamento do salão.</p>
          <div className="space-y-2">
            {f.schedule.map((d, i) => (
              <div key={i} className={cn("flex items-center gap-3 rounded-2xl border p-3", d.enabled ? "border-nude-200 bg-white" : "border-transparent bg-nude-50")}>
                <Toggle checked={d.enabled} onChange={(enabled) => setDay(i, { enabled })} label={WEEKDAYS[i]} />
                <span className="w-16 text-sm font-semibold">{WEEKDAYS[i].slice(0, 3)}</span>
                {d.enabled ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input type="time" step={900} value={d.start} onChange={(e) => setDay(i, { start: e.target.value })} className="h-10 min-w-0 flex-1 rounded-xl border border-nude-200 px-2 text-sm" aria-label={`Início ${WEEKDAYS[i]}`} />
                    <span className="text-ink-400">–</span>
                    <input type="time" step={900} value={d.end} onChange={(e) => setDay(i, { end: e.target.value })} className="h-10 min-w-0 flex-1 rounded-xl border border-nude-200 px-2 text-sm" aria-label={`Fim ${WEEKDAYS[i]}`} />
                  </div>
                ) : <span className="text-sm text-ink-400">Folga</span>}
              </div>
            ))}
          </div>
          {errors.schedule && <p className="mt-2 text-xs font-medium text-red-600">{errors.schedule}</p>}
        </div>
      </form>
    </Modal>
  );
}
