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
  const heroes = ['barbarian_king', 'archer_queen', 'grand_warden', 'royal_champion', 'minion_prince', 'dragon_duke'];
  for (const h of heroes) {
    const files = await getGh(`assets/heroes/${h}`);
    console.log(`=== ${h} files ===`);
    if (Array.isArray(files)) {
      files.forEach(f => console.log(f.name, f.download_url));
    } else {
      console.log(files);
    }
  }
}

run();
