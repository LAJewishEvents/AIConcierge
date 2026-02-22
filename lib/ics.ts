import { Event } from "./types";

function unfoldLines(text: string) {
  return text.replace(/\r?\n[ \t]/g, "");
}

function parseIcsDate(value: string): string | undefined {
  const v = (value || "").trim();
  if (!v) return undefined;

  if (/^\d{8}$/.test(v)) {
    const y = v.slice(0,4), m = v.slice(4,6), d = v.slice(6,8);
    return new Date(`${y}-${m}-${d}T00:00:00`).toISOString();
  }

  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!m) return undefined;
  const [,yy,mm,dd,HH,MM,SS,z] = m;
  const iso = `${yy}-${mm}-${dd}T${HH}:${MM}:${SS}${z ? "Z" : ""}`;
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return undefined;
  return dt.toISOString();
}

function pickProp(line: string) {
  const idx = line.indexOf(":");
  if (idx < 0) return null;
  const left = line.slice(0, idx);
  const value = line.slice(idx + 1);
  const [key] = left.split(";");
  return { key: key.toUpperCase(), value };
}

export function parseIcs(text: string, source = "ICS"): Event[] {
  const unfolded = unfoldLines(text);
  const lines = unfolded.split(/\r?\n/);
  const out: Event[] = [];

  let inEvent = false;
  let cur: any = {};

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line === "BEGIN:VEVENT") { inEvent = true; cur = { source }; continue; }
    if (line === "END:VEVENT") {
      if (inEvent) {
        const id = (cur.UID || cur.URL || cur.SUMMARY || Math.random().toString(36).slice(2)).slice(0, 140);
        out.push({
          id,
          title: cur.SUMMARY || "Untitled event",
          startISO: parseIcsDate(cur.DTSTART),
          endISO: parseIcsDate(cur.DTEND),
          location: cur.LOCATION,
          description: cur.DESCRIPTION,
          url: cur.URL,
          source,
          tags: inferTags(cur.SUMMARY, cur.DESCRIPTION),
        });
      }
      inEvent = false;
      cur = {};
      continue;
    }

    if (!inEvent) continue;
    const kv = pickProp(line);
    if (!kv) continue;
    if (!cur[kv.key]) cur[kv.key] = kv.value;
  }

  return out;
}

function inferTags(summary?: string, desc?: string): string[] {
  const t = `${summary || ""} ${desc || ""}`.toLowerCase();
  const tags: string[] = [];
  if (/purim/.test(t)) tags.push("Purim");
  if (/shabbat|shabbos/.test(t)) tags.push("Shabbat");
  if (/mixer|singles|dating|speed/.test(t)) tags.push("Mixer");
  if (/hike|trail|outdoor/.test(t)) tags.push("Hike");
  if (/film|screening/.test(t)) tags.push("Film");
  if (/volunteer|tzedakah|service/.test(t)) tags.push("Volunteer");
  if (/concert|music|live/.test(t)) tags.push("Music");
  return tags.slice(0, 4);
}
