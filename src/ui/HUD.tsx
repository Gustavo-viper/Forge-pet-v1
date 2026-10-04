// ============================================================
// FORGE PET — HUD do jogo (topo, necessidades, controles mobile)
// ============================================================
import { useRef, useState } from "react";
import { useForge } from "../state/store";
import { input } from "../game/input";
import { useInteract } from "../game/interact";
import { useMiniHud } from "../game/miniHud";
import { t } from "../data/content";

const NEED_META: { key: "health" | "hunger" | "thirst" | "energy" | "happiness" | "hygiene" | "sleep"; icon: string; color: string }[] = [
  { key: "health", icon: "❤️", color: "#ff5e7a" },
  { key: "hunger", icon: "🍖", color: "#ff8a3d" },
  { key: "thirst", icon: "💧", color: "#4fc3f7" },
  { key: "energy", icon: "⚡", color: "#ffd54f" },
  { key: "happiness", icon: "😊", color: "#ff8ad8" },
  { key: "hygiene", icon: "🧼", color: "#4dd0e1" },
  { key: "sleep", icon: "😴", color: "#8b7cf6" },
];

export function TopBar() {
  const coins = useForge((s) => s.coins);
  const gems = useForge((s) => s.gems);
  const level = useForge((s) => s.level);
  const xp = useForge((s) => s.xp);
  const time = useForge((s) => s.time);
  const weather = useForge((s) => s.weather);
  const area = useForge((s) => s.area);
  const openPanel = useForge((s) => s.openPanel);
  const xpNeed = 80 + (level - 1) * 60;
  const areaName = area === "casa" ? "🏠 Casa" : area === "jardim" ? "🌳 Jardim" : area === "parque" ? "🌲 Parque" : area === "veterinaria" ? "🏥 Veterinária" : area;

  const hour = Math.floor(time.hour);
  const isNight = hour < 6 || hour >= 19;
  const wIcon = weather === "sun" ? "☀️" : weather === "cloud" ? "⛅" : weather === "rain" ? "🌧️" : "❄️";

  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-start justify-between gap-2 p-2 sm:p-3">
      <div className="pointer-events-auto flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="chip anim-pop">
            <span>🪙</span>
            <span className="tabular-nums">{coins.toLocaleString("pt-BR")}</span>
          </div>
          <div className="chip anim-pop">
            <span>💎</span>
            <span className="tabular-nums">{gems}</span>
          </div>
          <div className="chip anim-pop">
            <span>⭐</span>
            <span>{level}</span>
          </div>
        </div>
        <div className="glass w-40 rounded-xl p-2">
          <div className="mb-1 flex items-center justify-between text-[10px] font-extrabold text-white/70">
            <span>XP</span>
            <span className="tabular-nums">{xp}/{xpNeed}</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${Math.min(100, (xp / xpNeed) * 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="pointer-events-auto flex flex-col items-center gap-1.5">
        <div className="chip anim-pop">
          <span>{isNight ? "🌙" : "☀️"}</span>
          <span className="tabular-nums">{String(hour).padStart(2, "0")}:00</span>
          <span className="opacity-60">·</span>
          <span>{wIcon}</span>
        </div>
        <div className="chip text-[11px]">{areaName}</div>
      </div>

      <div className="pointer-events-auto flex items-center gap-1.5">
        <button className="btn btn-ghost h-10 w-10 !rounded-xl text-base" onClick={() => openPanel("world")} title="Mundo">🌎</button>
        <button className="btn btn-ghost h-10 w-10 !rounded-xl text-base" onClick={() => openPanel("daily")} title="Recompensa diária">🎁</button>
        <button className="btn btn-ghost h-10 w-10 !rounded-xl text-base" onClick={() => openPanel("missions")} title="Missões">🎯</button>
        <button className="btn btn-ghost h-10 w-10 !rounded-xl text-base" onClick={() => openPanel("achievements")} title="Conquistas">🏆</button>
        <button className="btn btn-ghost h-10 w-10 !rounded-xl text-base" onClick={() => openPanel("shop")} title="Loja">🛍️</button>
        <button className="btn btn-ghost h-10 w-10 !rounded-xl text-base" onClick={() => openPanel("settings")} title="Configurações">⚙️</button>
      </div>
    </div>
  );
}

export function NeedsPanel() {
  const needs = useForge((s) => s.needs);
  const sick = useForge((s) => s.sick);
  const sleeping = useForge((s) => s.sleeping);
  const heal = useForge((s) => s.heal);
  const [open, setOpen] = useState(true);

  return (
    <div className="absolute left-2 top-24 z-20 sm:left-3">
      <button
        className="btn btn-ghost mb-1.5 h-9 w-9 !rounded-xl text-sm"
        onClick={() => setOpen((o) => !o)}
        title="Necessidades"
      >
        📊
      </button>
      {open && (
        <div className="glass w-44 rounded-2xl p-3 anim-fade-up">
          {NEED_META.map((n) => (
            <div key={n.key} className="mb-1.5 last:mb-0">
              <div className="mb-0.5 flex items-center justify-between text-[10px] font-extrabold">
                <span>{n.icon} {t(n.key, "pt" as never)}</span>
                <span className="text-white/60 tabular-nums">{Math.round(needs[n.key])}%</span>
              </div>
              <div className="bar-track !h-2">
                <div className="bar-fill" style={{ width: `${needs[n.key]}%`, background: n.color }} />
              </div>
            </div>
          ))}
          {sick && (
            <button className="btn btn-danger mt-2 w-full !rounded-xl !py-1.5 text-xs" onClick={heal}>
              🏥 Curar (40 🪙)
            </button>
          )}
          {sleeping && <div className="mt-2 text-center text-[11px] font-bold text-sky-300">😴 Dormindo...</div>}
        </div>
      )}
    </div>
  );
}

export function PetBubble() {
  const bubble = useForge((s) => s.bubble);
  const bubbleKey = useForge((s) => s.bubbleKey);
  if (!bubble || bubble.until < Date.now()) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2 sm:top-20">
      <div key={bubbleKey} className="anim-bubble glass rounded-2xl px-4 py-2 text-sm font-extrabold text-white">
        {bubble.text}
      </div>
    </div>
  );
}

