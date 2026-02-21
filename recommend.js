export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const { profile, history, summary, message, events } = req.body || {};
    if (!message) return res.status(400).json({ error: "Missing message" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY env var" });

    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

    const safeEvents = Array.isArray(events) ? events.slice(0, 400).map(e => ({
      id: e.id, title: e.title, org: e.org, type: e.type, start: e.start, end: e.end,
      region: e.region, location: e.location, url: e.url, tags: e.tags
    })) : [];

    const sys = `You are LAJE Concierge: a concise, natural chat assistant for LA Jewish Events.
- Respond normally to small talk (hello/how are you/thanks).
- If user asks for events, choose best matches from provided events.
- Use PST when talking about times.
Return JSON ONLY: {"replyText": string, "picks": string[]} where picks are event ids.`;

    const input = [
      { role: "system", content: sys },
      { role: "user", content: JSON.stringify({ profile, summary, history, message, events: safeEvents }) }
    ];

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input,
        text: { format: { type: "json_object" } },
        temperature: 0.4
      })
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(500).json({ error: `OpenAI HTTP ${r.status}`, detail: t.slice(0, 800) });
    }

    const data = await r.json();
    const raw = data.output_text || "";
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) {}

    if (!parsed || typeof parsed.replyText !== "string" || !Array.isArray(parsed.picks)) {
      return res.status(200).json({ replyText: raw || "Ok.", picks: [] });
    }
    return res.status(200).json({ replyText: parsed.replyText, picks: parsed.picks });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
