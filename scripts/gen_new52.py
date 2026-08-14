# -*- coding: utf-8 -*-
"""生成 data/research/new52.json（新52 蝙蝠家族阅读顺序研究数据）。
数据来源：ComicBookWire / Vertigology / ComicBookReadingOrders / ReadingOrders.com /
New To Comics / DC Comics News / atomicavenue（封面日期）/ dc.com（合订本收录范围）/
GCD/Overstreet（个别期号封面日期）等。日期均为封面日期（cover date）。
"""
import json, os

B = "batman-v2"; D = "detective-v2"; BR = "batman-and-robin-v2"; RH = "red-hood-outlaws-v1"
BG = "batgirl-v3"; CW = "catwoman-v4"; NW = "nightwing-v3"; INC = "batman-inc-v2"
BE = "batman-eternal"; GR = "grayson"; RS = "robin-sob"; WAR = "we-are-robin"
BRE = "batman-robin-eternal"; RW = "robin-war"; SS = "suicide-squad"; BW = "batwing"
ASW = "allstar-western"; TDK = "batman-dark-knight"; JL = "jla"; FL = "flash-v5"

def I(s, n, t, d, c, p=None, x=None):
    o = {"s": s, "n": str(n), "t": t, "d": d, "c": c}
    if p is not None: o["p"] = p
    if x is not None: o["x"] = x
    return o

events = []

# 1) Flashpoint（新52 前奏）
events.append({
    "id": "flashpoint", "name": "Flashpoint", "nameZh": "闪点",
    "era": "P52", "earth": "flashpoint-earth",
    "type": "mega-event", "start": "2011-07", "end": "2011-10",
    "summaryZh": "闪电侠巴里·艾伦醒来发现世界已被改写：神奇女侠与海王开战、布鲁斯·韦恩死于小巷、蝙蝠侠由父亲托马斯·韦恩担任。巴里必须修复时间线，却直接导致新52 宇宙的诞生。本事件是新52 重启的前奏，不属于主地球时间线。",
    "characters": ["flash", "batman", "justiceleague"],
    "related": ["court-of-owls"],
    "phases": [{
        "name": "Flashpoint", "nameZh": "闪点",
        "issues": [
            I("Flashpoint", 1, "Flashpoint: Part One", "2011-07", ["flash", "batman"]),
            I("Flashpoint", 2, "Flashpoint: Part Two", "2011-08", ["flash", "batman"]),
            I("Flashpoint", 3, "Flashpoint: Part Three", "2011-09", ["flash", "batman", "wonderwoman"]),
            I("Flashpoint", 4, "Flashpoint: Part Four", "2011-10", ["flash", "batman"]),
            I("Flashpoint", 5, "Flashpoint: Part Five", "2011-10", ["flash", "batman", "justiceleague"], x="收尾；直接引出新52 重启"),
        ],
    }],
})

# 2) Court of Owls 猫头鹰法庭
events.append({
    "id": "court-of-owls", "name": "The Court of Owls", "nameZh": "猫头鹰法庭",
    "era": "New52", "earth": "earth-0",
    "type": "arc", "start": "2011-11", "end": "2012-05",
    "summaryZh": "蝙蝠侠发现哥谭市数百年来一直由神秘组织「猫头鹰法庭」暗中统治，其刺客「利爪」多次刺杀蝙蝠侠。布鲁斯潜入法庭地下迷宫，几近崩溃后逃出生天，并首次意识到哥谭远比他想象的更黑暗。",
    "characters": ["batman", "talon", "alfred", "nightwing"],
    "family": "bat-family",
    "related": ["night-of-owls"],
    "phases": [{
        "name": "The Court of Owls", "nameZh": "猫头鹰法庭",
        "issues": [
            I(B, 1, "Knife Trick", "2011-11", ["batman", "talon"]),
            I(B, 2, "Trust Fall", "2011-12", ["batman", "talon"]),
            I(B, 3, "The Thirteenth Hour", "2012-01", ["batman", "talon"]),
            I(B, 4, "Face the Court: Part 1", "2012-02", ["batman", "talon", "nightwing"]),
            I(B, 5, "Face the Court: Part 2", "2012-03", ["batman", "talon", "alfred"]),
            I(B, 6, "Beneath the Glass", "2012-04", ["batman", "talon"]),
            I(B, 7, "The Talons Strike!", "2012-05", ["batman", "talon", "nightwing"]),
        ],
    }],
})

