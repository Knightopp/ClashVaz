const fs = require('fs');
const path = require('path');

function applyBuildingQuantities(filePath) {
  console.log(`Applying building quantities to ${filePath}...`);
  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Add getVillageBuildingInstances if not present
  if (!html.includes('function getVillageBuildingInstances(')) {
    const target = 'function getVillageBuildingLevels(';
    const instancesFunc = `function getVillageBuildingInstances(bldgName) {
      const instances = [];
      const cleanTarget = (bldgName || '').toLowerCase().replace(/\\/home village/i, '').replace(/[^a-z0-9]/g, '');
      const villageBuildings = (currentVillageProfile && currentVillageProfile.buildings) ? currentVillageProfile.buildings : [];
      villageBuildings.forEach(vb => {
        const vbClean = (vb.name || '').toLowerCase().replace(/\\/home village/i, '').replace(/[^a-z0-9]/g, '');
        const vbIdClean = (vb.buildingId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (vbClean === cleanTarget || vbIdClean === cleanTarget) {
          const q = vb.quantity || vb.cnt || 1;
          const lvl = vb.level !== undefined ? vb.level : (vb.lvl !== undefined ? vb.lvl : 0);
          for (let i = 0; i < q; i++) {
            instances.push({ level: lvl, timer: vb.timer || 0 });
          }
        }
      });
      return instances;
    }\n\n    `;
    html = html.replace(target, instancesFunc + target);
  }

  // 2. Update renderMaxingRoadmap building collection
  const oldRoadmapBldgsStart = html.indexOf('// 1. Collect Buildings\n      p.buildings.forEach(pb => {');
  const oldRoadmapBldgsEnd = html.indexOf('// 2. Collect 6 Heroes from Official Supercell Game Data');

  if (oldRoadmapBldgsStart !== -1 && oldRoadmapBldgsEnd !== -1) {
    const newRoadmapBldgs = `// 1. Collect Buildings with Exact Quantities and Instance Levels
      p.buildings.forEach(pb => {
        if (pb.name.toLowerCase() === 'wall') return; // Instant upgrade: walls do not use builders
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
              qty: 0,
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
        const targetMaxLvl = ckBldg?.maxPerTH[targetTH] || pb.maxAvailableLevel;

        const instances = getVillageBuildingInstances(cleanPbName);
        const totalOwned = instances.length;
        const effectiveQty = Math.max(qty, totalOwned);

        // Group owned levels for clean summary
        const lvlCounts = {};
        instances.forEach(ins => {
          lvlCounts[ins.level] = (lvlCounts[ins.level] || 0) + 1;
        });

        // If user owns fewer than allowed quantity, remaining are level 0
        if (instances.length < effectiveQty) {
          const unbuilt = effectiveQty - instances.length;
          lvlCounts[0] = (lvlCounts[0] || 0) + unbuilt;
        }

        // Format level breakdown string
        const sortedLvls = Object.keys(lvlCounts).map(Number).sort((a, b) => b - a);
        let curLvlStr = '';
        if (sortedLvls.length === 1) {
          curLvlStr = \`Level \${sortedLvls[0]} (\${effectiveQty}x)\`;
        } else {
          curLvlStr = sortedLvls.map(l => \`\${lvlCounts[l]}x Lv \${l}\`).join(', ');
        }

        // Compute levels remaining and upgrade time across ALL instances
        let totalLevelsRemaining = 0;
        let totalEffectiveSec = 0;
        let currentLevelsSum = 0;
        const maxLevelsSum = effectiveQty * targetMaxLvl;

        // Track active upgrades for this building type
        const matchingActive = activeUpgrades.filter(u => 
          (u.name || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanPbName.replace(/[^a-z0-9]/g, ''))
        );
        const activeCount = matchingActive.length;
        const shortestTimer = activeCount > 0 ? Math.min(...matchingActive.map(u => u.timerSeconds || 86400)) : 0;

        for (let i = 0; i < effectiveQty; i++) {
          const insLvl = instances[i] ? instances[i].level : 0;
          currentLevelsSum += insLvl;
          if (insLvl < targetMaxLvl) {
            totalLevelsRemaining += (targetMaxLvl - insLvl);
            for (let l = insLvl + 1; l <= targetMaxLvl; l++) {
              const ckLevel = ckBldg?.levels?.find(lvl => lvl.level === l);
              if (ckLevel && typeof ckLevel.build_time === 'number' && ckLevel.build_time > 0) {
                totalEffectiveSec += ckLevel.build_time;
              } else {
                const lvlData = bData?.levels?.find(lvl => lvl.level === l);
                totalEffectiveSec += (lvlData?.upgradeTimeSeconds > 0) ? lvlData.upgradeTimeSeconds : (10 * 86400);
              }
            }
          }
        }
        totalEffectiveSec = totalEffectiveSec * boostFactor;

        let imgSrc = '';
        if (bData && bData.levels) {
          const lObj = bData.levels.find(lvl => lvl.level === targetMaxLvl) || bData.levels.find(lvl => lvl.level === (sortedLvls[0] || 1)) || bData.levels[bData.levels.length - 1];
          if (lObj?.image?.url) imgSrc = getProxyUrl(lObj.image.url);
        }
        if (!imgSrc) imgSrc = '/downloads/images/Cannon/level-14.png';

        const isUpgrading = activeCount > 0;
        const progressPct = maxLevelsSum > 0 ? Math.min(100, Math.round((currentLevelsSum / maxLevelsSum) * 100)) : 100;

        items.push({
          name: pb.name,
          category: pb.category || 'Defense',
          qty: effectiveQty,
          curLvl: curLvlStr,
          maxLvl: \`Level \${targetMaxLvl} (\${effectiveQty}x)\`,
          levelsRemaining: totalLevelsRemaining,
          effectiveSec: totalEffectiveSec,
          progressPct,
          imgSrc,
          isUpgrading,
          activeCount,
          activeTimerSec: shortestTimer,
          targetUpgLevel: targetMaxLvl
        });
      });\n\n      `;
    html = html.substring(0, oldRoadmapBldgsStart) + newRoadmapBldgs + html.substring(oldRoadmapBldgsEnd);
  }

  // 3. Update table row rendering to show quantity pill and multi-active count
  const oldRowStart = html.indexOf('let statusBadge = \'<span class="roadmap-status-pill" style="background:#27272a; color:#a1a1aa;">Ready</span>\';');
  const oldRowEnd = html.indexOf('tbody.appendChild(tr);', oldRowStart);

  if (oldRowStart !== -1 && oldRowEnd !== -1) {
    const newRowCode = `let statusBadge = '<span class="roadmap-status-pill" style="background:#27272a; color:#a1a1aa;">Ready</span>';
        if (it.isMergedNote) {
          statusBadge = '<span class="roadmap-status-pill" style="background:#18181b; color:#a1a1aa; border:1px solid #27272a;">Merged</span>';
        } else if (it.isUpgrading) {
          const tRem = it.activeTimerSec > 0 ? formatSecondsToCoCTime(it.activeTimerSec) : 'In Progress';
          const activeLabel = (it.activeCount && it.activeCount > 1) ? \`\${it.activeCount} Active (\${tRem})\` : \`Active (\${tRem})\`;
          statusBadge = \`<span class="roadmap-status-pill active-upg" style="background:#27272a; border:1px solid #ffffff; color:#ffffff;">\${activeLabel}</span>\`;
        } else if (isMaxed) {
          statusBadge = '<span class="roadmap-status-pill" style="background:#18181b; color:#71717a;">Maxed Tier</span>';
        }

        const timeStr = isMaxed ? '0d' : formatTimeDuration(it.effectiveSec);
        const curLvlLabel = it.isMergedNote ? it.curLvl : (it.curLvl.startsWith('Level ') || it.curLvl.includes('x Lv') ? it.curLvl : \`Level \${it.curLvl}\`);
        const maxLvlLabel = it.isMergedNote ? 'Merged' : (it.maxLvl.startsWith('Level ') ? it.maxLvl : \`Level \${it.maxLvl}\`);

        const qtyBadge = (it.qty && it.qty > 0) ? \`<span class="bldg-qty-pill" style="background: #27272a; border: 1px solid #3f3f46; color: #ffffff; font-size: 10px; padding: 1px 6px; border-radius: 9999px; font-weight: 800; margin-left: 4px;">\${it.qty}x</span>\` : '';

        tr.innerHTML = \`
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="\${it.imgSrc}" alt="\${it.name}" style="width: 24px; height: 24px; object-fit: contain;" onerror="handleImgError(this)">
              <span style="font-weight: 700; color: #ffffff;">\${it.name}</span>
              \${qtyBadge}
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
        `;
    html = html.substring(0, oldRowStart) + newRowCode + html.substring(oldRowEnd);
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Successfully applied building quantities to ${filePath}`);
}

applyBuildingQuantities(path.resolve(__dirname, '../../public/index.html'));
applyBuildingQuantities(path.resolve(__dirname, '../../android/app/src/main/assets/www/index.html'));
