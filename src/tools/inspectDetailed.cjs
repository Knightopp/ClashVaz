const { execSync } = require('child_process');

async function test() {
  const adb = `${process.env.LOCALAPPDATA}\\Android\\Sdk\\platform-tools\\adb.exe`;
  const pid = execSync(`"${adb}" -s 0G64C311262002F7 shell pidof com.vazoclash.tracker`).toString().trim();
  console.log('PID:', pid);
  execSync(`"${adb}" -s 0G64C311262002F7 forward tcp:9222 localabstract:webview_devtools_remote_${pid}`);

  const listRes = await fetch('http://localhost:9222/json/list');
  const tabs = await listRes.json();
  const wsUrl = tabs[0].webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  function evalCode(expr) {
    return new Promise(res => {
      let id = Math.floor(Math.random() * 100000);
      function h(e) {
        const d = JSON.parse(e.data);
        if (d.id === id) {
          ws.removeEventListener('message', h);
          res(d.result?.result?.value);
        }
      }
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true, awaitPromise: true } }));
    });
  }

  const diagnosis = await evalCode(`
    (() => {
      // 1. Check images across the page
      const allImgs = Array.from(document.querySelectorAll('img')).map(img => {
        const rect = img.getBoundingClientRect();
        return {
          id: img.id,
          cls: img.className,
          alt: img.alt,
          src: img.src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          visible: rect.width > 0 && rect.height > 0
        };
      });

      // 2. Check upgrade calendar / timeline schedule
      const timelineUpgrades = Array.from(document.querySelectorAll('.timeline-upgrade-block, .timeline-schedule-block, .timeline-track-item')).map(el => {
        return {
          text: el.textContent.trim(),
          img: el.querySelector('img')?.src,
          cls: el.className
        };
      });

      // 3. Check mobile upgrades view
      const mobUpgradeItems = Array.from(document.querySelectorAll('.upgrade-item-card')).map(el => {
        return {
          title: el.querySelector('.upgrade-title')?.textContent,
          time: el.querySelector('.upgrade-time')?.textContent,
          img: el.querySelector('img')?.src
        };
      });

      // 4. Check overflowing elements outside the box
      const winW = window.innerWidth;
      const overflows = [];
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        // check horizontal overflow
        if (r.right > winW + 2) {
          overflows.push({ type: 'right_overflow', tag: el.tagName, cls: (el.className || '').toString().slice(0, 40), text: el.textContent?.slice(0, 30), right: Math.round(r.right), winW });
        }
        // check parent overflow (child wider or taller than parent where parent has overflow hidden)
        if (el.parentElement) {
          const pr = el.parentElement.getBoundingClientRect();
          const pStyle = window.getComputedStyle(el.parentElement);
          if (pStyle.overflow === 'hidden' && (r.right > pr.right + 2 || r.bottom > pr.bottom + 2)) {
            overflows.push({ type: 'parent_clip', tag: el.tagName, cls: (el.className || '').toString().slice(0, 40), parentCls: (el.parentElement.className || '').toString().slice(0, 40) });
          }
        }
      });

      // 5. Active Profile and Upgrades in currentVillageProfile
      const curProfile = window.currentVillageProfile;

      return {
        profileName: curProfile?.playerName,
        profileTH: curProfile?.townHallLevel,
        activeUpgradesCount: curProfile?.activeUpgrades?.length,
        activeUpgrades: curProfile?.activeUpgrades?.map(u => ({ name: u.name, targetLevel: u.targetLevel, image: u.image })),
        timelineUpgrades,
        mobUpgradeItems,
        brokenImgs: allImgs.filter(i => i.visible && i.naturalWidth === 0),
        cannonOrFallbackImgs: allImgs.filter(i => i.visible && (i.src.includes('Cannon_Home_Village') || i.src.includes('level-1.png') || i.src.includes('barbarian_king.webp'))),
        overflows: overflows.slice(0, 15)
      };
    })()
  `);

  console.log('Detailed Diagnosis:\n', JSON.stringify(diagnosis, null, 2));
  ws.close();
}

test().catch(console.error);
