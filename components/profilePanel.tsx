"use client";

import { getMemory, setMemory } from "@/lib/memory";
import { useEffect, useState } from "react";
import type { UserPrefs } from "@/lib/types";

export function ProfilePanel() {
  const [prefs, setPrefs] = useState<UserPrefs>(() => getMemory().prefs);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const m = getMemory();
    setSavedCount(Object.values(m.saved).filter(Boolean).length);
  }, []);

  function patch(next: Partial<UserPrefs>) {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    const m = getMemory();
    m.prefs = merged;
    setMemory(m);
  }

  function clearMemory() {
    if (!confirm("Clear saved events + queries?")) return;
    const m = getMemory();
    m.saved = {};
    m.lastQuery = "";
    m.lastResults = [];
    setMemory(m);
    setSavedCount(0);
    alert("Cleared.");
  }

  return (
    <>
      <div className="mainTop">
        <div>
          <h1 className="h1">Profile</h1>
          <p className="sub">Preferences + memory layer (local-first). Built to plug into a DB later.</p>
        </div>
        <span className="tag">Saved events: {savedCount}</span>
      </div>

      <div className="mainBody" style={{ overflow: "auto" }}>
        <div className="card" style={{ borderRadius: 18, boxShadow: "none" }}>
          <div style={{ padding: 16 }}>
            <div style={{ fontWeight: 800, letterSpacing: "-0.2px" }}>Preferences</div>
            <p className="muted small" style={{ marginTop: 6 }}>
              Used as ranking signals (neighborhood + vibe). Persisted in localStorage.
            </p>

            <div className="row" style={{ marginTop: 12 }}>
              <label className="muted small" style={{ minWidth: 120 }}>Neighborhood</label>
              <input
                className="textInput"
                style={{ maxWidth: 360 }}
                value={prefs.neighborhood || ""}
                onChange={(e) => patch({ neighborhood: e.target.value })}
                placeholder="e.g., West LA, Beverly Hills, Valley"
              />
            </div>

            <div className="row" style={{ marginTop: 10 }}>
              <label className="muted small" style={{ minWidth: 120 }}>Vibe</label>
              <select
                className="textInput"
                style={{ maxWidth: 240 }}
                value={prefs.vibe || "any"}
                onChange={(e) => patch({ vibe: e.target.value as any })}
              >
                <option value="any">Any</option>
                <option value="social">Social</option>
                <option value="classy">Classy</option>
                <option value="chill">Chill</option>
              </select>

              <label className="muted small" style={{ minWidth: 90 }}>Brain</label>
              <select
                className="textInput"
                style={{ maxWidth: 220 }}
                value={prefs.brain || "local"}
                onChange={(e) => patch({ brain: e.target.value as any })}
              >
                <option value="local">Local</option>
                <option value="llm">LLM</option>
              </select>
            </div>

            <div className="row" style={{ marginTop: 10 }}>
              <label className="muted small" style={{ minWidth: 120 }}>Timezone label</label>
              <input
                className="textInput"
                style={{ maxWidth: 160 }}
                value={prefs.timezone || "PST"}
                onChange={(e) => patch({ timezone: e.target.value })}
              />
              <span className="muted small">Display label (your preference is PST).</span>
            </div>

            <hr className="sep" />
            <div className="row">
              <button className="chip" onClick={clearMemory}>Clear memory</button>
              <span className="muted small">Next: connect this to a real DB for cross-device sync.</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ borderRadius: 18, boxShadow: "none" }}>
          <div style={{ padding: 16 }}>
            <div style={{ fontWeight: 800, letterSpacing: "-0.2px" }}>What makes this “Series A”</div>
            <ul className="muted small" style={{ lineHeight: 1.6, marginTop: 10 }}>
              <li>Design tokens + consistent spacing/typography</li>
              <li>Command palette + keyboard-first UX</li>
              <li>Accessible drawer & focus patterns</li>
              <li>Deployable structure (Next.js + API routes)</li>
              <li>Swappable “brain” architecture</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="inputBar">
        <div className="muted small">Set “Neighborhood” + “Vibe”, then search in Events for noticeably better ranking.</div>
      </div>
    </>
  );
}