export function Toasts() {
  const toasts = useForge((s) => s.toasts);
  return (
    <div className="pointer-events-none absolute right-2 top-20 z-30 flex w-64 flex-col gap-2 sm:right-3 sm:top-24">
      {toasts.map((n) => (
        <div key={n.id} className="toast anim-toast glass flex items-center gap-2 rounded-2xl px-3 py-2.5">
          <span className="text-xl">{n.icon}</span>
          <span className="text-xs font-extrabold leading-tight text-white/90">{n.text}</span>
        </div>
      ))}
    </div>
  );
}

export function InteractButton() {
  const inter = useInteract();
  if (!inter.action) return null;
  return (
    <div className="pointer-events-none absolute bottom-32 left-1/2 z-20 -translate-x-1/2 sm:bottom-36">
      <div className="anim-pop glass pointer-events-auto flex items-center gap-2 rounded-2xl px-4 py-2.5">
        <span className="text-xl">{inter.icon}</span>
        <span className="text-sm font-extrabold">{inter.label}</span>
        <kbd className="rounded-lg bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/70">E</kbd>
        <button
          className="btn btn-forge !rounded-xl !px-4 !py-1.5 text-xs"
          onClick={() => inter.action?.()}
        >
          {t("interact", "pt" as never)}
        </button>
      </div>
    </div>
  );
}

export function DecorControls() {
  const decorTarget = useForge((s) => s.decorTarget);
  const rotateDecor = useForge((s) => s.rotateDecor);
  const confirmDecor = useForge((s) => s.confirmDecor);
  const cancelDecor = useForge((s) => s.cancelDecor);
  if (!decorTarget) return null;
  return (
    <div className="absolute bottom-32 left-1/2 z-20 -translate-x-1/2 sm:bottom-36">
      <div className="anim-pop glass flex items-center gap-2 rounded-2xl px-3 py-2.5">
        <span className="text-xs font-extrabold text-white/80">🔨 Posicione o móvel</span>
        <button className="btn btn-ghost !rounded-xl !px-3 !py-1.5 text-xs" onClick={rotateDecor}>🔄 Girar</button>
        <button className="btn btn-teal !rounded-xl !px-3 !py-1.5 text-xs" onClick={confirmDecor}>✓ Confirmar</button>
        <button className="btn btn-danger !rounded-xl !px-3 !py-1.5 text-xs" onClick={cancelDecor}>✕</button>
      </div>
    </div>
  );
}

export function SickBanner() {
  const sick = useForge((s) => s.sick);
  if (!sick) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-28 z-20 -translate-x-1/2 sm:top-32">
      <div className="anim-pop glass flex items-center gap-2 rounded-2xl border border-red-400/40 px-4 py-2">
        <span className="text-xl">🤒</span>
        <span className="text-xs font-extrabold text-red-200">Seu pet está doente! Leve à Veterinária.</span>
      </div>
    </div>
  );
}

