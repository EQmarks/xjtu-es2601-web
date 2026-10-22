# 网址缩短与 Cloudflare 配置说明

> ✅ **已完成**（2026-10-22）：已注册 `xjtu-es2601.com` 并绑定 GitHub Pages。
> - 站点地址：**https://xjtu-es2601.com/**
> - DNS：阿里云，A 记录 4 条（185.199.108—111.153）+ CNAME www → eqmarks.github.io
> - 旧地址 `eqmarks.github.io/xjtu-es2601-web/` 自动 301 跳转
> - 本文档保留作后续参考（换域名、上 Cloudflare 时用）

---

> 现状：`https://xjtu-es2601.com/`（43 字符）
> 目标：让人能记住、能口头说、二维码扫出来不密

---

## 一、四种方案对比

| 方案 | 缩短后 | 成本 | 生效时间 | 难度 |
|---|---|---|---|---|
| **A. 仓库改名 `eqmarks.github.io`** | `https://eqmarks.github.io/`（23 字符） | 0 元 | 5 分钟 | ⭐ 极简 |
| **B. 仓库改名 `es2601`** | `https://eqmarks.github.io/es2601/`（29 字符） | 0 元 | 5 分钟 | ⭐ 极简 |
| **C. 自购域名 + Cloudflare** | `https://es2601.top/`（20 字符） | 域名 10—80 元/年，Cloudflare 免费 | 1—24 小时 | ⭐⭐⭐ |
| D. 短链服务（如 t.cn） | `https://t.cn/xxxx` | 0 元 | 立刻 | ⭐ 但不可控、可能失效 |

### 建议路线

1. **先做 A 或 B**，零成本立刻变短；
2. 如果要做二维码、印在材料上、或想脱离 github.io 的观感，再上 **C**；
3. **不建议 D**——第三方短链有失效与跳转劫持风险，正式材料上不合适。

> ⚠️ 方案 A 的代价：`eqmarks.github.io` 这个仓库名**一个 GitHub 账号只能有一个**，
> 且它会成为账号的"用户主页站"。如果以后还想放别的项目，就得共用同一个站。
> 因此更稳的是 **B**。

---

## 二、Cloudflare 完整配置步骤（方案 C）

### 前置

- 一个域名（推荐 `.top` / `.xyz` / `.cn`；预算够用 `.com`）
- GitHub 仓库已开 Pages 且能正常访问

### 第 1 步：买域名

| 渠道 | 说明 |
|---|---|
| **Cloudflare Registrar** | 成本价、无续费涨价，但**需要先把域名转到 Cloudflare**，新注册入口对美国区开放 |
| **阿里云 / 腾讯云** | 国内最方便，`.top` 首年约 10 元，`.com` 约 60—90 元 |
| **Namesilo / Porkbun** | 海外，价格透明，支持支付宝的部分有 |

> 买的时候注意：**只买域名，不要买"网站空间"套餐**，我们只用 DNS。

### 第 2 步：在 Cloudflare 添加站点

1. 打开 `https://dash.cloudflare.com` 注册/登录
2. 点 **Add a site**（添加站点）
3. 输入你的**根域名**（如 `es2601.top`，不要带 `www` 和 `https://`）
4. 选择 **Free（免费）** 计划 → Continue
5. Cloudflare 自动扫描现有 DNS 记录 → Continue
6. **记下它分配的两个 Nameserver**，形如：
   ```
   xxx.ns.cloudflare.com
   yyy.ns.cloudflare.com
   ```

### 第 3 步：把域名的 NS 换成 Cloudflare 的

回到**买域名的那个平台**（阿里云/腾讯云/Namesilo）：

- 找到「域名管理 → DNS 修改 / 修改 DNS 服务器」
- 把原来的 NS 全删掉，填入 Cloudflare 给的那两个
- 保存

> 生效时间：几分钟到 24 小时。Cloudflare 首页会显示站点状态，
> 变成 **Active** 就说明接管成功。

### 第 4 步：添加指向 GitHub Pages 的记录

Cloudflare → 你的域名 → **DNS → Records → Add record**：

| 类型 | 名称 | 内容 | 代理状态 |
|---|---|---|---|
| **CNAME** | `@` | `eqmarks.github.io` | **已代理（橙色云）** |

> - `@` 表示根域名。Cloudflare 支持根域 CNAME（内部做 CNAME flattening），不会报错。
> - 如果你还想让 `www.es2601.top` 也能访问，再加一条 `CNAME  www → eqmarks.github.io`。
> - **橙色云**（Proxied）打开才有 CDN 与隐藏源站效果；关闭（灰云）就是纯 DNS。

### 第 5 步：在 GitHub 绑定自定义域名

1. 打开仓库 → **Settings → Pages**
2. **Custom domain** 填 `es2601.top` → **Save**
3. 等 GitHub 做 DNS 检查（通常几分钟）
4. 检查通过后，勾上 **Enforce HTTPS**（强制 HTTPS）

> GitHub 会自动为你的域名签发 Let's Encrypt 证书，约需 10 分钟。
> 证书签发期间**不要**在 Cloudflare 上把 SSL 模式设为 `Flexible`，否则会死循环重定向。

