const fs = require('fs');
const content = fs.readFileSync('public/index.html', 'utf8');
const idx = content.indexOf('settings-modal');
if (idx !== -1) {
  console.log(content.substring(idx - 50, idx + 1200));
} else {
  console.log('not found');
}
