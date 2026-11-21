const fs = require('fs');

const ck = JSON.parse(fs.readFileSync('data/clashking_static_data.json', 'utf8'));

console.log('Generating complete official_sc_progression.json...');

// 1. Heroes
const officialHeroes = [];
const homeHeroes = ck.heroes.filter(h => h.village === 'home');

homeHeroes.forEach(h => {
  const maxPerTH = {};
  for (let th = 1; th <= 19; th++) {
    const validLevels = h.levels.filter(l => l.required_townhall <= th);
    maxPerTH[th] = validLevels.length > 0 ? Math.max(...validLevels.map(l => l.level)) : 0;
  }

  const levels = h.levels.map(l => ({
    level: l.level,
    upgrade_time: l.upgrade_time,
    upgrade_cost: l.upgrade_cost,
    required_townhall: l.required_townhall
  }));

  const slug = h.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  officialHeroes.push({
    id: h._id,
    name: h.name,
    icon: `https://assets.clashk.ing/heroes/${slug}/icon.webp`,
    maxPerTH,
    levels
  });
});

// 2. Troops
const officialTroops = [];
const homeTroops = ck.troops.filter(t => t.village === 'home');

homeTroops.forEach(t => {
  const maxPerTH = {};
  for (let th = 1; th <= 19; th++) {
    const validLevels = t.levels.filter(l => l.required_townhall <= th);
    maxPerTH[th] = validLevels.length > 0 ? Math.max(...validLevels.map(l => l.level)) : 0;
  }

  const levels = t.levels.map(l => ({
    level: l.level,
    upgrade_time: l.upgrade_time,
    upgrade_cost: l.upgrade_cost,
    required_townhall: l.required_townhall
  }));

  const slug = t.name.toLowerCase()
    .replace(/p\.e\.k\.k\.a/i, 'pekka')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  officialTroops.push({
    id: t._id,
    name: t.name,
    icon: `https://assets.clashk.ing/troops/${slug}/icon.webp`,
    maxPerTH,
    levels
  });
});

// 3. Spells
const officialSpells = [];
ck.spells.forEach(s => {
  const maxPerTH = {};
  for (let th = 1; th <= 19; th++) {
    const validLevels = s.levels.filter(l => l.required_townhall <= th);
    maxPerTH[th] = validLevels.length > 0 ? Math.max(...validLevels.map(l => l.level)) : 0;
  }

  const levels = s.levels.map(l => ({
    level: l.level,
    upgrade_time: l.upgrade_time,
    upgrade_cost: l.upgrade_cost,
    required_townhall: l.required_townhall
  }));

  const slug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  officialSpells.push({
    id: s._id,
    name: s.name,
    icon: `https://assets.clashk.ing/spells/${slug}.webp`,
    maxPerTH,
    levels
  });
});

// 4. Pets
const officialPets = [];
ck.pets.forEach(p => {
  const maxPerTH = {};
  for (let th = 1; th <= 19; th++) {
    const validLevels = p.levels.filter(l => l.required_townhall <= th);
    maxPerTH[th] = validLevels.length > 0 ? Math.max(...validLevels.map(l => l.level)) : 0;
  }

  const levels = p.levels.map(l => ({
    level: l.level,
    upgrade_time: l.upgrade_time,
    upgrade_cost: l.upgrade_cost,
    required_townhall: l.required_townhall
  }));

  const slug = p.name.toLowerCase()
    .replace(/l\.a\.s\.s\.i/i, 'lassi')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  officialPets.push({
    id: p._id,
    name: p.name,
    icon: `https://assets.clashk.ing/pets/${slug}/icon.webp`,
    maxPerTH,
    levels
  });
});

// 5. Buildings
const officialBuildings = [];
const homeBuildings = ck.buildings.filter(b => b.village === 'home');

homeBuildings.forEach(b => {
  const maxPerTH = {};
  for (let th = 1; th <= 19; th++) {
    const validLevels = b.levels.filter(l => l.required_townhall <= th);
    maxPerTH[th] = validLevels.length > 0 ? Math.max(...validLevels.map(l => l.level)) : 0;
  }

  const levels = b.levels.map(l => ({
    level: l.level,
    build_time: l.build_time,
    build_cost: l.build_cost,
    required_townhall: l.required_townhall
  }));

  officialBuildings.push({
    id: b._id,
    name: b.name,
    type: b.type,
    maxPerTH,
    levels
  });
});

const output = {
  version: '2.0',
  generatedAt: new Date().toISOString(),
  heroes: officialHeroes,
  troops: officialTroops,
  spells: officialSpells,
  pets: officialPets,
  buildings: officialBuildings
};

fs.writeFileSync('data/official_sc_progression.json', JSON.stringify(output, null, 2), 'utf8');
console.log('Saved data/official_sc_progression.json successfully with verified icons!');
