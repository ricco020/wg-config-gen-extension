// Key generation and config building. Pure functions, no network.
const WG = (() => {
  const b64 = (u8) => btoa(String.fromCharCode(...u8));

  async function keypair() {
    const kp = await crypto.subtle.generateKey({ name: "X25519" }, true, ["deriveBits"]);
    const pub = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey));
    const priv = pkcs8.slice(pkcs8.length - 32); // PKCS#8 for X25519 ends with the 32-byte scalar
    return { priv: b64(priv), pub: b64(pub) };
  }
  const psk = () => b64(crypto.getRandomValues(new Uint8Array(32)));

  function parseSubnet(s) {
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec(String(s).trim());
    if (!m) throw new Error("Subnet must look like 10.8.0.0/24");
    const o = m.slice(1, 5).map(Number), bits = Number(m[5]);
    if (o.some((x) => x > 255) || bits < 16 || bits > 29) throw new Error("Subnet prefix must be between /16 and /29");
    const base = ((o[0] << 24) >>> 0) + (o[1] << 16) + (o[2] << 8) + o[3];
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    const net = (base & mask) >>> 0;
    const size = 2 ** (32 - bits);
    const ip = (n) => [24, 16, 8, 0].map((sh) => (n >>> sh) & 255).join(".");
    return { bits, size, host: (i) => ip(net + i), cidr: `${ip(net)}/${bits}` };
  }

  async function build(o) {
    const sn = parseSubnet(o.subnet);
    if (o.peers + 2 > sn.size) throw new Error("Subnet too small for that many clients");
    const port = Number(o.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Port must be 1 to 65535");
    const endpoint = (o.endpoint.trim() || "YOUR_SERVER_IP") + ":" + port;
    const server = await keypair();
    const dns = o.dns === "10.8.0.1" ? sn.host(1) : o.dns;
    const allowed = o.route === "subnet" ? sn.cidr : o.route;
    const files = [];
    const serverPeers = [];
    for (let i = 1; i <= o.peers; i++) {
      const c = await keypair();
      const k = o.psk ? psk() : null;
      const addr = sn.host(i + 1);
      serverPeers.push(`\n[Peer]\n# client${i}\nPublicKey = ${c.pub}\n${k ? `PresharedKey = ${k}\n` : ""}AllowedIPs = ${addr}/32`);
      files.push({
        name: `client${i}.conf`,
        text: `[Interface]\n# client${i}\nPrivateKey = ${c.priv}\nAddress = ${addr}/${sn.bits}\nDNS = ${dns}\n\n[Peer]\nPublicKey = ${server.pub}\n${k ? `PresharedKey = ${k}\n` : ""}Endpoint = ${endpoint}\nAllowedIPs = ${allowed}\nPersistentKeepalive = 25\n`,
      });
    }
    const nat = "PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE\nPostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE\n# eth0 = your server's internet interface (check with: ip route show default)\n# Also enable forwarding: sysctl -w net.ipv4.ip_forward=1\n";
    files.unshift({
      name: "wg0.conf",
      text: `# Server: save as /etc/wireguard/wg0.conf, then: wg-quick up wg0\n[Interface]\nPrivateKey = ${server.priv}\nAddress = ${sn.host(1)}/${sn.bits}\nListenPort = ${port}\n${o.route === "subnet" ? "" : nat}${serverPeers.join("\n")}\n`,
    });
    return files;
  }
  return { keypair, build, parseSubnet };
})();
