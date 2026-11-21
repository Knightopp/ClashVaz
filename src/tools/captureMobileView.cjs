const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '../../public/screenshots');
const artifactDir = 'C:\\Users\\ABHIRAM C S\\.gemini\\antigravity\\brain\\09782b43-a4f3-4da4-a771-6720f56ad2c9';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function run() {
  console.log('Starting Chrome in mobile portrait viewport (412x915)...');
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9255',
    '--window-size=412,915',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:3000'
  ]);

  await wait(2000);

  try {
    const listRes = await fetch('http://localhost:9255/json/list');
    const tabs = await listRes.json();
    const wsUrl = tabs[0]?.webSocketDebuggerUrl;
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

    await wait(1000);

    const stats = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        return {
          eventsCount: document.querySelectorAll('.timeline-pill-event').length,
          upgCount: document.querySelectorAll('.timeline-upgrade-capsule').length,
          dates: Array.from(document.querySelectorAll('.ruler-cell .ruler-num')).map(el => el.textContent).join(', '),
          heroNames: Array.from(document.querySelectorAll('.hero-card .hero-name')).map(el => el.textContent),
          heroLevels: Array.from(document.querySelectorAll('.hero-card .hero-level-chip')).map(el => el.textContent),
          badgeText: document.getElementById('mobile-upgrades-badge')?.textContent
        };
      })()`,
      returnByValue: true
    });

    console.log('Mobile View Stats:', JSON.stringify(stats?.result?.value, null, 2));

    // Capture screenshot of mobile dashboard
    console.log('Capturing mobile_fixed_conjunction_dashboard.png...');
    let shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    let buf = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(path.join(outDir, 'mobile_fixed_conjunction_dashboard.png'), buf);
    fs.writeFileSync(path.join(artifactDir, 'mobile_fixed_conjunction_dashboard.png'), buf);

    // Scroll to schedule and capture
    await sendCommand('Runtime.evaluate', {
      expression: `document.querySelector('.timeline-scroll-wrap')?.scrollIntoView({ behavior: 'instant', block: 'center' });`
    });
    await wait(600);

    console.log('Capturing mobile_fixed_calendar_schedule.png...');
    shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    buf = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(path.join(outDir, 'mobile_fixed_calendar_schedule.png'), buf);
    fs.writeFileSync(path.join(artifactDir, 'mobile_fixed_calendar_schedule.png'), buf);

    ws.close();
    chromeProcess.kill();
    console.log('Mobile screenshot captured successfully.');
  } catch (err) {
    console.error('Error:', err);
    chromeProcess.kill();
  }
}

run();
