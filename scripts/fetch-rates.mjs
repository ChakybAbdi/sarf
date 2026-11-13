#!/usr/bin/env node
/**
 * Sarf rates fetcher — pulls parallel + official DZD rates from public sources
 * and rewrites data/rates.json, appending today's point to the history.
 *
 * Usage:  node scripts/fetch-rates.mjs
 * Runs on Node >= 18 (global fetch). Designed for a daily GitHub Actions cron.
 *
 * Scraping notes: ExchangeDZ renders rates server-side per-currency page.
 * Selectors are regex-based and WILL need maintenance if the site changes.
 * The script is conservative: any value that fails sanity checks is dropped
 * and yesterday's value is kept, never invented.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data', 'rates.json');
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CAD'];
const UA = { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SarfBot/1.0; +https://github.com)' } };

/* sanity bounds per currency — reject scrape garbage rather than publish it */
const PARALLEL_BOUNDS = { EUR: [220, 400], USD: [190, 340], GBP: [250, 450], CAD: [130, 250] };
const OFFICIAL_BOUNDS = { EUR: [130, 190], USD: [110, 165], GBP: [150, 220], CAD: [80, 120] };

async function fetchText(url) {
  const res = await fetch(url, UA);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

/* Scan ALL occurrences of each pattern and return the first value inside bounds.
   First-match scraping is how a stray "100 EUR =" ends up published as a rate. */
function plausibleNumber(html, patterns, [lo, hi]) {
  for (const re of patterns) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    for (const m of html.matchAll(g)) {
      const v = parseFloat(m[1].replace(',', '.'));
      if (isFinite(v) && v >= lo && v <= hi) return v;
    }
  }
  return null;
}

async function fetchParallel(code) {
  const html = await fetchText(`https://www.exchangedz.com/rates/${code.toLowerCase()}-to-dzd`);
  const num = '(\\d{2,3}(?:[.,]\\d{1,2})?)';
  return {
    buy: plausibleNumber(html, [new RegExp(`(?:buy|achat)[^0-9]{0,80}?${num}`, 'i')], PARALLEL_BOUNDS[code]),
    sell: plausibleNumber(html, [new RegExp(`(?:sell|vente)[^0-9]{0,80}?${num}`, 'i')], PARALLEL_BOUNDS[code]),
    official: plausibleNumber(html, [new RegExp(`(?:official|officiel)[^0-9]{0,80}?${num}`, 'i')], OFFICIAL_BOUNDS[code]),
  };
}

async function main() {
  const data = JSON.parse(readFileSync(DATA, 'utf8'));
  const today = new Date().toISOString().slice(0, 10);
  let changed = false;

  for (const code of CURRENCIES) {
    try {
      const r = await fetchParallel(code);
      const slot = data.rates[code];
      if (r.sell != null) {
        slot.parallel.sell = r.sell;
        slot.parallel.buy = r.buy ?? slot.parallel.buy;
        slot.parallel.asOf = today;
        slot.parallel.src = 'exchangedz';
        changed = true;
        // append/replace today's history point
        data.history[code] = data.history[code] || [];
        const h = data.history[code];
        const existing = h.find((p) => p.d === today);
        if (existing) { existing.sell = r.sell; if (r.buy != null) existing.buy = r.buy; }
        else h.push({ d: today, ...(r.buy != null ? { buy: r.buy } : {}), sell: r.sell });
        if (h.length > 400) data.history[code] = h.slice(-400);
      }
      if (r.official != null) {
        slot.official.mid = r.official;
        slot.official.asOf = today;
        changed = true;
      }
      console.log(`${code}: buy=${r.buy ?? '—'} sell=${r.sell ?? '—'} official=${r.official ?? '—'}`);
    } catch (err) {
      console.error(`${code}: FAILED (${err.message}) — keeping previous values`);
    }
  }

  // refresh EUR 30-day range from accumulated history
  const eurH = (data.history.EUR || []).filter((p) => p.sell != null);
  const cutoff = Date.now() - 30 * 864e5;
  const last30 = eurH.filter((p) => new Date(p.d).getTime() >= cutoff).map((p) => p.sell);
  if (last30.length >= 5) data.ranges.EUR.d30 = [Math.min(...last30), Math.max(...last30)];

  if (!changed) {
    console.error('No value could be fetched; rates.json left untouched.');
    process.exitCode = 1;
    return;
  }
  data.updated = new Date().toISOString();
  writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
  console.log('rates.json updated →', data.updated);
}

main();
