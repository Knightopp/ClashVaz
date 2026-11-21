const https = require('https');

const candidates = [
  // Flat names
  'https://assets.clashk.ing/heroes/barbarian-king.png',
  'https://assets.clashk.ing/heroes/archer-queen.png',
  'https://assets.clashk.ing/heroes/grand-warden.png',
  'https://assets.clashk.ing/heroes/royal-champion.png',
  'https://assets.clashk.ing/heroes/minion-prince.png',
  'https://assets.clashk.ing/heroes/dragon-duke.png',

  // Without hyphens / underscores
  'https://assets.clashk.ing/heroes/Barbarian_King.png',
  'https://assets.clashk.ing/heroes/Archer_Queen.png',
  'https://assets.clashk.ing/heroes/Grand_Warden.png',
  'https://assets.clashk.ing/heroes/Royal_Champion.png',
  'https://assets.clashk.ing/heroes/Minion_Prince.png',
  'https://assets.clashk.ing/heroes/Dragon_Duke.png',

  // ID-based (28000000, 28000001, etc.)
  'https://assets.clashk.ing/heroes/28000000.png',
  'https://assets.clashk.ing/heroes/28000001.png',
  'https://assets.clashk.ing/heroes/28000002.png',
  'https://assets.clashk.ing/heroes/28000004.png',
  'https://assets.clashk.ing/heroes/28000006.png',
  'https://assets.clashk.ing/heroes/28000007.png',

  // images/heroes/
  'https://assets.clashk.ing/images/heroes/barbarian-king.png',
  'https://assets.clashk.ing/images/heroes/28000000.png',
  'https://assets.clashk.ing/images/heroes/28000006.png',
  'https://assets.clashk.ing/images/heroes/28000007.png',

  // avatars/
  'https://assets.clashk.ing/avatars/28000000.png',
  'https://assets.clashk.ing/avatars/28000006.png',
  'https://assets.clashk.ing/avatars/28000007.png'
];

async function checkUrl(url) {
  return new Promise(resolve => {
    https.get(url, res => {
      resolve({ url, status: res.statusCode, type: res.headers['content-type'] });
    }).on('error', err => resolve({ url, status: 'err', error: err.message }));
  });
}

async function run() {
  console.log('Testing candidates...');
  for (const c of candidates) {
    const res = await checkUrl(c);
    if (res.status === 200) {
      console.log('FOUND 200:', res.url, res.type);
    }
  }
  console.log('Done test.');
}

run();
