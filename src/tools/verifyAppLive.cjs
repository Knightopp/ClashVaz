const { execSync } = require('child_process');
const fs = require('fs');

async function test() {
  const adb = `${process.env.LOCALAPPDATA}\\Android\\Sdk\\platform-tools\\adb.exe`;
  execSync(`"${adb}" -s 0G64C311262002F7 shell input keyevent KEYCODE_WAKEUP`);
  await new Promise(r => setTimeout(r, 1000));

  const pid = execSync(`"${adb}" -s 0G64C311262002F7 shell pidof com.vazoclash.tracker`).toString().trim();
  console.log('App PID:', pid);
  execSync(`"${adb}" -s 0G64C311262002F7 forward tcp:9222 localabstract:webview_devtools_remote_${pid}`);

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
      ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true, awaitPromise: true } }));
    });
  }

  // 1. Check initial layout & overflow
  const initialCheck = await evalCode(`
    (() => {
      const winW = window.innerWidth;
      const scrollW = document.documentElement.scrollWidth;
      const bodyW = document.body.offsetWidth;
      return { winW, scrollW, bodyW, hasOverflow: scrollW > winW };
    })()
  `);
  console.log('Layout & Overflow Check:', initialCheck);

  // 2. Import latest_user_export.json with custom name 'Abhi Main TH18'
  const userJson = fs.readFileSync('./data/latest_user_export.json', 'utf8');
  const importResult = await evalCode(`
    (() => {
      const raw = ${JSON.stringify(userJson)};
      const parsed = JSON.parse(raw);
      const profile = parseVillageExportClientSide(parsed);
      saveOrUpdateAccount('Abhi Main TH18', profile);

      currentTH = profile.townHallLevel || 18;
      renderDashboard();
      renderTownHallPills();
      renderBuildingsExplorer();
      renderMyVillage();
      renderTimelineUpgrades(profile);
      updateProfileDisplay();

      const activeAcc = getActiveAccount();
      const heroes = Array.from(document.querySelectorAll('.hero-card')).map(c => ({
        name: c.querySelector('.hero-name')?.textContent,
        level: c.querySelector('.hero-level-txt')?.textContent?.trim()
      }));

      const topChipName = document.getElementById('mobile-chip-th')?.textContent;
      const upgrades = profile.activeUpgrades.map(u => ({
        name: u.name,
        target: u.targetLevel,
        timerSec: u.timerSeconds
      }));

      return {
        activeAccountName: activeAcc?.name,
        topChipName: topChipName,
        townHall: profile.townHallLevel,
        buildingsCount: profile.totalBuildings,
        activeUpgradesCount: profile.activeUpgrades.length,
        upgradesSample: upgrades.slice(0, 6),
        heroesSample: heroes
      };
    })()
  `);
  console.log('Import & Active Account Result:\n', JSON.stringify(importResult, null, 2));

  // 3. Add second account 'Mini TH16' and verify multi-account switching
  const multiAccResult = await evalCode(`
    (() => {
      const miniProfile = JSON.parse(JSON.stringify(currentVillageProfile));
      miniProfile.townHallLevel = 16;
      miniProfile.tag = '#MINI16';
      miniProfile.playerName = 'Mini TH16';

      let accounts = getSavedAccounts();
      const newAcc = {
        id: 'acc_mini_' + Date.now(),
        name: 'Mini TH16',
        tag: '#MINI16',
        townHallLevel: 16,
        profile: miniProfile,
        createdAt: new Date().toISOString()
      };
      accounts.push(newAcc);
      saveAccounts(accounts);

      const allAccounts = getSavedAccounts().map(a => ({ id: a.id, name: a.name, th: a.townHallLevel }));
      return { totalAccounts: accounts.length, accounts: allAccounts };
    })()
  `);
  console.log('Multi-Account Setup:\n', JSON.stringify(multiAccResult, null, 2));

  // 4. Test switching accounts back to 'Abhi Main TH18'
  const switchResult = await evalCode(`
    (() => {
      const accounts = getSavedAccounts();
      const main = accounts.find(a => a.name === 'Abhi Main TH18');
      if (main) switchAccount(main.id);
      return {
        activeAccount: getActiveAccount()?.name,
        currentTH: currentVillageProfile.townHallLevel,
        chipName: document.getElementById('mobile-chip-th')?.textContent
      };
    })()
  `);
  console.log('Switch Account Result:\n', JSON.stringify(switchResult, null, 2));

  ws.close();

  // 5. Take phone screenshot and save to brain artifacts
  const screenshotPath = 'C:\\Users\\ABHIRAM C S\\.gemini\\antigravity\\brain\\09782b43-a4f3-4da4-a771-6720f56ad2c9\\vazoclash_multiacc_verified.png';
  execSync(`"${adb}" -s 0G64C311262002F7 shell screencap -p /sdcard/vazoclash_screen.png`);
  execSync(`"${adb}" -s 0G64C311262002F7 pull /sdcard/vazoclash_screen.png "${screenshotPath}"`);
  console.log('Screenshot saved to:', screenshotPath);
}

test().catch(console.error);