# 3) Night of the Owls 猫头鹰之夜
noto_tieins = [
    I(NW, 8, "Bloodlines", "2012-06", ["nightwing", "talon"]),
    I(ASW, 9, "Vengeance in the Big Easy", "2012-07", ["talon"], x="背景设在 1880 年代哥谭（Hex 与猫头鹰法庭）"),
    I(BG, 9, "In the Line of Fire", "2012-07", ["batgirl", "talon"]),
    I("Batman Annual (2012)", 1, "First Snow", "2012-07", ["batman"], x="Mr. Freeze 起源短篇（事件同期出版，与法庭主线关系较弱）"),
    I(BR, 9, "Robin Hears a Hoo", "2012-07", ["robin-damian", "batman", "talon"]),
    I("Batman: The Dark Knight", 9, "I Can No Longer be Broken", "2012-07", ["batman", "talon"]),
    I(BW, 9, "You Have Been Judged Unworthy", "2012-07", ["talon"], x="Batwing 主场，利爪袭击非洲"),
    I("Birds of Prey (2011)", 9, "Gangland Style", "2012-07", ["batgirl", "talon"]),
    I(CW, 9, "Mirrors Come In All Sizes", "2012-07", ["catwoman", "talon"]),
    I(D, 9, "The Owls Take Arkham; 50/50", "2012-07", ["batman", "talon"]),
    I(NW, 9, "The Gray Son", "2012-07", ["nightwing", "talon"]),
    I(RH, 9, "Who Are You? -- Hoo Hoo?", "2012-07", ["redhood", "talon"]),
]
events.append({
    "id": "night-of-owls", "name": "Night of the Owls", "nameZh": "猫头鹰之夜",
    "era": "New52", "earth": "earth-0",
    "type": "mega-event", "start": "2012-06", "end": "2012-09",
    "summaryZh": "猫头鹰法庭对韦恩家族发动总攻之夜：数百名利爪同时袭击哥谭各处的蝙蝠家族成员与关键目标。蝙蝠侠与整个家族各自迎战刺客，迪克·格雷森更发现自己竟是法庭百年来暗中培养的「灰之子」。",
    "characters": ["batman", "talon", "nightwing", "robin-damian", "redhood", "batgirl", "catwoman"],
    "family": "bat-family",
    "related": ["court-of-owls"],
    "phases": [
        {
            "name": "Batman Main Story", "nameZh": "Batman 主刊",
            "issues": [
                I(B, 8, "Attack on Wayne Manor", "2012-06", ["batman", "talon", "nightwing"]),
                I(B, 9, "The Night of the Owls; The Fall of the House of Wayne: Part 1", "2012-07", ["batman", "talon"], x="含猫头鹰法庭历史 backup 故事"),
                I(B, 10, "Assault on the Court; The Fall of the House of Wayne: Part 2", "2012-08", ["batman", "talon"], x="含法庭历史 backup 故事"),
                I(B, 11, "My Brother's Keeper; The Fall of the House of Wayne: Part 3", "2012-09", ["batman", "talon"], x="含法庭历史 backup 故事"),
            ],
        },
        {
            "name": "Tie-ins", "nameZh": "蝙蝠家族联动",
            "issues": noto_tieins,
        },
    ],
})

# 4) Death of the Family 家庭之死
dotf_tieins = [
    I(BG, 13, "A Blade of Memory", "2012-12", ["batgirl", "joker"]),
    I(CW, 13, "Burnt Offerings", "2012-12", ["catwoman", "joker"]),
    I(BG, 14, "Collision: Part 1: A Courtship of Razors", "2013-01", ["batgirl", "joker"]),
    I(CW, 14, "To Skin a Cat", "2013-01", ["catwoman", "joker"]),
    I(SS, 14, "Running With the Devil: Part 1", "2013-01", ["joker"], x="Harley Quinn 主场"),
    I(BG, 15, "Collision: Part 2: Engagement", "2013-02", ["batgirl", "joker"]),
    I(BR, 15, "Little Big Man", "2013-02", ["robin-damian", "joker"]),
    I(D, 15, "The Dirt Nap; Love in Bloom", "2013-02", ["batman", "joker"]),
    I(NW, 15, "Cleaning House", "2013-02", ["nightwing", "joker"]),
    I(RH, 15, "It Only Hurts When You Laugh", "2013-02", ["redhood", "joker"]),
    I(SS, 15, "Running With the Devil: Part 2", "2013-02", ["joker"], x="Harley Quinn 主场"),
    I("Teen Titans (2011)", 15, "Teen Scream", "2013-02", ["redrobin", "joker"], x="Tim Drake 主场"),
    I(BG, 16, "Collision: Part 3: Ceremony", "2013-03", ["batgirl", "joker"]),
    I(BR, 16, "Cast a Giant Shadow", "2013-03", ["robin-damian", "joker"]),
    I(D, 16, "Nothing But Smiles; Pecking Order", "2013-03", ["batman", "joker"]),
    I(NW, 16, "Curtain Call", "2013-03", ["nightwing", "joker"]),
    I(RH, 16, "Family Matters", "2013-03", ["redhood", "joker"]),
    I("Teen Titans (2011)", 16, "Gotham Runs Red!", "2013-03", ["redrobin", "joker"], x="Tim Drake 主场"),
    I(BR, 17, "Life is But a Dream", "2013-04", ["robin-damian", "joker"], x="常被忽略的收尾（合订本收录）"),
    I(RH, 17, "Don't Let the Door Hit You on Your Way Out", "2013-04", ["redhood", "joker"], x="收尾（合订本收录）"),
    I("Teen Titans (2011)", 17, "Grey Matters", "2013-04", ["redrobin", "joker"], x="收尾（合订本收录）"),
]
events.append({
    "id": "death-of-the-family", "name": "Death of the Family", "nameZh": "家庭之死",
    "era": "New52", "earth": "earth-0",
    "type": "mega-event", "start": "2012-12", "end": "2013-04",
    "summaryZh": "失踪一年后，小丑割下自己的脸皮回归哥谭，宣称要「杀死家庭」：他逐一侵入每个蝙蝠家族成员的生活，揭露他们的秘密，试图证明蝙蝠侠与家人的羁绊只是弱点。最终小丑在韦恩庄园设局，逼迫蝙蝠侠亲手伤害家人。",
    "characters": ["batman", "joker", "nightwing", "robin-damian", "redhood", "batgirl", "catwoman"],
    "family": "bat-family",
    "related": ["endgame"],
    "phases": [
        {
            "name": "Batman Main Story", "nameZh": "Batman 主刊",
            "issues": [
                I(B, 13, "Knock Knock; Tease", "2012-12", ["batman", "joker", "gordon"]),
                I(B, 14, "Funny Bones; Men of Worship", "2013-01", ["batman", "joker"]),
                I(B, 15, "But Here's the Kicker; Red Light, Green Light", "2013-02", ["batman", "joker"]),
                I(B, 16, "Castle of Cards; Judgement", "2013-03", ["batman", "joker", "justiceleague"]),
                I(B, 17, "The Punchline", "2013-04", ["batman", "joker", "alfred"]),
            ],
        },
        {"name": "Tie-ins", "nameZh": "蝙蝠家族联动", "issues": dotf_tieins},
    ],
})

