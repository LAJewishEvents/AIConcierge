# LAJE Concierge — Series A Build (Next.js)

Production-ready scaffold:
- Multi-route UI (Chat / Events / Profile)
- Command palette (⌘K / Ctrl+K)
- Event detail slide-over panel
- ICS proxy (`/api/ics?url=...`) for CORS-safe sync
- “Brain” option: Local vs LLM (`/api/recommend`)
- Memory layer (localStorage)
- Lightweight semantic ranking + fuzzy match
- Analytics hooks (pluggable)

## Run locally
```bash
npm i
npm run dev
```

## Deploy (Vercel)
Import the repo. Build settings auto-detect Next.js.

Optional env vars:
- `OPENAI_API_KEY` (enables LLM recommend)
- `OPENAI_MODEL` (default: `gpt-4o-mini`)
- `ALLOW_ICS_DOMAINS` (optional comma-separated allowlist)
