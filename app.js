'use strict';
/* 蝙蝠家族阅读指南 · Batman Family Reading Guide — 单页应用 */

const TYPE_ZH = {
  'mega-event': '大事件', saga: '连载大篇', crossover: '跨刊联动',
  arc: '单元弧线', series: '连载系列', 'one-shot': '单刊特刊', gn: '图像小说'
};
const LS = { read: 'bfrl.read', favs: 'bfrl.favs', build: 'bfrl.build' };
const CORE_CHARS = ['batman', 'nightwing', 'redhood', 'robin-tim', 'redrobin', 'robin-damian'];
const MEGA_TYPES = ['mega-event', 'saga', 'crossover'];

const state = {
  data: null, groups: [], items: [],
  view: 'home', current: null, arcTab: 'curated',
  filters: { q: '', eras: [], types: [], chars: [], earths: [], series: [], onlyMega: false, from: '', to: '' },
  read: new Set(), favs: new Set(), build: new Set(),
  evChar: null, evSeries: '', evUnreadOnly: false, evBySeries: false,
  showAllChars: false
};

/* ---------- 工具 ---------- */
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function eraFromDate(d) {
  if (!d || !/^\d{4}-\d{2}$/.test(d)) return null;
  const v = parseInt(d.slice(0, 4), 10) * 12 + parseInt(d.slice(5, 7), 10);
  if (v < 2011 * 12 + 9) return 'P52';
  if (v < 2016 * 12 + 6) return 'New52';
  if (v < 2021 * 12 + 1) return 'Rebirth';
  if (v < 2024 * 12 + 11) return 'Frontier';
  return 'Absolute';
}
function numVal(n) { return /^\d+$/.test(n) ? parseInt(n, 10) : (/^\d+\.\d+$/.test(n) ? parseFloat(n) : 0); }
function seriesName(id) {
  const s = state.idx.series.get(id);
  if (!s) return id;
  return s.name + (s.vol && s.vol > 1 ? ` (Vol. ${s.vol})` : '');
}
function charInfo(id) { return state.idx.chars.get(id) || { nameZh: id, nameEn: id, color: '#888' }; }
function eraInfo(id) { return state.idx.eras.get(id) || { nameZh: id, nameEn: id, color: '#888' }; }
function earthInfo(id) { return state.idx.earths.get(id) || { nameZh: id, nameEn: id }; }
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 1800);
}
function scrollTop() { window.scrollTo({ top: 0 }); }

/* ---------- 数据装载 ---------- */
async function boot() {
  try {
    const [meta, characters, series, earths, continuities, events, arcsData] = await Promise.all([
      fetch('data/meta.json').then(r => r.json()),
      fetch('data/characters.json').then(r => r.json()),
      fetch('data/series.json').then(r => r.json()),
      fetch('data/earths.json').then(r => r.json()),
      fetch('data/continuities.json').then(r => r.json()),
      fetch('data/events.json').then(r => r.json()),
      fetch('data/arcs.json').then(r => r.json())
    ]);
    state.data = {
      meta, characters, series, earths, continuities, events,
      arcs: arcsData.arcs || [], standalone: arcsData.standalone || []
    };
    state.idx = {
      series: new Map(series.map(s => [s.id, s])),
      chars: new Map(characters.map(c => [c.id, c])),
      eras: new Map(continuities.map(c => [c.id, c])),
      earths: new Map(earths.map(e => [e.id, e]))
    };
    state.groups = buildGroups();
    state.items = [
      ...state.data.events.map(e => ({ ...e, kind: 'event' })),
      ...state.data.arcs.map(a => ({ ...a, kind: 'arc' })),
      ...state.groups
    ];
    state.items.sort((a, b) => (a.start || '').localeCompare(b.start || ''));
    loadLS();
    bindUI();
    render();
  } catch (e) {
    console.error(e);
    $('#main').innerHTML = `<div class="empty"><div class="big">⚠️</div><p>数据加载失败：${esc(e.message)}</p><p style="margin-top:8px">请通过本地 HTTP 服务访问（如 <code>python3 -m http.server</code>），不要直接双击打开文件。</p></div>`;
  }
}

function loadLS() {
  try {
    state.read = new Set(JSON.parse(localStorage.getItem(LS.read) || '[]'));
    state.favs = new Set(JSON.parse(localStorage.getItem(LS.favs) || '[]'));
    state.build = new Set(JSON.parse(localStorage.getItem(LS.build) || '[]'));
  } catch (e) { /* ignore */ }
}
function saveLS() {
  try {
    localStorage.setItem(LS.read, JSON.stringify([...state.read]));
    localStorage.setItem(LS.favs, JSON.stringify([...state.favs]));
    localStorage.setItem(LS.build, JSON.stringify([...state.build]));
  } catch (e) { /* ignore */ }
}

/* ---------- 数据访问 ---------- */
function flatIssues(item) {
  if (item.phases) {
    const out = [];
    item.phases.forEach((p, pi) => p.issues.forEach((iss, i) =>
      out.push(Object.assign({}, iss, { _owner: item.id, _pi: pi, _i: i }))));
    return out;
  }
  return (item.issues || []).map((iss, i) => Object.assign({}, iss, { _owner: item.id, _pi: 0, _i: i }));
}
function issueKey(iss) { return `${iss._owner}|${iss._pi}|${iss._i}`; }
function issueCount(item) { return item.phases ? item.phases.reduce((s, p) => s + p.issues.length, 0) : (item.issues || []).length; }
function progressOf(item) {
  const total = issueCount(item);
  if (!total) return 0;
  let done = 0;
  for (const k of state.read) if (k.startsWith(item.id + '|')) done++;
  return Math.round(done / total * 100);
}
function seriesSetOf(item) { return new Set(flatIssues(item).map(i => seriesName(i.s))); }
function charSetOf(item) {
  const s = new Set(item.characters || []);
  flatIssues(item).forEach(i => (i.c || []).forEach(c => s.add(c)));
  return s;
}
function typeZh(t) { return TYPE_ZH[t] || t || '—'; }

