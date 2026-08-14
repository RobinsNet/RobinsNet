#!/usr/bin/env node
/* 合并 data/research/*.json → data/events.json + data/arcs.json，并做数据校验与自动修正 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const researchDir = path.join(ROOT, 'data', 'research');

const seriesTable = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'series.json'), 'utf8'));
const charTable = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'characters.json'), 'utf8'));
const eraTable = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'continuities.json'), 'utf8'));
const earthTable = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'earths.json'), 'utf8'));
let personTable = [];
try { personTable = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'persons.json'), 'utf8')); } catch (e) { /* 可选 */ }

const seriesById = new Map(seriesTable.map(s => [s.id, s]));
const seriesByName = new Map();
for (const s of seriesTable) {
  seriesByName.set(s.name.toLowerCase(), s.id);
  seriesByName.set((s.name + ' vol ' + s.vol).toLowerCase(), s.id);
  seriesByName.set((s.name + ' (vol. ' + s.vol + ')').toLowerCase(), s.id);
}
const charIds = new Set(charTable.map(c => c.id));
const eraIds = new Set(eraTable.map(e => e.id));
const earthIds = new Set(earthTable.map(e => e.id));
const TYPES = new Set(['mega-event', 'saga', 'crossover', 'arc', 'series', 'one-shot', 'gn']);

function eraFromDate(d) {
  if (!d || !/^\d{4}-\d{2}$/.test(d)) return null;
  const v = parseInt(d.slice(0, 4), 10) * 12 + parseInt(d.slice(5, 7), 10);
  if (v < 2011 * 12 + 9) return 'P52';
  if (v < 2016 * 12 + 6) return 'New52';
  if (v < 2021 * 12 + 1) return 'Rebirth';
  if (v < 2024 * 12 + 11) return 'Frontier';
  return 'Absolute';
}
/* 通用标签 batgirl → 具体人物·称号（按刊物/封面日期拆分） */
const BATGIRL_SERIES = {
  'batgirl-v1': ['batgirl-cassandra'],   // 2000-2006 卡珊德拉
  'batgirl-v2': ['batgirl-stephanie'],   // 2009-2011 斯蒂芬妮
  'batgirl-v3': ['batgirl-barbara'],     // 2011-2016 芭芭拉
  'batgirl-v4': ['batgirl-barbara']      // 2016-2020 芭芭拉
};
function expandBatgirl(d, series) {
  if (typeof series === 'string' && BATGIRL_SERIES[series]) return BATGIRL_SERIES[series];
  if (typeof series === 'string' && /oracle/i.test(series)) return ['oracle']; // Oracle 相关单刊 → 芭芭拉(神谕)
  if (!d) return ['batgirl'];
  if (d < '1999-03') return ['batgirl'];            // 空缺期，保留通用
  if (d < '2006-03') return ['batgirl-cassandra'];  // NML 起卡珊德拉
  if (d < '2009-08') return ['batgirl'];            // 空缺期
  if (d < '2011-09') return ['batgirl-stephanie'];  // 斯蒂芬妮
  if (d < '2021-01') return ['batgirl-barbara'];    // 新52/重生 芭芭拉
  return ['batgirl'];                               // Batgirls 时期（卡珊德拉+斯蒂芬妮），保留通用
}
function expandPersonas(tags, d, series) {
  const out = [];
  for (const c of tags) {
    if (c === 'batgirl') out.push(...expandBatgirl(d, series));
    else out.push(c);
  }
  return out;
}
function resolveSeries(s) {
  if (typeof s !== 'string') return String(s);
  if (seriesById.has(s)) return s;
  const key = s.toLowerCase().replace(/\s+/g, ' ').trim();
  if (seriesByName.has(key)) return seriesByName.get(key);
  // try stripping "(Vol. N)" suffix
  const m = key.match(/^(.*?)\s*\(?(?:vol\.?\s*(\d+))?\)?$/);
  return s; // keep as display name
}
function minMax(issues) {
  let min = null, max = null;
  for (const i of issues) {
    if (i && i.d && /^\d{4}-\d{2}$/.test(i.d)) {
      if (!min || i.d < min) min = i.d;
      if (!max || i.d > max) max = i.d;
    }
  }
  return [min, max];
}

