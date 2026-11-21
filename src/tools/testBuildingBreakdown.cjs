const fs = require('fs');

const off = JSON.parse(fs.readFileSync('data/official_sc_progression.json', 'utf8'));
const prof = JSON.parse(fs.readFileSync('data/village_profiles.json', 'utf8'));
const thp = JSON.parse(fs.readFileSync('data/th_progression.json', 'utf8'));
const cp = prof.currentProfile;

const th18p = thp.find(p => p.townHall === 18);
const villageBuildings = cp.buildings || [];
const activeUpgrades = cp.activeUpgrades || [];

function getVillageBuildingInstances(bldgName) {
  const instances = [];
  const cleanTarget = (bldgName || '').toLowerCase().replace(/\/home village/i, '').replace(/[^a-z0-9]/g, '');
  villageBuildings.forEach(vb => {
    const vbClean = (vb.name || '').toLowerCase().replace(/\/home village/i, '').replace(/[^a-z0-9]/g, '');
    const vbIdClean = (vb.buildingId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (vbClean === cleanTarget || vbIdClean === cleanTarget) {
      const q = vb.quantity || vb.cnt || 1;
      const lvl = vb.level !== undefined ? vb.level : (vb.lvl !== undefined ? vb.lvl : 0);
      for (let i = 0; i < q; i++) {
        instances.push({ level: lvl, timer: vb.timer || 0 });
      }
    }
  });
  return instances;
}

console.log('Testing breakdown for all buildings at TH18:');
const rows = [];

th18p.buildings.forEach(pb => {
  if (pb.name.toLowerCase() === 'wall') return;
  const cleanName = pb.name.toLowerCase().replace(/\/home village/i, '').trim();
  const qty = (pb.quantity !== undefined) ? pb.quantity : 1;
  if (qty <= 0) return; // skip merged

  const ckBldg = off.buildings.find(b => b.name.toLowerCase().trim() === cleanName);
  const targetMaxLvl = ckBldg?.maxPerTH[18] || pb.maxAvailableLevel;

  const instances = getVillageBuildingInstances(cleanName);
  const totalOwned = instances.length;
  const effectiveQty = Math.max(qty, totalOwned);

  // Group owned levels for clean summary
  const lvlCounts = {};
  instances.forEach(ins => {
    lvlCounts[ins.level] = (lvlCounts[ins.level] || 0) + 1;
  });

  // If user owns fewer than allowed quantity, remaining are level 0
  if (instances.length < effectiveQty) {
    const unbuilt = effectiveQty - instances.length;
    lvlCounts[0] = (lvlCounts[0] || 0) + unbuilt;
  }

  // Format level breakdown string
  const sortedLvls = Object.keys(lvlCounts).map(Number).sort((a, b) => b - a);
  let curLvlStr = '';
  if (sortedLvls.length === 1) {
    curLvlStr = `Level ${sortedLvls[0]} (${effectiveQty}x)`;
  } else {
    curLvlStr = sortedLvls.map(l => `${lvlCounts[l]}x Lv ${l}`).join(', ');
  }

  // Compute levels remaining and upgrade time across ALL instances
  let totalLevelsRemaining = 0;
  let totalEffectiveSec = 0;
  let currentLevelsSum = 0;
  const maxLevelsSum = effectiveQty * targetMaxLvl;

  // Track active upgrades for this building type
  const matchingActive = activeUpgrades.filter(u => 
    (u.name || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanName.replace(/[^a-z0-9]/g, ''))
  );
  const activeCount = matchingActive.length;

  for (let i = 0; i < effectiveQty; i++) {
    const insLvl = instances[i] ? instances[i].level : 0;
    currentLevelsSum += insLvl;
    if (insLvl < targetMaxLvl) {
      totalLevelsRemaining += (targetMaxLvl - insLvl);
      for (let l = insLvl + 1; l <= targetMaxLvl; l++) {
        const ld = ckBldg?.levels?.find(lvl => lvl.level === l);
        if (ld && ld.build_time > 0) {
          totalEffectiveSec += ld.build_time;
        } else {
          totalEffectiveSec += (10 * 86400);
        }
      }
    }
  }

  const progressPct = maxLevelsSum > 0 ? Math.min(100, Math.round((currentLevelsSum / maxLevelsSum) * 100)) : 100;
  const days = (totalEffectiveSec / 86400).toFixed(1);

  rows.push({
    name: pb.name,
    qty: effectiveQty,
    curLvlStr,
    maxLvl: `Level ${targetMaxLvl} (${effectiveQty}x)`,
    levelsLeft: `+${totalLevelsRemaining} lvls`,
    days: `${days}d`,
    active: activeCount > 0 ? `${activeCount} Active` : 'Ready',
    pct: `${progressPct}%`
  });
});

console.table(rows.slice(0, 15));
console.table(rows.slice(15, 30));