/* ---------- Part 标题自动合并 ---------- */
const PART_RE = /^(.*?)[,:\-\u2013\u2014]?\s*(?:part|chapter)\s+(one|1|i|two|2|ii|three|3|iii|four|4|iv|five|5|v|six|6|vi|seven|7|vii|eight|8|viii|nine|9|ix|ten|10|x|finale|conclusion|final|end)\b.*$/i;
const PART_NUM = { one: 1, '1': 1, i: 1, two: 2, '2': 2, ii: 2, three: 3, '3': 3, iii: 3, four: 4, '4': 4, iv: 4, five: 5, '5': 5, v: 5, six: 6, '6': 6, vi: 6, seven: 7, '7': 7, vii: 7, eight: 8, '8': 8, viii: 8, nine: 9, '9': 9, ix: 9, ten: 10, '10': 10, x: 10, finale: 99, conclusion: 99, final: 99, end: 99 };
function normPrefix(s) { return s.replace(/[\s,:.\-\u2013\u2014]+$/g, '').trim().toLowerCase(); }

function buildGroups() {
  const st = state.data.standalone || [];
  const byPrefix = new Map(); // prefix -> [{iss, series}]
  for (const iss of st) {
    if (!iss.t) continue;
    const m = PART_RE.exec(iss.t);
    if (!m) continue;
    const prefix = normPrefix(m[1]);
    if (!prefix) continue;
    if (!byPrefix.has(prefix)) byPrefix.set(prefix, []);
    byPrefix.get(prefix).push(Object.assign({}, iss, { p: PART_NUM[m[2].toLowerCase()] || iss.p }));
  }
  const groups = [];
  for (const [prefix, issues] of byPrefix) {
    if (issues.length < 2) continue;
    issues.sort((a, b) => ((a.d || '').localeCompare(b.d || '')) || seriesName(a.s).localeCompare(seriesName(b.s)) || numVal(a.n) - numVal(b.n));
    // 按时间连续性聚类：同一前缀下，与上一期间隔 > 5 个月视为不同故事，拆开
    let cluster = [issues[0]];
    const clusters = [cluster];
    for (let i = 1; i < issues.length; i++) {
      const prevD = issues[i - 1].d, curD = issues[i].d;
      if (prevD && curD) {
        const gap = (parseInt(curD.slice(0, 4), 10) * 12 + parseInt(curD.slice(5, 7), 10)) -
                    (parseInt(prevD.slice(0, 4), 10) * 12 + parseInt(prevD.slice(5, 7), 10));
        if (gap > 5) { cluster = []; clusters.push(cluster); }
      }
      cluster.push(issues[i]);
    }
    for (const g of clusters) {
      if (g.length < 2) continue;
      const dates = g.map(i => i.d).filter(Boolean).sort();
      const era = eraFromDate(dates[0]) || 'P52';
      const seriesNames = [...new Set(g.map(i => seriesName(i.s)))];
      groups.push({
        id: 'group:' + seriesNames.join('+') + ':' + normPrefix(prefix),
        kind: 'group',
        name: prefix.replace(/\b\w/g, c => c.toUpperCase()),
        nameZh: `「${prefix}」连续篇（自动合并）`,
        type: 'arc',
        era,
        earth: era === 'P52' ? 'new-earth' : 'earth-0',
        start: dates[0] || '', end: dates[dates.length - 1] || '',
        summaryZh: `由 ${g.length} 期标题连续（Part One/Two…）的散刊自动合并而成${seriesNames.length > 1 ? '（跨刊物）' : ''}。`,
        characters: [...new Set(g.flatMap(i => i.c || []))],
        issues: g
      });
    }
  }
  groups.sort((a, b) => (a.start || '').localeCompare(b.start || ''));
  return groups;
}

/* ---------- 筛选 ---------- */
function matchesFilters(item) {
  const f = state.filters;
  if (f.onlyMega && !MEGA_TYPES.includes(item.type)) return false;
  if (f.eras.length && !f.eras.includes(item.era)) return false;
  if (f.types.length && !f.types.includes(item.type)) return false;
  if (f.earths.length && !f.earths.includes(item.earth)) return false;
  if (f.chars.length) {
    const cs = charSetOf(item);
    if (!f.chars.some(c => cs.has(c))) return false;
  }
  if (f.series.length) {
    const ss = seriesSetOf(item);
    if (!f.series.some(s => ss.has(s))) return false;
  }
  if (f.from && (item.start || '') < f.from && (item.end || '') < f.from) return false;
  if (f.to && (item.start || '') > f.to) return false;
  if (f.q) {
    const q = f.q.toLowerCase();
    const hay = [item.name, item.nameZh, item.summaryZh,
      [...seriesSetOf(item)].join(' '),
      [...charSetOf(item)].map(c => charInfo(c).nameZh + ' ' + charInfo(c).nameEn).join(' ')
    ].join(' ').toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}
function filteredItems(kinds) {
  return state.items.filter(it => (!kinds || kinds.includes(it.kind)) && matchesFilters(it));
}

/* ---------- 全局 UI 绑定 ---------- */
function bindUI() {
  $('#nav').addEventListener('click', e => {
    const b = e.target.closest('button[data-view]');
    if (b) { state.view = b.dataset.view; render(); }
  });
  document.querySelector('.brand').addEventListener('click', () => { state.view = 'home'; render(); });
  $('#search').addEventListener('input', e => {
    state.filters.q = e.target.value.trim();
    if (state.view === 'home' || state.view === 'event') state.view = 'events';
    render();
  });
  $('#main').addEventListener('click', onMainClick);
  $('#filterbar').addEventListener('click', onFilterClick);
  $('#filterbar').addEventListener('change', onFilterChange);
  $('#filterbar').addEventListener('input', onFilterInput);
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'ev-series') { state.evSeries = t.value; render(); }
    if (t.id === 'ev-unread') { state.evUnreadOnly = t.checked; render(); }
    if (t.id === 'ev-byseries') { state.evBySeries = t.checked; render(); }
  });
}

