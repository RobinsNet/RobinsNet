# 🦇 蝙蝠家族阅读指南 · Batman Family Reading Guide

一个围绕 **蝙蝠侠 / 夜翼 / 红头罩 / 罗宾 / 红罗宾** 的 DC 漫画跨刊事件阅读清单网页应用，覆盖 **后危机时代（P52）至今**。

## 要解决的问题

1. **一个单元故事，横跨多本刊物**：同一段剧情会在 *Detective Comics、Batman、Robin、Nightwing、Batman: Shadow of the Bat、Titans、Young Justice* 之间来回切换——选择某个大事件（如 `Batman: Legacy`、`Batman: No Man's Land`），即可得到**跨刊交错排列的完整阅读顺序**和当期标题。
2. **重启 / 平行宇宙**：P52（后危机 1986–2011）、New 52（2011–2016）、Rebirth（重生，2016–2021）、无限边疆/黎明（2021–2024）、绝对宇宙（2024–）；地球维度（Earth-0 主世界、Earth-2、Earth-3、闪点地球、绝对地球）。
3. **小单元剧情合并**：不属于大事件、但故事标题带 `Part One / Part Two…` 连续性的散刊，会被**自动合并成单元事件**。
4. **按人物 / 时间 / 事件筛选**：顶部筛选条支持 时代、人物、类型、地球、刊物、月份 组合筛选；事件内可再按人物或刊物过滤。

## 功能

| 视图 | 说明 |
| --- | --- |
| 总览 | 数据统计、按时代浏览、大事件速览 |
| 事件库 | 全部大事件/弧线卡片，支持筛选、收藏、进度 |
| 时间线 | 所有事件按封面日期排序，按时代分区 |
| 单元弧线 | 策划弧线 + **自动合并的 Part 连续篇** + 散刊列表 |
| 我的清单 | 进度统计（按时代/人物）、收藏、自定义清单（按封面日期合并排序）、导出 |
| 事件详情 | 分阶段跨刊阅读顺序表、只看某人物/某刊、仅未读、按刊分组、导出 TXT/CSV |

## 运行

需要本地 HTTP 服务（数据用 fetch 加载，不能直接双击打开）：

```bash
cd /Users/tianqiluo/Documents/DeepSeek/DC-comic-reading-list
python3 -m http.server 8123
# 打开 http://127.0.0.1:8123/
```

## 数据规模（v0.1.1 · 已并入 dc.fandom 爬虫数据）

| 时代 | 事件数 | 覆盖重点 |
| --- | --- | --- |
| P52 后危机（1986–2011） | 39 | Year One、Knightfall 传奇（113 期）、Contagion、Legacy、Cataclysm、No Man's Land（69 期）、Murderer/Fugitive、War Games、Under the Hood、R.I.P.、Battle for the Cowl、Reborn 时代、Return of Bruce Wayne、Black Mirror 等 |
| New 52（2011–2016） | 14 | Court of Owls、Night of the Owls、Death of the Family、Zero Year、Batman Eternal、Endgame、Grayson、Robin War 等 |
| Rebirth（2016–2021） | 12 | I Am Gotham/Suicide/Bane、The Button、Metal、City of Bane、Joker War 等 |
| Frontier（2021–2024） | 13 | Future State、Fear State、Robin(2021)、Shadow War、Dark Crisis、Gotham War、Nightwing by Tom Taylor 等 |
| Absolute（2024–） | 1 | Absolute Batman（绝对宇宙） |

- 事件/弧线：**79 大事件 + 40 策划弧线**；期刊：**2490 期**（其中散刊 923 期，含爬虫补入的完整刊目）
- 完整系列覆盖：Batman v1（341 期）、Detective Comics v1+v3（504 期）、Robin v2（186 期，中文社区习惯称 Vol. 4）、Nightwing v2/v4（303 期）、Shadow of the Bat（96 期）、Robin I/II/III 迷你系列（15 期）等
- 标题覆盖：**77%**（散刊 98.8%；事件/弧线内 64.7%）——缺标题主要来自爬虫未覆盖的系列（Batman Eternal、Red Hood 系列、Grayson、Batgirl 系列、Future State 等）
- 人物标签：42 个称号、5900+ 处标记（含此前缺失的**搅局者 Spoiler 96 处**）
| Absolute（2024–） | 1 | Absolute Batman（绝对宇宙） |

合计：**79 个大事件 + 40 条策划单元弧线（含 8 条 Detective Comics v3 独立弧线）+ 923 条散刊 = 2490 期**（数据以封面日期为准）。

## 目录结构

```
.
├── index.html          # 页面骨架
├── app.js              # 单页应用（无依赖、无构建）
├── style.css           # 深色主题样式
├── data/
│   ├── meta.json       # 项目元信息
│   ├── continuities.json # 时代/连续性（P52/New52/Rebirth/Frontier/Absolute + 配色）
│   ├── earths.json     # 地球设定
│   ├── characters.json # 称号 persona（id/中英名/颜色/所属人物/时期）
│   ├── persons.json    # 人物实体（person）
│   ├── series.json     # 刊物（id/名称/卷/起止）
│   ├── events.json     # ★ 大事件（含 phases 分组与跨刊期列表）— 管线生成
│   ├── arcs.json       # ★ 策划弧线 + 散刊 — 管线生成
│   ├── research/       # 研究子代理产出的原始 JSON（保留作数据溯源）
│   └── crawler/        # dc.fandom 爬虫原始数据（标题/封面日期/人物补全来源）
└── scripts/
    ├── merge.js        # 合并 + 校验 research → events.json / arcs.json
    ├── cleanup.js      # 合并后清理（去重/删冗余事件）
    └── enrich.js       # 爬虫补全：标题/日期/人物 + 未收录期数转散刊
```

