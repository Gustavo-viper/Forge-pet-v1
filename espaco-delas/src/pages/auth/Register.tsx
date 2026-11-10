import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Mail, Phone, UserRound } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Button, Field, Input } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/toast";
import { firstName, isEmail, isPhone, maskPhone } from "@/lib/format";

export default function Register() {
  const { register } = useStore();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/cliente";
  const toast = useToast();
  const [f, setF] = useState({ name: "", phone: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: k === "phone" ? maskPhone(e.target.value) : e.target.value });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().split(" ").filter(Boolean).length < 2) er.name = "Informe nome e sobrenome.";
    if (!isPhone(f.phone)) er.phone = "Informe um telefone válido com DDD.";
    if (!isEmail(f.email)) er.email = "Informe um e-mail válido.";
    if (f.password.length < 6) er.password = "A senha deve ter pelo menos 6 caracteres.";
    if (f.confirm !== f.password || !f.confirm) er.confirm = "As senhas não coincidem.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    setTimeout(() => {
      const r = register({ name: f.name.trim(), phone: f.phone, email: f.email, password: f.password });
      setLoading(false);
      if (!r.ok) return setErrors({ email: r.error });
      toast(`Conta criada! Seja bem-vinda(o), ${firstName(r.data.name)}.`);
      nav(next, { replace: true });
    }, 500);
  };

  return (
    <AuthShell title="Criar conta" subtitle="Leva menos de um minuto. Depois é só escolher seu horário.">
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Nome completo" error={errors.name} required>
          <Input autoComplete="name" placeholder="Como devemos te chamar?" value={f.name} onChange={set("name")} invalid={!!errors.name} leading={<UserRound className="size-4" />} />
        </Field>
        <Field label="Telefone / WhatsApp" error={errors.phone} required>
          <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="(11) 99999-9999" value={f.phone} onChange={set("phone")} invalid={!!errors.phone} leading={<Phone className="size-4" />} />
        </Field>
        <Field label="E-mail" error={errors.email} required>
          <Input type="email" autoComplete="email" placeholder="voce@email.com" value={f.email} onChange={set("email")} invalid={!!errors.email} leading={<Mail className="size-4" />} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Senha" error={errors.password} required>
            <Input type="password" autoComplete="new-password" placeholder="Mín. 6 caracteres" value={f.password} onChange={set("password")} invalid={!!errors.password} leading={<Lock className="size-4" />} />
          </Field>
          <Field label="Confirmar senha" error={errors.confirm} required>
            <Input type="password" autoComplete="new-password" placeholder="Repita a senha" value={f.confirm} onChange={set("confirm")} invalid={!!errors.confirm} leading={<Lock className="size-4" />} />
          </Field>
        </div>
        <Button type="submit" size="lg" className="mt-2 w-full" loading={loading}>Criar minha conta</Button>
        <p className="text-center text-sm text-ink-500">
          Já tem conta? <Link to={`/entrar${params.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-bold text-rose-600 hover:underline">Entrar</Link>
        </p>
      </form>
    </AuthShell>
  );
}
