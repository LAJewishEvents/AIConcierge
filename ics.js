export default async function handler(req, res) {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send("Missing ?url=");
    const u = new URL(url);
    const okHost = u.hostname === "calendar.google.com";
    const okPath = u.pathname.includes("/calendar/ical/");
    if (!okHost || !okPath) return res.status(403).send("URL not allowed");

    const r = await fetch(url, { headers: { "User-Agent": "LAJE-ICS-Proxy/1.0" }});
    if (!r.ok) return res.status(r.status).send(`Upstream HTTP ${r.status}`);
    const text = await r.text();

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).send(text);
  } catch (e) {
    return res.status(500).send(e?.message || "Proxy error");
  }
}
