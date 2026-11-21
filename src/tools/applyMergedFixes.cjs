const fs = require('fs');
const path = require('path');

function applyMergedFixes(filePath) {
  console.log(`Applying merged building fixes to ${filePath}...`);
  let html = fs.readFileSync(filePath, 'utf8');

  // 1. In calculateTimeToReachTH: Skip qty <= 0 (merged buildings)
  const oldCalcLoop = `      p.buildings.forEach(pb => {
        if (pb.name.toLowerCase() === 'wall') return; // Instant upgrade: walls do not use builders!
        const bData = allBuildings.find(b => b.name.toLowerCase() === pb.name.toLowerCase());
        if (!bData || !bData.levels) return;

        const ownedLevels = getVillageBuildingLevels(pb.name, villageBuildings);
        const qty = pb.quantity || 1;

        for (let i = 0; i < qty; i++) {`;

  const newCalcLoop = `      p.buildings.forEach(pb => {
        if (pb.name.toLowerCase() === 'wall') return; // Instant upgrade: walls do not use builders!
        const cleanPbName = pb.name.toLowerCase().replace(/\\/home village/i, '').trim();
        const bData = allBuildings.find(b => b.name.toLowerCase().replace(/\\/home village/i, '').trim() === cleanPbName);
        if (!bData || !bData.levels) return;

        const qty = (pb.quantity !== undefined) ? pb.quantity : 1;
        if (qty <= 0) return; // Skip merged buildings (e.g. Eagle Artillery fused into Town Hall, Cannons merged into Ricochet Cannons)

        const ownedLevels = getVillageBuildingLevels(pb.name, villageBuildings);

        for (let i = 0; i < qty; i++) {`;

  if (html.includes(oldCalcLoop)) {
    html = html.replace(oldCalcLoop, newCalcLoop);
  }

  // 2. In renderMaxingRoadmap: Skip qty <= 0 from active upgrade list
  const oldRoadmapBldgs = `      // 1. Collect Buildings
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

  const newRoadmapBldgs = `      // 1. Collect Buildings
      p.buildings.forEach(pb => {
        if (pb.name.toLowerCase() === 'wall') return; // instant upgrade
        const cleanPbName = pb.name.toLowerCase().replace(/\\/home village/i, '').trim();
        const qty = (pb.quantity !== undefined) ? pb.quantity : 1;

        // Skip merged buildings (Eagle Artillery, Cannons, etc.) from active upgrade table!
        if (qty <= 0) {
          // If explicitly searched by name, show it as integrated/merged
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

        const bData = allBuildings.find(b => b.name.toLowerCase().replace(/\\/home village/i, '').trim() === cleanPbName);
        let ownedLevels = getVillageBuildingLevels(cleanPbName, villageBuildings);
        const curLvl = ownedLevels[0] !== undefined ? ownedLevels[0] : 0;
        const maxLvl = Math.max(pb.maxAvailableLevel, curLvl);
        const levelsRemaining = Math.max(0, maxLvl - curLvl);`;

  if (html.includes(oldRoadmapBldgs)) {
    html = html.replace(oldRoadmapBldgs, newRoadmapBldgs);
  }

  // 3. In table row rendering: handle isMergedNote
  const oldRowBadge = `        let statusBadge = '<span class="roadmap-status-pill" style="background:#27272a; color:#a1a1aa;">Ready</span>';
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
          <td><span style="font-weight: 700; color: #ffffff;">Level \${it.maxLvl}</span></td>`;

  const newRowBadge = `        let statusBadge = '<span class="roadmap-status-pill" style="background:#27272a; color:#a1a1aa;">Ready</span>';
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
          <td><span style="font-weight: 700; color: #ffffff;">\${maxLvlLabel}</span></td>`;

  if (html.includes(oldRowBadge)) {
    html = html.replace(oldRowBadge, newRowBadge);
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Successfully updated ${filePath}`);
}

applyMergedFixes(path.resolve(__dirname, '../../public/index.html'));
applyMergedFixes(path.resolve(__dirname, '../../android/app/src/main/assets/www/index.html'));
