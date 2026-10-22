# 交给 GPT 的交接说明

> 生成时间：2026-10-19 21:00
> 项目负责人（人）：刘纪康（班长/副支书）　团支书：董儒汉（微信昵称 Viscum）
> 上一任 AI：DeepSeek Harness

---

## 0. 一句话现状

**网站已上线、结构与数据全部就绪（41 项活动 / 34 个相册 / 31 篇已发推文），只剩一处视觉优化待做。**

---

## 1. ⭐ 当前唯一待办：首页两幕篇章卡「做大气一点」

### 业主原话

> 两幕四篇章卡片（截图见下）——「**做大气一点**」

### 现状问题

现在是"横向窄条卡"：卡片高 110px 左右，字号偏小（标题 19px、数字 32px），
两幕之间节奏感弱，整体显得单薄。

### 期望方向

- **卡片加高**（min-height 150px 左右）、**留白拉开**
- **字号显著放大**：篇章标题 26px、活动数 54px
- **左侧加入大号篇章序号**（01 / 02 / 03 / 04，衬线体 Georgia）
- **幕标题条同步放大**（第一幕 储百卅之光 / 第二幕 能万里新程）
- 保留：左右顶格（每幕 2 张卡各占一半）、配色随篇章、悬停抬起

### 已经写好的实现（可直接执行）

`D:\XJTUpack\大一\班委\ai\tools\restyle_bands.py`

这个脚本会把 `assets/css/style.css` 末尾的「首页 · 两幕布局」整段替换成大气版：

```
标题 26px / 数字 54px / 序号 46px Georgia / 卡片 min-height 152px
padding 30px 34px / 悬停 translateY(-5px) + 阴影
断点 1100 / 900 / 640
```

执行：

```powershell
cd "D:\XJTUpack\大一\班委\ai\团日活动\03_展示网站"
python "D:\XJTUpack\大一\班委\ai\tools\restyle_bands.py"
```

**注意**：脚本是把 `style.css` 从那段注释标头开始**整段截断替换**（该段在文件末尾）。
执行前请先备份：

```powershell
copy assets\css\style.css assets\css\style.css.bak
```

改完务必用无头 Chrome 截图确认（第 8 节），满意后按第 7 节推送。

### 可选加分项

- 卡片背景加极淡的篇章色渐变（`linear-gradient(135deg,#fff, #FFF8F9)`）
- 序号背后加深色水印大数字
- 四篇章之间加一条细竖线分隔

---

## 2. 其他未定事项

| # | 事项 | 说明 |
|---|---|---|
| 1 | **「携手」篇只有 7 项** | 答辩 PPT 目录页写 8 项、正文页写 7 项，PPT 自身不一致。网站现按 7 项。需业主定：保持 7，还是从别处挪 1 项进来 |
| 2 | **a40「给四年后自己的信」仍是计划中** | 原定 10-19 晚，已推迟，等业主给新日期后改 `status` 为 `done` |
| 3 | **PPT 活动编号（01—33）未上网站** | 业主说"先不急"。若答辩要对照，可给活动加 `pptNo` 字段并在卡片/详情页显示 |
| 4 | **网址变短** | 现 `https://xjtu-es2601.com/`（43 字符）。方案：仓库改名 `eqmarks.github.io`（最短）或 `es2601`；**需业主在 GitHub 网页操作，AI 无 token 改不了** |
| 5 | **秦腔博物馆相册只有 2 张** | 只有两张合影（推文里就这两张） |
| 6 | **「烟火聚塬上」标题半角逗号** | 公众号原文是半角「,」，网站草稿是全角「，」，可对齐 |

---

## 3. ⚠️ 内容规范（业主反复纠正过，违反会被打回）

### 3.1 不许写内部执行细节

**反面例子（被点名批评过，原样引述）**

> 赴西安讯派公司参观。不包车，按老师建议几人一组打车往返，班委分头带队，费用台账记录；新闻稿 48 小时出稿。

**禁止词**：`打车`、`包车`、`带队`、`费用台账`、`新闻稿 48 小时`、`报名制`、`名额`、`预算`、`经费`、`签到表`、`参与名单`

