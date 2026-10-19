# -*- coding: utf-8 -*-
"""本地 CONNECT 代理：把发往 github.com:443 的连接，转发到可用的 GitHub IP
   背景：DNS 解析给 github.com 的 IP（20.205.243.166）被单独封锁，
        但 GitHub 其他前置 IP（140.82.112.3 等）均可正常访问。
   用法：
     1) 启动本代理：python tools/git_proxy.py 8899
     2) push：git -c http.proxy=http://127.0.0.1:8899 push origin main
"""
import io, sys, os, socket, threading, select

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8899
# 可选：直接指定上游 IP，跳过自动挑选
FORCE_UPSTREAM = sys.argv[2] if len(sys.argv) > 2 else None

# 候选 GitHub 前置 IP（2026-10-19 实测可用：140.82.116.4 / 20.207.73.82）
CANDIDATES = [
    ("140.82.116.4", 443),
    ("20.207.73.82", 443),
    ("140.82.112.3", 443),
    ("140.82.113.3", 443),
    ("140.82.114.3", 443),
    ("140.82.116.3", 443),
    ("140.82.121.3", 443),
    ("20.27.177.113", 443),
    ("20.200.245.247", 443),
    ("20.201.28.151", 443),
    ("4.237.22.38", 443),
]


def log(*a):
    print(*a, flush=True)


def pick_target():
    """依次尝试候选 IP，返回第一个能建立 TCP 连接的（可用第二个参数强制指定）"""
    if FORCE_UPSTREAM:
        try:
            s = socket.create_connection((FORCE_UPSTREAM, 443), timeout=5)
            s.close()
            log("  ✔ 使用指定上游: %s:443" % FORCE_UPSTREAM)
            return FORCE_UPSTREAM, 443
        except Exception as e:
            log("  ✘ 指定上游 %s 不可用（%s），改为自动挑选" % (FORCE_UPSTREAM, type(e).__name__))
    for ip, port in CANDIDATES:
        try:
            s = socket.create_connection((ip, port), timeout=4)
            s.close()
            log("  ✔ 选中上游: %s:%d" % (ip, port))
            return ip, port
        except Exception as e:
            log("  ✘ %s:%d 不可用（%s）" % (ip, port, type(e).__name__))
    return None


def pipe(a, b):
    """双向转发"""
    try:
        while True:
            r, _, _ = select.select([a, b], [], [], 60)
            if not r:
                break
            for s in r:
                data = s.recv(65536)
                if not data:
                    return
                (b if s is a else a).sendall(data)
    except Exception:
        pass


def handle(client, up_ip, up_port):
    upstream = None
    try:
        client.settimeout(20)
        # 读 CONNECT 请求头
        buf = b""
        while b"\r\n\r\n" not in buf:
            chunk = client.recv(4096)
            if not chunk:
                return
            buf += chunk
            if len(buf) > 65536:
                return
        line = buf.split(b"\r\n", 1)[0].decode("latin1", "replace")
        method = line.split(" ")[0].upper()
        if method != "CONNECT":
            client.sendall(b"HTTP/1.1 405 Method Not Allowed\r\n\r\n")
            return
        log("  CONNECT %s" % line)
        # 连接上游（无视请求里的目标域名，直接连我们选定的 IP）
        upstream = socket.create_connection((up_ip, up_port), timeout=10)
        upstream.settimeout(None)
        client.sendall(b"HTTP/1.1 200 Connection Established\r\n\r\n")
        client.settimeout(None)
        pipe(client, upstream)
    except Exception as e:
        log("  连接处理异常: %s" % e)
    finally:
        for s in (client, upstream):
            try:
                if s:
                    s.close()
            except Exception:
                pass


def main():
    log("=== 本地 GitHub 转发代理 ===")
    log("正在挑选可用上游 IP …")
    target = pick_target()
    if not target:
        log("❌ 没有可用的上游 IP，退出")
        return
    up_ip, up_port = target

    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(("127.0.0.1", PORT))
    srv.listen(16)
    log("代理已启动: http://127.0.0.1:%d  →  %s:%d" % (PORT, up_ip, up_port))
    log("用法: git -c http.proxy=http://127.0.0.1:%d push origin main" % PORT)
    log("等待连接…")
    try:
        while True:
            client, addr = srv.accept()
            threading.Thread(target=handle, args=(client, up_ip, up_port), daemon=True).start()
    except KeyboardInterrupt:
        pass
    finally:
        srv.close()


if __name__ == "__main__":
    main()
