const { spawn } = require('child_process');

async function test() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9247',
    '--window-size=412,915',
    'http://localhost:3000'
  ]);
  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://localhost:9247/json/list');
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
            if (d.result?.exceptionDetails) {
              console.error('Eval error:', d.result.exceptionDetails);
            }
            res(d.result?.result?.value);
          }
        };
        ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
      });
    }

    const res = await evalCode(`
      (() => {
        const wrap = document.querySelector('.timeline-scroll-wrap');
        const inner = document.querySelector('.timeline-canvas-inner');
        return {
          wrapWidth: wrap?.clientWidth,
          innerWidth: inner?.clientWidth,
          innerHeight: inner?.clientHeight,
          innerHtmlLen: inner?.innerHTML?.length,
          children: Array.from(inner?.children || []).map(c => ({
            tag: c.tagName,
            cls: c.className,
            w: c.clientWidth,
            h: c.clientHeight,
            vis: window.getComputedStyle(c).visibility,
            disp: window.getComputedStyle(c).display
          }))
        };
      })()
    `);

    console.log('Timeline Inner Children:', JSON.stringify(res, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}

test();
