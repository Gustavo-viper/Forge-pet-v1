import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import { Logo, Photo } from "@/components/ui";
import { IMG } from "@/lib/images";

export function AuthShell({ title, subtitle, children, side, demo }: { title: string; subtitle: string; children: ReactNode; side?: ReactNode; demo?: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0"><Photo src={IMG.auth} alt="Atendimento no salão" className="h-full w-full" fallbackIcon={<span />} /></div>
        <div className="absolute inset-0 bg-gradient-to-t from-rose-900/85 via-rose-800/40 to-ink-900/20" />
        <div className="absolute inset-x-0 bottom-0 p-14 text-white">
          {side ?? (
            <>
              <p className="font-serif text-5xl leading-tight font-semibold">Beleza com<br /><em className="text-gold-gradient">hora marcada.</em></p>
              <p className="mt-4 max-w-md text-white/80">Acompanhe seus agendamentos, remarque com facilidade e guarde todo o histórico dos seus cuidados.</p>
            </>
          )}
        </div>
      </div>
      <div className="bg-grain flex flex-col bg-nude-50 px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <Link to="/" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink-500 hover:bg-white hover:text-rose-600"><ArrowLeft className="size-4" /> Voltar ao site</Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <div className="animate-fade-up">
            <h1 className="font-serif text-4xl font-semibold text-ink-900 sm:text-5xl">{title}</h1>
            <p className="mt-2 text-ink-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {demo && (
              <div className="mt-8 flex gap-3 rounded-2xl border border-gold-300/60 bg-[#fbf4e4] p-4 text-xs leading-relaxed text-gold-600">
                <Info className="size-4 shrink-0" />
                <div>{demo}</div>
              </div>
            )}
          </div>
        </div>
        <p className="text-center text-[11px] text-ink-400">Autenticação simulada para demonstração — não utilize senhas reais.</p>
      </div>
    </div>
  );
}
