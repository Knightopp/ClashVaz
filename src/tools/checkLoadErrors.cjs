const { spawn } = require('child_process');

async function test() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9251',
    'http://localhost:3000'
  ]);
  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://localhost:9251/json/list');
    const tabs = await listRes.json();
    const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    const logs = [];
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.method === 'Runtime.consoleAPICalled') {
        logs.push(d.params.args.map(a => a.value || a.description).join(' '));
      }
      if (d.method === 'Runtime.exceptionThrown') {
        logs.push('EXCEPTION: ' + JSON.stringify(d.params.exceptionDetails));
      }
    };

    let msgId = 1;
    function send(method, params = {}) {
      ws.send(JSON.stringify({ id: msgId++, method, params }));
    }

    send('Runtime.enable');
    send('Page.enable');
    send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(r => setTimeout(r, 3000));

    console.log('Browser Logs on Load:');
    logs.forEach(l => console.log('LOG:', l));

  } finally {
    chrome.kill();
    process.exit(0);
  }
}

test();