const warnings = [];
const seen = new Map(); // id -> item（保留更详细版本）
function warn(msg) { warnings.push(msg); }

function normalizeIssue(iss, src, context, idx) {
  if (!iss || typeof iss !== 'object') { warn(`[${src}] ${context} #${idx}: 非对象，跳过`); return null; }
  const out = {};
  out.s = resolveSeries(iss.s);
  if (!out.s) { warn(`[${src}] ${context} #${idx}: 缺系列，跳过`); return null; }
  out.n = String(iss.n == null ? '' : iss.n);
  out.t = iss.t != null ? String(iss.t) : null;
  if (iss.d && !/^\d{4}-\d{2}$/.test(iss.d)) warn(`[${src}] ${context} ${out.s} #${out.n}: 日期格式异常 "${iss.d}"`);
  out.d = /^\d{4}-\d{2}$/.test(iss.d || '') ? iss.d : null;
  out.p = iss.p == null ? null : Number(iss.p);
  if (out.p != null && (!Number.isFinite(out.p) || out.p < 1)) { warn(`[${src}] ${context} ${out.s} #${out.n}: part 异常 ${iss.p}`); out.p = null; }
  if (Array.isArray(iss.c)) {
    out.c = [];
    for (const c of iss.c) {
      if (charIds.has(c)) out.c.push(c);
      else warn(`[${src}] ${context} ${out.s} #${out.n}: 未知人物 id "${c}"`);
    }
  } else out.c = [];
  out.c = expandPersonas(out.c, out.d, out.s);
  if (iss.x != null) out.x = String(iss.x);
  return out;
}

function countIssues(item) {
  return item.phases ? item.phases.reduce((s, p) => s + p.issues.length, 0) : (item.issues || []).length;
}
function countTitles(item) {
  const iss = item.phases ? item.phases.flatMap(p => p.issues) : (item.issues || []);
  return iss.filter(i => i.t).length;
}
function addItem(item, src) {
  const prev = seen.get(item.id);
  if (!prev) { seen.set(item.id, item); return; }
  // 去重规则：优先保留"有故事标题"的版本（更可靠）；标题数相同时保留期数更多的版本
  const prevT = countTitles(prev), newT = countTitles(item);
  const prevN = countIssues(prev), newN = countIssues(item);
  if (newT > prevT || (newT === prevT && newN > prevN)) {
    warn(`[${src}] 事件 id "${item.id}" 重复：新版本标题更全（${newT} > ${prevT}）或期数更多（${newN} > ${prevN}），采用新版本`);
    seen.set(item.id, item);
  } else {
    warn(`[${src}] 重复 id "${item.id}"：保留既有版本（标题 ${prevT} 期 / 期数 ${prevN}）`);
  }
}

