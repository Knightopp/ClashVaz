const { execSync } = require('child_process');

async function check() {
  const adb = `${process.env.LOCALAPPDATA}\\Android\\Sdk\\platform-tools\\adb.exe`;
  execSync(`"${adb}" -s 0G64C311262002F7 shell input keyevent KEYCODE_WAKEUP`);
  execSync(`"${adb}" -s 0G64C311262002F7 shell am start -n com.vazoclash.tracker/.MainActivity`);
  await new Promise(r => setTimeout(r, 1000));

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
      const winW = window.innerWidth;
      const bodyW = document.body.offsetWidth;
      const scrollW = document.documentElement.scrollWidth;
      const overflowing = [];
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.right > winW + 2) {
          overflowing.push({
            tag: el.tagName,
            cls: (el.className || '').toString().slice(0, 50),
            id: el.id,
            right: Math.round(r.right),
            width: Math.round(r.width)
          });
        }
      });
      return { winW, bodyW, scrollW, overflowingCount: overflowing.length, overflowing: overflowing.slice(0, 15) };
    })()
  `);

  console.log('Overflow diagnosis on phone:\n', JSON.stringify(res, null, 2));
  ws.close();
}

check().catch(console.error);
