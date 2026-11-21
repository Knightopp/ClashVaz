const { spawn } = require('child_process');

async function check() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=9227', 'http://localhost:3000']);
  await new Promise(r => setTimeout(r, 2000));
  
  try {
    const listRes = await fetch('http://localhost:9227/json/list');
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

    const capsuleStyles = await evalCode(`
      Array.from(document.querySelectorAll('.timeline-upgrade-capsule')).map(el => ({
        title: el.querySelector('.timeline-upgrade-title')?.textContent,
        timer: el.querySelector('.timeline-upgrade-timer-pill')?.textContent,
        left: el.style.left,
        width: el.style.width,
        imgSrc: el.querySelector('img')?.src
      }))
    `);
    console.log('Capsule styles in live DOM:');
    console.log(JSON.stringify(capsuleStyles, null, 2));

    const eagleInRoadmap = await evalCode(`
      Array.from(document.querySelectorAll('#maxing-roadmap-tbody tr')).map(tr => tr.innerText).filter(t => t.toLowerCase().includes('eagle'))
    `);
    console.log('Eagle Artillery in active roadmap table:');
    console.log(eagleInRoadmap);

    const thTiers = await evalCode(`
      Array.from(document.querySelectorAll('#th-tiers-grid .obsidian-card')).map(c => ({
        title: c.querySelector('.card-title-light')?.textContent,
        badge: c.querySelector('.calc-time-badge')?.textContent,
        struct: c.querySelector('.th-calc-breakdown .calc-metric-row:nth-child(1) .calc-metric-val')?.textContent,
        heroes: c.querySelector('.th-calc-breakdown .calc-metric-row:nth-child(2) .calc-metric-val')?.textContent
      }))
    `);
    console.log('TH Tiers in live DOM:');
    console.log(JSON.stringify(thTiers, null, 2));

  } catch (err) {
    console.error('Error during inspection:', err);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}
check();