// ---------- Controles mobile ----------
export function Joystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const active = useRef(false);

  const setKnob = (dx: number, dy: number) => {
    if (knobRef.current) knobRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  };

  const handle = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const max = rect.width / 2 - 14;
    const d = Math.hypot(dx, dy);
    if (d > max) { dx = (dx / d) * max; dy = (dy / d) * max; }
    input.mx = dx / max;
    input.mz = dy / max;
    setKnob(dx, dy);
  };

  return (
    <div
      ref={baseRef}
      className="joy-base absolute bottom-5 left-5 z-20"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => { active.current = true; (e.target as HTMLElement).setPointerCapture(e.pointerId); handle(e.clientX, e.clientY); }}
      onPointerMove={(e) => { if (active.current) handle(e.clientX, e.clientY); }}
      onPointerUp={() => { active.current = false; input.mx = 0; input.mz = 0; setKnob(0, 0); }}
      onPointerCancel={() => { active.current = false; input.mx = 0; input.mz = 0; setKnob(0, 0); }}
    >
      <div ref={knobRef} className="joy-knob" />
    </div>
  );
}

export function MobileButtons() {
  const openPanel = useForge((s) => s.openPanel);
  const inter = useInteract();
  const jump = () => { input.jumpQueued = true; };
  const runDown = () => { input.run = true; };
  const runUp = () => { input.run = false; };
  const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  if (!isTouch) return null;
  return (
    <>
      <div className="absolute bottom-5 right-5 z-20 flex flex-col items-end gap-2.5">
        <button className="btn btn-teal h-14 w-14 !rounded-full text-xl" onPointerDown={jump} title="Pular">⬆️</button>
        <button
          className="btn btn-ghost h-14 w-14 !rounded-full text-xl"
          onPointerDown={runDown}
          onPointerUp={runUp}
          onPointerLeave={runUp}
          title="Correr"
        >
          💨
        </button>
        <button className="btn btn-ghost h-12 w-12 !rounded-full text-lg" onClick={() => openPanel("inventory")} title="Inventário">🎒</button>
      </div>
      {inter.action && (
        <button
          className="btn btn-forge absolute bottom-24 right-5 z-20 h-16 w-16 !rounded-full text-2xl anim-pulse-glow"
          onPointerDown={() => inter.action?.()}
          title={inter.label}
        >
          {inter.icon}
        </button>
      )}
    </>
  );
}

export function MiniHudOverlay() {
  const hud = useMiniHud();
  const openPanel = useForge((s) => s.openPanel);
  if (!hud.label) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-center gap-3 p-3">
      <div className="glass flex items-center gap-3 rounded-2xl px-4 py-2 anim-fade-up">
        <span className="text-sm font-extrabold text-amber-300">🪙 {hud.score}</span>
        <span className="text-sm font-extrabold text-white/90 tabular-nums">⏱ {hud.time}s</span>
        <span className="text-xs font-bold text-white/50">{hud.label}</span>
        <button className="btn btn-ghost !rounded-xl !px-3 !py-1 text-[11px] pointer-events-auto" onClick={() => openPanel("minigames")}>Sair</button>
      </div>
    </div>
  );
}

export function MenuButtons() {
  const openPanel = useForge((s) => s.openPanel);
  const aiMode = useForge((s) => s.aiMode);
  const setAI = useForge((s) => s.setAI);
  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 sm:bottom-5">
      <button className="btn btn-ghost !rounded-xl !px-3 !py-2 text-[11px]" onClick={() => openPanel("pets")}>🐾 Pets</button>
      <button className="btn btn-ghost !rounded-xl !px-3 !py-2 text-[11px]" onClick={() => openPanel("customize")}>🎨 Aparência</button>
      <button className="btn btn-ghost !rounded-xl !px-3 !py-2 text-[11px]" onClick={() => openPanel("decorate")}>🔨 Decorar</button>
      <button className="btn btn-ghost !rounded-xl !px-3 !py-2 text-[11px]" onClick={() => openPanel("minigames")}>🎮 Jogar</button>
      <button className="btn btn-ghost !rounded-xl !px-3 !py-2 text-[11px]" onClick={() => openPanel("ranking")}>🏅 Ranking</button>
      <button className={`btn ${aiMode ? "btn-teal" : "btn-ghost"} !rounded-xl !px-3 !py-2 text-[11px}`} onClick={() => setAI(!aiMode)}>
        🤖 IA
      </button>
      <button className="btn btn-ghost !rounded-xl !px-3 !py-2 text-[11px]" onClick={() => openPanel("profile")}>👤 Perfil</button>
    </div>
  );
}

export function Announcement() {
  const announcement = useForge((s) => s.announcement);
  if (!announcement) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center p-2">
      <div className="anim-fade-up glass flex items-center gap-2 rounded-2xl border border-amber-400/40 px-4 py-2">
        <span className="text-lg">📢</span>
        <span className="text-xs font-extrabold text-amber-200">{announcement}</span>
      </div>
    </div>
  );
}

