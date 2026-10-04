// ============================================================
// FORGE PET — Store global (zustand + persist)
// ============================================================
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  SPECIES, FOODS, WEAR, TOYS, FURNITURE,
  DAILY_MISSIONS, WEEKLY_MISSIONS, ACHIEVEMENTS, DAILY_REWARDS, AREAS,
  type SpeciesId, type SlotId, type FoodInfo, type WearInfo,
  type ToyInfo, type FurnitureInfo, type SpeciesInfo,
} from "../data/content";
import { sound } from "../audio/sound";

export type Screen = "splash" | "title" | "create" | "menu" | "game";
export type PanelId =
  | "none" | "shop" | "inventory" | "missions" | "achievements"
  | "profile" | "settings" | "customize" | "wardrobe" | "decorate"
  | "food" | "minigames" | "daily" | "ranking" | "admin" | "update" | "world" | "pets";

export interface Clothes { hat: string | null; shirt: string | null; acc: string | null; }

export interface RosterPet {
  uid: string; name: string; species: SpeciesId;
  fur: string; belly: string; ear: string; eye: string;
  clothes: Clothes;
}

export interface Needs {
  health: number; hunger: number; thirst: number;
  energy: number; happiness: number; hygiene: number; sleep: number;
}

export interface Mission {
  id: string; text: string; type: string; target: number;
  progress: number; coins: number; gems: number; xp: number; claimed: boolean;
}

export interface PlacedItem { uid: string; id: string; x: number; z: number; rot: number; }

export interface PetStats {
  fed: number; baths: number; games: number; wins: number; plays: number;
  coinsEarned: number; distance: number; sleeps: number; heals: number;
  walks: number; playTime: number;
}

export interface Settings {
  music: boolean; sfx: boolean; quality: "low" | "medium" | "high";
  sensitivity: number; notifications: boolean; lang: "pt" | "en"; cameraShake: boolean;
}

export interface NotifyMsg { id: number; icon: string; text: string; }

interface ForgeState {
  screen: Screen;
  panel: PanelId;
  profileName: string;
  roster: RosterPet[];
  activePet: number;
  coins: number;
  gems: number;
  xp: number;
  level: number;
  needs: Needs;
  sick: boolean;
  sleeping: boolean;
  inventory: Record<string, number>;
  placed: PlacedItem[];
  daily: { date: string; missions: Mission[] };
  weekly: { week: string; missions: Mission[] };
  achievements: string[];
  dailyReward: { last: string | null; streak: number };
  visitedAreas: string[];
  unlockedAreas: string[];
  time: { hour: number; day: number };
  weather: "sun" | "cloud" | "rain" | "snow";
  area: string;
  stats: PetStats;
  settings: Settings;
  pos: { x: number; z: number };
  // transientes
  bubble: { text: string; until: number } | null;
  bubbleKey: number;
  toasts: NotifyMsg[];
  anim: string;
  animUntil: number;
  aiMode: boolean;
  decorTarget: PlacedItem | null;
  decorRot: number;
  said: Record<string, boolean>;
  notifiedMissions: string[];
  seenUpdate: string;
  announcement: string;

