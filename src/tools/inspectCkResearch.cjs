const fs = require('fs');
const ck = JSON.parse(fs.readFileSync('data/clashking_static_data.json', 'utf8'));

console.log('=== TROOPS IN CLASHKING STATIC DATA ===');
console.log('Total troops:', ck.troops.length);
ck.troops.slice(0, 15).forEach(t => {
  const home = t.village === 'home';
  if (!home) return;
  const thMax = {};
  t.levels.forEach(l => {
    const th = l.required_townhall;
    if (!thMax[th] || l.level > thMax[th]) thMax[th] = l.level;
  });
  console.log(`${t.name} (ID ${t._id}): max levels = ${t.levels.length}`, thMax);
});

console.log('=== SPELLS IN CLASHKING STATIC DATA ===');
ck.spells.forEach(s => {
  const thMax = {};
  s.levels.forEach(l => {
    const th = l.required_townhall;
    if (!thMax[th] || l.level > thMax[th]) thMax[th] = l.level;
  });
  console.log(`${s.name} (ID ${s._id}): max levels = ${s.levels.length}`, thMax);
});

console.log('=== PETS IN CLASHKING STATIC DATA ===');
ck.pets.forEach(p => {
  const thMax = {};
  p.levels.forEach(l => {
    const th = l.required_townhall;
    if (!thMax[th] || l.level > thMax[th]) thMax[th] = l.level;
  });
  console.log(`${p.name} (ID ${p._id}): max levels = ${p.levels.length}`, thMax);
});
