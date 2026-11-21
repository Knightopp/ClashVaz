const https = require('https');

const candidates = [
  'https://assets.clashk.ing/heroes/barbarian-king/icon.webp',
  'https://assets.clashk.ing/heroes/barbarian-king.webp',
  'https://assets.clashk.ing/heroes/Barbarian%20King.webp',
  'https://assets.clashk.ing/heroes/Barbarian%20King/icon.webp',
  
  // Dragon Duke
  'https://assets.clashk.ing/heroes/dragon-duke/icon.webp',
  'https://assets.clashk.ing/heroes/dragon-duke.webp',
  'https://assets.clashk.ing/heroes/Dragon%20Duke.webp',
  'https://assets.clashk.ing/heroes/Dragon%20Duke/icon.webp',

  // Minion Prince
  'https://assets.clashk.ing/heroes/minion-prince/icon.webp',
  'https://assets.clashk.ing/heroes/minion-prince.webp',
  'https://assets.clashk.ing/heroes/Minion%20Prince.webp',
  'https://assets.clashk.ing/heroes/Minion%20Prince/icon.webp',

  // ID based
  'https://assets.clashk.ing/heroes/28000000.webp',
  'https://assets.clashk.ing/heroes/28000006.webp',
  'https://assets.clashk.ing/heroes/28000007.webp',

  // skins
  'https://assets.clashk.ing/skins/52000000.webp',
  'https://assets.clashk.ing/skins/52000250.webp',
  'https://assets.clashk.ing/skins/52000342.webp',

  // hero-images
  'https://assets.clashk.ing/hero-images/28000000.webp',
  'https://assets.clashk.ing/hero-images/28000006.webp',
  'https://assets.clashk.ing/hero-images/28000007.webp'
];

async function check() {
  for (const url of candidates) {
    try {
      const res = await new Promise(r => {
        https.get(url, resp => r({ status: resp.statusCode, type: resp.headers['content-type'] }))
             .on('error', err => r({ status: 'err' }));
      });
      if (res.status === 200) {
        console.log('FOUND 200 OK:', url, res.type);
      }
    } catch (e) {}
  }
  console.log('Finished candidate test.');
}

check();
