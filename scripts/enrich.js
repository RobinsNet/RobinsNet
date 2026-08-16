#!/usr/bin/env node
/* 从 dc.fandom 爬虫数据（data/crawler/）补充：
   1) 为缺标题/缺日期的期刊补全 story 标题与封面日期
   2) 把未收录的期数作为散刊（standalone）加入（后危机时代 1986+ 范围）
   3) 从爬虫 characters 字段映射人物标签
   用法：node scripts/merge.js && node scripts/cleanup.js && node scripts/enrich.js */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const crawlerDir = path.join(ROOT, 'data', 'crawler');

/* ---------- 爬虫文件 → 项目系列映射 ---------- */
// detective-comics-vol-1.json 同时含 v1(#0-881)、重生续刊(#934-1111) 与 #1000000（DC One Million 纪念刊，属 v1）
const FILE_SERIES = [
  { file: 'detective-comics-vol-1.json', pick: (n) => (n >= 934 && n <= 1111 ? 'detective-v3' : 'detective') },
  { file: 'batman-vol-1.json', pick: 'batman' },
  { file: 'batman-shadow-of-the-bat-vol-1.json', pick: 'shadow-of-bat' },
  { file: 'nightwing-vol-2.json', pick: 'nightwing-v2' },
  { file: 'nightwing-vol-4.json', pick: 'nightwing-v4' },
  { file: 'robin-vol-4.json', pick: 'robin-v2' },   // 1993–2009 主刊（中文习惯 v4）
  { file: 'robin-vol-1.json', pick: 'robin-v1' },   // Robin I（1991 迷你）
  { file: 'robin-vol-2.json', pick: 'robin-ii' },   // Robin II（1991 迷你）
  { file: 'robin-vol-3.json', pick: 'robin-iii' }   // Robin III（1992 迷你）
];

