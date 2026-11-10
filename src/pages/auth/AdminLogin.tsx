import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Button, Field, Input } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/toast";
import { ADMIN_CREDENTIALS } from "@/lib/seed";

export default function AdminLogin() {
  const { adminLogin } = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError("Preencha e-mail e senha.");
    setLoading(true);
    setTimeout(() => {
      const r = adminLogin(email, password);
      setLoading(false);
      if (!r.ok) return setError(r.error);
      toast("Acesso administrativo liberado.");
      nav("/admin", { replace: true });
    }, 450);
  };
  return (
    <AuthShell title="Painel administrativo" subtitle="Acesso restrito à equipe do Espaço Delas."
      side={<><ShieldCheck className="size-12 text-gold-300" strokeWidth={1.3} /><p className="mt-4 font-serif text-5xl leading-tight font-semibold">Gestão completa<br /><em className="text-gold-gradient">do seu salão.</em></p><p className="mt-4 max-w-md text-white/80">Agenda, clientes, serviços, profissionais e relatórios em um só lugar.</p></>}
      demo={<><strong>Acesso demonstrativo:</strong> {ADMIN_CREDENTIALS.email} · senha {ADMIN_CREDENTIALS.password}{" "}
        <button type="button" className="ml-1 font-bold underline" onClick={() => { setEmail(ADMIN_CREDENTIALS.email); setPassword(ADMIN_CREDENTIALS.password); }}>preencher</button></>}>
      <form onSubmit={submit} noValidate className="space-y-5">
        {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
        <Field label="E-mail administrativo" required>
          <Input type="email" placeholder="admin@espacodelas.com" value={email} onChange={(e) => setEmail(e.target.value)} leading={<Mail className="size-4" />} />
        </Field>
        <Field label="Senha" required>
          <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} leading={<Lock className="size-4" />} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading} icon={<ShieldCheck className="size-5" />}>Acessar painel</Button>
      </form>
    </AuthShell>
  );
}
