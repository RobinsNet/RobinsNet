#!/usr/bin/env node
/* merge 后清理：删除冗余合并事件、修复事件内重复期号 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const eventsPath = path.join(ROOT, 'data', 'events.json');
const arcsPath = path.join(ROOT, 'data', 'arcs.json');
let events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
const arcsData = JSON.parse(fs.readFileSync(arcsPath, 'utf8'));

// 1) 删除冗余的合并事件（已由更详细的独立事件覆盖）
const REMOVE = new Set(['bruce-wayne-murderer-fugitive']);
events = events.filter(e => !REMOVE.has(e.id));

// 2) 事件/弧线内按 (s,n) 去重，保留首个
function dedupeIssues(list) {
  const seen = new Set();
  return list.filter(i => {
    const k = `${i.s}|${i.n}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
// 3) 阶段内按封面日期稳定排序（同月保持原相对顺序，无日期排最后）；
//    阶段按各自最早日期排序。保证事件内阅读顺序 = 发行时间从早到晚。
function minDate(list) {
  let m = null;
  for (const i of list) if (i.d && (!m || i.d < m)) m = i.d;
  return m;
}
function sortByDate(list) {
  return list.map((i, idx) => ({ i, idx }))
    .sort((a, b) => {
      const da = a.i.d || '\uffff', db = b.i.d || '\uffff';
      if (da !== db) return da < db ? -1 : 1;
      return a.idx - b.idx; // 稳定：同月保持原顺序
    })
    .map(x => x.i);
}
function sortItemChronologically(it) {
  if (it.phases) {
    it.phases.sort((a, b) => {
      const ma = minDate(a.issues) || '\uffff', mb = minDate(b.issues) || '\uffff';
      return ma < mb ? -1 : (ma > mb ? 1 : 0);
    });
    it.phases.forEach(p => { p.issues = sortByDate(p.issues); });
  } else if (it.issues) {
    it.issues = sortByDate(it.issues);
  }
}
for (const e of events) {
  if (e.phases) e.phases.forEach(p => { p.issues = dedupeIssues(p.issues); });
  else e.issues = dedupeIssues(e.issues || []);
  sortItemChronologically(e);
}
arcsData.arcs.forEach(a => {
  if (a.issues) a.issues = dedupeIssues(a.issues);
  else if (a.phases) a.phases.forEach(p => { p.issues = dedupeIssues(p.issues); });
  sortItemChronologically(a);
});
arcsData.standalone = sortByDate(arcsData.standalone);

fs.writeFileSync(eventsPath, JSON.stringify(events, null, 1) + '\n');
fs.writeFileSync(arcsPath, JSON.stringify(arcsData, null, 1) + '\n');

const cnt = (e) => e.phases ? e.phases.reduce((s, p) => s + p.issues.length, 0) : (e.issues || []).length;
const total = events.reduce((s, e) => s + cnt(e), 0) + arcsData.arcs.reduce((s, a) => s + cnt(a), 0) + arcsData.standalone.length;
console.log(`清理完成：events=${events.length} arcs=${arcsData.arcs.length} standalone=${arcsData.standalone.length} 总期数=${total}`);
