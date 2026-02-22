"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconInfo, IconSearch, IconSpark } from "./icons";
import { useEffect, useMemo, useState } from "react";
import { CommandPalette } from "./commandPalette";
import { getMemory, setMemory } from "@/lib/memory";
import type { BrainMode, UserPrefs } from "@/lib/types";
import { track } from "@/lib/analytics";

function useCmdK(open: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "k") {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [prefs, setPrefs] = useState<UserPrefs>(() => getMemory().prefs);

  useCmdK(() => setPaletteOpen(true));

  useEffect(() => {
    track({ name: "view", props: { page: pathname || "/" } });
  }, [pathname]);

  const nav = useMemo(() => {
    const active = (p: string) => (pathname === p ? "navPill navPillActive" : "navPill");
    return (
      <div className="sideNav" role="navigation" aria-label="Primary">
        <Link className={active("/")} href="/">Chat</Link>
        <Link className={active("/events")} href="/events">Events</Link>
        <Link className={active("/profile")} href="/profile">Profile</Link>
      </div>
    );
  }, [pathname]);

  function setBrain(brain: BrainMode) {
    const next = { ...prefs, brain };
    setPrefs(next);
    const m = getMemory();
    m.prefs = next;
    setMemory(m);
  }

  const brainLabel = prefs.brain === "llm" ? "LLM" : "Local";

  return (
    <div className="shell">
      <aside className="card sidebar" aria-label="Sidebar">
        <div className="sideTop">
          <div className="brand">
            <div className="badge" aria-hidden="true">
              <div className="badgeDot" />
            </div>
            <div className="brandTitle">
              <strong>AI Concierge</strong>
              <span>Brain: {brainLabel} • {prefs.timezone || "PST"}</span>
            </div>
          </div>

          <div className="iconRow" aria-label="Quick actions">
            <button className="iconBtn" onClick={() => setPaletteOpen(true)} aria-label="Open command palette (Ctrl+K)">
              <IconSearch />
            </button>
            <button className="iconBtn" onClick={() => setBrain(prefs.brain === "llm" ? "local" : "llm")} aria-label="Toggle brain mode">
              <IconSpark />
            </button>
            <button className="iconBtn" onClick={() => alert("Tip: Ctrl/⌘K opens the command palette. Use Events to import ICS and explore.")} aria-label="Info">
              <IconInfo />
            </button>
          </div>
        </div>

        {nav}

        <div className="sideBody">
          <div className="kpiGrid" aria-label="Product signals">
            <div className="kpi">
              <b>Instant search</b>
              <small>Semantic-lite ranking</small>
            </div>
            <div className="kpi">
              <b>ICS sync</b>
              <small>Proxy for CORS-safe fetch</small>
            </div>
            <div className="kpi">
              <b>Memory</b>
              <small>Prefs + saved events</small>
            </div>
            <div className="kpi">
              <b>Series A UI</b>
              <small>Polished, accessible</small>
            </div>
          </div>

          <div className="kpi">
            <b>Shortcuts</b>
            <small>Ctrl/⌘K palette • Esc close • / focus search</small>
          </div>
        </div>

        <div className="sideFooter">
          <span className="muted">LA Jewish Events</span>
          <span className="muted">v0.2</span>
        </div>
      </aside>

      <main className="card main">
        {children}
      </main>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        prefs={prefs}
        onPrefs={(next) => {
          setPrefs(next);
          const m = getMemory();
          m.prefs = next;
          setMemory(m);
        }}
      />
    </div>
  );
}
