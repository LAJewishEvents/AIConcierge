"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getMemory, setMemory } from "@/lib/memory";
import { parseIcs } from "@/lib/ics";
import type { Event } from "@/lib/types";
import { rankEvents } from "@/lib/eventEngine";
import { EventDrawer } from "./EventDrawer";
import { formatWhen } from "@/lib/time";
import { track } from "@/lib/analytics";

const DEMO_ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LAJE//Concierge Demo//EN
BEGIN:VEVENT
UID:demo-1
DTSTART:20260307T020000Z
DTEND:20260307T050000Z
SUMMARY:First Fridays Circus Shabbat Dinner (Ages 21-40)
LOCATION:Los Angeles
DESCRIPTION:High-energy Shabbat dinner with a circus vibe. Ages 21–40.
URL:https://www.eventbrite.com/
END:VEVENT
BEGIN:VEVENT
UID:demo-2
DTSTART:20260308T030000Z
DTEND:20260308T050000Z
SUMMARY:Pink Challah Bake
LOCATION:West LA
DESCRIPTION:Community challah bake + social.
URL:https://example.com
END:VEVENT
END:VCALENDAR`;

function useSlashFocus(ref: React.RefObject<HTMLInputElement>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.metaKey || e.ctrlKey || e.altKey)) {
        const target = e.target as HTMLElement | null;
        const isTyping = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
        if (isTyping) return;
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ref]);
}

export function EventsPanel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Event | null>(null);
  const [query, setQuery] = useState("");
  const [onlySaved, setOnlySaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useSlashFocus(inputRef);

  useEffect(() => {
    const demo = parseIcs(DEMO_ICS, "Demo");
    setEvents(demo);
  }, []);

  const prefs = getMemory().prefs;
  const tz = prefs.timezone || "PST";

  const ranked = useMemo(() => {
    const base = onlySaved ? events.filter(e => getMemory().saved[e.id]) : events;
    const q = query.trim() || getMemory().lastQuery || "";
    if (!q) {
      return [...base].sort((a, b) => {
        const ta = a.startISO ? new Date(a.startISO).getTime() : 0;
        const tb = b.startISO ? new Date(b.startISO).getTime() : 0;
        return (ta || 1e18) - (tb || 1e18);
      }).slice(0, 80);
    }
    return rankEvents(base, q, prefs);
  }, [events, query, onlySaved, prefs]);

  async function importFromUrl(url: string) {
    setLoading(true);
    try{
      const res = await fetch(`/api/ics?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("ICS fetch failed");
      const text = await res.text();
      const parsed = parseIcs(text, new URL(url).hostname);
      setEvents(parsed);
      const m = getMemory();
      m.importedAt = Date.now();
      setMemory(m);
      track({ name: "import_ics", props: { ok: true, count: parsed.length } });
      alert(`Imported ${parsed.length} events.`);
    }catch{
      track({ name: "import_ics", props: { ok: false } });
      alert("Import failed. Check the URL and try again. If the ICS host blocks requests, allowlist it on the server.");
    }finally{
      setLoading(false);
    }
  }

  async function recommendLLM() {
    const q = (query.trim() || getMemory().lastQuery || "").trim();
    if (!q) return alert("Type a query first (or ask in Chat).");
    setLoading(true);
    try{
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: {"content-type":"application/json"},
        body: JSON.stringify({ query: q, events: events.slice(0, 120), prefs: getMemory().prefs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "LLM error");
      const ids: string[] = data?.ids || [];
      const idset = new Set(ids);
      const reordered = [...events].sort((a, b) => (idset.has(b.id) ? 1 : 0) - (idset.has(a.id) ? 1 : 0));
      setEvents(reordered);
      alert("LLM ranked your feed (top picks floated).");
    }catch(e:any){
      alert(e?.message || "LLM recommend failed. Add OPENAI_API_KEY in Vercel env vars.");
    }finally{
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mainTop">
        <div>
          <h1 className="h1">Events</h1>
          <p className="sub">Import ICS → search → open details → save favorites. Press <span className="kbd">/</span> to focus search.</p>
        </div>
        <span className="tag">Proxy: /api/ics • Brain: {prefs.brain === "llm" ? "LLM" : "Local"}</span>
      </div>

      <div className="mainBody" style={{ overflow: "auto" }}>
        <div className="toolbar">
          <input
            ref={inputRef}
            className="textInput"
            style={{ maxWidth: 520 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search: “Shabbat dinner West LA” • or ask in Chat"
            aria-label="Search events"
          />
          <button className={"chip" + (onlySaved ? " chipOn" : "")} onClick={() => setOnlySaved(v => !v)}>
            Saved only
          </button>
          <button
            className="chip"
            onClick={() => {
              const url = prompt("Paste an ICS URL (webcal/https):");
              if (url) importFromUrl(url.replace(/^webcal:/, "https:"));
            }}
          >
            Import ICS
          </button>
          <button className="chip" onClick={() => { setEvents(parseIcs(DEMO_ICS, "Demo")); setQuery(""); }}>
            Load demo
          </button>
          <button className="chip" onClick={recommendLLM} disabled={loading}>
            LLM rank
          </button>
          <span className="muted small">{loading ? "Working…" : `${ranked.length} shown • ${events.length} total`}</span>
        </div>

        <div className="eventGrid" style={{ marginTop: 12 }}>
          {ranked.map((e) => (
            <div
              key={e.id}
              className="eventCard"
              role="button"
              tabIndex={0}
              onClick={() => { setActive(e); setOpen(true); track({ name: "open_event", props: { id: e.id } }); }}
              onKeyDown={(ev) => { if (ev.key === "Enter") { setActive(e); setOpen(true); } }}
              aria-label={`Open event: ${e.title}`}
            >
              <div className="eventTitle">{e.title}</div>
              <div className="eventMeta">{formatWhen(e.startISO, tz)} • {e.location || "Location TBD"}</div>
              <div className="eventMeta" style={{ marginTop: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {e.description || "No description."}
              </div>
              <div className="metaRow">
                {(e.tags || []).slice(0, 3).map((t) => (
                  <span key={t} className="metaBadge">{t}</span>
                ))}
                {typeof e.score === "number" ? <span className="metaBadge">Score: {e.score.toFixed(2)}</span> : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="inputBar">
        <div className="muted small">
          Tip: In production, allowlist ICS domains for safety. This build is “investor-polish” + deploy-ready.
        </div>
      </div>

      <EventDrawer open={open} event={active} onClose={() => setOpen(false)} />
    </>
  );
}
