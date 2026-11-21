const fs = require('fs');

const ck = JSON.parse(fs.readFileSync('data/clashking_static_data.json', 'utf8'));
const thp = JSON.parse(fs.readFileSync('data/th_progression.json', 'utf8'));

console.log('=== BUILDINGS IN CLASHKING STATIC DATA ===');
const th18p = thp.find(p => p.townHall === 18);
const th19p = thp.find(p => p.townHall === 19);

ck.buildings.filter(b => b.village === 'home').forEach(b => {
  const th18Max = Math.max(...b.levels.filter(l => l.required_townhall <= 18).map(l => l.level));
  const th19Max = Math.max(...b.levels.filter(l => l.required_townhall <= 19).map(l => l.level));
  
  const bIn18 = th18p?.buildings.find(pb => pb.name.toLowerCase() === b.name.toLowerCase() || pb.name.toLowerCase().includes(b.name.toLowerCase()));
  const bIn19 = th19p?.buildings.find(pb => pb.name.toLowerCase() === b.name.toLowerCase() || pb.name.toLowerCase().includes(b.name.toLowerCase()));

  console.log(`${b.name} (ID: ${b._id}):`);
  console.log(`   CK: TH18 max = ${th18Max}, TH19 max = ${th19Max}`);
  console.log(`   th_progression: TH18 max = ${bIn18?.maxAvailableLevel || 'MISSING'}, TH19 max = ${bIn19?.maxAvailableLevel || 'MISSING'}`);
});
