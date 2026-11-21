const https = require('https');

const options = {
  hostname: 'api.github.com',
  path: '/repos/ClashKingInc/ClashKingAssets/contents',
  headers: {
    'User-Agent': 'NodeJS-Checker'
  }
};

https.get(options, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const items = JSON.parse(data);
      if (Array.isArray(items)) {
        console.log('Repo root contents:');
        items.forEach(it => console.log(it.type, it.name, it.path));
      } else {
        console.log('Response:', items);
      }
    } catch (e) {
      console.log('Raw:', data.slice(0, 300));
    }
  });
}).on('error', err => console.error(err));
