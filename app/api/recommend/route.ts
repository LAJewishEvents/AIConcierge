import { NextResponse } from "next/server";
import type { Event, UserPrefs } from "@/lib/types";

export const runtime = "nodejs";

type Body = { query: string; events: Event[]; prefs?: UserPrefs };

export async function POST(req: Request) {
  let body: Body;
  try{ body = await req.json(); }
  catch{ return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const query = (body.query || "").trim();
  const events = Array.isArray(body.events) ? body.events.slice(0, 160) : [];
  const prefs = body.prefs || {};

  if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });
  if (!events.length) return NextResponse.json({ error: "No events provided" }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const ids = [...events]
      .sort((a, b) => {
        const ta = a.startISO ? new Date(a.startISO).getTime() : 1e18;
        const tb = b.startISO ? new Date(b.startISO).getTime() : 1e18;
        return ta - tb;
      })
      .slice(0, 12)
      .map(e => e.id);

    return NextResponse.json({ ids, mode: "fallback" });
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const compactEvents = events.map(e => ({
    id: e.id,
    title: e.title,
    when: e.startISO,
    location: e.location,
    url: e.url,
    tags: e.tags || [],
    blurb: (e.description || "").slice(0, 180),
  }));

  const system = [
    "You are an event concierge for young Jewish professionals in Los Angeles.",
    "Select the best-matching events for the user's query and preferences.",
    "Return JSON with an array field `ids` (event IDs) ranked best to worst.",
    "Only include IDs that exist in the provided event list.",
    "Prefer upcoming events over past events. Prefer exact neighborhood/vibe matches.",
  ].join(" ");

  const user = { query, prefs, events: compactEvents };

  try{
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(user) },
        ],
        text: { format: { type: "json_object" } },
      }),
    });

    const raw = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: `OpenAI error ${res.status}`, raw: raw.slice(0, 800) }, { status: 502 });
    }

    const data = JSON.parse(raw);
    const textOut = (data.output || [])
      .flatMap((o: any) => o.content || [])
      .find((c: any) => c.type === "output_text")?.text;

    if (!textOut) {
      return NextResponse.json({ error: "No model text output", raw: raw.slice(0, 800) }, { status: 502 });
    }

    let parsed: any;
    try{ parsed = JSON.parse(textOut); }
    catch{ return NextResponse.json({ error: "Model did not return valid JSON", sample: textOut.slice(0, 800) }, { status: 502 }); }

    const ids = Array.isArray(parsed?.ids) ? parsed.ids.filter((x: any) => typeof x === "string") : [];
    const existing = new Set(events.map(e => e.id));
    const filtered = ids.filter(id => existing.has(id)).slice(0, 18);

    return NextResponse.json({ ids: filtered, mode: "openai", model });
  }catch (e:any){
    return NextResponse.json({ error: "Request failed", detail: e?.message || String(e) }, { status: 502 });
  }
}
