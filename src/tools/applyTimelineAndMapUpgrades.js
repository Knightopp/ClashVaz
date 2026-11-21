import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.resolve(__dirname, '../../public/index.html');

let content = fs.readFileSync(indexPath, 'utf8');

// 1. Add CSS rules before </style>
const additionalCSS = `
    /* Timeline Upgrades Toggle Pill in Header */
    .timeline-toggle-pill {
      background: #18181b;
      border: 1px solid #27272a;
      color: #a1a1aa;
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 9999px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      letter-spacing: 0.3px;
    }

    .timeline-toggle-pill:hover {
      background: #27272a;
      color: #ffffff;
      border-color: #3f3f46;
    }

    .timeline-toggle-pill.active {
      background: #27272a;
      border-color: #ffffff;
      color: #ffffff;
    }

    .toggle-pill-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ffffff;
    }

    .timeline-toggle-pill:not(.active) .toggle-pill-dot {
      background: #52525b;
    }

    .upgrades-collapse-btn {
      background: #18181b;
      border: 1px solid #27272a;
      color: #a1a1aa;
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .upgrades-collapse-btn:hover {
      background: #27272a;
      color: #ffffff;
      border-color: #3f3f46;
    }

    /* Timeline Upgrade Capsule (Shaped like Event Capsules) */
    .timeline-upgrade-capsule {
      position: absolute;
      height: 30px;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      padding: 0 10px;
      gap: 8px;
      cursor: pointer;
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 11px;
      letter-spacing: 0.3px;
      white-space: nowrap;
      background: #18181b;
      border: 1px solid #3f3f46;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      transition: all 0.15s ease;
      z-index: 7;
      min-width: 170px;
      box-sizing: border-box;
    }

    .timeline-upgrade-capsule:hover {
      background: #27272a;
      border-color: #ffffff;
      transform: translateY(-1px);
      box-shadow: 0 0 14px rgba(255, 255, 255, 0.15), 0 4px 12px rgba(0, 0, 0, 0.6);
    }

    .timeline-upgrade-capsule img {
      width: 20px;
      height: 20px;
      object-fit: contain;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
      flex-shrink: 0;
    }

    .timeline-upgrade-title {
      color: #ffffff;
      white-space: nowrap;
    }

    .timeline-upgrade-timer-pill {
      background: #27272a;
      border: 1px solid #3f3f46;
      border-radius: 9999px;
      padding: 1px 7px;
      font-size: 10px;
      color: #ffffff;
      margin-left: auto;
      font-weight: 700;
    }

    .timeline-upgrade-day-tag {
      font-size: 9px;
      color: #71717a;
      font-weight: 800;
      margin-left: 4px;
      text-transform: uppercase;
    }

    /* Map Building Upgrade Overlay */
    .map-upgrade-pill {
      position: absolute;
      top: -6px;
      right: -6px;
      background: #000000;
      border: 1px solid #ffffff;
      border-radius: 9999px;
      padding: 1px 6px;
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 9px;
      font-family: 'Lilita One', cursive, sans-serif;
      color: #ffffff;
      z-index: 9;
      pointer-events: none;
      box-shadow: 0 2px 6px rgba(0,0,0,0.8), 0 0 8px rgba(255,255,255,0.25);
      white-space: nowrap;
    }

    .map-hammer-icon {
      font-size: 9px;
    }
  </style>`;

content = content.replace('  </style>', additionalCSS);

// 2. Update Timeline Header in HTML
const oldTimelineHeader = `          <div class="timeline-header-row">
            <span class="timeline-title">Event & Clan Schedule</span>
            <span style="font-size: 11px; color: #71717a; font-weight: 800;">November 2026 Schedule</span>
          </div>`;

