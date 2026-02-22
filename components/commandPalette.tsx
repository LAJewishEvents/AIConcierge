"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { UserPrefs } from "@/lib/types";

type Item = {
  id: string;
  label: string;
  hint?: string;
  kbd?: string;
  action: () => void;
};

export function CommandPalette({
  open,
  onClose,
  prefs,
  onPrefs,
}: {
  open: boolean;
  onClose: () => void;
  prefs: UserPrefs;
  onPrefs: (p: UserPrefs) => void;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setQ("");
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const items: Item[] = useMemo(() => {
    const toggleBrain = () => onPrefs({ ...prefs, brain: prefs.brain === "llm" ? "local" : "llm" });
    const setVibe = (v: any) => onPrefs({ ...prefs, vibe: v });

    return [
      { id: "go-chat", label: "Go to Chat", hint: "/", kbd: "G C", action: () => (window.location.href = "/") },
      { id: "go-events", label: "Go to Events", hint: "Browse + import", kbd: "G E", action: () => (window.location.href = "/events") },
      { id: "go-profile", label: "Go to Profile", hint: "Prefs + memory", kbd: "G P", action: () => (window.location.href = "/profile") },
      { id: "toggle-brain", label: `Toggle Brain (${prefs.brain === "llm" ? "LLM" : "Local"})`, hint: "Local vs LLM", kbd: "B", action: toggleBrain },
      { id: "vibe-any", label: "Set vibe: Any", hint: "Default", action: () => setVibe("any") },
      { id: "vibe-social", label: "Set vibe: Social", hint: "Mixers, parties", action: () => setVibe("social") },
      { id: "vibe-classy", label: "Set vibe: Classy", hint: "Cocktail, gala", action: () => setVibe("classy") },
      { id: "vibe-chill", label: "Set vibe: Chill", hint: "Shabbat, dinner", action: () => setVibe("chill") },
    ];
  }, [prefs, onPrefs]);

  const filtered = useMemo(() => {
    const qq = q.toLowerCase().trim();
    if (!qq) return items;
    return items.filter(i => (i.label + " " + (i.hint || "")).toLowerCase().includes(qq));
  }, [items, q]);

  if (!open) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={onClose}>
      <div className="palette" onMouseDown={(e) => e.stopPropagation()}>
        <div className="paletteTop">
          <input
            ref={inputRef}
            className="paletteInput"
            placeholder="Type a command… (e.g. “events”, “brain”, “vibe”)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Command search"
          />
        </div>
        <div className="paletteList" role="listbox" aria-label="Commands">
          {filtered.map((i) => (
            <div
              key={i.id}
              className="paletteItem"
              role="option"
              tabIndex={0}
              onClick={() => { i.action(); onClose(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { i.action(); onClose(); } }}
            >
              <div>
                <div style={{ fontWeight: 700, letterSpacing: "-0.2px" }}>{i.label}</div>
                {i.hint ? <div className="muted small">{i.hint}</div> : null}
              </div>
              {i.kbd ? <span className="kbd">{i.kbd}</span> : null}
            </div>
          ))}
          <div className="paletteItem" style={{ cursor: "default" }}>
            <div className="muted small">
              Pro-tip: Press <span className="kbd">Esc</span> to close • <span className="kbd">Ctrl/⌘K</span> to reopen
            </div>
            <span className="kbd">v0.2</span>
          </div>
        </div>
      </div>
    </div>
  );
}