> 这些是给评委看的台账，不是给访客看的内容。

### 3.2 不许写人数、不许写参与名单

- 签到表/报名表**不准确**，写具体人数有风险
- `count` 字段已全部删除
- `when` 里也不许带人数（如「· 7 人」）

### 3.3 只写真实发生的事

**已删除的假数据清单**

| 曾写过的 | 真相 |
|---|---|
| 31 个「同学家乡」点位（含新疆·乌鲁木齐） | 按省会瞎估的，无依据 |
| 「健康国潮·青年问市」养生茶饮调研 | 团支书**去年比赛的旧文件**（后经业主确认仍要保留，已按 PPT 重新加回） |
| 班歌·校歌合奏 | 已放弃，未举办 |
| 「储百卅之光」作品征集 | 基本无人投稿 |
| 迅湃「做快速充电」 | 实际做**电池/电机/控制器测试设备** |
| 长征观影《血战湘江》 | 实际放映的是**《四渡赤水》** |

**判断标准：一份材料若只有单一来源（无照片/签到/推文佐证），先跟业主确认再写。**

### 3.4 日期以素材文件夹名为准

素材文件夹名 = 拍摄日期（如 `10.11图书馆钱展` = 10 月 11 日）。**不要自己推算。**

### 3.5 文风：客观叙述，不要"文艺腔"

业主明确表态：**GPT 写的客观叙述风格更好，不要改回带画面感的写法**。
所以 lead / story / summary 都是第三人称客观陈述，**不要插"我们"、不要抒情句**。

### 3.6 观后感不恢复

业主说"不用"。现只有 a09 有 2 条观后感，保持即可。

---

## 4. 当前结构与数据

### 4.1 两幕四篇章（按答辩 PPT《储百卅之光 · 能万里新程》重构）

```
第一幕　储百卅之光（回望来路）
├─ 回望 · 寻百卅根脉铸魂    16 项   西迁 · 长征 · 校史 · 红色
└─ 自驱 · 学百卅真知入心     9 项   学习 · 体育 · 心理 · 审美

第二幕　能万里新程（走向新程）
├─ 携手 · 携百卅之志并肩     7 项   宣讲 · 志愿 · 劳动 · 助人
└─ 开物 · 创百卅新篇敢为    11 项   AI · 企业 · 港 · 人机所
```

篇章主字：回望·**根** ／ 自驱·**知** ／ 携手·**行** ／ 开物·**创**
配色：回望 `#8B0A1E` ／ 自驱 `#C8102E` ／ 携手 `#E8734A` ／ 开物 `#D4AF37`
**导航只显示 2 字主名**（回望/自驱/携手/开物），页面 hero 用全名。

### 4.2 数据规模

| 项 | 数值 |
|---|---|
| 活动 | **41 项**（全部已举办） |
| 相册 | **34 个 / 229 张照片** |
| 推文 | **已发 31 篇**（仙交钱小团 26 · 英仔爱心社 3 · 钱学森学院 1 · YouthPower西安 1） |
| 足迹地图 | 19 个地点 / 12 组地区足迹 |
| 家乡 | 27 处 / 31 位同学 |
| 全班 | 31 人（团员 29 人；查明俊、李浩冉不是团员） |

---

## 5. 关键文件

