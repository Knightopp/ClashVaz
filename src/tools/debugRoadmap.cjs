const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function debugRoadmap() {
  const chromeProcess = spawn(chromePath, ['--headless=new', '--remote-debugging-port=9229', 'about:blank']);
  await new Promise(r => setTimeout(r, 1500));
  const listRes = await fetch('http://localhost:9229/json/list');
  const tabs = await listRes.json();
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const send = (method, params = {}) => new Promise(res => {
    const curId = id++;
    const handler = (ev) => {
      const d = JSON.parse(ev.data);
      if (d.id === curId) { ws.removeEventListener('message', handler); res(d.result); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:3000' });
  await new Promise(r => setTimeout(r, 2500));

  const expr = `
    (() => {
      try {
        const p = allProgressions.find(x => x.townHall === selectedCalcTargetTH);
        const profile = currentVillageProfile;
        const villageBuildings = profile?.buildings || [];
        const hasP = !!p;
        const pBldgsLen = p?.buildings?.length;
        
        let error = null;
        try {
          renderMaxingRoadmap(18);
        } catch (e) {
          error = e.stack;
        }

        const rowsAfter = document.querySelectorAll('#roadmap-table-body tr').length;

        return JSON.stringify({
          selectedCalcTargetTH,
          allProgressionsLen: allProgressions?.length,
          allBuildingsLen: allBuildings?.length,
          hasP,
          pBldgsLen,
          error,
          rowsAfter,
          hasBody: !!document.getElementById('roadmap-table-body')
        });
      } catch (err) {
        return JSON.stringify({ topError: err.stack });
      }
    })()
  `;

  const evalRes = await send('Runtime.evaluate', { expression: expr });
  console.log('Roadmap debug state:', evalRes.result.value);
  ws.close();
  chromeProcess.kill();
}

debugRoadmap();
