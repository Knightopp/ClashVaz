const fs = require('fs');
const content = fs.readFileSync('public/index.html', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('<aside') || l.includes('<main') || l.includes('app-frame') || l.includes('right-rail') || l.includes('mobile-top-bar')) {
    console.log((idx+1) + ': ' + l.trim());
  }
});
