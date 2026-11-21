const fs = require('fs');

const prof = JSON.parse(fs.readFileSync('data/village_profiles.json', 'utf8'));
const cp = prof.currentProfile;

console.log('Player tag:', cp.tag);
console.log('Buildings in profile:', cp.buildings.length);

// Group by building name
const groups = {};
cp.buildings.forEach(b => {
  const name = b.name || b.buildingId;
  if (!groups[name]) groups[name] = [];
  groups[name].push(b);
});

console.log('\nUser building counts and levels:');
Object.keys(groups).sort().forEach(name => {
  const list = groups[name];
  const totalQty = list.reduce((sum, item) => sum + (item.quantity || item.cnt || 1), 0);
  const levels = list.map(item => `Lv ${item.level !== undefined ? item.level : item.lvl} (x${item.quantity || item.cnt || 1})`).join(', ');
  console.log(`${name}: total qty = ${totalQty} | ${levels}`);
});
