# tools · 本地工具脚本

本目录脚本**仅用于开发维护**，不是网站运行依赖（访客访问网站不需要它们）。

| 脚本 | 用途 |
|---|---|
| `serve.py` | 本地预览服务器。显式声明 `charset=utf-8`，避免浏览器猜错编码导致中文乱码 |
| `git_proxy.py` | GitHub 推送被墙时的本地转发代理。自动挑选可用 IP，绕过 IP 层封锁 |

## 用法

### 本地预览

```bash
python tools/serve.py 8801
# 打开 http://localhost:8801
```

> 地图页与活动列表需要 `fetch` 数据，不能直接双击打开（`file://` 会被 CORS 拦截）

### 推送被墙时

```bash
# 1) 启动代理（保持窗口不关）
python tools/git_proxy.py 8899

# 2) 通过代理推送
git -c http.proxy=http://127.0.0.1:8899 push origin main
```

**原理**：`github.com` 的 DNS 解析结果是 `20.205.243.166`，该 IP 被封（TCP 握手即超时）。
但 GitHub 其他前置 IP（如 `140.82.112.3`）均可正常访问。
代理会忽略 DNS 结果，直接连可用的 IP，同时保留 SNI/Host 为 `github.com`，TLS 校验正常通过。

**验证代理**：
```bash
curl -x http://127.0.0.1:8899 https://github.com/ -o /dev/null -w "%{http_code}\n"
# 应输出 200
```