# -*- coding: utf-8 -*-
"""一键推送工具（解决两个已知环境问题）

背景（2026-10-19 至 10-21 实测）
1. Windows Schannel 凭证失效
   部分环境下 git 用默认 Schannel 后端会报：
     schannel: AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS
   此时连百度都打不开 HTTPS（HTTP 正常）。解决：改用 OpenSSL 后端。
2. github.com 的 IP 被精准封锁 / 各前置 IP 时通时断
   DNS 给 github.com 的 20.205.243.166 常被丢包；其他前置 IP 时好时坏，
   而且「TLS 握手能通」并不等于「推送能通」。
   解决：先探测哪些 IP 能通，再逐个 IP 试推。

流程：
  探测可用 IP（真实 TLS 握手）→ 逐个 IP 起本地代理 → git push → 失败换下一个

用法：
  python tools/push.py                # 推送到 origin main
  python tools/push.py origin main
  python tools/push.py --dry-run      # 只探测 IP，不推送
"""
import io, sys, os, socket, ssl, threading, select, subprocess, time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CANDS = [
    "20.207.73.82", "140.82.112.3", "140.82.114.3", "140.82.116.4",
    "20.200.245.247", "20.201.28.151", "4.237.22.38", "20.205.243.166",
    "140.82.116.3", "140.82.113.3", "140.82.121.3", "140.82.121.4",
    "20.27.177.113", "140.82.112.4", "140.82.113.4", "140.82.114.4",
]

CTX = ssl.create_default_context()


def log(*a):
    print(*a, flush=True)


def tls_ok(ip, timeout=6):
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


def pick_ips():
    log("=== 探测可用 GitHub IP ===")
    good = []
    for ip in CANDS:
        ok = tls_ok(ip)
        log("  %-16s %s" % (ip, "✔" if ok else "✘"))
        if ok:
            good.append(ip)
    return good


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


class Proxy:
    """在随机空闲端口起 CONNECT 代理，锁定到指定上游 IP"""

    def __init__(self, up_ip):
        self.up = up_ip
        self.srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.srv.bind(("127.0.0.1", 0))
        self.port = self.srv.getsockname()[1]
        self.srv.listen(32)
        self.alive = True
        threading.Thread(target=self._loop, daemon=True).start()

    def _loop(self):
        while self.alive:
            try:
                c, _ = self.srv.accept()
                threading.Thread(target=self._handle, args=(c,), daemon=True).start()
            except Exception:
                break

    def _handle(self, client):
        up = None
        try:
            client.settimeout(15)
            buf = b""
            while b"\r\n\r\n" not in buf:
                x = client.recv(4096)
                if not x:
                    return
                buf += x
            up = socket.create_connection((self.up, 443), timeout=15)
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

    def close(self):
        self.alive = False
        try:
            self.srv.close()
        except Exception:
            pass


PROXY_PORTS = [7890, 7891, 7892, 7897, 10808, 1080]


def port_open(port, host="127.0.0.1", timeout=1.0):
    try:
        s = socket.create_connection((host, port), timeout=timeout)
        s.close()
        return True
    except Exception:
        return False


def git_push_with(proxy=None, remote="origin", branch="main"):
    """使用指定代理（或直连）执行一次 push；成功返回 True"""
    env = dict(os.environ)
    env["GIT_TERMINAL_PROMPT"] = "0"
    cmd = ["git", "-c", "http.sslBackend=openssl", "-c", "http.version=HTTP/1.1"]
    if proxy:
        cmd += ["-c", "http.proxy=http://127.0.0.1:%d" % proxy]
    cmd += ["-c", "http.postBuffer=524288000", "push", remote, branch]
    for _ in range(2):
        r = subprocess.run(cmd, cwd=ROOT, capture_output=True, timeout=400, env=env)
        out = (r.stdout + r.stderr).decode("utf-8", "replace").strip()
        ok = (r.returncode == 0 and "rejected" not in out
              and ("-> " in out or "up-to-date" in out))
        if ok:
            for line in out.splitlines():
                if "->" in line or "up-to-date" in line:
                    log("  " + line.strip())
            return True
        first = out.splitlines()[0][:110] if out else "(无输出)"
        log("    失败: %s" % first)
        if "rejected" in out:
            log("    ⚠️ 远程有新提交，需先 fetch + rebase")
            return False
        time.sleep(2)
    return False


def try_local_proxy(remote, branch):
    """优先使用本机代理（Clash / Mihomo 等）——通常比裸连稳定得多"""
    alive = [p for p in PROXY_PORTS if port_open(p)]
    if not alive:
        return False
    log("\n=== 检测到本机代理端口: %s ===" % ", ".join(str(p) for p in alive))
    for p in alive:
        log("  经 127.0.0.1:%d 推送 …" % p)
        if git_push_with(proxy=p, remote=remote, branch=branch):
            log("✅ 推送成功（经本机代理 %d）" % p)
            return True
    return False


def try_push(ip, remote, branch):
    px = Proxy(ip)
    time.sleep(0.4)
    env = dict(os.environ)
    env["GIT_TERMINAL_PROMPT"] = "0"
    cmd = [
        "git",
        "-c", "http.sslBackend=openssl",
        "-c", "http.version=HTTP/1.1",
        "-c", "http.proxy=http://127.0.0.1:%d" % px.port,
        "-c", "http.postBuffer=524288000",
        "push", remote, branch,
    ]
    try:
        for _ in range(2):
            r = subprocess.run(cmd, cwd=ROOT, capture_output=True, timeout=400, env=env)
            out = (r.stdout + r.stderr).decode("utf-8", "replace").strip()
            ok = (r.returncode == 0 and "rejected" not in out
                  and ("-> " in out or "up-to-date" in out))
            if ok:
                for line in out.splitlines():
                    if "->" in line or "up-to-date" in line:
                        log("  " + line.strip())
                return True
            first = out.splitlines()[0][:110] if out else "(无输出)"
            if "rejected" in out:
                log("    ⚠️ 远程有新提交，需先 fetch + rebase")
            log("    失败: %s" % first)
            time.sleep(2)
    finally:
        px.close()
    return False


def main():
    dry = "--dry-run" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    remote = args[0] if args else "origin"
    branch = args[1] if len(args) > 1 else "main"

    # 优先走本机代理（有 Clash 时基本一次成功）
    if try_local_proxy(remote, branch):
        return 0
    log("\n本机代理不可用，回退到「逐个 IP 试推」…")

    ips = pick_ips()
    if not ips:
        log("\n❌ 没有可用 IP。稍后重试或换网络。")
        return 2
    log("\n可用 IP %d 个: %s" % (len(ips), ", ".join(ips)))
    if dry:
        log("（--dry-run，不执行推送）")
        return 0

    for ip in ips:
        log("\n=== 尝试穿透 %s ===" % ip)
        if try_push(ip, remote, branch):
            log("✅ 推送成功（经 %s）" % ip)
            return 0
    log("\n❌ 所有可用 IP 都未能完成推送。网络可能在抖动，稍后重跑本脚本。")
    return 1


if __name__ == "__main__":
    sys.exit(main())
