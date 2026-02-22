const KEY = "laje_concierge_v1";

export function loadState<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try{
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    return { ...(fallback as any), ...JSON.parse(raw) };
  }catch{
    return fallback;
  }
}

export function saveState<T>(state: T) {
  if (typeof window === "undefined") return;
  try{
    localStorage.setItem(KEY, JSON.stringify(state));
  }catch{}
}
