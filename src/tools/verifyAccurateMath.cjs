const fs = require('fs');

const off = JSON.parse(fs.readFileSync('data/official_sc_progression.json', 'utf8'));
const prof = JSON.parse(fs.readFileSync('data/village_profiles.json', 'utf8'));
const cp = prof.currentProfile;

console.log('Testing accurate math for target TH18 and TH19:');

function calculateExact(targetTH, calcBuilders = 6, calcHeroBuilders = 2, builderBoost = 0, researchBoost = 0) {
  const boostFactor = 1 - (builderBoost / 100);
  const resFactor = 1 - (researchBoost / 100);
  const structBuilders = Math.max(1, calcBuilders - calcHeroBuilders);

  // 1. Heroes
  let totalHeroSec = 0;
  const heroBreakdown = [];
  off.heroes.forEach(h => {
    const userH = cp.heroes.find(x => x.data === h.id);
    const curLvl = userH ? userH.lvl : 0;
    const maxLvl = h.maxPerTH[targetTH] || 0;
    let sec = 0;
    for (let l = curLvl + 1; l <= maxLvl; l++) {
      const ld = h.levels.find(x => x.level === l);
      if (ld) sec += ld.upgrade_time;
    }
    totalHeroSec += sec;
    heroBreakdown.push({
      name: h.name,
      curLvl,
      maxLvl,
      left: Math.max(0, maxLvl - curLvl),
      days: (sec / 86400).toFixed(1)
    });
  });

  // 2. Lab (Troops + Spells)
  let totalLabSec = 0;
  off.troops.forEach(t => {
    const userT = cp.troops.find(x => x.data === t.id);
    const curLvl = userT ? userT.lvl : 0;
    const maxLvl = t.maxPerTH[targetTH] || 0;
    for (let l = curLvl + 1; l <= maxLvl; l++) {
      const ld = t.levels.find(x => x.level === l);
      if (ld) totalLabSec += ld.upgrade_time;
    }
  });
  off.spells.forEach(s => {
    const userS = cp.spells.find(x => x.data === s.id);
    const curLvl = userS ? userS.lvl : 0;
    const maxLvl = s.maxPerTH[targetTH] || 0;
    for (let l = curLvl + 1; l <= maxLvl; l++) {
      const ld = s.levels.find(x => x.level === l);
      if (ld) totalLabSec += ld.upgrade_time;
    }
  });

  // Effective times
  const effHeroSec = calcHeroBuilders > 0 ? (totalHeroSec * boostFactor) / calcHeroBuilders : 0;
  const effLabSec = totalLabSec * resFactor;

  console.log(`\n=== RESULTS FOR TH${targetTH} (${calcBuilders} builders, ${calcHeroBuilders} on heroes, boost B:${builderBoost}% R:${researchBoost}%) ===`);
  console.log(`Raw Hero Days: ${(totalHeroSec / 86400).toFixed(1)} days | Effective Hero Time: ${(effHeroSec / 86400).toFixed(1)} days (${(effHeroSec / (86400 * 30.5)).toFixed(1)} mo)`);
  console.log(`Raw Lab Days: ${(totalLabSec / 86400).toFixed(1)} days | Effective Lab Time: ${(effLabSec / 86400).toFixed(1)} days (${(effLabSec / (86400 * 30.5)).toFixed(1)} mo)`);
  console.log('Hero breakdown:');
  console.table(heroBreakdown);
}

calculateExact(18, 6, 2, 0, 0);
calculateExact(18, 6, 2, 20, 20);
calculateExact(19, 6, 2, 0, 0);
calculateExact(19, 6, 2, 20, 20);
