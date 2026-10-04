// ============================================================
// FORGE PET — Painéis de UI (loja, inventário, missões, etc.)
// ============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { useForge, FUR_COLORS } from "../state/store";
import { sound } from "../audio/sound";
import {
  FOODS, WEAR, TOYS, FURNITURE, SPECIES, DAILY_REWARDS, AREAS,
  ACHIEVEMENTS, CURRENT_VERSION, UPDATE_NOTES, t, type Lang,
} from "../data/content";

function Panel({ title, icon, children, onClose, wide }: { title: string; icon: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <div
        className={`glass anim-pop flex max-h-[92vh] w-full flex-col overflow-hidden rounded-3xl ${wide ? "max-w-3xl" : "max-w-xl"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
          <h2 className="font-display text-lg font-bold text-white sm:text-xl">
            {icon} {title}
          </h2>
          <button className="btn btn-ghost h-9 w-9 !rounded-xl text-sm" onClick={onClose}>✕</button>
        </div>
        <div className="panel-scroll flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

function ItemCard({ emoji, name, sub, price, gems, level, locked, actionLabel, onAction, disabled }: {
  emoji: string; name: string; sub?: string; price?: number; gems?: number; level: number; locked: boolean;
  actionLabel: string; onAction: () => void; disabled?: boolean;
}) {
  return (
    <div className={`card-hover glass flex flex-col items-center gap-1.5 rounded-2xl p-3 ${locked ? "opacity-50" : ""}`}>
      <div className="text-3xl">{emoji}</div>
      <div className="text-center text-xs font-extrabold text-white">{name}</div>
      {sub && <div className="text-center text-[10px] font-bold text-white/50">{sub}</div>}
      <div className="flex items-center gap-1 text-[11px] font-extrabold">
        {price !== undefined && <span className="text-amber-300">🪙 {price}</span>}
        {gems ? <span className="text-sky-300">💎 {gems}</span> : null}
        {locked && <span className="text-white/40">🔒 Nv.{level}</span>}
      </div>
      <button className={`btn ${disabled ? "btn-ghost" : "btn-forge"} mt-1 w-full !rounded-xl !py-1.5 text-[11px]`} onClick={onAction} disabled={disabled || locked}>
        {actionLabel}
      </button>
    </div>
  );
}

// ---------------- LOJA ----------------
export function ShopPanel({ onClose }: { onClose: () => void }) {
  const [cat, setCat] = useState<"food" | "wear" | "toy" | "furniture" | "pet">("food");
  const buy = useForge((s) => s.buy);
  const level = useForge((s) => s.level);
  const lang = useForge((s) => s.settings.lang);
  const cats: [typeof cat, string, string][] = [
    ["food", "🍎", "Comidas"], ["wear", "👕", "Roupas"], ["toy", "🧸", "Brinquedos"],
    ["furniture", "🛋️", "Móveis"], ["pet", "🐾", "Pets"],
  ];
  return (
    <Panel title="Loja Forge" icon="🛍️" onClose={onClose} wide>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {cats.map(([id, emoji, label]) => (
          <button key={id} className={`chip !rounded-xl !px-3 !py-1.5 text-xs ${cat === id ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white" : ""}`} onClick={() => setCat(id)}>
            {emoji} {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {cat === "food" && FOODS.map((f) => (
          <ItemCard key={f.id} emoji={f.emoji} name={f.name} sub={`Fome +${f.hunger}`} price={f.price} gems={f.gems} level={f.level} locked={level < f.level} actionLabel={t("buy", lang)} onAction={() => buy("food", f.id)} />
        ))}
        {cat === "wear" && WEAR.map((w) => (
          <ItemCard key={w.id} emoji={w.emoji} name={w.name} sub={w.slot === "hat" ? "Chapéu" : w.slot === "shirt" ? "Vestuário" : "Acessório"} price={w.price} gems={w.gems} level={w.level} locked={level < w.level} actionLabel={t("buy", lang)} onAction={() => buy("wear", w.id)} />
        ))}
        {cat === "toy" && TOYS.map((w) => (
          <ItemCard key={w.id} emoji={w.emoji} name={w.name} sub={`Alegria +${w.happy}`} price={w.price} level={w.level} locked={level < w.level} actionLabel={t("buy", lang)} onAction={() => buy("toy", w.id)} />
        ))}
        {cat === "furniture" && FURNITURE.map((w) => (
          <ItemCard key={w.id} emoji={w.emoji} name={w.name} sub={`Nv.${w.level}`} price={w.price} gems={w.gems} level={w.level} locked={level < w.level} actionLabel={t("buy", lang)} onAction={() => buy("furniture", w.id)} />
        ))}
        {cat === "pet" && SPECIES.map((p) => (
          <ItemCard key={p.id} emoji={p.emoji} name={p.name} sub={p.personality.split(",")[0]} price={p.price} gems={p.gems} level={p.level} locked={level < p.level} actionLabel={t("buy", lang)} onAction={() => buy("pet", p.id)} />
        ))}
      </div>
    </Panel>
  );
}

// ---------------- INVENTÁRIO ----------------
export function InventoryPanel({ onClose }: { onClose: () => void }) {
  const inv = useForge((s) => s.inventory);
  const useItem = useForge((s) => s.useItem);
  const equipWear = useForge((s) => s.equipWear);
  const startDecor = useForge((s) => s.startDecor);
  const roster = useForge((s) => s.roster);
  const activePet = useForge((s) => s.activePet);
  const clothes = roster[activePet]?.clothes;
  const lang = useForge((s) => s.settings.lang);
  const [cat, setCat] = useState<"all" | "food" | "toy" | "wear" | "furniture">("all");

  const entries = useMemo(() => {
    const list = Object.entries(inv).filter(([, n]) => n > 0);
    return list.filter(([id]) => {
      if (cat === "all") return true;
      if (cat === "food") return FOODS.some((f) => f.id === id);
      if (cat === "toy") return TOYS.some((f) => f.id === id);
      if (cat === "wear") return WEAR.some((f) => f.id === id);
      if (cat === "furniture") return FURNITURE.some((f) => f.id === id);
      return true;
    });
  }, [inv, cat]);

  return (
    <Panel title="Inventário" icon="🎒" onClose={onClose} wide>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(["all", "food", "toy", "wear", "furniture"] as const).map((c) => (
          <button key={c} className={`chip !rounded-xl !px-3 !py-1 text-[11px] ${cat === c ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white" : ""}`} onClick={() => setCat(c)}>
            {c === "all" ? "Todos" : c === "food" ? "🍎 Comidas" : c === "toy" ? "🧸 Brinquedos" : c === "wear" ? "👕 Roupas" : "🛋️ Móveis"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {entries.map(([id, n]) => {
          const food = FOODS.find((f) => f.id === id);
          const toy = TOYS.find((f) => f.id === id);
          const wear = WEAR.find((f) => f.id === id);
          const furn = FURNITURE.find((f) => f.id === id);
          const info = food ?? toy ?? wear ?? furn;
          if (!info) return null;
          const equipped = wear && clothes && Object.values(clothes).includes(wear.id);
          return (
            <div key={id} className="card-hover glass flex flex-col items-center gap-1.5 rounded-2xl p-3">
              <div className="text-3xl">{info.emoji}</div>
              <div className="text-xs font-extrabold text-white">{info.name} ×{n}</div>
              <div className="flex gap-1">
                {food && <button className="btn btn-forge !rounded-lg !px-3 !py-1 text-[10px]" onClick={() => useItem(id)}>{t("use", lang)}</button>}
                {toy && <button className="btn btn-forge !rounded-lg !px-3 !py-1 text-[10px]" onClick={() => useItem(id)}>{t("use", lang)}</button>}
                {wear && (
                  <button className={`btn ${equipped ? "btn-teal" : "btn-ghost"} !rounded-lg !px-3 !py-1 text-[10px]`} onClick={() => equipWear(wear.slot, equipped ? null : wear.id)}>
                    {equipped ? t("unequip", lang) : t("equip", lang)}
                  </button>
                )}
                {furn && <button className="btn btn-teal !rounded-lg !px-3 !py-1 text-[10px]" onClick={() => startDecor(id)}>{t("place", lang)}</button>}
              </div>
            </div>
          );
        })}
        {entries.length === 0 && <div className="col-span-full py-8 text-center text-sm font-bold text-white/40">Inventário vazio — visite a loja! 🛍️</div>}
      </div>
    </Panel>
  );
}

// ---------------- MISSÕES ----------------
export function MissionsPanel({ onClose }: { onClose: () => void }) {
  const daily = useForge((s) => s.daily);
  const weekly = useForge((s) => s.weekly);
  const claim = useForge((s) => s.claimMission);
  const lang = useForge((s) => s.settings.lang);
  const MissionList = ({ list, title }: { list: typeof daily.missions; title: string }) => (
    <div className="mb-4">
      <h3 className="mb-2 font-display text-sm font-bold text-white/80">{title}</h3>
      <div className="flex flex-col gap-2">
        {list.map((m) => {
          const done = m.progress >= m.target;
          return (
            <div key={m.id} className={`glass flex items-center gap-3 rounded-2xl p-3 ${m.claimed ? "opacity-50" : ""}`}>
              <span className="text-2xl">{m.claimed ? "✅" : done ? "🎯" : "📋"}</span>
              <div className="flex-1">
                <div className="text-xs font-extrabold text-white">{m.text}</div>
                <div className="bar-track mt-1.5 !h-2">
                  <div className="bar-fill bg-gradient-to-r from-teal-400 to-blue-500" style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }} />
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-white/50">
                  <span>{Math.min(m.progress, m.target)}/{m.target}</span>
                  <span className="text-amber-300">🪙 {m.coins}</span>
                  {m.gems ? <span className="text-sky-300">💎 {m.gems}</span> : null}
                  <span className="text-orange-300">✨ {m.xp} XP</span>
                </div>
              </div>
              <button
                className={`btn ${m.claimed ? "btn-ghost" : done ? "btn-forge" : "btn-ghost"} !rounded-xl !px-3 !py-1.5 text-[11px]`}
                disabled={m.claimed || !done}
                onClick={() => claim(m.id)}
              >
                {m.claimed ? "✓" : t("claim", lang)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
  return (
    <Panel title="Missões" icon="🎯" onClose={onClose}>
      <MissionList list={daily.missions} title="📅 Diárias" />
      <MissionList list={weekly.missions} title="📆 Semanais" />
    </Panel>
  );
}

// ---------------- CONQUISTAS ----------------
export function AchievementsPanel({ onClose }: { onClose: () => void }) {
  const unlocked = useForge((s) => s.achievements);
  const s = useForge.getState();
  void s;
  return (
    <Panel title="Conquistas" icon="🏆" onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {ACHIEVEMENTS.map((a) => {
          const got = unlocked.includes(a.id);
          return (
            <div key={a.id} className={`card-hover flex flex-col items-center gap-1 rounded-2xl p-3 text-center ${got ? "" : "opacity-45 grayscale"}`}>
              <div className="text-3xl">{got ? a.icon : "🔒"}</div>
              <div className="text-xs font-extrabold text-white">{a.name}</div>
              <div className="text-[10px] font-bold text-white/50">{a.desc}</div>
              {got && <span className="chip !py-0.5 text-[9px] text-emerald-300">+50 🪙</span>}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ---------------- PERFIL ----------------
export function ProfilePanel({ onClose }: { onClose: () => void }) {
  const profileName = useForge((s) => s.profileName);
  const level = useForge((s) => s.level);
  const coins = useForge((s) => s.coins);
  const gems = useForge((s) => s.gems);
  const roster = useForge((s) => s.roster);
  const activePet = useForge((s) => s.activePet);
  const stats = useForge((s) => s.stats);
  const achievements = useForge((s) => s.achievements);
  const playTime = useForge((s) => s.stats.playTime);
  const pet = roster[activePet];
  const hours = Math.floor(playTime / 3600);
  const mins = Math.floor((playTime % 3600) / 60);
  return (
    <Panel title="Perfil" icon="👤" onClose={onClose}>
      <div className="mb-4 flex items-center gap-4">
        <div className="anim-float flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-400 to-pink-500 text-4xl shadow-lg">
          {pet ? speciesEmoji(pet.species) : "🐰"}
        </div>
        <div>
          <div className="font-display text-xl font-bold text-white">{profileName}</div>
          <div className="text-xs font-bold text-white/50">Nível {level} · {hours}h {mins}m de jogo</div>
          <div className="mt-1 flex gap-1.5">
            <span className="chip text-amber-300">🪙 {coins}</span>
            <span className="chip text-sky-300">💎 {gems}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat icon="🏆" label="Conquistas" value={`${achievements.length}/${ACHIEVEMENTS.length}`} />
        <Stat icon="🐾" label="Pets" value={`${roster.length}`} />
        <Stat icon="🍖" label="Vezes alimentado" value={`${stats.fed}`} />
        <Stat icon="🛁" label="Banhos" value={`${stats.baths}`} />
        <Stat icon="🎮" label="Minijogos" value={`${stats.games}`} />
        <Stat icon="🏃" label="Distância" value={`${Math.round(stats.distance)}m`} />
      </div>
    </Panel>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="glass flex items-center gap-2 rounded-2xl p-3">
      <span className="text-xl">{icon}</span>
      <div>
        <div className="font-extrabold text-white">{value}</div>
        <div className="text-[10px] font-bold text-white/50">{label}</div>
      </div>
    </div>
  );
}

function speciesEmoji(id: string) {
  return SPECIES.find((p) => p.id === id)?.emoji ?? "🐰";
}

// ---------------- CONFIGURAÇÕES ----------------
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const settings = useForge((s) => s.settings);
  const setSetting = useForge((s) => s.setSetting);
  const openPanel = useForge((s) => s.openPanel);
  const resetGame = useForge((s) => s.resetGame);
  const lang = settings.lang as Lang;
  return (
    <Panel title="Configurações" icon="⚙️" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Toggle label={t("music", lang)} icon="🎵" value={settings.music} onChange={(v) => setSetting("music", v)} />
        <Toggle label={t("settings", lang) === "Configurações" ? "Efeitos sonoros" : "Sound effects"} icon="🔊" value={settings.sfx} onChange={(v) => setSetting("sfx", v)} />
        <Toggle label={t("notifications", lang)} icon="🔔" value={settings.notifications} onChange={(v) => setSetting("notifications", v)} />
        <Toggle label="Câmera com balanço" icon="📷" value={settings.cameraShake} onChange={(v) => setSetting("cameraShake", v)} />
        <div className="glass rounded-2xl p-3">
          <div className="mb-1.5 text-xs font-extrabold text-white/80">🎨 Qualidade gráfica</div>
          <div className="flex gap-1.5">
            {(["low", "medium", "high"] as const).map((q) => (
              <button key={q} className={`chip ${settings.quality === q ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white" : ""}`} onClick={() => setSetting("quality", q)}>
                {q === "low" ? "Baixa" : q === "medium" ? "Média" : "Alta"}
              </button>
            ))}
          </div>
        </div>
        <div className="glass rounded-2xl p-3">
          <div className="mb-1.5 flex justify-between text-xs font-extrabold text-white/80">
            <span>🖱️ Sensibilidade da câmera</span>
            <span className="text-white/50">{settings.sensitivity.toFixed(1)}</span>
          </div>
          <input type="range" min="0.4" max="2" step="0.1" value={settings.sensitivity} onChange={(e) => setSetting("sensitivity", parseFloat(e.target.value))} className="w-full" />
        </div>
        <div className="glass rounded-2xl p-3">
          <div className="mb-1.5 text-xs font-extrabold text-white/80">🌐 Idioma</div>
          <div className="flex gap-1.5">
            {(["pt", "en"] as const).map((l) => (
              <button key={l} className={`chip ${settings.lang === l ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white" : ""}`} onClick={() => setSetting("lang", l)}>
                {l === "pt" ? "🇧🇷 Português" : "🇬🇧 English"}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-ghost w-full !rounded-2xl" onClick={() => openPanel("update")}>🆕 Verificar atualizações</button>
        <button className="btn btn-ghost w-full !rounded-2xl" onClick={() => openPanel("admin")}>🛠️ Painel Admin</button>
        <button className="btn btn-danger w-full !rounded-2xl" onClick={() => { if (confirm("Apagar todo o progress e recomeçar?")) resetGame(); }}>🗑️ Apagar progresso</button>
      </div>
    </Panel>
  );
}

function Toggle({ label, icon, value, onChange }: { label: string; icon: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="glass flex items-center justify-between rounded-2xl p-3">
      <span className="text-xs font-extrabold text-white/80">{icon} {label}</span>
      <button
        className={`relative h-7 w-12 rounded-full transition-colors ${value ? "bg-gradient-to-r from-orange-400 to-pink-500" : "bg-white/15"}`}
        onClick={() => onChange(!value)}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${value ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}

// ---------------- CUSTOMIZAÇÃO ----------------
export function CustomizePanel({ onClose }: { onClose: () => void }) {
  const roster = useForge((s) => s.roster);
  const activePet = useForge((s) => s.activePet);
  const equipWear = useForge((s) => s.equipWear);
  const pet = roster[activePet];
  const [tab, setTab] = useState<"cor" | "roupas">("cor");
  if (!pet) return null;
  const ownedWear = WEAR.filter((w) => (useForge.getState().inventory[w.id] ?? 0) > 0);
  return (
    <Panel title="Personalizar" icon="🎨" onClose={onClose} wide>
      <div className="mb-3 flex gap-1.5">
        <button className={`chip !rounded-xl !px-3 !py-1.5 text-xs ${tab === "cor" ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white" : ""}`} onClick={() => setTab("cor")}>🎨 Cor</button>
        <button className={`chip !rounded-xl !px-3 !py-1.5 text-xs ${tab === "roupas" ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white" : ""}`} onClick={() => setTab("roupas")}>👕 Roupas</button>
      </div>
      {tab === "cor" && (
        <div className="flex flex-col gap-3">
          <ColorRow label="🐰 Pelagem" value={pet.fur} onChange={(c) => updatePetColor("fur", c)} colors={FUR_COLORS} />
          <ColorRow label="🤍 Barriga" value={pet.belly} onChange={(c) => updatePetColor("belly", c)} colors={FUR_COLORS} />
          <ColorRow label="👂 Orelhas" value={pet.ear} onChange={(c) => updatePetColor("ear", c)} colors={["#ffb7c5", "#f8bbd0", "#ffe0b2", "#c5cae9", "#b2dfdb", "#ffffff", "#ffcc80", "#ce93d8"]} />
          <ColorRow label="👀 Olhos" value={pet.eye} onChange={(c) => updatePetColor("eye", c)} colors={["#3e2723", "#1a237e", "#b71c1c", "#1b5e20", "#4a148c", "#004d40", "#263238", "#e65100"]} />
        </div>
      )}
      {tab === "roupas" && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {(["hat", "shirt", "acc"] as const).map((slot) => (
            <div key={slot} className="col-span-3 mb-1 text-xs font-extrabold text-white/60">{slot === "hat" ? "🧢 Chapéus" : slot === "shirt" ? "👕 Vestuário" : "🕶️ Acessórios"}</div>
          ))}
          {(["hat", "shirt", "acc"] as const).flatMap((slot) =>
            [null, ...ownedWear.filter((w) => w.slot === slot)].map((w) => {
              const equipped = w ? pet.clothes[slot] === w.id : !pet.clothes[slot];
              return (
                <button
                  key={`${slot}-${w?.id ?? "none"}`}
                  className={`card-hover flex flex-col items-center gap-1 rounded-2xl p-3 ${equipped ? "ring-2 ring-orange-400" : "opacity-80"}`}
                  onClick={() => equipWear(slot, w?.id ?? null)}
                >
                  <span className="text-2xl">{w?.emoji ?? "🚫"}</span>
                  <span className="text-[10px] font-extrabold text-white">{w?.name ?? "Nenhum"}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </Panel>
  );
}

function updatePetColor(key: "fur" | "belly" | "ear" | "eye", color: string) {
  const { roster, activePet } = useForge.getState();
  const roster2 = [...roster];
  roster2[activePet] = { ...roster2[activePet], [key]: color };
  useForge.setState({ roster: roster2 });
}

function ColorRow({ label, value, onChange, colors }: { label: string; value: string; onChange: (c: string) => void; colors: string[] }) {
  return (
    <div className="glass rounded-2xl p-3">
      <div className="mb-2 text-xs font-extrabold text-white/80">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {colors.map((c) => (
          <button
            key={c}
            className={`h-8 w-8 rounded-full border-2 transition-transform ${value === c ? "scale-110 border-white" : "border-white/20"}`}
            style={{ background: c }}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------- DECORAR ----------------
export function DecoratePanel({ onClose }: { onClose: () => void }) {
  const inv = useForge((s) => s.inventory);
  const placed = useForge((s) => s.placed);
  const startDecor = useForge((s) => s.startDecor);
  const removePlaced = useForge((s) => s.removePlaced);
  const furnInv = Object.entries(inv).filter(([id, n]) => n > 0 && FURNITURE.some((f) => f.id === id));
  return (
    <Panel title="Decorar Casa" icon="🔨" onClose={onClose} wide>
      <h3 className="mb-2 text-xs font-extrabold text-white/60">🛒 Móveis disponíveis</h3>
      {furnInv.length === 0 ? (
        <div className="mb-4 rounded-2xl border border-dashed border-white/15 p-4 text-center text-xs font-bold text-white/40">
          Compre móveis na Loja → aba Móveis
        </div>
      ) : (
        <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {furnInv.map(([id, n]) => {
            const f = FURNITURE.find((x) => x.id === id)!;
            return (
              <button key={id} className="card-hover glass flex flex-col items-center gap-1 rounded-2xl p-3" onClick={() => startDecor(id)}>
                <span className="text-2xl">{f.emoji}</span>
                <span className="text-[10px] font-extrabold text-white">{f.name} ×{n}</span>
                <span className="chip !py-0.5 text-[9px] text-teal-300">{t("place", "pt" as never)}</span>
              </button>
            );
          })}
        </div>
      )}
      <h3 className="mb-2 text-xs font-extrabold text-white/60">📍 Colocados ({placed.length})</h3>
      {placed.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-4 text-center text-xs font-bold text-white/40">Nada colocado ainda</div>
      ) : (
        <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto pr-1">
          {placed.map((p) => {
            const f = FURNITURE.find((x) => x.id === p.id);
            return (
              <div key={p.uid} className="glass flex items-center justify-between rounded-xl px-3 py-2">
                <span className="text-xs font-extrabold text-white">{f?.emoji} {f?.name}</span>
                <button className="btn btn-danger !rounded-lg !px-3 !py-1 text-[10px]" onClick={() => removePlaced(p.uid)}>{t("remove", "pt" as never)}</button>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

// ---------------- MUNDO ----------------
export function WorldPanel({ onClose }: { onClose: () => void }) {
  const unlocked = useForge((s) => s.unlockedAreas);
  const teleport = useForge((s) => s.teleport);
  const notifyMsg = useForge((s) => s.notifyMsg);
  return (
    <Panel title="Mundo Forge" icon="🌎" onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {AREAS.map((a) => {
          const open = unlocked.includes(a.id);
          return (
            <button
              key={a.id}
              className={`card-hover flex flex-col items-center gap-1 rounded-2xl p-4 ${open ? "" : "opacity-50"}`}
              onClick={() => {
                if (!open) { notifyMsg("🔒", `Alcance o nível ${a.level}`); return; }
                teleport(a.x, a.z, a.id);
                onClose();
              }}
            >
              <span className="text-3xl">{a.emoji}</span>
              <span className="text-xs font-extrabold text-white">{a.name}</span>
              {!open && <span className="text-[10px] font-bold text-white/40">🔒 Nível {a.level}</span>}
              {open && <span className="text-[10px] font-bold text-teal-300">Viajar →</span>}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[11px] font-bold text-white/40">Dica: leve seu pet pelo jardim e parque para ganhar XP!</p>
    </Panel>
  );
}

// ---------------- PETS ----------------
export function PetsPanel({ onClose }: { onClose: () => void }) {
  const roster = useForge((s) => s.roster);
  const activePet = useForge((s) => s.activePet);
  const switchPet = useForge((s) => s.switchPet);
  const level = useForge((s) => s.level);
  return (
    <Panel title="Meus Pets" icon="🐾" onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {roster.map((p, i) => (
          <button key={p.uid} className={`card-hover flex flex-col items-center gap-1 rounded-2xl p-4 ${i === activePet ? "ring-2 ring-orange-400" : ""}`} onClick={() => { switchPet(i); onClose(); }}>
            <span className="text-4xl">{speciesEmoji(p.species)}</span>
            <span className="text-xs font-extrabold text-white">{p.name}</span>
            <span className="text-[10px] font-bold text-white/50">{SPECIES.find((s) => s.id === p.species)?.name}</span>
            {i === activePet && <span className="chip !py-0.5 text-[9px] text-orange-300">Ativo</span>}
          </button>
        ))}
        <div className="col-span-2 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 p-4 text-center text-[11px] font-bold text-white/40 sm:col-span-4">
          Adote novos pets na 🛍️ Loja → aba Pets (nível {level}+)
        </div>
      </div>
    </Panel>
  );
}

// ---------------- RANKING ----------------
export function RankingPanel({ onClose }: { onClose: () => void }) {
  const level = useForge((s) => s.level);
  const xp = useForge((s) => s.xp);
  const name = useForge((s) => s.profileName);
  const lang: Lang = useForge((s) => s.settings.lang);
  const bots = useMemo(() => {
    const names = ["ForgeMaster", "PetLoverBR", "CoelhoZeloso", "GatoFofo", "DragoonBR", "PandaKing", "UnicornioTop", "HamsterPro"];
    return names.map((n, i) => ({ name: n, level: 12 - i, xp: (12 - i) * 80 + i * 13, bot: true }));
  }, []);
  const all = [...bots, { name: name || "Você", level, xp, bot: false }].sort((a, b) => b.level - a.level || b.xp - a.xp);
  return (
    <Panel title="Ranking" icon="🏅" onClose={onClose}>
      <div className="mb-3 flex gap-1.5">
        {["Global", "Semanal", "Mensal"].map((c, i) => (
          <span key={c} className={`chip ${i === 0 ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white" : ""}`}>{c}</span>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        {all.map((p, i) => (
          <div key={i} className={`glass flex items-center gap-3 rounded-xl px-3 py-2 ${!p.bot ? "ring-1 ring-orange-400/60" : ""}`}>
            <span className="w-6 text-center font-display text-sm font-bold text-white/60">{i + 1}º</span>
            <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🎮"}</span>
            <span className="flex-1 text-xs font-extrabold text-white">{p.name}{!p.bot ? " (você)" : ""}</span>
            <span className="text-[11px] font-bold text-white/60">⭐ {p.level} · {p.xp} XP</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[10px] font-bold text-white/40">Modo online: sincronização ativa quando houver internet 🌐</p>
      <span className="hidden">{t("level", lang)}</span>
    </Panel>
  );
}

// ---------------- RECOMPENSA DIÁRIA ----------------
export function DailyPanel({ onClose }: { onClose: () => void }) {
  const dr = useForge((s) => s.dailyReward);
  const claimDaily = useForge((s) => s.claimDaily);
  const today = new Date().toISOString().slice(0, 10);
  const claimed = dr.last === today;
  const nextIdx = (dr.streak) % 7;
  return (
    <Panel title="Recompensa Diária" icon="🎁" onClose={onClose}>
      <div className="mb-3 text-center text-xs font-bold text-white/60">
        Sequência: {dr.streak} dia{dr.streak === 1 ? "" : "s"} 🔥
      </div>
      <div className="mb-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {DAILY_REWARDS.map((r, i) => {
          const done = dr.last === today ? i < nextIdx : i < (dr.streak % 7);
          const isNext = !claimed && i === nextIdx;
          return (
            <div key={r.day} className={`flex flex-col items-center gap-1 rounded-2xl p-2.5 ${isNext ? "anim-pulse-glow bg-gradient-to-b from-orange-500/30 to-pink-500/30 ring-2 ring-orange-400" : done ? "bg-white/5 opacity-50" : "glass"}`}>
              <span className="text-2xl">{r.emoji}</span>
              <span className="text-[9px] font-extrabold text-white/70">Dia {r.day}</span>
            </div>
          );
        })}
      </div>
      <button className={`btn w-full !rounded-2xl !py-3 text-sm ${claimed ? "btn-ghost" : "btn-forge"}`} disabled={claimed} onClick={() => { claimDaily(); onClose(); }}>
        {claimed ? "✅ Resgatado hoje — volte amanhã!" : `🎁 Resgatar Dia ${nextIdx + 1}`}
      </button>
    </Panel>
  );
}

// ---------------- ADMIN ----------------
export function AdminPanel({ onClose }: { onClose: () => void }) {
  const adminGrant = useForge((s) => s.adminGrant);
  const setAnnouncement = useForge((s) => s.setAnnouncement);
  const announcement = useForge((s) => s.announcement);
  const [coins, setCoins] = useState("1000");
  const [gems, setGems] = useState("10");
  const [msg, setMsg] = useState("");
  return (
    <Panel title="Painel Admin" icon="🛠️" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="glass rounded-2xl p-3">
          <div className="mb-2 text-xs font-extrabold text-white/80">💰 Conceder recursos</div>
          <div className="flex gap-2">
            <input type="number" value={coins} onChange={(e) => setCoins(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white outline-none" placeholder="Coins" />
            <input type="number" value={gems} onChange={(e) => setGems(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white outline-none" placeholder="Gems" />
            <button className="btn btn-forge !rounded-xl !px-4 text-xs" onClick={() => { adminGrant(parseInt(coins) || 0, parseInt(gems) || 0); }}>OK</button>
          </div>
        </div>
        <div className="glass rounded-2xl p-3">
          <div className="mb-2 text-xs font-extrabold text-white/80">📢 Comunicado</div>
          <div className="flex gap-2">
            <input value={msg} onChange={(e) => setMsg(e.target.value)} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white outline-none" placeholder="Mensagem para todos..." />
            <button className="btn btn-teal !rounded-xl !px-4 text-xs" onClick={() => { setAnnouncement(msg); setMsg(""); }}>OK</button>
          </div>
          {announcement && <div className="mt-2 text-[11px] font-bold text-amber-300">Atual: {announcement}</div>}
        </div>
        <div className="glass rounded-2xl p-3 text-[11px] font-bold text-white/50">
          Versão atual: v{CURRENT_VERSION} · Build Forge Studios
        </div>
      </div>
    </Panel>
  );
}

// ---------------- ATUALIZAÇÃO ----------------
export function UpdatePanel({ onClose }: { onClose: () => void }) {
  const seenUpdate = useForge((s) => s.seenUpdate);
  const setSettingSeen = useForge((s) => s.setSetting);
  return (
    <Panel title="Atualização" icon="🆕" onClose={onClose}>
      <div className="mb-3 text-center">
        <div className="font-display text-lg font-bold text-white">{UPDATE_NOTES.title}</div>
        <div className="text-xs font-bold text-white/50">Versão {UPDATE_NOTES.version}</div>
      </div>
      <div className="mb-4 flex flex-col gap-2">
        {UPDATE_NOTES.news.map((n, i) => (
          <div key={i} className="glass rounded-xl px-3 py-2 text-xs font-bold text-white/85">{n}</div>
        ))}
      </div>
      <button
        className="btn btn-forge w-full !rounded-2xl"
        onClick={() => { setSettingSeen("notifications", useForge.getState().settings.notifications); useForge.setState({ seenUpdate: UPDATE_NOTES.version }); onClose(); }}
      >
        {seenUpdate === UPDATE_NOTES.version ? "✅ Atualizado" : "⬇️ Instalar atualização"}
      </button>
      <p className="mt-2 text-center text-[10px] font-bold text-white/40">Seu progresso nunca será apagado 💾</p>
    </Panel>
  );
}

// ---------------- MINIJOGOS (menu) ----------------
export function MinigamesPanel({ onClose, onLaunch }: { onClose: () => void; onLaunch: (id: string) => void }) {
  const games = [
    { id: "collector", emoji: "🪙", name: "Coletor de Moedas", desc: "Cole moedas pelo pátio!", color: "from-amber-400 to-orange-500" },
    { id: "race", emoji: "🏁", name: "Corrida", desc: "Desvie dos obstáculos!", color: "from-sky-400 to-blue-500" },
    { id: "targets", emoji: "🎯", name: "Alvos", desc: "Acerte o máximo que conseguir!", color: "from-pink-400 to-rose-500" },
    { id: "memory", emoji: "🧠", name: "Memória", desc: "Encontre os pares!", color: "from-violet-400 to-purple-500" },
  ];
  return (
    <Panel title="Minijogos" icon="🎮" onClose={onClose} wide>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {games.map((g) => (
          <button key={g.id} className="card-hover glass flex items-center gap-3 rounded-2xl p-4 text-left" onClick={() => { onClose(); onLaunch(g.id); }}>
            <span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${g.color} text-2xl shadow-lg`}>{g.emoji}</span>
            <div>
              <div className="font-display text-sm font-bold text-white">{g.name}</div>
              <div className="text-[11px] font-bold text-white/50">{g.desc}</div>
              <div className="mt-1 text-[10px] font-extrabold text-amber-300">Recompensas: 🪙 + ✨ XP</div>
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

// ---------------- ALIMENTAÇÃO ----------------
export function FoodPanel({ onClose }: { onClose: () => void }) {
  const inv = useForge((s) => s.inventory);
  const feed = useForge((s) => s.feed);
  const buy = useForge((s) => s.buy);
  const level = useForge((s) => s.level);
  return (
    <Panel title="Alimentar" icon="🍎" onClose={onClose}>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {Object.entries(inv).filter(([id, n]) => n > 0 && FOODS.some((f) => f.id === id)).map(([id, n]) => {
          const f = FOODS.find((x) => x.id === id)!;
          return (
            <button key={id} className="card-hover glass flex flex-col items-center gap-1 rounded-2xl p-3" onClick={() => feed(id)}>
              <span className="text-3xl">{f.emoji}</span>
              <span className="text-[10px] font-extrabold text-white">{f.name} ×{n}</span>
            </button>
          );
        })}
      </div>
      <h3 className="mb-2 text-xs font-extrabold text-white/60">🛒 Comprar comida</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FOODS.filter((f) => level >= f.level).map((f) => (
          <button key={f.id} className="card-hover glass flex flex-col items-center gap-1 rounded-2xl p-2.5" onClick={() => buy("food", f.id)}>
            <span className="text-2xl">{f.emoji}</span>
            <span className="text-[10px] font-extrabold text-white">{f.name}</span>
            <span className="text-[10px] font-bold text-amber-300">🪙 {f.price}</span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

// ---------------- MEMÓRIA (DOM) ----------------
export function MemoryGame({ onClose }: { onClose: () => void }) {
  const EMOJIS = ["🐰", "🦊", "🐼", "🐲", "🦄", "🐱", "🐶", "🐹"];
  const [cards, setCards] = useState<{ id: number; emoji: string; up: boolean; done: boolean }[]>(() =>
    [...EMOJIS, ...EMOJIS].map((e, i) => ({ id: i, emoji: e, up: false, done: false })).sort(() => Math.random() - 0.5)
  );
  const [sel, setSel] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const lock = useRef(false);

  const pick = (i: number) => {
    if (lock.current || cards[i].up || cards[i].done) return;
    const next = cards.map((c, j) => (j === i ? { ...c, up: true } : c));
    setCards(next);
    const ns = [...sel, i];
    setSel(ns);
    if (ns.length === 2) {
      setMoves((m) => m + 1);
      lock.current = true;
      setTimeout(() => {
        const [a, b] = ns;
        if (next[a].emoji === next[b].emoji) {
          setCards((cs) => cs.map((c, j) => (j === a || j === b ? { ...c, done: true, up: true } : c)));
          sound.pop();
        } else {
          setCards((cs) => cs.map((c, j) => (j === a || j === b ? { ...c, up: false } : c)));
        }
        setSel([]);
        lock.current = false;
      }, 650);
    }
  };

  useEffect(() => {
    if (cards.every((c) => c.done) && cards.length > 0 && !won) {
      setWon(true);
      const s = useForge.getState();
      const coins = 80;
      s.addCoins(coins);
      s.addXP(50);
      s.stats.games++;
      s.stats.wins++;
      s.notifyMsg("🧠", `Memória: +${coins} moedas!`);
      sound.success();
    }
  }, [cards, won]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
      <div className="glass anim-pop w-full max-w-md rounded-3xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">🧠 Memória — {moves} jogadas</h2>
          <button className="btn btn-ghost h-9 w-9 !rounded-xl" onClick={onClose}>✕</button>
        </div>
        {won && (
          <div className="anim-pop mb-3 rounded-2xl bg-gradient-to-r from-emerald-400/20 to-teal-400/20 p-3 text-center text-sm font-extrabold text-emerald-300">
            🎉 Você venceu! +80 moedas
          </div>
        )}
        <div className="grid grid-cols-4 gap-2">
          {cards.map((c, i) => (
            <button
              key={c.id}
              className={`flex aspect-square items-center justify-center rounded-2xl text-3xl transition-all ${c.up || c.done ? "bg-white/90" : "bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-105"}`}
              onClick={() => pick(i)}
            >
              {c.up || c.done ? c.emoji : "❓"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
