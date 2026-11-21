const fs = require('fs');
const ck = JSON.parse(fs.readFileSync('data/clashking_static_data.json', 'utf8'));

console.log('=== HEROES IN CLASHKING STATIC DATA ===');
ck.heroes.forEach(h => {
  const lv1 = h.levels[0];
  const lvLast = h.levels[h.levels.length - 1];
  console.log(`${h.name} (_id: ${h._id}, village: ${h.village}): total levels = ${h.levels.length}`);
  
  // Find max level for each townhall
  const thMax = {};
  h.levels.forEach(l => {
    const th = l.required_townhall;
    if (!thMax[th] || l.level > thMax[th]) {
      thMax[th] = l.level;
    }
  });
  console.log('  Max level per TH:', thMax);
  console.log(`  Lv 1: TH ${lv1.required_townhall}, time: ${lv1.upgrade_time}s`);
  console.log(`  Lv ${lvLast.level}: TH ${lvLast.required_townhall}, time: ${lvLast.upgrade_time}s`);
});
