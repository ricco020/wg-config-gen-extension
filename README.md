# Config Generator for WireGuard (Chrome extension)

Popup that builds a WireGuard server file (`wg0.conf`) and 1 to 10 client files with keys generated on the device (Web Crypto X25519). Manifest V3, zero permissions, zero network calls. Publisher: VPNSmith.

- `wg.js`: key generation and config building (pure functions).
- `popup.*`: UI. Links: vpnsmith guide and full generator (`utm_source=chrome-extension&utm_medium=wg-config-gen`), Contabo affiliate `/go/contabo-vps-2y?src=ext-wg-gen` (disclosed).
- `tools/pack.py`: zip for the Chrome Web Store into `dist/`.
- Tested 30/10/2026 in Chromium 1.0.0: 3 files generated, every public key matches its private key (Python `cryptography`), preshared keys identical on both sides, 0 page error.
