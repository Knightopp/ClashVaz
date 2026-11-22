const fs = require('fs');

const path = 'public/index.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Add getOfficialTotalDuration right before `// State`
const anchor = '// State\n    let allBuildings = [];';
if (!content.includes('function getOfficialTotalDuration(')) {
  const funcCode = `    function getOfficialTotalDuration(name, targetLvl, type) {
      if (!window.OFFICIAL_SC_DATA) return 0;
      try {
        const cleanName = (name || '').toLowerCase().trim();
        if (type === 'hero' && window.OFFICIAL_SC_DATA.heroes) {
          const h = window.OFFICIAL_SC_DATA.heroes.find(x => cleanName.includes(x.name.toLowerCase()));
          if (h && h.levels) {
            const l = h.levels.find(lvl => lvl.level === targetLvl);
            if (l && l.upgrade_time) return l.upgrade_time;
          }
        }
        if (type === 'pet' && window.OFFICIAL_SC_DATA.pets) {
          const p = window.OFFICIAL_SC_DATA.pets.find(x => cleanName.includes(x.name.toLowerCase()));
          if (p && p.levels) {
            const l = p.levels.find(lvl => lvl.level === targetLvl);
            if (l && l.upgrade_time) return l.upgrade_time;
          }
        }
        if (type === 'lab') {
          if (window.OFFICIAL_SC_DATA.troops) {
            const t = window.OFFICIAL_SC_DATA.troops.find(x => cleanName.includes(x.name.toLowerCase()));
            if (t && t.levels) {
              const l = t.levels.find(lvl => lvl.level === targetLvl);
              if (l && l.upgrade_time) return l.upgrade_time;
            }
          }
          if (window.OFFICIAL_SC_DATA.spells) {
            const s = window.OFFICIAL_SC_DATA.spells.find(x => cleanName.includes(x.name.toLowerCase()));
            if (s && s.levels) {
              const l = s.levels.find(lvl => lvl.level === targetLvl);
              if (l && l.upgrade_time) return l.upgrade_time;
            }
          }
        }
        if (window.OFFICIAL_SC_DATA.buildings) {
          const b = window.OFFICIAL_SC_DATA.buildings.find(x => cleanName.includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(cleanName));
          if (b && b.levels) {
            const l = b.levels.find(lvl => lvl.level === targetLvl);
            if (l && l.build_time) return l.build_time;
          }
        }
      } catch (e) {}
      return 0;
    }

`;
  content = content.replace(anchor, funcCode + anchor);
}

// 2. Update renderUpgradeItemHtml to show progress line
const oldRender = `      return \`
        <div class="upgrade-item-card" onclick="openBuildingModal('\${displayName}')" style="cursor: pointer;">
          <div class="upgrade-icon-wrap" style="background: transparent;">
            <img src="\${imgSrc}" style="width:26px; height:26px; object-fit:contain;" alt="\${displayName}" onerror="handleImgError(this)">
          </div>
          <div class="upgrade-text-wrap" style="flex:1;">
            <div class="upgrade-title">\${displayName} Lv \${upg.currentLevel !== undefined ? upg.currentLevel : 0} → Lv \${upg.targetLevel || '?'}</div>
            <div class="upgrade-time" style="color:#a1a1aa; font-size:11px;">\${formattedTime} remaining</div>
          </div>
          <span style="font-family:'Lilita One',cursive; font-size:10px; background:#27272a; padding:2px 6px; border-radius:4px; color:#ffffff;">Lv \${upg.targetLevel}</span>
        </div>
      \`;`;

const newRender = `      const totalDur = upg.durationSeconds || seconds;
      let progressPct = 5;
      if (totalDur > 0 && totalDur >= seconds) {
        progressPct = Math.min(100, Math.max(4, Math.round(((totalDur - seconds) / totalDur) * 100)));
      } else if (seconds <= 0) {
        progressPct = 100;
      }

      return \`
        <div class="upgrade-item-card" onclick="openBuildingModal('\${displayName}')" style="cursor: pointer; flex-direction:column; align-items:stretch;">
          <div style="display:flex; align-items:center; width:100%;">
            <div class="upgrade-icon-wrap" style="background: transparent; margin-right:8px;">
              <img src="\${imgSrc}" style="width:26px; height:26px; object-fit:contain;" alt="\${displayName}" onerror="handleImgError(this)">
            </div>
            <div class="upgrade-text-wrap" style="flex:1; min-width:0;">
              <div class="upgrade-title" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${displayName} Lv \${upg.currentLevel !== undefined ? upg.currentLevel : 0} → Lv \${upg.targetLevel || '?'}</div>
              <div class="upgrade-time" style="color:#38bdf8; font-size:11px; font-weight:600;">\${formattedTime} remaining</div>
            </div>
            <span style="font-family:'Lilita One',cursive; font-size:10px; background:#27272a; padding:2px 6px; border-radius:4px; color:#ffffff; margin-left:6px;">Lv \${upg.targetLevel}</span>
          </div>
          <div style="background:#27272a; height:3px; border-radius:2px; margin-top:6px; margin-left:34px; overflow:hidden;">
            <div style="background:#06b6d4; height:100%; width:\${progressPct}%; border-radius:2px;"></div>
          </div>
        </div>
      \`;`;

if (content.includes(oldRender)) {
  content = content.replace(oldRender, newRender);
}

// 3. Update activeUpgrades.push blocks in parseVillageExportClientSide
// Building block
const oldBldgPush = `            activeUpgrades.push({
              instanceId: b.instanceId || ('upg_bldg_' + idx),
              buildingId: b.buildingId || String(rawId),
              name: name,
              category: b.category || 'Defense',
              currentLevel: Number(lvl),
              targetLevel: Number(lvl) + 1,
              timerSeconds: timerSec,
              durationSeconds: timerSec,
              upgradeEndTimestamp: endTs,
              type: 'builder',
              image: { url: getBuildingOrEntityIcon(name, Number(lvl) + 1, b.category, 'builder') }
            });`;

