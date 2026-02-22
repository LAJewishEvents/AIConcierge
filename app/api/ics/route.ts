import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isAllowed(hostname: string) {
  const allow = process.env.ALLOW_ICS_DOMAINS;
  if (!allow) return true;
  const set = new Set(allow.split(",").map(s => s.trim().toLowerCase()).filter(Boolean));
  return set.has(hostname.toLowerCase());
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  let target: URL;
  try{ target = new URL(url); }
  catch{ return NextResponse.json({ error: "Invalid url" }, { status: 400 }); }

  if (!["http:", "https:"].includes(target.protocol)) {
    return NextResponse.json({ error: "Only http/https allowed" }, { status: 400 });
  }
  if (!isAllowed(target.hostname)) {
    return NextResponse.json({ error: "Domain not allowlisted" }, { status: 403 });
  }

  try{
    const res = await fetch(target.toString(), {
      method: "GET",
      headers: { "user-agent": "LAJE-Concierge/0.2 (+vercel)" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: 502 });
    }

    const text = await res.text();
    return new NextResponse(text, {
      status: 200,
      headers: {
        "content-type": "text/calendar; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }catch{
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
