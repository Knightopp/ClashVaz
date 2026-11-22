const { execSync } = require('child_process');

async function test() {
  const adb = `${process.env.LOCALAPPDATA}\\Android\\Sdk\\platform-tools\\adb.exe`;
  const pid = execSync(`"${adb}" -s 0G64C311262002F7 shell pidof com.vazoclash.tracker`).toString().trim();
  console.log('PID:', pid);
  execSync(`"${adb}" -s 0G64C311262002F7 forward tcp:9222 localabstract:webview_devtools_remote_${pid}`);

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

  const res = await evalCode(`
    (() => {
      const banner = document.getElementById('banner-th-img');
      const heroes = Array.from(document.querySelectorAll('.hero-card')).map(card => {
        const name = card.querySelector('.hero-name')?.textContent;
        const img = card.querySelector('.hero-avatar-img')?.src;
        const naturalWidth = card.querySelector('.hero-avatar-img')?.naturalWidth;
        return { name, img, naturalWidth };
      });

      return {
        allProgressionsLength: allProgressions.length,
        allBuildingsLength: allBuildings.length,
        thImageMapCount: Object.keys(thImageMap).length,
        banner: {
          src: banner?.src,
          naturalWidth: banner?.naturalWidth,
          naturalHeight: banner?.naturalHeight,
          complete: banner?.complete
        },
        heroes
      };
    })()
  `);

  console.log('Live inspection on phone:\n', JSON.stringify(res, null, 2));
  ws.close();
}
test();
