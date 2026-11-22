const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'public', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original content length:', content.length);

// 1. CSS Overflow Fixes for Heroes and Cards
// Replace .heroes-grid and related hero CSS
const oldHeroCssRegex = /\.heroes-grid\s*\{[\s\S]*?\.hero-status-pill\s*\{[\s\S]*?padding:\s*3px\s*8px;[\s\S]*?\}/;
const newHeroCss = `.heroes-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 10px;
      width: 100%;
      box-sizing: border-box;
    }

    .hero-card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
      transition: all 0.15s ease;
      min-width: 0 !important;
      width: 100% !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }

    .hero-card:hover {
      border-color: #3f3f46;
      background: #1c1c20;
    }

    .hero-card.upgrading {
      border-color: #52525b;
      background: #1c1c22;
    }

    .hero-header-row {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0 !important;
      width: 100% !important;
      overflow: hidden !important;
    }

    .hero-avatar-img {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      object-fit: contain;
      background: #09090b;
      border: 1px solid #27272a;
      flex-shrink: 0;
    }

    .hero-info-wrap {
      display: flex;
      flex-direction: column;
      min-width: 0 !important;
      flex: 1 1 auto !important;
      overflow: hidden !important;
    }

    .hero-name {
      font-size: 12px;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
      min-width: 0 !important;
    }

    .hero-level-txt {
      font-size: 11px;
      font-weight: 800;
      color: #a1a1aa;
      font-family: 'Lilita One', cursive, sans-serif;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
      min-width: 0 !important;
    }

    .hero-level-max {
      font-size: 10px;
      color: #52525b;
    }

    .hero-progress-bar {
      width: 100%;
      height: 4px;
      background: #27272a;
      border-radius: 9999px;
      overflow: hidden;
    }

    .hero-progress-fill {
      height: 100%;
      background: #ffffff;
      border-radius: 9999px;
    }

    .hero-status-pill {
      font-size: 10px;
      font-weight: 700;
      color: #a1a1aa;
      background: #27272a;
      padding: 3px 8px;
      border-radius: 9999px;
      text-align: center;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      min-width: 0 !important;
    }`;

content = content.replace(oldHeroCssRegex, newHeroCss);

// Replace media queries for max-width: 900px and 600px
const oldMediaQueryRegex = /@media\s*\(max-width:\s*900px\)\s*\{[\s\S]*?@media\s*\(max-width:\s*600px\)\s*\{[\s\S]*?\.hero-status-pill\s*\{[\s\S]*?padding:\s*2px\s*6px\s*!important;\s*\}\s*\}/;
const newMediaQuery = `@media (max-width: 900px) {
      .center-content {
        padding: 12px;
      }

      .mobile-bottom-nav {
        display: flex;
      }

      .left-sidebar {
        display: none;
      }

      .right-rail {
        display: none;
      }

      .modal-card {
        max-width: 95vw;
        margin: 10px;
      }

      .heroes-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 8px !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
    }

    @media (max-width: 600px) {
      .heroes-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 6px !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .hero-card {
        padding: 8px !important;
        min-width: 0 !important;
        width: 100% !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
      }
      .hero-header-row {
        gap: 6px !important;
        min-width: 0 !important;
        width: 100% !important;
        overflow: hidden !important;
      }
      .hero-avatar-img {
        width: 32px !important;
        height: 32px !important;
        flex-shrink: 0 !important;
      }
      .hero-info-wrap {
        min-width: 0 !important;
        flex: 1 1 auto !important;
        overflow: hidden !important;
      }
      .hero-name {
        font-size: 11px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        display: block !important;
        min-width: 0 !important;
      }
      .hero-level-chip {
        font-size: 10px !important;
      }
      .hero-level-txt {
        font-size: 10px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        display: block !important;
        min-width: 0 !important;
      }
      .hero-status-pill {
        font-size: 9px !important;
        padding: 2px 6px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        display: block !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        min-width: 0 !important;
      }
    }`;

content = content.replace(oldMediaQueryRegex, newMediaQuery);

// 2. Insert Master Image Resolver Definition
const resolverDefs = `
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

    const HERO_LOCAL_ICONS = {
      'barbarian king': '/downloads/images/Heroes/barbarian_king.webp',
      'archer queen': '/downloads/images/Heroes/archer_queen.webp',
      'grand warden': '/downloads/images/Heroes/grand_warden.webp',
      'royal champion': '/downloads/images/Heroes/royal_champion.webp',
      'minion prince': '/downloads/images/Heroes/minion_prince.webp',
      'dragon duke': '/downloads/images/Heroes/dragon_duke.webp'
    };

    const KNOWN_SPELL_SLUGS = [
      'lightning_spell', 'healing_spell', 'rage_spell', 'jump_spell',
      'freeze_spell', 'poison_spell', 'earthquake_spell', 'haste_spell',
      'clone_spell', 'skeleton_spell', 'bat_spell', 'invisibility_spell',
      'recall_spell', 'overgrowth_spell', 'bag_of_frostmites', 'revive_spell',
      'ice_block_spell', 'totem_spell', 'angry_spell', 'heroic_spell'
    ];

    function getBuildingOrEntityIcon(rawName, targetLevel, category, type) {
      if (!rawName) return '/downloads/images/ui/hammer_building.png';
      const name = String(rawName).trim();
      const lower = name.toLowerCase();

      // 1. Heroes
      for (const [hName, hPath] of Object.entries(HERO_LOCAL_ICONS)) {
        if (lower.includes(hName)) return hPath;
      }

      // 2. Town Hall
      if (lower.includes('town hall') || lower.includes('townhall')) {
        const lvl = Math.min(19, Math.max(1, targetLevel || (typeof currentTH !== 'undefined' ? currentTH : 18)));
        return '/downloads/images/Town_Hall/Town_Hall' + lvl + '.png';
      }

      // 3. Pet House Upgrades
      if (lower.includes('(pet house)') || lower.includes('(pet)') || category === 'Pet' || type === 'pet') {
        const cleanPet = lower.replace(/\\(pet house\\)/g, '').replace(/\\(pet\\)/g, '').trim().replace(/[^a-z0-9]/g, '_');
        return '/downloads/images/pets/' + cleanPet + '.webp';
      }

      // 4. Laboratory Upgrades (Troops & Spells)
      if (lower.includes('(laboratory)') || lower.includes('(lab)') || category === 'Lab' || type === 'lab') {
        const cleanLab = lower.replace(/\\(laboratory\\)/g, '').replace(/\\(lab\\)/g, '').trim().replace(/[^a-z0-9]/g, '_');
        if (KNOWN_SPELL_SLUGS.includes(cleanLab)) {
          return '/downloads/images/spells/' + cleanLab + '.webp';
        }
        return '/downloads/images/troops/' + cleanLab + '.webp';
      }

      // 5. Buildings / Defenses / Traps
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
`;

const proxyMarker = 'const FALLBACK_ICON = FALLBACK_DEFENSE;';
content = content.replace(proxyMarker, proxyMarker + '\n' + resolverDefs);

// 3. Update getProxyUrl and handleImgError
const oldProxyRegex = /function getProxyUrl\(url\) \{[\s\S]*?return `\/api\/proxy-image\?url=\$\{encodeURIComponent\(clean\)\}`;[\s\S]*?\}/;
const newProxy = `function getProxyUrl(url) {
      if (!url || typeof url !== 'string' || url.trim() === '') {
        return '';
      }
      const clean = url.trim();
      if (clean.startsWith('/downloads/') || clean.startsWith('/') || clean.startsWith('data:')) {
        return clean;
      }
      const lower = clean.toLowerCase();
      for (let i = 1; i <= 19; i++) {
        if (lower.includes('town_hall' + i + '.') || lower.includes('town_hall' + i + '_') || lower.includes('townhall' + i + '.')) {
          return '/downloads/images/Town_Hall/Town_Hall' + i + '.png';
        }
      }
      if (lower.includes('barbarian_king')) return '/downloads/images/Heroes/barbarian_king.webp';
      if (lower.includes('archer_queen')) return '/downloads/images/Heroes/archer_queen.webp';
      if (lower.includes('grand_warden')) return '/downloads/images/Heroes/grand_warden.webp';
      if (lower.includes('royal_champion')) return '/downloads/images/Heroes/royal_champion.webp';
      if (lower.includes('minion_prince')) return '/downloads/images/Heroes/minion_prince.webp';
      if (lower.includes('dragon_duke')) return '/downloads/images/Heroes/dragon_duke.webp';

      if (lower.includes('troops/')) {
        const match = lower.match(/troops\/([a-z0-9_\\-]+)/);
        if (match) {
          const s = match[1].replace(/-/g, '_');
          return '/downloads/images/troops/' + s + '.webp';
        }
      }
      if (lower.includes('pets/')) {
        const match = lower.match(/pets\/([a-z0-9_\\-]+)/);
        if (match) {
          const s = match[1].replace(/-/g, '_');
          return '/downloads/images/pets/' + s + '.webp';
        }
      }
      if (lower.includes('spells/')) {
        const match = lower.match(/spells\/([a-z0-9_\\-]+)/);
        if (match) {
          const s = match[1].replace(/-/g, '_');
          return '/downloads/images/spells/' + s + '.webp';
        }
      }

      return \`/api/proxy-image?url=\${encodeURIComponent(clean)}\`;
    }`;

content = content.replace(oldProxyRegex, newProxy);

const oldImgErrorRegex = /function handleImgError\(img\) \{[\s\S]*?img\.src = FALLBACK_DEFENSE;[\s\S]*?\}/;
const newImgError = `function handleImgError(img) {
      if (!img) return;
      img.onerror = null;
      const alt = (img.alt || '').toLowerCase();
      const cls = img.className || '';
      if (alt.includes('town hall') || cls.includes('th-')) {
        img.src = '/downloads/images/Town_Hall/Town_Hall' + (typeof currentTH !== 'undefined' ? currentTH : 18) + '.png';
      } else if (alt.includes('hero') || cls.includes('hero-')) {
        img.src = '/downloads/images/Heroes/barbarian_king.webp';
      } else {
        img.src = getBuildingOrEntityIcon(img.alt || '', 1);
      }
    }`;

content = content.replace(oldImgErrorRegex, newImgError);

// 4. Update parseVillageExportClientSide for Building, Hero, Lab, Pet Upgrades
// Building active upgrades:
content = content.replace(
  `image: b.image || { url: '/downloads/images/Town_Hall/Town_Hall' + (thLevel || 18) + '.png' }`,
  `image: { url: getBuildingOrEntityIcon(name, Number(lvl) + 1, b.category, 'builder') }`
);

// Lab active upgrades:
content = content.replace(
  `            upgradeEndTimestamp: Date.now() + timerSec * 1000,\n            type: 'lab'\n          });`,
  `            upgradeEndTimestamp: Date.now() + timerSec * 1000,\n            type: 'lab',\n            image: { url: getBuildingOrEntityIcon(uName, Number(lvl) + 1, 'Lab', 'lab') }\n          });`
);

// Pet active upgrades:
content = content.replace(
  `            upgradeEndTimestamp: Date.now() + timerSec * 1000,\n            type: 'pet'\n          });`,
  `            upgradeEndTimestamp: Date.now() + timerSec * 1000,\n            type: 'pet',\n            image: { url: getBuildingOrEntityIcon(pName, Number(lvl) + 1, 'Pet', 'pet') }\n          });`
);

// 5. Update renderUpgradeItemHtml & renderDynamicSchedule
const oldRenderItemRegex = /function renderUpgradeItemHtml\(upg\) \{[\s\S]*?imgSrc = lvlImg \? getProxyUrl\(lvlImg\) : '\/downloads\/images\/Cannon\/level-14\.png';\s*\}/;
const newRenderItem = `function renderUpgradeItemHtml(upg) {
      const seconds = upg.timerSeconds || 86400;
      let displayName = upg.name || 'Building';

      let imgSrc = '';
      if (upg.image && upg.image.url && !upg.image.url.includes('Town_Hall18.png') && !upg.image.url.includes('Cannon_Home_Village/level-1.png')) {
        imgSrc = getProxyUrl(upg.image.url);
      } else {
        imgSrc = getBuildingOrEntityIcon(displayName, upg.targetLevel || upg.currentLevel, upg.category, upg.type);
      }`;

content = content.replace(oldRenderItemRegex, newRenderItem);

const oldScheduleImgLookupRegex = /\/\/ Robust building image resolution \(Never fallback to generic shield!\)[\s\S]*?imgSrc = lvlImg \? getProxyUrl\(lvlImg\) : '\/downloads\/images\/Cannon\/level-14\.png';\s*\}/;
const newScheduleImgLookup = `// Robust building image resolution (Mapped to local game assets)
        let imgSrc = '';
        if (upg.image && upg.image.url && !upg.image.url.includes('Town_Hall18.png') && !upg.image.url.includes('Cannon_Home_Village/level-1.png')) {
          imgSrc = getProxyUrl(upg.image.url);
        } else {
          imgSrc = getBuildingOrEntityIcon(displayName, upg.targetLevel || upg.currentLevel, upg.category, upg.type);
        }`;

content = content.replace(oldScheduleImgLookupRegex, newScheduleImgLookup);

// 6. Profile Sanitizer to re-resolve any existing cached Town_Hall18 / Cannon images in localStorage
const sanitizerCode = `
    function sanitizeProfileUpgradeImages(p) {
      if (!p) return;
      if (Array.isArray(p.activeUpgrades)) {
        p.activeUpgrades.forEach(u => {
          if (!u.image || !u.image.url || u.image.url.includes('Town_Hall18.png') || u.image.url.includes('Cannon_Home_Village/level-1.png') || u.image.url.includes('Cannon/level-14.png')) {
            u.image = { url: getBuildingOrEntityIcon(u.name, u.targetLevel || u.currentLevel, u.category, u.type) };
          }
        });
      }
    }
`;

const initMarker = 'function initializeProfileFromStorage() {';
content = content.replace(initMarker, sanitizerCode + '\n    ' + initMarker);

// Call sanitizer inside initializeProfileFromStorage
content = content.replace(
  `currentVillageProfile = JSON.parse(stored);`,
  `currentVillageProfile = JSON.parse(stored);\n        sanitizeProfileUpgradeImages(currentVillageProfile);`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully applied fixes! New length:', content.length);
