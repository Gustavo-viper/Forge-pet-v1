import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, CalendarRange, Clock3, ClipboardList, ExternalLink, LayoutDashboard, LogOut, Menu, Scissors, Settings, UserRound, Users, X } from "lucide-react";
import { Avatar, Logo, cn } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatDateLong, todayISO } from "@/lib/dates";

export const ADMIN_NAV = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: "/admin/agenda", label: "Agenda", icon: CalendarRange },
  { to: "/admin/agendamentos", label: "Agendamentos", icon: ClipboardList },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/servicos", label: "Serviços", icon: Scissors },
  { to: "/admin/profissionais", label: "Profissionais", icon: UserRound },
  { to: "/admin/horarios", label: "Horários de funcionamento", icon: Clock3 },
  { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  const current = ADMIN_NAV.find((n) => (n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to)));
  return (
    <div className="min-h-dvh bg-[#faf6f3] lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="sticky top-0 hidden h-dvh lg:block"><Sidebar /></aside>
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-ink-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-[300px] animate-fade-up shadow-2xl"><Sidebar onClose={() => setOpen(false)} /></div>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-nude-200/70 bg-[#faf6f3]/90 px-4 backdrop-blur-xl sm:px-8">
          <button className="flex size-10 items-center justify-center rounded-xl bg-white ring-1 ring-nude-200 lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu className="size-5" /></button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-xl font-semibold sm:text-2xl">{current?.label ?? "Painel"}</p>
            <p className="hidden text-xs text-ink-400 first-letter:uppercase sm:block">{formatDateLong(todayISO())}</p>
          </div>
          <Link to="/" target="_blank" className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink-500 hover:bg-white hover:text-rose-600 sm:inline-flex"><ExternalLink className="size-4" /> Ver site</Link>
          <div className="flex items-center gap-2 rounded-2xl bg-white py-1 pr-3 pl-1 ring-1 ring-nude-200">
            <Avatar name="Administração Espaço" className="size-8 text-[11px]" />
            <span className="hidden text-sm font-semibold sm:inline">Administração</span>
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] animate-fade-in px-4 py-6 sm:px-8 sm:py-8" key={loc.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { adminLogout, db } = useStore();
  const nav = useNavigate();
  const pending = db.appointments.filter((a) => a.status === "pendente" || a.changeRequest).length;
  return (
    <div className="flex h-full flex-col bg-ink-900 text-white/80">
      <div className="flex h-20 items-center justify-between px-6">
        <Logo light />
        {onClose && <button onClick={onClose} aria-label="Fechar menu" className="flex size-9 items-center justify-center rounded-xl bg-white/10"><X className="size-5" /></button>}
      </div>
      <p className="px-6 pb-2 text-[10px] font-bold tracking-[0.3em] text-gold-300/80 uppercase">Gestão do salão</p>
      <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3">
        {ADMIN_NAV.map(({ to, label, icon: I, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => cn("flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition", isActive ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_8px_24px_-12px_rgb(183_110_121)]" : "hover:bg-white/8 hover:text-white")}>
            <I className="size-[18px]" strokeWidth={1.8} />
            <span className="flex-1">{label}</span>
            {to === "/admin/agendamentos" && pending > 0 && <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold text-ink-900">{pending}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="m-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
        <p className="text-xs text-white/50">Protótipo de demonstração</p>
        <p className="mt-0.5 text-[11px] font-semibold text-white/80">FORGE STUDIOS</p>
        <button onClick={() => { adminLogout(); nav("/admin/login"); }} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-semibold text-white transition hover:bg-rose-500">
          <LogOut className="size-4" /> Sair do painel
        </button>
      </div>
    </div>
  );
}
