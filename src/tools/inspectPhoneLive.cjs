const { execSync } = require('child_process');

async function test() {
  const adb = `${process.env.LOCALAPPDATA}\\Android\\Sdk\\platform-tools\\adb.exe`;
  const pid = execSync(`"${adb}" shell pidof com.vazoclash.tracker`).toString().trim();
  console.log('PID:', pid);
  execSync(`"${adb}" forward tcp:9222 localabstract:webview_devtools_remote_${pid}`);
  console.log('Port 9222 forwarded');

  const listRes = await fetch('http://localhost:9222/json/list');
  const tabs = await listRes.json();
  const wsUrl = tabs[0].webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  function evalCode(expr) {
    return new Promise(res => {
      const id = msgId++;
      const onMsg = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === id) {
          ws.removeEventListener('message', onMsg);
          res(d.result?.result?.value);
        }
      };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true, awaitPromise: true } }));
    });
  }

  const state = await evalCode(`
    (async () => {
      return {
        allProgressionsLen: (window.allProgressions || []).length,
        allBuildingsLen: (window.allBuildings || []).length,
        thImageMapKeys: Object.keys(window.thImageMap || {}),
        currentTH: window.currentTH,
        bannerSrc: document.getElementById('banner-th-img')?.src,
        bannerNaturalWidth: document.getElementById('banner-th-img')?.naturalWidth,
        bannerComplete: document.getElementById('banner-th-img')?.complete,
        heroesGridHtml: document.getElementById('village-heroes-grid')?.innerHTML?.trim(),
        heroCardsCount: document.querySelectorAll('.hero-card')?.length,
        progTiersCount: document.getElementById('th-progression-tiers-container')?.children?.length
      };
    })()
  `);

  console.log('Phone state:', JSON.stringify(state, null, 2));

  // Test proxy fetch of TH18 directly from inside webview
  const proxyTest = await evalCode(`
    (async () => {
      try {
        const url = '/api/proxy-image?url=' + encodeURIComponent('https://static.wikia.nocookie.net/clashofclans/images/7/76/Town_Hall18.png/revision/latest?cb=20251117162127');
        const res = await fetch(url);
        return { ok: res.ok, status: res.status, statusText: res.statusText, type: res.headers.get('content-type') };
      } catch (e) {
        return { error: e.message };
      }
    })()
  `);
  console.log('Proxy test from webview:', JSON.stringify(proxyTest, null, 2));

  ws.close();
}
test();