function normalizeItem(item, isEvent, src) {
  if (!item || typeof item !== 'object') { warn(`[${src}] 条目非对象，跳过`); return null; }
  if (!item.id) { warn(`[${src}] 缺 id 的条目，跳过`); return null; }
  const out = { id: item.id, name: item.name || item.id, nameZh: item.nameZh || item.name || item.id, kind: isEvent ? 'event' : 'arc' };
  out.type = TYPES.has(item.type) ? item.type : (isEvent ? 'saga' : 'arc');
  let issues = [];
  if (Array.isArray(item.phases) && item.phases.length > 0) {
    out.phases = [];
    item.phases.forEach((ph, pi) => {
      const norm = [];
      (ph.issues || []).forEach((iss, i) => {
        const n = normalizeIssue(iss, src, `${item.id}/phase${pi}`, i);
        if (n) norm.push(n);
      });
      out.phases.push({ name: ph.name || `Part ${pi + 1}`, nameZh: ph.nameZh || ph.name || `第 ${pi + 1} 阶段`, issues: norm });
      issues = issues.concat(norm);
    });
  } else {
    issues = (item.issues || []).map((iss, i) => normalizeIssue(iss, src, item.id, i)).filter(Boolean);
    if (issues.length === 0) {
      warn(`[${src}] ${isEvent ? '事件' : '弧线'} "${item.id}" 无有效期数，跳过`);
      return null;
    }
    if (!isEvent) out.issues = issues;
    else out.phases = [{ name: item.name || item.id, nameZh: item.nameZh || '全部期数', issues }];
  }
  if (issues.length === 0) { warn(`[${src}] 事件 "${item.id}" 无有效 issues，跳过`); return null; }
  const [minD, maxD] = minMax(issues);
  out.start = /^\d{4}-\d{2}$/.test(item.start || '') ? item.start : (minD || '');
  out.end = /^\d{4}-\d{2}$/.test(item.end || '') ? item.end : (maxD || out.start);
  out.era = eraIds.has(item.era) ? item.era : (eraFromDate(out.start) || (isEvent ? 'P52' : 'P52'));
  out.earth = earthIds.has(item.earth) ? item.earth : (out.era === 'P52' ? 'new-earth' : 'earth-0');
  out.summaryZh = item.summaryZh || '';
  out.characters = Array.isArray(item.characters) ? item.characters.filter(c => charIds.has(c)) : [];
  out.characters = expandPersonas(out.characters, out.start, null);
  if (item.family) out.family = item.family;
  if (Array.isArray(item.related)) out.related = item.related;
  addItem(out, src);
  return out;
}

const standalone = [];
let files = [];
try { files = fs.readdirSync(researchDir).filter(f => f.endsWith('.json')).sort(); }
catch (e) { console.error('无法读取 data/research/', e.message); process.exit(1); }
if (files.length === 0) { console.error('data/research/ 为空'); process.exit(1); }

const failed = [];
for (const f of files) {
  let data;
  try { data = JSON.parse(fs.readFileSync(path.join(researchDir, f), 'utf8')); }
  catch (e) { console.error(`⚠ 解析失败 ${f}: ${e.message}（该文件将被跳过）`); failed.push(f); continue; }
  for (const ev of data.events || []) normalizeItem(ev, true, f);
  for (const ar of data.arcs || []) normalizeItem(ar, false, f);
  for (const iss of data.standalone || []) {
    const n = normalizeIssue(iss, f, 'standalone', standalone.length);
    if (n) standalone.push(n);
  }
}
if (failed.length) console.log(`\n⚠ ${failed.length} 个研究文件解析失败被跳过：${failed.join(', ')}`);

// standalone 补 era（展示用）
for (const s of standalone) s.era = s.era || eraFromDate(s.d) || 'P52';

const allItems = [...seen.values()];
const events = allItems.filter(i => i.kind === 'event');
const arcs = allItems.filter(i => i.kind === 'arc');

events.sort((a, b) => (a.start || '').localeCompare(b.start || ''));
arcs.sort((a, b) => (a.start || '').localeCompare(b.start || ''));

fs.writeFileSync(path.join(ROOT, 'data', 'events.json'), JSON.stringify(events, null, 1) + '\n');
fs.writeFileSync(path.join(ROOT, 'data', 'arcs.json'), JSON.stringify({ arcs, standalone }, null, 1) + '\n');

const totalIssues = [...events, ...arcs].reduce((s, it) => s + allIssues(it).length, 0) + standalone.length;
function allIssues(it) { return it.phases ? it.phases.flatMap(p => p.issues) : (it.issues || []); }
console.log(`合并完成：events=${events.length} arcs=${arcs.length} standalone=${standalone.length} 总期数=${totalIssues}`);
console.log(`来源文件：${files.join(', ')}`);
if (warnings.length) {
  console.log(`\n⚠ ${warnings.length} 条警告（前 40 条）：`);
  warnings.slice(0, 40).forEach(w => console.log('  - ' + w));
} else {
  console.log('✓ 无警告');
}
