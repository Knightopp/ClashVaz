const { execSync } = require('child_process');

async function run() {
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

  const check = await evalCode(`JSON.stringify({
    leftSidebarDisplay: window.getComputedStyle(document.querySelector('.left-sidebar')).display,
    centerContentDisplay: window.getComputedStyle(document.querySelector('.center-content')).display,
    rightRailDisplay: window.getComputedStyle(document.querySelector('.right-rail')).display,
    rightRailRect: document.querySelector('.right-rail').getBoundingClientRect(),
    centerContentRect: document.querySelector('.center-content').getBoundingClientRect()
  })`);
  console.log('Layout check:', JSON.parse(check));
  ws.close();
}
run();
