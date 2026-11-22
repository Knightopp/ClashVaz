const fs = require('fs');

const LOCAL_BUILDING_ASSETS = {
  'town hall': { folder: 'Town_Hall', prefix: 'Town_Hall', ext: '.png', levels: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19] },
  'cannon': { folder: 'Cannon_Home_Village', prefix: 'level-', ext: '.png', levels: [1,2,3,11,21] },
  'archer tower': { folder: 'Archer_Tower_Home_Village', prefix: 'level-', ext: '.png', levels: [1,2,3,11,21] },
  'mortar': { folder: 'Mortar', prefix: 'level-', ext: '.png', levels: [1,2,3,10,18] },
  'air defense': { folder: 'Air_Defense', prefix: 'level-', ext: '.png', levels: [1,2,3,9,17] },
  'wizard tower': { folder: 'Wizard_Tower', prefix: 'level-', ext: '.png', levels: [1,2,3,9,17] },
  'air sweeper': { folder: 'Air_Sweeper', prefix: 'level-', ext: '.png', levels: [1,2,4,7] },
  'hidden tesla': { folder: 'Hidden_Tesla_Home_Village', prefix: 'level-', ext: '.png', levels: [1,2,10,18] },
  'bomb tower': { folder: 'Bomb_Tower', prefix: 'level-', ext: '.png', levels: [1,2,7,13] },
  'x-bow': { folder: 'X-Bow_Home_Village', prefix: 'level-', ext: '.png', levels: [1,2,7,13] },
  'inferno tower': { folder: 'Inferno_Tower_Home_Village', prefix: 'level-', ext: '.png', levels: [1,2,7,12] },
  'eagle artillery': { folder: 'Eagle_Artillery', prefix: 'level-', ext: '.png', levels: [1,2,4,7] },
  'scattershot': { folder: 'Scattershot', prefix: 'level-', ext: '.png', levels: [1,2,4,7] },
  'spell tower': { folder: 'Spell_Tower', prefix: 'level-', ext: '.png', levels: [1,2,3,4] },
  'monolith': { folder: 'Monolith', prefix: 'level-', ext: '.png', levels: [1,2,3,5] },
  'multi-archer tower': { folder: 'Multi-Archer_Tower', prefix: 'level-', ext: '.png', levels: [1,2,3,5] },
  'ricochet cannon': { folder: 'Ricochet_Cannon', prefix: 'level-', ext: '.png', levels: [1,2,3,5] },
  'multi-gear tower': { folder: 'Multi-Gear_Tower', prefix: 'level-', ext: '.png', levels: [1,2,3,4] },
  'firespitter': { folder: 'Firespitter', prefix: 'level-', ext: '.png', levels: [1,2,3] },
  'revenge tower': { folder: 'Revenge_Tower', prefix: 'level-', ext: '.png', levels: [1,2] },
  'super wizard tower': { folder: 'Super_Wizard_Tower', prefix: 'level-', ext: '.png', levels: [1,2] },
  'spiky tower': { folder: 'Spiky_Tower', prefix: 'level-', ext: '.png', levels: [1,2] },
  'firecracker tower': { folder: 'Firecracker_Tower', prefix: 'level-', ext: '.png', levels: [1,2] },
  'hot candle': { folder: 'Hot_Candle', prefix: 'level-', ext: '.png', levels: [6,10] },
  'hero hunter': { folder: 'Hero_Hunter', prefix: 'level-', ext: '.png', levels: [6,10] },
  'cake-a-pult': { folder: 'Cake-A-Pult', prefix: 'level-', ext: '.png', levels: [6,10] },
  'army camp': { folder: 'Army_Camp_Home_Village', prefix: 'level-', ext: '.png', levels: [1,2,8,14] },
  'barracks': { folder: 'Barracks', prefix: 'level-', ext: '.png', levels: [1,2,10,19] },
  'dark barracks': { folder: 'Dark_Barracks', prefix: 'level-', ext: '.png', levels: [1,2,7,13] },
  'laboratory': { folder: 'Laboratory', prefix: 'level-', ext: '.png', levels: [1,2,9,17] },
  'spell factory': { folder: 'Spell_Factory', prefix: 'level-', ext: '.png', levels: [1,2,6,10] },
  'dark spell factory': { folder: 'Dark_Spell_Factory', prefix: 'level-', ext: '.png', levels: [1,2,5,8] },
  'blacksmith': { folder: 'Blacksmith', prefix: 'level-', ext: '.png', levels: [1,2,6,10] },
  'squad barracks': { folder: 'Squad_Barracks', prefix: 'level-', ext: '.png', levels: [1,2,7] },
  'workshop': { folder: 'Workshop', prefix: 'level-', ext: '.png', levels: [1,2,5,9] },
  'pet house': { folder: 'Pet_House', prefix: 'level-', ext: '.png', levels: [1,2,7,12] },
  'hero hall': { folder: 'Hero_Hall', prefix: 'level-', ext: '.png', levels: [1,2,7,13] },
  "builder's hut": { folder: "Builder's_Hut", prefix: 'level-', ext: '.png', levels: [1,2,5,9] },
  'gold mine': { folder: 'Gold_Mine_Home_Village', prefix: 'level-', ext: '.png', levels: [1,2,9,17] },
  'elixir collector': { folder: 'Elixir_Collector_Home_Village', prefix: 'level-', ext: '.png', levels: [1,2,9,17] },
  'gold storage': { folder: 'Gold_Storage_Home_Village', prefix: 'level-', ext: '.png', levels: [2,11,20] },
  'elixir storage': { folder: 'Elixir_Storage_Home_Village', prefix: 'level-', ext: '.png', levels: [1,2,11] },
  'dark elixir drill': { folder: 'Dark_Elixir_Drill', prefix: 'level-', ext: '.png', levels: [1,2,6,11] },
  'dark elixir storage': { folder: 'Dark_Elixir_Storage', prefix: 'level-', ext: '.png', levels: [14] },
  'clan castle': { folder: 'Clan_Castle', prefix: 'level-', ext: '.png', levels: [1,2,8,15] },
  'bomb': { folder: 'Bomb', prefix: 'level-', ext: '.png', levels: [1,2,8,14] },
  'spring trap': { folder: 'Spring_Trap_Home_Village', prefix: 'level-', ext: '.png', levels: [1,2,8,14] },
  'giant bomb': { folder: 'Giant_Bomb', prefix: 'level-', ext: '.png', levels: [1,2,7,12] },
  'air bomb': { folder: 'Air_Bomb', prefix: 'level-', ext: '.png', levels: [1,2,7,13] },
  'seeking air mine': { folder: 'Seeking_Air_Mine', prefix: 'level-', ext: '.png', levels: [1,2,5,8] },
  'skeleton trap': { folder: 'Skeleton_Trap', prefix: 'level-', ext: '.png', levels: [1,2,3,5] },
  'giga bomb': { folder: 'Giga_Bomb', prefix: 'level-', ext: '.png', levels: [1,2,3,4] }
};

