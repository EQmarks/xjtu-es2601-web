# -*- coding: utf-8 -*-
"""
从私有仓库导出「干净公开站点」到独立目录，用于 GitHub Pages 发布。

排除：内部文档、tools、采访视频、交接目录、AGENTS.md 等
加固：referrer 策略、外链 noopener、版权声明、robots、404、.nojekyll

用法：python tools/build_public_site.py
输出：D:\\XJTUpack\\大一\\班委\\ai\\团日活动\\_public_site
"""
import json
import os
import re
import shutil
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SRC = r"D:\XJTUpack\大一\班委\ai\团日活动\03_展示网站"
DST = r"D:\XJTUpack\大一\班委\ai\团日活动\_public_site"

INCLUDE_FILES = ["CNAME", "favicon.ico", "favicon.png", "apple-touch-icon.png", "site.webmanifest"]
INCLUDE_DIRS = ["assets/css", "assets/js", "assets/data", "assets/img", "assets/vendor",
                "assets/downloads", "news"]
EXCLUDE = [
    re.compile(r"assets/downloads/interviews/", re.I),
    re.compile(r"(^|/)AGENTS\.md$", re.I),
    re.compile(r"(^|/)tools/", re.I),
    re.compile(r"(^|/)交接", re.I),
]

COPYRIGHT = (
    '<div style="margin-top:18px;padding-top:12px;border-top:1px solid rgba(255,255,255,.18);'
    'font-size:12px;line-height:1.7;color:rgba(255,255,255,.62)">'
    '© 2026 储能2601 团支部 · 本页文案、照片与代码版权归本支部所有，未经许可不得复制、镜像或用于其他支部/项目。'
    '<br>本站为班级活动记录与成果展示站，非学校官方站点。</div>'
)

ROBOTS = """# 储能2601 团支部 · 最佳团日成果展示
User-agent: *
Allow: /
Disallow: /assets/downloads/
"""
README = """# 储能2601 团支部 · 最佳团日成果展示站

西安交通大学钱学森书院 储能2601 团支部 · 第四十一届最佳团日成果展示网站。

- 站点：https://xjtu-es2601.com/
- 内容：42 项团日活动纪实、245 张现场照片、红色足迹地图、材料下载
- 技术：纯静态 HTML / CSS / 原生 JS，无后端、无跟踪脚本
- 说明：本站为班级活动记录与成果展示站，非学校官方站点

© 2026 储能2601 团支部。本站文案、照片与代码版权归本支部所有，未经许可不得复制、镜像或用于其他支部/项目。
"""

FOUR04 = """<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>页面走丢了 · 储能2601 团支部</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
background:linear-gradient(160deg,#8B0A1E,#C8102E 60%,#a00c24);color:#fff;
font-family:"Microsoft YaHei","Noto Sans SC",sans-serif;text-align:center}
.box{padding:40px}.code{font-size:96px;font-weight:800;color:#D4AF37;margin:0;line-height:1}
h1{font-size:26px;margin:14px 0 8px}p{color:#f3e2d2;margin:0 0 22px}
a{display:inline-block;padding:10px 26px;border:1px solid #D4AF37;border-radius:4px;
color:#F6E6C9;text-decoration:none}a:hover{background:#D4AF37;color:#5b0a15}
</style></head><body><div class="box">
<p class="code">404</p><h1>这一页不在档案里</h1>
<p>可能是链接过期，也可能是一次误触。</p>
<a href="/">回到首页</a></div></body></html>
"""


def excluded(rel):
    rel = rel.replace("\\", "/")
    return any(p.search(rel) for p in EXCLUDE)


def copy_tree():
    n = 0
    for name in INCLUDE_FILES:
        s = os.path.join(SRC, name)
        if os.path.isfile(s):
            shutil.copy2(s, os.path.join(DST, name))
            n += 1
    for name in os.listdir(SRC):
        s = os.path.join(SRC, name)
        if name.endswith(".html") and os.path.isfile(s):
            shutil.copy2(s, os.path.join(DST, name))
            n += 1
    for d in INCLUDE_DIRS:
        sdir = os.path.join(SRC, d)
        if not os.path.isdir(sdir):
            continue
        for root, dirs, files in os.walk(sdir):
            for f in files:
                s = os.path.join(root, f)
                rel = os.path.relpath(s, SRC)
                if excluded(rel):
                    continue
                t = os.path.join(DST, rel)
                os.makedirs(os.path.dirname(t), exist_ok=True)
                shutil.copy2(s, t)
                n += 1
    return n


def strip_interviews():
    p = os.path.join(DST, "download-learning.html")
    if not os.path.isfile(p):
        return False
    s = open(p, encoding="utf-8").read()
    m = re.search(r'<section class="attachment-section"><h2>采访原始视频</h2>.*?</section>', s, re.S)
    if not m:
        return False
    s = s[:m.start()] + s[m.end():]
    s = s.replace("文字稿 · 题库 · 采访视频", "文字稿 · 题库")
    open(p, "w", encoding="utf-8").write(s)
    return True


