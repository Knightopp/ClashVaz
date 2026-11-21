const { spawn } = require('child_process');

async function test() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9248',
    '--window-size=412,915',
    'http://localhost:3000'
  ]);
  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://localhost:9248/json/list');
    const tabs = await listRes.json();
    const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    function evalCode(expr) {
      return new Promise(res => {
        const id = msgId++;
        ws.onmessage = (e) => {
          const d = JSON.parse(e.data);
          if (d.id === id) {
            res(d.result?.result?.value);
          }
        };
        ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
      });
    }

    const html = await evalCode(`document.querySelector('.timeline-canvas-inner')?.innerHTML`);
    console.log('INNER HTML:\n', html);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}

test();
