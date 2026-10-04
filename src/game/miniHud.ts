// ============================================================
// FORGE PET — HUD dos minijogos (store externo leve)
// ============================================================
import { useSyncExternalStore } from "react";

export interface MiniHudState { score: number; time: number; over: boolean; label: string; }

let state: MiniHudState = { score: 0, time: 0, over: false, label: "" };
const listeners = new Set<() => void>();

export function setMiniHud(p: Partial<MiniHudState>) {
  state = { ...state, ...p };
  listeners.forEach((l) => l());
}

export function getMiniHud(): MiniHudState {
  return state;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function useMiniHud(): MiniHudState {
  return useSyncExternalStore(subscribe, getMiniHud, getMiniHud);
}
