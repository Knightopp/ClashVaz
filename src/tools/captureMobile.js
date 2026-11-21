import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '../../public/screenshots');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function captureMobileViews() {
  console.log('Starting Chrome in mobile emulation mode...');
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=390,844',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  let tabs = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    await wait(800);
    try {
      const listRes = await fetch('http://localhost:9222/json/list');
      tabs = await listRes.json();
      if (tabs && tabs[0]?.webSocketDebuggerUrl) break;
    } catch (e) {
      // retry
    }
  }

  if (!tabs || !tabs[0]?.webSocketDebuggerUrl) {
    throw new Error('Could not connect to Chrome debugging WebSocket');
  }

  try {
    const wsUrl = tabs[0].webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);

    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = rej;
    });

    let msgId = 1;
    function sendCommand(method, params = {}) {
      return new Promise((res) => {
        const id = msgId++;
        const onMsg = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === id) {
            ws.removeEventListener('message', onMsg);
            res(data.result);
          }
        };
        ws.addEventListener('message', onMsg);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    console.log('Navigating to http://localhost:3000...');
    await sendCommand('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2500);

    async function saveShot(filename) {
      console.log(`Capturing ${filename}...`);
      const screenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
      if (screenshot && screenshot.data) {
        const buffer = Buffer.from(screenshot.data, 'base64');
        const filePath = path.join(outDir, filename);
        fs.writeFileSync(filePath, buffer);
        console.log(`Saved ${filename} (${buffer.length} bytes)`);
      }
    }

    // 1. Mobile Dashboard
    await saveShot('mobile_dashboard.png');

    // 2. Mobile Upgrades & Profile View
    console.log('Switching to mobile upgrades view...');
    await sendCommand('Runtime.evaluate', { expression: "switchNav('upgrades')" });
    await wait(800);
    await saveShot('mobile_upgrades_view.png');

    // 3. Mobile Village View
    console.log('Switching to mobile village view...');
    await sendCommand('Runtime.evaluate', { expression: "switchNav('my-village')" });
    await wait(800);
    await saveShot('mobile_village_view.png');

    // 4. Mobile Layout Map Builder
    console.log('Switching to mobile layout view...');
    await sendCommand('Runtime.evaluate', { expression: "switchNav('layout')" });
    await wait(800);
    await saveShot('mobile_layout_view.png');

    ws.close();
  } catch (err) {
    console.error('CDP Mobile Capture Error:', err);
  } finally {
    chromeProcess.kill();
  }
}

captureMobileViews().then(() => console.log('Mobile screenshots captured!'));
