const { execSync } = require('child_process');
const fs = require('fs');

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
      let id = Math.floor(Math.random() * 1000000);
      function h(e) {
        const d = JSON.parse(e.data);
        if (d.id === id) {
          ws.removeEventListener('message', h);
          if (d.result?.exceptionDetails) {
            console.error('Exception:', d.result.exceptionDetails);
          }
          res(d.result?.result?.value);
        }
      }
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
    });
  }

  const testJsonStr = fs.readFileSync('src/tools/testUserPastedJson.cjs', 'utf8');
  const startIdx = testJsonStr.indexOf('const userJson = ') + 17;
  const endIdx = testJsonStr.indexOf(';\n\n', startIdx);
  const userJsonObj = JSON.parse(testJsonStr.substring(startIdx, endIdx));

  const result = await evalCode(`
    (() => {
      try {
        const raw = ${JSON.stringify(userJsonObj)};
        const parsed = parseVillageExportClientSide(raw);
        if (!parsed) return { error: 'Failed parsing' };
        parsed.playerName = 'Chief ClashMaster';

        currentVillageProfile = parsed;
        currentTH = parsed.townHallLevel || 18;
        localStorage.setItem('vazoclash_village_profile', JSON.stringify(parsed));

        renderDashboard();
        renderTimelineUpgrades(currentVillageProfile);
        updateProfileDisplay();
        syncWithAndroidWidget(currentVillageProfile);

        const upgCards = Array.from(document.querySelectorAll('.upgrade-item-card')).map(card => {
          const img = card.querySelector('img')?.src;
          const alt = card.querySelector('img')?.alt;
          return { alt, img };
        });

        const timelineCapsules = Array.from(document.querySelectorAll('.timeline-upgrade-capsule')).map(cap => {
          const title = cap.title;
          const img = cap.querySelector('img')?.src;
          return { title, img };
        });

        const heroes = Array.from(document.querySelectorAll('.hero-card')).map(card => {
          const name = card.querySelector('.hero-name')?.textContent;
          const img = card.querySelector('.hero-avatar-img')?.src;
          const rect = card.getBoundingClientRect();
          return { name, img, right: Math.round(rect.right), winW: window.innerWidth };
        });

        return {
          upgCount: parsed.activeUpgrades.length,
          upgCards: upgCards.slice(0, 10),
          timelineCapsules: timelineCapsules.slice(0, 5),
          heroes
        };
      } catch (err) {
        return { error: err.message, stack: err.stack };
      }
    })()
  `);

  console.log('Live Result:', JSON.stringify(result, null, 2));
  ws.close();
}

run();
