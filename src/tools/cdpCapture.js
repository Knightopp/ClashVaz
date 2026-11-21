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

async function captureViews() {
  console.log('Starting Chrome with remote debugging...');
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1440,1300',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await wait(1500);

  try {
    const listRes = await fetch('http://localhost:9222/json/list');
    const tabs = await listRes.json();
    const wsUrl = tabs[0]?.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error('No webSocketDebuggerUrl found');

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

    console.log('Navigating to http://localhost:3000...');
    await sendCommand('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2500); // Wait for page data to load

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

    // 1. Dashboard with Timeline Upgrades Visible (Event-like capsules starting at Now and stretching across days)
    await saveShot('upgrades_event_style_shown.png');

    // 1b. Test TH Calculator with 6 builders (Max) and 20% boosts
    console.log('Testing TH Time Calculator with 6 builders and 20% boosts...');
    await sendCommand('Runtime.evaluate', { expression: "setCalcBuilders(6); setCalcBuilderBoost(20); setCalcResearchBoost(20);" });
    await wait(400);
    await saveShot('th_calculator_6builders_20boost.png');
    await sendCommand('Runtime.evaluate', { expression: "setCalcBuilders(5); setCalcBuilderBoost(0); setCalcResearchBoost(0);" });
    await wait(300);

    // 2. Dashboard with Timeline Upgrades Hidden (Testing the hide toggle)
    console.log('Clicking toggleTimelineUpgrades() to hide upgrades...');
    await sendCommand('Runtime.evaluate', { expression: "toggleTimelineUpgrades()" });
    await wait(500);
    await saveShot('upgrades_event_style_hidden.png');

    // Restore to shown
    await sendCommand('Runtime.evaluate', { expression: "toggleTimelineUpgrades()" });
    await wait(500);

    // 3. Village Layout Map with Upgrades: ON
    console.log('Switching to Village Layout...');
    await sendCommand('Runtime.evaluate', { expression: "switchNav('layout')" });
    await wait(800);
    await saveShot('village_map_upgrades_on.png');

    // 4. Village Layout Map with Upgrades: OFF
    console.log('Toggling Village Layout Upgrades to OFF...');
    await sendCommand('Runtime.evaluate', { expression: "toggleLayoutUpgrades()" });
    await wait(500);
    await saveShot('village_map_upgrades_off.png');

    ws.close();
  } catch (err) {
    console.error('CDP Capture Error:', err);
  } finally {
    chromeProcess.kill();
  }
}

captureViews().then(() => console.log('All upgrades captures completed!'));