function onMainClick(e) {
  const t = e.target;
  // 事件详情内的"只看人物"chips
  if (t.dataset && t.dataset.kind === 'evchar') {
    state.evChar = state.evChar === t.dataset.val ? null : t.dataset.val;
    render();
    return;
  }
  if (t.dataset && t.dataset.action === 'open-era') {
    state.filters.eras = [t.dataset.era];
    state.view = 'events';
    render();
    scrollTop();
    return;
  }
  const actionEl = t.closest('[data-action]');
  if (actionEl) {
    const a = actionEl.dataset.action;
    const id = actionEl.dataset.id;
    if (a === 'nav') { state.view = actionEl.dataset.view; render(); return; }
    if (a === 'open') { state.current = id; state.view = 'event'; render(); scrollTop(); return; }
    if (a === 'fav') { toggleFav(id); render(); return; }
    if (a === 'tab') { state.arcTab = actionEl.dataset.tab; render(); return; }
    if (a === 'mark') { markAll(id, actionEl.dataset.val === '1'); render(); return; }
    if (a === 'export-text') { exportText(id); return; }
    if (a === 'export-csv') { exportCsv(id); return; }
    if (a === 'export-text-list') { exportTextList(); return; }
    if (a === 'export-csv-list') { exportCsvList(); return; }
    if (a === 'copy-list') { copyTextList(); return; }
    if (a === 'add-build') {
      if (id === '__filtered__') {
        const list = filteredItems(null);
        list.forEach(i => state.build.add(i.id));
        saveLS();
        toast(`已加入 ${list.length} 个事件到清单`);
      } else if (id) {
        state.build.add(id);
        saveLS();
        toast('已加入我的清单');
      }
      render();
      return;
    }
    if (a === 'clear-build') { state.build.clear(); saveLS(); render(); return; }
    if (a === 'remove-build') { state.build.delete(id); saveLS(); render(); return; }
    if (a === 'remove-fav') { state.favs.delete(id); saveLS(); render(); return; }
    if (a === 'nav-adj') {
      const dir = Number(actionEl.dataset.dir);
      const list = filteredItems(null);
      const idx = list.findIndex(i => i.id === state.current);
      const n = list[(idx + dir + list.length) % list.length];
      if (n) { state.current = n.id; render(); scrollTop(); }
      return;
    }
  }
  const chk = t.closest('input[type=checkbox].issue-chk');
  if (chk) {
    const key = chk.dataset.key;
    if (chk.checked) state.read.add(key); else state.read.delete(key);
    saveLS();
    return;
  }
}

function toggleFav(id) {
  if (state.favs.has(id)) state.favs.delete(id); else state.favs.add(id);
  saveLS();
}
function markAll(id, val) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;
  flatIssues(item).forEach(iss => {
    const k = issueKey(iss);
    if (val) state.read.add(k); else state.read.delete(k);
  });
  saveLS();
  toast(val ? '已标记本事件全部已读' : '已清除本事件进度');
}
function itemById(id) { return state.items.find(i => i.id === id); }

function onFilterClick(e) {
  const t = e.target;
  if (t.classList.contains('chip')) {
    const kind = t.dataset.kind, val = t.dataset.val;
    const arr = state.filters[kind];
    const i = arr.indexOf(val);
    if (i >= 0) arr.splice(i, 1); else arr.push(val);
    render();
    return;
  }
  if (t.dataset && t.dataset.action === 'more-chars') { state.showAllChars = !state.showAllChars; render(); return; }
  if (t.dataset && t.dataset.action === 'clear-filters') {
    state.filters = { q: '', eras: [], types: [], chars: [], earths: [], series: [], onlyMega: false, from: '', to: '' };
    $('#search').value = '';
    render();
  }
}
function onFilterChange(e) {
  const t = e.target;
  if (t.id === 'f-type') { state.filters.types = t.value ? [t.value] : []; render(); return; }
  if (t.id === 'f-earth') { state.filters.earths = t.value ? [t.value] : []; render(); return; }
  if (t.id === 'f-series') { state.filters.series = t.value ? [t.value] : []; render(); return; }
  if (t.id === 'f-onlymega') { state.filters.onlyMega = t.checked; render(); return; }
  if (t.id === 'f-from') { state.filters.from = t.value; render(); return; }
  if (t.id === 'f-to') { state.filters.to = t.value; render(); return; }
}
function onFilterInput(e) {
  const t = e.target;
  if (t.id === 'f-from') { state.filters.from = t.value; render(); return; }
  if (t.id === 'f-to') { state.filters.to = t.value; render(); return; }
}

