// ============================================================
// FORGE PET — Conteúdo do jogo (Forge Studios)
// Todos os dados de jogo: pets, roupas, comidas, brinquedos,
// móveis, missões, conquistas, áreas, recompensas e i18n.
// ============================================================

export type SpeciesId =
  | "rabbit" | "dog" | "cat" | "hamster"
  | "fox" | "panda" | "dragon" | "unicorn";

export interface SpeciesInfo {
  id: SpeciesId;
  name: string;
  emoji: string;
  personality: string;
  price: number;
  gems: number;
  level: number;
}

export const SPECIES: SpeciesInfo[] = [
  { id: "rabbit", name: "Coelho", emoji: "🐰", personality: "Saltitante, curioso e cheio de energia.", price: 0, gems: 0, level: 1 },
  { id: "dog", name: "Cachorro", emoji: "🐶", personality: "Leal, adora carinho e sempre quer brincar.", price: 250, gems: 0, level: 1 },
  { id: "cat", name: "Gato", emoji: "🐱", personality: "Independente, preguiçoso e adorável.", price: 400, gems: 0, level: 2 },
  { id: "hamster", name: "Hamster", emoji: "🐹", personality: "Pequeno, corajoso e muito fofinho.", price: 180, gems: 0, level: 1 },
  { id: "fox", name: "Raposa", emoji: "🦊", personality: "Astuto, esperto e cheio de truques.", price: 700, gems: 0, level: 3 },
  { id: "panda", name: "Panda", emoji: "🐼", personality: "Calmo, fofo e adorador de bambu.", price: 1000, gems: 0, level: 4 },
  { id: "dragon", name: "Dragão", emoji: "🐲", personality: "Majestoso, feroz e brilha com fogo.", price: 0, gems: 10, level: 6 },
  { id: "unicorn", name: "Unicórnio", emoji: "🦄", personality: "Mágico, brilhante e cheio de sonhos.", price: 0, gems: 15, level: 8 },
];

export interface FoodInfo {
  id: string; name: string; emoji: string;
  price: number; gems?: number; level: number;
  hunger: number; thirst: number; happy: number; health: number;
}

export const FOODS: FoodInfo[] = [
  { id: "carrot", name: "Cenoura", emoji: "🥕", price: 5, level: 1, hunger: 16, thirst: 3, happy: 2, health: 1 },
  { id: "apple", name: "Maçã", emoji: "🍎", price: 8, level: 1, hunger: 22, thirst: 6, happy: 3, health: 2 },
  { id: "banana", name: "Banana", emoji: "🍌", price: 8, level: 1, hunger: 20, thirst: 4, happy: 4, health: 1 },
  { id: "ration", name: "Ração", emoji: "🥣", price: 14, level: 1, hunger: 32, thirst: 0, happy: -2, health: 2 },
  { id: "cake", name: "Bolo", emoji: "🍰", price: 40, level: 2, hunger: 34, thirst: 5, happy: 12, health: 0 },
  { id: "pizza", name: "Pizza", emoji: "🍕", price: 60, level: 3, hunger: 46, thirst: 4, happy: 10, health: -1 },
  { id: "burger", name: "Hambúrguer", emoji: "🍔", price: 55, level: 3, hunger: 44, thirst: -3, happy: 9, health: -1 },
  { id: "feast", name: "Festa do Chef", emoji: "🍱", price: 110, gems: 2, level: 5, hunger: 56, thirst: 10, happy: 16, health: 5 },
];

export type SlotId = "hat" | "shirt" | "acc";

export interface WearInfo {
  id: string; slot: SlotId; name: string; emoji: string;
  price: number; gems?: number; level: number;
}

export const WEAR: WearInfo[] = [
  { id: "cap", slot: "hat", name: "Boné", emoji: "🧢", price: 30, level: 1 },
  { id: "straw", slot: "hat", name: "Chapéu de Palha", emoji: "👒", price: 35, level: 1 },
  { id: "helmet", slot: "hat", name: "Capacete", emoji: "🪖", price: 90, level: 4 },
  { id: "crown", slot: "hat", name: "Coroa Real", emoji: "👑", price: 0, gems: 4, level: 3 },
  { id: "tshirt", slot: "shirt", name: "Camiseta", emoji: "👕", price: 40, level: 1 },
  { id: "hoodie", slot: "shirt", name: "Moletom", emoji: "🧥", price: 80, level: 2 },
  { id: "jacket", slot: "shirt", name: "Jaqueta", emoji: "🥼", price: 110, level: 3 },
  { id: "glasses", slot: "acc", name: "Óculos", emoji: "👓", price: 25, level: 1 },
  { id: "bow", slot: "acc", name: "Laço", emoji: "🎀", price: 20, level: 1 },
  { id: "collar", slot: "acc", name: "Coleira", emoji: "📿", price: 35, level: 2 },
  { id: "halo", slot: "acc", name: "Halo Sagrado", emoji: "😇", price: 0, gems: 3, level: 4 },
  { id: "wings", slot: "acc", name: "Asas de Anjo", emoji: "🪽", price: 0, gems: 6, level: 5 },
];

