const progs = require('../../data/th_progression.json');
const bldgs = require('../../data/extracted_buildings.json');
const prof = require('../../data/village_profiles.json').currentProfile;

const th18 = progs.find(p => p.townHall === 18);
const villageBuildings = [...(prof.buildings || []), ...(prof.traps || [])];

function getLevels(name) {
  const clean = name.toLowerCase().replace(/\/home village/i, '').replace(/[^a-z0-9]/g, '');
  const res = [];
  villageBuildings.forEach(vb => {
    const vbClean = (vb.name || '').toLowerCase().replace(/\/home village/i, '').replace(/[^a-z0-9]/g, '');
    if (vbClean === clean) {
      const q = vb.quantity || 1;
      const lvl = vb.level !== undefined ? vb.level : 0;
      for (let i = 0; i < q; i++) res.push(lvl);
    }
  });
  return res;
}

let rawSecWithMerged = 0;
let rawSecClean = 0;

th18.buildings.forEach(pb => {
  if (pb.name === 'Wall') return;
  const bData = bldgs.find(b => b.name.toLowerCase().replace(/\/home village/i, '').trim() === pb.name.toLowerCase().trim());
  if (!bData || !bData.levels) return;

  const owned = getLevels(pb.name);

  // Old bugged way (treating 0 as 1):
  const qtyWithBug = pb.quantity || 1;
  for (let i = 0; i < qtyWithBug; i++) {
    const cur = owned[i] !== undefined ? owned[i] : (owned[0] || 0);
    for (let l = cur + 1; l <= pb.maxAvailableLevel; l++) {
      const lvlData = bData.levels.find(lv => lv.level === l);
      rawSecWithMerged += (lvlData && lvlData.upgradeTimeSeconds) || (12 * 86400);
    }
  }

  // Clean way:
  const qtyReal = (pb.quantity !== undefined) ? pb.quantity : 1;
  for (let i = 0; i < qtyReal; i++) {
    const cur = owned[i] !== undefined ? owned[i] : (owned[0] || 0);
    for (let l = cur + 1; l <= pb.maxAvailableLevel; l++) {
      const lvlData = bData.levels.find(lv => lv.level === l);
      rawSecClean += (lvlData && lvlData.upgradeTimeSeconds) || (12 * 86400);
    }
  }
});

console.log('Builder days WITH bug (counting merged buildings):', Math.round(rawSecWithMerged / 86400));
console.log('Builder days CLEAN (omitting merged buildings):', Math.round(rawSecClean / 86400));
console.log('Difference:', Math.round((rawSecWithMerged - rawSecClean) / 86400), 'days');