/* ---------- 渲染 ---------- */
function render() {
  renderFilterbar();
  renderNav();
  const main = $('#main');
  switch (state.view) {
    case 'events': main.innerHTML = viewEvents(); break;
    case 'event': main.innerHTML = viewEvent(); break;
    case 'timeline': main.innerHTML = viewTimeline(); break;
    case 'arcs': main.innerHTML = viewArcs(); break;
    case 'mylist': main.innerHTML = viewMyList(); break;
    case 'about': main.innerHTML = viewAbout(); break;
    default: main.innerHTML = viewHome();
  }
}
function renderNav() {
  document.querySelectorAll('#nav button').forEach(b => {
    b.classList.toggle('active', b.dataset.view === state.view);
  });
}
function renderFilterbar() {
  const fb = $('#filterbar');
  if (state.view === 'event') { fb.style.display = 'none'; return; }
  fb.style.display = 'flex';
  const f = state.filters;
  const eras = state.data.continuities;
  const chars = state.showAllChars ? state.data.characters : state.data.characters.filter(c => CORE_CHARS.includes(c.id));
  const types = Object.keys(TYPE_ZH);
  const earths = state.data.earths;
  const seriesSet = new Set();
  state.items.forEach(i => seriesSetOf(i).forEach(s => seriesSet.add(s)));
  (state.data.standalone || []).forEach(i => seriesSet.add(seriesName(i.s)));
  const seriesList = [...seriesSet].sort();
  const chip = (kind, val, label, cls) =>
    `<button class="chip ${f[kind].includes(val) ? 'on' : ''} ${cls || ''}" data-kind="${kind}" data-val="${val}">${esc(label)}</button>`;
  fb.innerHTML = `
    <div class="fgroup"><span class="flabel">时代</span>
      ${eras.map(e => chip('eras', e.id, e.nameZh, `era-${e.id}`)).join('')}
    </div>
    <div class="fgroup"><span class="flabel">人物</span>
      ${chars.map(c => chip('chars', c.id, c.nameZh)).join('')}
      <button class="fbtn" data-action="more-chars">${state.showAllChars ? '收起' : '更多'}</button>
    </div>
    <div class="fgroup"><span class="flabel">类型</span>
      <select id="f-type" class="filter-select"><option value="">全部</option>${types.map(t => `<option value="${t}" ${f.types.includes(t) ? 'selected' : ''}>${TYPE_ZH[t]}</option>`).join('')}</select>
    </div>
    <div class="fgroup"><span class="flabel">地球</span>
      <select id="f-earth" class="filter-select"><option value="">全部</option>${earths.map(e => `<option value="${e.id}" ${f.earths.includes(e.id) ? 'selected' : ''}>${e.nameZh}</option>`).join('')}</select>
    </div>
    <div class="fgroup"><span class="flabel">刊物</span>
      <select id="f-series" class="filter-select"><option value="">全部</option>${seriesList.map(s => `<option value="${s}" ${f.series.includes(s) ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>
    </div>
    <div class="fgroup">
      <label class="toggle"><input type="checkbox" id="f-onlymega" ${f.onlyMega ? 'checked' : ''}> 仅大事件</label>
      <input type="month" id="f-from" class="filter-select" value="${f.from}" title="起始月份">
      <span style="color:var(--text3)">–</span>
      <input type="month" id="f-to" class="filter-select" value="${f.to}" title="截止月份">
      <button class="fbtn danger" data-action="clear-filters">重置</button>
    </div>`;
}

/* ---------- 通用卡片 ---------- */
function itemCard(it) {
  const era = eraInfo(it.era);
  const pct = progressOf(it);
  const cs = charSetOf(it);
  const chars = [...cs].slice(0, 6);
  const more = cs.size > chars.length;
  return `
  <div class="event-card" data-action="open" data-id="${esc(it.id)}">
    <div class="era-stripe" style="background:${era.color}"></div>
    <h3>${esc(it.name)} <span class="zh">${esc(it.nameZh)}</span></h3>
    <div class="meta">
      <span class="badge type-${it.type}">${typeZh(it.type)}</span>
      <span class="badge">${era.nameZh}</span>
      <span class="badge">${earthInfo(it.earth).nameZh}</span>
      <span class="dates">${esc(it.start || '?')} ~ ${esc(it.end || '?')}</span>
    </div>
    <div class="chips">${chars.map(c => { const ci = charInfo(c); return `<span class="minichip" style="border-color:${ci.color}88;color:${ci.color}">${esc(ci.nameZh)}</span>`; }).join('')}${more ? '<span class="minichip">…</span>' : ''}</div>
    <div class="foot">
      <span class="issues-n">${issueCount(it)} 期</span>
      <button class="favbtn ${state.favs.has(it.id) ? 'on' : ''}" data-action="fav" data-id="${esc(it.id)}" title="收藏">${state.favs.has(it.id) ? '★' : '☆'}</button>
    </div>
    <div class="pbar"><i style="width:${pct}%"></i></div>
  </div>`;
}

/* ---------- 总览 ---------- */
function viewHome() {
  const d = state.data;
  const validOwners = new Set(state.items.map(i => i.id));
  const totalIssues = state.items.reduce((s, i) => s + issueCount(i), 0);
  let read = 0;
  for (const k of state.read) if (validOwners.has(k.split('|')[0])) read++;
  const pctAll = totalIssues ? Math.round(read / totalIssues * 100) : 0;
  const featured = [...d.events].sort((a, b) => issueCount(b) - issueCount(a)).slice(0, 6);
  return `
  <div class="hero">
    <h2>蝙蝠家族 <span class="zh">跨刊事件阅读指南</span></h2>
    <p class="subtitle">以蝙蝠侠 / 夜翼 / 红头罩 / 罗宾 / 红罗宾为核心 · 覆盖后危机时代至今（P52 → New 52 → Rebirth → 黎明 → 绝对宇宙）</p>
    <div class="stat-row">
      <div class="stat"><div class="num">${d.events.length}</div><div class="lbl">大事件 / 弧线</div></div>
      <div class="stat"><div class="num">${d.arcs.length}</div><div class="lbl">策划单元弧线</div></div>
      <div class="stat"><div class="num">${state.groups.length}</div><div class="lbl">自动合并连续篇</div></div>
      <div class="stat"><div class="num">${totalIssues}</div><div class="lbl">收录期数</div></div>
      <div class="stat"><div class="num" style="color:var(--ok)">${pctAll}%</div><div class="lbl">阅读进度</div></div>
    </div>
  </div>
  <div class="sec"><h3>按时代浏览</h3>
    <div class="era-grid">
      ${d.continuities.map(e => {
        const n = state.items.filter(i => i.era === e.id).length;
        return `<div class="era-card" style="--ec:${e.color}" data-action="open-era" data-era="${e.id}">
          <h3>${e.nameZh}</h3><div class="en">${e.nameEn}</div>
          <div class="range">${e.range}</div>
          <div class="count">${n} 个事件 / 弧线</div></div>`;
      }).join('')}
    </div>
  </div>
  <div class="sec"><h3>大事件速览（按期数最多）</h3>
    <div class="card-grid">${featured.map(itemCard).join('')}</div>
  </div>
  <div class="sec"><h3>使用提示</h3>
    <div class="about-card">
      <ul>
        <li><b>事件库</b>：选择大事件（如 No Man's Land、Knightfall）→ 得到跨刊交错排列的完整阅读顺序与当期标题。</li>
        <li><b>时间线</b>：所有事件/弧线按封面日期排序，按时代分区。</li>
        <li><b>单元弧线</b>：标题带 Part One/Two 的散刊会被自动合并成连续篇。</li>
        <li><b>筛选</b>：顶部可按 时代 / 人物 / 类型 / 地球 / 刊物 / 月份 组合筛选；勾选期刊可记录进度（保存在本机）。</li>
      </ul>
    </div>
  </div>`;
}

/* ---------- 事件库 ---------- */
function viewEvents() {
  const evs = filteredItems(['event']);
  const arcs = filteredItems(['arc']);
  const groups = filteredItems(['group']);
  const onlyEvent = state.filters.onlyMega;
  let html = `<div class="hero" style="padding-top:10px"><h2 style="font-size:22px">事件库 <span class="zh">· ${evs.length} 个大事件 / 弧线</span></h2></div>`;
  if (!evs.length && !arcs.length && !groups.length) {
    return html + `<div class="empty"><div class="big">🦇</div><p>没有符合当前筛选的事件，试试重置筛选。</p></div>`;
  }
  if (evs.length) html += `<div class="sec"><h3>大事件与弧线（${evs.length}）</h3><div class="card-grid">${evs.map(itemCard).join('')}</div></div>`;
  if (arcs.length && !onlyEvent) html += `<div class="sec"><h3>策划单元弧线（${arcs.length}）</h3><div class="card-grid">${arcs.map(itemCard).join('')}</div></div>`;
  if (groups.length && !onlyEvent) html += `<div class="sec"><h3>自动合并连续篇（${groups.length}）</h3><div class="card-grid">${groups.map(itemCard).join('')}</div></div>`;
  return html;
}

/* ---------- 事件详情 ---------- */
function viewEvent() {
  const it = itemById(state.current);
  if (!it) return `<div class="empty"><p>事件不存在</p></div>`;
  const era = eraInfo(it.era);
  const list = filteredItems(null);
  const idx = list.findIndex(i => i.id === it.id);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx < list.length - 1 ? list[idx + 1] : null;
  const allIss = flatIssues(it);
  const charPool = [...charSetOf(it)].sort();
  const serPool = [...seriesSetOf(it)].sort();
  const pct = progressOf(it);

  const visible = allIss.filter(iss => {
    if (state.evChar && !(iss.c || []).includes(state.evChar)) return false;
    if (state.evSeries && seriesName(iss.s) !== state.evSeries) return false;
    if (state.evUnreadOnly && state.read.has(issueKey(iss))) return false;
    return true;
  });

  const rel = (it.related || []).map(itemById).filter(Boolean);

  let body;
  if (state.evBySeries) {
    const bySer = new Map();
    visible.forEach(iss => {
      const sn = seriesName(iss.s);
      if (!bySer.has(sn)) bySer.set(sn, []);
      bySer.get(sn).push(iss);
    });
    body = [...bySer.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([sn, iss]) => `
      <div class="phase-block"><div class="phase-head"><h3>${esc(sn)}</h3><span class="pcount">${iss.length} 期</span></div>
      ${issueTable(iss)}</div>`).join('');
  } else if (it.phases) {
    body = it.phases.map((p, pi) => {
      const pIss = visible.filter(iss => iss._pi === pi);
      return `<div class="phase-block"><div class="phase-head"><h3>${esc(p.nameZh)}</h3><span class="en">${esc(p.name)}</span><span class="pcount">${pIss.length} / ${p.issues.length} 期</span></div>${issueTable(pIss)}</div>`;
    }).join('');
  } else {
    body = `<div class="phase-block"><div class="phase-head"><h3>全部期数</h3><span class="pcount">${visible.length} 期</span></div>${issueTable(visible)}</div>`;
  }

  return `
  <a class="backlink" data-action="nav" data-view="events">← 返回事件库</a>
  <div class="detail-head">
    <h2>${esc(it.name)}</h2>
    <div class="zh-line">${esc(it.nameZh)}</div>
    <div class="meta">
      <span class="badge type-${it.type}">${typeZh(it.type)}</span>
      <span class="badge" style="border-color:${era.color};color:${era.color}">${era.nameZh} · ${era.nameEn}</span>
      <span class="badge">${earthInfo(it.earth).nameZh}</span>
      <span class="badge">${esc(it.start || '?')} ~ ${esc(it.end || '?')}</span>
      <span class="badge">${issueCount(it)} 期 · 已读 ${pct}%</span>
    </div>
    ${it.summaryZh ? `<p class="summary">${esc(it.summaryZh)}</p>` : ''}
    <div class="chips">${[...charSetOf(it)].map(c => { const ci = charInfo(c); return `<span class="cchip" style="border-color:${ci.color}88;background:${ci.color}18"><span style="color:${ci.color}">${esc(ci.nameZh)}</span><span class="real">${esc(ci.nameEn)}</span></span>`; }).join('')}</div>
    <div class="detail-tools">
      <button class="btn primary" data-action="export-text" data-id="${esc(it.id)}">📄 导出阅读清单</button>
      <button class="btn" data-action="export-csv" data-id="${esc(it.id)}">⬇ CSV</button>
      <button class="btn" data-action="mark" data-id="${esc(it.id)}" data-val="1">✓ 全部标记已读</button>
      <button class="btn" data-action="mark" data-id="${esc(it.id)}" data-val="0">清除进度</button>
      <button class="btn" data-action="fav" data-id="${esc(it.id)}">${state.favs.has(it.id) ? '★ 已收藏' : '☆ 收藏'}</button>
      <button class="btn" data-action="add-build" data-id="${esc(it.id)}">＋ 加入我的清单</button>
    </div>
  </div>
  <div class="subfilter">
    <span class="flabel">只看人物</span>
    ${charPool.map(c => `<button class="chip ${state.evChar === c ? 'on' : ''}" data-kind="evchar" data-val="${c}">${esc(charInfo(c).nameZh)}</button>`).join('')}
    <span class="flabel">刊物</span>
    <select id="ev-series" class="filter-select"><option value="">全部</option>${serPool.map(s => `<option value="${s}" ${state.evSeries === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>
    <label class="toggle"><input type="checkbox" id="ev-unread" ${state.evUnreadOnly ? 'checked' : ''}> 仅未读</label>
    <label class="toggle"><input type="checkbox" id="ev-byseries" ${state.evBySeries ? 'checked' : ''}> 按刊分组</label>
  </div>
  ${body}
  ${rel.length ? `<div class="sec"><h3>关联事件</h3><div class="card-grid">${rel.map(itemCard).join('')}</div></div>` : ''}
  <div class="sec" style="display:flex;gap:10px;justify-content:space-between">
    ${prev ? `<button class="btn" data-action="nav-adj" data-dir="-1">← ${esc(prev.name)}</button>` : '<span></span>'}
    ${next ? `<button class="btn" data-action="nav-adj" data-dir="1">${esc(next.name)} →</button>` : ''}
  </div>`;
}

function issueTable(issues) {
  if (!issues.length) return `<p class="empty" style="padding:16px">该分组无期刊（可能被人物/刊目筛选过滤）</p>`;
  return `<table class="issue-table"><thead><tr><th class="chk"></th><th class="num">#</th><th>刊物</th><th>期号</th><th>故事标题</th><th>日期</th><th>人物</th></tr></thead><tbody>
  ${issues.map((iss, i) => {
    const key = issueKey(iss);
    const done = state.read.has(key);
    return `<tr class="${done ? 'done' : ''}">
      <td class="chk"><input type="checkbox" class="issue-chk" data-key="${esc(key)}" ${done ? 'checked' : ''}></td>
      <td class="num">${i + 1}</td>
      <td class="ser">${esc(seriesName(iss.s))}</td>
      <td class="no">#${esc(iss.n)}</td>
      <td class="title">${iss.t ? esc(iss.t) : '<span style="color:var(--text3)">—</span>'}${iss.p ? `<span class="part-badge">Part ${iss.p}</span>` : ''}${iss.x ? `<div class="note">${esc(iss.x)}</div>` : ''}</td>
      <td class="date">${esc(iss.d || '?')}</td>
      <td><span class="cdotts">${(iss.c || []).map(c => { const ci = charInfo(c); return `<span class="cdot" style="background:${ci.color}" title="${esc(ci.nameZh)}"></span>`; }).join('')}</span></td>
    </tr>`;
  }).join('')}
  </tbody></table>`;
}

/* ---------- 时间线 ---------- */
function viewTimeline() {
  const byEra = new Map();
  filteredItems(null).forEach(it => {
    if (!byEra.has(it.era)) byEra.set(it.era, []);
    byEra.get(it.era).push(it);
  });
  let html = `<div class="hero" style="padding-top:10px"><h2 style="font-size:22px">时间线 <span class="zh">· 按封面日期排序</span></h2>
    <p class="subtitle">大事件与单元弧线按连载月份（封面日期）交错排列，点击任意节点查看阅读顺序。</p></div>`;
  let any = false;
  for (const era of state.data.continuities) {
    const list = (byEra.get(era.id) || []).sort((a, b) => (a.start || '').localeCompare(b.start || ''));
    if (!list.length) continue;
    any = true;
    html += `<div class="tl-era"><div class="tl-era-head"><span class="bar" style="background:${era.color}"></span>
      <h3>${era.nameZh}</h3><span class="en">${era.nameEn} · ${era.range}</span><span class="cnt">${list.length} 项</span></div>
      <div class="tl">${list.map(it => {
        const pct = progressOf(it);
        return `<div class="tl-node" style="--node:${era.color}"><div class="tl-card" data-action="open" data-id="${esc(it.id)}">
          <div class="tl-title">${esc(it.name)}<span class="zh">${esc(it.nameZh)}</span></div>
          <div class="tl-meta"><span class="badge type-${it.type}">${typeZh(it.type)}</span><span>${esc(it.start || '?')} ~ ${esc(it.end || '?')}</span><span>${issueCount(it)} 期</span>
          <span class="pbar tl-pbar" style="margin:0"><i style="width:${pct}%"></i></span></div>
          ${it.summaryZh ? `<div class="tl-summary">${esc(it.summaryZh.slice(0, 80))}${it.summaryZh.length > 80 ? '…' : ''}</div>` : ''}
        </div></div>`;
      }).join('')}</div></div>`;
  }
  if (!any) html += `<div class="empty"><div class="big">🗓️</div><p>没有符合筛选的事件。</p></div>`;
  return html;
}

/* ---------- 单元弧线 ---------- */
function viewArcs() {
  const curated = state.data.arcs.filter(matchesFilters);
  const groups = state.groups.filter(matchesFilters);
  const stItems = (state.data.standalone || []).map(iss => ({
    id: 'st:' + seriesName(iss.s) + ':' + iss.n,
    kind: 'one-shot', name: iss.t || '(无标题)', nameZh: '',
    type: 'one-shot', era: iss.era || eraFromDate(iss.d) || 'P52',
    earth: (iss.era || eraFromDate(iss.d) || 'P52') === 'P52' ? 'new-earth' : 'earth-0',
    start: iss.d || '', end: iss.d || '', summaryZh: '',
    characters: iss.c || [], issues: [iss]
  })).filter(matchesFilters);
  const st = stItems;
  const tabs = [['curated', `策划弧线 ${curated.length}`], ['auto', `自动合并连续篇 ${groups.length}`], ['standalone', `散刊 ${st.length}`]];
  let body = '';
  if (state.arcTab === 'auto') {
    body = groups.length ? groups.map(g => {
      const era = eraInfo(g.era);
      return `<div class="group-card"><div class="gname"><span class="q">「</span>${esc(g.name)}<span class="q">」</span> <span class="zh" style="color:var(--text2);font-size:12.5px">${esc(g.nameZh.replace('（自动合并）', ''))}</span></div>
      <div class="gmeta">${era.nameZh} · ${esc(g.start)} ~ ${esc(g.end)} · ${g.issues.length} 期</div>
      <div class="merge-note">🤖 自动合并：以下 ${g.issues.length} 期因故事标题连续（Part One/Two…）归并为同一单元事件</div>
      ${issueTable(flatIssues(g))}</div>`;
    }).join('') : `<div class="empty"><p>暂无自动合并分组。散刊中标题带 Part One/Two 的故事会被合并到这里。</p></div>`;
  } else if (state.arcTab === 'standalone') {
    body = st.length ? `<table class="issue-table"><thead><tr><th>刊物</th><th>期号</th><th>故事标题</th><th>日期</th><th>人物</th></tr></thead><tbody>
      ${st.map(it => { const iss = it.issues[0]; return `<tr><td class="ser">${esc(seriesName(iss.s))}</td><td class="no">#${esc(iss.n)}</td>
      <td class="title">${esc(iss.t || '—')}${iss.p ? `<span class="part-badge">Part ${iss.p}</span>` : ''}</td>
      <td class="date">${esc(iss.d || '?')}</td><td><span class="cdotts">${(iss.c || []).map(c => { const ci = charInfo(c); return `<span class="cdot" style="background:${ci.color}" title="${esc(ci.nameZh)}"></span>`; }).join('')}</span></td></tr>`; }).join('')}
    </tbody></table>` : `<div class="empty"><p>暂无散刊。</p></div>`;
  } else {
    body = curated.length ? `<div class="card-grid">${curated.map(itemCard).join('')}</div>` : `<div class="empty"><p>暂无策划弧线。</p></div>`;
  }
  return `
  <div class="hero" style="padding-top:10px"><h2 style="font-size:22px">单元弧线 <span class="zh">· 大事件之外的故事连续性</span></h2>
  <p class="subtitle">许多多期故事标题带 Part One/Two/Three，本页自动将其合并为单元事件，便于整段阅读。</p></div>
  <div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${state.arcTab === k ? 'on' : ''}" data-action="tab" data-tab="${k}">${l}</button>`).join('')}</div>
  ${body}`;
}

/* ---------- 我的清单 ---------- */
function viewMyList() {
  const validOwners = new Set(state.items.map(i => i.id));
  const totalIssues = state.items.reduce((s, i) => s + issueCount(i), 0);
  let read = 0;
  for (const k of state.read) if (validOwners.has(k.split('|')[0])) read++;
  const pctAll = totalIssues ? Math.round(read / totalIssues * 100) : 0;

  const perEra = state.data.continuities.map(era => {
    const its = state.items.filter(i => i.era === era.id);
    const tot = its.reduce((s, i) => s + issueCount(i), 0);
    let rd = 0;
    its.forEach(i => { for (const k of state.read) if (k.startsWith(i.id + '|')) rd++; });
    return `<div class="prog-card"><div class="pname" style="color:${era.color}">${era.nameZh}</div>
      <div class="pval">${rd} / ${tot} 期</div><div class="pbar"><i style="width:${tot ? Math.round(rd / tot * 100) : 0}%"></i></div></div>`;
  }).join('');

  const perChar = CORE_CHARS.map(cid => {
    const ci = charInfo(cid);
    const its = state.items.filter(i => charSetOf(i).has(cid));
    const tot = its.reduce((s, i) => s + issueCount(i), 0);
    let rd = 0;
    its.forEach(i => flatIssues(i).forEach(iss => {
      if ((iss.c || []).includes(cid) && state.read.has(issueKey(iss))) rd++;
    }));
    return `<div class="prog-card"><div class="pname" style="color:${ci.color}">${ci.nameZh}</div>
      <div class="pval">${rd} / ${tot} 期（按人物标签统计）</div><div class="pbar"><i style="width:${tot ? Math.round(rd / tot * 100) : 0}%"></i></div></div>`;
  }).join('');

  const favs = [...state.favs].map(itemById).filter(Boolean);
  const favHtml = favs.length ? `<div class="fav-list">${favs.map(f => {
    const pct = progressOf(f);
    return `<div class="fav-item" data-action="open" data-id="${esc(f.id)}">
      <span class="fname">${esc(f.name)}<span class="zh">${esc(f.nameZh)}</span></span>
      <span style="font-size:12px;color:var(--text3)">${issueCount(f)} 期 · ${pct}%</span>
      <div class="pbar" style="max-width:200px"><i style="width:${pct}%"></i></div>
      <button class="favbtn" data-action="remove-fav" data-id="${esc(f.id)}">✕</button></div>`;
  }).join('')}</div>` : `<p style="color:var(--text3)">还没有收藏，去事件库点击 ☆ 收藏感兴趣的事件。</p>`;

  const buildItems = [...state.build].map(itemById).filter(Boolean);
  let buildHtml = '';
  if (buildItems.length) {
    const all = buildListIssues();
    buildHtml = `
      <div class="build-tools">
        <button class="btn primary" data-action="export-text-list">📄 导出清单</button>
        <button class="btn" data-action="export-csv-list">⬇ CSV</button>
        <button class="btn" data-action="copy-list">📋 复制</button>
        <button class="btn danger" data-action="clear-build">清空</button>
        <span style="font-size:12px;color:var(--text3);align-self:center">共 ${all.length} 期（跨事件去重）</span>
      </div>
      ${issueTable(all.map((iss, i) => Object.assign({}, iss, { _owner: 'build', _pi: 0, _i: i })))}`;
  }

  return `
  <div class="hero" style="padding-top:10px"><h2 style="font-size:22px">我的清单 <span class="zh">· 进度与自定义阅读清单</span></h2></div>
  <div class="stat-row">
    <div class="stat"><div class="num" style="color:var(--ok)">${pctAll}%</div><div class="lbl">总进度（${read}/${totalIssues}）</div></div>
    <div class="stat"><div class="num">${state.favs.size}</div><div class="lbl">收藏事件</div></div>
    <div class="stat"><div class="num">${state.build.size}</div><div class="lbl">清单内事件</div></div>
  </div>
  <div class="sec"><h3>按时代进度</h3><div class="progress-grid">${perEra}</div></div>
  <div class="sec"><h3>核心人物相关期数进度</h3><div class="progress-grid">${perChar}</div></div>
  <div class="sec"><h3>收藏</h3>${favHtml}</div>
  <div class="sec"><h3>自定义阅读清单</h3>
    <div class="about-card" style="margin-bottom:12px">
      <p>方法：在「事件库 / 时间线」筛选出感兴趣的事件（人物、时代、类型…），点事件卡片右上角 ☆ 收藏，或点详情页「＋ 加入我的清单」；也可以直接点下方按钮把<b>当前筛选结果</b>全部加入。清单按封面日期合并排序，可导出。</p>
    </div>
    <div class="build-tools">
      <button class="btn primary" data-action="add-build" data-id="__filtered__">＋ 加入当前筛选结果（${filteredItems(null).length} 项）</button>
    </div>
    ${buildItems.length ? `<div class="fav-list">${buildItems.map(b => `<div class="fav-item"><span class="fname" data-action="open" data-id="${esc(b.id)}">${esc(b.name)}<span class="zh">${esc(b.nameZh)}</span></span><span style="font-size:12px;color:var(--text3)">${issueCount(b)} 期</span><button class="favbtn" data-action="remove-build" data-id="${esc(b.id)}">✕</button></div>`).join('')}</div>` : ''}
    ${buildHtml}
  </div>`;
}

/* ---------- 关于 ---------- */
function viewAbout() {
  return `
  <div class="hero" style="padding-top:10px"><h2 style="font-size:22px">关于本指南</h2></div>
  <div class="about-card"><h3>为什么需要它</h3>
    <p>DC 的蝙蝠家族故事经常「一个单元故事，横跨多本刊物」：同一段剧情会在 <b>Detective Comics、Batman、Robin、Nightwing、Batman: Shadow of the Bat、Titans、Young Justice</b> 之间来回切换；加上 P52（后危机）、New 52（新52）、Rebirth（重生）、平行地球（Earth-2、Earth-3…）等连续性设定，单独追某一本刊很容易漏掉剧情。</p>
    <p>本指南把跨刊的大事件（如 Batman: Legacy、No Man's Land）整理成<b>按连载月份交错排列的阅读顺序</b>，并列出当期标题；小单元剧情若标题连续（Part One/Two…）也会被<b>自动合并</b>成单元事件。</p>
  </div>
  <div class="about-card"><h3>数据模型</h3>
    <ul>
      <li><b>continuities（时代/连续性）</b>：P52 后危机 1986–2011 / New52 2011–2016 / Rebirth 2016–2021 / Frontier 2021–2024 / Absolute 2024–</li>
      <li><b>earths（地球）</b>：new-earth、earth-0、earth-2、earth-3、flashpoint-earth、absolute-earth</li>
      <li><b>events（大事件）</b>：含 phases 分组与跨刊期列表，期字段 <code>s</code>(系列) <code>n</code>(期号) <code>t</code>(标题) <code>d</code>(封面日期) <code>p</code>(Part) <code>c</code>(人物) <code>x</code>(备注)</li>
      <li><b>arcs（策划弧线）</b>：大事件之外的小单元；<b>standalone（散刊）</b>：带 Part 标题的零散期，由前端自动合并</li>
    </ul>
  </div>
  <div class="about-card"><h3>数据与勘误</h3>
    <p>日期统一使用<b>封面日期（cover date）</b>，即刊物封面标注的发行月份（通常比实际上架早约 2 个月），这是漫画收藏界的标准标注方式。</p>
    <p>数据为社区整理，来源包括 Wikipedia（各事件条目与 "List of Batman comics"）、DC Fandom（dc.fandom.com）、Grand Comics Database 等；个别期号或日期可能仍有出入，欢迎修正。原始研究文件保留在 <code>data/research/</code>，运行 <code>node scripts/merge.js</code> 可重新合并校验。</p>
  </div>
  <div class="about-card"><h3>使用</h3>
    <ul>
      <li>顶部筛选条：时代 / 人物 / 类型 / 地球 / 刊物 / 月份 / 仅大事件</li>
      <li>事件详情页：跨刊阅读顺序表、按人物或刊物过滤、仅未读、按刊分组、导出 TXT/CSV</li>
      <li>进度与收藏保存在浏览器 localStorage，不发送任何数据</li>
      <li>需要本地 HTTP 服务访问（<code>python3 -m http.server</code>），不能直接双击打开</li>
    </ul>
  </div>`;
}

/* ---------- 导出 ---------- */
function exportIssues(item) {
  const allIss = flatIssues(item);
  const visible = allIss.filter(iss => {
    if (state.evChar && !(iss.c || []).includes(state.evChar)) return false;
    if (state.evSeries && seriesName(iss.s) !== state.evSeries) return false;
    return true;
  });
  const era = eraInfo(item.era);
  const lines = [];
  lines.push(`《${item.nameZh}》阅读顺序 — ${item.name}`);
  lines.push(`${era.nameZh} · ${item.start} ~ ${item.end} · 共 ${visible.length} 期`);
  lines.push('='.repeat(46));
  let n = 0;
  if (item.phases) {
    item.phases.forEach((p, pi) => {
      const pIss = visible.filter(iss => iss._pi === pi);
      if (!pIss.length) return;
      lines.push(`\n【${p.nameZh}】`);
      pIss.forEach(iss => {
        n++;
        lines.push(`${String(n).padStart(3)}. ${seriesName(iss.s)} #${iss.n} (${iss.d || '?'}) — ${iss.t || '(无标题)'}${iss.p ? ` [Part ${iss.p}]` : ''}${iss.x ? `  ※${iss.x}` : ''}`);
      });
    });
  } else {
    visible.forEach(iss => {
      n++;
      lines.push(`${String(n).padStart(3)}. ${seriesName(iss.s)} #${iss.n} (${iss.d || '?'}) — ${iss.t || '(无标题)'}${iss.p ? ` [Part ${iss.p}]` : ''}${iss.x ? `  ※${iss.x}` : ''}`);
    });
  }
  return lines.join('\n');
}
function csvFor(issues, itemName) {
  const rows = [['事件', '阶段/来源', '刊物', '期号', '标题', '日期', 'Part', '人物', '已读', '备注']];
  issues.forEach(iss => {
    rows.push([
      itemName || '', iss._src || '', seriesName(iss.s), iss.n, iss.t || '', iss.d || '', iss.p || '',
      (iss.c || []).map(c => charInfo(c).nameZh).join('/'),
      state.read.has(issueKey(iss)) ? '是' : '否', iss.x || ''
    ]);
  });
  return rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
}
function download(name, text, mime) {
  const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
function exportText(id) {
  const it = itemById(id);
  if (!it) return;
  download(`${it.id}-reading-list.txt`, exportIssues(it));
  toast('已导出 TXT 阅读清单');
}
function exportCsv(id) {
  const it = itemById(id);
  if (!it) return;
  download(`${it.id}-issues.csv`, csvFor(flatIssues(it), it.nameZh), 'text/csv;charset=utf-8');
  toast('已导出 CSV');
}
function buildListIssues() {
  const items = [...state.build].map(itemById).filter(Boolean);
  const all = [];
  items.forEach(it => flatIssues(it).forEach(iss => {
    const dk = `${seriesName(iss.s)}|${iss.n}|${iss.d}`;
    if (!all.some(x => x.dk === dk)) all.push(Object.assign({}, iss, { dk, _src: it.nameZh }));
  }));
  all.sort((a, b) => ((a.d || '').localeCompare(b.d || '')) || seriesName(a.s).localeCompare(seriesName(b.s)) || numVal(a.n) - numVal(b.n));
  return all;
}
function exportTextList() {
  const all = buildListIssues();
  if (!all.length) { toast('清单为空'); return; }
  const lines = ['蝙蝠家族阅读清单（自定义）', '='.repeat(46)];
  all.forEach((iss, i) => {
    lines.push(`${String(i + 1).padStart(3)}. ${seriesName(iss.s)} #${iss.n} (${iss.d || '?'}) — ${iss.t || '(无标题)'}${iss.p ? ` [Part ${iss.p}]` : ''}  （${iss._src}）`);
  });
  download('my-reading-list.txt', lines.join('\n'));
  toast('已导出清单');
}
function exportCsvList() {
  const all = buildListIssues();
  if (!all.length) { toast('清单为空'); return; }
  download('my-reading-list.csv', csvFor(all, ''), 'text/csv;charset=utf-8');
  toast('已导出 CSV');
}
function copyTextList() {
  const all = buildListIssues();
  if (!all.length) { toast('清单为空'); return; }
  const text = all.map((iss, i) => `${i + 1}. ${seriesName(iss.s)} #${iss.n} (${iss.d || '?'}) — ${iss.t || ''}`).join('\n');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => toast('已复制到剪贴板'), () => toast('复制失败'));
  }
}

boot();