def strip_resources_json():
    p = os.path.join(DST, "assets/data/resources.json")
    if not os.path.isfile(p):
        return 0
    d = json.load(open(p, encoding="utf-8"))
    removed = 0

    def walk(o):
        nonlocal removed
        if isinstance(o, dict):
            for k, v in list(o.items()):
                if isinstance(v, list):
                    keep = []
                    for it in v:
                        if "downloads/interviews/" in json.dumps(it, ensure_ascii=False):
                            removed += 1
                            continue
                        keep.append(it)
                    o[k] = keep
                walk(o[k])
        elif isinstance(o, list):
            for it in o:
                walk(it)

    walk(d)
    json.dump(d, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    return removed


def harden_html(path):
    s = open(path, encoding="utf-8").read()
    orig = s
    if 'name="referrer"' not in s:
        s = re.sub(r'(<meta charset="[^"]+">)',
                   '\\1\n<meta name="referrer" content="strict-origin-when-cross-origin">',
                   s, count=1)
    s = re.sub(r'<a(?![^>]*\brel=)([^>]*\btarget="_blank"[^>]*)>',
               lambda m: '<a' + m.group(1) + ' rel="noopener noreferrer">', s)
    if "© 2026 储能2601" not in s:
        if "</footer>" in s:
            s = s.replace("</footer>", COPYRIGHT + "\n</footer>", 1)
        else:
            s = s.replace("</body>", COPYRIGHT + "\n</body>", 1)
    if s != orig:
        open(path, "w", encoding="utf-8").write(s)
        return True
    return False


def check_links():
    htmls = [f for f in os.listdir(DST) if f.endswith(".html")]
    missing = {}
    for h in htmls:
        s = open(os.path.join(DST, h), encoding="utf-8").read()
        for attr in ("href", "src"):
            for m in re.finditer(attr + r'="([^"]+)"', s):
                u = m.group(1).split("?")[0].split("#")[0]
                if not u or u.startswith(("http://", "https://", "mailto:", "tel:", "javascript:", "data:")):
                    continue
                p = os.path.normpath(os.path.join(DST, u.lstrip("/")))
                if not os.path.exists(p):
                    missing.setdefault(u, []).append(h)
    return missing


def rmtree_force(path):
    def on_err(func, p, exc):
        try:
            os.chmod(p, 0o666)
            func(p)
        except Exception:
            pass
    shutil.rmtree(path, onerror=on_err)


def main():
    if os.path.isdir(DST):
        rmtree_force(DST)
    os.makedirs(DST)
    n = copy_tree()
    print("复制文件：%d" % n)

    ok = strip_interviews()
    rm = strip_resources_json()
    print("清理采访视频：download-learning.html=%s，resources.json 删除 %d 条" % (ok, rm))

    open(os.path.join(DST, ".nojekyll"), "w").write("")
    open(os.path.join(DST, "robots.txt"), "w", encoding="utf-8").write(ROBOTS)
    # sitemap
    pages = [f for f in os.listdir(DST) if f.endswith(".html") and f != "404.html"]
    prio = {"index.html": "1.0", "photos.html": "0.9", "map3d.html": "0.9",
            "activity.html": "0.8", "about.html": "0.7", "download.html": "0.7"}
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for f in sorted(pages, key=lambda x: (x != "index.html", x)):
        loc = "https://xjtu-es2601.com/" + ("" if f == "index.html" else f)
        sm.append("  <url><loc>%s</loc><changefreq>monthly</changefreq><priority>%s</priority></url>"
                  % (loc, prio.get(f, "0.5")))
    sm.append("</urlset>")
    open(os.path.join(DST, "sitemap.xml"), "w", encoding="utf-8").write("\n".join(sm))
    print("写入 sitemap.xml（%d 个页面）" % len(pages))
    open(os.path.join(DST, "404.html"), "w", encoding="utf-8").write(FOUR04)
    open(os.path.join(DST, "README.md"), "w", encoding="utf-8").write(README)
    print("写入 .nojekyll / robots.txt / 404.html / README.md")

    hn = 0
    for f in os.listdir(DST):
        if f.endswith(".html"):
            if harden_html(os.path.join(DST, f)):
                hn += 1
    print("加固 HTML：%d 个页面（referrer / noopener / 版权声明）" % hn)

    bad = []
    for root, dirs, files in os.walk(DST):
        for f in files:
            rel = os.path.relpath(os.path.join(root, f), DST)
            if excluded(rel):
                bad.append(rel)
    total = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(DST) for f in fs)
    count = sum(len(fs) for _, _, fs in os.walk(DST))
    print("\n=== 体检 ===")
    print("残留排除项：%s" % (bad or "无 ✔"))
    print("文件数：%d　总大小：%.1f MB" % (count, total / 1048576))
    miss = check_links()
    if miss:
        print("\n⚠ 站内链接缺失 %d 处：" % len(miss))
        for u, where in list(miss.items())[:15]:
            print("   %s  ← %s" % (u, ",".join(sorted(set(where))[:3])))
    else:
        print("站内链接：全部可达 ✔")
    print("\n输出目录：%s" % DST)


if __name__ == "__main__":
    main()
