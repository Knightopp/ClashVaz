const fs = require('fs');
const path = require('path');

// 1. UPDATE src/parsers/villageExportParser.ts
const parserPath = path.resolve('src/parsers/villageExportParser.ts');
let parserContent = fs.readFileSync(parserPath, 'utf8');

const scMap = JSON.parse(fs.readFileSync('data/sc_verified_map.json', 'utf8'));

// Format SC_GLOBAL_ID_MAP
const scMapEntries = Object.entries(scMap).map(([id, slug]) => `  ${id}: '${slug}',`).join('\n');
const newScMapDef = `export const SC_GLOBAL_ID_MAP: Record<number, string> = {\n${scMapEntries}\n\n  // Traps (1200000 series)\n  1200000: 'bomb',\n  1200001: 'bomb',\n  1200002: 'spring-trap',\n  1200003: 'giant-bomb',\n  1200004: 'air-bomb',\n  1200005: 'seeking-air-mine',\n  1200006: 'skeleton-trap',\n  1200007: 'tornado-trap',\n  1200008: 'giga-bomb'\n};`;

// Replace SC_GLOBAL_ID_MAP
const scMapRegex = /export const SC_GLOBAL_ID_MAP: Record<number, string> = \{[\s\S]*?\n\};\n\n\/\/ Common string key aliases/;
if (!scMapRegex.test(parserContent)) {
  console.error('Could not match SC_GLOBAL_ID_MAP regex');
  process.exit(1);
}
parserContent = parserContent.replace(scMapRegex, newScMapDef + '\n\n// Common string key aliases');
console.log('Updated SC_GLOBAL_ID_MAP in villageExportParser.ts');

// Remove hasZeroLevel logic and use b.lvl directly in validateAndPreview and parseVillage
parserContent = parserContent.replace(
  /let hasZeroLevel = false;[\s\S]*?break;\s*\}\s*\}/g,
  `// b.lvl is 1-indexed in Clash of Clans export; do not offset\n    const hasZeroLevel = false;`
);

parserContent = parserContent.replace(
  /const lvl = hasZeroLevel \? \(b\.lvl \+ 1\) : b\.lvl;/g,
  `const lvl = b.lvl !== undefined ? b.lvl : 1;`
);

parserContent = parserContent.replace(
  /const lvl = hasZeroLevel \? \(t\.lvl \+ 1\) : t\.lvl;/g,
  `const lvl = t.lvl !== undefined ? t.lvl : 1;`
);

fs.writeFileSync(parserPath, parserContent, 'utf8');
console.log('Successfully updated villageExportParser.ts');

// 2. RE-PARSE AND SAVE data/village_profiles.json
const profilesPath = path.resolve('data/village_profiles.json');
const profilesData = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
const rawExport = profilesData.currentProfile.rawExport;

const extBuildings = JSON.parse(fs.readFileSync('data/extracted_buildings.json', 'utf8'));

let detectedTH = 1;
const identifiedBuildings = [];
const activeUpgrades = [];

for (const b of rawExport.buildings) {
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
    detectedTH = lvl;
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
    footprint: ext?.footprint || { width: 3, height: 3 },
    image: ext?.levels?.find(l => l.level === lvl)?.image,
    raw: b
  });

  if (b.timer && b.timer > 0) {
    const nextImg = ext?.levels?.find(l => l.level === lvl + 1)?.image || ext?.levels?.find(l => l.level === lvl)?.image;
    activeUpgrades.push({
      id: `${buildingSlug}-${lvl}`,
      name: bName,
      currentLevel: lvl,
      targetLevel: lvl + 1,
      timerSeconds: b.timer,
      endTimestamp: Date.now() + (b.timer * 1000),
      builderType: 'Master Builder',
      image: nextImg ? { filename: nextImg.filename, url: nextImg.url } : undefined
    });
  }
}

// Update current profile
profilesData.currentProfile.townHallLevel = detectedTH; // 18!
profilesData.currentProfile.buildings = identifiedBuildings;
profilesData.currentProfile.activeUpgrades = activeUpgrades;
profilesData.currentProfile.totalBuildings = identifiedBuildings.reduce((sum, b) => sum + b.quantity, 0);

// Update snapshots as well
if (profilesData.snapshots && profilesData.snapshots.length > 0) {
  profilesData.snapshots.forEach(s => {
    if (s.rawExport?.buildings) {
      const rawTh = s.rawExport.buildings.find(b => b.data === 1000001);
      if (rawTh) {
        s.townHallLevel = rawTh.lvl;
      }
    }
  });
}

fs.writeFileSync(profilesPath, JSON.stringify(profilesData, null, 2), 'utf8');
console.log(`Saved updated village_profiles.json with TH${detectedTH} and ${activeUpgrades.length} active upgrades.`);

// 3. UPDATE public/index.html with official ClashKing Hero URLs
const indexPath = path.resolve('public/index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Replace heroDefs in renderVillageHeroes with official ClashKing asset URLs
const oldHeroDefsRegex = /const heroDefs = \[[\s\S]*?maxAtTH19: 50\s*\}\s*\];/;

