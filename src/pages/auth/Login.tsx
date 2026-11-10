import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Button, Field, Input } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/toast";
import { firstName, isEmail } from "@/lib/format";

export default function Login() {
  const { login } = useStore();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/cliente";
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!email.trim()) er.email = "Informe seu e-mail.";
    else if (!isEmail(email)) er.email = "E-mail inválido.";
    if (!password) er.password = "Informe sua senha.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    setTimeout(() => {
      const r = login(email, password);
      setLoading(false);
      if (!r.ok) return setErrors({ form: r.error });
      toast(`Bem-vinda(o) de volta, ${firstName(r.data.name)}!`);
      nav(next, { replace: true });
    }, 450);
  };

  return (
    <AuthShell title="Entrar" subtitle="Acesse sua conta para agendar e acompanhar seus horários."
      demo={<><strong>Conta demonstrativa:</strong> cliente@demo.com · senha 123456{" "}
        <button type="button" className="ml-1 font-bold underline" onClick={() => { setEmail("cliente@demo.com"); setPassword("123456"); }}>preencher</button></>}>
      <form onSubmit={submit} noValidate className="space-y-5">
        {errors.form && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{errors.form}</p>}
        <Field label="E-mail" error={errors.email} required>
          <Input type="email" autoComplete="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!errors.email} leading={<Mail className="size-4" />} />
        </Field>
        <Field label="Senha" error={errors.password} required>
          <Input type={show ? "text" : "password"} autoComplete="current-password" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!errors.password} leading={<Lock className="size-4" />}
            trailing={<button type="button" aria-label={show ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShow((v) => !v)} className="flex size-9 items-center justify-center rounded-xl text-ink-400 hover:text-rose-600">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>} />
        </Field>
        <div className="flex justify-end">
          <Link to="/esqueci-senha" className="text-sm font-semibold text-rose-600 hover:underline">Esqueci minha senha</Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={loading}>Entrar</Button>
        <p className="text-center text-sm text-ink-500">
          Ainda não tem conta? <Link to={`/cadastro${params.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-bold text-rose-600 hover:underline">Criar minha conta</Link>
        </p>
      </form>
    </AuthShell>
  );
}
