# -*- coding: utf-8 -*-
"""本地预览服务：显式声明 charset=utf-8，避免浏览器猜错编码导致乱码
用法：python serve.py [port] [root]
"""
import sys, os, posixpath
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8800
ROOT = str(Path(sys.argv[2]).resolve()) if len(sys.argv) > 2 else str(Path(__file__).resolve().parent.parent)

EXTRA = {
    ".html": "text/html; charset=utf-8",
    ".htm": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".md": "text/plain; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".mp4": "video/mp4",
    ".pdf": "application/pdf",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".ttf": "font/ttf",
}


class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def guess_type(self, path):
        ext = os.path.splitext(path)[1].lower()
        if ext in EXTRA:
            return EXTRA[ext]
        return super().guess_type(path)

    def end_headers(self):
        # 关掉缓存，本地预览总是拿最新
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    def send_head(self):
        """目录请求返回 index.html"""
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            for idx in ("index.html", "index.htm"):
                p = os.path.join(path, idx)
                if os.path.isfile(p):
                    self.path = posixpath.join(self.path.rstrip("/"), idx)
                    break
        return super().send_head()

    def log_message(self, fmt, *args):
        sys.stderr.write("  %s\n" % (fmt % args))


os.chdir(ROOT)
srv = ThreadingHTTPServer(("127.0.0.1", PORT), H)
print("预览服务已启动： http://127.0.0.1:%d/" % PORT)
print("根目录： %s" % ROOT)
print("所有文本类型均声明 charset=utf-8")
sys.stdout.flush()
try:
    srv.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    srv.server_close()
