const https = require('https');

https.get('https://clashk.ing/assets/index-Bu5w5ThS.js', res => {
  let js = '';
  res.on('data', c => js += c);
  res.on('end', () => {
    console.log('JS length:', js.length);
    const matches = js.match(/https:\/\/assets\.clashk\.ing\/[^\s"',`)]+/g) || [];
    console.log('assets.clashk.ing matches:', matches.length);
    const unique = [...new Set(matches)];
    console.log('Unique matches (up to 30):', unique.slice(0, 30));

    // Also search for hero image construction
    const heroMatches = js.match(/assets\.clashk\.ing[^"';,`)]+/g) || [];
    console.log('heroMatches:', [...new Set(heroMatches)].slice(0, 20));
  });
}).on('error', err => console.error(err));
