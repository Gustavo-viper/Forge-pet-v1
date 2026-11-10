import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, RotateCcw, Save } from "lucide-react";
import { useStore } from "@/lib/store";
import { isEmail, maskPhone } from "@/lib/format";
import type { Settings } from "@/lib/types";
import { Button, Card, ConfirmDialog, Field, Input, Select, Toggle } from "@/components/ui";
import { PageHeader } from "@/components/admin-shared";
import { useToast } from "@/components/toast";
import { ForgeSignature } from "@/layouts/PublicLayout";

export default function SettingsPage() {
  const { db, saveSettings, resetDemo, adminLogout } = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const [f, setF] = useState<Settings>({ ...db.settings });
  const [err, setErr] = useState<Record<string, string>>({});
  const [reset, setReset] = useState(false);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setF({ ...f, [k]: v });
  const save = (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.salonName.trim()) er.salonName = "Obrigatório.";
    if (!isEmail(f.email)) er.email = "E-mail inválido.";
    if (!f.address.trim()) er.address = "Obrigatório.";
    setErr(er);
    if (Object.keys(er).length) return;
    saveSettings(f);
    toast("Configurações salvas. O site já exibe as novas informações.");
  };
  return (
    <>
      <PageHeader title="Configurações" text="Informações do salão, políticas de agendamento e dados da demonstração." />
      <form onSubmit={save} noValidate className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <p className="mb-5 font-serif text-2xl font-semibold">Dados do salão</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome do salão" error={err.salonName} required className="sm:col-span-2"><Input value={f.salonName} onChange={(e) => set("salonName", e.target.value)} /></Field>
            <Field label="Telefone"><Input value={f.phone} onChange={(e) => set("phone", maskPhone(e.target.value))} /></Field>
            <Field label="WhatsApp"><Input value={f.whatsapp} onChange={(e) => set("whatsapp", maskPhone(e.target.value))} /></Field>
            <Field label="E-mail" error={err.email} required className="sm:col-span-2"><Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="Endereço" error={err.address} required className="sm:col-span-2"><Input value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
            <Field label="Cidade / UF" className="sm:col-span-2"><Input value={f.city} onChange={(e) => set("city", e.target.value)} /></Field>
            <Field label="Instagram"><Input value={f.instagram} onChange={(e) => set("instagram", e.target.value)} /></Field>
            <Field label="Facebook"><Input value={f.facebook} onChange={(e) => set("facebook", e.target.value)} /></Field>
          </div>
        </Card>
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <p className="mb-5 font-serif text-2xl font-semibold">Políticas de agendamento</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-nude-50 p-4">
                <div><p className="text-sm font-semibold">Confirmar reservas automaticamente</p><p className="text-xs text-ink-500">Desativado: novas reservas ficam “pendentes” até a equipe confirmar.</p></div>
                <Toggle checked={f.autoConfirm} onChange={(v) => set("autoConfirm", v)} label="Confirmação automática" />
              </div>
              <Field label="Antecedência mínima para cancelar/alterar online">
                <Select value={f.cancelPolicyHours} onChange={(e) => set("cancelPolicyHours", Number(e.target.value))}>{[0, 2, 4, 12, 24, 48].map((h) => <option key={h} value={h}>{h === 0 ? "Sem restrição" : `${h} horas`}</option>)}</Select>
              </Field>
            </div>
          </Card>
          <Card className="p-5 sm:p-6">
            <p className="font-serif text-2xl font-semibold">Dados de demonstração</p>
            <p className="mt-1 mb-4 text-sm text-ink-500">Os dados ficam salvos neste navegador (localStorage). Restaure a base inicial a qualquer momento antes de uma apresentação.</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="danger" onClick={() => setReset(true)} icon={<RotateCcw className="size-4" />}>Restaurar dados demonstrativos</Button>
              <Button type="button" variant="ghost" onClick={() => { adminLogout(); nav("/admin/login"); }} icon={<LogOut className="size-4" />}>Sair do painel</Button>
            </div>
            <div className="mt-5 border-t border-nude-100 pt-4"><ForgeSignature dark /><p className="mt-1 text-xs text-ink-400">Representante: Gustavo Silva</p></div>
          </Card>
          <div className="flex justify-end"><Button type="submit" size="lg" icon={<Save className="size-5" />}>Salvar configurações</Button></div>
        </div>
      </form>
      <ConfirmDialog open={reset} onClose={() => setReset(false)} danger confirmLabel="Restaurar" title="Restaurar dados?"
        message="Todos os clientes, agendamentos, serviços e alterações feitas nesta demonstração serão substituídos pela base inicial."
        onConfirm={() => { resetDemo(); toast("Base demonstrativa restaurada."); setTimeout(() => window.location.reload(), 300); }} />
    </>
  );
}
