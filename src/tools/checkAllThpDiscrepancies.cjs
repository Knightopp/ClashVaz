const fs = require('fs');

const ck = JSON.parse(fs.readFileSync('data/clashking_static_data.json', 'utf8'));
const thp = JSON.parse(fs.readFileSync('data/th_progression.json', 'utf8'));

console.log('Comparing all buildings across TH1-TH19:');
const homeBuildings = ck.buildings.filter(b => b.village === 'home');

thp.forEach(p => {
  const th = p.townHall;
  p.buildings.forEach(pb => {
    const cleanName = pb.name.toLowerCase().replace(/\/home village/i, '').trim();
    const ckB = homeBuildings.find(b => b.name.toLowerCase().trim() === cleanName);
    if (ckB) {
      const ckMax = Math.max(0, ...ckB.levels.filter(l => l.required_townhall <= th).map(l => l.level));
      if (pb.maxAvailableLevel !== ckMax && ckMax > 0) {
        console.log(`TH${th} ${pb.name}: thp has max ${pb.maxAvailableLevel}, but CK has max ${ckMax}`);
      }
    }
  });
});
