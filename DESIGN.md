# Sarf Design System

## Scene
Sunday 21:40, Aïn Naadja or Aubervilliers: phone in bed, one glance — "l'euro a fait quoi aujourd'hui ?" Then maybe thirty seconds in the converter. Light theme by day (paper board), true dark variant at night via prefers-color-scheme (most checks happen after dinner).

## Aesthetic
Editorial print exchange-board: the cours du jour page of a serious newspaper, not a trading terminal. Cream paper, ink text, hairline rules, big tabular numerals. No cards-on-cards; rules and whitespace structure the page.

## Color (OKLCH; entity semantics, validated)
Two entity colors carry the whole app — color follows the entity, never decoration:
- **Square (parallel)** = vermilion `#C03E1D` light / `#E06A45` dark
- **Banque (official)** = ink-blue `#2F5DA8` light / `#5B8AD4` dark
(Both validated with dataviz six-checks, light surface ~#fcfcfb-cream and dark #1a1a19: PASS.)

- `--paper`: oklch(0.965 0.012 90) — warm cream
- `--paper-dim`: oklch(0.935 0.014 90)
- `--ink`: oklch(0.23 0.015 60)
- `--ink-soft`: oklch(0.45 0.012 60)
- `--ink-faint`: oklch(0.60 0.010 60)
- `--rule`: oklch(0.84 0.015 85) — hairlines
- up/down deltas reuse the two entity hues NEVER (deltas are ink with ▲▼ glyphs); status stays typographic.
Dark: paper → oklch(0.215 0.008 60), ink → oklch(0.93 0.008 85), rules → oklch(0.34 0.01 60).

## Typography
- Display/masthead: Fraunces (72,9 optical, 600) — Latin only; Arabic masthead uses Plex Sans Arabic 700.
- UI + numerals: IBM Plex Sans / IBM Plex Sans Arabic; ALL rates in `font-variant-numeric: tabular-nums`.
- Hero rate: 64px/700. Board numerals 22px. Scale: 12.5 / 14.5 (body) / 17 / 22 / 30 / 42 / 64.

## Layout
Single scrolling page, max-width 560px column (desktop centers it like a newspaper column). Sections separated by double hairlines (1px + 3px gap + 1px), newspaper-style. Order: masthead+date → hero EUR → l'écart (bank vs square bars) → board (all currencies) → convertisseur → historique chart → alertes → sources/legal.

## Chart (dataviz method)
Change-over-time, EUR square sell: SVG line, 2px, 8px point markers, tight y-domain, 30-day range band as light tinted region, crosshair+tooltip, recessive dotted grid, direct label on last point. Sparse-tolerant (2..N points; the pipeline appends daily). Official rate never shares this axis: the gap is shown in "l'écart" as two direct-labeled horizontal magnitude bars (vermilion vs ink-blue).

## Components
- Rate row: currency (flag glyph + code), achat | vente | officiel columns, per-figure as-of date when older than today ("27 juin" in faint 12.5px).
- Converter: amount input (inputmode decimal), currency chips, sens toggle (devise→DA / DA→devise), result in both markets with the difference line — the "aha" line.
- Alert row: threshold input + on/off; fires as in-page banner on load (push later).
- Freshness stamp under masthead: "Relevé du mercredi 8 juillet 2026, 12h00 (Alger)".

## Motion
Almost none: number changes cross-fade 180ms ease-out-quart; chart crosshair follows instantly. Nothing moves on load.

## Voice
FR: "Square", "Banque d'Algérie", "Achat", "Vente", "Écart", "Relevé du…", "à titre indicatif". AR: "السكوار", "بنك الجزائر", "شراء", "بيع", "الفارق", "إشعار". No exclamation points, no advice.
