const fs = require('fs');
const content = fs.readFileSync('public/index.html', 'utf8');
const idx = content.indexOf('id="view-upgrades"');
console.log(content.substring(idx - 20, idx + 1000));
