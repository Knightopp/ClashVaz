const fs = require('fs');
const content = fs.readFileSync('public/index.html', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('class="view-section') || l.includes("class='view-section") || l.includes('switchNav')) {
    console.log((idx+1) + ': ' + l.trim());
  }
});
