const { execSync } = require('child_process');

async function test() {
  const adb = `${process.env.LOCALAPPDATA}\\Android\\Sdk\\platform-tools\\adb.exe`;
  const pid = execSync(`"${adb}" -s 0G64C311262002F7 shell pidof com.vazoclash.tracker`).toString().trim();
  console.log('PID:', pid);
  execSync(`"${adb}" -s 0G64C311262002F7 forward tcp:9222 localabstract:webview_devtools_remote_${pid}`);

  const listRes = await fetch('http://localhost:9222/json/list');
  const tabs = await listRes.json();
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
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

  const res = await evalCode(`
    (async () => {
      const hasSettingsModal = !!document.getElementById('settings-modal');
      const hasAndroidBridge = typeof window.Android !== 'undefined';
      const hasRequestPin = hasAndroidBridge && typeof window.Android.requestPinWidget === 'function';
      const isPinSupported = hasAndroidBridge && typeof window.Android.isWidgetPinningSupported === 'function' ? window.Android.isWidgetPinningSupported() : false;

      // Test parsing sample village JSON export offline
      const sampleExport = {
        tag: "#DEMO123",
        townHallLevel: 18,
        playerName: "Chief Test",
        totalBuildings: 95,
        totalTraps: 40,
        buildings: [
          { name: "Town Hall", level: 18, buildingId: "town-hall" },
          { name: "Wizard Tower", level: 16, timer: 3600 }
        ]
      };

      const preview = getClientSidePreview(sampleExport);
      const parsed = parseVillageExportClientSide(sampleExport);

      return {
        hasSettingsModal,
        hasAndroidBridge,
        hasRequestPin,
        isPinSupported,
        previewOk: !!preview,
        previewTag: preview?.tag,
        parsedTownHall: parsed?.townHallLevel,
        parsedUpgradesCount: (parsed?.activeUpgrades || []).length
      };
    })()
  `);

  console.log('Live Verification on Phone:\n', JSON.stringify(res, null, 2));

  ws.close();
}
test();