  setScreen: (s: Screen) => void;
  openPanel: (p: PanelId) => void;
  closePanel: () => void;
  createProfile: (name: string, species: SpeciesId, fur: string, belly: string, ear: string, eye: string, petName?: string) => void;
  resetGame: () => void;
  tick: () => void;
  setBubble: (text: string, secs?: number) => void;
  notifyMsg: (icon: string, text: string) => void;
  addCoins: (n: number) => void;
  addGems: (n: number) => void;
  spend: (coins: number, gems: number) => boolean;
  addXP: (n: number) => void;
  feed: (foodId: string) => void;
  drink: () => void;
  startBath: () => void;
  toggleSleep: () => void;
  playToy: (toyId: string) => void;
  watchTV: () => void;
  heal: () => void;
  buy: (kind: "food" | "wear" | "toy" | "furniture" | "pet", id: string) => void;
  equipWear: (slot: SlotId, id: string | null) => void;
  useItem: (id: string) => void;
  adoptPet: (speciesId: SpeciesId) => void;
  switchPet: (i: number) => void;
  startDecor: (id: string) => void;
  updateDecorPos: (x: number, z: number) => void;
  rotateDecor: () => void;
  confirmDecor: () => void;
  cancelDecor: () => void;
  removePlaced: (uid: string) => void;
  teleport: (x: number, z: number, areaId?: string) => void;
  walkArea: (areaId: string) => void;
  setAI: (b: boolean) => void;
  claimDaily: () => void;
  claimMission: (id: string) => void;
  missionEvent: (type: string, amount?: number) => void;
  grantAchievement: (id: string) => void;
  evaluateAchievements: () => void;
  setSetting: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
  setWeather: (w: "sun" | "cloud" | "rain" | "snow") => void;
  adminGrant: (coins: number, gems: number) => void;
  setAnnouncement: (s: string) => void;
  checkUnlocks: () => void;
  setPetPos: (x: number, z: number) => void;
}

