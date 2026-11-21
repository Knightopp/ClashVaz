const https = require('https');

function getGh(path) {
  return new Promise((resolve) => {
    https.get({
      hostname: 'api.github.com',
      path: `/repos/ClashKingInc/ClashKingAssets/contents/${path}`,
      headers: { 'User-Agent': 'NodeJS-Checker' }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function run() {
  const assetsDir = await getGh('assets');
  console.log('=== contents of assets/ ===');
  if (Array.isArray(assetsDir)) {
    assetsDir.forEach(it => console.log(it.type, it.name));
  } else {
    console.log(assetsDir);
  }

  const buildPy = await getGh('build.py');
  if (buildPy && buildPy.content) {
    const code = Buffer.from(buildPy.content, 'base64').toString('utf8');
    console.log('=== build.py (first 1000 chars) ===');
    console.log(code.slice(0, 1000));
  }
}

run();
