# -*- coding: utf-8 -*-
"""一键推送工具（解决两个已知环境问题）

背景（2026-10-19 实测）
1. Windows Schannel 凭证失效
   部分环境下 git 用默认 Schannel 后端会报：
     schannel: AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS
   此时连百度都打不开 HTTPS（HTTP 正常）。解决：改用 OpenSSL 后端。
2. github.com 的 IP 被精准封锁 / 各前置 IP 时通时断
   DNS 给 github.com 的 20.205.243.166 常被丢包；其他前置 IP 时好时坏。
   解决：先探测哪个 IP 的 TLS 真能用，再用本地 CONNECT 代理锁定它。

本脚本把上面两步合起来：
  探测可用 IP → 启动本地代理 → git push（OpenSSL 后端 + HTTP/1.1）→ 自动重试

用法：
  python tools/push.py                # 推送到 origin main
  python tools/push.py origin main
  python tools/push.py --dry-run      # 只探测 IP，不推送
"""
import io, sys, os, socket, ssl, threading, select, subprocess, time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# GitHub 前置 IP 候选（顺序可调，脚本会逐个真实握手探测）
CANDS = [
    "20.207.73.82", "140.82.112.3", "140.82.114.3", "140.82.116.4",
    "20.200.245.247", "20.201.28.151", "4.237.22.38", "20.205.243.166",
    "140.82.116.3", "140.82.113.3", "140.82.121.3", "140.82.121.4",
    "20.27.177.113", "140.82.112.4", "140.82.113.4", "140.82.114.4",
]

PORT = 8977
CTX = ssl.create_default_context()


def log(*a):
    print(*a, flush=True)


def tls_ok(ip, timeout=6):
    """真实做一次 TLS 握手 + HTTP 探测，只有返回 HTTP 状态才算可用"""
    try:
        s = socket.create_connection((ip, 443), timeout=timeout)
        s.settimeout(timeout)
        ss = CTX.wrap_socket(s, server_hostname="github.com")
        ss.sendall(b"HEAD / HTTP/1.1\r\nHost: github.com\r\nConnection: close\r\n\r\n")
        data = ss.recv(64)
        ss.close()
        return data.startswith(b"HTTP/1.")
    except Exception:
        return False


def pick_ip():
    log("=== 探测可用 GitHub IP ===")
    for ip in CANDS:
        ok = tls_ok(ip)
        log("  %-16s %s" % (ip, "✔" if ok else "✘"))
        if ok:
            return ip
    return None


def pipe(a, b):
    try:
        while True:
            r, _, _ = select.select([a, b], [], [], 180)
            if not r:
                break
            for s in r:
                d = s.recv(65536)
                if not d:
                    return
                (b if s is a else a).sendall(d)
    except Exception:
        pass


def start_proxy(up_ip):
    def handle(client):
        up = None
        try:
            client.settimeout(15)
            buf = b""
            while b"\r\n\r\n" not in buf:
                x = client.recv(4096)
                if not x:
                    return
                buf += x
            up = socket.create_connection((up_ip, 443), timeout=15)
            up.settimeout(None)
            client.settimeout(None)
            client.sendall(b"HTTP/1.1 200 Connection Established\r\n\r\n")
            pipe(client, up)
        except Exception:
            pass
        finally:
            for s in (client, up):
                try:
                    if s:
                        s.close()
                except Exception:
                    pass

    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(("127.0.0.1", PORT))
    srv.listen(32)

    def loop():
        while True:
            try:
                c, _ = srv.accept()
                threading.Thread(target=handle, args=(c,), daemon=True).start()
            except Exception:
                break

    threading.Thread(target=loop, daemon=True).start()
    return srv


def main():
    dry = "--dry-run" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    remote = args[0] if args else "origin"
    branch = args[1] if len(args) > 1 else "main"

    ip = pick_ip()
    if not ip:
        log("\n❌ 没有可用 IP。可能整条网络到 GitHub 都不通，稍后重试或换网络。")
        return 2
    log("\n✔ 选中上游: %s:443" % ip)
    if dry:
        log("（--dry-run，不执行推送）")
        return 0

    start_proxy(ip)
    time.sleep(0.5)
    log("✔ 本地代理就绪: 127.0.0.1:%d" % PORT)

    env = dict(os.environ)
    env["GIT_TERMINAL_PROMPT"] = "0"
    cmd = [
        "git",
        "-c", "http.sslBackend=openssl",     # 绕开 Schannel 凭证问题
        "-c", "http.version=HTTP/1.1",       # 避免 HTTP2 framing 错误
        "-c", "http.proxy=http://127.0.0.1:%d" % PORT,
        "-c", "http.postBuffer=524288000",
        "push", remote, branch,
    ]
    log("=== 执行: git push %s %s ===" % (remote, branch))
    for i in range(4):
        r = subprocess.run(cmd, cwd=ROOT, capture_output=True, timeout=400, env=env)
        out = (r.stdout + r.stderr).decode("utf-8", "replace").strip()
        if r.returncode == 0 or "-> " in out or "up-to-date" in out:
            for line in out.splitlines():
                if "->" in line or "up-to-date" in line:
                    log("  " + line.strip())
            log("✅ 推送成功")
            return 0
        first = out.splitlines()[0][:90] if out else "(无输出)"
        log("  第 %d 次失败: %s" % (i + 1, first))
        time.sleep(5)
    log("❌ 多次重试仍失败。可稍后重跑本脚本。")
    return 1


if __name__ == "__main__":
    sys.exit(main())