// ---------- helpers ----------
function todayStr() { return new Date().toISOString().slice(0, 10); }
function weekStr() {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 1);
  const w = Math.ceil((((d.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${w}`;
}
function xpForLevel(l: number) { return 80 + (l - 1) * 60; }
function uid() { return Math.random().toString(36).slice(2, 9); }
const clamp = (v: number, a = 0, b = 100) => Math.max(a, Math.min(b, v));

const DEFAULT_NEEDS: Needs = { health: 100, hunger: 85, thirst: 85, energy: 100, happiness: 80, hygiene: 90, sleep: 90 };

export const FUR_COLORS = [
  "#f5f5f5", "#c8a27a", "#8d6e63", "#5d4037", "#ffb74d", "#90caf9",
  "#f48fb1", "#aed581", "#b39ddb", "#4dd0e1", "#e57373", "#263238",
];

function buildMissions(tpl: typeof DAILY_MISSIONS): Mission[] {
  return tpl.map((m) => ({ ...m, gems: m.gems ?? 0, progress: 0, claimed: false }));
}

function defaultState(): Partial<ForgeState> {
  return {
    profileName: "",
    roster: [],
    activePet: 0,
    coins: 150,
    gems: 3,
    xp: 0,
    level: 1,
    needs: { ...DEFAULT_NEEDS },
    sick: false,
    sleeping: false,
    inventory: { carrot: 2, ball: 1 },
    placed: [],
    daily: { date: "", missions: [] },
    weekly: { week: "", missions: [] },
    achievements: [],
    dailyReward: { last: null, streak: 0 },
    visitedAreas: ["casa"],
    unlockedAreas: ["casa", "jardim"],
    time: { hour: 9, day: 1 },
    weather: "sun",
    area: "casa",
    stats: { fed: 0, baths: 0, games: 0, wins: 0, plays: 0, coinsEarned: 0, distance: 0, sleeps: 0, heals: 0, walks: 0, playTime: 0 },
    settings: { music: true, sfx: true, quality: "high", sensitivity: 1, notifications: true, lang: "pt", cameraShake: true },
    pos: { x: -5, z: 4 },
    bubble: null,
    bubbleKey: 0,
    toasts: [],
    anim: "idle",
    animUntil: 0,
    aiMode: false,
    decorTarget: null,
    decorRot: 0,
    said: {},
    notifiedMissions: [],
    seenUpdate: "",
    announcement: "",
  };
}

export const useForge = create<ForgeState>()(
  persist(
    (set, get) => ({
      ...(defaultState() as ForgeState),
      screen: "splash",
      panel: "none",

      setScreen: (s) => set({ screen: s }),
      openPanel: (p) => set({ panel: p }),
      closePanel: () => set({ panel: "none" }),

      createProfile: (name, species, fur, belly, ear, eye, petName) => {
        const pet: RosterPet = { uid: uid(), name: petName || name, species, fur, belly, ear, eye, clothes: { hat: null, shirt: null, acc: null } };
        set({
          profileName: name,
          roster: [pet],
          inventory: { carrot: 2, ball: 1 },
          screen: "menu",
          panel: "none",
        });
        get().notifyMsg("🐰", `${name} ${get().settings.lang === "pt" ? "está pronto para a aventura!" : "is ready for adventure!"}`);
        setTimeout(() => get().grantAchievement("firstPet"), 800);
      },

      resetGame: () => {
        try { localStorage.removeItem("forgepet-save"); } catch { /* ignore */ }
        set({ ...(defaultState() as ForgeState), screen: "title", panel: "none" });
      },

      setBubble: (text, secs = 3.2) => {
        set({ bubble: { text, until: Date.now() + secs * 1000 }, bubbleKey: Date.now() });
      },
      notifyMsg: (icon, text) => {
        if (!get().settings.notifications) return;
        const id = Date.now() + Math.random();
        set((s) => ({ toasts: [...s.toasts.slice(-3), { id, icon, text }] }));
        setTimeout(() => set((s) => ({ toasts: s.toasts.filter((n) => n.id !== id) })), 4200);
      },

      addCoins: (n) => {
        set((s) => ({ coins: s.coins + n, stats: { ...s.stats, coinsEarned: Math.max(0, s.stats.coinsEarned + Math.max(0, n)) } }));
      },
      addGems: (n) => set((s) => ({ gems: Math.max(0, s.gems + n) })),
      spend: (coins, gems) => {
        const s = get();
        if (s.coins < coins || s.gems < gems) return false;
        set({ coins: s.coins - coins, gems: s.gems - gems });
        return true;
      },

      addXP: (n) => {
        const s = get();
        let xp = s.xp + n;
        let level = s.level;
        let leveled = false;
        while (xp >= xpForLevel(level)) { xp -= xpForLevel(level); level++; leveled = true; }
        set({ xp, level });
        if (leveled) {
          const bonus = level * 50;
          set({ coins: get().coins + bonus });
          get().notifyMsg("⭐", `${get().settings.lang === "pt" ? "Nível" : "Level"} ${level}! +${bonus} 🪙`);
          sound.levelup();
          get().checkUnlocks();
          get().evaluateAchievements();
        }
      },

      feed: (foodId) => {
        const s = get();
        const food = FOODS.find((f) => f.id === foodId);
        if (!food || (s.inventory[foodId] ?? 0) <= 0) return;
        set((st) => ({
          inventory: { ...st.inventory, [foodId]: (st.inventory[foodId] ?? 0) - 1 },
          needs: {
            ...st.needs,
            hunger: clamp(st.needs.hunger + food.hunger),
            thirst: clamp(st.needs.thirst + food.thirst),
            happiness: clamp(st.needs.happiness + food.happy),
            health: clamp(st.needs.health + food.health),
          },
          anim: "eat", animUntil: Date.now() + 2600,
        }));
        const st = get();
        st.stats.fed++;
        st.addXP(4);
        st.setBubble(`😋 ${food.emoji}!`);
        sound.eat();
        get().missionEvent("feed");
        get().evaluateAchievements();
      },

      drink: () => {
        const s = get();
        set({ needs: { ...s.needs, thirst: clamp(s.needs.thirst + 30), happiness: clamp(s.needs.happiness + 4) }, anim: "drink", animUntil: Date.now() + 2200 });
        s.setBubble("💧 Muito bom!");
        sound.water();
        get().missionEvent("water");
      },

      startBath: () => {
        const s = get();
        if (s.anim === "bath") return;
        set({ anim: "bath", animUntil: Date.now() + 9000, sleeping: false });
        s.setBubble("🫧 Espuma gostosa!");
        sound.splash();
        const st = get();
        st.stats.baths++;
        st.addXP(10);
        get().missionEvent("bath");
        get().evaluateAchievements();
      },

      toggleSleep: () => {
        const s = get();
        if (s.sleeping) {
          set({ sleeping: false, anim: "idle", animUntil: 0 });
          s.setBubble("☀️ Acordei!");
          sound.jump();
        } else {
          set({ sleeping: true, anim: "sleep", animUntil: 0 });
          s.setBubble("😴 Boa noite...");
          const st = get();
          st.stats.sleeps++;
          st.addXP(5);
          get().missionEvent("sleep");
        }
      },

      playToy: (toyId) => {
        const s = get();
        const toy = TOYS.find((t) => t.id === toyId) ?? TOYS[0];
        set({ needs: { ...s.needs, happiness: clamp(s.needs.happiness + toy.happy), energy: clamp(s.needs.energy - 4) }, anim: "play", animUntil: Date.now() + 3600 });
        s.setBubble(`${toy.emoji} Yay!`);
        sound.pop();
        const st = get();
        st.stats.plays++;
        st.addXP(6);
        get().missionEvent("play");
      },

      watchTV: () => {
        const s = get();
        set({ needs: { ...s.needs, happiness: clamp(s.needs.happiness + 12) }, anim: "sit", animUntil: Date.now() + 12000 });
        s.setBubble("📺 Que legal!");
        sound.click();
        s.addXP(5);
      },

      heal: () => {
        const s = get();
        if (!s.sick) return;
        if (!s.spend(40, 0)) {
          s.notifyMsg("🪙", s.settings.lang === "pt" ? "Precisa de 40 moedas!" : "Need 40 coins!");
          sound.error();
          return;
        }
        set({ sick: false, needs: { ...s.needs, health: 100, happiness: clamp(s.needs.happiness + 20), hunger: clamp(s.needs.hunger + 20), thirst: clamp(s.needs.thirst + 20) } });
        const st = get();
        st.stats.heals++;
        st.addXP(15);
        st.setBubble("💊 Estou curado!");
        sound.success();
        st.notifyMsg("💊", "Pet curado!");
        get().evaluateAchievements();
      },

      buy: (kind, id) => {
        const s = get();
        let info: FoodInfo | WearInfo | ToyInfo | FurnitureInfo | SpeciesInfo | undefined;
        if (kind === "food") info = FOODS.find((f) => f.id === id);
        if (kind === "wear") info = WEAR.find((w) => w.id === id);
        if (kind === "toy") info = TOYS.find((t) => t.id === id);
        if (kind === "furniture") info = FURNITURE.find((f) => f.id === id);
        if (kind === "pet") info = SPECIES.find((p) => p.id === id);
        if (!info) return;
        if (s.level < info.level) {
          s.notifyMsg("🔒", s.settings.lang === "pt" ? `Alcance o nível ${info.level}` : `Reach level ${info.level}`);
          sound.error();
          return;
        }
        if (!s.spend(info.price, (info as { gems?: number }).gems ?? 0)) {
          s.notifyMsg("💸", s.settings.lang === "pt" ? "Recursos insuficientes!" : "Not enough resources!");
          sound.error();
          return;
        }
        if (kind === "pet") { get().adoptPet(id as SpeciesId); return; }
        set((st) => ({ inventory: { ...st.inventory, [id]: (st.inventory[id] ?? 0) + 1 } }));
        s.notifyMsg(info.emoji, `${info.name} ✓`);
        sound.coin();
        get().evaluateAchievements();
      },

      equipWear: (slot, id) => {
        set((st) => {
          const roster = [...st.roster];
          roster[st.activePet] = { ...roster[st.activePet], clothes: { ...roster[st.activePet].clothes, [slot]: id } };
          return { roster };
        });
        sound.click();
      },

      useItem: (id) => {
        if (FOODS.some((f) => f.id === id)) get().feed(id);
        else if (TOYS.some((t) => t.id === id)) get().playToy(id);
      },

      adoptPet: (speciesId) => {
        const s = get();
        const info = SPECIES.find((p) => p.id === speciesId);
        if (!info) return;
        if (s.gems < info.gems || s.coins < info.price) {
          s.notifyMsg("💸", s.settings.lang === "pt" ? "Recursos insuficientes!" : "Not enough resources!");
          sound.error();
          return;
        }
        s.spend(info.price, info.gems);
        const newPet: RosterPet = {
          uid: uid(), name: info.name, species: speciesId,
          fur: "#f5f5f5", belly: "#ffffff", ear: "#ffb7c5", eye: "#3e2723",
          clothes: { hat: null, shirt: null, acc: null },
        };
        set((st) => ({ roster: [...st.roster, newPet], activePet: st.roster.length }));
        const st = get();
        st.notifyMsg(info.emoji, `${info.name} ${st.settings.lang === "pt" ? "adotado!" : "adopted!"}`);
        sound.success();
        get().evaluateAchievements();
      },

      switchPet: (i) => {
        const s = get();
        if (i < 0 || i >= s.roster.length) return;
        set({ activePet: i, sleeping: false, anim: "happy", animUntil: Date.now() + 2000 });
        get().setBubble("✨ Olá!");
        sound.jump();
      },

      startDecor: (id) => {
        const s = get();
        if ((s.inventory[id] ?? 0) <= 0) return;
        set({ decorTarget: { uid: "ghost", id, x: s.pos.x + 1.5, z: s.pos.z, rot: 0 }, decorRot: 0, panel: "none" });
      },
      updateDecorPos: (x, z) => set((s) => (s.decorTarget ? { decorTarget: { ...s.decorTarget, x, z } } : {})),
      rotateDecor: () => set((s) => ({ decorRot: (s.decorRot + Math.PI / 4) % (Math.PI * 2) })),
      confirmDecor: () => {
        const s = get();
        if (!s.decorTarget) return;
        const item = { ...s.decorTarget, uid: uid(), rot: s.decorRot };
        set({
          placed: [...s.placed, item],
          inventory: { ...s.inventory, [s.decorTarget.id]: Math.max(0, (s.inventory[s.decorTarget.id] ?? 0) - 1) },
          decorTarget: null,
        });
        const st = get();
        st.addXP(8);
        st.notifyMsg("🔨", "Móvel colocado!");
        sound.click();
        get().missionEvent("deco");
        get().evaluateAchievements();
      },
      cancelDecor: () => set({ decorTarget: null }),
      removePlaced: (itemUid) => {
        const s = get();
        const item = s.placed.find((p) => p.uid === itemUid);
        if (!item) return;
        set({ placed: s.placed.filter((p) => p.uid !== itemUid), inventory: { ...s.inventory, [item.id]: (s.inventory[item.id] ?? 0) + 1 } });
        sound.click();
      },

      teleport: (x, z, areaId) => {
        set({ pos: { x, z }, sleeping: false });
        if (areaId) get().walkArea(areaId);
        sound.jump();
      },
      walkArea: (areaId) => {
        const s = get();
        if (s.area === areaId) return;
        set({ area: areaId });
        if (!s.visitedAreas.includes(areaId)) {
          set({ visitedAreas: [...s.visitedAreas, areaId] });
          get().notifyMsg("🗺️", `${AREAS.find((a) => a.id === areaId)?.name ?? areaId}`);
        }
        if (areaId !== "casa") {
          get().stats.walks++;
          get().missionEvent("walk");
        }
        if (areaId === "parque") get().evaluateAchievements();
      },

      setAI: (b) => { set({ aiMode: b }); sound.click(); },

      claimDaily: () => {
        const s = get();
        const today = todayStr();
        if (s.dailyReward.last === today) return;
        let streak = 1;
        if (s.dailyReward.last) {
          const diff = (Date.parse(today) - Date.parse(s.dailyReward.last)) / 86400000;
          streak = diff === 1 ? s.dailyReward.streak + 1 : 1;
        }
        const reward = DAILY_REWARDS[(streak - 1) % 7];
        const inv = { ...s.inventory };
        if (reward.label.includes("Tapete")) inv.rug = (inv.rug ?? 0) + 1;
        if (reward.label.includes("Bola")) inv.ball = (inv.ball ?? 0) + 1;
        if (reward.label.includes("Moletom")) inv.hoodie = (inv.hoodie ?? 0) + 1;
        if (reward.label.includes("Cenoura")) inv.carrot = (inv.carrot ?? 0) + 1;
        set({ dailyReward: { last: today, streak }, coins: s.coins + reward.coins, gems: s.gems + reward.gems, inventory: inv });
        get().notifyMsg(reward.emoji, `${reward.label} (+${reward.coins} 🪙${reward.gems ? ` +${reward.gems} 💎` : ""})`);
        sound.success();
        get().addXP(20);
      },

      claimMission: (id) => {
        const s = get();
        const all = [...s.daily.missions, ...s.weekly.missions];
        const m = all.find((x) => x.id === id);
        if (!m || m.claimed || m.progress < m.target) return;
        set({
          daily: { ...s.daily, missions: s.daily.missions.map((x) => (x.id === id ? { ...x, claimed: true } : x)) },
          weekly: { ...s.weekly, missions: s.weekly.missions.map((x) => (x.id === id ? { ...x, claimed: true } : x)) },
          coins: s.coins + m.coins,
          gems: s.gems + m.gems,
        });
        get().notifyMsg("🎯", `Missão: +${m.coins} 🪙${m.gems ? ` +${m.gems} 💎` : ""}`);
        sound.success();
      },

      missionEvent: (type: string, amount = 1) => {
        const s = get();
        const bump = (list: Mission[]) => list.map((m) => (m.type === type && !m.claimed && m.progress < m.target ? { ...m, progress: Math.min(m.target, m.progress + amount) } : m));
        const daily = bump(s.daily.missions);
        const weekly = bump(s.weekly.missions);
        set({ daily: { ...s.daily, missions: daily }, weekly: { ...s.weekly, missions: weekly } });
        const newlyDone = [...daily, ...weekly].find(
          (m) => m.progress >= m.target && !m.claimed && !s.notifiedMissions.includes(m.id)
        );
        if (newlyDone) {
          set({ notifiedMissions: [...s.notifiedMissions, newlyDone.id] });
          get().notifyMsg("🎯", `Missão concluída: ${newlyDone.text}`);
          sound.success();
        }
      },

      grantAchievement: (id) => {
        const s = get();
        if (s.achievements.includes(id)) return;
        const a = ACHIEVEMENTS.find((x) => x.id === id);
        if (!a) return;
        set({ achievements: [...s.achievements, id], coins: s.coins + 50, gems: s.gems + 2 });
        s.notifyMsg(a.icon, `🏆 ${a.name}! +50 🪙 +2 💎`);
        sound.achievement();
      },

      evaluateAchievements: () => {
        const s = get();
        const has = (id: string) => s.achievements.includes(id);
        const itemCount = Object.values(s.inventory).reduce((a, b) => a + b, 0);
        if (!has("firstPet") && s.roster.length > 0) get().grantAchievement("firstPet");
        if (!has("firstBath") && s.stats.baths >= 1) get().grantAchievement("firstBath");
        if (!has("firstGame") && s.stats.games >= 1) get().grantAchievement("firstGame");
        if (!has("decorated") && s.placed.length >= 5) get().grantAchievement("decorated");
        if (!has("gamer") && s.stats.wins >= 3) get().grantAchievement("gamer");
        if (!has("collector") && itemCount >= 10) get().grantAchievement("collector");
        if (!has("happyPet") && s.needs.happiness >= 95) get().grantAchievement("happyPet");
        if (!has("explorer") && s.visitedAreas.includes("parque")) get().grantAchievement("explorer");
        if (!has("vet") && s.stats.heals >= 1) get().grantAchievement("vet");
        if (!has("trainer") && s.level >= 5) get().grantAchievement("trainer");
        if (!has("rich") && s.coins >= 2000) get().grantAchievement("rich");
        if (!has("gems") && s.gems >= 10) get().grantAchievement("gems");
      },

      checkUnlocks: () => {
        const s = get();
        AREAS.forEach((a) => {
          if (a.level <= s.level && !s.unlockedAreas.includes(a.id)) {
            set({ unlockedAreas: [...s.unlockedAreas, a.id] });
            if (a.id !== "casa" && a.id !== "jardim") get().notifyMsg("🔓", `${a.name} desbloqueado!`);
          }
        });
      },

      setSetting: (k, v) => set((s) => ({ settings: { ...s.settings, [k]: v } })),
      setWeather: (w) => set({ weather: w }),
      adminGrant: (coins, gems) => {
        const s = get();
        set({ coins: s.coins + coins, gems: s.gems + gems });
        s.notifyMsg("🛠️", `Admin: +${coins} 🪙 +${gems} 💎`);
      },
      setAnnouncement: (txt) => set({ announcement: txt }),
      setPetPos: (x, z) => set({ pos: { x, z } }),

      tick: () => {
        const s = get();
        if (s.screen !== "game" || s.roster.length === 0) return;

        const today = todayStr();
        const week = weekStr();
        let daily = s.daily;
        let weekly = s.weekly;
        if (daily.date !== today) daily = { date: today, missions: buildMissions(DAILY_MISSIONS) };
        if (weekly.week !== week) weekly = { week: week, missions: buildMissions(WEEKLY_MISSIONS) };

        const n = s.needs;
        const sleeping = s.sleeping;
        let hunger = clamp(n.hunger - 0.075);
        let thirst = clamp(n.thirst - 0.06);
        let hygiene = clamp(n.hygiene - 0.04);
        let sleepN = clamp(n.sleep - 0.05);
        let happiness = clamp(n.happiness - 0.045);
        let energy = sleeping ? clamp(n.energy + 3.2) : clamp(n.energy - 0.05);
        let health = n.health;

        if (hunger < 12 || thirst < 12 || sleepN < 12 || hygiene < 12) health = clamp(health - 0.09);
        else health = clamp(health + 0.03);

        let anim = s.anim;
        let animUntil = s.animUntil;
        if (anim === "bath") {
          hygiene = clamp(hygiene + 1.1);
          if (hygiene >= 100) { anim = "happy"; animUntil = Date.now() + 2000; }
          else if (Date.now() > animUntil) { anim = "idle"; animUntil = 0; }
        }
        if (anim !== "bath" && animUntil && Date.now() > animUntil && !sleeping) { anim = "idle"; animUntil = 0; }

        const sick = health < 28;
        const said = { ...s.said };
        const bubbleOn = (cond: boolean, key: string, icon: string, msg: string) => {
          if (cond && !said[key]) { said[key] = true; get().setBubble(`${icon} ${msg}`, 3.5); }
          if (!cond && said[key]) said[key] = false;
        };
        bubbleOn(hunger < 32 && !sleeping, "hunger", "🍖", "Estou com fome!");
        bubbleOn(thirst < 32 && !sleeping, "thirst", "💧", "Quero água!");
        bubbleOn(sleepN < 32 && !sleeping, "sleep", "😴", "Estou com sono...");
        bubbleOn(hygiene < 32 && !sleeping, "hyg", "🧼", "Preciso de banho!");
        bubbleOn(happiness < 28 && !sleeping, "hap", "💔", "Estou triste...");
        bubbleOn(sick && !sleeping, "sick", "🤒", "Não me sinto bem...");
        bubbleOn(energy < 22 && !sleeping, "energy", "🥱", "Estou cansado...");

        if (sleeping && energy >= 100) get().toggleSleep();

        let hour = s.time.hour + 1 / 20;
        let day = s.time.day;
        let weather = s.weather;
        if (hour >= 24) {
          hour -= 24; day++;
          const r = Math.random();
          weather = r < 0.55 ? "sun" : r < 0.75 ? "cloud" : r < 0.9 ? "rain" : "snow";
          get().setWeather(weather);
          get().notifyMsg("🌅", `Dia ${day}`);
        }

        set({
          needs: { health, hunger, thirst, energy, happiness, hygiene, sleep: sleepN },
          sick, sleeping, anim, animUntil, said,
          daily, weekly, time: { hour, day },
          stats: { ...s.stats, playTime: s.stats.playTime + 1 },
        });
        get().evaluateAchievements();
      },
    }),
    {
      name: "forgepet-save-v1",
      version: 1,
      partialize: (s) => {
        const { screen, panel, bubble, bubbleKey, toasts, anim, animUntil, decorTarget, said, ...rest } = s;
        void screen; void panel; void bubble; void bubbleKey; void toasts; void anim; void animUntil; void decorTarget; void said;
        return rest;
      },
    }
  )
);
