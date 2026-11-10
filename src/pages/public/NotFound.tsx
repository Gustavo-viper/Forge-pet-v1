import { Home } from "lucide-react";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center px-5 pt-24 text-center">
      <p className="font-serif text-8xl font-semibold text-rose-200">404</p>
      <p className="mt-2 font-serif text-3xl font-semibold">Página não encontrada</p>
      <p className="mt-2 text-ink-500">O endereço acessado não existe.</p>
      <ButtonLink to="/" className="mt-6" icon={<Home className="size-4" />}>Voltar ao início</ButtonLink>
    </div>
  );
}
