const { spawn } = require('child_process');

async function test() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=9242', 'http://localhost:3000']);
  await new Promise(r => setTimeout(r, 2000));
  
  try {
    const listRes = await fetch('http://localhost:9242/json/list');
    const tabs = await listRes.json();
    const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    
    let msgId = 1;
    function evalCode(expr) {
      return new Promise(res => {
        const id = msgId++;
        ws.onmessage = (e) => {
          const d = JSON.parse(e.data);
          if (d.id === id) {
            if (d.result?.exceptionDetails) {
              console.error('Eval Exception:', d.result.exceptionDetails);
            }
            res(d.result?.result?.value);
          }
        };
        ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
      });
    }

    const debugInfo = await evalCode(`
      (() => {
        const targetTH = selectedCalcTargetTH;
        const res = {
          targetTH,
          hasOfficialData: !!window.OFFICIAL_SC_DATA,
          heroesCount: window.OFFICIAL_SC_DATA?.heroes?.length,
          allProgressionsLen: allProgressions.length,
          foundProg: !!allProgressions.find(x => x.townHall === targetTH),
          profile: !!currentVillageProfile,
          rawHeroesLen: currentVillageProfile?.heroes?.length
        };
        return res;
      })()
    `);
    console.log('Debug Info:', debugInfo);

    // Filter by Hero
    await evalCode('filterRoadmap("Hero")');
    const rows = await evalCode(`
      Array.from(document.querySelectorAll('#roadmap-table-body tr')).map(tr => {
        const tds = tr.querySelectorAll('td');
        return {
          name: tds[0]?.textContent.replace(/\\s+/g, ' ').trim(),
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
    console.log('Heroes in Roadmap:');
    console.table(rows);

    // Filter by Research
    await evalCode('filterRoadmap("Research")');
    const resRows = await evalCode(`
      Array.from(document.querySelectorAll('#roadmap-table-body tr')).slice(0, 10).map(tr => {
        const tds = tr.querySelectorAll('td');
        return {
          name: tds[0]?.textContent.replace(/\\s+/g, ' ').trim(),
          category: tds[1]?.textContent.trim(),
          curLvl: tds[2]?.textContent.trim(),
          maxLvl: tds[3]?.textContent.trim(),
          levelsLeft: tds[4]?.textContent.trim(),
          time: tds[5]?.textContent.trim()
        };
      })
    `);
    console.log('Sample 10 Research items in Roadmap:');
    console.table(resRows);

    // Filter by Pet
    await evalCode('filterRoadmap("Pet")');
    const petRows = await evalCode(`
      Array.from(document.querySelectorAll('#roadmap-table-body tr')).map(tr => {
        const tds = tr.querySelectorAll('td');
        return {
          name: tds[0]?.textContent.replace(/\\s+/g, ' ').trim(),
          curLvl: tds[2]?.textContent.trim(),
          maxLvl: tds[3]?.textContent.trim(),
          levelsLeft: tds[4]?.textContent.trim(),
          time: tds[5]?.textContent.trim()
        };
      })
    `);
    console.log('Pets in Roadmap:');
    console.table(petRows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}

test();
