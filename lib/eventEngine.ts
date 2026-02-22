import { Event, UserPrefs } from "./types";

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string) {
  const t = norm(s).split(" ").filter(Boolean);
  return t.filter(x => x.length > 2 && !["the","and","for","with","from","this","that","you","your"].includes(x));
}

function jaccard(a: string[], b: string[]) {
  const A = new Set(a), B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const uni = A.size + B.size - inter;
  return uni ? inter / uni : 0;
}

function levenshtein(a: string, b: string) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function softIncludes(hay: string, needle: string) {
  if (!needle) return 0;
  if (hay.includes(needle)) return 1;
  if (needle.length <= 5) {
    for (const w of hay.split(" ")) {
      if (levenshtein(w, needle) <= 1) return 0.75;
    }
  }
  return 0;
}

function recencyBoost(startISO?: string) {
  if (!startISO) return 0;
  const t = new Date(startISO).getTime();
  const now = Date.now();
  const diffH = (t - now) / (1000 * 60 * 60);
  if (diffH < -6) return -0.25;
  if (diffH <= 6) return 0.25;
  if (diffH <= 48) return 0.18;
  if (diffH <= 168) return 0.12;
  if (diffH <= 720) return 0.06;
  return 0.02;
}

function vibeBoost(text: string, vibe?: UserPrefs["vibe"]) {
  if (!vibe || vibe === "any") return 0;
  const t = norm(text);
  if (vibe === "classy") {
    return Math.max(
      softIncludes(t, "gala"),
      softIncludes(t, "cocktail"),
      softIncludes(t, "wine"),
      softIncludes(t, "formal"),
    ) * 0.18;
  }
  if (vibe === "social") {
    return Math.max(
      softIncludes(t, "mixer"),
      softIncludes(t, "party"),
      softIncludes(t, "open bar"),
      softIncludes(t, "dance"),
    ) * 0.18;
  }
  if (vibe === "chill") {
    return Math.max(
      softIncludes(t, "shabbat"),
      softIncludes(t, "dinner"),
      softIncludes(t, "hike"),
      softIncludes(t, "coffee"),
    ) * 0.18;
  }
  return 0;
}

function neighborhoodBoost(text: string, neighborhood?: string) {
  if (!neighborhood) return 0;
  const t = norm(text);
  const n = norm(neighborhood);
  return softIncludes(t, n) * 0.22;
}

export function rankEvents(events: Event[], query: string, prefs: UserPrefs): Event[] {
  const q = norm(query);
  const qTokens = tokens(q);
  const qShort = qTokens.slice(0, 10).join(" ");

  const scored = events.map(e => {
    const corpus = `${e.title} ${e.location || ""} ${e.description || ""} ${(e.tags || []).join(" ")}`;
    const c = norm(corpus);
    const cTokens = tokens(c);

    const sim = jaccard(qTokens, cTokens);
    const contains = softIncludes(c, qShort) * 0.35;
    const rec = recencyBoost(e.startISO);
    const v = vibeBoost(c, prefs.vibe);
    const n = neighborhoodBoost(c, prefs.neighborhood);

    const score = (sim * 0.55) + contains + rec + v + n;
    return { ...e, score };
  });

  return scored.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 80);
}
