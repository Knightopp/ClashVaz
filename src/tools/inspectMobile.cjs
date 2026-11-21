const { spawn } = require('child_process');

async function test() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9246',
    '--window-size=412,915',
    'http://localhost:3000'
  ]);
  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://localhost:9246/json/list');
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
        const heroesContainer = document.querySelector('.village-heroes-grid') || document.getElementById('village-heroes-grid');
        const calContainer = document.querySelector('.timeline-scroll-area') || document.getElementById('timeline-scroll-area');
        const calBox = document.querySelector('.timeline-container') || document.querySelector('.timeline-wrap') || document.getElementById('timeline-container');
        
        return {
          heroesGridStyle: heroesContainer ? {
            display: window.getComputedStyle(heroesContainer).display,
            overflowX: window.getComputedStyle(heroesContainer).overflowX,
            flexWrap: window.getComputedStyle(heroesContainer).flexWrap,
            scrollWidth: heroesContainer.scrollWidth,
            clientWidth: heroesContainer.clientWidth
          } : null,
          heroesCount: heroesContainer ? heroesContainer.children.length : 0,
          calBox: calBox ? {
            width: calBox.clientWidth,
            height: calBox.clientHeight,
            innerHTML: calBox.innerHTML.substring(0, 300)
          } : null,
          calContainer: calContainer ? {
            scrollWidth: calContainer.scrollWidth,
            clientWidth: calContainer.clientWidth,
            scrollLeft: calContainer.scrollLeft,
            children: calContainer.children.length
          } : null,
          upgBadge: document.querySelector('.nav-badge') ? {
            text: document.querySelector('.nav-badge').textContent,
            style: window.getComputedStyle(document.querySelector('.nav-badge')).cssText
          } : null
        };
      })()
    `);

    console.log('Mobile Inspection:', JSON.stringify(res, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}

test();
