#!/usr/bin/env python3
"""Zip the extension for the Chrome Web Store (excludes dev files)."""
import json, os, zipfile, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
version = json.load(open(root / "manifest.json"))["version"]
dist = root / "dist"; dist.mkdir(exist_ok=True)
out = dist / f"wg-config-gen-{version}.zip"
skip_dirs = {".git", "dist", "store", "tools", "node_modules"}
skip_files = {"README.md", "PRIVACY.md", ".gitignore", "icon-1024.png"}
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for p in root.rglob("*"):
        rel = p.relative_to(root)
        if p.is_dir() or rel.parts[0] in skip_dirs or p.name in skip_files:
            continue
        z.write(p, str(rel))
print(out, out.stat().st_size, "bytes")
