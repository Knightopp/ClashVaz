async function test() {
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
      ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
    });
  }

  const domInfo = await evalCode(`
    (() => {
      const heroesGrid = document.getElementById('village-heroes-grid');
      const th18Banner = document.getElementById('banner-th-img');
      const progTiers = document.getElementById('th-progression-tiers-container');
      
      return {
        allProgressionsLen: (window.allProgressions || []).length,
        hasOfficialData: !!window.OFFICIAL_SC_DATA,
        thImageMapKeys: Object.keys(window.thImageMap || {}),
        currentTH: window.currentTH,
        bannerImgSrc: th18Banner ? th18Banner.src : null,
        heroesGridHtml: heroesGrid ? heroesGrid.innerHTML.substring(0, 500) : null,
        progTiersCount: progTiers ? progTiers.children.length : 0,
        consoleErrors: window.__caughtErrors || []
      };
    })()
  `);

  console.log('DOM Info from phone:\n', JSON.stringify(domInfo, null, 2));

  // Also query network / resource timings
  const resources = await evalCode(`
    performance.getEntriesByType('resource').map(r => ({
      name: r.name,
      initiatorType: r.initiatorType,
      duration: r.duration
    }))
  `);
  console.log('Resources loaded on phone:\n', JSON.stringify(resources, null, 2));

  ws.close();
}
test();
