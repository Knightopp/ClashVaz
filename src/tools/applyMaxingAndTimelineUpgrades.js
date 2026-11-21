const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../../public/index.html');
let html = fs.readFileSync(indexPath, 'utf8');

console.log('Original index.html length:', html.length);

// 1. UPDATE CALCULATOR TOOLBAR & ADD MAXING ROADMAP CONTAINER IN HTML
const toolbarStartStr = '<div class="th-calc-toolbar">';
const toolbarEndStr = '<div class="tri-card-grid" id="th-tiers-grid">';

const idxToolbarStart = html.indexOf(toolbarStartStr);
const idxToolbarEnd = html.indexOf(toolbarEndStr);

if (idxToolbarStart === -1 || idxToolbarEnd === -1) {
  console.error('Could not locate th-calc-toolbar in HTML');
  process.exit(1);
}

const newToolbarHTML = `<div class="th-calc-toolbar">
            <div class="calc-control-group">
              <span class="calc-label">Total Builders:</span>
              <div class="calc-pill-group" id="calc-builders-group">
                <button class="calc-pill" data-builders="1" onclick="setCalcBuilders(1)">1</button>
                <button class="calc-pill" data-builders="2" onclick="setCalcBuilders(2)">2</button>
                <button class="calc-pill" data-builders="3" onclick="setCalcBuilders(3)">3</button>
                <button class="calc-pill" data-builders="4" onclick="setCalcBuilders(4)">4</button>
                <button class="calc-pill" data-builders="5" onclick="setCalcBuilders(5)">5</button>
                <button class="calc-pill active" data-builders="6" onclick="setCalcBuilders(6)">6 (Max)</button>
              </div>
            </div>

            <div class="calc-control-group">
              <span class="calc-label">Hero Builders:</span>
              <div class="calc-pill-group" id="calc-hero-builders-group">
                <button class="calc-pill" data-hbuilders="0" onclick="setCalcHeroBuilders(0)">0</button>
                <button class="calc-pill" data-hbuilders="1" onclick="setCalcHeroBuilders(1)">1</button>
                <button class="calc-pill active" data-hbuilders="2" onclick="setCalcHeroBuilders(2)">2</button>
                <button class="calc-pill" data-hbuilders="3" onclick="setCalcHeroBuilders(3)">3</button>
                <button class="calc-pill" data-hbuilders="4" onclick="setCalcHeroBuilders(4)">4</button>
              </div>
            </div>

            <div class="calc-allocation-pill" id="calc-allocation-summary">
              4 on Structures • 2 on Heroes
            </div>

            <div class="calc-control-group">
              <span class="calc-label">Builder Boost:</span>
              <div class="calc-pill-group" id="calc-builder-boost-group">
                <button class="calc-pill active" data-bboost="0" onclick="setCalcBuilderBoost(0)">0%</button>
                <button class="calc-pill" data-bboost="10" onclick="setCalcBuilderBoost(10)">10%</button>
                <button class="calc-pill" data-bboost="15" onclick="setCalcBuilderBoost(15)">15%</button>
                <button class="calc-pill" data-bboost="20" onclick="setCalcBuilderBoost(20)">20%</button>
              </div>
            </div>

            <div class="calc-control-group">
              <span class="calc-label">Research Boost:</span>
              <div class="calc-pill-group" id="calc-research-boost-group">
                <button class="calc-pill active" data-rboost="0" onclick="setCalcResearchBoost(0)">0%</button>
                <button class="calc-pill" data-rboost="10" onclick="setCalcResearchBoost(10)">10%</button>
                <button class="calc-pill" data-rboost="15" onclick="setCalcResearchBoost(15)">15%</button>
                <button class="calc-pill" data-rboost="20" onclick="setCalcResearchBoost(20)">20%</button>
              </div>
            </div>
          </div>\n\n          `;

// Find where th-tiers-grid ends:
const tiersGridClose = '</div>\n        </div>\n\n      </div>\n\n      <!-- VIEW 2: MY VILLAGE -->';
const idxTiersGridClose = html.indexOf(tiersGridClose);

if (idxTiersGridClose === -1) {
  console.error('Could not locate tiersGridClose in HTML');
  process.exit(1);
}

