const https = require('https');

https.get('https://clashk.ing', res => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    console.log('HTML length:', html.length);
    const matches = html.match(/src="[^"]+"/g) || [];
    console.log('src count:', matches.length);
    matches.forEach(m => console.log(m));
  });
}).on('error', err => console.error(err));
