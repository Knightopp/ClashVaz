async function test() {
  try {
    const listRes = await fetch('http://localhost:9222/json/list');
    const tabs = await listRes.json();
    console.log('Tabs in WebView:', tabs);
    if (!tabs || tabs.length === 0) {
      console.log('No tabs found');
      return;
    }
    const wsUrl = tabs[0].webSocketDebuggerUrl;
    console.log('Connecting to:', wsUrl);
    const ws = new WebSocket(wsUrl);
    await new Promise(r => ws.onopen = r);

    const logs = [];
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.method === 'Runtime.consoleAPICalled') {
        logs.push(d.params.args.map(a => a.value || a.description).join(' '));
      }
      if (d.method === 'Runtime.exceptionThrown') {
        logs.push('EXC: ' + JSON.stringify(d.params.exceptionDetails));
      }
    };

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
        ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
      });
    }

    const bannerImgSrc = await evalCode('document.getElementById("banner-th-img")?.src');
    const heroImgs = await evalCode('Array.from(document.querySelectorAll(".hero-card img")).map(i => ({ src: i.src, naturalWidth: i.naturalWidth, complete: i.complete }))');
    const bldgImgs = await evalCode('Array.from(document.querySelectorAll("#village-buildings-grid img")).slice(0, 5).map(i => ({ src: i.src, naturalWidth: i.naturalWidth, complete: i.complete }))');
    
    console.log('Banner TH Img Src:', bannerImgSrc);
    console.log('Hero Images on phone:', heroImgs);
    console.log('Building Images on phone:', bldgImgs);

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