const roadmapHTML = `\n          <!-- MAXING ROADMAP & UPGRADE CHART -->
          <div class="roadmap-section-card" id="maxing-roadmap-section">
            <div class="roadmap-header-row">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span class="section-heading" id="roadmap-heading">Maxing Upgrade Roadmap</span>
                <span class="calc-allocation-pill" id="roadmap-target-th-pill">Town Hall 18</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="roadmap-tabs" id="roadmap-category-tabs">
                  <button class="roadmap-tab active" data-cat="all" onclick="filterRoadmap('all')">All</button>
                  <button class="roadmap-tab" data-cat="Defense" onclick="filterRoadmap('Defense')">Defenses</button>
                  <button class="roadmap-tab" data-cat="Army" onclick="filterRoadmap('Army')">Army</button>
                  <button class="roadmap-tab" data-cat="Resource" onclick="filterRoadmap('Resource')">Resources</button>
                  <button class="roadmap-tab" data-cat="Hero" onclick="filterRoadmap('Hero')">Heroes</button>
                </div>
                <input type="text" id="roadmap-search-input" placeholder="Search roadmap..." oninput="onRoadmapSearch(this.value)" style="background: #09090b; border: 1px solid #27272a; border-radius: 6px; padding: 4px 10px; color: #fff; font-size: 11px; width: 140px; outline: none;">
              </div>
            </div>

            <div class="roadmap-table-wrap">
              <table class="roadmap-table">
                <thead>
                  <tr>
                    <th>Structure / Hero</th>
                    <th>Category</th>
                    <th>Current Village Level</th>
                    <th>Target Max Level</th>
                    <th>Levels Left</th>
                    <th>Upgrade Time</th>
                    <th>Progress</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="roadmap-table-body">
                  <!-- Dynamically rendered via renderMaxingRoadmap -->
                </tbody>
              </table>
            </div>
          </div>\n`;

// Apply HTML updates
html = html.slice(0, idxToolbarStart) + newToolbarHTML + toolbarEndStr + '\n            <!-- Dynamically populated top Town Halls with active gold border -->\n          </div>' + roadmapHTML + html.slice(idxTiersGridClose + '</div>\n'.length);

console.log('HTML structure updated successfully.');

// 2. JAVASCRIPT LOGIC REPLACEMENT:
// Locate from `// Town Hall Time-to-Reach Calculator State` to `// Render Town Hall Pills for Progression view`
const jsStartStr = '// Town Hall Time-to-Reach Calculator State';
const jsEndStr = '// Render Town Hall Pills for Progression view';

const idxJsStart = html.indexOf(jsStartStr);
const idxJsEnd = html.indexOf(jsEndStr);

if (idxJsStart === -1 || idxJsEnd === -1) {
  console.error('Could not locate JS block in HTML');
  process.exit(1);
}