# 5) Zero Year 零年
zy_secret = [I(B, n, "Zero Year: Secret City", m, ["batman", "riddler", "gordon"], p=i)
             for i, (n, m) in enumerate([(21, "2013-08"), (22, "2013-09"), (23, "2013-10"), (24, "2013-12")], 1)]
zy_dark = [I(B, n, "Zero Year: Dark City", m, ["batman", "riddler", "gordon"], p=i)
           for i, (n, m) in enumerate([(25, "2014-01"), (26, "2014-02"), (27, "2014-03")], 1)]
zy_dark.append(I(B, 28, None, "2014-04", ["batman", "nightwing"], x="非零年主线：《Batman Eternal》前奏插曲（Harper Row/Bluebird 登场）"))
zy_savage = [I(B, n, "Zero Year: Savage City", m, ["batman", "riddler", "gordon", "alfred"], p=i)
             for i, (n, m) in enumerate([(29, "2014-05"), (30, "2014-06"), (31, "2014-07"), (32, "2014-08"), (33, "2014-09")], 1)]
events.append({
    "id": "zero-year", "name": "Zero Year", "nameZh": "零年",
    "era": "New52", "earth": "earth-0",
    "type": "saga", "start": "2013-08", "end": "2014-09",
    "summaryZh": "新52 的蝙蝠侠起源：布鲁斯·韦恩周游世界修行归来，恰逢哥谭被「红头罩帮」与随后登场的谜语人先后颠覆。谜语人切断城市电力、以谜题统治哥谭，蝙蝠侠在「秘密之城/黑暗之城/蛮荒之城」三段故事中逐步成为哥谭的守护者。",
    "characters": ["batman", "riddler", "gordon", "alfred"],
    "family": "bat-family",
    "related": ["batman-eternal", "court-of-owls"],
    "phases": [
        {"name": "Secret City", "nameZh": "秘密之城", "issues": zy_secret},
        {"name": "Dark City", "nameZh": "黑暗之城", "issues": zy_dark},
        {"name": "Savage City", "nameZh": "蛮荒之城", "issues": zy_savage},
    ],
})

# 6) Batman Eternal
be_months = [(1, 4, "2014-06"), (5, 8, "2014-07"), (9, 12, "2014-08"), (13, 16, "2014-09"),
             (17, 21, "2014-10"), (22, 25, "2014-11"), (26, 30, "2014-12"), (31, 34, "2015-01"),
             (35, 39, "2015-02"), (40, 43, "2015-03"), (44, 47, "2015-04"), (48, 51, "2015-05"), (52, 52, "2015-06")]
be_issues = [I(BE, n, None, m, ["batman", "nightwing", "robin-tim", "redhood", "batgirl", "gordon"])
             for lo, hi, m in be_months for n in range(lo, hi + 1)]
events.append({
    "id": "batman-eternal", "name": "Batman Eternal", "nameZh": "蝙蝠侠：永恒",
    "era": "New52", "earth": "earth-0",
    "type": "series", "start": "2014-06", "end": "2015-06",
    "summaryZh": "周更 52 期的哥谭史诗：戈登局长因「黑门越狱」被诬陷入狱，神秘幕后黑手「Deacon Blackfire」与猫头鹰法庭余党联手颠覆哥谭。蝙蝠侠与整个家族（夜翼、红头罩、蒂姆、芭芭拉等）被逐一击破，最终揭出幕后主使竟与韦恩家族历史有关。",
    "characters": ["batman", "nightwing", "robin-tim", "redhood", "batgirl", "gordon"],
    "family": "bat-family",
    "related": ["batman-robin-eternal", "zero-year"],
    "phases": [{"name": "Batman Eternal", "nameZh": "蝙蝠侠：永恒（周更）", "issues": be_issues}],
})

# 7) Endgame 终局
endgame = [
    I(B, 35, "Endgame: Part 1; The Pale Man", "2014-12", ["batman", "joker"]),
    I(B, 36, "Endgame: Part 2; Saved", "2015-01", ["batman", "joker", "justiceleague"]),
    I(B, 37, "Endgame: Part 3; The First Laugh", "2015-02", ["batman", "joker", "justiceleague"]),
    I("Batman Annual (2012)", 3, None, "2015-02", ["batman", "joker"], x="Joker 视角补完"),
    I(B, 38, "Endgame: Part 4", "2015-03", ["batman", "joker", "justiceleague"]),
    I("Detective Comics: Endgame", 1, None, "2015-05", ["batman", "joker"]),
    I("Batgirl: Endgame", 1, "The Battle for the Burnside Bridge", "2015-05", ["batgirl", "joker"]),
    I(B, 39, "Endgame: Part 5; The Last Smile", "2015-04", ["batman", "joker", "justiceleague"]),
    I("Arkham Manor: Endgame", 1, None, "2015-06", ["joker"], x="阿卡姆庄园联动"),
    I("Gotham Academy: Endgame", 1, "Joker Jitters", "2015-06", ["batman", "joker"], x="哥谭学院联动"),
    I(B, 40, "Endgame: Part 6", "2015-05", ["batman", "joker", "justiceleague"]),
]
events.append({
    "id": "endgame", "name": "Endgame", "nameZh": "终局",
    "era": "New52", "earth": "earth-0",
    "type": "mega-event", "start": "2014-12", "end": "2015-06",
    "summaryZh": "小丑用改造过的「笑气瘟疫」袭击哥谭，宣称自己才是哥谭真正的守护者，并让正义联盟全体感染、与蝙蝠侠为敌。蝙蝠侠查明小丑与韦恩家族三百年前的渊源（以及哥谭地下的苍白巨兽），最终与疑似「真正的」小丑同归于尽。",
    "characters": ["batman", "joker", "justiceleague"],
    "family": "bat-family",
    "related": ["death-of-the-family", "superheavy"],
    "phases": [{"name": "Endgame", "nameZh": "终局（含联动单刊）", "issues": sorted(endgame, key=lambda x: (x["d"], x["s"], x["n"]))}],
})