## 数据模型

### 人物 / 称号时期（person / persona）

同一个人物在不同时期使用不同称号，模型以「**人物（person）→ 称号时期（persona）**」两级区分，筛选、进度统计、事件详情过滤均支持下钻：

| 人物 | 称号时期 |
| --- | --- |
| 蒂姆·德雷克 | 罗宾（1989–2009）→ 红罗宾（2009–） |
| 斯蒂芬妮·布朗 | 搅局者（1992–2009）→ 罗宾（2004–05，War Games）→ 蝙蝠女（2009–2011） |
| 芭芭拉·戈登 | 蝙蝠女（新52/重生 2011–2020）→ 神谕（1989–2011） |
| 卡珊德拉·该隐 | 蝙蝠女（2000–2006 / Batgirls 2021–） |
| 杰森·托德 | 罗宾二世 → 红头罩（2005–） |
| 迪克·格雷森 | 罗宾一世 → 夜翼（兼 2009–2011 代任蝙蝠侠） |

- `data/persons.json`：人物实体（id/中英名/简介/颜色）。
- `data/characters.json`：称号 persona（含 `person` 归属、`start`/`end` 或 `periods` 时期数组）；通用聚合标签 `batgirl` 在 `merge.js` 中按**刊物/封面日期**自动拆分为 `batgirl-barbara` / `batgirl-cassandra` / `batgirl-stephanie`（规则见 `scripts/merge.js` 的 `expandBatgirl`）。
- 已知限制：斯蒂芬妮·布朗的「搅局者」时期期号标签尚未补充（当前 0 期）；2006–2009 与 Batgirls（2021–）等空缺/复合时期的通用标签保留为 `batgirl`。

### 事件 / 弧线结构

事件/弧线（`events.json` / `arcs.json` 中）：

```jsonc
{
  "id": "nml",                     // 唯一 id
  "name": "Batman: No Man's Land", // 英文名
  "nameZh": "无人之地",             // 中文名
  "era": "P52",                    // 时代（continuities.json）
  "earth": "new-earth",            // 地球（earths.json）
  "type": "mega-event",            // mega-event|saga|crossover|arc|series|one-shot|gn
  "start": "1999-03", "end": "2000-03",  // 封面日期 YYYY-MM
  "summaryZh": "两三句中文简介",
  "characters": ["batman", "nightwing", "oracle", "gordon"],
  "family": "可选，所属大事件家族", "related": ["可选关联事件"],
  "phases": [
    { "name": "Ground Zero", "nameZh": "序章",
      "issues": [
        { "s": "batman", "n": "563", "t": "Aftershock, Part One", "d": "1999-03", "p": 1, "c": ["batman"], "x": "备注或省略" }
      ]
    }
  ]
}
```

- `s` 引用 `series.json` 的 id（不在表内的单刊可直接写刊名原文字符串）。
- `c` 引用 `characters.json` 的 id：`batman` / `nightwing` / `redhood` / `robin-tim`（蒂姆任罗宾）/ `redrobin`（蒂姆任红罗宾）/ `robin-damian`（达米安）等。
- 散刊（`standalone`）：带 `Part One/Two…` 标题、不属于任何事件的零散期，前端按「刊物 + 标题前缀」自动合并成单元事件。

## 数据维护

- 标准重建管线：`node scripts/merge.js && node scripts/cleanup.js && node scripts/enrich.js`（merge 合并研究数据 → cleanup 清理 → enrich 用 `data/crawler/` 爬虫数据补全标题/日期/人物，并把未收录期数作为散刊加入）。
- 新增/修正事件：编辑 `data/research/*.json` 后重跑管线，或直接编辑 `data/events.json` / `data/arcs.json`（注意 enrich 会再次补充）。
- `merge.js` 会校验：id 唯一、期号/日期格式、人物/系列 id 是否存在于对照表，并自动补全缺失的起止日期、时代、地球；同一事件多来源并存时，自动保留**有故事标题**且期数更全的版本。
- `cleanup.js` 负责合并后清理（删除冗余合并事件、事件内重复期号去重）。

## 数据说明与勘误

- 日期统一为**封面日期（cover date）**——刊物封面标注的发行月份（通常比实际上架早约 2 个月），是漫画收藏界的标准标注方式，用于排序时代表"连载当时"。
- 数据为社区整理，来源包括 Wikipedia（各事件条目与 *List of Batman comics*）、DC Fandom（dc.fandom.com）、Grand Comics Database 等；个别期号/日期可能有出入，欢迎按上方格式修正。
- 阅读进度 / 收藏 / 清单保存在浏览器 localStorage，**不发送任何数据**。

## 路线图（可选）

- [ ] 扩充更多时代（黄金/白银/青铜时代代表性弧线）与更多 tie-in 刊
- [ ] 增加"已购/想读"标签与 CSV 导入导出进度
- [ ] 事件族谱视图（如 Cataclysm → Road to NML → No Man's Land 的前后关系图）
