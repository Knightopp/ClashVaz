const { execSync } = require('child_process');

async function test() {
  const adb = `${process.env.LOCALAPPDATA}\\Android\\Sdk\\platform-tools\\adb.exe`;
  const pid = execSync(`"${adb}" -s 0G64C311262002F7 shell pidof com.vazoclash.tracker`).toString().trim();
  execSync(`"${adb}" -s 0G64C311262002F7 forward tcp:9222 localabstract:webview_devtools_remote_${pid}`);

  const listRes = await fetch('http://localhost:9222/json/list');
  const tabs = await listRes.json();
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  function evalCode(expr) {
    return new Promise(res => {
      let id = Math.floor(Math.random() * 100000);
      function h(e) {
        const d = JSON.parse(e.data);
        if (d.id === id) {
          ws.removeEventListener('message', h);
          res(d.result?.result?.value);
        }
      }
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true, awaitPromise: true } }));
    });
  }

  const res = await evalCode(`
    (async () => {
      try {
        const testUrls = [
          'https://static.wikia.nocookie.net/clashofclans/images/e/e5/Wizard_Tower1.png/revision/latest',
          'https://assets.clashk.ing/troops/barbarian/icon.webp',
          'https://assets.clashk.ing/pets/spirit_fox/icon.webp',
          'https://static.wikia.nocookie.net/clashofclans/images/9/90/X-Bow1_Ground.png/revision/latest'
        ];
        const results = [];
        for (const url of testUrls) {
          const r = await fetch('/api/proxy-image?url=' + encodeURIComponent(url));
          const blob = await r.blob();
          results.push({ url: url.slice(0, 50), status: r.status, ok: r.ok, size: blob.size, type: blob.type });
        }
        return results;
      } catch (err) {
        return { error: err.message };
      }
    })()
  `);

  console.log('Proxy test results:', JSON.stringify(res, null, 2));
  ws.close();
}

test().catch(console.error);
