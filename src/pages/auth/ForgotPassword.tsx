import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { MailCheck, Mail } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Button, ButtonLink, Field, Input } from "@/components/ui";
import { isEmail } from "@/lib/format";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) return setError("Informe um e-mail válido.");
    setError("");
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 600);
  };
  return (
    <AuthShell title="Recuperar senha" subtitle="Enviaremos um link para você criar uma nova senha.">
      {sent ? (
        <div className="animate-scale-in rounded-3xl bg-white p-8 text-center shadow-card">
          <MailCheck className="mx-auto size-12 text-rose-500" strokeWidth={1.5} />
          <p className="mt-4 font-serif text-2xl font-semibold">Verifique seu e-mail</p>
          <p className="mt-2 text-sm text-ink-500">Se houver uma conta para <strong>{email}</strong>, você receberá as instruções em instantes.</p>
          <p className="mt-3 text-xs text-ink-400">(Simulação: nenhum e-mail é enviado neste protótipo.)</p>
          <ButtonLink to="/entrar" className="mt-6 w-full">Voltar para o login</ButtonLink>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          <Field label="E-mail cadastrado" error={error} required>
            <Input type="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!error} leading={<Mail className="size-4" />} />
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={loading}>Enviar link de recuperação</Button>
          <p className="text-center text-sm"><Link to="/entrar" className="font-bold text-rose-600 hover:underline">Lembrei minha senha</Link></p>
        </form>
      )}
    </AuthShell>
  );
}
