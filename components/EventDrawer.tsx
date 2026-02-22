"use client";

import type { Event } from "@/lib/types";
import { IconBookmark, IconClose, IconExternal } from "./icons";
import { formatWhen } from "@/lib/time";
import { getMemory, toggleSaved } from "@/lib/memory";
import { useEffect, useState } from "react";

export function EventDrawer({
  open,
  event,
  onClose,
}: {
  open: boolean;
  event: Event | null;
  onClose: () => void;
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open || !event) return;
    const m = getMemory();
    setSaved(!!m.saved[event.id]);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, event, onClose]);

  if (!open || !event) return null;

  const tz = getMemory().prefs.timezone || "PST";

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Event details" onMouseDown={onClose}>
      <div className="drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="drawerTop">
          <div style={{ minWidth: 0 }}>
            <h3 className="drawerTitle">{event.title}</h3>
            <div className="muted small">{formatWhen(event.startISO, tz)} • {event.location || "Location TBD"}</div>
          </div>
          <button className="iconBtn" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>

        <div className="drawerBody">
          <div className="stack">
            <button
              className="linkBtn"
              onClick={() => {
                const m = toggleSaved(event.id);
                setSaved(!!m.saved[event.id]);
              }}
              aria-label="Save event"
            >
              <IconBookmark />
              {saved ? "Saved" : "Save"}
            </button>

            {event.url ? (
              <a className="linkBtn" href={event.url} target="_blank" rel="noreferrer">
                <IconExternal />
                Open RSVP / details
              </a>
            ) : null}

            <div className="card" style={{ borderRadius: 18, boxShadow: "none" }}>
              <div style={{ padding: 14 }}>
                <div style={{ fontWeight: 800, letterSpacing: "-0.2px" }}>About</div>
                <div className="muted small" style={{ marginTop: 8, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                  {event.description || "No description provided yet."}
                </div>
                {event.tags?.length ? (
                  <>
                    <hr className="sep" />
                    <div className="row">
                      {event.tags.map((t) => (
                        <span key={t} className="metaBadge">{t}</span>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            <div className="muted small">
              Source: {event.source || "Unknown"} • ID: <span style={{ fontFamily: "var(--mono)" }}>{event.id.slice(0, 18)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