const newTimelineHeader = `          <div class="timeline-header-row">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="timeline-title">Event & Clan Schedule</span>
              <button id="toggle-timeline-upgrades-btn" class="timeline-toggle-pill active" onclick="toggleTimelineUpgrades()" title="Toggle active village upgrades on schedule">
                <span class="toggle-pill-dot"></span>
                <span id="timeline-toggle-label">Hide Upgrades</span>
              </button>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 11px; color: #71717a; font-weight: 800;">November 2026 Schedule</span>
            </div>
          </div>`;

content = content.replace(oldTimelineHeader, newTimelineHeader);

// 3. Update timeline upgrades divider in HTML
const oldDivider = `                <div class="timeline-upgrades-divider">
                  <span class="timeline-upgrades-label">
                    <img src="/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/1/14/Builder.png/revision/latest?cb=20210413073645" style="width: 14px; height: 14px; object-fit: contain;" alt="Builder">
                    Active Upgrades in Progress
                  </span>
                  <span class="timeline-upgrades-count" id="timeline-upgrades-count">3 in progress</span>
                </div>`;

const newDivider = `                <div class="timeline-upgrades-divider">
                  <span class="timeline-upgrades-label">
                    <img src="/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/1/14/Builder.png/revision/latest?cb=20210413073645" style="width: 14px; height: 14px; object-fit: contain;" alt="Builder">
                    Active Upgrades in Progress
                  </span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="timeline-upgrades-count" id="timeline-upgrades-count">0 in progress</span>
                    <button class="upgrades-collapse-btn" onclick="toggleTimelineUpgrades()" id="upgrades-collapse-btn">▲ Collapse</button>
                  </div>
                </div>`;

content = content.replace(oldDivider, newDivider);

// 4. Update Village Layout Toolbar to add Upgrades: ON toggle
const oldToolbarGroup = `            <div class="layout-toolbar-group">
              <div class="sandbox-toggle-pill" id="sandbox-toggle-btn" onclick="toggleSandbox()">Sandbox: OFF</div>
              <button class="layout-tool-btn" onclick="zoomIn()" title="Zoom In">+</button>`;

const newToolbarGroup = `            <div class="layout-toolbar-group">
              <div class="sandbox-toggle-pill active" id="layout-upgrades-toggle" onclick="toggleLayoutUpgrades()" title="Toggle active upgrade badges on village buildings">Upgrades: ON</div>
              <div class="sandbox-toggle-pill" id="sandbox-toggle-btn" onclick="toggleSandbox()">Sandbox: OFF</div>
              <button class="layout-tool-btn" onclick="zoomIn()" title="Zoom In">+</button>`;

content = content.replace(oldToolbarGroup, newToolbarGroup);

// 5. Replace renderTimelineUpgrades function with the new full-featured implementation
const oldFuncStart = 'function renderTimelineUpgrades(profile) {';
const oldFuncEnd = 'function formatSecondsToCoCTime(seconds) {';
const startIdx = content.indexOf(oldFuncStart);
const endIdx = content.indexOf(oldFuncEnd);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not locate renderTimelineUpgrades in file');
  process.exit(1);
}

