const fs = require('fs');

const text = fs.readFileSync('data/clashking_static_data.json', 'utf8');
const pngMatches = text.match(/https?:[^"']+\.png/g) || [];
console.log('PNG URL matches in clashking_static_data.json:', pngMatches.length);
if (pngMatches.length > 0) {
  console.log('Sample PNG URLs:', pngMatches.slice(0, 10));
}

const anyUrls = text.match(/https?:[^"']+/g) || [];
console.log('Total URLs found:', anyUrls.length);
if (anyUrls.length > 0) {
  console.log('Sample URLs:', anyUrls.slice(0, 10));
}

// Check if any property in parsed data has filenames
const parsed = JSON.parse(text);
console.log('Hero 0 keys & sample:', Object.keys(parsed.heroes[0]));
console.log('Hero 0 TID:', parsed.heroes[0].TID);
console.log('Hero 5 (Minion Prince) TID:', parsed.heroes.find(h => h._id === 28000006)?.TID);
console.log('Hero 6 (Dragon Duke) TID:', parsed.heroes.find(h => h._id === 28000007)?.TID);
