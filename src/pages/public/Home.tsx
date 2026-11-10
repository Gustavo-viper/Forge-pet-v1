import { useNavigate } from "react-router-dom";
import { ArrowDown, Award, CalendarCheck2, CalendarPlus, Coffee, HeartHandshake, Leaf, ShieldCheck, Sparkles, Star, Wifi } from "lucide-react";
import { useStore } from "@/lib/store";
import { IMG } from "@/lib/images";
import { useScrollToSection } from "@/lib/nav";
import { ServiceCard } from "@/components/ServiceCard";
import { Avatar, Button, ButtonLink, Photo, SectionTitle } from "@/components/ui";

export default function Home() {
  const { db } = useStore();
  const nav = useNavigate();
  const scrollTo = useScrollToSection();
  const services = db.services.filter((s) => s.active);
  const pros = db.professionals.filter((p) => p.active);

  return (
    <>
      {/* HERO */}
      <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden pt-24 pb-16 sm:items-center sm:pb-24">
        <div className="absolute inset-0 -z-20"><Photo src={IMG.hero} alt="Interior moderno do salão Espaço Delas" className="h-full w-full" fallbackIcon={<span />} /></div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-900/90 via-rose-900/55 to-ink-900/35 sm:bg-gradient-to-r sm:from-ink-900/85 sm:via-rose-900/50 sm:to-transparent" />
        <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wider text-white backdrop-blur">
              <Sparkles className="size-4 text-gold-300" /> Atendimento feminino e masculino
            </span>
            <h1 className="mt-6 font-serif text-[52px] leading-[0.95] font-semibold text-white sm:text-7xl lg:text-[88px]">
              Seu momento de beleza <em className="text-gold-gradient not-italic">começa aqui.</em>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
              Cuide de você com praticidade. Escolha seu serviço, encontre o melhor horário e agende seu atendimento online.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/agendar" size="lg" icon={<CalendarPlus className="size-5" />}>AGENDAR AGORA</ButtonLink>
              <Button size="lg" variant="white" onClick={() => scrollTo("servicos")} icon={<ArrowDown className="size-5" />}>CONHEÇA NOSSOS SERVIÇOS</Button>
            </div>
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-3">
                {pros.slice(0, 4).map((p) => <Avatar key={p.id} src={p.photo} name={p.name} className="size-11 text-xs ring-2 ring-white/80" />)}
              </div>
              <div className="text-sm text-white/85">
                <div className="flex items-center gap-1 text-gold-300">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-4 fill-current" />)}</div>
                <span>4,9 de avaliação média <span className="text-white/50">(demonstrativo)</span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-5 lg:px-8">
        <div className="grid grid-cols-2 gap-3 rounded-[32px] border border-nude-200 bg-white p-3 shadow-soft lg:grid-cols-4">
          {[
            { icon: CalendarCheck2, t: "Agenda online 24h", d: "Reserve quando quiser" },
            { icon: ShieldCheck, t: "Biossegurança", d: "Materiais esterilizados" },
            { icon: Award, t: "Equipe especializada", d: "Profissionais certificados" },
            { icon: HeartHandshake, t: "Para todos", d: "Ele, ela, você" },
          ].map(({ icon: I, t, d }) => (
            <div key={t} className="flex items-center gap-3 rounded-3xl p-4 sm:gap-4 sm:p-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500"><I className="size-6" strokeWidth={1.6} /></span>
              <div><p className="text-sm font-bold text-ink-900">{t}</p><p className="text-xs text-ink-500">{d}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="scroll-mt-20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionTitle eyebrow="Nossos serviços" title={<>Cuidado completo,<br /><em className="text-rose-500">do cabelo aos pés.</em></>}
              text="Cada serviço é pensado para que você saia renovado(a). Escolha o seu e agende em poucos toques." />
            <p className="max-w-xs rounded-2xl bg-[#fbf4e4] px-4 py-3 text-xs leading-relaxed text-gold-600 ring-1 ring-gold-300/50">
              <strong>Valores demonstrativos.</strong> Os preços reais serão cadastrados posteriormente pelo salão no painel administrativo.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <div key={s.id} className="animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
                <ServiceCard service={s} onBook={() => nav(`/agendar?servico=${s.id}`)} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="bg-grain scroll-mt-20 overflow-hidden bg-nude-100 py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 lg:grid-cols-2 lg:px-8">
          <div className="relative">
            <Photo src={IMG.about1} alt="Ambiente do Espaço Delas" className="aspect-[4/5] w-[82%] rounded-[40px] shadow-soft" />
            <div className="absolute right-0 bottom-[-8%] w-[52%]"><Photo src={IMG.about2} alt="Atendimento no salão" className="aspect-square w-full rounded-[32px] border-8 border-nude-100 shadow-soft" /></div>
            <div className="absolute top-8 right-2 animate-float rounded-3xl bg-white/95 p-5 shadow-soft backdrop-blur sm:right-6">
              <p className="font-serif text-4xl font-semibold text-rose-600">+10</p>
              <p className="text-xs font-semibold text-ink-500">anos de experiência<br />da equipe <span className="text-ink-400">(demo)</span></p>
            </div>
          </div>
          <div>
            <SectionTitle eyebrow="Sobre nós" title={<>Um espaço feito para <em className="text-rose-500">ele e para ela.</em></>}
              text="O Espaço Delas nasceu do desejo de criar um ambiente acolhedor, onde homens e mulheres se sintam à vontade para cuidar de si. Unimos técnica, produtos de qualidade e um atendimento atencioso para que cada visita seja uma pausa especial na sua rotina." />
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Leaf, t: "Produtos selecionados", d: "Linhas profissionais e veganas." },
                { icon: Coffee, t: "Conforto", d: "Café, chá e ambiente climatizado." },
                { icon: Wifi, t: "Praticidade", d: "Agenda online e lembretes." },
                { icon: Award, t: "Profissionalismo", d: "Equipe em constante atualização." },
              ].map(({ icon: I, t, d }) => (
                <div key={t} className="flex gap-4 rounded-3xl bg-white/80 p-5 ring-1 ring-nude-200 backdrop-blur">
                  <I className="size-6 shrink-0 text-gold-500" strokeWidth={1.6} />
                  <div><p className="font-bold text-ink-900">{t}</p><p className="text-sm text-ink-500">{d}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* EQUIPE */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionTitle center eyebrow="Nossa equipe" title={<>Mãos talentosas, <em className="text-rose-500">olhar atento.</em></>} text="Conheça os profissionais que cuidarão de você. (Profissionais fictícios para demonstração.)" />
          <div className="no-scrollbar -mx-5 mt-14 flex snap-x gap-5 overflow-x-auto px-5 pb-4 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
            {pros.map((p) => (
              <div key={p.id} className="group w-[240px] shrink-0 snap-start lg:w-auto">
                <Photo src={p.photo} alt={p.name} className="aspect-[3/4] rounded-[28px] transition duration-500 group-hover:shadow-soft" />
                <p className="mt-4 font-serif text-xl font-semibold">{p.name}</p>
                <p className="text-sm text-gold-600">{p.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="bg-rose-50/60 py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionTitle center eyebrow="Depoimentos" title="Quem vem, volta." />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { n: "Carolina M.", t: "Ambiente lindo e super acolhedor. Agendei pelo celular em segundos e fui atendida no horário certinho." },
              { n: "Felipe R.", t: "Finalmente um salão onde me sinto à vontade. Corte impecável e acabamento na navalha perfeito." },
              { n: "Renata S.", t: "A hidratação deixou meu cabelo outro! E a manicure é caprichosa demais. Recomendo muito." },
            ].map((d) => (
              <figure key={d.n} className="rounded-[28px] bg-white p-7 shadow-card">
                <div className="flex gap-1 text-gold-400">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-4 fill-current" />)}</div>
                <blockquote className="mt-4 font-serif text-xl leading-snug text-ink-700 italic">“{d.t}”</blockquote>
                <figcaption className="mt-5 text-sm font-bold text-ink-900">{d.n} <span className="font-normal text-ink-400">· depoimento demonstrativo</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
