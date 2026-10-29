# -*- coding: utf-8 -*-
"""
把 _public_site 推送到公开仓库（GitHub Pages 用）

前置：
  1) 已在 GitHub 建好空仓库（public，无 README）
  2) 已把部署公钥加到该仓库的 Deploy keys，并勾 Allow write access

用法：
  python tools/publish_public.py --repo es2601-site
  python tools/publish_public.py --repo es2601-site --dry-run
"""
import argparse
import os
import subprocess
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PUB = r"D:\XJTUpack\大一\班委\ai\团日活动\_public_site"
KEY = os.path.expanduser(r"~\.ssh\es2601_public_pages")
OWNER = "EQmarks"


def run(cmd, cwd=PUB, env=None):
    e = dict(os.environ)
    e["GIT_SSH_COMMAND"] = 'ssh -i "%s" -o IdentitiesOnly=yes -o BatchMode=yes' % KEY
    if env:
        e.update(env)
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, env=e, timeout=600)
    return r.returncode, (r.stdout + r.stderr).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default="xjtu-es2601-web")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true", help="首次推送/替换既有历史时使用")
    a = ap.parse_args()

    if not os.path.isdir(os.path.join(PUB, ".git")):
        print("✘ 导出目录不是 git 仓库：%s" % PUB)
        return 1
    if not os.path.isfile(KEY):
        print("✘ 缺少部署私钥：%s" % KEY)
        return 1

    url = "git@github.com:%s/%s.git" % (OWNER, a.repo)
    print("目标仓库：%s" % url)

    # 分支统一成 main
    code, out = run(["git", "branch", "-M", "main"])
    print("分支：main")

    code, out = run(["git", "remote", "get-url", "origin"])
    if code != 0:
        code, out = run(["git", "remote", "add", "origin", url])
    else:
        code, out = run(["git", "remote", "set-url", "origin", url])
    print("remote：%s" % url)

    # 先验证认证与仓库可见性
    code, out = run(["git", "ls-remote", "--heads", "origin"])
    if code != 0:
        print("✘ 访问远程失败（仓库不存在 / 密钥没加 / 没勾 write access）：")
        print("  " + out.replace("\n", "\n  ")[:600])
        return 2
    print("✔ 远程可访问")

    if a.dry_run:
        print("（--dry-run，不推送）")
        return 0

    print("\n推送 main …")
    push_cmd = ["git", "push", "-u", "origin", "main"]
    push_cmd.append("--force" if a.force else "--force-with-lease")
    code, out = run(push_cmd)
    print("  " + out.replace("\n", "\n  ")[:800])
    if code != 0:
        return 3

    print("\n推送 tag …")
    code, out = run(["git", "push", "origin", "--tags"])
    print("  " + out.replace("\n", "\n  ")[:400])

    code, out = run(["git", "ls-remote", "--heads", "origin", "main"])
    print("\n远程 main：%s" % out)

    print("""
下一步（GitHub 网页）：
  1. Settings → Pages → Source: Deploy from a branch → main / (root) → Save
  2. 等 1 分钟，访问 https://%s.github.io/%s/
  3. Custom domain 填 xjtu-es2601.com → Save → 等证书 → 勾 Enforce HTTPS
""" % (OWNER.lower(), a.repo))
    return 0


if __name__ == "__main__":
    sys.exit(main())