### 第 6 步：设置 Cloudflare 的 SSL 模式（**关键，容易配错**）

Cloudflare → **SSL/TLS → Overview** → 选择：

```
✅ Full（完全）
❌ 不要选 Flexible（灵活）
❌ 不要选 Off
```

原因：GitHub Pages 侧已有有效证书。选 `Full` 是 Cloudflare ↔ GitHub 之间也走 HTTPS；
选 `Flexible` 会让 Cloudflare 用 HTTP 回源，而 GitHub 强制 HTTPS → 无限重定向。

> 如果后续出现 526 错误，说明 GitHub 证书还没签好，等几分钟或先临时设 Full (strict) 之外的选项。

### 第 7 步：可选优化（都在 Cloudflare 控制台）

| 功能 | 位置 | 建议 |
|---|---|---|
| **Always Use HTTPS** | SSL/TLS → Edge Certificates | 开 |
| **Automatic HTTPS Rewrites** | 同上 | 开 |
| **Brotli** | Speed → Optimization | 开 |
| **HSTS** | SSL/TLS → Edge Certificates | 稳定运行一周后再开 |
| **Rocket Loader** | Speed → Optimization | **关**（会和小程序的 JS 冲突） |
| 缓存级别 | Caching → Configuration | Standard |

### 第 8 步（可选）：用 Redirect Rule 做更短的入口

Cloudflare → **Rules → Redirect Rules** 可以做到：

- 访问 `es2601.top/best` → 302 跳到某个长链接
- 把一个旧地址批量跳转到新地址

免费版有 10 条规则额度，够用。

---

## 三、⚠️ 必须知道的三个坑

### 1. Cloudflare 免费版在国内**不一定更快**

Cloudflare 免费套餐走的是境外节点，国内访问**绕路**，有时比 `github.io` 还慢。
真正国内提速需要：**域名 ICP 备案 + 国内 CDN（阿里云/腾讯云）**，备案需 1—3 周。

对"班级团日展示"这类站点，**不建议折腾备案**。如果主要给老师和同学看，
`github.io` 或 Cloudflare 都能用；如果担心被墙，见第四节。

### 2. 根域与 www 只能绑一个

GitHub Pages 的 Custom domain 只接受**一个**主机名。
如果既要 `es2601.top` 又要 `www.es2601.top`，得用 Cloudflare 的
**Redirect Rule** 把其中一个 301 到另一个。

### 3. 客户端缓存与 Pages 重建

改了内容推送到 GitHub 后，Pages 需要 70—90 秒重建。
如果套了 Cloudflare，还要等 Cloudflare 缓存刷新（默认几小时，或手动 Purge Cache）。

> 更新后看不到新版，先按 `Ctrl+F5`；仍不行就到 Cloudflare → Caching → **Purge Everything**。

---

## 四、如果主要问题是"被墙"

`github.io` 在国内属于**时通时不通**。若确实需要稳定访问，按成本从低到高：

| 方案 | 成本 | 说明 |
|---|---|---|
| 保持现状 + 说明页 | 0 | 最省事，但访客体验不稳 |
| GitHub Pages + Cloudflare | 域名费 | 略好，但仍绕境外 |
| **Gitee Pages（码云）** | 0 | 国内访问快，但需实名、仓库需手动同步，且 Pages 服务时开时关 |
| 阿里云 OSS + CDN | 几十元/年 | 国内最快，但**必须备案** |
| Vercel / Netlify | 0 | 国外平台，国内访问同样不稳 |

> 现阶段建议：**保持 GitHub Pages，另外保留一份 `tools/serve.py` 的本地演示**，
> 答辩现场用本地打开，不依赖网络。

---

## 五、操作清单（照做即可）

```
□ 1. 决定方案：B（改名 es2601）还是 C（买域名）
□ 2. 方案 B：GitHub 仓库 Settings → Rename → es2601
        → Pages 会自动变成 https://eqmarks.github.io/es2601/
        → 注意：站内所有相对路径不受影响，但 README 里的绝对地址要改
□ 3. 方案 C：买域名 → Cloudflare Add a site → 换 NS → 等 Active
□ 4. CNAME  @  → eqmarks.github.io  （橙色云）
□ 5. GitHub Pages Custom domain 填域名 → Save → 等 DNS 检查通过
□ 6. 勾 Enforce HTTPS → 等证书签发
□ 7. Cloudflare SSL/TLS 设为 Full
□ 8. 开 Always Use HTTPS / Brotli；关 Rocket Loader
□ 9. 验证：手机流量 + 电脑分别打开一次
□ 10. 把新地址更新到：网站页脚、README、交接文档、二维码
```

---

## 六、费用与时间汇总

| 项 | 费用 | 时间 |
|---|---|---|
| 仓库改名（方案 B） | 0 元 | 5 分钟 |
| 域名（`.top`） | 约 10—30 元/年 | 10 分钟下单 |
| 域名（`.com`） | 约 60—90 元/年 | 10 分钟下单 |
| Cloudflare Free | 0 元 | 配置 15 分钟 |
| NS 生效 | — | 5 分钟—24 小时 |
| GitHub 证书签发 | — | 5—15 分钟 |
| **合计（方案 C）** | **≈ 10—90 元/年** | **半天内可用** |
