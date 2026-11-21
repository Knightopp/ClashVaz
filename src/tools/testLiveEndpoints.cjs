const http = require('http');
const fs = require('fs');

async function testCurrent() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/api/village/current', res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

async function testValidate() {
  const rawExport = JSON.parse(fs.readFileSync('data/latest_user_export.json', 'utf8'));
  const body = JSON.stringify(rawExport);

  return new Promise((resolve, reject) => {
    const req = http.request('http://localhost:3000/api/village/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  try {
    const cur = await testCurrent();
    console.log('GET /api/village/current:');
    console.log('Town Hall Level:', cur.currentProfile?.townHallLevel);
    console.log('Tag:', cur.currentProfile?.tag);
    console.log('Dragon Duke level:', cur.currentProfile?.heroes?.find(h => h.data === 28000007)?.lvl);

    const val = await testValidate();
    console.log('POST /api/village/validate:');
    console.log('Preview TH:', val.preview?.townHallLevel);
    console.log('Preview active upgrades count:', val.preview?.activeUpgradesCount);
  } catch (err) {
    console.error('Error contacting server:', err.message);
  }
}

run();
