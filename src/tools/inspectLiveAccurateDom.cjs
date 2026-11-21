const { spawn } = require('child_process');

async function check() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=9228', 'http://localhost:3000']);
  await new Promise(r => setTimeout(r, 2000));
  
  try {
    const listRes = await fetch('http://localhost:9228/json/list');
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

    // 1. Check TH Tiers
    const thTiers = await evalCode(`
      Array.from(document.querySelectorAll('#th-tiers-grid .obsidian-card')).map(c => ({
        title: c.querySelector('.card-title-light')?.textContent,
        badge: c.querySelector('.calc-time-badge')?.textContent,
        struct: c.querySelector('.th-calc-breakdown .calc-metric-row:nth-child(1) .calc-metric-val')?.textContent,
        heroes: c.querySelector('.th-calc-breakdown .calc-metric-row:nth-child(2) .calc-metric-val')?.textContent,
        lab: c.querySelector('.th-calc-breakdown .calc-metric-row:nth-child(3) .calc-metric-val')?.textContent
      }))
    `);
    console.log('TH Tiers in live DOM:');
    console.table(thTiers);

    // 2. Check Heroes tab in Roadmap
    await evalCode(`filterRoadmap('Hero')`);
    const heroRows = await evalCode(`
      Array.from(document.querySelectorAll('#maxing-roadmap-tbody tr')).map(tr => {
        const tds = tr.querySelectorAll('td');
        return {
          name: tds[0]?.textContent.trim(),
          category: tds[1]?.textContent.trim(),
          curLvl: tds[2]?.textContent.trim(),
          maxLvl: tds[3]?.textContent.trim(),
          levelsLeft: tds[4]?.textContent.trim(),
          time: tds[5]?.textContent.trim(),
          progress: tds[6]?.textContent.trim(),
          status: tds[7]?.textContent.trim()
        };
      })
    `);
    console.log('Heroes in Roadmap table:');
    console.table(heroRows);

    // 3. Check Research tab in Roadmap
    await evalCode(`filterRoadmap('Research')`);
    const researchRows = await evalCode(`
      Array.from(document.querySelectorAll('#maxing-roadmap-tbody tr')).slice(0, 10).map(tr => {
        const tds = tr.querySelectorAll('td');
        return {
          name: tds[0]?.textContent.trim(),
          category: tds[1]?.textContent.trim(),
          curLvl: tds[2]?.textContent.trim(),
          maxLvl: tds[3]?.textContent.trim(),
          levelsLeft: tds[4]?.textContent.trim(),
          time: tds[5]?.textContent.trim(),
          progress: tds[6]?.textContent.trim(),
          status: tds[7]?.textContent.trim()
        };
      })
    `);
    console.log('Sample 10 items in Research table:');
    console.table(researchRows);

    // 4. Check Dedicated Heroes Section
    const heroCards = await evalCode(`
      Array.from(document.querySelectorAll('#village-heroes-grid .hero-card')).map(c => ({
        name: c.querySelector('.hero-name')?.textContent,
        level: c.querySelector('.hero-level-txt')?.textContent,
        status: c.querySelector('.hero-status-pill')?.textContent.trim()
      }))
    `);
    console.log('Village Heroes Cards:');
    console.table(heroCards);

  } catch (err) {
    console.error('Error during inspection:', err);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}
check();