export interface ToyInfo { id: string; name: string; emoji: string; price: number; level: number; happy: number; }

export const TOYS: ToyInfo[] = [
  { id: "ball", name: "Bola", emoji: "🏀", price: 15, level: 1, happy: 14 },
  { id: "ball2", name: "Bola de Tênis", emoji: "🎾", price: 12, level: 1, happy: 12 },
  { id: "frisbee", name: "Frisbee", emoji: "🥏", price: 30, level: 2, happy: 16 },
  { id: "drum", name: "Tambor", emoji: "🥁", price: 45, level: 2, happy: 22 },
  { id: "plush", name: "Pelúcia", emoji: "🧸", price: 60, level: 3, happy: 26 },
];

export interface FurnitureInfo {
  id: string; name: string; emoji: string;
  price: number; gems?: number; level: number;
  cat: "sala" | "quarto" | "cozinha" | "banheiro" | "jardim" | "decor";
  w: number; d: number; // largura/profundidade para colisão
}

export const FURNITURE: FurnitureInfo[] = [
  { id: "sofa", name: "Sofá", emoji: "🛋️", price: 120, level: 1, cat: "sala", w: 2.6, d: 1.1 },
  { id: "tv", name: "TV", emoji: "📺", price: 180, level: 1, cat: "sala", w: 1.6, d: 0.5 },
  { id: "table", name: "Mesa", emoji: "🪑", price: 60, level: 1, cat: "sala", w: 1.4, d: 0.9 },
  { id: "rug", name: "Tapete", emoji: "🟥", price: 45, level: 1, cat: "sala", w: 2.6, d: 1.8 },
  { id: "lamp", name: "Luminária", emoji: "🛋️", price: 55, level: 1, cat: "sala", w: 0.6, d: 0.6 },
  { id: "plant", name: "Planta", emoji: "🪴", price: 35, level: 1, cat: "sala", w: 0.7, d: 0.7 },
  { id: "arcade", name: "Arcade", emoji: "🕹️", price: 350, level: 2, cat: "sala", w: 1.2, d: 0.9 },
  { id: "bed", name: "Cama", emoji: "🛏️", price: 150, level: 1, cat: "quarto", w: 2.2, d: 1.6 },
  { id: "wardrobe", name: "Armário", emoji: "🚪", price: 110, level: 1, cat: "quarto", w: 1.8, d: 0.7 },
  { id: "fridge", name: "Geladeira", emoji: "🧊", price: 200, level: 1, cat: "cozinha", w: 1.1, d: 0.9 },
  { id: "kitchenTable", name: "Mesa de Cozinha", emoji: "🍽️", price: 90, level: 1, cat: "cozinha", w: 1.6, d: 0.9 },
  { id: "tub", name: "Banheira", emoji: "🛁", price: 130, level: 1, cat: "banheiro", w: 1.8, d: 1.1 },
  { id: "sink", name: "Pia", emoji: "🚰", price: 85, level: 1, cat: "banheiro", w: 1.2, d: 0.7 },
  { id: "bench", name: "Banco", emoji: "🪵", price: 40, level: 1, cat: "jardim", w: 1.8, d: 0.6 },
  { id: "tree", name: "Árvore", emoji: "🌳", price: 50, level: 1, cat: "jardim", w: 1.2, d: 1.2 },
  { id: "flowers", name: "Flores", emoji: "🌸", price: 25, level: 1, cat: "jardim", w: 1.0, d: 1.0 },
  { id: "fountain", name: "Fonte", emoji: "⛲", price: 200, level: 3, cat: "jardim", w: 1.6, d: 1.6 },
  { id: "clock", name: "Relógio", emoji: "🕰️", price: 30, level: 1, cat: "decor", w: 0.5, d: 0.4 },
  { id: "painting", name: "Quadro", emoji: "🖼️", price: 35, level: 1, cat: "decor", w: 1.2, d: 0.2 },
  { id: "shelf", name: "Prateleira", emoji: "📚", price: 45, level: 2, cat: "decor", w: 1.4, d: 0.4 },
  { id: "trophy", name: "Troféu", emoji: "🏆", price: 0, gems: 2, level: 4, cat: "decor", w: 0.5, d: 0.5 },
];

