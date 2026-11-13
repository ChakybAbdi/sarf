# Sarf (صرف) — Le cours du dinar, square et officiel

**The daily question of millions of Algerians and the diaspora:** *"combien est l'euro au square aujourd'hui ?"* Algeria runs a dual exchange market — official (EUR ≈ 152 DZD) vs the parallel "square" (EUR ≈ 277 DZD, an **82% premium**). Everyone with money crossing the border checks this rate 1–3× a day. The existing sites are ad-farms with popups; Sarf is a clean, honest, installable exchange board.

## Features
- **Cours du jour**: EUR hero rate + full board (EUR, USD, GBP, CAD): achat / vente / officiel, every figure dated and sourced. Missing data shows as "—", never invented.
- **L'écart**: bank vs square as two direct-labeled bars — the 125-dinar gap at a glance.
- **Honest converter**: amount × direction (devise→DA at the cambiste's *achat* rate, DA→devise at *vente*), showing **both** markets and the difference in dinars — the number remittance senders actually decide with.
- **History chart**: EUR square rate, sparse-tolerant SVG (crosshair tooltip, 30-day range band), grows automatically as the pipeline appends a point per day. Palette validated for accessibility (CVD-safe, light + dark).
- **Alerts**: "signale-moi si EUR dépasse 280" — checked on open (push later).
- **FR / Arabic full RTL**, dark mode at night, offline PWA (installable Android/iOS + website).

## Data & accuracy
Seeded with rates verified on 2026-07-08 (ExchangeDZ/Square Port-Saïd, ObservAlgérie, Banque d'Algérie). `data/rates.json` is the single source of truth; every figure carries `asOf` + `src`. Rates vary by city and negotiation — the app says so.

## The "from my room" pipeline
`scripts/fetch-rates.mjs` (Node ≥ 18) scrapes the public sources, sanity-checks every value against bounds, appends today's history point, and rewrites `rates.json` — it never invents data and keeps yesterday's value on failure.

Fully automated for free:
1. Push this folder to a GitHub repo.
2. Enable GitHub Pages (deploy from branch).
3. `.github/workflows/update-rates.yml` runs the fetcher 3×/day and commits — the site updates itself forever, at zero cost, from your room.

Run locally: `python -m http.server 4180` → http://localhost:4180. Update rates manually: `node scripts/fetch-rates.mjs`.

## Business model
1. **Traffic + ads done right** (immediate): this query family ("euro dinar aujourd'hui") is one of Algeria's highest-volume daily searches; competitors monetize with 10 AdSense blocks — one tasteful ad slot + affiliate (remittance services like Wise/Remitly targeting the diaspora corridor France→DZ) converts better.
2. **Premium alerts** (later): push notifications, multi-threshold, weekly digest — small subscription for importers/students.
3. **The dataset** (the moat): a clean, dated, machine-readable history of the parallel rate does not exist publicly. Accumulate it daily and it becomes citable data for press, researchers and fintechs — license it.

## Store packaging
Same as any PWA: website as-is; Android via Bubblewrap/PWABuilder (TWA); iOS via PWABuilder/Capacitor. Note: app stores are picky about "financial information" apps — keep the disclaimer prominent.

## Legal posture
Sarf publishes aggregated information from public sources, like the national press (TSA, ObservAlgérie publish these rates daily). It performs no exchange, no matchmaking, no transactions. Disclaimer shown in-app in both languages.