const newFunctions = `let isTimelineUpgradesVisible = true;
    let showMapUpgrades = true;

    function toggleTimelineUpgrades() {
      isTimelineUpgradesVisible = !isTimelineUpgradesVisible;
      const upgradesSec = document.getElementById('timeline-upgrades-section');
      const toggleBtn = document.getElementById('toggle-timeline-upgrades-btn');
      const toggleLabel = document.getElementById('timeline-toggle-label');
      const collapseBtn = document.getElementById('upgrades-collapse-btn');
      const canvasInner = document.querySelector('.timeline-canvas-inner');

      const count = (currentVillageProfile && currentVillageProfile.activeUpgrades) ? currentVillageProfile.activeUpgrades.length : 0;

      if (isTimelineUpgradesVisible) {
        if (upgradesSec) upgradesSec.style.display = 'block';
        if (toggleBtn) toggleBtn.classList.add('active');
        if (toggleLabel) toggleLabel.textContent = 'Hide Upgrades';
        if (collapseBtn) collapseBtn.textContent = '▲ Collapse';
        if (canvasInner) {
          canvasInner.style.height = \`\${144 + 36 + (count * 36) + 16}px\`;
        }
      } else {
        if (upgradesSec) upgradesSec.style.display = 'none';
        if (toggleBtn) toggleBtn.classList.remove('active');
        if (toggleLabel) toggleLabel.textContent = \`Show Upgrades (\${count})\`;
        if (collapseBtn) collapseBtn.textContent = '▼ Show';
        if (canvasInner) canvasInner.style.height = '152px';
      }
    }

    function toggleLayoutUpgrades() {
      showMapUpgrades = !showMapUpgrades;
      const pill = document.getElementById('layout-upgrades-toggle');
      if (pill) {
        if (showMapUpgrades) {
          pill.classList.add('active');
          pill.textContent = 'Upgrades: ON';
        } else {
          pill.classList.remove('active');
          pill.textContent = 'Upgrades: OFF';
        }
      }
      renderLayoutCanvas();
    }

    function renderTimelineUpgrades(profile) {
      const upgradesSec = document.getElementById('timeline-upgrades-section');
      const tracksContainer = document.getElementById('timeline-upgrades-tracks');
      const countEl = document.getElementById('timeline-upgrades-count');
      const toggleLabel = document.getElementById('timeline-toggle-label');
      const toggleBtn = document.getElementById('toggle-timeline-upgrades-btn');
      const canvasInner = document.querySelector('.timeline-canvas-inner');

      const upgrades = (profile && profile.activeUpgrades) ? profile.activeUpgrades : [];

      if (!upgradesSec || !tracksContainer) return;

      if (upgrades.length === 0) {
        upgradesSec.style.display = 'none';
        if (toggleBtn) toggleBtn.style.display = 'none';
        if (canvasInner) canvasInner.style.height = '152px';
        return;
      }

      if (toggleBtn) {
        toggleBtn.style.display = 'inline-flex';
        if (toggleLabel) {
          toggleLabel.textContent = isTimelineUpgradesVisible ? 'Hide Upgrades' : \`Show Upgrades (\${upgrades.length})\`;
        }
      }

      if (countEl) countEl.textContent = \`\${upgrades.length} in progress\`;

      if (!isTimelineUpgradesVisible) {
        upgradesSec.style.display = 'none';
        if (canvasInner) canvasInner.style.height = '152px';
        return;
      }

      upgradesSec.style.display = 'block';
      if (canvasInner) {
        canvasInner.style.height = \`\${144 + 36 + (upgrades.length * 36) + 16}px\`;
      }

      tracksContainer.innerHTML = '';

      // Total ruler has 17 days (Day 18 to Day 4).
      // Day 19 ("Now" line) is at left = 5.8824% (start of column 1).
      const NOW_LEFT_PERCENT = 5.8824;
      const DAY_COL_WIDTH = 5.8824; // 100% / 17

      upgrades.forEach((upg, idx) => {
        const row = document.createElement('div');
        row.className = 'timeline-upgrade-row';

        const seconds = upg.timerSeconds || 86400;
        const daysRemaining = seconds / 86400;

        // Visual width spans from Now (Day 19) forward according to finish duration
        // Minimum width 20% so title, icon, and time badge look like a full event capsule
        const widthPercent = Math.min(92, Math.max(20, (daysRemaining * DAY_COL_WIDTH) + 12));

        // Calculate finish date
        const finishDate = new Date(Date.now() + (seconds * 1000));
        const finishDayStr = finishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const finishTimeStr = finishDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        // Resolve clean name and image
        let displayName = upg.name || 'Building';
        if (displayName.startsWith('Structure #')) {
          const rawNum = displayName.replace('Structure #', '').trim();
          if (rawNum === '1000000') displayName = 'Cannon';
          else if (rawNum === '1000067') displayName = 'Spell Tower';
          else if (rawNum === '1000084') displayName = 'Multi-Archer Tower';
        }

        // Find appropriate image
        let imgSrc = '';
        if (upg.image && upg.image.url) {
          imgSrc = getProxyUrl(upg.image.url);
        } else {
          const bMatch = allBuildings.find(b => b.name.toLowerCase().includes(displayName.toLowerCase()));
          const lvlImg = bMatch?.levels?.find(l => l.level === upg.targetLevel)?.image?.url ||
                         bMatch?.levels?.find(l => l.level === upg.currentLevel)?.image?.url ||
                         bMatch?.levels[bMatch.levels.length - 1]?.image?.url;
          imgSrc = lvlImg ? getProxyUrl(lvlImg) : '/downloads/images/Cannon/level-14.png';
        }

        const formattedTime = formatSecondsToCoCTime(seconds);

        row.innerHTML = \`
          <div class="timeline-upgrade-capsule" 
               style="left: \${NOW_LEFT_PERCENT}%; width: \${widthPercent}%;" 
               onclick="openBuildingModal('\${displayName}')" 
               title="\${displayName} upgrading to Lv \${upg.targetLevel} (Finishes \${finishDayStr} at \${finishTimeStr} • \${formattedTime} remaining)">
            <img src="\${imgSrc}" alt="\${displayName}" onerror="handleImgError(this)">
            <span class="timeline-upgrade-title">\${displayName} Lv \${upg.currentLevel} → Lv \${upg.targetLevel}</span>
            <span class="timeline-upgrade-day-tag">Ends \${finishDayStr}</span>
            <span class="timeline-upgrade-timer-pill">\${formattedTime}</span>
          </div>
        \`;
        tracksContainer.appendChild(row);
      });
    }

    `;

