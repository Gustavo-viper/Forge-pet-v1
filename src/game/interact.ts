// ============================================================
// FORGE PET — Interação por proximidade (objetos da casa)
// ============================================================
import { useSyncExternalStore } from "react";

export interface InteractState {
  label: string;
  icon: string;
  action: (() => void) | null;
}

let current: InteractState = { label: "", icon: "", action: null };
const listeners = new Set<() => void>();

export function setInteract(s: InteractState) {
  const changed = s.label !== current.label || s.icon !== current.icon;
  current = s;
  if (changed) listeners.forEach((l) => l());
}

export function getInteract(): InteractState {
  return current;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function useInteract(): InteractState {
  return useSyncExternalStore(subscribe, getInteract, getInteract);
}
