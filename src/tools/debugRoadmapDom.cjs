const { spawn } = require('child_process');

async function test() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=9235', 'http://localhost:3000']);
  await new Promise(r => setTimeout(r, 2000));
  
  try {
    const listRes = await fetch('http://localhost:9235/json/list');
    const tabs = await listRes.json();
    const wsUrl = tabs[0]?.webSocketDebuggerUrl;
    const ws = new WebSocket(wsUrl);
    await new Promise(r => ws.onopen = r);
    
    let msgId = 1;
    function evalCode(expr) {
      return new Promise(res => {
        const id = msgId++;
        ws.onmessage = (e) => {
          const d = JSON.parse(e.data);
          if (d.id === id) res(d.result?.result?.value);
        };
        ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
      });
    }

    await evalCode('filterRoadmap("Defense")');
    const defenseRows = await evalCode(`
      Array.from(document.querySelectorAll('#roadmap-table-body tr')).slice(0, 15).map(tr => {
        const tds = tr.querySelectorAll('td');
        return {
          name: tds[0]?.textContent.replace(/\\s+/g, ' ').trim(),
          curLvl: tds[2]?.textContent.trim(),
          maxLvl: tds[3]?.textContent.trim(),
          levelsLeft: tds[4]?.textContent.trim(),
          time: tds[5]?.textContent.trim(),
          progress: tds[6]?.textContent.trim(),
          status: tds[7]?.textContent.trim()
        };
      })
    `);
    console.log('Sample 15 Defenses with Building Quantities:');
    console.table(defenseRows);

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}
test();