```
D:\XJTUpack\大一\班委\ai\团日活动\03_展示网站\
├── index.html               首页（数据条 / 两幕四篇章 / 地图卡 / 推文信息流 / 近期活动 / 活动分布）
├── jn.html                  回望篇章页
├── xs.html                  自驱篇章页
├── cr.html                  携手篇章页
├── sn.html                  开物篇章页
├── photos.html              活动相册（34 个）
├── activity.html            活动详情页模板（?id=aNN）
├── map3d.html               红色足迹浮雕地图（319KB，数据全内嵌，可双击打开）
├── about.html / download.html
├── favicon.ico / apple-touch-icon.png / site.webmanifest
├── README.md                项目说明
├── 完整交接文档.md            上一版完整技术交接（很长，可查细节）
├── 活动分类说明.md            41 项活动的归类依据（脚本生成）
├── tools/
│   ├── serve.py             本地预览服务器（必须用，显式 charset=utf-8）
│   ├── push.py              ⭐ 一键推送（解决 Schannel + IP 封锁）
│   ├── git_proxy.py         底层代理（push.py 内置了，一般不用单独跑）
│   └── validate.py          ⭐ 数据校验器（改完必跑）
└── assets/
    ├── css/style.css        全站样式（31KB）
    ├── js/
    │   ├── site.js          公共工具（escapeHTML / safeHref / loadJSON / activityDate）
    │   ├── render-activities.js  活动卡片 + 各类计数
    │   ├── newsfeed.js      推文信息流
    │   ├── photos.js        相册页时间轴 + 快速定位
    │   ├── gallery.js       相册网格 + 灯箱
    │   └── activity.js      详情页渲染（推文式）
    ├── data/
    │   ├── activities.json   ⭐ 41 项活动（核心数据）
    │   ├── articles.json     ⭐ 推文（23 已发 + 4 草稿）
    │   ├── hometowns.json    家乡（27 处 / 31 人）
    │   ├── map-locations.json 足迹地图 19 个地点
    │   └── china.geo.json    中国省界 GeoJSON（569KB）
    └── img/
        ├── logo/            班徽（蓝青款）+ favicon 全套
        └── gallery/         34 个相册，每册 t/(480px) + f/(1200px)
```

### 5.1 `activities.json` 字段

```json
{
  "id": "a27", "ch": "开物", "main": "创",
  "status": "done",                     // done | planned
  "title": "探访迅湃科技 · 感知产业前沿",
  "when": "2026-10-15 下午",             // 禁止带人数
  "tags": ["选做5 青年创新", "校企联合"],
  "lead": "导语 1—2 句",
  "story": [{ "h": "小标题", "p": "段落，支持 **加粗** 与换行" }],
  "summary": "总结",
  "articleUrl": "https://mp.weixin.qq.com/s?...",   // 可选
  "gallery": "g-xunpai", "photos": 5,               // 与 manifest 一致
  "href": "activity.html?id=a27",
  "dateKey": "2026-10-15", "verified": "A"
}
```

> 旧的 `desc` / `plan` / `count` 字段**已废弃**，不要写。

### 5.2 页面计数标记（JS 自动填，HTML 里写占位）

| 标记 | 含义 |
|---|---|
| `[data-count-total]` / `[data-count-total-done]` | 全部活动 / 已开展 |
| `[data-count-ch="回望"]` / `[data-count-ch-done]` | 该篇章总数 / 已开展 |
| `[data-bar-ch="回望"]` | 活动分布条宽度 |
| `[data-latest-acts="6"]` | 近期活动列表 |
| `[data-count-albums]` / `[data-count-articles]` | 相册数 / 推文数 |
| `[data-chapter-scope]` / `[data-chapter-rule]` | 从 meta.chapters 取文案 |
| `.acts[data-chapter="回望"]` | 篇章页活动列表容器 |

---

## 6. 素材在哪

### 6.1 原始照片（两个副本）

```
D:\XJTUpack\大一\班委\最佳团日活动\素材\      ← 规范目录，脚本读这里
C:\Users\EQ\Desktop\素材\                    ← 业主副本
```
文件夹名 = `日期 + 活动名`，如 `10.11图书馆钱展`、`10.18关中革命纪念馆习仲勋纪念馆`（119 张）

### 6.2 策划案 / 推文压缩包

