LAJE Concierge v8 (Vercel)

Files:
- index.html (standalone chat app)
- api/ics.js (ICS proxy for CORS-safe calendar sync)
- api/recommend.js (LLM brain endpoint)

Deploy:
1) Push this folder to a new GitHub repo (e.g., laje-concierge).
2) Import that repo into Vercel and deploy.
3) In Vercel Project → Settings → Environment Variables:
   OPENAI_API_KEY = <your key>
   OPENAI_MODEL   = (optional) gpt-4.1-mini

Use:
- Your app will be at https://<project>.vercel.app
- The proxy will be at https://<project>.vercel.app/api/ics?url=<encoded_ics_url>
- LLM endpoint: https://<project>.vercel.app/api/recommend

In the UI, open Brain settings:
- Mode: API
- Endpoint: /api/recommend
