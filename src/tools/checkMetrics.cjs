const { execSync } = require('child_process');

async function test() {
  const adb = `${process.env.LOCALAPPDATA}\\Android\\Sdk\\platform-tools\\adb.exe`;
  const pid = execSync(`"${adb}" -s 0G64C311262002F7 shell pidof com.vazoclash.tracker`).toString().trim();
  execSync(`"${adb}" -s 0G64C311262002F7 forward tcp:9222 localabstract:webview_devtools_remote_${pid}`);

  const res = await fetch('http://localhost:9222/json/list');
  const tabs = await res.json();
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  function evalCode(expr) {
    return new Promise(res => {
      let id = 123;
      ws.onmessage = e => {
        const d = JSON.parse(e.data);
        if (d.id === id) res(d.result?.result?.value);
      };
      ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
    });
  }
  const info = await evalCode(`JSON.stringify({
    windowW: window.innerWidth,
    docW: document.documentElement.clientWidth,
    scrollW: document.documentElement.scrollWidth,
    bodyScrollW: document.body.scrollWidth,
    bodyClientW: document.body.clientWidth
  })`);
  console.log('Viewport metrics:', JSON.parse(info));
  ws.close();
}
test();