| 素材 | 路径 |
|---|---|
| 策划案.zip（390.8MB） | `D:\Apps\xwechat_files\wxid_ek3tydo107ri22_1d13\msg\file\2026-10\策划案.zip` |
| 推文.zip（34.75MB） | 同目录 `推文.zip` |
| 8 篇新推文 docx | `D:\Apps\xwechat_files\...\temp\RWTemp\2026-10\d41b4c90c5d4292eebd75224151e6659\` |

### 6.3 ⭐ 推文原文（核对事实必读）

```
D:\XJTUpack\大一\班委\ai\99_临时草稿\推文素材_20261018\
```
`wx_企业参观.txt`（迅湃业务就靠这篇纠正）、`wx_创新港.txt`、`rjv5.txt`（人机所）、
`p_qz.txt`（钱图）、`p_ai.txt`、`p_bball.txt`、`p_xq.txt` 等。

> **写任何活动正文前，先在这里搜有没有对应原文。** 迅湃那次就是因为没查，写成了"做快速充电的"。

### 6.4 已解压归档

```
D:\XJTUpack\大一\班委\ai\团日活动\04_素材归档\
├── 策划案包正文_20261019.txt      27 份策划案正文汇总（105KB，直接读）
├── 新推文7篇正文_20261019.txt
├── _包内图片\                     从 docx 提取的推文配图
└── _新推文图片\
```

### 6.5 工具脚本（不在仓库内）

```
D:\XJTUpack\大一\班委\ai\tools\
```
| 脚本 | 用途 |
|---|---|
| `restyle_bands.py` | ⭐ 待执行：两幕卡大气化 |
| `realign_chapters_step1~4.py` | 四篇章重构（已执行完） |
| `update_articles_1019.py` | 推文清单更新（已执行完） |
| `build_favicon.py` | 班徽生成 favicon 全套 |
| `rebuild_galleries_from_folders.py` | 从素材文件夹重建相册（哈希去重 + 均匀抽样） |
| `check_html_tags.py` | HTML 标签配平检查 |

---

## 7. ⭐ 推送方法（今晚踩了很久，务必照做）

### 现象

直接 `git push` 会失败，可能报以下几种之一：

```
schannel: AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS
Failed to connect to github.com:443
Recv failure: Connection was reset
Error in the HTTP2 framing layer
Proxy CONNECT aborted
```

### 根因（两个独立问题）

1. **Windows Schannel 凭证失效** —— 此时连百度都打不开 HTTPS（HTTP 正常）
2. **github.com 的 IP 被封锁 / 各前置 IP 时通时断** —— DNS 给的 `20.205.243.166` 常被丢包

### 解决：一条命令

```powershell
cd "D:\XJTUpack\大一\班委\ai\团日活动\03_展示网站"
python tools/push.py
```

`tools/push.py` 会自动完成：
1. 逐个对 GitHub 前置 IP 做**真实 TLS 握手探测**，挑出当前真正能用的那个
2. 起一个本地 CONNECT 代理锁定该 IP
3. 用 `http.sslBackend=openssl` + `http.version=HTTP/1.1` + 代理执行 `git push`
4. 失败自动重试 4 次

先看探测结果不推送：

```powershell
python tools/push.py --dry-run
```

### 手动等价命令（供参考）

```powershell
python tools/git_proxy.py 8977 20.207.73.82
git -c http.sslBackend=openssl -c http.version=HTTP/1.1 `
    -c http.proxy=http://127.0.0.1:8977 push origin main
```

> ⚠️ 若业主在自己终端推送（其终端 TLS 正常），直接 `git push origin main` 即可。
> 若报 Schannel 错误，加 `-c http.sslBackend=openssl`。

### 其他注意事项

- 环境不是管理员，**改不了 hosts 文件**（试过了）
- 不要用 `curl` 判断网络：`curl.exe` 走 Schannel，会误报 000；用 Python `ssl` 或 `git ls-remote` 判断
- `api.github.com` / `codeload.github.com` 有时能通但**不能用来推送**（git push 必须走 github.com）

---

## 8. 验证方法

### 8.1 数据校验（改完必跑）

```powershell
python tools/validate.py
```
它会检查 20+ 项：活动 id 唯一、篇章有效、`main` 与篇章一致、
`href` 格式、无 `count` 字段、必填字段、**禁用词与人数**、相册存在且张数一致、
照片文件存在、推文统计一致、推文篇章与关联活动一致、HTML 标签配平、家乡数据一致性。

期望输出：

```
OK: 43 activities (42 done, 1 planned); 34 albums / 229 photos; 23 published / 4 drafts
```

### 8.2 本地预览

```powershell
python tools/serve.py 8801
# 打开 http://127.0.0.1:8801/
```
> **不能双击 index.html** —— 页面走 fetch，`file://` 会被 CORS 拦截。