# 8) Superheavy 超重型
superheavy = [I(B, n, "Superheavy: Part %d" % i, m, ["batman", "gordon", "robin-damian"], p=i)
              for i, (n, m) in enumerate([(41, "2015-08"), (42, "2015-09"), (43, "2015-10"), (44, "2015-11"),
                                          (45, "2015-12"), (46, "2016-01"), (47, "2016-02"), (48, "2016-03"),
                                          (49, "2016-04"), (50, "2016-05")], 1)]
superheavy.append(I(B, 51, None, "2016-06", ["batman", "gordon", "robin-damian"], x="尾声（Epilogue），Mr. Bloom 事件收束"))
events.append({
    "id": "superheavy", "name": "Superheavy", "nameZh": "超重型（戈登蝙蝠侠）",
    "era": "New52", "earth": "earth-0",
    "type": "arc", "start": "2015-08", "end": "2016-06",
    "summaryZh": "「终局」后布鲁斯·韦恩失忆，哥谭交由吉姆·戈登驾驶动力装甲「超重型战甲」出任蝙蝠侠；达米安以罗宾身份回归协助。新反派 Mr. Bloom 用改造人军团控制哥谭，最终布鲁斯恢复记忆、夺回蝙蝠侠身份。",
    "characters": ["batman", "gordon", "robin-damian"],
    "family": "bat-family",
    "related": ["endgame", "robin-war"],
    "phases": [{"name": "Superheavy", "nameZh": "超重型", "issues": superheavy}],
})

# 9) Grayson
grayson_months = [(1, "2014-09"), (2, "2014-10"), (3, "2014-12"), (4, "2015-01"), (5, "2015-02"), (6, "2015-03"),
                  (7, "2015-04"), (8, "2015-05"), (9, "2015-08"), (10, "2015-09"), (11, "2015-10"), (12, "2015-11"),
                  (13, "2015-12"), (14, "2016-01"), (15, "2016-02"), (16, "2016-03"), (17, "2016-04"),
                  (18, "2016-05"), (19, "2016-06"), (20, "2016-07")]
grayson_issues = [I(GR, n, None, m, ["nightwing"]) for n, m in grayson_months]
grayson_issues.insert(2, I("Grayson: Futures End", 1, None, "2014-11", ["nightwing"], x="Futures End 联动单刊"))
grayson_issues.insert(5, I(GR, "Annual #1", None, "2015-02", ["nightwing"]))
events.append({
    "id": "grayson", "name": "Grayson", "nameZh": "格雷森（Agent 37）",
    "era": "New52", "earth": "earth-0",
    "type": "series", "start": "2014-09", "end": "2016-07",
    "summaryZh": "「猫头鹰之夜」后迪克·格雷森公开「死亡」，化名 Agent 37 秘密加入特工组织 Spyral，在卧底生涯中追查帕拉冈（Paragon）计划并周旋于猫头鹰法庭残党之间。期间深度卷入 Robin War 事件。",
    "characters": ["nightwing"],
    "family": "bat-family",
    "related": ["robin-war"],
    "phases": [{"name": "Grayson", "nameZh": "格雷森", "issues": grayson_issues}],
})

# 10) Robin: Son of Batman
rsb1 = [I(RS, n, "Year of Blood", m, ["robin-damian"], p=i)
        for i, (n, m) in enumerate([(1, "2015-08"), (2, "2015-09"), (3, "2015-10"), (4, "2015-11"),
                                    (5, "2015-12"), (6, "2016-01")], 1)]
rsb2 = [I(RS, n, "Dawn of the Demons", m, ["robin-damian"], p=i)
        for i, (n, m) in enumerate([(7, "2016-02"), (8, "2016-03"), (9, "2016-04"), (10, "2016-05"),
                                    (11, "2016-06"), (12, "2016-07"), (13, "2016-08")], 1)]
events.append({
    "id": "robin-sob", "name": "Robin: Son of Batman", "nameZh": "罗宾：蝙蝠之子",
    "era": "New52", "earth": "earth-0",
    "type": "series", "start": "2015-08", "end": "2016-08",
    "summaryZh": "达米安·韦恩在父亲失忆、母亲塔利亚死后独自行走世界，为赎罪踏上「血之年」的自我救赎之旅，与恶魔之手（Goliath）、雷肖古之女玛拉等势力周旋，途中参与 Robin War。",
    "characters": ["robin-damian"],
    "family": "bat-family",
    "related": ["robin-war", "we-are-robin"],
    "phases": [
        {"name": "Year of Blood", "nameZh": "血之年", "issues": rsb1},
        {"name": "Dawn of the Demons", "nameZh": "恶魔之晓", "issues": rsb2},
    ],
})

