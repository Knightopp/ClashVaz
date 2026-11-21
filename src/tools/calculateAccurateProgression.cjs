const fs = require('fs');

const ck = JSON.parse(fs.readFileSync('data/clashking_static_data.json', 'utf8'));
const prof = JSON.parse(fs.readFileSync('data/village_profiles.json', 'utf8'));
const cp = prof.currentProfile;

console.log('Player tag:', cp.tag, 'TH:', cp.townHallLevel);

// 1. Inspect user heroes vs Clash King data
console.log('\n=== USER HEROES VS CLASH KING DATA ===');
let totalHeroSec18 = 0;
let totalHeroSec19 = 0;

cp.heroes.forEach(uh => {
  const ckHero = ck.heroes.find(h => h._id === uh.data);
  if (ckHero) {
    const th18MaxLvl = Math.max(...ckHero.levels.filter(l => l.required_townhall <= 18).map(l => l.level));
    const th19MaxLvl = Math.max(...ckHero.levels.filter(l => l.required_townhall <= 19).map(l => l.level));
    console.log(`${ckHero.name} (ID: ${uh.data}): current level = ${uh.lvl}`);
    console.log(`   TH18 max: ${th18MaxLvl} (remaining lvls: ${Math.max(0, th18MaxLvl - uh.lvl)})`);
    console.log(`   TH19 max: ${th19MaxLvl} (remaining lvls: ${Math.max(0, th19MaxLvl - uh.lvl)})`);
    
    let sec18 = 0;
    for (let l = uh.lvl + 1; l <= th18MaxLvl; l++) {
      const lData = ckHero.levels.find(x => x.level === l);
      if (lData) sec18 += lData.upgrade_time;
    }
    let sec19 = 0;
    for (let l = uh.lvl + 1; l <= th19MaxLvl; l++) {
      const lData = ckHero.levels.find(x => x.level === l);
      if (lData) sec19 += lData.upgrade_time;
    }
    totalHeroSec18 += sec18;
    totalHeroSec19 += sec19;
    console.log(`   Time to TH18 max: ${(sec18 / 86400).toFixed(1)} days; to TH19: ${(sec19 / 86400).toFixed(1)} days`);
  } else {
    console.log(`Hero ID ${uh.data} NOT FOUND in CK heroes!`);
  }
});
console.log(`Total raw hero time for TH18: ${(totalHeroSec18 / 86400).toFixed(1)} days`);
console.log(`Total raw hero time for TH19: ${(totalHeroSec19 / 86400).toFixed(1)} days`);

// 2. Inspect user troops / research vs Clash King data
console.log('\n=== RESEARCH (TROOPS & SPELLS) CALCULATION ===');
let totalTroopSec18 = 0;
let totalTroopSec19 = 0;

cp.troops.forEach(ut => {
  const ckT = ck.troops.find(t => t._id === ut.data);
  if (ckT && ckT.village === 'home') {
    const th18Max = Math.max(...ckT.levels.filter(l => l.required_townhall <= 18).map(l => l.level));
    const th19Max = Math.max(...ckT.levels.filter(l => l.required_townhall <= 19).map(l => l.level));
    let t18 = 0;
    for (let l = ut.lvl + 1; l <= th18Max; l++) {
      const ld = ckT.levels.find(x => x.level === l);
      if (ld) t18 += ld.upgrade_time;
    }
    let t19 = 0;
    for (let l = ut.lvl + 1; l <= th19Max; l++) {
      const ld = ckT.levels.find(x => x.level === l);
      if (ld) t19 += ld.upgrade_time;
    }
    totalTroopSec18 += t18;
    totalTroopSec19 += t19;
    if (th18Max > ut.lvl) {
      console.log(`Troop ${ckT.name}: cur ${ut.lvl} -> TH18 max ${th18Max} (+${th18Max - ut.lvl} lvls, ${(t18/86400).toFixed(1)}d)`);
    }
  }
});

let totalSpellSec18 = 0;
let totalSpellSec19 = 0;
cp.spells.forEach(us => {
  const ckS = ck.spells.find(s => s._id === us.data);
  if (ckS) {
    const th18Max = Math.max(...ckS.levels.filter(l => l.required_townhall <= 18).map(l => l.level));
    const th19Max = Math.max(...ckS.levels.filter(l => l.required_townhall <= 19).map(l => l.level));
    let s18 = 0;
    for (let l = us.lvl + 1; l <= th18Max; l++) {
      const ld = ckS.levels.find(x => x.level === l);
      if (ld) s18 += ld.upgrade_time;
    }
    let s19 = 0;
    for (let l = us.lvl + 1; l <= th19Max; l++) {
      const ld = ckS.levels.find(x => x.level === l);
      if (ld) s19 += ld.upgrade_time;
    }
    totalSpellSec18 += s18;
    totalSpellSec19 += s19;
    if (th18Max > us.lvl) {
      console.log(`Spell ${ckS.name}: cur ${us.lvl} -> TH18 max ${th18Max} (+${th18Max - us.lvl} lvls, ${(s18/86400).toFixed(1)}d)`);
    }
  }
});

// Pets
console.log('\n=== PETS CALCULATION ===');
let totalPetSec18 = 0;
let totalPetSec19 = 0;
cp.pets.forEach(up => {
  const ckP = ck.pets.find(p => p._id === up.data);
  if (ckP) {
    const th18Max = Math.max(...ckP.levels.filter(l => l.required_townhall <= 18).map(l => l.level));
    const th19Max = Math.max(...ckP.levels.filter(l => l.required_townhall <= 19).map(l => l.level));
    let p18 = 0;
    for (let l = up.lvl + 1; l <= th18Max; l++) {
      const ld = ckP.levels.find(x => x.level === l);
      if (ld) p18 += ld.upgrade_time;
    }
    let p19 = 0;
    for (let l = up.lvl + 1; l <= th19Max; l++) {
      const ld = ckP.levels.find(x => x.level === l);
      if (ld) p19 += ld.upgrade_time;
    }
    totalPetSec18 += p18;
    totalPetSec19 += p19;
    if (th18Max > up.lvl) {
      console.log(`Pet ${ckP.name}: cur ${up.lvl} -> TH18 max ${th18Max} (+${th18Max - up.lvl} lvls, ${(p18/86400).toFixed(1)}d)`);
    }
  }
});

const totalLabSec18 = totalTroopSec18 + totalSpellSec18;
const totalLabSec19 = totalTroopSec19 + totalSpellSec19;

console.log(`\n========================================`);
console.log(`TOTAL LAB TIME FOR TH18: ${(totalLabSec18 / 86400).toFixed(1)} days (${(totalLabSec18 / (86400 * 30.5)).toFixed(1)} months)`);
console.log(`TOTAL LAB TIME FOR TH19: ${(totalLabSec19 / 86400).toFixed(1)} days (${(totalLabSec19 / (86400 * 30.5)).toFixed(1)} months)`);
console.log(`TOTAL PET TIME FOR TH18: ${(totalPetSec18 / 86400).toFixed(1)} days (${(totalPetSec18 / (86400 * 30.5)).toFixed(1)} months)`);
console.log(`TOTAL PET TIME FOR TH19: ${(totalPetSec19 / 86400).toFixed(1)} days (${(totalPetSec19 / (86400 * 30.5)).toFixed(1)} months)`);
console.log(`========================================`);
