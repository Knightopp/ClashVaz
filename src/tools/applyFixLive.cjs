const { execSync } = require('child_process');

async function run() {
  const adb = `${process.env.LOCALAPPDATA}\\Android\\Sdk\\platform-tools\\adb.exe`;
  const pid = execSync(`"${adb}" -s 0G64C311262002F7 shell pidof com.vazoclash.tracker`).toString().trim();
  execSync(`"${adb}" -s 0G64C311262002F7 forward tcp:9222 localabstract:webview_devtools_remote_${pid}`);

  const listRes = await fetch('http://localhost:9222/json/list');
  const tabs = await listRes.json();
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  function evalCode(expr) {
    return new Promise(res => {
      ws.addEventListener('message', function h(e) {
        const d = JSON.parse(e.data);
        if (d.id === 1) {
          ws.removeEventListener('message', h);
          res(d.result?.result?.value);
        }
      });
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
    });
  }

  const result = await evalCode(`
    (() => {
      const style = document.createElement("style");
      style.textContent = "html, body { overflow-x: hidden !important; max-width: 100% !important; width: 100% !important; } .app-frame { max-width: 100% !important; width: 100% !important; min-width: 0 !important; overflow-x: hidden !important; } .center-content { max-width: 100% !important; width: 100% !important; min-width: 0 !important; overflow-x: hidden !important; } .timeline-container-card { max-width: 100% !important; width: 100% !important; min-width: 0 !important; } .timeline-scroll-wrap { width: 100% !important; max-width: 100% !important; min-width: 0 !important; overflow-x: auto !important; }";
      document.head.appendChild(style);
      return { winW: window.innerWidth, bodyW: document.body.offsetWidth, scrollW: document.documentElement.scrollWidth };
    })()
  `);

  console.log('Result after fix:', JSON.stringify(result, null, 2));
  ws.close();
}
run().catch(console.error);