# 11) We Are Robin
war1 = [I(WAR, n, "The Vigilante Business", m, ["batman", "gordon"], p=i)
        for i, (n, m) in enumerate([(1, "2015-08"), (2, "2015-09"), (3, "2015-10"), (4, "2015-11"),
                                    (5, "2015-12"), (6, "2016-01")], 1)]
war2 = [I(WAR, n, "Jokers", m, ["batman", "gordon", "joker"], p=i)
        for i, (n, m) in enumerate([(7, "2016-02"), (8, "2016-03"), (9, "2016-04"), (10, "2016-05"),
                                    (11, "2016-06"), (12, "2016-07")], 1)]
events.append({
    "id": "we-are-robin", "name": "We Are Robin", "nameZh": "我们都是罗宾",
    "era": "New52", "earth": "earth-0",
    "type": "series", "start": "2015-08", "end": "2016-07",
    "summaryZh": "哥谭少年杜克·托马斯（Duke Thomas）与一群受罗宾精神感召的青少年组成「罗宾运动」，在没有蝙蝠侠认可的情况下自发打击犯罪；戈登（时任蝙蝠侠）与「罗宾法案」与他们正面冲突，最终引爆 Robin War。",
    "characters": ["batman", "gordon", "robin-damian"],
    "family": "bat-family",
    "related": ["robin-war"],
    "phases": [
        {"name": "The Vigilante Business", "nameZh": "义警事业", "issues": war1},
        {"name": "Jokers", "nameZh": "小丑们", "issues": war2},
    ],
})

# 12) Robin War
robinwar_main = [
    I(RW, 1, None, "2016-02", ["robin-damian", "nightwing", "redhood", "redrobin", "gordon"]),
    I(GR, 15, None, "2016-02", ["nightwing", "robin-damian"], x="Agent 37 押送达米安途中遭劫"),
    I(D, 47, None, "2016-02", ["batman", "robin-damian"], x="戈登蝙蝠侠与罗宾法案"),
    I(WAR, 7, "Jokers", "2016-02", ["batman", "gordon", "robin-damian"], p=1),
    I(RS, 7, "Dawn of the Demons", "2016-02", ["robin-damian"], p=1),
    I("Gotham Academy", 13, None, "2016-02", ["batman", "robin-damian"], x="哥谭学院联动"),
    I("Red Hood/Arsenal", 7, None, "2016-02", ["redhood"]),
    I("Teen Titans (2014)", 15, None, "2016-02", ["redrobin", "teentitans"]),
    I(RW, 2, None, "2016-03", ["robin-damian", "nightwing", "redhood", "redrobin", "gordon"]),
]
robinwar_after = [
    I(RS, 8, "Dawn of the Demons", "2016-03", ["robin-damian"], p=2, x="事件余波"),
    I(WAR, 8, "Jokers", "2016-03", ["batman", "gordon", "robin-damian"], p=2, x="事件余波"),
    I("Teen Titans (2014)", 16, None, "2016-03", ["redrobin", "teentitans"], x="事件余波"),
]
events.append({
    "id": "robin-war", "name": "Robin War", "nameZh": "罗宾之战",
    "era": "New52", "earth": "earth-0",
    "type": "mega-event", "start": "2016-02", "end": "2016-03",
    "summaryZh": "哥谭出台「罗宾法案」禁止青少年义警活动，军警与「我们都是罗宾」运动爆发冲突；四位前任/现任罗宾（迪克、杰森、蒂姆、达米安）齐聚哥谭对抗镇压，幕后黑手竟是猫头鹰法庭。达米安在事件后主动承担责任、接受审判。",
    "characters": ["robin-damian", "nightwing", "redhood", "redrobin", "batgirl"],
    "family": "bat-family",
    "related": ["we-are-robin", "robin-sob", "grayson"],
    "phases": [
        {"name": "Robin War", "nameZh": "罗宾之战", "issues": robinwar_main},
        {"name": "Aftermath", "nameZh": "余波", "issues": robinwar_after},
    ],
})

# 13) Batman & Robin Eternal
bre_months = [(1, 4, "2015-12"), (5, 8, "2016-01"), (9, 13, "2016-02"), (14, 17, "2016-03"), (18, 21, "2016-04"), (22, 26, "2016-05")]
bre_issues = [I(BRE, n, None, m, ["batman", "nightwing", "redhood", "robin-tim", "robin-damian", "batgirl", "gordon"])
              for lo, hi, m in bre_months for n in range(lo, hi + 1)]
events.append({
    "id": "batman-robin-eternal", "name": "Batman & Robin Eternal", "nameZh": "蝙蝠侠与罗宾：永恒",
    "era": "New52", "earth": "earth-0",
    "type": "series", "start": "2015-12", "end": "2016-05",
    "summaryZh": "周更 26 期的续篇：失忆的布鲁斯被神秘敌人「母亲」（Mother）盯上，迪克、杰森、蒂姆、达米安与芭芭拉联手调查，牵出韦恩家族被抹去的黑暗历史与 Cassandra Cain 的过去。",
    "characters": ["batman", "nightwing", "redhood", "robin-tim", "robin-damian", "batgirl", "gordon"],
    "family": "bat-family",
    "related": ["batman-eternal", "robin-war"],
    "phases": [{"name": "Batman & Robin Eternal", "nameZh": "蝙蝠侠与罗宾：永恒（周更）", "issues": bre_issues}],
})

# 14) Batman and Robin v2
bnr_born = [I(BR, n, "Born to Kill", m, ["batman", "robin-damian", "ras", "talia"], p=i)
            for i, (n, m) in enumerate([(1, "2011-11"), (2, "2011-12"), (3, "2012-01"), (4, "2012-02"),
                                        (5, "2012-03"), (6, "2012-04"), (7, "2012-05"), (8, "2012-06")], 1)]
