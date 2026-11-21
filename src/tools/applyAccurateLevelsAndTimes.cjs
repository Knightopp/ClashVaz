const fs = require('fs');
const path = require('path');

const officialData = JSON.parse(fs.readFileSync('data/official_sc_progression.json', 'utf8'));

function applyAccurateData(filePath) {
  console.log(`Applying accurate levels and times to ${filePath}...`);
  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Insert OFFICIAL_SC_DATA as an inline constant right after <script>
  if (!html.includes('window.OFFICIAL_SC_DATA =')) {
    const scriptStart = '<script>';
    const scDataConst = `<script>\n    window.OFFICIAL_SC_DATA = ${JSON.stringify(officialData)};\n    const OFFICIAL_SC_DATA = window.OFFICIAL_SC_DATA;`;
    html = html.replace(scriptStart, scDataConst);
  }

  // 2. Replace calculateTimeToReachTH with exact math
  const oldCalcStart = html.indexOf('function calculateTimeToReachTH(targetTH) {');
  if (oldCalcStart !== -1) {
    const oldCalcEnd = html.indexOf('function renderTownHallTiers()', oldCalcStart);
    if (oldCalcEnd !== -1) {
      const newCalcFunc = `function calculateTimeToReachTH(targetTH) {
      const p = allProgressions.find(x => x.townHall === targetTH);
      if (!p) return { bldgStr: 'N/A', heroStr: 'N/A', labStr: 'N/A', badgeStr: 'N/A', bottleneckStr: 'N/A', isMaxed: false };

      const villageTH = currentVillageProfile ? (currentVillageProfile.townHallLevel || 18) : 18;

      if (targetTH < villageTH) {
        return {
          bldgStr: '0d (Completed)',
          heroStr: '0d (Completed)',
          labStr: '0d (Completed)',
          badgeStr: 'Maxed Tier',
          bottleneckStr: 'Completed',
          isMaxed: true
        };
      }

      const builderBoostFactor = 1 - (calcBuilderBoost / 100);
      const researchBoostFactor = 1 - (calcResearchBoost / 100);

      // 1. Structure Building Time
      let totalRawBldgSeconds = 0;
      const villageBuildings = (currentVillageProfile && currentVillageProfile.buildings) ? currentVillageProfile.buildings : [];

      p.buildings.forEach(pb => {
        if (pb.name.toLowerCase() === 'wall') return; // Instant upgrade: walls do not use builders!
        const cleanPbName = pb.name.toLowerCase().replace(/\\/home village/i, '').trim();
        const qty = (pb.quantity !== undefined) ? pb.quantity : 1;
        if (qty <= 0) return; // Skip merged buildings (e.g. Eagle Artillery fused into Town Hall, Cannons merged into Ricochet Cannons)

        const ckBldg = OFFICIAL_SC_DATA.buildings.find(b => b.name.toLowerCase().trim() === cleanPbName);
        const bData = allBuildings.find(b => b.name.toLowerCase().replace(/\\/home village/i, '').trim() === cleanPbName);
        const targetMaxLvl = ckBldg?.maxPerTH[targetTH] || pb.maxAvailableLevel;

        const ownedLevels = getVillageBuildingLevels(pb.name, villageBuildings);

        for (let i = 0; i < qty; i++) {
          let curLvl = ownedLevels[i] !== undefined ? ownedLevels[i] : (ownedLevels[0] || 0);
          if (curLvl < targetMaxLvl) {
            for (let l = curLvl + 1; l <= targetMaxLvl; l++) {
              const ckLevel = ckBldg?.levels?.find(lvl => lvl.level === l);
              if (ckLevel && typeof ckLevel.build_time === 'number' && ckLevel.build_time > 0) {
                totalRawBldgSeconds += ckLevel.build_time;
              } else {
                const lvlData = bData?.levels?.find(lvl => lvl.level === l);
                totalRawBldgSeconds += (lvlData?.upgradeTimeSeconds > 0) ? lvlData.upgradeTimeSeconds : (10 * 86400);
              }
            }
          }
        }
      });

      // Target Town Hall structure upgrade itself if transitioning from TH18 -> TH19
      if (targetTH > villageTH) {
        totalRawBldgSeconds += (16 + 50) * 86400;
      }

      // 2. Exact Hero Time from Official Supercell Game Data
      let totalRawHeroSeconds = 0;
      const rawHeroes = currentVillageProfile?.heroes || [];

      OFFICIAL_SC_DATA.heroes.forEach(h => {
        const userH = rawHeroes.find(x => x.data === h.id || (x.name && x.name.toLowerCase() === h.name.toLowerCase()));
        const curLvl = userH ? (userH.lvl || 0) : 0;
        const maxLvl = h.maxPerTH[targetTH] || 0;
        if (maxLvl > curLvl) {
          for (let l = curLvl + 1; l <= maxLvl; l++) {
            const ld = h.levels.find(x => x.level === l);
            if (ld && ld.upgrade_time > 0) {
              totalRawHeroSeconds += ld.upgrade_time;
            }
          }
        }
      });

      // 3. Exact Lab / Research Time (Troops + Spells) from Official Supercell Game Data
      let totalRawLabSeconds = 0;
      const rawTroops = currentVillageProfile?.troops || [];
      const rawSpells = currentVillageProfile?.spells || [];

      OFFICIAL_SC_DATA.troops.forEach(t => {
        const userT = rawTroops.find(x => x.data === t.id || (x.name && x.name.toLowerCase() === t.name.toLowerCase()));
        const curLvl = userT ? (userT.lvl || 0) : 0;
        const maxLvl = t.maxPerTH[targetTH] || 0;
        if (maxLvl > curLvl) {
          for (let l = curLvl + 1; l <= maxLvl; l++) {
            const ld = t.levels.find(x => x.level === l);
            if (ld && ld.upgrade_time > 0) {
              totalRawLabSeconds += ld.upgrade_time;
            }
          }
        }
      });

      OFFICIAL_SC_DATA.spells.forEach(s => {
        const userS = rawSpells.find(x => x.data === s.id || (x.name && x.name.toLowerCase() === s.name.toLowerCase()));
        const curLvl = userS ? (userS.lvl || 0) : 0;
        const maxLvl = s.maxPerTH[targetTH] || 0;
        if (maxLvl > curLvl) {
          for (let l = curLvl + 1; l <= maxLvl; l++) {
            const ld = s.levels.find(x => x.level === l);
            if (ld && ld.upgrade_time > 0) {
              totalRawLabSeconds += ld.upgrade_time;
            }
          }
        }
      });

      const structBuilders = Math.max(1, calcBuilders - calcHeroBuilders);
      const effectiveBldgSeconds = (totalRawBldgSeconds * builderBoostFactor) / structBuilders;
      const effectiveHeroSeconds = calcHeroBuilders > 0 
        ? (totalRawHeroSeconds * builderBoostFactor) / calcHeroBuilders 
        : Infinity;

      const totalMaxSeconds = Math.max(effectiveBldgSeconds, calcHeroBuilders > 0 ? effectiveHeroSeconds : 0);

      let bottleneckStr = 'Balanced';
      if (calcHeroBuilders === 0) {
        bottleneckStr = 'Hero Upgrades Paused';
      } else if (effectiveBldgSeconds > effectiveHeroSeconds + (5 * 86400)) {
        bottleneckStr = 'Bottleneck: Structures';
      } else if (effectiveHeroSeconds > effectiveBldgSeconds + (5 * 86400)) {
        bottleneckStr = 'Bottleneck: Heroes';
      }

      const effectiveLabSeconds = totalRawLabSeconds * researchBoostFactor;

      const bldgFormatted = formatTimeDuration(effectiveBldgSeconds);
      const heroFormatted = calcHeroBuilders > 0 ? formatTimeDuration(effectiveHeroSeconds) : 'Paused (0 bldrs)';
      const labFormatted = formatTimeDuration(effectiveLabSeconds);
      const totalFormatted = formatTimeDuration(totalMaxSeconds);

      let badgeStr = \`\${totalFormatted} to Max\`;

      return {
        bldgStr: \`\${bldgFormatted} (\${structBuilders} bldrs\${calcBuilderBoost > 0 ? \`, -\${calcBuilderBoost}%\` : ''})\`,
        heroStr: \`\${heroFormatted} (\${calcHeroBuilders} bldrs\${calcBuilderBoost > 0 && calcHeroBuilders > 0 ? \`, -\${calcBuilderBoost}%\` : ''})\`,
        labStr: \`\${labFormatted}\${calcResearchBoost > 0 ? \` (-\${calcResearchBoost}%)\` : ''}\`,
        totalFormatted,
        badgeStr,
        bottleneckStr,
        isMaxed: false
      };
    }\n\n    `;
      html = html.substring(0, oldCalcStart) + newCalcFunc + html.substring(oldCalcEnd);
    }
  }

  // 3. Replace renderVillageHeroes with official hero stats
  const oldHeroesStart = html.indexOf('function renderVillageHeroes() {');
  if (oldHeroesStart !== -1) {
    const oldHeroesEnd = html.indexOf('// ========================================================', oldHeroesStart);
    if (oldHeroesEnd !== -1) {
      const newHeroesFunc = `function renderVillageHeroes() {
      const container = document.getElementById('village-heroes-grid');
      const summaryEl = document.getElementById('heroes-status-summary');
      if (!container) return;
      container.innerHTML = '';

      const profile = currentVillageProfile;
      const rawHeroes = profile?.heroes || [];
      const activeUpgrades = profile?.activeUpgrades || [];

      let upgradingCount = 0;

      OFFICIAL_SC_DATA.heroes.forEach(h => {
        const found = rawHeroes.find(x => x.data === h.id || (x.name && x.name.toLowerCase() === h.name.toLowerCase()));
        const curLvl = found ? (found.lvl || 0) : 0;
        const maxLvl = h.maxPerTH[18] || 0; // Current TH18 max level!

        const isUpgrading = (found && found.timer && found.timer > 0) || activeUpgrades.some(u => u.name && u.name.toLowerCase().includes(h.name.toLowerCase()));
        if (isUpgrading) upgradingCount++;

        const isMaxed = curLvl >= maxLvl;
        const pct = Math.min(100, Math.round((curLvl / maxLvl) * 100));

        let statusText = 'Ready for Battle';
        let statusClass = '';
        if (isUpgrading) {
          statusText = \`Upgrading to Lv \${curLvl + 1}\`;
          statusClass = 'upgrading';
        } else if (isMaxed) {
          statusText = 'Maxed Tier';
          statusClass = 'maxed';
        }

        const card = document.createElement('div');
        card.className = \`hero-card \${isUpgrading ? 'upgrading' : ''}\`;
        card.innerHTML = \`
          \${isUpgrading ? \`
            <div class="hero-upgrade-badge" title="Hero is currently upgrading">
              <img src="/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/b/b2/ChallengesIcon_HeroPetUpgrade.png/revision/latest?cb=20260220114002" alt="Upgrading">
            </div>
          \` : ''}
          <div class="hero-header-row">
            <img class="hero-avatar-img" src="\${getProxyUrl(h.icon)}" alt="\${h.name}" onerror="handleImgError(this)">
            <div class="hero-info-wrap">
              <span class="hero-name">\${h.name}</span>
              <span class="hero-level-txt">Level \${curLvl} <span class="hero-level-max">/ \${maxLvl}</span></span>
            </div>
          </div>
          <div class="hero-progress-bar">
            <div class="hero-progress-fill" style="width: \${pct}%;"></div>
          </div>
          <div class="hero-status-pill \${statusClass}">
            \${statusText}
          </div>
        \`;
        container.appendChild(card);
      });

      if (summaryEl) {
        summaryEl.textContent = \`\${upgradingCount}/6 Upgrading\`;
      }
    }\n\n    `;
      html = html.substring(0, oldHeroesStart) + newHeroesFunc + html.substring(oldHeroesEnd);
    }
  }

  // 4. Replace renderMaxingRoadmap with 100% accurate items (Buildings, Heroes, Troops, Spells, Pets)
  const oldRoadmapStart = html.indexOf('function renderMaxingRoadmap(targetTH) {');
  if (oldRoadmapStart !== -1) {
    const oldRoadmapEnd = html.indexOf('function onRoadmapSearch(q) {', oldRoadmapStart);
    if (oldRoadmapEnd !== -1) {
      const newRoadmapFunc = `function renderMaxingRoadmap(targetTH) {
      const tbody = document.getElementById('maxing-roadmap-tbody');
      const pill = document.getElementById('roadmap-target-th-pill');
      if (!tbody) return;
      tbody.innerHTML = '';

      if (pill) pill.textContent = \`Town Hall \${targetTH}\`;

      const p = allProgressions.find(x => x.townHall === targetTH);
      if (!p) return;

      const profile = currentVillageProfile;
      const villageBuildings = profile ? (profile.buildings || []) : [];
      const rawHeroes = profile ? (profile.heroes || []) : [];
      const rawTroops = profile ? (profile.troops || []) : [];
      const rawSpells = profile ? (profile.spells || []) : [];
      const rawPets = profile ? (profile.pets || []) : [];
      const activeUpgrades = profile ? (profile.activeUpgrades || []) : [];
      const boostFactor = 1 - (calcBuilderBoost / 100);
      const resFactor = 1 - (calcResearchBoost / 100);

      const items = [];

      // 1. Collect Buildings
      p.buildings.forEach(pb => {
        if (pb.name.toLowerCase() === 'wall') return; // instant upgrade
        const cleanPbName = pb.name.toLowerCase().replace(/\\/home village/i, '').trim();
        const qty = (pb.quantity !== undefined) ? pb.quantity : 1;

        // Skip merged buildings (Eagle Artillery, Cannons, etc.) from active upgrade table!
        if (qty <= 0) {
          if (roadmapSearchQuery && cleanPbName.includes(roadmapSearchQuery)) {
            let mergeReason = 'Merged Defense';
            if (cleanPbName.includes('eagle')) mergeReason = 'Fused into Town Hall (TH17+)';
            else if (cleanPbName === 'cannon') mergeReason = 'Merged into Ricochet Cannon';
            else if (cleanPbName === 'archer tower') mergeReason = 'Merged into Multi-Archer Tower';
            else if (cleanPbName === 'scattershot') mergeReason = 'Merged into Firecracker Tower';

            let imgSrc = '';
            const bData = allBuildings.find(b => b.name.toLowerCase().replace(/\\/home village/i, '').trim() === cleanPbName);
            if (bData && bData.levels) {
              const lObj = bData.levels[bData.levels.length - 1];
              if (lObj?.image?.url) imgSrc = getProxyUrl(lObj.image.url);
            }

            items.push({
              name: pb.name,
              category: pb.category || 'Defense',
              curLvl: mergeReason,
              maxLvl: 'Merged',
              levelsRemaining: 0,
              effectiveSec: 0,
              progressPct: 100,
              imgSrc,
              isUpgrading: false,
              activeTimerSec: 0,
              targetUpgLevel: 'Merged',
              isMergedNote: true
            });
          }
          return;
        }

        const ckBldg = OFFICIAL_SC_DATA.buildings.find(b => b.name.toLowerCase().trim() === cleanPbName);
        const bData = allBuildings.find(b => b.name.toLowerCase().replace(/\\/home village/i, '').trim() === cleanPbName);
        let ownedLevels = getVillageBuildingLevels(cleanPbName, villageBuildings);
        const curLvl = ownedLevels[0] !== undefined ? ownedLevels[0] : 0;
        const maxLvl = ckBldg?.maxPerTH[targetTH] || pb.maxAvailableLevel;
        const levelsRemaining = Math.max(0, maxLvl - curLvl);

        let effectiveSec = 0;
        if (levelsRemaining > 0) {
          for (let l = curLvl + 1; l <= maxLvl; l++) {
            const ckLevel = ckBldg?.levels?.find(lvl => lvl.level === l);
            if (ckLevel && typeof ckLevel.build_time === 'number' && ckLevel.build_time > 0) {
              effectiveSec += ckLevel.build_time;
            } else {
              const lvlData = bData?.levels?.find(lvl => lvl.level === l);
              effectiveSec += (lvlData?.upgradeTimeSeconds > 0) ? lvlData.upgradeTimeSeconds : (10 * 86400);
            }
          }
          effectiveSec = effectiveSec * boostFactor;
        }

        let imgSrc = '';
        if (bData && bData.levels) {
          const lObj = bData.levels.find(lvl => lvl.level === maxLvl) || bData.levels.find(lvl => lvl.level === curLvl) || bData.levels[bData.levels.length - 1];
          if (lObj?.image?.url) imgSrc = getProxyUrl(lObj.image.url);
        }
        if (!imgSrc) imgSrc = '/downloads/images/Cannon/level-14.png';

        const upgObj = activeUpgrades.find(u => u.name && u.name.toLowerCase().replace(/\\/home village/i, '').trim() === cleanPbName);
        const isUpgrading = !!upgObj;
        const activeTimerSec = upgObj ? upgObj.timerSeconds : 0;
        const progressPct = Math.min(100, Math.round((curLvl / maxLvl) * 100));

        items.push({
          name: pb.name,
          category: pb.category || 'Defense',
          curLvl,
          maxLvl,
          levelsRemaining,
          effectiveSec,
          progressPct,
          imgSrc,
          isUpgrading,
          activeTimerSec,
          targetUpgLevel: upgObj ? upgObj.targetLevel : (curLvl + 1)
        });
      });

      // 2. Collect 6 Heroes from Official Supercell Game Data
      OFFICIAL_SC_DATA.heroes.forEach(h => {
        const hFound = rawHeroes.find(x => x.data === h.id || (x.name && x.name.toLowerCase() === h.name.toLowerCase()));
        const curLvl = hFound ? (hFound.lvl || 0) : 0;
        const maxLvl = h.maxPerTH[targetTH] || 0;
        const levelsRemaining = Math.max(0, maxLvl - curLvl);

        let effectiveSec = 0;
        if (levelsRemaining > 0) {
          for (let l = curLvl + 1; l <= maxLvl; l++) {
            const ld = h.levels.find(x => x.level === l);
            if (ld && ld.upgrade_time > 0) effectiveSec += ld.upgrade_time;
          }
          effectiveSec = effectiveSec * boostFactor;
        }

        const isUpgrading = (hFound && hFound.timer > 0) || activeUpgrades.some(u => u.name && u.name.toLowerCase().includes(h.name.toLowerCase()));
        const progressPct = maxLvl > 0 ? Math.min(100, Math.round((curLvl / maxLvl) * 100)) : 100;

        items.push({
          name: h.name,
          category: 'Hero',
          curLvl,
          maxLvl,
          levelsRemaining,
          effectiveSec,
          progressPct,
          imgSrc: getProxyUrl(h.icon),
          isUpgrading,
          activeTimerSec: hFound?.timer || 0,
          targetUpgLevel: curLvl + 1
        });
      });

      // 3. Collect Troops from Official Supercell Game Data
      OFFICIAL_SC_DATA.troops.forEach(t => {
        const tFound = rawTroops.find(x => x.data === t.id || (x.name && x.name.toLowerCase() === t.name.toLowerCase()));
        const curLvl = tFound ? (tFound.lvl || 0) : 0;
        const maxLvl = t.maxPerTH[targetTH] || 0;
        if (maxLvl === 0 && curLvl === 0) return; // not available yet
        const levelsRemaining = Math.max(0, maxLvl - curLvl);

        let effectiveSec = 0;
        if (levelsRemaining > 0) {
          for (let l = curLvl + 1; l <= maxLvl; l++) {
            const ld = t.levels.find(x => x.level === l);
            if (ld && ld.upgrade_time > 0) effectiveSec += ld.upgrade_time;
          }
          effectiveSec = effectiveSec * resFactor;
        }

        const isUpgrading = (tFound && tFound.timer > 0) || activeUpgrades.some(u => u.name && u.name.toLowerCase().includes(t.name.toLowerCase()));
        const progressPct = maxLvl > 0 ? Math.min(100, Math.round((curLvl / maxLvl) * 100)) : 100;

        items.push({
          name: t.name,
          category: 'Troop',
          curLvl,
          maxLvl,
          levelsRemaining,
          effectiveSec,
          progressPct,
          imgSrc: getProxyUrl(t.icon),
          isUpgrading,
          activeTimerSec: tFound?.timer || 0,
          targetUpgLevel: curLvl + 1
        });
      });

      // 4. Collect Spells from Official Supercell Game Data
      OFFICIAL_SC_DATA.spells.forEach(s => {
        const sFound = rawSpells.find(x => x.data === s.id || (x.name && x.name.toLowerCase() === s.name.toLowerCase()));
        const curLvl = sFound ? (sFound.lvl || 0) : 0;
        const maxLvl = s.maxPerTH[targetTH] || 0;
        if (maxLvl === 0 && curLvl === 0) return;
        const levelsRemaining = Math.max(0, maxLvl - curLvl);

        let effectiveSec = 0;
        if (levelsRemaining > 0) {
          for (let l = curLvl + 1; l <= maxLvl; l++) {
            const ld = s.levels.find(x => x.level === l);
            if (ld && ld.upgrade_time > 0) effectiveSec += ld.upgrade_time;
          }
          effectiveSec = effectiveSec * resFactor;
        }

        const isUpgrading = (sFound && sFound.timer > 0) || activeUpgrades.some(u => u.name && u.name.toLowerCase().includes(s.name.toLowerCase()));
        const progressPct = maxLvl > 0 ? Math.min(100, Math.round((curLvl / maxLvl) * 100)) : 100;

        items.push({
          name: s.name,
          category: 'Spell',
          curLvl,
          maxLvl,
          levelsRemaining,
          effectiveSec,
          progressPct,
          imgSrc: getProxyUrl(s.icon),
          isUpgrading,
          activeTimerSec: sFound?.timer || 0,
          targetUpgLevel: curLvl + 1
        });
      });

      // 5. Collect Pets from Official Supercell Game Data
      OFFICIAL_SC_DATA.pets.forEach(p => {
        const pFound = rawPets.find(x => x.data === p.id || (x.name && x.name.toLowerCase() === p.name.toLowerCase()));
        const curLvl = pFound ? (pFound.lvl || 0) : 0;
        const maxLvl = p.maxPerTH[targetTH] || 0;
        if (maxLvl === 0 && curLvl === 0) return;
        const levelsRemaining = Math.max(0, maxLvl - curLvl);

        let effectiveSec = 0;
        if (levelsRemaining > 0) {
          for (let l = curLvl + 1; l <= maxLvl; l++) {
            const ld = p.levels.find(x => x.level === l);
            if (ld && ld.upgrade_time > 0) effectiveSec += ld.upgrade_time;
          }
          effectiveSec = effectiveSec * boostFactor;
        }

        const isUpgrading = (pFound && pFound.timer > 0) || activeUpgrades.some(u => u.name && u.name.toLowerCase().includes(p.name.toLowerCase()));
        const progressPct = maxLvl > 0 ? Math.min(100, Math.round((curLvl / maxLvl) * 100)) : 100;

        items.push({
          name: p.name,
          category: 'Pet',
          curLvl,
          maxLvl,
          levelsRemaining,
          effectiveSec,
          progressPct,
          imgSrc: getProxyUrl(p.icon),
          isUpgrading,
          activeTimerSec: pFound?.timer || 0,
          targetUpgLevel: curLvl + 1
        });
      });

      // Filter by category and search
      const filtered = items.filter(item => {
        if (roadmapActiveCategory !== 'all') {
          if (roadmapActiveCategory === 'Research') {
            if (item.category !== 'Troop' && item.category !== 'Spell') return false;
          } else if (roadmapActiveCategory === 'Army') {
            if (item.category !== 'Army' && item.category !== 'Troop' && item.category !== 'Spell' && item.category !== 'Pet') return false;
          } else if (item.category !== roadmapActiveCategory) {
            return false;
          }
        }
        if (roadmapSearchQuery && !item.name.toLowerCase().includes(roadmapSearchQuery)) return false;
        return true;
      });

      // Sort items: Upgrading first, then needing upgrades descending by remaining time, then maxed
      filtered.sort((a, b) => {
        if (a.isUpgrading && !b.isUpgrading) return -1;
        if (!a.isUpgrading && b.isUpgrading) return 1;
        if (a.levelsRemaining > 0 && b.levelsRemaining === 0) return -1;
        if (a.levelsRemaining === 0 && b.levelsRemaining > 0) return 1;
        return b.effectiveSec - a.effectiveSec;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 24px; color:#71717a;">No items found matching criteria.</td></tr>';
        return;
      }

      filtered.forEach(it => {
        const isMaxed = it.levelsRemaining === 0 && !it.isMergedNote;
        const tr = document.createElement('tr');
        if (it.isUpgrading) tr.className = 'active-upgrade-row';

        let statusBadge = '<span class="roadmap-status-pill" style="background:#27272a; color:#a1a1aa;">Ready</span>';
        if (it.isMergedNote) {
          statusBadge = '<span class="roadmap-status-pill" style="background:#18181b; color:#a1a1aa; border:1px solid #27272a;">Merged</span>';
        } else if (it.isUpgrading) {
          const tRem = it.activeTimerSec > 0 ? formatSecondsToCoCTime(it.activeTimerSec) : 'In Progress';
          statusBadge = \`<span class="roadmap-status-pill active-upg" style="background:#27272a; border:1px solid #ffffff; color:#ffffff;">Active (\${tRem})</span>\`;
        } else if (isMaxed) {
          statusBadge = '<span class="roadmap-status-pill" style="background:#18181b; color:#71717a;">Maxed Tier</span>';
        }

        const timeStr = isMaxed ? '0d' : formatTimeDuration(it.effectiveSec);
        const curLvlLabel = it.isMergedNote ? it.curLvl : \`Level \${it.curLvl}\`;
        const maxLvlLabel = it.isMergedNote ? 'Merged' : \`Level \${it.maxLvl}\`;

        tr.innerHTML = \`
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="\${it.imgSrc}" alt="\${it.name}" style="width: 24px; height: 24px; object-fit: contain;" onerror="handleImgError(this)">
              <span style="font-weight: 700; color: #ffffff;">\${it.name}</span>
            </div>
          </td>
          <td><span style="font-size: 11px; color: #a1a1aa; background: #18181b; padding: 2px 6px; border-radius: 4px; border: 1px solid #27272a;">\${it.category}</span></td>
          <td><span style="font-weight: 700;">\${curLvlLabel}</span></td>
          <td><span style="font-weight: 700; color: #ffffff;">\${maxLvlLabel}</span></td>
          <td><span style="font-weight: 700; color: \${it.levelsRemaining > 0 ? '#ffffff' : '#71717a'};">\${it.levelsRemaining > 0 ? \`+\${it.levelsRemaining} lvls\` : '0'}</span></td>
          <td><span style="font-weight: 700; color: \${it.levelsRemaining > 0 ? '#ffffff' : '#71717a'};">\${timeStr}</span></td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="roadmap-progress-wrap">
                <div class="roadmap-progress-fill" style="width: \${it.progressPct}%;"></div>
              </div>
              <span style="font-size: 11px; font-weight: 700; color: #a1a1aa; width: 32px; text-align: right;">\${it.progressPct}%</span>
            </div>
          </td>
          <td>\${statusBadge}</td>
        \`;
        tbody.appendChild(tr);
      });
    }\n\n    `;
      html = html.substring(0, oldRoadmapStart) + newRoadmapFunc + html.substring(oldRoadmapEnd);
    }
  }

  // 5. Add Research tab to Roadmap header tabs
  const oldTabs = `<button class="roadmap-tab" data-cat="Hero" onclick="filterRoadmap('Hero')">Heroes</button>`;
  const newTabs = `<button class="roadmap-tab" data-cat="Hero" onclick="filterRoadmap('Hero')">Heroes</button>
                  <button class="roadmap-tab" data-cat="Research" onclick="filterRoadmap('Research')">Research</button>
                  <button class="roadmap-tab" data-cat="Pet" onclick="filterRoadmap('Pet')">Pets</button>`;

  if (html.includes(oldTabs) && !html.includes(`filterRoadmap('Research')`)) {
    html = html.replace(oldTabs, newTabs);
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Successfully updated ${filePath}`);
}

applyAccurateData(path.resolve(__dirname, '../../public/index.html'));
applyAccurateData(path.resolve(__dirname, '../../android/app/src/main/assets/www/index.html'));
