#!/usr/bin/env python3
"""Compose 1280x800 store screenshots + 440x280 tile from real popup captures (/tmp/s-*.png, 2x)."""
import pathlib
from PIL import Image, ImageDraw, ImageFont
root = pathlib.Path(__file__).resolve().parent.parent
out = root / "store" / "assets"
FB = "/home/lerer/Desktop/Play3rs/store/aso/fonts/SpaceGrotesk-Bold.ttf"
FM = "/home/lerer/Desktop/Play3rs/store/aso/fonts/SpaceGrotesk-Medium.ttf"
BG, INK, MUTED, RED, GREEN = (14, 17, 22), (238, 241, 245), (150, 158, 172), (200, 53, 46), (126, 226, 184)
icon = Image.open(root / "icons" / "icon-1024.png").convert("RGBA")

def shot(name, title, lines, src, box):
    im = Image.new("RGB", (1280, 800), BG); d = ImageDraw.Draw(im)
    im.paste(icon.resize((56, 56), Image.LANCZOS), (72, 72), icon.resize((56, 56), Image.LANCZOS))
    d.text((142, 84), "WG Config Gen", font=ImageFont.truetype(FB, 28), fill=INK)
    y = 200
    for t in title:
        d.text((72, y), t, font=ImageFont.truetype(FB, 54), fill=INK); y += 66
    y += 24
    for l in lines:
        d.rectangle([72, y + 12, 84, y + 24], fill=GREEN)
        d.text((100, y), l, font=ImageFont.truetype(FM, 26), fill=MUTED); y += 46
    pop = Image.open(src).convert("RGB").crop(box)
    h = 704; w = int(pop.width * h / pop.height)
    if w > 560: w = 560; h = int(pop.height * w / pop.width)
    pop = pop.resize((w, h), Image.LANCZOS)
    x0, y0 = 1280 - 64 - w, (800 - h) // 2
    d.rectangle([x0 - 2, y0 - 2, x0 + w + 1, y0 + h + 1], outline=(38, 45, 57), width=2)
    im.paste(pop, (x0, y0))
    im.save(out / name)

shot("01-generate.png", ["WireGuard configs,", "built in your browser"],
     ["Server wg0.conf + up to 10 clients", "Full or split tunnel, DNS presets", "No account, no permissions"],
     "/tmp/s-form.png", (0, 0, 800, 1200))
shot("02-client.png", ["Keys made on", "your device"],
     ["X25519 via Web Crypto", "Preshared key per client", "Copy or download each .conf"],
     "/tmp/s-client.png", (0, 800, 800, 1430))
shot("03-server.png", ["Server file", "ready for wg-quick"],
     ["Peers, addresses and NAT filled in", "Comments where you must check", "Nothing sent anywhere"],
     "/tmp/s-server.png", (0, 800, 800, 1430))
t = Image.new("RGB", (440, 280), BG); d = ImageDraw.Draw(t)
t.paste(icon.resize((96, 96), Image.LANCZOS), (40, 40), icon.resize((96, 96), Image.LANCZOS))
d.text((40, 160), "WireGuard configs", font=ImageFont.truetype(FB, 34), fill=INK)
d.text((40, 206), "Keys made on your device", font=ImageFont.truetype(FM, 22), fill=GREEN)
t.save(out / "tile-440x280.png")
print(sorted(p.name for p in out.iterdir()))