bnr_pearl = [I(BR, n, "Pearl", m, ["batman", "robin-damian"], p=i)
             for i, (n, m) in enumerate([(9, "2012-07"), (10, "2012-08"), (11, "2012-09"), (12, "2012-10")], 1)]
bnr_pearl.append(I(BR, 0, "In the Beginning", "2012-11", ["batman", "robin-damian"], x="零月（Zero Month）前传"))
bnr_pearl += [I(BR, n, "Pearl", m, ["batman", "robin-damian"], p=i)
              for i, (n, m) in enumerate([(13, "2012-12"), (14, "2013-01")], 5)]
bnr_dotf = [
    I(BR, 15, "Little Big Man", "2013-02", ["robin-damian", "joker"]),
    I(BR, 16, "Cast a Giant Shadow", "2013-03", ["robin-damian", "joker"]),
    I(BR, 17, "Life is But a Dream", "2013-04", ["robin-damian", "joker"], x="家庭之死收尾"),
]
bnr_req = [I(BR, n, "Requiem", m, ["batman", "robin-damian"], p=i)
           for i, (n, m) in enumerate([(18, "2013-05"), (19, "2013-06"), (20, "2013-07"), (21, "2013-08"),
                                       (22, "2013-09"), (23, "2013-10")], 1)]
bnr_burn = [I(BR, n, "The Big Burn", m, ["batman", "robin-damian", "twopface"], p=i)
            for i, (n, m) in enumerate([(24, "2013-12"), (25, "2014-01"), (26, "2014-02"), (27, "2014-03"),
                                        (28, "2014-04")], 1)]
bnr_hunt = [I(BR, n, "Hunt for Robin", m, ["batman", "robin-damian", "ras"], p=i)
            for i, (n, m) in enumerate([(29, "2014-05"), (30, "2014-06"), (31, "2014-07"), (32, "2014-08"),
                                        (33, "2014-09")], 1)]
bnr_hunt.append(I("Robin Rises: Omega", 1, "Robin Rises: Omega", "2014-09", ["batman", "robin-damian"], x="序章：正义联盟集结"))
bnr_hunt.append(I(BR, 34, "Hunt for Robin", "2014-10", ["batman", "robin-damian", "ras"], p=6))
bnr_rises = [I(BR, n, "Robin Rises", m, ["batman", "robin-damian", "ras", "talia"], p=i)
             for i, (n, m) in enumerate([(35, "2014-12"), (36, "2015-01")], 1)]
bnr_rises.append(I("Robin Rises: Alpha", 1, "Robin Rises: Alpha", "2015-02", ["batman", "robin-damian"], x="终章：达米安复活"))
bnr_rises += [I(BR, n, "Robin Rises", m, ["batman", "robin-damian", "ras", "talia"], p=i)
              for i, (n, m) in enumerate([(37, "2015-02"), (38, "2015-03"), (39, "2015-04"), (40, "2015-05")], 4)]
events.append({
    "id": "batman-and-robin-v2", "name": "Batman and Robin (2011)", "nameZh": "蝙蝠侠与罗宾（新52）",
    "era": "New52", "earth": "earth-0",
    "type": "series", "start": "2011-11", "end": "2015-05",
    "summaryZh": "布鲁斯与达米安父子的核心刊物：从「生而为杀」的磨合，到「珍珠」、小丑的「家庭之死」袭击；达米安在《Batman Incorporated》#8 中被杀后，本刊以「安魂曲」「大焚毁」「追猎罗宾」「罗宾崛起」数段故事让达米安自拉撒路之池复活。",
    "characters": ["batman", "robin-damian", "talia", "ras"],
    "family": "bat-family",
    "related": ["death-of-the-family", "batman-inc-v2"],
    "phases": [
        {"name": "Born to Kill", "nameZh": "生而为杀", "issues": bnr_born},
        {"name": "Pearl", "nameZh": "珍珠", "issues": bnr_pearl},
        {"name": "Death of the Family", "nameZh": "家庭之死", "issues": bnr_dotf},
        {"name": "Requiem", "nameZh": "安魂曲", "issues": bnr_req},
        {"name": "The Big Burn", "nameZh": "大焚毁", "issues": bnr_burn},
        {"name": "Hunt for Robin", "nameZh": "追猎罗宾", "issues": bnr_hunt},
        {"name": "Robin Rises", "nameZh": "罗宾崛起", "issues": bnr_rises},
    ],
})

# 15) Batman Incorporated v2
inc_demon = [I(INC, n, "Demon Star", m, ["batman", "robin-damian", "talia"], p=i)
             for i, (n, m) in enumerate([(1, "2012-07"), (2, "2012-08"), (3, "2012-09")], 1)]
inc_demon.append(I(INC, 0, "The Origin of Batman Incorporated", "2012-11", ["batman", "robin-damian", "talia"], x="零月前传"))
inc_demon += [I(INC, n, "Demon Star", m, ["batman", "robin-damian", "talia"], p=i)
              for i, (n, m) in enumerate([(4, "2012-12"), (5, "2013-01"), (6, "2013-02")], 4)]
inc_lev = [I(INC, n, "Leviathan", m, ["batman", "robin-damian", "talia"], p=i)
           for i, (n, m) in enumerate([(7, "2013-03"), (8, "2013-04"), (9, "2013-05"), (10, "2013-06"),
                                       (11, "2013-07"), (12, "2013-09"), (13, "2013-10")], 1)]