const newJsBlock = `// Town Hall Time-to-Reach Calculator & Roadmap State
    let calcBuilders = 6;
    let calcHeroBuilders = 2; // Default: 2 builders on heroes, 4 on structures
    let calcBuilderBoost = 0;
    let calcResearchBoost = 0;
    let selectedCalcTargetTH = 18; // Default selected target TH for preview
    let roadmapActiveCategory = 'all';
    let roadmapSearchQuery = '';

    const TH_LAB_DAYS = {
      1: 0, 2: 1, 3: 3, 4: 7, 5: 14, 6: 28, 7: 45, 8: 90, 9: 150, 10: 190,
      11: 220, 12: 280, 13: 320, 14: 310, 15: 340, 16: 330, 17: 315, 18: 240, 19: 340
    };

    function setCalcBuilders(n) {
      calcBuilders = Math.max(1, Math.min(6, n)); // Strictly max 6 builders
      if (calcHeroBuilders >= calcBuilders) {
        calcHeroBuilders = Math.max(0, calcBuilders - 1);
      }
      updateCalcToolbarUI();
      renderTownHallTiers();
      renderMaxingRoadmap(selectedCalcTargetTH);
    }

    function setCalcHeroBuilders(n) {
      const maxHeroB = Math.max(0, calcBuilders - 1);
      calcHeroBuilders = Math.max(0, Math.min(maxHeroB, n));
      updateCalcToolbarUI();
      renderTownHallTiers();
      renderMaxingRoadmap(selectedCalcTargetTH);
    }

    function updateCalcToolbarUI() {
      document.querySelectorAll('#calc-builders-group .calc-pill').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.builders) === calcBuilders);
      });
      document.querySelectorAll('#calc-hero-builders-group .calc-pill').forEach(btn => {
        const val = parseInt(btn.dataset.hbuilders);
        btn.classList.toggle('active', val === calcHeroBuilders);
        const isDis = (val >= calcBuilders && calcBuilders > 1);
        btn.disabled = isDis;
        btn.style.opacity = isDis ? '0.3' : '1';
      });
      const structBuilders = Math.max(1, calcBuilders - calcHeroBuilders);
      const allocSummary = document.getElementById('calc-allocation-summary');
      if (allocSummary) {
        allocSummary.textContent = \`\${structBuilders} on Structures • \${calcHeroBuilders} on Heroes\`;
      }
    }

    function setCalcBuilderBoost(pct) {
      calcBuilderBoost = pct;
      document.querySelectorAll('#calc-builder-boost-group .calc-pill').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.bboost) === calcBuilderBoost);
      });
      renderTownHallTiers();
      renderMaxingRoadmap(selectedCalcTargetTH);
    }

    function setCalcResearchBoost(pct) {
      calcResearchBoost = pct;
      document.querySelectorAll('#calc-research-boost-group .calc-pill').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.rboost) === calcResearchBoost);
      });
      renderTownHallTiers();
      renderMaxingRoadmap(selectedCalcTargetTH);
    }

    function formatTimeDuration(totalSeconds) {
      if (totalSeconds <= 0 || !isFinite(totalSeconds)) return '0d';
      const days = Math.round(totalSeconds / 86400);
      if (days < 1) {
        const hours = Math.round(totalSeconds / 3600);
        return \`\${hours}h\`;
      }
      if (days < 30) return \`\${days}d\`;
      const months = Math.floor(days / 30);
      const remDays = days % 30;
      if (remDays === 0) return \`\${months}mo\`;
      return \`\${months}mo \${remDays}d\`;
    }

    // Expand village building levels taking into account quantities (from cnt)
    function getVillageBuildingLevels(bldgName, villageBuildings) {
      const levels = [];
      villageBuildings.forEach(vb => {
        if (vb.name && vb.name.toLowerCase() === bldgName.toLowerCase()) {
          const q = vb.quantity || 1;
          const lvl = vb.level || 0;
          for (let i = 0; i < q; i++) {
            levels.push(lvl);
          }
        }
      });
      return levels;
    }

    // Accurate calculation based on village current profile and dynamic builder split
    function calculateTimeToReachTH(targetTH) {
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

      let totalRawBldgSeconds = 0;
      const villageBuildings = (currentVillageProfile && currentVillageProfile.buildings) ? currentVillageProfile.buildings : [];

      p.buildings.forEach(pb => {
        if (pb.name.toLowerCase() === 'wall') return; // Instant upgrade: walls do not use builders!
        const bData = allBuildings.find(b => b.name.toLowerCase() === pb.name.toLowerCase());
        if (!bData || !bData.levels) return;

        const ownedLevels = getVillageBuildingLevels(pb.name, villageBuildings);
        const qty = pb.quantity || 1;

        for (let i = 0; i < qty; i++) {
          let curLvl = ownedLevels[i] !== undefined ? ownedLevels[i] : (ownedLevels[0] || 0);

          if (curLvl < pb.maxAvailableLevel) {
            for (let l = curLvl + 1; l <= pb.maxAvailableLevel; l++) {
              const lvlData = bData.levels.find(lvl => lvl.level === l);
              if (lvlData && typeof lvlData.upgradeTimeSeconds === 'number' && lvlData.upgradeTimeSeconds > 0) {
                totalRawBldgSeconds += lvlData.upgradeTimeSeconds;
              } else {
                totalRawBldgSeconds += 12 * 86400; // verified fallback for high-tier upgrades
              }
            }
          }
        }
      });

      // Target Town Hall structure upgrade itself if transitioning from TH18 -> TH19
      if (targetTH > villageTH) {
        totalRawBldgSeconds += (16 + 50) * 86400;
      }

      // Hero Upgrades (King, Queen, Warden, Champion, Minion Prince, Dragon Duke)
      const HERO_MAX = {
        18: { king: 95, queen: 95, warden: 70, rc: 45, mp: 70, duke: 40 },
        19: { king: 100, queen: 100, warden: 75, rc: 50, mp: 80, duke: 50 }
      };
      const targetHeroes = HERO_MAX[targetTH] || HERO_MAX[18];
      const rawHeroes = currentVillageProfile?.heroes || [];
      const curKing = rawHeroes.find(h => h.data === 28000000 || h.data === 0)?.lvl || 84;
      const curQueen = rawHeroes.find(h => h.data === 28000001 || h.data === 1)?.lvl || 85;
      const curWarden = rawHeroes.find(h => h.data === 28000002 || h.data === 2)?.lvl || 71;
      const curRC = rawHeroes.find(h => h.data === 28000004 || h.data === 3)?.lvl || 44;
      const curMP = rawHeroes.find(h => h.data === 28000006 || h.data === 4)?.lvl || 68;
      const curDuke = rawHeroes.find(h => h.data === 28000007 || h.data === 5)?.lvl || 19;

      const heroDays = (Math.max(0, targetHeroes.king - curKing) * 7.5) +
                       (Math.max(0, targetHeroes.queen - curQueen) * 7.5) +
                       (Math.max(0, targetHeroes.warden - curWarden) * 7.5) +
                       (Math.max(0, targetHeroes.rc - curRC) * 7.5) +
                       (Math.max(0, targetHeroes.mp - curMP) * 6) +
                       (Math.max(0, targetHeroes.duke - curDuke) * 7);
      const totalRawHeroSeconds = heroDays * 86400;

      const builderBoostFactor = 1 - (calcBuilderBoost / 100);
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

      const bldgFormatted = formatTimeDuration(effectiveBldgSeconds);
      const heroFormatted = calcHeroBuilders > 0 ? formatTimeDuration(effectiveHeroSeconds) : 'Paused (0 bldrs)';
      const totalFormatted = formatTimeDuration(totalMaxSeconds);

      let rawLabDays = TH_LAB_DAYS[targetTH] || 320;
      if (targetTH === villageTH) {
        const donePct = currentVillageProfile?.villageProgressPercent || 91;
        rawLabDays = Math.round(rawLabDays * ((100 - donePct) / 100));
      }
      const researchBoostFactor = 1 - (calcResearchBoost / 100);
      const effectiveLabSeconds = rawLabDays * 86400 * researchBoostFactor;
      const labFormatted = formatTimeDuration(effectiveLabSeconds);

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
    }

    // Render Town Hall Progression Tiers (Strictly TH18 & TH19 for a TH18 player; NO past TH17)
    function renderTownHallTiers() {
      const container = document.getElementById('th-tiers-grid');
      if (!container) return;
      container.innerHTML = '';

      const villageTH = currentVillageProfile ? (currentVillageProfile.townHallLevel || 18) : 18;

      // Show relevant tiers: For TH18 player, strictly [18, 19]!
      const relevantTHs = (villageTH >= 18) ? [18, 19] : [villageTH, 18, 19].filter((v, i, a) => a.indexOf(v) === i);

      relevantTHs.forEach(thNum => {
        const p = allProgressions.find(x => x.townHall === thNum);
        if (!p) return;

        const isCurrentlySelected = (thNum === selectedCalcTargetTH);
        const calcData = calculateTimeToReachTH(thNum);

        const card = document.createElement('div');
        card.className = \`obsidian-card \${isCurrentlySelected ? 'active-th-card' : ''}\`;
        card.onclick = (e) => {
          e.stopPropagation();
          selectedCalcTargetTH = thNum;
          renderTownHallTiers();
          renderMaxingRoadmap(selectedCalcTargetTH);
        };

        const tagLabel = thNum === villageTH ? 'CURRENT TH' : (thNum === 19 ? 'MAX TIER' : \`TH \${thNum}\`);

        card.innerHTML = \`
          <div class=\"card-thumb-wrap\">
            <img class=\"card-thumb-img\" src=\"\${getProxyUrl(thImageMap[thNum])}\" alt=\"TH \${thNum}\" onerror=\"handleImgError(this)\">
            <span class=\"th-tier-tag\">\${tagLabel}</span>
          </div>
          <div class=\"card-title-row\">
            <div class=\"card-title-light\">Town Hall \${thNum}</div>
            <span class=\"calc-time-badge \${calcData.isMaxed ? 'maxed' : ''}\">\${calcData.badgeStr}</span>
          </div>
          <div class=\"card-sub-light\">\${p.summary?.totalBuildingInstances || 142} Buildings • \${p.summary?.totalWalls || 325} Walls</div>
          <div class=\"th-calc-breakdown\">
            <div class=\"calc-metric-row\">
              <span class=\"calc-metric-label\">Structures:</span>
              <span class=\"calc-metric-val\">\${calcData.bldgStr}</span>
            </div>
            <div class=\"calc-metric-row\">
              <span class=\"calc-metric-label\">Heroes:</span>
              <span class=\"calc-metric-val\">\${calcData.heroStr}</span>
            </div>
            <div class=\"calc-metric-row\">
              <span class=\"calc-metric-label\">Lab / Research:</span>
              <span class=\"calc-metric-val\">\${calcData.labStr}</span>
            </div>
            <div class=\"calc-metric-row\" style=\"margin-top: 4px; padding-top: 4px; border-top: 1px dashed #27272a;\">
              <span class=\"calc-metric-label\" style=\"color: #ffffff;\">Overall Time:</span>
              <span class=\"bottleneck-tag\">\${calcData.bottleneckStr}</span>
            </div>
          </div>
        \`;
        container.appendChild(card);
      });
    }

    // Render Dedicated Village Heroes Section (All 6 Clash of Clans Heroes including Dragon Duke)
    function renderVillageHeroes() {
      const container = document.getElementById('village-heroes-grid');
      const summaryEl = document.getElementById('heroes-status-summary');
      if (!container) return;
      container.innerHTML = '';

      const profile = currentVillageProfile;
      const rawHeroes = profile?.heroes || [];
      const activeUpgrades = profile?.activeUpgrades || [];

      // Hero Definitions with authentic icons and TH18/TH19 max levels
      const heroDefs = [
        {
          id: 'king',
          dataId: 28000000,
          altDataId: 0,
          name: 'Barbarian King',
          icon: '/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/0/0d/League_King_Icon.png/revision/latest?cb=20230617020454',
          maxAtTH18: 95,
          maxAtTH19: 100
        },
        {
          id: 'queen',
          dataId: 28000001,
          altDataId: 1,
          name: 'Archer Queen',
          icon: '/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/2/2b/League_Queen_Icon.png/revision/latest?cb=20230617021402',
          maxAtTH18: 95,
          maxAtTH19: 100
        },
        {
          id: 'warden',
          dataId: 28000002,
          altDataId: 2,
          name: 'Grand Warden',
          icon: '/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/d/d9/League_Warden_Icon.png/revision/latest?cb=20230617030016',
          maxAtTH18: 70,
          maxAtTH19: 75
        },
        {
          id: 'rc',
          dataId: 28000004,
          altDataId: 3,
          name: 'Royal Champion',
          icon: '/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/6/6d/League_Champion_Icon.png/revision/latest?cb=20230621045309',
          maxAtTH18: 45,
          maxAtTH19: 50
        },
        {
          id: 'mp',
          dataId: 28000006,
          altDataId: 4,
          name: 'Minion Prince',
          icon: '/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/4/4c/Minion_Prince_info.png/revision/latest?cb=20241007130000',
          maxAtTH18: 70,
          maxAtTH19: 80
        },
        {
          id: 'duke',
          dataId: 28000007,
          altDataId: 5,
          name: 'Dragon Duke',
          icon: '/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/9/95/Dragon_Duke_teaser.png',
          maxAtTH18: 40,
          maxAtTH19: 50
        }
      ];

      let upgradingCount = 0;

      heroDefs.forEach(def => {
        const found = rawHeroes.find(h => h.data === def.dataId || h.data === def.altDataId || (h.name && h.name.toLowerCase() === def.name.toLowerCase()));
        const curLvl = found ? (found.lvl || 0) : 0;
        const maxLvl = def.maxAtTH18;

        const isUpgrading = (found && found.timer && found.timer > 0) || activeUpgrades.some(u => u.name && u.name.toLowerCase().includes(def.name.toLowerCase()));
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
            <div class=\"hero-upgrade-badge\" title=\"Hero is currently upgrading\">
              <img src=\"/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/b/b2/ChallengesIcon_HeroPetUpgrade.png/revision/latest?cb=20260220114002\" alt=\"Upgrading\">
            </div>
          \` : ''}
          <div class=\"hero-header-row\">
            <img class=\"hero-avatar-img\" src=\"\${def.icon}\" alt=\"\${def.name}\" onerror=\"handleImgError(this)\">
            <div class=\"hero-info-wrap\">
              <span class=\"hero-name\">\${def.name}</span>
              <span class=\"hero-level-txt\">Level \${curLvl} <span class=\"hero-level-max\">/ \${maxLvl}</span></span>
            </div>
          </div>
          <div class=\"hero-progress-bar\">
            <div class=\"hero-progress-fill\" style=\"width: \${pct}%;\"></div>
          </div>
          <div class=\"hero-status-pill \${statusClass}\">
            \${statusText}
          </div>
        \`;
        container.appendChild(card);
      });

      if (summaryEl) {
        summaryEl.textContent = upgradingCount > 0 ? \`\${upgradingCount} of 6 Heroes Upgrading\` : 'All 6 Heroes Ready';
      }
    }

    // Filter and Search handlers for Maxing Roadmap
    function filterRoadmap(cat) {
      roadmapActiveCategory = cat;
      document.querySelectorAll('#roadmap-category-tabs .roadmap-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.cat === cat);
      });
      renderMaxingRoadmap(selectedCalcTargetTH);
    }

    function onRoadmapSearch(val) {
      roadmapSearchQuery = (val || '').toLowerCase().trim();
      renderMaxingRoadmap(selectedCalcTargetTH);
    }

    // Render Maxing Roadmap Table with per-building & hero breakdown
    function renderMaxingRoadmap(targetTH) {
      const tbody = document.getElementById('roadmap-table-body');
      const targetPill = document.getElementById('roadmap-target-th-pill');
      if (!tbody) return;

      if (targetPill) {
        targetPill.textContent = \`Town Hall \${targetTH}\`;
      }

      tbody.innerHTML = '';

      const p = allProgressions.find(x => x.townHall === targetTH);
      if (!p) return;

      const profile = currentVillageProfile;
      const villageBuildings = profile?.buildings || [];
      const activeUpgrades = profile?.activeUpgrades || [];
      const boostFactor = 1 - (calcBuilderBoost / 100);

      const items = [];

      // 1. Collect Buildings
      p.buildings.forEach(pb => {
        if (pb.name.toLowerCase() === 'wall') return; // instant upgrade
        const bData = allBuildings.find(b => b.name.toLowerCase() === pb.name.toLowerCase());
        const ownedLevels = getVillageBuildingLevels(pb.name, villageBuildings);
        const curLvl = ownedLevels[0] !== undefined ? ownedLevels[0] : 0;
        const maxLvl = pb.maxAvailableLevel;
        const levelsRemaining = Math.max(0, maxLvl - curLvl);

        let rawSec = 0;
        if (levelsRemaining > 0 && bData && bData.levels) {
          for (let l = curLvl + 1; l <= maxLvl; l++) {
            const lvlObj = bData.levels.find(lv => lv.level === l);
            if (lvlObj && typeof lvlObj.upgradeTimeSeconds === 'number' && lvlObj.upgradeTimeSeconds > 0) {
              rawSec += lvlObj.upgradeTimeSeconds;
            } else {
              rawSec += 12 * 86400;
            }
          }
        }
        const effectiveSec = rawSec * boostFactor;

        // Image resolving
        let imgSrc = '';
        if (bData && bData.levels) {
          const lObj = bData.levels.find(lv => lv.level === maxLvl) || bData.levels[bData.levels.length - 1];
          if (lObj?.image?.url) imgSrc = getProxyUrl(lObj.image.url);
        }
        if (!imgSrc) {
          imgSrc = \`/downloads/images/\${encodeURIComponent(pb.name)}/level-\${maxLvl}.png\`;
        }

        const isUpgrading = activeUpgrades.some(u => u.name && u.name.toLowerCase().includes(pb.name.toLowerCase()));
        const upgObj = isUpgrading ? activeUpgrades.find(u => u.name && u.name.toLowerCase().includes(pb.name.toLowerCase())) : null;

        const cat = pb.category || 'Defense';
        const progressPct = maxLvl > 0 ? Math.min(100, Math.round((curLvl / maxLvl) * 100)) : 100;

        items.push({
          name: pb.name,
          category: cat,
          curLvl,
          maxLvl,
          levelsRemaining,
          effectiveSec,
          progressPct,
          imgSrc,
          isUpgrading,
          activeTimerSec: upgObj ? upgObj.timerSeconds : 0,
          targetUpgLevel: upgObj ? upgObj.targetLevel : (curLvl + 1)
        });
      });

      // 2. Collect 6 Heroes
      const HERO_MAX = {
        18: { king: 95, queen: 95, warden: 70, rc: 45, mp: 70, duke: 40 },
        19: { king: 100, queen: 100, warden: 75, rc: 50, mp: 80, duke: 50 }
      };
      const thHeroMax = HERO_MAX[targetTH] || HERO_MAX[18];
      const rawHeroes = profile?.heroes || [];

      const heroesList = [
        { name: 'Barbarian King', dataId: 28000000, max: thHeroMax.king, perLvlDays: 7.5, icon: 'https://static.wikia.nocookie.net/clashofclans/images/0/0d/League_King_Icon.png/revision/latest?cb=20230617020454' },
        { name: 'Archer Queen', dataId: 28000001, max: thHeroMax.queen, perLvlDays: 7.5, icon: 'https://static.wikia.nocookie.net/clashofclans/images/2/2b/League_Queen_Icon.png/revision/latest?cb=20230617021402' },
        { name: 'Grand Warden', dataId: 28000002, max: thHeroMax.warden, perLvlDays: 7.5, icon: 'https://static.wikia.nocookie.net/clashofclans/images/d/d9/League_Warden_Icon.png/revision/latest?cb=20230617030016' },
        { name: 'Royal Champion', dataId: 28000004, max: thHeroMax.rc, perLvlDays: 7.5, icon: 'https://static.wikia.nocookie.net/clashofclans/images/6/6d/League_Champion_Icon.png/revision/latest?cb=20230621045309' },
        { name: 'Minion Prince', dataId: 28000006, max: thHeroMax.mp, perLvlDays: 6, icon: 'https://static.wikia.nocookie.net/clashofclans/images/4/4c/Minion_Prince_info.png/revision/latest?cb=20241007130000' },
        { name: 'Dragon Duke', dataId: 28000007, max: thHeroMax.duke, perLvlDays: 7, icon: 'https://static.wikia.nocookie.net/clashofclans/images/9/95/Dragon_Duke_teaser.png' }
      ];

      heroesList.forEach(h => {
        const hFound = rawHeroes.find(x => x.data === h.dataId);
        const curLvl = hFound ? (hFound.lvl || 0) : 0;
        const maxLvl = h.max;
        const levelsRemaining = Math.max(0, maxLvl - curLvl);
        const effectiveSec = levelsRemaining * h.perLvlDays * 86400 * boostFactor;
        const isUpgrading = (hFound && hFound.timer > 0) || activeUpgrades.some(u => u.name && u.name.toLowerCase().includes(h.name.toLowerCase()));
        const progressPct = Math.min(100, Math.round((curLvl / maxLvl) * 100));

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

      // Filter by category and search
      const filtered = items.filter(item => {
        if (roadmapActiveCategory !== 'all' && item.category !== roadmapActiveCategory) return false;
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

      filtered.forEach(it => {
        const tr = document.createElement('tr');
        const isMaxed = it.levelsRemaining === 0;

        let statusBadge = '<span class="roadmap-status-pill" style="background:#27272a; color:#a1a1aa;">Ready</span>';
        if (it.isUpgrading) {
          const tRem = it.activeTimerSec > 0 ? formatSecondsToCoCTime(it.activeTimerSec) : 'In Progress';
          statusBadge = \`<span class="roadmap-status-pill active-upg" style="background:#27272a; border:1px solid #ffffff; color:#ffffff;">Active (\${tRem})</span>\`;
        } else if (isMaxed) {
          statusBadge = '<span class="roadmap-status-pill" style="background:#18181b; color:#71717a;">Maxed Tier</span>';
        }

        const timeStr = isMaxed ? '0d' : formatTimeDuration(it.effectiveSec);

        tr.innerHTML = \`
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="\${it.imgSrc}" alt="\${it.name}" style="width: 24px; height: 24px; object-fit: contain;" onerror="handleImgError(this)">
              <span style="font-weight: 700; color: #ffffff;">\${it.name}</span>
            </div>
          </td>
          <td><span style="font-size: 11px; color: #a1a1aa; background: #18181b; padding: 2px 6px; border-radius: 4px; border: 1px solid #27272a;">\${it.category}</span></td>
          <td><span style="font-weight: 700;">Level \${it.curLvl}</span></td>
          <td><span style="font-weight: 700; color: #ffffff;">Level \${it.maxLvl}</span></td>
          <td>\${isMaxed ? '<span style="color:#71717a;">0</span>' : \`<span style="color:#ffffff; font-weight:700;">+\${it.levelsRemaining} lvls</span>\`}</td>
          <td><span style="font-weight: 700; color: \${isMaxed ? '#71717a' : '#ffffff'};">\${timeStr}</span></td>
          <td style="width: 140px;">
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #a1a1aa; margin-bottom: 2px;">
              <span>\${it.progressPct}%</span>
            </div>
            <div class="roadmap-prog-bar">
              <div class="roadmap-prog-fill" style="width: \${it.progressPct}%;"></div>
            </div>
          </td>
          <td>\${statusBadge}</td>
        \`;
        tbody.appendChild(tr);
      });
    }

    \n    `;

