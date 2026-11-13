/* Sarf — app logic. No framework, no build step. */

const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('sarf.' + k)) ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem('sarf.' + k, JSON.stringify(v)); },
};

const state = {
  data: null,
  amount: store.get('amount', 100),
  cur: store.get('cur', 'EUR'),
  dir: store.get('dir', 'toDA'),   // toDA: devise → dinars (cambiste buys = achat) | fromDA: dinars → devise (vente)
  alerts: store.get('alerts', []), // {cur, dir:'above'|'below', threshold}
};

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function loadData() {
  const res = await fetch('data/rates.json');
  state.data = await res.json();
  store.set('cachedData', state.data);
}

function renderAll() {
  renderMasthead(); renderHero(); renderGap(); renderBoard();
  renderConverter(); renderChart(); renderAlerts(); renderFooter(); checkAlerts();
}

/* ---------- masthead ---------- */
function renderMasthead() {
  $('#masthead-title').textContent = t('appName');
  $('#masthead-title').classList.toggle('ar', LANG === 'ar');
  $('#masthead-sub').textContent = t('masthead');
  $('#lang-btn').textContent = t('langSwitch');
  const asOf = state.data.rates.EUR.parallel.asOf;
  $('#stamp').textContent = t('stamp', fmtDate(asOf));
}

/* ---------- hero (EUR) ---------- */
function trendOf(cur) {
  const h = (state.data.history[cur] || []).filter(p => p.sell != null);
  if (h.length < 2) return null;
  const prev = h[h.length - 2], last = h[h.length - 1];
  const d = +(last.sell - prev.sell).toFixed(2);
  return { d, prevDate: prev.d };
}
function renderHero() {
  const eur = state.data.rates.EUR;
  const meta = CURRENCY_META.EUR;
  const tr = trendOf('EUR');
  const prem = Math.round((eur.parallel.sell / eur.official.mid - 1) * 100);
  $('#hero').innerHTML = `
    <div class="cur-label">
      <span class="code">EUR</span>
      <span class="name">${esc(LANG === 'ar' ? meta.ar : meta.fr)} · ${t('square')}</span>
      ${tr ? `<span class="trend num">${tr.d > 0 ? '▲' : tr.d < 0 ? '▼' : '＝'} ${Math.abs(tr.d).toFixed(2)} ${t('vsPrev', fmtDateShort(tr.prevDate))}</span>` : ''}
    </div>
    <div class="hero-rate">
      <span class="big num">${eur.parallel.sell.toFixed(2)}</span>
      <span class="unit">${t('da')} / 1 ${meta.sym} · ${t('sell')}</span>
    </div>
    <div class="hero-cols">
      <div class="col"><div class="k">${t('buy')}</div><div class="v num">${eur.parallel.buy.toFixed(2)}</div></div>
      <div class="col"><div class="k">${t('official')}</div><div class="v official num">${eur.official.mid.toFixed(2)}</div></div>
      <div class="col"><div class="k">${t('square')} / ${t('official')}</div><div class="v num">${t('premium', prem)}</div></div>
    </div>`;
}

/* ---------- gap bars (magnitude comparison, direct-labeled) ---------- */
function renderGap() {
  const eur = state.data.rates.EUR;
  const max = eur.parallel.sell;
  const bankPct = (eur.official.mid / max * 100).toFixed(1);
  const gap = Math.round(eur.parallel.sell - eur.official.mid);
  $('#gap-title').textContent = t('gapTitle');
  $('#gap-inner').innerHTML = `
    <div class="gap-bars">
      <div class="gap-row">
        <div class="label"><span><b>${t('square')}</b> · 1 € =</span><span class="num"><b>${eur.parallel.sell.toFixed(2)} ${t('da')}</b></span></div>
        <div class="gap-track"><div class="gap-fill square" style="width:100%"></div></div>
      </div>
      <div class="gap-row">
        <div class="label"><span><b>${t('bank')}</b> · 1 € =</span><span class="num"><b>${eur.official.mid.toFixed(2)} ${t('da')}</b></span></div>
        <div class="gap-track"><div class="gap-fill bank" style="width:${bankPct}%"></div></div>
      </div>
    </div>
    <p class="gap-caption">${t('gapCaption', fmtDA(gap))}</p>`;
}

