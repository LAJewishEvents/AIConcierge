import { loadState, saveState } from "./storage";
import type { UserPrefs } from "./types";

export type MemoryState = {
  prefs: UserPrefs;
  saved: Record<string, boolean>;
  lastQuery?: string;
  lastResults?: string[];
  importedAt?: number;
};

const DEFAULT: MemoryState = {
  prefs: { vibe: "any", brain: "local", timezone: "PST" },
  saved: {},
};

export function getMemory(): MemoryState {
  return loadState(DEFAULT);
}

export function setMemory(next: MemoryState) {
  saveState(next);
}

export function toggleSaved(eventId: string) {
  const m = getMemory();
  m.saved[eventId] = !m.saved[eventId];
  setMemory(m);
  return m;
}
