const fs = require('fs');
const path = require('path');

// Load current profile and raw export
const profilePath = path.resolve('data/village_profiles.json');
const profilesData = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
const rawExport = profilesData.currentProfile.rawExport;

const scMap = JSON.parse(fs.readFileSync('data/sc_verified_map.json', 'utf8'));
const extBuildings = JSON.parse(fs.readFileSync('data/extracted_buildings.json', 'utf8'));

// Re-parse building records
let detectedTH = 1;
const identifiedBuildings = [];
const activeUpgrades = [];

for (const b of rawExport.buildings) {
  // CRITICAL FIX: b.lvl in CoC export is already 1-indexed for standard buildings!
  // Do NOT add +1 to b.lvl!
  const lvl = b.lvl !== undefined ? b.lvl : 1;
  const count = b.cnt !== undefined ? b.cnt : 1;
  const buildingSlug = scMap[b.data] || `structure-${b.data}`;

  let bName = buildingSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  if (buildingSlug === 'town-hall') bName = 'Town Hall';
  else if (buildingSlug === 'builder-s-hut' || buildingSlug === 'builders-hut') bName = "Builder's Hut";
  else if (buildingSlug === 'b-o-b-s-hut') bName = "B.O.B's Hut";
  else if (buildingSlug === 'x-bow') bName = 'X-Bow';

  const ext = extBuildings.find(eb => eb.name.toLowerCase().replace(/\/home village/i, '').trim() === bName.toLowerCase());

  if (buildingSlug === 'town-hall' || bName.toLowerCase() === 'town hall') {
    detectedTH = lvl; // Exactly 18!
  }

  const category = ext?.category || (buildingSlug.includes('mine') || buildingSlug.includes('collector') || buildingSlug.includes('storage') ? 'Resource' : (buildingSlug.includes('camp') || buildingSlug.includes('barracks') || buildingSlug.includes('laboratory') ? 'Army' : 'Defense'));

  identifiedBuildings.push({
    instanceId: `bldg_${buildingSlug}_${lvl}_${Math.random().toString(36).substring(2, 7)}`,
    buildingId: buildingSlug,
    name: bName,
    category,
    level: lvl,
    quantity: count,
    timer: b.timer,
    upgradeEndTimestamp: b.timer ? Date.now() + (b.timer * 1000) : undefined,
    raw: b
  });

  if (b.timer && b.timer > 0) {
    activeUpgrades.push({
      id: `${buildingSlug}-${lvl}`,
      name: bName,
      currentLevel: lvl,
      targetLevel: lvl + 1,
      timerSeconds: b.timer,
      endTimestamp: Date.now() + (b.timer * 1000),
      builderType: 'Master Builder'
    });
  }
}

console.log('Detected Town Hall Level:', detectedTH);
console.log('Total identified buildings count:', identifiedBuildings.length);
console.log('Active upgrades count:', activeUpgrades.length);
console.log('Active upgrades list:');
activeUpgrades.forEach(u => {
  const d = Math.floor(u.timerSeconds / 86400);
  const h = Math.floor((u.timerSeconds % 86400) / 3600);
  console.log(`- ${u.name} Lv ${u.currentLevel} -> Lv ${u.targetLevel} (${d > 0 ? d + 'd ' : ''}${h}h remaining)`);
});