### 8.3 视觉验证（无头 Chrome，现已可用）

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --headless=new --disable-gpu --no-sandbox --disable-dev-shm-usage `
  --user-data-dir="D:\temp\cprof" --hide-scrollbars `
  --window-size=1440,1600 --virtual-time-budget=9000 `
  --screenshot="D:\temp\shot.png" `
  "http://127.0.0.1:8801/index.html"
```

**要看的页面**：`index.html`（尤其是两幕卡片）、`jn.html`、`photos.html`、
`activity.html?id=a27`、`map3d.html`

> 截图目录要可写；`--disable-dev-shm-usage` 建议加。

### 8.4 线上验证

推送后等 **70—90 秒** Pages 重建，再用 Python（不要用 curl，Schannel 会误报）：

```python
import urllib.request, json
url = "https://xjtu-es2601.com/assets/data/activities.json"
d = json.loads(urllib.request.urlopen(url, timeout=25).read())
print(len(d["activities"]))
```

---

## 9. 已踩过的坑（省时间用）

| # | 坑 | 结论 |
|---|---|---|
| 1 | ECharts GL 做 3D 中国地图 | 视觉差 + 依赖 1.6MB，已废弃 |
| 2 | ECharts custom series 里 `api.coord()` | `renderItem` 里返回 undefined，走不通 |
| 3 | Canvas 2D 手绘挤出地图 | 逻辑对但发糊；**超采样反而更糊**（位图 2× 显示 1× 被降采样）。位图尺寸必须严格等于 CSS 尺寸 |
| 4 | 用无头 Chrome 截图判断 Canvas 质量 | `--disable-gpu` 软件合成会让 Canvas 降质，不能作为判断依据（SVG/CSS 不受影响） |
| 5 | 最终地图方案 | **真实省界 SVG + CSS 3D 透视**（`perspective` + `rotateX` + 多层 `translateZ`） |
| 6 | 正则提取 topbar `<div class="topbar">.*?</div>\s*</div>` | 少匹配一层 `</div>`，整页被套进 flex 布局横排。**必须用配平算法** |
| 7 | `render-activities.js` 没有 `.acts` 容器就 return | 首页计数全显示 `—`。已修 |
| 8 | 编造数据 | 见第 3 章，最严重的教训 |
| 9 | 单个素材包直接当真 | 养生茶饮那份 docx 其实是去年旧文件，必须交叉核对 |
| 10 | 微信 `.wxpic` 图片 | 私有 `wxgf` 格式，单字节 XOR 解不开；需原图或从长截图裁 |
| 11 | 四篇章改两幕后仍用 4 列网格 | 卡片只占左半边。已用 `.chapters-2` 修 |
| 12 | Python 脚本里长中文串断行 | 引号没闭合会 `SyntaxError`，写完先 `ast.parse` 检查 |

---

## 10. Git 历史（近期）

```
9f5a5e4  docs: README 统计行同步为 41 项活动 / 31 篇已发推文
bc44e31  content(articles): 推文清单更新为已发 31 篇 / 已成稿 4 篇
543c87f  feat(tools): git_proxy 支持手动指定上游 IP
2414bb9  chore: 忽略 Python 缓存目录
e2fe12b  feat(structure): 按答辩 PPT《储百卅之光·能万里新程》重构为两幕四篇章
ee735b8  style(home): 两幕篇章卡改为整行横向卡片
```

仓库：`https://github.com/EQmarks/xjtu-es2601-web`（main）
线上：`https://xjtu-es2601.com/`

---

## 11. 验收标准

1. `python tools/validate.py` 输出 `OK:`
2. 首页截图：两幕卡片**左右顶格、明显更大气**（字号/留白/序号到位）
3. 窄屏（≤640px）不错位
4. `python tools/push.py` 推送成功，线上 90 秒后可见
5. 内容中**无**禁用词、**无**人数

---

## 12. 一句话提醒

**这个项目出过三次事实性错误（迅湃业务、养生茶饮真假、长征影片名），全部源于"看到一份材料就当真"。**

**接到任何新材料，先问：有没有第二个来源能对上？没有就找业主确认。**
