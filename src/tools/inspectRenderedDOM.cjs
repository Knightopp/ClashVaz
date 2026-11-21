const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function checkDOM() {
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 1500));
  const listRes = await fetch('http://localhost:9227/json/list');
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
      const heroes = Array.from(document.querySelectorAll('#village-heroes-grid .hero-card')).map(c => ({
        name: c.querySelector('.hero-name')?.textContent,
        level: c.querySelector('.hero-level-txt')?.textContent,
        status: c.querySelector('.hero-status-pill')?.textContent?.trim()
      }));
      const tiers = Array.from(document.querySelectorAll('#th-tiers-grid .obsidian-card')).map(c => ({
        title: c.querySelector('.card-title-light')?.textContent,
        tag: c.querySelector('.th-tier-tag')?.textContent,
        badge: c.querySelector('.calc-time-badge')?.textContent,
        metrics: Array.from(c.querySelectorAll('.calc-metric-row')).map(m => m.textContent.replace(/\\s+/g, ' ').trim())
      }));
      const upgrades = Array.from(document.querySelectorAll('.timeline-upgrade-capsule')).map(u => ({
        title: u.querySelector('.timeline-upgrade-title')?.textContent,
        timer: u.querySelector('.timeline-upgrade-timer-pill')?.textContent,
        style: u.getAttribute('style')
      }));
      const roadmapRows = document.querySelectorAll('#roadmap-table-body tr').length;
      const roadmapSample = Array.from(document.querySelectorAll('#roadmap-table-body tr')).slice(0, 5).map(r => 
        Array.from(r.querySelectorAll('td')).map(td => td.textContent.replace(/\\s+/g, ' ').trim())
      );
      return JSON.stringify({ heroes, tiers, upgrades, roadmapRows, roadmapSample });
    })()
  `;

  const evalRes = await send('Runtime.evaluate', { expression: expr });
  const parsed = JSON.parse(evalRes.result.value);

  console.log('=== HEROES (' + parsed.heroes.length + ') ===');
  console.log(parsed.heroes);
  console.log('=== TIERS (' + parsed.tiers.length + ') ===');
  console.log(parsed.tiers);
  console.log('=== TIMELINE UPGRADE CAPSULES (' + parsed.upgrades.length + ') ===');
  console.log(parsed.upgrades);
  console.log('=== ROADMAP ROWS: ' + parsed.roadmapRows + ' ===');
  console.log('Roadmap sample:', parsed.roadmapSample);

  ws.close();
  chromeProcess.kill();
}

checkDOM();
