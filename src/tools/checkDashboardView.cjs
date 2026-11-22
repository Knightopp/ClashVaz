const fs = require('fs');
const content = fs.readFileSync('public/index.html', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(3480, 3600).join('\n'));