/* ---------- board ---------- */
function renderBoard() {
  const today = state.data.rates.EUR.parallel.asOf;
  $('#board-title').textContent = t('boardTitle');
  $('#board-inner').innerHTML = `
    <table class="board">
      <thead><tr>
        <th></th><th class="n">${t('buy')}</th><th class="n">${t('sell')}</th><th class="n">${t('official')}</th>
      </tr></thead>
      <tbody>
        ${Object.entries(state.data.rates).map(([code, r]) => {
          const m = CURRENCY_META[code];
          const cell = (v, asOf, cls = '') => v == null
            ? `<td class="n ${cls}"><span class="nodata">${t('noData')}</span></td>`
            : `<td class="n ${cls}"><span class="num">${v.toFixed(2)}</span>${asOf !== today ? `<span class="asof">${t('asOf', fmtDateShort(asOf))}</span>` : ''}</td>`;
          return `<tr>
            <td class="cur"><span class="code">${code}</span><span class="name">${esc(LANG === 'ar' ? m.ar : m.fr)}</span></td>
            ${cell(r.parallel.buy, r.parallel.asOf)}
            ${cell(r.parallel.sell, r.parallel.asOf)}
            ${cell(r.official.mid, r.official.asOf, 'off')}
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

/* ---------- converter ---------- */
function renderConverter() {
  const r = state.data.rates[state.cur];
  const m = CURRENCY_META[state.cur];
  $('#conv-title').textContent = t('convTitle');
  /* toDA: user sells devise → cambiste buys at "achat"; bank at official.
     fromDA: user buys devise → cambiste sells at "vente". */
  const parRate = state.dir === 'toDA' ? r.parallel.buy : r.parallel.sell;
  const offRate = r.official.mid;
  const a = state.amount;
  let sq, bk, diff, sqTxt, bkTxt;
  if (state.dir === 'toDA') {
    sq = parRate != null ? a * parRate : null;
    bk = a * offRate;
    sqTxt = sq != null ? `${fmtDA(sq)} ${t('da')}` : t('noData');
    bkTxt = `${fmtDA(bk)} ${t('da')}`;
    diff = sq != null ? sq - bk : null;
  } else {
    sq = parRate != null ? a / parRate : null;
    bk = a / offRate;
    sqTxt = sq != null ? `${fmtDA(sq, 2)} ${m.sym}` : t('noData');
    bkTxt = `${fmtDA(bk, 2)} ${m.sym}`;
    diff = null; // difference in devise is confusing; show only for toDA
  }
  $('#conv-inner').innerHTML = `
    <div class="conv">
      <div class="conv-controls">
        <div class="amount-wrap">
          <input id="amount" type="text" inputmode="decimal" value="${a}" aria-label="${t('convHave')}">
          <span class="sym">${state.dir === 'toDA' ? m.sym : t('da')}</span>
        </div>
        <div class="dir-toggle">
          <button data-dir="toDA" aria-pressed="${state.dir === 'toDA'}">${t('convDir1', state.cur)}</button>
          <button data-dir="fromDA" aria-pressed="${state.dir === 'fromDA'}">${t('convDir2', state.cur)}</button>
        </div>
      </div>
      <div class="chip-row">
        ${Object.keys(state.data.rates).map(c => `<button class="chip" data-cur="${c}" aria-pressed="${c === state.cur}">${c}</button>`).join('')}
      </div>
      <div class="conv-results">
        <div class="conv-line sq"><span class="k">${t('convAtSquare')}</span><span class="v num">${sqTxt}</span></div>
        <div class="conv-line bk"><span class="k">${t('convAtBank')}</span><span class="v num">${bkTxt}</span></div>
        ${diff != null ? `<div class="conv-diff num">${t('convDiff', fmtDA(diff))}</div>` : ''}
      </div>
      <p class="conv-note">${state.dir === 'toDA' ? t('convBuyNote') : t('convSellNote')}</p>
    </div>`;
  $('#amount').addEventListener('input', (e) => {
    const v = parseFloat(String(e.target.value).replace(',', '.'));
    state.amount = isFinite(v) && v >= 0 ? v : 0;
    store.set('amount', state.amount);
    clearTimeout(renderConverter._t);
    renderConverter._t = setTimeout(() => { renderConverter(); $('#amount').focus(); }, 600);
  });
}

/* ---------- chart (EUR sell history, sparse-tolerant) ---------- */
function renderChart() {
  $('#hist-title').textContent = t('histTitle');
  const hist = (state.data.history.EUR || []).filter(p => p.sell != null);
  const wrap = $('#chart-inner');
  const range30 = state.data.ranges?.EUR?.d30;
  if (hist.length < 2) {
    wrap.innerHTML = `<p class="hist-empty">${t('histEmpty')}</p><p class="chart-meta">${t('histBuilding')}</p>`;
    return;
  }
  const W = 560, H = 220, P = { t: 18, r: 14, b: 26, l: 44 };
  const xs = hist.map(p => new Date(p.d + 'T12:00:00').getTime());
  const ys = hist.map(p => p.sell);
  let yMin = Math.min(...ys), yMax = Math.max(...ys);
  if (range30) { yMin = Math.min(yMin, range30[0]); yMax = Math.max(yMax, range30[1]); }
  const pad = Math.max((yMax - yMin) * 0.25, 0.5);
  yMin -= pad; yMax += pad;
  const x = (v) => P.l + (v - xs[0]) / (xs[xs.length - 1] - xs[0] || 1) * (W - P.l - P.r);
  const y = (v) => P.t + (1 - (v - yMin) / (yMax - yMin)) * (H - P.t - P.b);
  const pts = hist.map((p, i) => ({ px: x(xs[i]), py: y(p.sell), ...p }));
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(' ');
  const gridVals = [yMin + pad, (yMin + yMax) / 2, yMax - pad].map(v => +v.toFixed(1));
  const last = pts[pts.length - 1];
  wrap.innerHTML = `
    <div class="chart-wrap">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('histTitle')}">
        ${range30 ? `<rect x="${P.l}" y="${y(range30[1]).toFixed(1)}" width="${W - P.l - P.r}" height="${(y(range30[0]) - y(range30[1])).toFixed(1)}" fill="var(--band)" />` : ''}
        ${gridVals.map(v => `
          <line x1="${P.l}" x2="${W - P.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="var(--rule)" stroke-width="1" stroke-dasharray="2 4"/>
          <text x="${P.l - 7}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="var(--ink-faint)" class="num">${v.toFixed(1)}</text>`).join('')}
        <path d="${line}" fill="none" stroke="var(--square)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        ${pts.map(p => `<circle cx="${p.px.toFixed(1)}" cy="${p.py.toFixed(1)}" r="4" fill="var(--square)" stroke="var(--paper)" stroke-width="2"/>`).join('')}
        <text x="${Math.min(last.px, W - P.r - 4).toFixed(1)}" y="${(last.py - 12).toFixed(1)}" text-anchor="end" font-size="12.5" font-weight="700" fill="var(--square)" class="num">${last.sell.toFixed(2)}</text>
        ${pts.map(p => `<text x="${p.px.toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="10.5" fill="var(--ink-faint)">${fmtDateShort(p.d)}</text>`).join('')}
        ${pts.map((p, i) => `<circle data-i="${i}" cx="${p.px.toFixed(1)}" cy="${p.py.toFixed(1)}" r="16" fill="transparent" style="cursor:crosshair"/>`).join('')}
      </svg>
      <div class="tooltip" id="chart-tip"></div>
    </div>
    <div class="chart-meta">
      ${range30 ? `<span>${t('histRange30')} <span class="num">${range30[0].toFixed(2)} – ${range30[1].toFixed(2)} ${t('da')}</span></span>` : ''}
      <span>${t('histBuilding')}</span>
    </div>`;
  const svg = wrap.querySelector('svg'), tip = $('#chart-tip');
  svg.addEventListener('pointermove', (e) => {
    const target = e.target.closest('circle[data-i]');
    if (!target) { tip.classList.remove('show'); return; }
    const p = pts[+target.dataset.i];
    const rect = svg.getBoundingClientRect();
    tip.textContent = `${fmtDateShort(p.d)} · ${p.sell.toFixed(2)} ${t('da')}`;
    tip.style.left = (p.px / W * rect.width) + 'px';
    tip.style.top = (p.py / H * rect.height) + 'px';
    tip.classList.add('show');
  });
  svg.addEventListener('pointerleave', () => tip.classList.remove('show'));
}

/* ---------- alerts ---------- */
function renderAlerts() {
  $('#alerts-title').textContent = t('alertsTitle');
  $('#alerts-sub').textContent = t('alertsSub');
  $('#alerts-inner').innerHTML = `
    <div class="alert-form">
      <span>${t('alertWhen')}</span>
      <select id="al-cur">${Object.keys(state.data.rates).map(c => `<option>${c}</option>`).join('')}</select>
      <select id="al-dir">
        <option value="above">${t('alertAbove')}</option>
        <option value="below">${t('alertBelow')}</option>
      </select>
      <input id="al-th" type="number" step="0.5" placeholder="280">
      <span>${t('da')}</span>
      <button class="set-btn" id="al-set">${t('alertSet')}</button>
    </div>
    <div class="alert-list">
      ${state.alerts.length ? state.alerts.map((a, i) => `
        <div class="alert-item">
          <span class="num">${a.cur} ${a.dir === 'above' ? t('alertAbove') : t('alertBelow')} ${a.threshold} ${t('da')}</span>
          <button class="rm" data-rm="${i}">${t('alertRemove')}</button>
        </div>`).join('') : `<p class="alert-none">${t('alertNone')}</p>`}
    </div>`;
  $('#al-set').addEventListener('click', () => {
    const th = parseFloat($('#al-th').value);
    if (!isFinite(th) || th <= 0) return;
    state.alerts.push({ cur: $('#al-cur').value, dir: $('#al-dir').value, threshold: th });
    store.set('alerts', state.alerts);
    renderAlerts(); checkAlerts();
  });
}
function checkAlerts() {
  const fired = [];
  for (const a of state.alerts) {
    const sell = state.data.rates[a.cur]?.parallel.sell;
    if (sell == null) continue;
    if ((a.dir === 'above' && sell >= a.threshold) || (a.dir === 'below' && sell <= a.threshold)) {
      fired.push(t('alertFired', a.cur, a.dir, a.threshold, sell.toFixed(2)));
    }
  }
  $('#alert-banner').innerHTML = fired.length ? `<div class="alert-banner">${fired.map(esc).join('<br>')}</div>` : '';
}

/* ---------- footer ---------- */
function renderFooter() {
  $('#sources-title').textContent = t('sourcesTitle');
  $('#sources-inner').innerHTML = `<ul>${state.data.sources.map(s =>
    `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.name)}</a></li>`).join('')}</ul>`;
  $('#legal').textContent = t('legal');
  $('#updated').textContent = `${t('updated')} : ${new Date(state.data.updated).toLocaleString(LANG === 'ar' ? 'ar-DZ' : 'fr-FR')}`;
}

/* ---------- events ---------- */
document.addEventListener('click', (ev) => {
  const chip = ev.target.closest('.chip[data-cur]');
  if (chip) { state.cur = chip.dataset.cur; store.set('cur', state.cur); renderConverter(); return; }
  const dir = ev.target.closest('[data-dir]');
  if (dir) { state.dir = dir.dataset.dir; store.set('dir', state.dir); renderConverter(); return; }
  const rm = ev.target.closest('[data-rm]');
  if (rm) { state.alerts.splice(+rm.dataset.rm, 1); store.set('alerts', state.alerts); renderAlerts(); checkAlerts(); return; }
  if (ev.target.closest('#lang-btn')) { setLang(LANG === 'fr' ? 'ar' : 'fr'); renderAll(); }
});

/* ---------- boot ---------- */
setLang(LANG);
loadData()
  .catch(() => { state.data = store.get('cachedData', null); })
  .then(() => { if (state.data) renderAll(); });
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js');
}
