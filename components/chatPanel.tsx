"use client";

import { useEffect, useRef, useState } from "react";
import { IconSend } from "./icons";
import { getMemory, setMemory } from "@/lib/memory";
import { track } from "@/lib/analytics";

type Msg = { from: "concierge" | "me"; text: string; ts: number };

const seed: Msg[] = [
  { from: "concierge", text: "Welcome to LAJE Concierge — built like a product, not a project.", ts: Date.now() - 4000 },
  { from: "concierge", text: "Tell me your neighborhood + the vibe (social / classy / chill) and I’ll tighten the picks.", ts: Date.now() - 3500 },
  { from: "concierge", text: "Try: “Shabbat dinner Friday 21–40 near West LA” or “Classy cultural events this weekend.”", ts: Date.now() - 3000 },
];

export function ChatPanel() {
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const [q, setQ] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 1e9, behavior: "smooth" });
  }, [msgs.length]);

  async function ask() {
    const text = q.trim();
    if (!text) return;
    setQ("");
    const now = Date.now();
    setMsgs(m => [...m, { from: "me", text, ts: now }]);

    const mem = getMemory();
    mem.lastQuery = text;
    setMemory(mem);

    track({ name: "ask", props: { mode: mem.prefs.brain || "local", chars: text.length } });

    const reply =
      mem.prefs.brain === "llm"
        ? "Got it — switching to LLM brain. Head to Events to see ranked picks (or import your calendar)."
        : "Got it — I’ll rank the feed locally. Head to Events to see ranked picks (or import your calendar).";

    setMsgs(m => [...m, { from: "concierge", text: reply, ts: Date.now() }]);
  }

  return (
    <>
      <div className="mainTop">
        <div>
          <h1 className="h1">Chat</h1>
          <p className="sub">Concierge prompting → ranked event picks. (Ctrl/⌘K for commands)</p>
        </div>
        <span className="tag">Single source of truth: your calendar feed</span>
      </div>

      <div className="mainBody" ref={listRef} style={{ overflow: "auto" }}>
        {msgs.map((m, idx) => (
          <div key={idx} className={m.from === "me" ? "bubble bubbleMe" : "bubble"} style={{ alignSelf: m.from === "me" ? "flex-end" : "flex-start" }}>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{m.text}</div>
            <div className="bubbleMeta">
              <span className="pill">{m.from}</span>
              <span>{new Date(m.ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="inputBar" aria-label="Chat input">
        <input
          className="textInput"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask about events…"
          onKeyDown={(e) => { if (e.key === "Enter") ask(); }}
        />
        <button className="primaryBtn" onClick={ask} aria-label="Send">
          <IconSend />
        </button>
      </div>
    </>
  );
}
