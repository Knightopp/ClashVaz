const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '../../public/screenshots');
const artifactDir = 'C:\\Users\\ABHIRAM C S\\.gemini\\antigravity\\brain\\09782b43-a4f3-4da4-a771-6720f56ad2c9';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function run() {
  console.log('Starting headless Chrome...');
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--window-size=1550,1400',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await wait(1800);

  try {
    const listRes = await fetch('http://localhost:9224/json/list');
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

    console.log('Navigating to http://localhost:3000...');
    await sendCommand('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2200);

    // 1. Capture Dashboard & Heroes Section & Stretched Calendar
    console.log('Capturing dashboard_6heroes_and_stretched_timeline.png...');
    let shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    let buf = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(path.join(outDir, 'dashboard_6heroes_and_stretched_timeline.png'), buf);
    fs.writeFileSync(path.join(artifactDir, 'dashboard_6heroes_and_stretched_timeline.png'), buf);

    // 2. Scroll to TH Progression Tiers & Roadmap
    await sendCommand('Runtime.evaluate', {
      expression: `document.getElementById('th-progression-tiers-section').scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await wait(600);

    console.log('Capturing th18_th19_tiers_and_maxing_roadmap.png...');
    shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    buf = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(path.join(outDir, 'th18_th19_tiers_and_maxing_roadmap.png'), buf);
    fs.writeFileSync(path.join(artifactDir, 'th18_th19_tiers_and_maxing_roadmap.png'), buf);

    // 3. Click "Hero" category tab on Roadmap to show 100% verified hero levels & times!
    await sendCommand('Runtime.evaluate', {
      expression: `filterRoadmap('Hero'); document.getElementById('maxing-roadmap-section').scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await wait(600);

    console.log('Capturing maxing_roadmap_table_details.png (Verified Heroes)...');
    shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    buf = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(path.join(outDir, 'maxing_roadmap_table_details.png'), buf);
    fs.writeFileSync(path.join(artifactDir, 'maxing_roadmap_table_details.png'), buf);

    // 4. Click "Research" category tab on Roadmap to show verified troops & spells!
    await sendCommand('Runtime.evaluate', {
      expression: `filterRoadmap('Research'); document.getElementById('maxing-roadmap-section').scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await wait(600);

    console.log('Capturing maxing_roadmap_research_details.png (Verified Research)...');
    shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    buf = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(path.join(outDir, 'maxing_roadmap_research_details.png'), buf);
    fs.writeFileSync(path.join(artifactDir, 'maxing_roadmap_research_details.png'), buf);

    // 5. Click "Defense" category tab on Roadmap to show verified building quantities!
    await sendCommand('Runtime.evaluate', {
      expression: `filterRoadmap('Defense'); document.getElementById('maxing-roadmap-section').scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await wait(600);

    console.log('Capturing maxing_roadmap_defenses_quantities.png (Building Quantities)...');
    shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    buf = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(path.join(outDir, 'maxing_roadmap_defenses_quantities.png'), buf);
    fs.writeFileSync(path.join(artifactDir, 'maxing_roadmap_defenses_quantities.png'), buf);

    ws.close();
    chromeProcess.kill();
    console.log('All screenshots captured and saved to artifacts successfully.');
  } catch (err) {
    console.error('Error during capture:', err);
    chromeProcess.kill();
  }
}

run();
