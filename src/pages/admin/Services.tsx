import { useState, type FormEvent } from "react";
import { Clock, Pencil, Plus, Scissors, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatDuration } from "@/lib/dates";
import { money } from "@/lib/format";
import type { Service } from "@/lib/types";
import { Badge, Button, Card, ConfirmDialog, DemoTag, EmptyState, Field, IconButton, Input, Modal, Photo, Select, Textarea, Toggle } from "@/components/ui";
import { PageHeader } from "@/components/admin-shared";
import { ImageInput } from "@/components/ImageInput";
import { useToast } from "@/components/toast";

export default function Services() {
  const { db, saveService, deleteService } = useStore();
  const toast = useToast();
  const [edit, setEdit] = useState<Service | "new" | null>(null);
  const [del, setDel] = useState<Service | null>(null);
  const usage = (id: string) => db.appointments.filter((a) => a.serviceId === id && a.status !== "cancelado").length;
  return (
    <>
      <PageHeader title="Serviços" text="Cadastre, edite e ative/inative os serviços oferecidos. Os preços atuais são demonstrativos."
        actions={<Button onClick={() => setEdit("new")} icon={<Plus className="size-4" />}>Novo serviço</Button>} />
      {db.services.length === 0 ? <Card><EmptyState icon={<Scissors className="size-6" />} title="Nenhum serviço cadastrado" action={<Button onClick={() => setEdit("new")}>Cadastrar serviço</Button>} /></Card> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {db.services.map((s) => (
            <Card key={s.id} className={s.active ? "overflow-hidden" : "overflow-hidden opacity-70"}>
              <div className="relative">
                <Photo src={s.image} alt={s.name} className="aspect-[16/9] w-full" />
                <div className="absolute top-3 left-3 flex gap-2"><Badge tone={s.active ? "green" : "gray"} className="bg-white/95">{s.active ? "Ativo" : "Inativo"}</Badge></div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="text-[11px] font-bold tracking-[0.2em] text-gold-500 uppercase">{s.category} · {s.audience}</p><p className="font-serif text-2xl font-semibold">{s.name}</p></div>
                  <Toggle checked={s.active} label="Ativo" onChange={(v) => { saveService({ ...s, active: v }); toast(v ? "Serviço ativado — já aparece no site." : "Serviço inativado — oculto no site.", "info"); }} />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-ink-500">{s.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-nude-100 pt-4">
                  <div><p className="font-serif text-2xl font-semibold text-rose-600">{money(s.price)} <DemoTag /></p><p className="flex items-center gap-1 text-xs text-ink-500"><Clock className="size-3.5" /> {formatDuration(s.duration)} · {usage(s.id)} agend.</p></div>
                  <div className="flex gap-1">
                    <IconButton label="Editar" onClick={() => setEdit(s)}><Pencil className="size-4" /></IconButton>
                    <IconButton label="Excluir" onClick={() => setDel(s)} className="hover:text-red-600"><Trash2 className="size-4" /></IconButton>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {edit && <ServiceForm s={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} danger confirmLabel="Excluir" title="Excluir serviço?"
        message={<>O serviço <strong>{del?.name}</strong> será removido do site e dos profissionais. Agendamentos já existentes são mantidos no histórico. Dica: você pode apenas inativá-lo.</>}
        onConfirm={() => { if (del) { deleteService(del.id); toast("Serviço excluído."); } }} />
    </>
  );
}

function ServiceForm({ s, onClose }: { s: Service | null; onClose: () => void }) {
  const { saveService } = useStore();
  const toast = useToast();
  const [f, setF] = useState<Omit<Service, "id">>({
    name: s?.name ?? "", description: s?.description ?? "", price: s?.price ?? 0, duration: s?.duration ?? 60,
    image: s?.image ?? "", category: s?.category ?? "Cabelo", audience: s?.audience ?? "Unissex", active: s?.active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 3) er.name = "Informe o nome do serviço.";
    if (f.description.trim().length < 10) er.description = "Descreva o serviço (mín. 10 caracteres).";
    if (!(f.price > 0)) er.price = "Informe um preço maior que zero.";
    if (!(f.duration >= 15) || f.duration % 15 !== 0) er.duration = "Duração em múltiplos de 15 minutos.";
    setErrors(er);
    if (Object.keys(er).length) return;
    saveService({ ...f, id: s?.id, name: f.name.trim(), description: f.description.trim() });
    toast(s ? "Serviço atualizado." : "Serviço cadastrado.");
    onClose();
  };
  return (
    <Modal open onClose={onClose} size="lg" title={s ? "Editar serviço" : "Novo serviço"}
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" form="svc-form">Salvar serviço</Button></>}>
      <form id="svc-form" onSubmit={save} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome do serviço" error={errors.name} required className="sm:col-span-2"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} invalid={!!errors.name} /></Field>
        <Field label="Descrição" error={errors.description} required className="sm:col-span-2"><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label="Preço (R$)" error={errors.price} required><Input type="number" min={0} step={5} inputMode="decimal" value={f.price || ""} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} invalid={!!errors.price} /></Field>
        <Field label="Duração" error={errors.duration} required>
          <Select value={f.duration} onChange={(e) => setF({ ...f, duration: Number(e.target.value) })}>
            {[15, 30, 45, 60, 75, 90, 105, 120, 150, 180].map((m) => <option key={m} value={m}>{formatDuration(m)}</option>)}
          </Select>
        </Field>
        <Field label="Categoria"><Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Service["category"] })}><option>Cabelo</option><option>Unhas</option><option>Tratamento</option></Select></Field>
        <Field label="Público"><Select value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value as Service["audience"] })}><option>Feminino</option><option>Masculino</option><option>Unissex</option></Select></Field>
        <Field label="Imagem" className="sm:col-span-2"><ImageInput value={f.image} onChange={(image) => setF({ ...f, image })} /></Field>
        <div className="flex items-center justify-between rounded-2xl bg-nude-50 p-4 sm:col-span-2">
          <div><p className="text-sm font-semibold">Serviço ativo</p><p className="text-xs text-ink-500">Serviços inativos não aparecem no site nem no agendamento.</p></div>
          <Toggle checked={f.active} onChange={(active) => setF({ ...f, active })} label="Ativo" />
        </div>
      </form>
    </Modal>
  );
}