inc_lev.append(I("Batman Incorporated Special", 1, "Leviathan Strikes!", "2013-10", ["batman", "talia"], x="达米安之死余波"))
events.append({
    "id": "batman-inc-v2", "name": "Batman Incorporated (2012)", "nameZh": "蝙蝠侠群英会（新52）",
    "era": "New52", "earth": "earth-0",
    "type": "series", "start": "2012-07", "end": "2013-10",
    "summaryZh": "格兰特·莫里森蝙蝠侠史诗的终章：蝙蝠侠全球化的「蝙蝠群英会」与塔利亚·艾尔·古尔的「利维坦」组织全面开战。达米安·韦恩在 #8 中被自己克隆的「众杀者」（Heretic）所杀，直接引发「安魂曲」与后续事件。",
    "characters": ["batman", "robin-damian", "talia"],
    "family": "bat-family",
    "related": ["batman-and-robin-v2", "death-of-the-family"],
    "phases": [
        {"name": "Demon Star", "nameZh": "魔星", "issues": inc_demon},
        {"name": "Gotham's Most Wanted / Leviathan", "nameZh": "哥谭头号通缉 / 利维坦", "issues": inc_lev},
    ],
})

# arcs
arcs = [
    {
        "id": "nightwing-v3-traps-and-trapezes", "name": "Traps and Trapezes", "nameZh": "陷阱与秋千",
        "era": "New52", "earth": "earth-0", "type": "arc", "start": "2011-11", "end": "2012-05",
        "summaryZh": "夜翼回到哈利马戏团调查旧友连环被杀案，逐步发现凶手「Saiko」与猫头鹰法庭的关联，迪克的身世之谜（灰之子）自此揭开。",
        "characters": ["nightwing", "talon"],
        "issues": [
            I(NW, 1, "Welcome to Gotham", "2011-11", ["nightwing"]),
            I(NW, 2, "Haly's Wish", "2011-12", ["nightwing"]),
            I(NW, 3, "Past and Present", "2012-01", ["nightwing"]),
            I(NW, 4, "South Beach Connection", "2012-02", ["nightwing"]),
            I(NW, 5, "'Til Death Do Us Part", "2012-03", ["nightwing", "talon"]),
            I(NW, 6, "Good Girl Gone Bad", "2012-04", ["nightwing"]),
            I(NW, 7, "Turning Points", "2012-05", ["nightwing", "talon"]),
        ],
    },
    {
        "id": "batgirl-v3-darkest-reflection", "name": "The Darkest Reflection", "nameZh": "最黑暗的倒影",
        "era": "New52", "earth": "earth-0", "type": "arc", "start": "2011-11", "end": "2012-04",
        "summaryZh": "新52 重设后芭芭拉·戈登康复并重披蝙蝠女战衣，对抗杀手镜（Mirror）与哥谭黑帮，同时隐瞒父亲戈登局长。",
        "characters": ["batgirl", "gordon"],
        "issues": [
            I(BG, 1, "The Darkest Reflection", "2011-11", ["batgirl"], p=1),
            I(BG, 2, "The Darkest Reflection", "2011-12", ["batgirl"], p=2),
            I(BG, 3, "The Darkest Reflection", "2012-01", ["batgirl"], p=3),
            I(BG, 4, "The Darkest Reflection", "2012-02", ["batgirl"], p=4),
            I(BG, 5, "The Darkest Reflection", "2012-03", ["batgirl"], p=5),
            I(BG, 6, "The Darkest Reflection", "2012-04", ["batgirl"], p=6),
        ],
    },
    {
        "id": "red-hood-outlaws-redemption", "name": "REDemption", "nameZh": "救赎",
        "era": "New52", "earth": "earth-0", "type": "arc", "start": "2011-11", "end": "2012-05",
        "summaryZh": "杰森·托德（红头罩）、星火与军火库组成「法外者」，以非正统手段游走于法外正义，同时杰森继续追查自己「死而复生」的真相。",
        "characters": ["redhood"],
        "issues": [
            I(RH, 1, "REDemption", "2011-11", ["redhood"], p=1),
            I(RH, 2, "REDemption", "2011-12", ["redhood"], p=2),
            I(RH, 3, "REDemption", "2012-01", ["redhood"], p=3),
            I(RH, 4, "REDemption", "2012-02", ["redhood"], p=4),
            I(RH, 5, "REDemption", "2012-03", ["redhood"], p=5),
            I(RH, 6, "REDemption", "2012-04", ["redhood"], p=6),
            I(RH, 7, "REDemption", "2012-05", ["redhood"], p=7),
        ],
    },
    {
        "id": "detective-v2-faces-of-death", "name": "Faces of Death", "nameZh": "死亡面孔",
        "era": "New52", "earth": "earth-0", "type": "arc", "start": "2011-11", "end": "2012-05",
        "summaryZh": "《侦探漫画》重启首弧：连环杀手「屠夫」袭警，戈登局长被卷入，蝙蝠侠追查凶手的同时与警局关系降至冰点；小丑在开篇短暂现身，为「家庭之死」埋下伏笔。",
        "characters": ["batman", "gordon"],
        "issues": [
            I(D, 1, "Faces of Death", "2011-11", ["batman", "gordon"], p=1),
            I(D, 2, "Faces of Death", "2011-12", ["batman", "gordon"], p=2),
            I(D, 3, "Faces of Death", "2012-01", ["batman", "gordon"], p=3),
            I(D, 4, "Faces of Death", "2012-02", ["batman", "gordon"], p=4),
            I(D, 5, "Faces of Death", "2012-03", ["batman", "gordon"], p=5),
            I(D, 6, "Faces of Death", "2012-04", ["batman", "gordon"], p=6),
            I(D, 7, "Faces of Death", "2012-05", ["batman", "gordon"], p=7),
        ],
    },
]