/* ---------- 人物映射（爬虫角色名 → 项目 persona id） ---------- */
const CHAR_RULES = [
  [/^batman/, 'batman'], [/^nightwing/, 'nightwing'], [/^red hood/, 'redhood'],
  [/^red robin/, 'redrobin'], [/^orphan/, 'orphan'],
  [/^spoiler/, 'spoiler'], [/^oracle/, 'oracle'], [/^batwoman/, 'batwoman'],
  [/^batgirl \(barbara/, 'batgirl-barbara'], [/^batgirl \(cassandra/, 'batgirl-cassandra'], [/^batgirl \(stephanie/, 'batgirl-stephanie'],
  [/^robin \(tim/, 'robin-tim'], [/^robin \(damian/, 'robin-damian'], [/^robin \(stephanie/, 'robin-stephanie'],
  [/^catwoman/, 'catwoman'], [/^azrael/, 'azrael'], [/^alfred/, 'alfred'],
  [/commissioner gordon|james gordon|^gordon/, 'gordon'],
  [/^bane/, 'bane'], [/^joker/, 'joker'], [/ra'?s al ghul/, 'ras'], [/^talia/, 'talia'],
  [/^talon/, 'talon'], [/^hush/, 'hush'], [/^scarecrow/, 'scarecrow'], [/^riddler/, 'riddler'],
  [/^two-face/, 'twopface'], [/^penguin/, 'penguin'], [/^black mask/, 'blackmask'],
  [/^deathstroke/, 'deathstroke'], [/^superman/, 'superman'], [/^wonder woman/, 'wonderwoman'],
  [/teen titans/, 'teentitans'], [/^titans/, 'titans'], [/young justice/, 'youngjustice'],
  [/^outsiders/, 'outsiders'], [/^the flash|flash \(barry/, 'flash'], [/justice league/, 'justiceleague'],
  [/^harley/, 'harley'], [/^clayface/, 'clayface'], [/man-?bat/, 'manbat'], [/^batwing/, 'batwing']
];
function mapCharacters(issue) {
  const out = new Set();
  if (!issue || typeof issue.characters !== 'object') return [];
  const groups = ['Featured Characters', 'Supporting Characters', 'Villains'];
  for (const g of groups) {
    for (const raw of (issue.characters[g] || [])) {
      if (typeof raw !== 'string') continue;
      const name = raw.split(' (')[0].trim().toLowerCase(); // 去掉括号注释
      if (!name) continue;
      for (const [re, pid] of CHAR_RULES) {
        if (re.test(name)) { out.add(pid); break; }
      }
    }
  }
  return [...out];
}
function cleanStory(s) {
  if (!s) return null;
  let t = s.trim();
  t = t.replace(/^"+|"+$/g, '');           // 去掉首尾引号
  t = t.replace(/ ,/g, ',');               // "Intelligence , Part" → "Intelligence, Part"
  t = t.replace(/\s+/g, ' ').trim();
  return t || null;
}
const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
function parseCoverDate(str) {
  if (!str) return null;
  const m = /([a-z]+)[, ]+(\d{4})/i.exec(str);
  if (!m) return null;
  const mo = MONTHS[m[1].toLowerCase()];
  if (!mo) return null;
  return `${m[2]}-${String(mo).padStart(2, '0')}`;
}

/* ---------- 装载爬虫索引 ---------- */
const index = new Map(); // `${seriesId}|${n}` → {t, d, c}
const crawlerAll = [];   // {seriesId, n, t, d, c}
for (const cfg of FILE_SERIES) {
  const fp = path.join(crawlerDir, cfg.file);
  if (!fs.existsSync(fp)) { console.warn(`⚠ 缺失爬虫文件 ${cfg.file}`); continue; }
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
  for (const iss of (data.issues || [])) {
    let sid;
    if (typeof cfg.pick === 'function') sid = cfg.pick(iss.number);
    else sid = cfg.pick;
    const n = String(iss.number);
    const t = cleanStory(iss.story);
    const d = parseCoverDate((iss.info || {})['Cover Date']);
    const c = mapCharacters(iss);
    const rec = { sid, n, t, d, c };
    index.set(`${sid}|${n}`, rec);
    crawlerAll.push(rec);
  }
}
console.log(`爬虫索引：${index.size} 条（${FILE_SERIES.length} 个文件）`);

/* ---------- 装载项目数据 ---------- */
const eventsPath = path.join(ROOT, 'data', 'events.json');
const arcsPath = path.join(ROOT, 'data', 'arcs.json');
const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
const arcsData = JSON.parse(fs.readFileSync(arcsPath, 'utf8'));
const { arcs } = arcsData;
let standalone = arcsData.standalone;

function eachIssue(items, fn) {
  for (const it of items) {
    for (const p of it.phases || []) p.issues.forEach(iss => fn(iss, it));
    (it.issues || []).forEach(iss => fn(iss, it));
  }
}
const present = new Set();
eachIssue(events, iss => present.add(`${iss.s}|${String(iss.n)}`));
eachIssue(arcs, iss => present.add(`${iss.s}|${String(iss.n)}`));
standalone.forEach(iss => present.add(`${iss.s}|${String(iss.n)}`));

/* ---------- 1) 补标题/日期 ---------- */
let filledT = 0, filledD = 0;
eachIssue([...events, ...arcs], iss => {
  const rec = index.get(`${iss.s}|${String(iss.n)}`);
  if (!rec) return;
  if (!(iss.t || '').trim() && rec.t) { iss.t = rec.t; filledT++; }
  if (!iss.d && rec.d) { iss.d = rec.d; filledD++; }
});
standalone.forEach(iss => {
  const rec = index.get(`${iss.s}|${String(iss.n)}`);
  if (!rec) return;
  if (!(iss.t || '').trim() && rec.t) { iss.t = rec.t; filledT++; }
  if (!iss.d && rec.d) { iss.d = rec.d; filledD++; }
});
console.log(`补全标题 ${filledT} 期、补全日期 ${filledD} 期`);

/* ---------- 1b) 人物并集补充（爬虫核实过的出场 → 并集进已有期刊） ---------- */
let charAdded = 0, charIssues = 0;
function unionChars(iss) {
  const rec = index.get(`${iss.s}|${String(iss.n)}`);
  if (!rec || !rec.c.length) return;
  const cur = iss.c || [];
  const set = new Set(cur);
  let changed = false;
  for (const p of rec.c) {
    if (!set.has(p)) { set.add(p); charAdded++; changed = true; }
  }
  if (changed) { iss.c = [...set]; charIssues++; }
}
eachIssue([...events, ...arcs], unionChars);
standalone.forEach(unionChars);
console.log(`人物标签并集补充：${charIssues} 期新增 ${charAdded} 个标签`);

/* ---------- 2) 补充未收录期数（后危机 1986+）为散刊 ---------- */
let added = 0;
const bySeries = {};
for (const rec of crawlerAll) {
  const key = `${rec.sid}|${rec.n}`;
  if (present.has(key)) continue;
  if (rec.d && rec.d < '1986-01') continue; // 只收录后危机时代（1986+）
  // 无日期但期号明显的后危机范围，按系列放行（Shadow of the Bat / Robin v2 / Nightwing v2 天然在后危机）
  standalone.push({ s: rec.sid, n: rec.n, t: rec.t, d: rec.d, p: null, c: rec.c });
  present.add(key);
  bySeries[rec.sid] = (bySeries[rec.sid] || 0) + 1;
  added++;
}
console.log(`新增散刊 ${added} 期：`);
for (const [k, v] of Object.entries(bySeries)) console.log(`  ${k}: +${v}`);
console.log(`散刊总数：${standalone.length}`);

/* ---------- 3) 补全后重排：阶段内按封面日期稳定排序（enrich 可能刚填了日期） ---------- */
function sortByDate(list) {
  return list.map((i, idx) => ({ i, idx }))
    .sort((a, b) => {
      const da = a.i.d || '\uffff', db = b.i.d || '\uffff';
      if (da !== db) return da < db ? -1 : 1;
      return a.idx - b.idx;
    })
    .map(x => x.i);
}
for (const it of [...events, ...arcs]) {
  if (it.phases && it.phases.some(p => p.ordered)) continue; // 规范阅读顺序，保持原序
  if (it.phases) it.phases.forEach(p => { p.issues = sortByDate(p.issues); });
  else if (it.issues) it.issues = sortByDate(it.issues);
}
standalone = sortByDate(standalone);

fs.writeFileSync(eventsPath, JSON.stringify(events, null, 1) + '\n');
fs.writeFileSync(arcsPath, JSON.stringify({ arcs, standalone }, null, 1) + '\n');
console.log('enrich 完成，已写回 events.json / arcs.json');
