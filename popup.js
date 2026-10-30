const $ = (id) => document.getElementById(id);
const SITE = "https://www.vpnsmith.com";
const utm = (c) => `utm_source=chrome-extension&utm_medium=wg-config-gen&utm_content=${c}`;
$("guide").href = `${SITE}/en/blog/self-host-vpn-contabo-wireguard-2026?${utm("guide")}`;
$("full").href = `${SITE}/en/tools/wireguard-config-generator?${utm("full-generator")}`;
$("vps").href = `${SITE}/go/contabo-vps-2y?src=ext-wg-gen`;

let files = [], cur = 0;

function show(i) {
  cur = i;
  $("conf").textContent = files[i].text;
  [...$("tabs").children].forEach((b, j) => b.setAttribute("aria-selected", String(j === i)));
}

$("f").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("err").hidden = true;
  try {
    files = await WG.build({
      endpoint: $("endpoint").value,
      port: $("port").value,
      peers: Math.max(1, Math.min(10, parseInt($("peers").value, 10) || 1)),
      subnet: $("subnet").value,
      dns: $("dns").value,
      route: $("route").value,
      psk: $("psk").checked,
    });
  } catch (err) {
    $("err").textContent = err.message || String(err);
    $("err").hidden = false;
    return;
  }
  $("tabs").replaceChildren(...files.map((f, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.role = "tab"; b.textContent = f.name;
    b.addEventListener("click", () => show(i));
    return b;
  }));
  show(0);
  $("out").hidden = false;
  $("go").textContent = "Generate new keys";
});

$("copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText(files[cur].text);
  $("copy").textContent = "Copied";
  setTimeout(() => ($("copy").textContent = "Copy"), 1200);
});

$("dl").addEventListener("click", () => {
  const url = URL.createObjectURL(new Blob([files[cur].text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url; a.download = files[cur].name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