html = html.slice(0, idxJsStart) + newJsBlock + html.slice(idxJsEnd);

console.log('JS block updated successfully.');

// 3. UPDATE renderDynamicSchedule TO STRETCH UPGRADE BARS TO FINISH DATE & REMOVE REDUNDANT TEXT
const scheduleOldBlockRegex = /upgrades\.forEach\(\(upg, idx\) => \{[\s\S]*?upgradesContainer\.appendChild\(capsule\);\s*\}\);/;

const scheduleNewBlock = `upgrades.forEach((upg, idx) => {
        const trackTop = 136 + (idx * 34);
        const seconds = upg.timerSeconds || 86400;
        const finishDate = new Date(now.getTime() + (seconds * 1000));
        const finishDayStr = finishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const finishTimeStr = finishDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        const nowColLeftPercent = colPercent;
        const finishPercent = timeToPercent(finishDate.getTime());
        // Dynamic capsule width extending cleanly to exact finish date on calendar
        const widthPercent = Math.max(7.5, finishPercent - nowColLeftPercent);

        let displayName = upg.name || 'Building';
        if (displayName.startsWith('Structure #')) {
          const rawNum = displayName.replace('Structure #', '').trim();
          if (rawNum === '1000000') displayName = 'Cannon';
          else if (rawNum === '1000067' || rawNum === '1000068') displayName = 'Spell Tower';
          else if (rawNum === '1000084') displayName = 'Multi-Archer Tower';
        }

        let imgSrc = '';
        if (upg.image && upg.image.url) {
          imgSrc = getProxyUrl(upg.image.url);
        } else {
          const bMatch = allBuildings.find(b => b.name.toLowerCase().includes(displayName.toLowerCase()));
          const lvlImg = bMatch?.levels?.find(l => l.level === upg.targetLevel)?.image?.url ||
                         bMatch?.levels?.find(l => l.level === upg.currentLevel)?.image?.url;
          imgSrc = lvlImg ? getProxyUrl(lvlImg) : '/downloads/images/Cannon/level-14.png';
        }

        const formattedTime = formatSecondsToCoCTime(seconds);

        const capsule = document.createElement('div');
        capsule.className = 'timeline-upgrade-capsule';
        capsule.style.cssText = \`left: \${nowColLeftPercent.toFixed(4)}%; width: \${widthPercent.toFixed(4)}%; top: \${trackTop}px;\`;
        capsule.onclick = () => openBuildingModal(displayName);
        capsule.title = \`\${displayName} upgrading to Lv \${upg.targetLevel} (Finishes \${finishDayStr} at \${finishTimeStr} • \${formattedTime} remaining)\`;

        // Bar length visually indicates completion day on calendar; timer pill indicates countdown
        capsule.innerHTML = \`
          <img src="\${imgSrc}" alt="\${displayName}" onerror="handleImgError(this)">
          <span class="timeline-upgrade-title">\${displayName} Lv \${upg.currentLevel || '?'} → Lv \${upg.targetLevel || '?'}</span>
          <span class="timeline-upgrade-timer-pill" style="margin-left: auto;">\${formattedTime}</span>
        \`;

        upgradesContainer.appendChild(capsule);
      });`;

if (!scheduleOldBlockRegex.test(html)) {
  console.error('Could not locate scheduleOldBlockRegex in HTML');
  process.exit(1);
}

html = html.replace(scheduleOldBlockRegex, scheduleNewBlock);
console.log('Dynamic schedule upgrade bar stretching updated successfully.');

// 4. Ensure renderDashboard calls renderMaxingRoadmap
if (!html.includes('renderMaxingRoadmap(selectedCalcTargetTH)')) {
  html = html.replace('renderVillageHeroes();', 'renderVillageHeroes();\n      renderMaxingRoadmap(selectedCalcTargetTH);');
  console.log('Added renderMaxingRoadmap call into renderDashboard.');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Successfully written updated index.html! File length:', html.length);
