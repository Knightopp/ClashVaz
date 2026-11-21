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
  const heroesDir = await getGh('assets/heroes');
  console.log('=== contents of assets/heroes/ ===');
  if (Array.isArray(heroesDir)) {
    heroesDir.forEach(it => console.log(it.type, it.name));
  } else {
    console.log(heroesDir);
  }
}

run();