# standalone
standalone = [
    I(B, 12, None, "2012-10", ["batman", "talon"], x="《猫头鹰之夜》收尾，与 #8-11 同收录于 The City of Owls 合订本"),
    I(B, 18, "Resolve", "2013-05", ["batman", "robin-damian"], x="Requiem 悼念单刊：布鲁斯哀悼达米安"),
    I(B, "23.1", "The Riddler", "2013-11", ["riddler"], x="Villains Month 反派月单刊（Forever Evil 联动）"),
    I(B, "23.3", "The Joker", "2013-11", ["joker"], x="Villains Month 反派月单刊（Forever Evil 联动）"),
    I(B, 34, None, "2014-10", ["batman"], x="《零年》与《终局》之间的过渡单刊"),
    I(D, 18, None, "2013-05", ["batman", "robin-damian"], x="Requiem 悼念单刊"),
]

sources = [
    "https://www.comicbookwire.com/reading-order/dc/events/night-of-the-owls/",
    "https://www.comicbookwire.com/reading-order/dc/events/death-of-the-family/",
    "https://www.comicbookwire.com/reading-order/dc/events/robin-war/",
    "https://vertigology.net/2015/05/05/complete-batman-night-of-owls-reading-order/",
    "https://vertigology.net/2015/05/05/batman-death-of-the-family-reading-order/",
    "https://comicbookreadingorders.com/dc/events/robin-war-reading-order/",
    "https://comicbookreadingorders.com/dc/events/night-of-the-owls-reading-order/",
    "https://comicbookreadingorders.com/dc/events/batman-endgame-reading-order/",
    "https://comicbookreadingorders.com/dc/events/batman-zero-year-reading-order/",
    "https://comicbookreadingorders.com/dc/events/flashpoint-reading-order/",
    "https://comicbookreadingorders.com/dc/events/robin-rises-reading-order/",
    "https://www.readingorders.com/reading-orders/batman-the-court-of-owls",
    "https://www.readingorders.com/reading-orders/batman-death-of-the-family",
    "https://www.readingorders.com/reading-orders/batman-endgame",
    "https://www.readingorders.com/reading-orders/batman-superheavy",
    "https://newtocomics.com/batman-zero-year-reading-guide/",
    "https://dccomicsnews.com/2016/01/01/robin-war-reading-order/",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=37947",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=37839",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=37829",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=37966",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=37951",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=37882",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=37968",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=51337",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=38046",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=44501",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=43651",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=48034",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=48322",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=43885",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=46437",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=46919",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=39465",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=37075",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=44492",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=44855",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=14002",
    "https://atomicavenue.com/atomic/TitleDetail.aspx?TitleID=44893",
    "https://www.dc.com/graphic-novels/batman-and-robin-2011/batman-and-robin-vol-1-born-to-kill",
    "https://www.dc.com/graphic-novels/batman-and-robin-2011/batman-and-robin-vol-2-pearl",
    "https://www.dc.com/graphic-novels/batman-and-robin-2011/batman-and-robin-vol-4-requiem-for-damian",
    "https://www.dc.com/graphic-novels/batman-and-robin-2011/batman-and-robin-vol-5-the-big-burn",
    "https://www.dc.com/graphic-novels/batman-and-robin-2011/batman-and-robin-vol-6-the-hunt-for-robin",
    "https://www.dc.com/graphic-novels/batman-and-robin-2011/batman-and-robin-vol-7-robin-rises",
    "https://www.dc.com/graphic-novels/batgirl-2011/batgirl-vol-1-the-darkest-reflection",
    "https://www.dc.com/graphic-novels/red-hood-and-the-outlaws-2011/red-hood-and-the-outlaws-vol-1-redemption",
    "https://www.dc.com/graphic-novels/batman-the-dark-knight-2011/batman-the-dark-knight-vol-3-mad",
    "https://www.comichaus.com/comics/batman-incorporated-2nd-series/7338.htm",
    "https://oop-graphic-novels.com/products/robin-war-tpb",
    "https://thebatmanuniverse.net/batman-9/",
    "https://keycollectorcomics.com/issue/flashpoint-1-1-6,320064/",
    "https://www.comics.org/issue/1197920/",
    "https://comics.overstreetaccess.com/issues/247414/nightwing-8-jun-2012",
    "https://comics.overstreetaccess.com/issues/295546/teen-titans-15-feb-2013",
    "https://comics.overstreetaccess.com/issues/400699/batman-annual-3-feb-2015",
    "https://comicvine.gamespot.com/robin-son-of-batman-1-year-of-blood-part-one/4000-492165/",
    "https://comicvine.gamespot.com/suicide-squad-14-running-with-the-devil/4000-367686/",
    "https://comicvine.gamespot.com/teen-titans-16-gotham-runs-red/4000-382734/",
]

data = {"events": events, "arcs": arcs, "standalone": standalone, "sources": sources}

out_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "research", "new52.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)

# 校验
with open(out_path, encoding="utf-8") as f:
    check = json.load(f)
n_ev = len(check["events"]); n_arc = len(check["arcs"]); n_std = len(check["standalone"])
n_iss = sum(len(ph["issues"]) for ev in check["events"] for ph in ev["phases"]) + sum(len(a["issues"]) for a in check["arcs"]) + len(check["standalone"])
print("OK: events=%d arcs=%d standalone=%d total_issues=%d sources=%d" % (n_ev, n_arc, n_std, n_iss, len(check["sources"])))