const SORTED_BUILDING_KEYS = Object.keys(LOCAL_BUILDING_ASSETS).sort((a, b) => b.length - a.length);

const HERO_ICONS = {
  'barbarian king': '/downloads/images/Heroes/barbarian_king.webp',
  'archer queen': '/downloads/images/Heroes/archer_queen.webp',
  'grand warden': '/downloads/images/Heroes/grand_warden.webp',
  'royal champion': '/downloads/images/Heroes/royal_champion.webp',
  'minion prince': '/downloads/images/Heroes/minion_prince.webp',
  'dragon duke': '/downloads/images/Heroes/dragon_duke.webp'
};

function getBuildingOrEntityIcon(rawName, targetLevel) {
  if (!rawName) return '/downloads/images/ui/hammer_building.png';
  let name = String(rawName).trim();
  const lower = name.toLowerCase();

  for (const [hName, hPath] of Object.entries(HERO_ICONS)) {
    if (lower.includes(hName)) return hPath;
  }

  if (lower.includes('town hall') || lower.includes('townhall')) {
    const lvl = Math.min(19, Math.max(1, targetLevel || 18));
    return '/downloads/images/Town_Hall/Town_Hall' + lvl + '.png';
  }

  if (lower.includes('(pet house)') || lower.includes('(pet)')) {
    const cleanPet = lower.replace(/\(pet house\)/g, '').replace(/\(pet\)/g, '').trim().replace(/[^a-z0-9]/g, '_');
    return '/downloads/images/pets/' + cleanPet + '.webp';
  }

  if (lower.includes('(laboratory)') || lower.includes('(lab)')) {
    const cleanLab = lower.replace(/\(laboratory\)/g, '').replace(/\(lab\)/g, '').trim().replace(/[^a-z0-9]/g, '_');
    const pTroop = 'downloads/images/troops/' + cleanLab + '.webp';
    const pSpell = 'downloads/images/spells/' + cleanLab + '.webp';
    if (fs.existsSync(pTroop)) return '/' + pTroop.replace(/\\/g, '/');
    if (fs.existsSync(pSpell)) return '/' + pSpell.replace(/\\/g, '/');
    return '/downloads/images/troops/' + cleanLab + '.webp';
  }

  const cleanAlpha = lower.replace('/home village', '').replace('home village', '').replace(/[^a-z0-9]/g, '');
  for (const bKey of SORTED_BUILDING_KEYS) {
    const keyAlpha = bKey.replace(/[^a-z0-9]/g, '');
    if (cleanAlpha.includes(keyAlpha)) {
      const info = LOCAL_BUILDING_ASSETS[bKey];
      const lvl = targetLevel || info.levels[info.levels.length - 1];
      let closest = info.levels[0];
      let minDiff = Math.abs(closest - lvl);
      for (const l of info.levels) {
        const diff = Math.abs(l - lvl);
        if (diff < minDiff) {
          minDiff = diff;
          closest = l;
        }
      }
      return '/downloads/images/' + info.folder + '/' + info.prefix + closest + info.ext;
    }
  }

  return '/downloads/images/ui/hammer_building.png';
}

console.log('Wizard Tower Lv 17 ->', getBuildingOrEntityIcon('Wizard Tower', 17));
console.log('Wizard Tower Lv 16 ->', getBuildingOrEntityIcon('Wizard Tower', 16));
console.log('X-Bow Lv 13 ->', getBuildingOrEntityIcon('X-Bow', 13));
console.log('Army Camp Lv 14 ->', getBuildingOrEntityIcon('Army Camp', 14));
console.log('Gold Storage Lv 19 ->', getBuildingOrEntityIcon('Gold Storage', 19));
console.log('Spirit Fox (Pet House) Lv 9 ->', getBuildingOrEntityIcon('Spirit Fox (Pet House)', 9));
console.log('Barbarian (Laboratory) Lv 11 ->', getBuildingOrEntityIcon('Barbarian (Laboratory)', 11));
console.log('Ice Golem (Laboratory) Lv 9 ->', getBuildingOrEntityIcon('Ice Golem (Laboratory)', 9));
console.log('Barbarian King Lv 85 ->', getBuildingOrEntityIcon('Barbarian King', 85));
console.log('Town Hall Lv 18 ->', getBuildingOrEntityIcon('Town Hall', 18));
console.log('Squad Barracks Lv 1 ->', getBuildingOrEntityIcon('Squad Barracks', 1));
