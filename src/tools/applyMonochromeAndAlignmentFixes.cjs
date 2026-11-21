const fs = require('fs');
const path = require('path');

function updateHtmlFile(filePath) {
  console.log(`Updating ${filePath}...`);
  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Monochromatic CSS enhancements
  // Replace fallback icon base64 with monochromatic obsidian/charcoal (#3f3f46)
  const oldFallback = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjZDY5ZTNmIj48cGF0aCBkPSJNMTIgMkwzIDd2NmMwIDUuNTUgMy44NCAxMC43NCA5IDEyIDUuMTYtMS4yNiA5LTYuNDUgOS0xMlY3bC05LTV6Ii8+PC9zdmc+';
  const newFallback = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjM2YzZjQ2Ij48cGF0aCBkPSJNMTIgMkwzIDd2NmMwIDUuNTUgMy44NCAxMC43NCA5IDEyIDUuMTYtMS4yNiA5LTYuNDUgOS0xMlY3bC05LTV6Ii8+PC9zdmc+';
  html = html.split(oldFallback).join(newFallback);

  // 2. Monochromatic global CSS rules
  const monoCssRules = `
    /* Monochromatic Black & White Asset Filters & Contrast Adjustments */
    .nav-coc-icon, .mobile-brand-icon, .brand-logo-img, .profile-league-badge, .builder-coc-avatar {
      filter: grayscale(100%) contrast(115%);
    }
    .axis-trophy svg {
      fill: #ffffff !important;
    }
    .timeline-pill-event img {
      filter: grayscale(100%) contrast(115%);
    }
    .timeline-upgrade-capsule img {
      filter: grayscale(100%) contrast(115%);
    }
    .card-thumb-img, .th-render-img, #banner-th-img {
      filter: grayscale(100%) contrast(110%);
    }
    .builder-status-tag {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    .status-busy {
      background: #27272a !important;
      color: #ffffff !important;
      border: 1px solid #3f3f46 !important;
    }
    .status-idle, .status-ready {
      background: #18181b !important;
      color: #71717a !important;
      border: 1px solid #27272a !important;
    }
    .progress-bar-fill {
      background: #ffffff !important;
    }
    .hero-stat-card {
      background: #141416 !important;
      border: 1px solid #27272a !important;
    }
    .hero-avatar-frame {
      background: #18181b !important;
      border: 1px solid #3f3f46 !important;
    }
    .hero-avatar-img {
      filter: grayscale(100%) contrast(110%);
    }
    .hero-progress-fill {
      background: #ffffff !important;
    }
    .hero-status-pill {
      background: #27272a !important;
      color: #ffffff !important;
      border: 1px solid #3f3f46 !important;
    }
    .hero-status-pill.upgrading {
      background: #ffffff !important;
      color: #000000 !important;
      border: 1px solid #ffffff !important;
    }
    .timeline-now-line {
      position: absolute;
      top: 24px;
      bottom: 0;
      width: 2px;
      background: #ffffff;
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
      z-index: 6;
      pointer-events: none;
    }
  `;

  if (!html.includes('Monochromatic Black & White Asset Filters')) {
    html = html.replace('/* App Frame: 3 Columns */', `${monoCssRules}\n    /* App Frame: 3 Columns */`);
  }

  // 3. Update .timeline-upgrade-capsule CSS for precise alignment and clear readability
  const oldCapsuleCss = `.timeline-upgrade-capsule {
      position: absolute;
      height: 28px;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      padding: 0 8px;
      gap: 6px;
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
      box-sizing: border-box;
      min-width: 65px;
      overflow: hidden;
    }`;

  const newCapsuleCss = `.timeline-upgrade-capsule {
      position: absolute;
      height: 28px;
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
      z-index: 8;
      box-sizing: border-box;
      min-width: 145px;
      overflow: hidden;
    }`;

  if (html.includes(oldCapsuleCss)) {
    html = html.replace(oldCapsuleCss, newCapsuleCss);
  }

  // 4. Update Desktop Right Sidebar Builders & Village Huts HTML to be dynamically populated
  const oldBuildersHtml = `<div class="builders-list">
          <div class="builder-row">
            <div class="builder-info-left">
              <img src="/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/0/04/MasterBuilder1.png/revision/latest?cb=20170529034341" class="builder-coc-avatar" alt="MB">
              <span class="builder-name">Master Builder</span>
            </div>
            <span class="builder-status-tag status-busy">Firespitter</span>
          </div>
          <div class="builder-row">
            <div class="builder-info-left">
              <img src="/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/1/14/Builder.png/revision/latest?cb=20210413073645" class="builder-coc-avatar" alt="B2">
              <span class="builder-name">Builder 2</span>
            </div>
            <span class="builder-status-tag status-busy">Monolith</span>
          </div>
          <div class="builder-row">
            <div class="builder-info-left">
              <img src="/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/1/14/Builder.png/revision/latest?cb=20210413073645" class="builder-coc-avatar" alt="B3">
              <span class="builder-name">Builder 3</span>
            </div>
            <span class="builder-status-tag status-busy">Firecracker</span>
          </div>
          <div class="builder-row">
            <div class="builder-info-left">
              <img src="/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/1/14/Builder.png/revision/latest?cb=20210413073645" class="builder-coc-avatar" alt="B4">
              <span class="builder-name">Builder 4</span>
            </div>
            <span class="builder-status-tag status-busy">Wall Lv 20</span>
          </div>
          <div class="builder-row">
            <div class="builder-info-left">
              <img src="/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/2/26/Resting_Builder.png/revision/latest?cb=20171106182918" class="builder-coc-avatar" alt="B5">
              <span class="builder-name">Builder 5</span>
            </div>
            <span class="builder-status-tag status-idle">Ready</span>
          </div>
        </div>`;

  const newBuildersHtml = `<div class="builders-list" id="desktop-builders-list">
          <!-- Dynamically populated via updateVillageUI -->
        </div>`;

  if (html.includes(oldBuildersHtml)) {
    html = html.replace(oldBuildersHtml, newBuildersHtml);
  }

  // 5. Update updateVillageUI in JS to populate #desktop-builders-list
  const oldRightListCode = `      // Populate Desktop Right Upgrades List
      const rightList = document.getElementById('right-upgrades-list');
      if (rightList && upgrades.length > 0) {
        rightList.innerHTML = upgrades.slice(0, 5).map(u => renderUpgradeItemHtml(u)).join('');
      }`;

  const newRightListCode = `      // Populate Desktop Right Upgrades List
      const rightList = document.getElementById('right-upgrades-list');
      if (rightList) {
        if (upgrades.length === 0) {
          rightList.innerHTML = '<div style="color:#71717a; font-size:11px; padding:8px 0;">All builders free.</div>';
        } else {
          rightList.innerHTML = upgrades.slice(0, 6).map(u => renderUpgradeItemHtml(u)).join('');
        }
      }

      // Populate Desktop Right Builders List
      const deskBuilders = document.getElementById('desktop-builders-list');
      if (deskBuilders) {
        let bHtml = '';
        for (let i = 0; i < 6; i++) {
          const upg = upgrades[i];
          const isMaster = i === 0;
          const bName = isMaster ? 'Master Builder' : \`Builder \${i + 1}\`;
          const bAvatar = isMaster ? 
            '/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/0/04/MasterBuilder1.png/revision/latest?cb=20170529034341' :
            (upg ? '/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/1/14/Builder.png/revision/latest?cb=20210413073645' :
                   '/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/2/26/Resting_Builder.png/revision/latest?cb=20171106182918');
          const statusText = upg ? \`\${cleanBuildingName(upg.name)} Lv \${upg.targetLevel}\` : 'Ready';
          const statusClass = upg ? 'status-busy' : 'status-ready';
          bHtml += \`
            <div class="builder-row">
              <div class="builder-info-left">
                <img src="\${bAvatar}" class="builder-coc-avatar" alt="\${bName}" onerror="handleImgError(this)">
                <span class="builder-name">\${bName}</span>
              </div>
              <span class="builder-status-tag \${statusClass}">\${statusText}</span>
            </div>
          \`;
        }
        deskBuilders.innerHTML = bHtml;
      }`;

  if (html.includes(oldRightListCode)) {
    html = html.replace(oldRightListCode, newRightListCode);
  }

  // 6. Update renderTimelineUpgrades positioning and width calculation
  const oldTimelineUpgradesCode = `        const nowColLeftPercent = colPercent;
        const finishPercent = timeToPercent(finishDate.getTime());
        // Dynamic capsule width extending cleanly to exact finish date on calendar
        const widthPercent = Math.max(7.5, finishPercent - nowColLeftPercent);

        let displayName = upg.name || 'Building';

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
          <span class="timeline-upgrade-title">\${displayName} Lv \${upg.currentLevel !== undefined ? upg.currentLevel : 0} → Lv \${upg.targetLevel || '?'}</span>
          <span class="timeline-upgrade-timer-pill" style="margin-left: auto;">\${formattedTime}</span>
        \`;`;

  const newTimelineUpgradesCode = `        const nowColLeftPercent = colPercent; // 5.8824% (start of Day 21)
        const finishPercent = timeToPercent(finishDate.getTime());
        // Ensure capsule begins 3px to the right of the vertical Now line so it never overlaps or intersects the line
        const widthPercent = Math.max(14, finishPercent - nowColLeftPercent);

        let displayName = cleanBuildingName(upg.name || 'Building');

        let imgSrc = '';
        if (upg.image && upg.image.url) {
          imgSrc = getProxyUrl(upg.image.url);
        } else {
          const cleanSearch = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
          const bMatch = allBuildings.find(b => b.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanSearch));
          const lvlImg = bMatch?.levels?.find(l => l.level === upg.targetLevel)?.image?.url ||
                         bMatch?.levels?.find(l => l.level === upg.currentLevel)?.image?.url;
          imgSrc = lvlImg ? getProxyUrl(lvlImg) : FALLBACK_ICON;
        }

        const formattedTime = formatSecondsToCoCTime(seconds);

        const capsule = document.createElement('div');
        capsule.className = 'timeline-upgrade-capsule';
        capsule.style.cssText = \`left: calc(\${nowColLeftPercent.toFixed(4)}% + 3px); width: calc(\${widthPercent.toFixed(4)}% - 6px); top: \${trackTop}px;\`;
        capsule.onclick = () => openBuildingModal(displayName);
        capsule.title = \`\${displayName} upgrading to Lv \${upg.targetLevel} (Finishes \${finishDayStr} at \${finishTimeStr} • \${formattedTime} remaining)\`;

        capsule.innerHTML = \`
          <img src="\${imgSrc}" alt="\${displayName}" onerror="handleImgError(this)">
          <span class="timeline-upgrade-title">\${displayName} Lv \${upg.currentLevel !== undefined ? upg.currentLevel : 0} → Lv \${upg.targetLevel || '?'}</span>
          <span class="timeline-upgrade-timer-pill" style="margin-left: auto; flex-shrink: 0; background: #27272a; border: 1px solid #3f3f46; padding: 2px 7px; border-radius: 99px; font-size: 10px;">\${formattedTime}</span>
        \`;`;

  if (html.includes(oldTimelineUpgradesCode)) {
    html = html.replace(oldTimelineUpgradesCode, newTimelineUpgradesCode);
  }

  // 7. Update getVillageBuildingLevels and renderMaxingRoadmap matching
  const oldGetVillageLevels = `    // Expand village building levels taking into account quantities (from cnt)
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
    }`;

  const newGetVillageLevels = `    // Expand village building levels taking into account quantities (from cnt)
    function getVillageBuildingLevels(bldgName, villageBuildings) {
      const levels = [];
      const cleanTarget = (bldgName || '').toLowerCase().replace(/\\/home village/i, '').replace(/[^a-z0-9]/g, '');
      villageBuildings.forEach(vb => {
        const vbClean = (vb.name || '').toLowerCase().replace(/\\/home village/i, '').replace(/[^a-z0-9]/g, '');
        const vbIdClean = (vb.buildingId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (vbClean === cleanTarget || vbIdClean === cleanTarget) {
          const q = vb.quantity || 1;
          const lvl = vb.level !== undefined ? vb.level : 0;
          for (let i = 0; i < q; i++) {
            levels.push(lvl);
          }
        }
      });
      return levels;
    }`;

  if (html.includes(oldGetVillageLevels)) {
    html = html.replace(oldGetVillageLevels, newGetVillageLevels);
  }

  // 8. Update renderMaxingRoadmap building collection
  const oldRoadmapCollection = `      // 1. Collect Buildings
      p.buildings.forEach(pb => {
        if (pb.name.toLowerCase() === 'wall') return; // instant upgrade
        const bData = allBuildings.find(b => b.name.toLowerCase() === pb.name.toLowerCase());
        const ownedLevels = getVillageBuildingLevels(pb.name, villageBuildings);
        const curLvl = ownedLevels[0] !== undefined ? ownedLevels[0] : 0;
        const maxLvl = Math.max(pb.maxAvailableLevel, curLvl);
        const levelsRemaining = Math.max(0, maxLvl - curLvl);`;

  const newRoadmapCollection = `      // 1. Collect Buildings
      p.buildings.forEach(pb => {
        if (pb.name.toLowerCase() === 'wall') return; // instant upgrade
        const cleanPbName = pb.name.toLowerCase().replace(/\\/home village/i, '').trim();
        const bData = allBuildings.find(b => b.name.toLowerCase().replace(/\\/home village/i, '').trim() === cleanPbName);
        let ownedLevels = getVillageBuildingLevels(cleanPbName, villageBuildings);
        if (ownedLevels.length === 0 && cleanPbName === 'cannon') {
          const rico = villageBuildings.filter(b => b.name && b.name.toLowerCase().includes('ricochet cannon'));
          if (rico.length > 0) ownedLevels = rico.map(r => r.level || 0);
        }
        if (ownedLevels.length === 0 && cleanPbName === 'archer tower') {
          const mat = villageBuildings.filter(b => b.name && b.name.toLowerCase().includes('multi-archer tower'));
          if (mat.length > 0) ownedLevels = mat.map(m => m.level || 0);
        }
        const curLvl = ownedLevels[0] !== undefined ? ownedLevels[0] : 0;
        const maxLvl = Math.max(pb.maxAvailableLevel, curLvl);
        const levelsRemaining = Math.max(0, maxLvl - curLvl);`;

  if (html.includes(oldRoadmapCollection)) {
    html = html.replace(oldRoadmapCollection, newRoadmapCollection);
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Successfully updated ${filePath}`);
}

updateHtmlFile(path.resolve(__dirname, '../../public/index.html'));
updateHtmlFile(path.resolve(__dirname, '../../android/app/src/main/assets/www/index.html'));
