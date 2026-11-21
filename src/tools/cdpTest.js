import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '../../public');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function test() {
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1440,950',
    '--disable-gpu',
    'http://localhost:3000'
  ]);

  await wait(2500);

  const listRes = await fetch('http://localhost:9222/json/list');
  const tabs = await listRes.json();
  const wsUrl = tabs[0]?.webSocketDebuggerUrl;

  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  function send(method, params = {}) {
    return new Promise(res => {
      const id = msgId++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === id) {
          ws.removeEventListener('message', handler);
          res(d);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const res1 = await send('Runtime.evaluate', { expression: "switchNav('progression')" });
  console.log('switchNav progression result:', res1);

  const domRes = await send('Runtime.evaluate', { expression: "document.querySelector('#view-progression').classList.contains('active')" });
  console.log('is progression view active:', domRes);

  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(outDir, 'test_progression_shot.png'), Buffer.from(shot.result.data, 'base64'));
  console.log('Saved test_progression_shot.png!');

  ws.close();
  chromeProcess.kill();
}

test();
