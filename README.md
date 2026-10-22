# 储能2601 团支部 · 最佳团日成果展示

主题：**储百卅之光，能万里新程**。网站按答辩 PPT 的**两幕四篇章**组织：第一幕「储百卅之光」含**回望**（寻百卅根脉铸魂）与**自驱**（学百卅真知入心）；第二幕「能万里新程」含**携手**（携百卅之志并肩）与**开物**（创百卅新篇敢为）。

线上地址：[成果展示网站](https://xjtu-es2601.com/)

维护前请先读 [完整交接文档](完整交接文档.md)，尤其是第 3 节内容规范、第 7 节待办和第 9 节验证方法。现有版式已定稿，美化改动须先提供预览。

## 本地运行与检查

本站使用原生 HTML、CSS、JavaScript，无构建步骤和第三方运行时依赖。

```powershell
python tools/serve.py 8801
# 浏览器打开 http://127.0.0.1:8801/
```

活动、推文与相册通过 fetch 读取 JSON，需使用本地 HTTP 服务预览。地图 `map3d.html` 为独立离线页面，支持双击与断网打开。预览服务器默认根目录由脚本位置确定，可在任意目录启动，也可传入第二个参数指定目录。

修改后运行：

```powershell
python tools/validate.py
node --check assets/js/site.js
# 对改过的其他 JS 同样执行 node --check
```

再按交接文档第 9 节检查首页、四篇章、相册、活动详情及地图的实际显示。数据检查成功不能代替浏览器验证。

## 页面与代码

| 文件 | 用途 |
|---|---|
| `index.html` | 首页、篇章导航、宣传成果、最新活动与统计 |
| `jn.html` / `xs.html` / `cr.html` / `sn.html` | 四篇章活动列表（回望 / 自驱 / 携手 / 开物） |
| `activity.html?id=aNN` | 活动详情：导语、分节正文、总结、观后感、照片 |
| `photos.html` | 按时间排列的活动相册 |
| `map3d.html` | 红色足迹浮雕地图，独立内嵌数据与脚本 |
| `about.html` / `download.html` | 支部概况、材料下载 |
| `assets/css/style.css` | 共享样式与主题变量 |
| `assets/js/site.js` | 公共 JSON 请求、文本转义、安全链接、页面就绪与错误提示 |
| `assets/js/render-activities.js` | 活动卡片、首页统计、分布条和最新活动 |
| `assets/js/activity.js` | 活动详情渲染 |
| `assets/js/photos.js` | 相册时间轴与索引 |
| `assets/js/gallery.js` | 照片网格、灯箱与键盘操作 |
| `assets/js/newsfeed.js` | 已发布推文、待发布草稿、发布平台统计 |

页面先加载 `site.js`，再加载使用它的模块。详情与相册页还需先加载 `gallery.js`，由页面模块在生成容器后调用 `SiteGallery.init(root)`；无需动态插入脚本。重复初始化不会生成重复监听器或灯箱。

公共 JSON 请求在单页内复用，页面刷新后重新取数；失败请求不会永久缓存。地图继续保持自包含，不依赖这些公共模块。

## 数据维护

| 数据文件 | 内容 |
|---|---|
| `assets/data/activities.json` | 活动与详情正文、状态、照片引用、篇章信息 |
| `assets/data/articles.json` | 已发布推文与已成稿待发布草稿 |
| `assets/img/gallery/manifest.json` | 相册清单、实际文件名与张数 |
| `assets/data/hometowns.json` | 全体同学家乡地点及人数，运行 `python tools/sync_hometowns.py` 同步离线地图与计数 |
| `assets/data/map-locations.json` | 红色足迹地点，更新后须同步地图内嵌数据 |
| `assets/data/photo-map.json` | 素材文件夹与活动的归属记录 |

截至 2026-10-21：**41 项活动（全部已举办），34 个相册、229 张照片，31 篇已发布推文（4 个平台）**。活动内容依据《最佳团日41_储能2601_总结材料_提交版》逐一对应。家乡信息已确认 **27 个地点、31 位同学**（正定按用户提供名称单列），支部共 31 人、29 位团员。

首页活动、相册、照片及推文统计由数据计算。修改活动时同步其 `meta` 统计，并运行校验。照片文件为 `assets/img/gallery/<相册>/t/<文件名>` 与 `f/<文件名>` 两种尺寸；渲染器以 manifest 的 `photos` 清单为准。

公开活动文案只写已核实事实，不写内部组织流程、经费、参与人数或名单。保留 `lead`、`story`、`summary`，不再使用旧字段 `desc`、`plan`、`count`。不要仅凭策划案把计划写成已举办。

目前待确认：

- a40「给四年后自己的信」计划于 10 月 19 日晚举行，实际举办后再更新状态。
- 秦腔博物馆馆内照片，目前相册只有 2 张合影。

## 推送

仓库使用 main 分支发布 GitHub Pages。若直连失败，按交接文档第 8.2 节使用仓库自带代理：

```powershell
python tools/git_proxy.py 8899
# 另一个终端执行
 git -c http.proxy=http://127.0.0.1:8899 push origin main
```

推送后等待 GitHub Pages 重建，再核对线上页面与数据。工具详情见 [tools/README.md](tools/README.md)。

本站是团日成果展示网站，非学校官方站点。


分类依据见 [活动分类说明](活动分类说明.md)。当前四篇章分布为 13／9／11／8（共 41 项）。正文以原推文与确认素材为准，资料不足不强求篇幅；双换行会渲染为独立段落。
