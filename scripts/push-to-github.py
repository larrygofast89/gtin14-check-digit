#!/usr/bin/env python3
"""Push this checkout to GitHub through the REST API.

On the machine this repo was built on, `github.com:443` is unreachable, so
`git push` cannot be used. `api.github.com` is reachable, so this script
mirrors the tracked files with the git data API:

    blobs -> tree (base_tree kept) -> commit -> update refs/heads/main

Usage
    GITHUB_TOKEN=github_pat_xxx ./scripts/push-to-github.py "commit message"

The token needs, on the target repository:
    Contents        Read and write
    (Metadata       Read-only, granted automatically)
"""

from __future__ import annotations

import base64
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

API = "https://api.github.com"
REPO = os.environ.get("REPO", "larrygofast89/gtin14-check-digit")
BRANCH = os.environ.get("BRANCH", "main")


def token() -> str:
    value = os.environ.get("GITHUB_TOKEN", "").strip()
    if value:
        return value
    path = os.path.expanduser("~/.dsh/secrets/github.env")
    if os.path.exists(path):
        for line in open(path):
            if line.startswith("GITHUB_TOKEN="):
                return line.split("=", 1)[1].strip()
    sys.exit("GITHUB_TOKEN is not set and ~/.dsh/secrets/github.env has no GITHUB_TOKEN")


def call(method: str, path: str, payload: dict | None = None) -> dict:
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(API + path, data=data, method=method)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "gtin14-check-digit-push")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read() or b"{}")
    except urllib.error.HTTPError as error:
        sys.exit(f"{method} {path} failed: {error.code} {error.read().decode()}")


TOKEN = token()


def tracked_files() -> list[str]:
    out = subprocess.run(["git", "ls-files", "-z"], capture_output=True, check=True).stdout
    return [p for p in out.decode().split("\0") if p and os.path.isfile(p)]


def main() -> None:
    message = sys.argv[1] if len(sys.argv) > 1 else "chore: sync from local checkout"

    ref = call("GET", f"/repos/{REPO}/git/ref/heads/{BRANCH}")
    head = ref["object"]["sha"]
    base_tree = call("GET", f"/repos/{REPO}/git/commits/{head}")["tree"]["sha"]
    print(f"head {head[:10]} (tree {base_tree[:10]})")

    entries = []
    for path in tracked_files():
        content = base64.b64encode(open(path, "rb").read()).decode()
        blob = call("POST", f"/repos/{REPO}/git/blobs", {"content": content, "encoding": "base64"})
        entries.append({"path": path, "mode": "100644", "type": "blob", "sha": blob["sha"]})
        print(f"  blob {path}")

    tree = call("POST", f"/repos/{REPO}/git/trees", {"tree": entries, "base_tree": base_tree})
    commit = call(
        "POST",
        f"/repos/{REPO}/git/commits",
        {"message": message, "tree": tree["sha"], "parents": [head]},
    )
    call("PATCH", f"/repos/{REPO}/git/refs/heads/{BRANCH}", {"sha": commit["sha"]})
    print(f"pushed {commit['sha']} -> https://github.com/{REPO}")


if __name__ == "__main__":
    main()