const newHeroDefs = `const heroDefs = [
        {
          id: 'king',
          dataId: 28000000,
          altDataId: 0,
          name: 'Barbarian King',
          icon: '/api/proxy-image?url=' + encodeURIComponent('https://assets.clashk.ing/heroes/barbarian_king/icon.webp'),
          maxAtTH18: 95,
          maxAtTH19: 100
        },
        {
          id: 'queen',
          dataId: 28000001,
          altDataId: 1,
          name: 'Archer Queen',
          icon: '/api/proxy-image?url=' + encodeURIComponent('https://assets.clashk.ing/heroes/archer_queen/icon.webp'),
          maxAtTH18: 95,
          maxAtTH19: 100
        },
        {
          id: 'warden',
          dataId: 28000002,
          altDataId: 2,
          name: 'Grand Warden',
          icon: '/api/proxy-image?url=' + encodeURIComponent('https://assets.clashk.ing/heroes/grand_warden/icon.webp'),
          maxAtTH18: 70,
          maxAtTH19: 75
        },
        {
          id: 'rc',
          dataId: 28000004,
          altDataId: 3,
          name: 'Royal Champion',
          icon: '/api/proxy-image?url=' + encodeURIComponent('https://assets.clashk.ing/heroes/royal_champion/icon.webp'),
          maxAtTH18: 45,
          maxAtTH19: 50
        },
        {
          id: 'mp',
          dataId: 28000006,
          altDataId: 4,
          name: 'Minion Prince',
          icon: '/api/proxy-image?url=' + encodeURIComponent('https://assets.clashk.ing/heroes/minion_prince/icon.webp'),
          maxAtTH18: 70,
          maxAtTH19: 80
        },
        {
          id: 'duke',
          dataId: 28000007,
          altDataId: 5,
          name: 'Dragon Duke',
          icon: '/api/proxy-image?url=' + encodeURIComponent('https://assets.clashk.ing/heroes/dragon_duke/icon.webp'),
          maxAtTH18: 40,
          maxAtTH19: 50
        }
      ];`;

if (!oldHeroDefsRegex.test(html)) {
  console.error('Could not match oldHeroDefsRegex in index.html');
  process.exit(1);
}

html = html.replace(oldHeroDefsRegex, newHeroDefs);

// Also update heroesList inside renderMaxingRoadmap to use the same official ClashKing URLs
const oldHeroesListRegex = /const heroesList = \[[\s\S]*?icon: 'https:\/\/static\.wikia\.nocookie\.net\/clashofclans\/images\/9\/95\/Dragon_Duke_teaser\.png'\s*\}\s*\];/;

const newHeroesList = `const heroesList = [
        { name: 'Barbarian King', dataId: 28000000, max: thHeroMax.king, perLvlDays: 7.5, icon: 'https://assets.clashk.ing/heroes/barbarian_king/icon.webp' },
        { name: 'Archer Queen', dataId: 28000001, max: thHeroMax.queen, perLvlDays: 7.5, icon: 'https://assets.clashk.ing/heroes/archer_queen/icon.webp' },
        { name: 'Grand Warden', dataId: 28000002, max: thHeroMax.warden, perLvlDays: 7.5, icon: 'https://assets.clashk.ing/heroes/grand_warden/icon.webp' },
        { name: 'Royal Champion', dataId: 28000004, max: thHeroMax.rc, perLvlDays: 7.5, icon: 'https://assets.clashk.ing/heroes/royal_champion/icon.webp' },
        { name: 'Minion Prince', dataId: 28000006, max: thHeroMax.mp, perLvlDays: 6, icon: 'https://assets.clashk.ing/heroes/minion_prince/icon.webp' },
        { name: 'Dragon Duke', dataId: 28000007, max: thHeroMax.duke, perLvlDays: 7, icon: 'https://assets.clashk.ing/heroes/dragon_duke/icon.webp' }
      ];`;

if (oldHeroesListRegex.test(html)) {
  html = html.replace(oldHeroesListRegex, newHeroesList);
  console.log('Updated heroesList in renderMaxingRoadmap');
}

// In renderDynamicSchedule, use upg.name directly instead of hardcoding replacements
html = html.replace(
  /let displayName = upg\.name \|\| 'Building';[\s\S]*?else if \(rawNum === '1000084'\) displayName = 'Multi-Archer Tower';\s*\}/g,
  `let displayName = upg.name || 'Building';`
);

// Ensure currentTH and selectedCalcTargetTH default strictly to 18
html = html.replace('let currentTH = 19;', 'let currentTH = 18;');
html = html.replace('let selectedCalcTargetTH = 19;', 'let selectedCalcTargetTH = 18;');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Updated public/index.html');

// 4. Synchronize with android assets (without compiling APK)
const androidIndexPath = path.resolve('android/app/src/main/assets/www/index.html');
fs.copyFileSync(indexPath, androidIndexPath);
console.log('Synchronized android assets index.html');