// ---------------- Missões ----------------
export interface MissionTemplate { id: string; text: string; type: string; target: number; coins: number; gems?: number; xp: number; }

export const DAILY_MISSIONS: MissionTemplate[] = [
  { id: "dm_feed", text: "Alimentar o pet 3 vezes", type: "feed", target: 3, coins: 60, xp: 20 },
  { id: "dm_water", text: "Dar água 2 vezes", type: "water", target: 2, coins: 40, xp: 15 },
  { id: "dm_bath", text: "Dar banho no pet", type: "bath", target: 1, coins: 80, xp: 30 },
  { id: "dm_game", text: "Jogar 1 minijogo", type: "game", target: 1, coins: 100, xp: 40 },
  { id: "dm_earn", text: "Ganhar 300 moedas", type: "earn", target: 300, coins: 50, xp: 25 },
  { id: "dm_walk", text: "Visitar o jardim", type: "walk", target: 1, coins: 60, xp: 20 },
  { id: "dm_deco", text: "Colocar um móvel", type: "deco", target: 1, coins: 90, xp: 25 },
  { id: "dm_sleep", text: "Colocar o pet para dormir", type: "sleep", target: 1, coins: 70, xp: 20 },
];

export const WEEKLY_MISSIONS: MissionTemplate[] = [
  { id: "wm_earn", text: "Ganhar 2.000 moedas na semana", type: "earn", target: 2000, coins: 400, xp: 150 },
  { id: "wm_games", text: "Jogar 5 minijogos", type: "game", target: 5, coins: 300, xp: 120 },
  { id: "wm_feed", text: "Alimentar 10 vezes", type: "feed", target: 10, coins: 250, xp: 100 },
  { id: "wm_deco", text: "Colocar 3 móveis", type: "deco", target: 3, coins: 350, xp: 120 },
];

// ---------------- Conquistas ----------------
export interface Achievement { id: string; name: string; icon: string; desc: string; }

export const ACHIEVEMENTS: Achievement[] = [
  { id: "firstPet", name: "Primeiro Pet", icon: "🐰", desc: "Adote seu primeiro pet" },
  { id: "firstBath", name: "Primeiro Banho", icon: "🛁", desc: "Dê banho no seu pet" },
  { id: "firstGame", name: "Primeira Vez", icon: "🎮", desc: "Jogue um minijogo" },
  { id: "decorated", name: "Casa Decorada", icon: "🏡", desc: "Coloque 5 móveis na casa" },
  { id: "gamer", name: "Mestre dos Minijogos", icon: "🎯", desc: "Vença 3 minijogos" },
  { id: "collector", name: "Colecionador", icon: "🛍️", desc: "Tenha 10 itens no inventário" },
  { id: "happyPet", name: "Pet Feliz", icon: "😊", desc: "Alcance 95 de felicidade" },
  { id: "explorer", name: "Explorador", icon: "🌎", desc: "Visite o Parque" },
  { id: "vet", name: "Veterinário", icon: "🏥", desc: "Cuide da saúde do pet" },
  { id: "trainer", name: "Grande Treinador", icon: "⭐", desc: "Alcance o nível 5" },
  { id: "rich", name: "Rico em Moedas", icon: "💰", desc: "Tenha 2.000 moedas" },
  { id: "gems", name: "Coletor de Gems", icon: "💎", desc: "Tenha 10 gems" },
];

// ---------------- Recompensa diária ----------------
export interface DailyReward { day: number; label: string; coins: number; gems: number; emoji: string; }

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, label: "100 moedas", coins: 100, gems: 0, emoji: "🪙" },
  { day: 2, label: "150 moedas + Cenoura", coins: 150, gems: 0, emoji: "🥕" },
  { day: 3, label: "200 moedas + Tapete", coins: 200, gems: 0, emoji: "🟥" },
  { day: 4, label: "250 moedas + Moletom", coins: 250, gems: 0, emoji: "🧥" },
  { day: 5, label: "2 gems", coins: 100, gems: 2, emoji: "💎" },
  { day: 6, label: "300 moedas + Bola", coins: 300, gems: 0, emoji: "🏀" },
  { day: 7, label: "500 moedas + 5 gems", coins: 500, gems: 5, emoji: "👑" },
];

// ---------------- Áreas do mundo ----------------
export interface AreaInfo { id: string; name: string; emoji: string; level: number; x: number; z: number; }

