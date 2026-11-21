const fs = require('fs');
const path = require('path');

function refineIndexHtml(filePath) {
  console.log(`Refining ${filePath}...`);
  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Replace FALLBACK_ICON with clean local CoC Cannon image rather than a shield SVG
  html = html.replace(
    /const FALLBACK_ICON = 'data:image\/svg\+xml;base64,[^']+';/,
    `const FALLBACK_ICON = '/downloads/images/Cannon/level-14.png';`
  );

  // 2. Update handleImgError
  const oldImgHandler = `    function handleImgError(img) {
      if (!img) return;
      img.onerror = null;
      img.src = FALLBACK_ICON;
    }`;

  const newImgHandler = `    function handleImgError(img) {
      if (!img) return;
      img.onerror = null;
      img.src = '/downloads/images/Cannon/level-14.png';
    }`;

  if (html.includes(oldImgHandler)) {
    html = html.replace(oldImgHandler, newImgHandler);
  }

  // 3. Update timeline upgrades rendering to make bars stretch proportionally to when each ends
  const oldUpgradeRendering = `      upgrades.forEach((upg, idx) => {
        const trackTop = 136 + (idx * 34);
        const seconds = upg.timerSeconds || 86400;
        const finishDate = new Date(now.getTime() + (seconds * 1000));
        const finishDayStr = finishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const finishTimeStr = finishDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        const nowColLeftPercent = colPercent; // 5.8824% (start of Day 21)
        const finishPercent = timeToPercent(finishDate.getTime());
        // Ensure capsule begins 3px to the right of the vertical Now line so it never overlaps or intersects the line
        const widthPercent = Math.max(16, finishPercent - nowColLeftPercent);

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
        \`;

        upgradesContainer.appendChild(capsule);
      });`;

  const newUpgradeRendering = `      upgrades.forEach((upg, idx) => {
        const trackTop = 136 + (idx * 34);
        const seconds = upg.timerSeconds || 86400;
        const finishDate = new Date(now.getTime() + (seconds * 1000));
        const finishDayStr = finishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const finishTimeStr = finishDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        const nowColLeftPercent = colPercent; // 5.8824% (start of Day 21 / Today)
        const daysRemaining = Math.max(0.05, seconds / 86400);
        // Stretches proportionally across calendar day columns to the exact finish date!
        const spanPercent = daysRemaining * colPercent;
        const maxAllowedPercent = Math.max(8, 100 - nowColLeftPercent - 1);
        const finalWidthPercent = Math.min(maxAllowedPercent, spanPercent);

        let displayName = cleanBuildingName(upg.name || 'Building');

        // Robust building image resolution (Never fallback to generic shield!)
        let imgSrc = '';
        if (upg.image && upg.image.url) {
          imgSrc = getProxyUrl(upg.image.url);
        } else {
          const cleanSearch = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
          const bMatch = allBuildings.find(b => b.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanSearch));
          const lvlImg = bMatch?.levels?.find(l => l.level === upg.targetLevel)?.image?.url ||
                         bMatch?.levels?.find(l => l.level === upg.currentLevel)?.image?.url ||
                         bMatch?.levels?.[bMatch.levels.length - 1]?.image?.url ||
                         bMatch?.levels?.[0]?.image?.url ||
                         bMatch?.image?.url;
          imgSrc = lvlImg ? getProxyUrl(lvlImg) : '/downloads/images/Cannon/level-14.png';
        }

        const formattedTime = formatSecondsToCoCTime(seconds);

        const capsule = document.createElement('div');
        capsule.className = 'timeline-upgrade-capsule';
        capsule.style.cssText = \`left: calc(\${nowColLeftPercent.toFixed(4)}% + 4px); width: calc(\${finalWidthPercent.toFixed(4)}% - 6px); min-width: 44px; top: \${trackTop}px; overflow: hidden;\`;
        capsule.onclick = () => openBuildingModal(displayName);
        capsule.title = \`\${displayName} Lv \${upg.currentLevel !== undefined ? upg.currentLevel : 0} → Lv \${upg.targetLevel || '?'} (Finishes \${finishDayStr} at \${finishTimeStr} • \${formattedTime} remaining)\`;

        capsule.innerHTML = \`
          <img src="\${imgSrc}" alt="\${displayName}" onerror="handleImgError(this)" style="flex-shrink:0;">
          <span class="timeline-upgrade-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;">\${displayName} Lv \${upg.currentLevel !== undefined ? upg.currentLevel : 0} → Lv \${upg.targetLevel || '?'}</span>
          <span class="timeline-upgrade-timer-pill" style="margin-left: auto; flex-shrink: 0; background: #27272a; border: 1px solid #3f3f46; padding: 2px 7px; border-radius: 99px; font-size: 10px;">\${formattedTime}</span>
        \`;

        upgradesContainer.appendChild(capsule);
      });`;

  if (html.includes(oldUpgradeRendering)) {
    html = html.replace(oldUpgradeRendering, newUpgradeRendering);
  } else {
    console.warn('oldUpgradeRendering pattern not matched directly; verifying contents...');
  }

  // 4. Update renderUpgradeItemHtml
  const oldItemHtml = `      let imgSrc = '';
      if (upg.image && upg.image.url) {
        imgSrc = getProxyUrl(upg.image.url);
      } else {
        const bMatch = allBuildings.find(b => b.name.toLowerCase().includes(displayName.toLowerCase()));
        const lvlImg = bMatch?.levels?.find(l => l.level === upg.targetLevel)?.image?.url ||
                       bMatch?.levels?.find(l => l.level === upg.currentLevel)?.image?.url;
        imgSrc = lvlImg ? getProxyUrl(lvlImg) : '/downloads/images/Cannon/level-14.png';
      }`;

  const newItemHtml = `      let imgSrc = '';
      if (upg.image && upg.image.url) {
        imgSrc = getProxyUrl(upg.image.url);
      } else {
        const cleanSearch = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const bMatch = allBuildings.find(b => b.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanSearch));
        const lvlImg = bMatch?.levels?.find(l => l.level === upg.targetLevel)?.image?.url ||
                       bMatch?.levels?.find(l => l.level === upg.currentLevel)?.image?.url ||
                       bMatch?.levels?.[bMatch.levels.length - 1]?.image?.url ||
                       bMatch?.levels?.[0]?.image?.url ||
                       bMatch?.image?.url;
        imgSrc = lvlImg ? getProxyUrl(lvlImg) : '/downloads/images/Cannon/level-14.png';
      }`;

  if (html.includes(oldItemHtml)) {
    html = html.replace(oldItemHtml, newItemHtml);
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Successfully refined ${filePath}`);
}

refineIndexHtml(path.resolve(__dirname, '../../public/index.html'));
refineIndexHtml(path.resolve(__dirname, '../../android/app/src/main/assets/www/index.html'));
