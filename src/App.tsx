// ============================================================
// FORGE PET — App principal (roteador de telas)
// Forge Studios
// ============================================================
import { useEffect, useState } from "react";
import { useForge, FUR_COLORS } from "./state/store";
import { SPECIES, CURRENT_VERSION, t, type SpeciesId } from "./data/content";
import { sound } from "./audio/sound";
import MenuScene from "./game/MenuScene";
import { GameCanvas } from "./game/House";
import { MiniGameCanvas } from "./game/MiniGames";
import { MemoryGame } from "./ui/Panels";
import {
  TopBar, NeedsPanel, PetBubble, Toasts, InteractButton,
  DecorControls, SickBanner, MobileButtons, MenuButtons, Announcement, MiniHudOverlay,
} from "./ui/HUD";
import {
  ShopPanel, InventoryPanel, MissionsPanel, AchievementsPanel,
  ProfilePanel, SettingsPanel, CustomizePanel, DecoratePanel,
  FoodPanel, MinigamesPanel, DailyPanel, RankingPanel, AdminPanel,
  UpdatePanel, WorldPanel, PetsPanel,
} from "./ui/Panels";

export default function App() {
  const screen = useForge((s) => s.screen);
  const panel = useForge((s) => s.panel);
  const settings = useForge((s) => s.settings);
  const roster = useForge((s) => s.roster);
  const activePet = useForge((s) => s.activePet);
  const [miniGame, setMiniGame] = useState<string | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [splashStep, setSplashStep] = useState(0);

  // splash inicial
  useEffect(() => {
    if (screen !== "splash") return;
    const t1 = setTimeout(() => setSplashStep(1), 1800);
    const t2 = setTimeout(() => useForge.getState().setScreen("title"), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [screen]);

  // tick do jogo
  useEffect(() => {
    if (screen !== "game") return;
    const iv = setInterval(() => useForge.getState().tick(), 1000);
    return () => clearInterval(iv);
  }, [screen]);

  // sincroniza áudio
  useEffect(() => {
    sound.setSfx(settings.sfx);
    sound.setMusic(settings.music);
  }, [settings.sfx, settings.music]);

  // primeira interação desbloqueia áudio
  useEffect(() => {
    const unlock = () => sound.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // modal de atualização
  useEffect(() => {
    if (screen === "menu" && useForge.getState().seenUpdate !== CURRENT_VERSION) {
      const t = setTimeout(() => setShowUpdate(true), 900);
      return () => clearTimeout(t);
    }
  }, [screen]);

  const pet = roster[activePet];
  const lang = settings.lang;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* ===== SPLASH ===== */}
      {screen === "splash" && (
        <div className="relative flex h-full w-full flex-col items-center justify-center bg-[#0b0e1a]">
          <div className="anim-pop flex flex-col items-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-400 to-pink-500 shadow-2xl shadow-orange-500/40">
              <span className="text-4xl">🔥</span>
            </div>
            <div className="font-display text-3xl font-bold tracking-[0.3em] text-white sm:text-4xl">FORGE</div>
            <div className="font-display text-sm font-medium tracking-[0.5em] text-orange-300">STUDIOS</div>
          </div>
          {splashStep === 1 && (
            <div className="anim-fade-up absolute bottom-10 text-xs font-bold text-white/40">
              Pet Virtual 3D · v{CURRENT_VERSION}
            </div>
          )}
        </div>
      )}

      {/* ===== TELA DE TÍTULO ===== */}
      {screen === "title" && (
        <div className="relative h-full w-full">
          <MenuScene />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="anim-pop text-center">
              <h1 className="shine-text font-display text-6xl font-bold sm:text-8xl">FORGE PET</h1>
              <p className="mt-2 text-sm font-bold text-white/60 sm:text-base">Um pet virtual 3D da Forge Studios</p>
            </div>
            <button
              className="btn btn-forge anim-bubble pointer-events-auto mt-10 !rounded-full !px-10 !py-4 text-lg"
              onClick={() => {
                sound.unlock();
                const state = useForge.getState();
                state.setScreen(state.roster.length > 0 ? "menu" : "create");
              }}
            >
              {roster.length > 0 ? "🐾 TOQUE PARA COMEÇAR" : "🐾 CRIAR MEU PET"}
            </button>
            {useForge.getState().roster.length > 0 && (
              <button
                className="btn btn-ghost pointer-events-auto mt-3 !rounded-full !px-6 !py-2 text-xs"
                onClick={() => useForge.getState().setScreen("create")}
              >
                ✨ Novo pet
              </button>
            )}
          </div>
          <div className="absolute bottom-3 w-full text-center text-[10px] font-bold text-white/30">
            🐰 Cuide · Brincar · Explore · Colecione — funciona offline 💾
          </div>
        </div>
      )}

      {/* ===== CRIAÇÃO DE PERFIL ===== */}
      {screen === "create" && <CreateScreen />}

      {/* ===== MENU PRINCIPAL ===== */}
      {screen === "menu" && (
        <div className="relative h-full w-full">
          <MenuScene />
          <Announcement />
          <div className="absolute inset-y-0 left-0 flex w-full flex-col justify-center gap-1.5 p-4 sm:w-80 sm:p-6">
            <div className="anim-pop mb-2">
              <div className="font-display text-2xl font-bold text-white sm:text-3xl">FORGE PET</div>
              <div className="text-[11px] font-bold text-white/50">
                {pet ? `${pet.name} · ${SPECIES.find((s) => s.id === pet.species)?.name}` : "Bem-vindo!"}
              </div>
            </div>
            <MenuBtn icon="▶️" label={pet ? t("startGame", lang) : "Criar meu pet"} primary onClick={() => { sound.click(); const state = useForge.getState(); state.setScreen(state.roster.length > 0 ? "game" : "create"); }} />
            <MenuBtn icon="🐾" label={t("myPet", lang)} onClick={() => useForge.getState().openPanel("pets")} />
            <MenuBtn icon="🏠" label={t("myHouse", lang)} onClick={() => useForge.getState().openPanel("decorate")} />
            <MenuBtn icon="🌎" label={t("world", lang)} onClick={() => useForge.getState().openPanel("world")} />
            <MenuBtn icon="🛍️" label={t("shop", lang)} onClick={() => useForge.getState().openPanel("shop")} />
            <MenuBtn icon="🎮" label={t("games", lang)} onClick={() => useForge.getState().openPanel("minigames")} />
            <MenuBtn icon="🎯" label={t("missions", lang)} onClick={() => useForge.getState().openPanel("missions")} />
            <MenuBtn icon="🏆" label={t("achievements", lang)} onClick={() => useForge.getState().openPanel("achievements")} />
            <MenuBtn icon="👤" label={t("profile", lang)} onClick={() => useForge.getState().openPanel("profile")} />
            <MenuBtn icon="⚙️" label={t("settings", lang)} onClick={() => useForge.getState().openPanel("settings")} />
          </div>
        </div>
      )}

      {/* ===== JOGO ===== */}
      {screen === "game" && (
        <div className="relative h-full w-full">
          <GameCanvas />
          <TopBar />
          <NeedsPanel />
          <PetBubble />
          <SickBanner />
          <InteractButton />
          <DecorControls />
          <JoystickHack />
          <MobileButtons />
          <MenuButtons />
          <Toasts />
          <Announcement />
          {!miniGame && panel === "none" && (
            <div className="pointer-events-none absolute bottom-1 left-1/2 z-10 -translate-x-1/2 text-[9px] font-bold text-white/25 sm:bottom-2">
              WASD/Setas mover · Shift correr · Espaço pular · E interagir · Arraste para girar a câmera
            </div>
          )}
        </div>
      )}

      {/* ===== MINIJOGOS ===== */}
      {miniGame && miniGame !== "memory" && (
        <div className="relative h-full w-full">
          <MiniGameCanvas type={miniGame as "collector" | "race" | "targets"} />
          <button
            className="btn btn-ghost absolute right-3 top-3 z-20 !rounded-xl !px-4 !py-2 text-xs"
            onClick={() => { setMiniGame(null); useForge.getState().closePanel(); }}
          >
            ✕ Sair do minijogo
          </button>
        </div>
      )}
      {miniGame === "memory" && <MemoryGame onClose={() => setMiniGame(null)} />}

      {/* ===== PAINÉIS ===== */}
      {panel === "shop" && <ShopPanel onClose={() => useForge.getState().closePanel()} />}
      {panel === "inventory" && <InventoryPanel onClose={() => useForge.getState().closePanel()} />}
      {panel === "missions" && <MissionsPanel onClose={() => useForge.getState().closePanel()} />}
      {panel === "achievements" && <AchievementsPanel onClose={() => useForge.getState().closePanel()} />}
      {panel === "profile" && <ProfilePanel onClose={() => useForge.getState().closePanel()} />}
      {panel === "settings" && <SettingsPanel onClose={() => useForge.getState().closePanel()} />}
      {panel === "customize" && <CustomizePanel onClose={() => useForge.getState().closePanel()} />}
      {panel === "wardrobe" && <CustomizePanel onClose={() => useForge.getState().closePanel()} />}
      {panel === "decorate" && <DecoratePanel onClose={() => useForge.getState().closePanel()} />}
      {panel === "food" && <FoodPanel onClose={() => useForge.getState().closePanel()} />}
      {panel === "minigames" && <MinigamesPanel onClose={() => useForge.getState().closePanel()} onLaunch={(id) => setMiniGame(id)} />}
      {panel === "daily" && <DailyPanel onClose={() => useForge.getState().closePanel()} />}
      {panel === "ranking" && <RankingPanel onClose={() => useForge.getState().closePanel()} />}
      {panel === "admin" && <AdminPanel onClose={() => useForge.getState().closePanel()} />}
      {panel === "world" && <WorldPanel onClose={() => useForge.getState().closePanel()} />}
      {panel === "pets" && <PetsPanel onClose={() => useForge.getState().closePanel()} />}
      {panel === "update" && <UpdatePanel onClose={() => { setShowUpdate(false); useForge.getState().closePanel(); }} />}

      {showUpdate && panel === "none" && (
        <UpdatePanel onClose={() => setShowUpdate(false)} />
      )}
    </div>
  );
}

function MenuBtn({ icon, label, onClick, primary }: { icon: string; label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      className={`btn ${primary ? "btn-forge" : "btn-ghost"} anim-fade-up !w-full !justify-start !rounded-2xl !px-4 !py-2.5 text-left text-sm`}
      onClick={onClick}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}

// joystick (importado do HUD)
import { Joystick } from "./ui/HUD";
function JoystickHack() {
  return <Joystick />;
}

// ============ TELA DE CRIAÇÃO ============
const NAMES = ["Mochi", "Bolinha", "Pipoca", "Nuvem", "Mel", "Pip", "Luna", "Thor", "Fofura", "Biscuit"];

function CreateScreen() {
  const [name, setName] = useState("Jogador");
  const [petName, setPetName] = useState(NAMES[Math.floor(Math.random() * NAMES.length)]);
  const [species, setSpecies] = useState("rabbit");
  const [fur, setFur] = useState("#f5f5f5");
  const [belly, setBelly] = useState("#ffffff");
  const [ear, setEar] = useState("#ffb7c5");
  const [eye, setEye] = useState("#3e2723");
  const createProfile = useForge((s) => s.createProfile);
  const setScreen = useForge((s) => s.setScreen);

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <MenuScene />
      <div className="relative mx-auto flex min-h-full w-full max-w-lg flex-col items-center justify-center gap-4 p-4">
        <div className="anim-pop text-center">
          <div className="font-display text-3xl font-bold text-white">Crie seu Pet! 🐰</div>
          <div className="text-xs font-bold text-white/50">Escolha o companheiro da Forge Studios</div>
        </div>

        <div className="glass w-full rounded-3xl p-4">
          <label className="mb-1 block text-[11px] font-extrabold text-white/60">Nome do jogador</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-orange-400"
            placeholder="Seu nome"
          />
          <label className="mb-1 block text-[11px] font-extrabold text-white/60">Nome do pet</label>
          <input
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            maxLength={16}
            className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-orange-400"
            placeholder="Nome do pet"
          />
          <label className="mb-1 block text-[11px] font-extrabold text-white/60">Espécie</label>
          <div className="mb-3 grid grid-cols-4 gap-1.5">
            {SPECIES.map((sp) => (
              <button
                key={sp.id}
                className={`flex flex-col items-center gap-0.5 rounded-2xl border p-2 transition-all ${species === sp.id ? "border-orange-400 bg-orange-500/20" : "border-white/10 bg-white/5"}`}
                onClick={() => { setSpecies(sp.id); sound.click(); }}
              >
                <span className="text-2xl">{sp.emoji}</span>
                <span className="text-[9px] font-extrabold text-white/80">{sp.name}</span>
              </button>
            ))}
          </div>
          <div className="text-center text-[10px] font-bold text-white/50">
            {SPECIES.find((s) => s.id === species)?.personality}
          </div>
        </div>

        <div className="glass w-full rounded-3xl p-4">
          <ColorRow label="🐰 Pelagem" value={fur} onChange={setFur} />
          <ColorRow label="🤍 Barriga" value={belly} onChange={setBelly} />
          <ColorRow label="👂 Orelhas" value={ear} onChange={setEar} />
          <ColorRow label="👀 Olhos" value={eye} onChange={setEye} />
        </div>

        <button
          className="btn btn-forge w-full !rounded-2xl !py-4 text-base"
          disabled={!name.trim()}
          onClick={() => {
            createProfile(name.trim() || "Jogador", species as SpeciesId, fur, belly, ear, eye, petName.trim() || "Mochi");
            sound.success();
          }}
        >
          🐾 ADOTAR {SPECIES.find((s) => s.id === species)?.name.toUpperCase()}
        </button>
        <button className="text-xs font-bold text-white/40 underline" onClick={() => setScreen("title")}>
          Voltar
        </button>
      </div>
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (c: string) => void }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <span className="w-20 text-[11px] font-extrabold text-white/70">{label}</span>
      <div className="flex flex-1 flex-wrap gap-1">
        {FUR_COLORS.slice(0, 8).map((c) => (
          <button
            key={c}
            className={`h-6 w-6 rounded-full border-2 ${value === c ? "scale-110 border-white" : "border-white/20"}`}
            style={{ background: c }}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
    </div>
  );
}



