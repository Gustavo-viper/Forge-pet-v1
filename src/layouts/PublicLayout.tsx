import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { CalendarPlus, Clock3, Mail, MapPin, Menu, Phone, ShieldCheck, UserRound, X } from "lucide-react";
import { ButtonLink, Logo, cn } from "@/components/ui";
import { FacebookIcon, InstagramIcon, WhatsappIcon } from "@/components/brand-icons";
import { useStore } from "@/lib/store";
import { useScrollToSection } from "@/lib/nav";
import { WEEKDAYS } from "@/lib/dates";
import { firstName } from "@/lib/format";

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { currentClient } = useStore();
  const scrollTo = useScrollToSection();
  const loc = useLocation();
  const nav = useNavigate();
  const onHome = loc.pathname === "/";
  const transparent = onHome && !scrolled && !open;

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 24);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  useEffect(() => setOpen(false), [loc.pathname]);

  const items: { label: string; action: () => void }[] = [
    { label: "Início", action: () => (onHome ? window.scrollTo({ top: 0, behavior: "smooth" }) : nav("/")) },
    { label: "Serviços", action: () => scrollTo("servicos") },
    { label: "Sobre nós", action: () => scrollTo("sobre") },
    { label: "Agendar horário", action: () => nav("/agendar") },
  ];
  const run = (fn: () => void) => { setOpen(false); fn(); };

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-300", transparent ? "bg-transparent" : "border-b border-nude-200/70 bg-nude-50/85 backdrop-blur-xl")}>
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" aria-label="Espaço Delas — início"><Logo light={transparent} /></Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {items.map((i) => (
            <button key={i.label} onClick={i.action} className={cn("rounded-xl px-4 py-2 text-sm font-semibold transition", transparent ? "text-white/90 hover:bg-white/10 hover:text-white" : "text-ink-700 hover:bg-rose-50 hover:text-rose-600")}>{i.label}</button>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {currentClient ? (
            <ButtonLink to="/cliente" variant={transparent ? "white" : "outline"} icon={<UserRound className="size-4" />}>Olá, {firstName(currentClient.name)}</ButtonLink>
          ) : (
            <ButtonLink to="/entrar" variant={transparent ? "white" : "outline"} icon={<UserRound className="size-4" />}>Entrar na minha conta</ButtonLink>
          )}
          <ButtonLink to="/agendar" icon={<CalendarPlus className="size-4" />}>Agendar</ButtonLink>
        </div>
        <button onClick={() => setOpen((v) => !v)} aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open}
          className={cn("flex size-11 items-center justify-center rounded-2xl lg:hidden", transparent ? "bg-white/15 text-white ring-1 ring-white/30" : "bg-white text-ink-900 ring-1 ring-nude-200")}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="animate-fade-in border-t border-nude-200 bg-nude-50 px-5 pt-3 pb-6 lg:hidden">
          <nav className="flex flex-col">
            {items.map((i) => (
              <button key={i.label} onClick={() => run(i.action)} className="flex h-14 items-center border-b border-nude-200/70 text-left font-serif text-2xl font-semibold text-ink-900">{i.label}</button>
            ))}
          </nav>
          <div className="mt-5 grid gap-3">
            <ButtonLink to="/agendar" size="lg" icon={<CalendarPlus className="size-5" />}>Agendar agora</ButtonLink>
            <ButtonLink to={currentClient ? "/cliente" : "/entrar"} size="lg" variant="outline" icon={<UserRound className="size-5" />}>
              {currentClient ? `Minha conta (${firstName(currentClient.name)})` : "Entrar na minha conta"}
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const { db } = useStore();
  const s = db.settings;
  const scrollTo = useScrollToSection();
  const hours = db.businessHours;
  const summary = [1, 2, 3, 4, 5, 6, 0].map((d) => ({ d, h: hours[d] }));
  return (
    <footer className="relative overflow-hidden bg-ink-900 text-white/80">
      <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_10%_0%,#7f4350,transparent_40%),radial-gradient(circle_at_90%_100%,#a07c35,transparent_35%)]" />
      <div className="relative mx-auto max-w-7xl px-5 pt-16 pb-8 lg:px-8">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur sm:flex-row sm:items-center sm:p-10">
          <div>
            <p className="font-serif text-3xl font-semibold text-white sm:text-4xl">Reserve seu momento de cuidado.</p>
            <p className="mt-2 text-white/60">Agendamento online em menos de 1 minuto, 24 horas por dia.</p>
          </div>
          <ButtonLink to="/agendar" size="lg" variant="gold" icon={<CalendarPlus className="size-5" />}>Agendar horário</ButtonLink>
        </div>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">Salão de beleza feminino e masculino. Qualidade, conforto e profissionalismo em cada atendimento.</p>
            <div className="mt-5 flex gap-2">
              {[
                { I: InstagramIcon, label: `Instagram ${s.instagram}`, href: "https://instagram.com/" },
                { I: FacebookIcon, label: `Facebook ${s.facebook}`, href: "https://facebook.com/" },
                { I: WhatsappIcon, label: `WhatsApp ${s.whatsapp}`, href: `https://wa.me/55${s.whatsapp.replace(/\D/g, "")}` },
              ].map(({ I, label, href }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={`${label} (demonstrativo)`} className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-rose-500">
                  <I className="size-5" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-4 text-xs font-bold tracking-[0.25em] text-gold-300 uppercase">Contato</p>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3"><Phone className="size-4 shrink-0 text-rose-300" /> {s.phone}</li>
              <li className="flex gap-3"><WhatsappIcon className="size-4 shrink-0 text-rose-300" /> {s.whatsapp}</li>
              <li className="flex gap-3"><Mail className="size-4 shrink-0 text-rose-300" /> {s.email}</li>
              <li className="flex gap-3"><MapPin className="size-4 shrink-0 text-rose-300" /> <span>{s.address}<br />{s.city}</span></li>
            </ul>
            <p className="mt-3 text-[11px] text-white/40">Informações de contato e endereço demonstrativos.</p>
          </div>
          <div>
            <p className="mb-4 text-xs font-bold tracking-[0.25em] text-gold-300 uppercase">Funcionamento</p>
            <ul className="space-y-2 text-sm">
              {summary.map(({ d, h }) => (
                <li key={d} className="flex justify-between gap-4 border-b border-white/5 pb-2">
                  <span className="text-white/60">{WEEKDAYS[d]}</span>
                  <span className={h.enabled ? "text-white" : "text-white/40"}>{h.enabled ? `${h.start} – ${h.end}` : "Fechado"}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-4 text-xs font-bold tracking-[0.25em] text-gold-300 uppercase">Navegação</p>
            <ul className="space-y-2.5 text-sm">
              <li><button onClick={() => scrollTo("servicos")} className="hover:text-white">Serviços</button></li>
              <li><button onClick={() => scrollTo("sobre")} className="hover:text-white">Sobre nós</button></li>
              <li><Link to="/agendar" className="hover:text-white">Agendar horário</Link></li>
              <li><Link to="/entrar" className="hover:text-white">Área do cliente</Link></li>
              <li><Link to="/admin/login" className="inline-flex items-center gap-1.5 hover:text-white"><ShieldCheck className="size-4" /> Acesso administrativo</Link></li>
            </ul>
            <p className="mt-5 inline-flex items-center gap-2 text-xs text-white/50"><Clock3 className="size-4" /> Agendamento online 24h</p>
          </div>
        </div>
        <div className="gold-line mt-12 opacity-40" />
        <div className="mt-6 flex flex-col gap-3 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {s.salonName}. Protótipo de demonstração — valores e dados fictícios.</p>
          <ForgeSignature />
        </div>
      </div>
    </footer>
  );
}

export function ForgeSignature({ dark }: { dark?: boolean }) {
  return (
    <p className={cn("text-xs", dark ? "text-ink-400" : "text-white/45")}>
      Desenvolvido por <strong className={dark ? "text-ink-700" : "text-white/80"}>FORGE STUDIOS</strong> — Tecnologias em Softwares LTDA. · CNPJ 69.902.162/0001-11
    </p>
  );
}

export function ScrollReset() {
  const { pathname, state } = useLocation();
  useEffect(() => {
    const target = (state as { scrollTo?: string } | null)?.scrollTo;
    if (target) {
      const t = setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth" }), 60);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, state]);
  return null;
}

