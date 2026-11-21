const https = require('https');
const fs = require('fs');

https.get('https://raw.githubusercontent.com/Statscell/clash-of-clans-csv/main/buildings.csv', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const lines = data.split('\n');
    console.log('Total CSV lines:', lines.length);
    const names = [];
    lines.slice(2).forEach(l => {
      const col = l.split(',')[0]?.trim();
      if (col && !names.includes(col)) names.push(col);
    });
    console.log('Buildings found:', names.length);
    const mapping = {};
    names.forEach((name, idx) => {
      mapping[1000000 + idx] = name;
      console.log((1000000 + idx) + ": '" + name + "'");
    });
    fs.writeFileSync('data/official_sc_buildings_map.json', JSON.stringify(mapping, null, 2));
    console.log('Saved data/official_sc_buildings_map.json');
  });
}).on('error', err => console.error(err));