const newBldgPush = `            const bldgImg = getBuildingOrEntityIcon(name, Number(lvl) + 1, b.category, 'builder');
            const totalDuration = getOfficialTotalDuration(name, Number(lvl) + 1, 'builder') || timerSec;
            activeUpgrades.push({
              instanceId: b.instanceId || ('upg_bldg_' + idx),
              buildingId: b.buildingId || String(rawId),
              name: name,
              category: b.category || 'Defense',
              currentLevel: Number(lvl),
              targetLevel: Number(lvl) + 1,
              timerSeconds: timerSec,
              durationSeconds: totalDuration,
              upgradeEndTimestamp: endTs,
              type: 'builder',
              image: { url: bldgImg },
              imageUrl: bldgImg
            });`;

if (content.includes(oldBldgPush)) {
  content = content.replace(oldBldgPush, newBldgPush);
}

// Hero block
const oldHeroPush = `            activeUpgrades.push({
              instanceId: 'upg_hero_' + idx,
              buildingId: String(rawId),
              name: hName + ' (Hero)',
              category: 'Hero',
              currentLevel: Number(lvl),
              targetLevel: Number(lvl) + 1,
              timerSeconds: timerSec,
              durationSeconds: timerSec,
              upgradeEndTimestamp: Date.now() + timerSec * 1000,
              type: 'builder',
              image: { url: '/downloads/images/Heroes/' + hName.toLowerCase().replace(/\\s+/g, '_') + '.webp' }
            });`;

const newHeroPush = `            const hImg = '/downloads/images/Heroes/' + hName.toLowerCase().replace(/\\s+/g, '_') + '.webp';
            const totalDuration = getOfficialTotalDuration(hName, Number(lvl) + 1, 'hero') || timerSec;
            activeUpgrades.push({
              instanceId: 'upg_hero_' + idx,
              buildingId: String(rawId),
              name: hName + ' (Hero)',
              category: 'Hero',
              currentLevel: Number(lvl),
              targetLevel: Number(lvl) + 1,
              timerSeconds: timerSec,
              durationSeconds: totalDuration,
              upgradeEndTimestamp: Date.now() + timerSec * 1000,
              type: 'builder',
              image: { url: hImg },
              imageUrl: hImg
            });`;

if (content.includes(oldHeroPush)) {
  content = content.replace(oldHeroPush, newHeroPush);
}

// Lab block
const oldLabPush = `          activeUpgrades.push({
            instanceId: 'upg_lab_' + idx,
            buildingId: String(rawId),
            name: uName + ' (Laboratory)',
            category: 'Lab',
            currentLevel: Number(lvl),
            targetLevel: Number(lvl) + 1,
            timerSeconds: timerSec,
            durationSeconds: timerSec,
            upgradeEndTimestamp: Date.now() + timerSec * 1000,
            type: 'lab',
            image: { url: getBuildingOrEntityIcon(uName, Number(lvl) + 1, 'Lab', 'lab') }
          });`;

const newLabPush = `          const labImg = getBuildingOrEntityIcon(uName, Number(lvl) + 1, 'Lab', 'lab');
          const totalDuration = getOfficialTotalDuration(uName, Number(lvl) + 1, 'lab') || timerSec;
          activeUpgrades.push({
            instanceId: 'upg_lab_' + idx,
            buildingId: String(rawId),
            name: uName + ' (Laboratory)',
            category: 'Lab',
            currentLevel: Number(lvl),
            targetLevel: Number(lvl) + 1,
            timerSeconds: timerSec,
            durationSeconds: totalDuration,
            upgradeEndTimestamp: Date.now() + timerSec * 1000,
            type: 'lab',
            image: { url: labImg },
            imageUrl: labImg
          });`;

if (content.includes(oldLabPush)) {
  content = content.replace(oldLabPush, newLabPush);
}

// Pet block
const oldPetPush = `            activeUpgrades.push({
              instanceId: 'upg_pet_' + idx,
              buildingId: String(rawId),
              name: pName + ' (Pet House)',
              category: 'Pet',
              currentLevel: Number(lvl),
              targetLevel: Number(lvl) + 1,
              timerSeconds: timerSec,
              durationSeconds: timerSec,
              upgradeEndTimestamp: Date.now() + timerSec * 1000,
              type: 'pet'
            });`;

const newPetPush = `            const petImg = getBuildingOrEntityIcon(pName, Number(lvl) + 1, 'Pet', 'pet');
            const totalDuration = getOfficialTotalDuration(pName, Number(lvl) + 1, 'pet') || timerSec;
            activeUpgrades.push({
              instanceId: 'upg_pet_' + idx,
              buildingId: String(rawId),
              name: pName + ' (Pet House)',
              category: 'Pet',
              currentLevel: Number(lvl),
              targetLevel: Number(lvl) + 1,
              timerSeconds: timerSec,
              durationSeconds: totalDuration,
              upgradeEndTimestamp: Date.now() + timerSec * 1000,
              type: 'pet',
              image: { url: petImg },
              imageUrl: petImg
            });`;

if (content.includes(oldPetPush)) {
  content = content.replace(oldPetPush, newPetPush);
}

fs.writeFileSync(path, content, 'utf8');
fs.writeFileSync('android/app/src/main/assets/www/index.html', content, 'utf8');
console.log('Successfully applied widget and progress line updates to public/index.html and android/app/src/main/assets/www/index.html');
