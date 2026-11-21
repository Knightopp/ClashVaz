const https = require('https');

const paths = [
  // Skin / Hero prefixes
  '/skins/52000000.png',
  '/skin-images/52000000.png',
  '/hero-skins/52000000.png',
  '/hero-images/52000000.png',
  '/hero-images/28000000.png',
  '/heroes/52000000.png',
  '/heroes/28000000.png',
  '/images/heroes/52000000.png',
  '/images/heroes/28000000.png',
  '/images/skins/52000000.png',
  '/avatars/52000000.png',
  '/avatars/28000000.png',
  '/hero_avatars/28000000.png',
  '/hero_avatars/52000000.png',
  '/icons/28000000.png',
  '/icons/52000000.png',
  '/portraits/28000000.png',
  '/portraits/52000000.png',
  '/renders/28000000.png',
  '/renders/52000000.png',

  // Named
  '/heroes/Barbarian_King.png',
  '/heroes/barbarian_king.png',
  '/heroes/barbarian-king.png',
  '/skins/Barbarian_King.png',
  '/hero-images/Barbarian_King.png',
  '/hero-images/barbarian_king.png',
  '/hero-images/barbarian-king.png',
  
  // Buildings
  '/buildings/1000001.png',
  '/building-images/1000001.png',
  '/images/buildings/1000001.png'
];

async function testPaths() {
  for (const p of paths) {
    const url = `https://assets.clashk.ing${p}`;
    try {
      const res = await new Promise(resolve => {
        https.get(url, r => resolve({ status: r.statusCode, type: r.headers['content-type'] }))
             .on('error', err => resolve({ status: 'err' }));
      });
      if (res.status === 200) {
        console.log(`200 OK: ${p} (${res.type})`);
      } else if (res.status === 301 || res.status === 302) {
        console.log(`REDIRECT ${res.status}: ${p}`);
      }
    } catch (e) {}
  }
  console.log('Finished probing paths.');
}

testPaths();
