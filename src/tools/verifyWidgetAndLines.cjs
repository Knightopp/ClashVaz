const { execSync } = require('child_process');
const fs = require('fs');

async function main() {
  const adb = `${process.env.LOCALAPPDATA}\\Android\\Sdk\\platform-tools\\adb.exe`;
  
  // 1. Get PID and forward port
  const pid = execSync(`"${adb}" -s 0G64C311262002F7 shell pidof com.vazoclash.tracker`).toString().trim();
  console.log('App PID:', pid);
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

  // 2. Load sample user JSON and re-import
  const testJsonStr = fs.readFileSync('src/tools/testUserPastedJson.cjs', 'utf8');
  const startIdx = testJsonStr.indexOf('const userJson = ') + 17;
  const endIdx = testJsonStr.indexOf(';\n\n', startIdx);
  const userJsonObj = JSON.parse(testJsonStr.substring(startIdx, endIdx));

  const importResult = await evalCode(`
    (() => {
      try {
        const parsed = parseVillageExportClientSide(${JSON.stringify(userJsonObj)});
        if (!parsed) return { error: 'Failed parsing' };
        parsed.playerName = 'Chief ClashMaster';
        currentVillageProfile = parsed;
        currentTH = parsed.townHallLevel || 18;
        localStorage.setItem('vazoclash_village_profile', JSON.stringify(parsed));
        renderDashboard();
        renderTimelineUpgrades(currentVillageProfile);
        updateProfileDisplay();
        syncWithAndroidWidget(currentVillageProfile);
        return {
          upgCount: parsed.activeUpgrades.length,
          upgrades: parsed.activeUpgrades.map(u => ({
            name: u.name,
            currentLevel: u.currentLevel,
            targetLevel: u.targetLevel,
            timerSeconds: u.timerSeconds,
            durationSeconds: u.durationSeconds,
            imageUrl: u.imageUrl
          }))
        };
      } catch (e) {
        return { error: e.message, stack: e.stack };
      }
    })()
  `);

  console.log('Import result:', JSON.stringify(importResult, null, 2));

  // Switch to upgrades tab in webview
  await evalCode(`switchNav('upgrades')`);

  // Wait 1s
  await new Promise(r => setTimeout(r, 1000));

  // 3. Inspect Upgrades tab DOM to verify progress line & icons
  const domInspection = await evalCode(`
    (() => {
      const cards = Array.from(document.querySelectorAll('.upgrade-item-card'));
      return cards.map(c => {
        const title = c.querySelector('.upgrade-title')?.textContent?.trim();
        const time = c.querySelector('.upgrade-time')?.textContent?.trim();
        const img = c.querySelector('img')?.src;
        const progressLine = c.querySelector('div[style*="overflow:hidden"] div[style*="background:#06b6d4"]')?.style?.width;
        return { title, time, img, progressLine };
      });
    })()
  `);

  console.log('DOM cards count:', domInspection?.length);
  console.log('DOM sample card:', domInspection?.[0]);

  // 4. Inspect vazoclash_prefs.xml on Android device
  const prefsXml = execSync(`"${adb}" -s 0G64C311262002F7 shell run-as com.vazoclash.tracker cat shared_prefs/vazoclash_prefs.xml`).toString();
  console.log('Prefs XML on device:');
  console.log(prefsXml);

  // 5. Broadcast widget refresh to force provider update
  execSync(`"${adb}" -s 0G64C311262002F7 shell am broadcast -a com.vazoclash.tracker.ACTION_REFRESH_WIDGET`);
  console.log('Widget refresh broadcast sent.');

  // 6. Capture screenshot
  const artifactDir = "C:\\Users\\ABHIRAM C S\\.gemini\\antigravity\\brain\\09782b43-a4f3-4da4-a771-6720f56ad2c9";
  execSync(`"${adb}" -s 0G64C311262002F7 shell screencap -p /sdcard/screen_widget_test.png`);
  execSync(`"${adb}" -s 0G64C311262002F7 pull /sdcard/screen_widget_test.png "${artifactDir}\\vazoclash_widget_progress.png"`);
  console.log('Screenshot saved to artifact vazoclash_widget_progress.png');

  ws.close();
}

main().catch(console.error);
