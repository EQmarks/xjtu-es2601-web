# tools · 本地工具脚本

本目录脚本**仅用于开发维护**，不是网站运行依赖（访客访问网站不需要它们）。

| 脚本 | 用途 |
|---|---|
| `serve.py` | 本地预览服务器。显式声明 `charset=utf-8`，避免浏览器猜错编码导致中文乱码 |
| `git_proxy.py` | GitHub 推送被墙时的本地转发代理。自动挑选可用 IP，绕过 IP 层封锁 |
| `validate.py` | 检查活动字段、统计、公开文案规范、相册清单与双尺寸文件。检查失败时返回非零退出码 |
| `sync_hometowns.py` | 将 `assets/data/hometowns.json` 同步到独立地图，并更新首页、地图的家乡地点数 |

## 用法

### 本地预览

```bash
python tools/serve.py 8801
# 打开 http://localhost:8801
```

> 活动列表、详情和相册需要通过 HTTP 服务预览。`map3d.html` 的数据已内嵌，可以独立双击打开。

### 数据校验

```bash
python tools/validate.py
```

脚本根据实际数据计算统计，不把 41 项活动、34 个相册等当前数量写死。新增活动或照片后也可继续使用。

家乡数据以 `assets/data/hometowns.json` 为准，`n` 表示该地点对应人数，`p` 为现有地图投影坐标。修改后先运行 `python tools/sync_hometowns.py`，再运行校验。地图仍内嵌完整数据，支持离线打开。

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
