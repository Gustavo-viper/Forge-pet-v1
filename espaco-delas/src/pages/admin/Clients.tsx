import { useMemo, useState, type FormEvent } from "react";
import { Mail, Pencil, Phone, Search, Trash2, UserPlus, Users } from "lucide-react";
import { useLookups, useStore } from "@/lib/store";
import { compareDateTime, formatDateShort } from "@/lib/dates";
import { isEmail, isPhone, maskPhone, money } from "@/lib/format";
import type { Appointment, Client } from "@/lib/types";
import { Avatar, Button, Card, ConfirmDialog, EmptyState, Field, IconButton, Input, Modal, Select, StatusBadge } from "@/components/ui";
import { AppointmentDetailModal, PageHeader, ServiceThumb } from "@/components/admin-shared";
import { useToast } from "@/components/toast";

export default function Clients() {
  const { db, deleteClient } = useStore();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"nome" | "recentes" | "atendimentos">("nome");
  const [view, setView] = useState<Client | null>(null);
  const [edit, setEdit] = useState<Client | "new" | null>(null);
  const [del, setDel] = useState<Client | null>(null);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return db.clients
      .map((c) => {
        const apts = db.appointments.filter((a) => a.clientId === c.id);
        const done = apts.filter((a) => a.status === "concluido");
        const last = [...done].sort((a, b) => compareDateTime(b, a))[0];
        return { c, total: apts.length, done: done.length, spent: done.reduce((s, a) => s + a.price, 0), last };
      })
      .filter(({ c }) => !t || `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(t))
      .sort((a, b) => (sort === "nome" ? a.c.name.localeCompare(b.c.name) : sort === "recentes" ? b.c.createdAt.localeCompare(a.c.createdAt) : b.done - a.done));
  }, [db, q, sort]);

  return (
    <>
      <PageHeader title="Clientes" text={`${db.clients.length} clientes cadastrados.`} actions={<Button onClick={() => setEdit("new")} icon={<UserPlus className="size-4" />}>Cadastrar cliente</Button>} />
      <Card className="mb-5 grid gap-3 p-3 sm:grid-cols-[1fr_220px] sm:p-4">
        <Input placeholder="Buscar por nome, e-mail ou telefone" value={q} onChange={(e) => setQ(e.target.value)} leading={<Search className="size-4" />} className="h-11" />
        <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-11"><option value="nome">Ordenar por nome</option><option value="recentes">Cadastro mais recente</option><option value="atendimentos">Mais atendimentos</option></Select>
      </Card>
      {rows.length === 0 ? <Card><EmptyState icon={<Users className="size-6" />} title="Nenhum cliente encontrado" /></Card> : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-nude-50 text-left text-[11px] font-bold tracking-wider text-ink-400 uppercase">
                <tr><th className="px-5 py-3">Nome</th><th className="px-3 py-3">Telefone</th><th className="px-3 py-3">E-mail</th><th className="px-3 py-3">Cadastro</th><th className="px-3 py-3">Agendamentos</th><th className="px-3 py-3">Último atend.</th><th className="px-5 py-3 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-nude-100">
                {rows.map(({ c, total, done, last }) => (
                  <tr key={c.id} className="hover:bg-rose-50/40">
                    <td className="px-5 py-3"><button onClick={() => setView(c)} className="flex items-center gap-3 text-left font-semibold hover:text-rose-600"><Avatar name={c.name} className="size-9 text-xs" /> {c.name}</button></td>
                    <td className="px-3 py-3 text-ink-700">{c.phone}</td>
                    <td className="px-3 py-3 text-ink-700">{c.email}</td>
                    <td className="px-3 py-3 text-ink-500">{formatDateShort(c.createdAt.slice(0, 10))}</td>
                    <td className="px-3 py-3"><span className="font-semibold">{total}</span> <span className="text-xs text-ink-400">({done} concluídos)</span></td>
                    <td className="px-3 py-3 text-ink-500">{last ? formatDateShort(last.date) : "—"}</td>
                    <td className="px-5 py-3"><div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setView(c)}>Histórico</Button>
                      <IconButton label="Editar" onClick={() => setEdit(c)}><Pencil className="size-4" /></IconButton>
                      <IconButton label="Excluir" onClick={() => setDel(c)} className="hover:text-red-600"><Trash2 className="size-4" /></IconButton>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {view && <ClientHistory c={view} onClose={() => setView(null)} />}
      {edit && <ClientForm c={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} danger confirmLabel="Excluir cliente" title="Excluir cliente?"
        message={<>Os dados de <strong>{del?.name}</strong> e seus agendamentos serão removidos desta demonstração.</>}
        onConfirm={() => { if (del) { deleteClient(del.id); toast("Cliente excluído."); } }} />
    </>
  );
}

function ClientHistory({ c, onClose }: { c: Client; onClose: () => void }) {
  const { db } = useStore();
  const { service, pro } = useLookups();
  const [detail, setDetail] = useState<Appointment | null>(null);
  const apts = db.appointments.filter((a) => a.clientId === c.id).sort((a, b) => compareDateTime(b, a));
  const spent = apts.filter((a) => a.status === "concluido").reduce((s, a) => s + a.price, 0);
  return (
    <>
      <Modal open onClose={onClose} size="lg" title={c.name} subtitle={`Cliente desde ${formatDateShort(c.createdAt.slice(0, 10))}`}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4 shadow-none"><p className="flex items-center gap-2 text-sm"><Phone className="size-4 text-rose-400" /> {c.phone}</p><p className="mt-1.5 flex items-center gap-2 text-sm break-all"><Mail className="size-4 text-rose-400" /> {c.email}</p></Card>
          <Card className="p-4 shadow-none"><p className="font-serif text-3xl font-semibold">{apts.length}</p><p className="text-xs text-ink-500">agendamentos</p></Card>
          <Card className="p-4 shadow-none"><p className="font-serif text-3xl font-semibold">{money(spent)}</p><p className="text-xs text-ink-500">em atendimentos (demo)</p></Card>
        </div>
        <p className="mt-6 mb-3 text-xs font-bold tracking-wider text-ink-400 uppercase">Histórico de agendamentos</p>
        {apts.length === 0 ? <p className="text-sm text-ink-500">Nenhum agendamento ainda.</p> : (
          <ul className="divide-y divide-nude-100 rounded-2xl border border-nude-200">
            {apts.map((a) => (
              <li key={a.id}><button onClick={() => setDetail(a)} className="flex w-full items-center gap-3 p-3 text-left hover:bg-rose-50/50">
                <ServiceThumb id={a.serviceId} />
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{service[a.serviceId]?.name}</p><p className="text-xs text-ink-500">{formatDateShort(a.date)} {a.time} · {pro[a.professionalId]?.name}</p></div>
                <StatusBadge status={a.status} />
              </button></li>
            ))}
          </ul>
        )}
      </Modal>
      <AppointmentDetailModal appointment={detail} onClose={() => setDetail(null)} />
    </>
  );
}

function ClientForm({ c, onClose }: { c: Client | null; onClose: () => void }) {
  const { addClient, updateClient } = useStore();
  const toast = useToast();
  const [f, setF] = useState({ name: c?.name ?? "", phone: c?.phone ?? "", email: c?.email ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 3) er.name = "Informe o nome.";
    if (!isPhone(f.phone)) er.phone = "Telefone inválido.";
    if (!isEmail(f.email)) er.email = "E-mail inválido.";
    setErrors(er);
    if (Object.keys(er).length) return;
    const r = c ? updateClient(c.id, { ...f, email: f.email.toLowerCase() }) : addClient({ ...f, email: f.email.toLowerCase() });
    if (!r.ok) return setErrors({ email: r.error });
    toast(c ? "Cliente atualizado." : "Cliente cadastrado (senha inicial: 123456).");
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={c ? "Editar cliente" : "Cadastrar cliente"}
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" form="client-form">Salvar</Button></>}>
      <form id="client-form" onSubmit={save} noValidate className="grid gap-4">
        <Field label="Nome completo" error={errors.name} required><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} invalid={!!errors.name} /></Field>
        <Field label="Telefone" error={errors.phone} required><Input value={f.phone} onChange={(e) => setF({ ...f, phone: maskPhone(e.target.value) })} invalid={!!errors.phone} /></Field>
        <Field label="E-mail" error={errors.email} required><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} invalid={!!errors.email} /></Field>
      </form>
    </Modal>
  );
}