export const AREAS: AreaInfo[] = [
  { id: "casa", name: "Minha Casa", emoji: "🏠", level: 1, x: 0, z: 4 },
  { id: "jardim", name: "Jardim", emoji: "🌳", level: 1, x: 0, z: 14 },
  { id: "veterinaria", name: "Veterinária", emoji: "🏥", level: 1, x: 18, z: 2 },
  { id: "parque", name: "Parque", emoji: "🌲", level: 3, x: 0, z: 32 },
  { id: "floresta", name: "Floresta", emoji: "🌲", level: 5, x: -26, z: 20 },
  { id: "praia", name: "Praia", emoji: "🏖️", level: 6, x: 30, z: 20 },
  { id: "cidade", name: "Cidade", emoji: "🏙️", level: 7, x: -30, z: -10 },
];

// ---------------- Atualização ----------------
export const CURRENT_VERSION = "1.2.0";

export const UPDATE_NOTES = {
  version: "1.2.0",
  title: "FORGE PET — NOVA ATUALIZAÇÃO",
  news: [
    "🐰 Novo pet lendário: Dragão e Unicórnio!",
    "🎮 2 novos minijogos: Corrida e Alvos.",
    "🏠 Sistema de decoração com grade livre.",
    "🌦️ Clima dinâmico: sol, chuva e neve.",
    "💎 Gems agora podem serem ganhas no Arcade.",
    "🐛 Correções gerais e melhorias de performance.",
  ],
};

// ---------------- i18n ----------------
export type Lang = "pt" | "en";

export const STR: Record<string, { pt: string; en: string }> = {
  startGame: { pt: "JOGAR", en: "PLAY" },
  myPet: { pt: "MEU PET", en: "MY PET" },
  myHouse: { pt: "MINHA CASA", en: "MY HOUSE" },
  world: { pt: "MUNDO", en: "WORLD" },
  shop: { pt: "LOJA", en: "SHOP" },
  games: { pt: "MINIJOGOS", en: "MINIGAMES" },
  missions: { pt: "MISSÕES", en: "MISSIONS" },
  achievements: { pt: "CONQUISTAS", en: "ACHIEVEMENTS" },
  profile: { pt: "PERFIL", en: "PROFILE" },
  settings: { pt: "CONFIGURAÇÕES", en: "SETTINGS" },
  coins: { pt: "Moedas", en: "Coins" },
  gems: { pt: "Gems", en: "Gems" },
  level: { pt: "Nível", en: "Level" },
  hunger: { pt: "Fome", en: "Hunger" },
  thirst: { pt: "Sede", en: "Thirst" },
  energy: { pt: "Energia", en: "Energy" },
  happiness: { pt: "Felicidade", en: "Happiness" },
  hygiene: { pt: "Higiene", en: "Hygiene" },
  health: { pt: "Saúde", en: "Health" },
  sleep: { pt: "Sono", en: "Sleep" },
  feed: { pt: "Alimentar", en: "Feed" },
  water: { pt: "Água", en: "Water" },
  bath: { pt: "Banho", en: "Bath" },
  sleepBtn: { pt: "Dormir", en: "Sleep" },
  play: { pt: "Brincar", en: "Play" },
  interact: { pt: "Interagir", en: "Interact" },
  dailyReward: { pt: "Recompensa Diária", en: "Daily Reward" },
  claim: { pt: "Resgatar", en: "Claim" },
  close: { pt: "Fechar", en: "Close" },
  buy: { pt: "Comprar", en: "Buy" },
  use: { pt: "Usar", en: "Use" },
  equip: { pt: "Equipar", en: "Equip" },
  unequip: { pt: "Desequipar", en: "Unequip" },
  place: { pt: "Colocar", en: "Place" },
  inventory: { pt: "Inventário", en: "Inventory" },
  wardrobe: { pt: "Guarda-Roupa", en: "Wardrobe" },
  customize: { pt: "Personalizar", en: "Customize" },
  decorate: { pt: "Decorar", en: "Decorate" },
  move: { pt: "Mover", en: "Move" },
  rotate: { pt: "Girar", en: "Rotate" },
  remove: { pt: "Remover", en: "Remove" },
  confirm: { pt: "Confirmar", en: "Confirm" },
  cancel: { pt: "Cancelar", en: "Cancel" },
  daily: { pt: "Diárias", en: "Daily" },
  weekly: { pt: "Semanais", en: "Weekly" },
  locked: { pt: "Bloqueado", en: "Locked" },
  aiMode: { pt: "Modo IA", en: "AI Mode" },
  run: { pt: "Correr", en: "Run" },
  jump: { pt: "Pular", en: "Jump" },
  walk2: { pt: "Andar", en: "Walk" },
  park: { pt: "Parque", en: "Park" },
  vet: { pt: "Veterinário", en: "Vet" },
  sick: { pt: "Doente", en: "Sick" },
  ok: { pt: "Tudo bem!", en: "All good!" },
};

export function t(key: string, lang: Lang): string {
  return STR[key]?.[lang] ?? key;
}
