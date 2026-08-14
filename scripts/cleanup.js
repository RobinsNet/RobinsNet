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
for (const e of events) {
  if (e.phases) e.phases.forEach(p => { p.issues = dedupeIssues(p.issues); });
  else e.issues = dedupeIssues(e.issues || []);
}
arcsData.arcs.forEach(a => { if (a.issues) a.issues = dedupeIssues(a.issues); else if (a.phases) a.phases.forEach(p => { p.issues = dedupeIssues(p.issues); }); });

fs.writeFileSync(eventsPath, JSON.stringify(events, null, 1) + '\n');
fs.writeFileSync(arcsPath, JSON.stringify(arcsData, null, 1) + '\n');

const cnt = (e) => e.phases ? e.phases.reduce((s, p) => s + p.issues.length, 0) : (e.issues || []).length;
const total = events.reduce((s, e) => s + cnt(e), 0) + arcsData.arcs.reduce((s, a) => s + cnt(a), 0) + arcsData.standalone.length;
console.log(`清理完成：events=${events.length} arcs=${arcsData.arcs.length} standalone=${arcsData.standalone.length} 总期数=${total}`);