content = content.slice(0, startIdx) + newFunctions + content.slice(endIdx);

// 6. Update renderPlacedBuildings in JavaScript to show map upgrade badges
const oldPlacedInner = `        tile.innerHTML = \`
          <img class="placed-building-img" src="\${imgSrc}" alt="\${b.name}" onerror="handleImgError(this)">
          <span class="placed-building-lvl">\${b.level}</span>
        \`;`;

const newPlacedInner = `        // Check if building has an active upgrade in progress
        const isUpgrading = (currentVillageProfile && currentVillageProfile.activeUpgrades) ?
          currentVillageProfile.activeUpgrades.find(u => {
            const uName = (u.name || '').toLowerCase();
            const bName = (b.name || '').toLowerCase();
            const bId = (b.buildingId || '').toLowerCase();
            return bName.includes(uName) || uName.includes(bName) || bId.includes(u.id);
          }) : null;

        const upgradeBadgeHtml = (isUpgrading && showMapUpgrades) ? \`
          <div class="map-upgrade-pill" title="\${b.name} upgrading to Lv \${isUpgrading.targetLevel} (\${formatSecondsToCoCTime(isUpgrading.timerSeconds)} remaining)">
            <span class="map-hammer-icon">🔨</span>
            <span>Lv \${isUpgrading.targetLevel}</span>
          </div>
        \` : '';

        tile.innerHTML = \`
          <img class="placed-building-img" src="\${imgSrc}" alt="\${b.name}" onerror="handleImgError(this)">
          <span class="placed-building-lvl">\${b.level}</span>
          \${upgradeBadgeHtml}
        \`;`;

content = content.replace(oldPlacedInner, newPlacedInner);

// Verify JS syntax
const scriptStartTag = content.indexOf('<script>');
const scriptEndTag = content.lastIndexOf('</script>');
const scriptBody = content.slice(scriptStartTag + '<script>'.length, scriptEndTag);

try {
  vm.compileFunction(scriptBody);
  console.log('Script syntax check PASSED! 0 errors.');
} catch (err) {
  console.error('Script syntax check FAILED:', err);
  process.exit(1);
}

fs.writeFileSync(indexPath, content, 'utf8');
console.log('Successfully updated timeline and map upgrades with hide/show toggles!');
