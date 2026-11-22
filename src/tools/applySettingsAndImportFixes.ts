import fs from 'fs';
import path from 'path';

const indexPath = path.resolve('public', 'index.html');
let content = fs.readFileSync(indexPath, 'utf-8');

// 1. Update .mobile-top-bar CSS to handle safe-area insets
const oldMobileTopBarCss = `    .mobile-top-bar {
      display: none;
      align-items: center;
      justify-content: space-between;
      height: 54px;
      padding: 0 14px;
      background: #111113;
      border-bottom: 1px solid #27272a;
      flex-shrink: 0;
      z-index: 100;
      width: 100%;
    }`;

const newMobileTopBarCss = `    .mobile-top-bar {
      display: none;
      align-items: center;
      justify-content: space-between;
      height: calc(56px + env(safe-area-inset-top, 0px));
      padding-top: env(safe-area-inset-top, 0px);
      padding-left: 14px;
      padding-right: 14px;
      background: #111113;
      border-bottom: 1px solid #27272a;
      flex-shrink: 0;
      z-index: 100;
      width: 100%;
      box-sizing: border-box;
    }`;

content = content.replace(oldMobileTopBarCss, newMobileTopBarCss);

// 2. Add Settings button in mobile top bar header
const oldMobileHeaderActions = `      <div class="mobile-header-actions">
        <div class="mobile-profile-chip" onclick="switchNav('upgrades')">
          <img src="/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/7/76/Town_Hall18.png/revision/latest?cb=20251117162127" class="mobile-chip-avatar" alt="TH">
          <div class="mobile-chip-info">
            <span class="mobile-chip-th" id="mobile-chip-th">TH18</span>
            <span class="mobile-chip-prog" id="mobile-chip-prog">91%</span>
          </div>
        </div>
        <button class="mobile-import-btn" onclick="openImportModal()" title="Import Village">
          <svg viewBox="0 0 24 24" style="width:16px; height:16px; fill:#000000;"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
        </button>
      </div>`;

const newMobileHeaderActions = `      <div class="mobile-header-actions">
        <div class="mobile-profile-chip" onclick="switchNav('upgrades')">
          <img src="/downloads/images/Town_Hall/Town_Hall18.png" class="mobile-chip-avatar" alt="TH">
          <div class="mobile-chip-info">
            <span class="mobile-chip-th" id="mobile-chip-th">TH18</span>
            <span class="mobile-chip-prog" id="mobile-chip-prog">91%</span>
          </div>
        </div>
        <button class="mobile-import-btn" onclick="openImportModal()" title="Import Village">
          <svg viewBox="0 0 24 24" style="width:16px; height:16px; fill:#000000;"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
        </button>
        <button class="mobile-import-btn" onclick="openSettingsModal()" title="Settings & Widget" style="background:#27272a; border: 1px solid #3f3f46; margin-left:6px;">
          <svg viewBox="0 0 24 24" style="width:16px; height:16px; fill:#eab308;"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
        </button>
      </div>`;

content = content.replace(oldMobileHeaderActions, newMobileHeaderActions);

// 3. Update Sidebar Settings onclick
const oldSidebarSettings = `<div class="nav-item" onclick="alert('VazoClash v2.0 • Clean Clash Companion Edition.')">
          <img class="nav-coc-icon" src="/downloads/images/ui/clock_potion.png" alt="Settings">
          <span>Settings</span>
        </div>`;

const newSidebarSettings = `<div class="nav-item" onclick="openSettingsModal()" title="Settings & Widget Preferences">
          <img class="nav-coc-icon" src="/downloads/images/ui/clock_potion.png" alt="Settings">
          <span>Settings</span>
        </div>`;

content = content.replace(oldSidebarSettings, newSidebarSettings);

// 4. Add Topbar Settings Button on desktop
const oldTopbarImport = `<button class="topbar-import-btn" id="open-import-modal-btn" onclick="openImportModal()">
          <img src="/downloads/images/ui/challenge_upgrade.png" style="width: 14px; height: 14px;" alt="Import">
          <span>Import Village</span>
        </button>`;

const newTopbarImport = `<button class="topbar-import-btn" id="open-import-modal-btn" onclick="openImportModal()">
          <img src="/downloads/images/ui/challenge_upgrade.png" style="width: 14px; height: 14px;" alt="Import">
          <span>Import Village</span>
        </button>
        <button class="topbar-import-btn" onclick="openSettingsModal()" style="background:#27272a; border-color:#3f3f46; color:#f4f4f5; margin-left:8px;">
          <svg viewBox="0 0 24 24" style="width:14px; height:14px; fill:#eab308; vertical-align:middle; margin-right:4px;"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
          <span>Settings</span>
        </button>`;

content = content.replace(oldTopbarImport, newTopbarImport);

// 5. Insert Settings Modal HTML before the closing </main>
const settingsModalHtml = `
  <!-- ========================================================
       MODAL DIALOG: SETTINGS & HOME SCREEN WIDGET
  ========================================================= -->
  <div class="import-modal-overlay" id="settings-modal">
    <div class="import-modal-card">
      <div class="import-modal-header">
        <div class="import-modal-title">
          <svg viewBox="0 0 24 24" style="width:20px; height:20px; fill:#eab308;"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
          <span>Settings & Preferences</span>
        </div>
        <button class="import-modal-close" onclick="closeSettingsModal()">&times;</button>
      </div>
      <div class="import-modal-body" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Home Screen Widget Section -->
        <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 14px;">
          <div style="font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 4px; display:flex; align-items:center; gap:8px;">
            <svg viewBox="0 0 24 24" style="width:16px; height:16px; fill:#3b82f6;"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>
            <span>Home Screen Widget</span>
          </div>
          <p style="font-size: 11px; color: #a1a1aa; line-height: 1.5; margin: 0 0 12px 0;">
            Add the live VazoClash Upgrades Tracker widget to your Android home screen to track builder countdowns, hero upgrades, and lab timers in real-time.
          </p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="flat-action-btn" style="margin: 0; padding: 8px 16px; font-size: 12px;" onclick="addHomeScreenWidget()">
              <span>Add Widget to Home Screen</span>
            </button>
            <button class="flat-action-btn" style="margin: 0; padding: 8px 14px; font-size: 12px; background: #27272a;" onclick="syncWidgetDataManual()">
              <span>Sync Live Upgrades</span>
            </button>
          </div>
          <div style="font-size: 10px; color: #71717a; margin-top: 8px;">
            Alternative: Long-press any empty space on your phone's home screen, tap <strong>Widgets</strong>, and select <strong>VazoClash Tracker</strong>.
          </div>
        </div>

        <!-- Village Data Section -->
        <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 14px;">
          <div style="font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 4px;">
            <span>Village Data Management</span>
          </div>
          <p style="font-size: 11px; color: #a1a1aa; line-height: 1.5; margin: 0 0 12px 0;">
            Import or reset your active Clash of Clans village layout, upgrade timers, and building roster.
          </p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="flat-action-btn" style="margin: 0; padding: 8px 14px; font-size: 12px;" onclick="closeSettingsModal(); openImportModal();">
              <span>Import Village JSON</span>
            </button>
            <button class="flat-action-btn" style="margin: 0; padding: 8px 14px; font-size: 12px; background: #27272a;" onclick="resetToDefaultVillage()">
              <span>Reset to Default TH18 Village</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

content = content.replace('<div class="import-modal-overlay" id="import-village-modal">', settingsModalHtml + '\n  <div class="import-modal-overlay" id="import-village-modal">');

// 6. Update onImportInputChanged and commitVillageImport to be fully offline resilient
const oldImportHandlers = `    let importDebounceTimer = null;
    function onImportInputChanged() {
      clearTimeout(importDebounceTimer);
      importDebounceTimer = setTimeout(async () => {
        const ta = document.getElementById('import-json-textarea');
        const text = ta ? ta.value.trim() : '';

        if (!text) {
          resetImportPreview();
          return;
        }

        try {
          const parsed = JSON.parse(text);
          const res = await fetch('/api/village/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed)
          });
          const result = await res.json();

          if (result.success && result.preview) {
            setImportStatus('valid', 'Valid JSON (Ready to Apply)');
            document.getElementById('prev-tag').textContent = result.preview.tag || '#UNKNOWN';
            document.getElementById('prev-th').textContent = \`TH \${result.preview.townHallLevel}\`;
            document.getElementById('prev-buildings').textContent = result.preview.totalBuildings;
            document.getElementById('prev-traps').textContent = result.preview.totalTraps;
            document.getElementById('import-error-msg').style.display = 'none';
          } else {
            setImportStatus('invalid', 'Invalid Structure');
            document.getElementById('import-error-msg').textContent = result.error || 'Export does not match expected Clash of Clans schema.';
            document.getElementById('import-error-msg').style.display = 'block';
          }
        } catch (err) {
          setImportStatus('invalid', 'Malformed JSON');
          document.getElementById('import-error-msg').textContent = \`JSON Parse Error: \${err.message}\`;
          document.getElementById('import-error-msg').style.display = 'block';
        }
      }, 250);
    }`;

const newImportHandlers = `    function openSettingsModal() {
      const m = document.getElementById('settings-modal');
      if (m) m.classList.add('active');
    }

    function closeSettingsModal() {
      const m = document.getElementById('settings-modal');
      if (m) m.classList.remove('active');
    }

    function addHomeScreenWidget() {
      if (window.Android && window.Android.requestPinWidget) {
        window.Android.requestPinWidget();
      } else {
        alert('Home screen widget pinning is available in the Android mobile app. You can also long-press any empty space on your phone home screen, choose Widgets, and select VazoClash Upgrades.');
      }
    }

    function syncWidgetDataManual() {
      if (window.Android && window.Android.syncUpgradesToWidget) {
        const data = currentVillageProfile ? JSON.stringify(currentVillageProfile) : '';
        window.Android.syncUpgradesToWidget(data);
        if (window.Android.showToast) {
          window.Android.showToast('Upgrades synced to Home Screen Widget!');
        } else {
          alert('Upgrades synced to Home Screen Widget!');
        }
      } else {
        alert('Widget syncing is active in the Android mobile app.');
      }
    }

    function resetToDefaultVillage() {
      if (!confirm('Reset active village to default TH18 profile?')) return;
      localStorage.removeItem('vazoclash_village_profile');
      location.reload();
    }

    function parseVillageExportClientSide(raw) {
      if (!raw) return null;
      let obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (obj.currentProfile) obj = obj.currentProfile;

      if (obj.buildings && Array.isArray(obj.buildings) && (obj.townHallLevel || obj.tag)) {
        return {
          tag: obj.tag || '#VILLAGE',
          playerName: obj.playerName || 'Chief ClashMaster',
          townHallLevel: Number(obj.townHallLevel) || 18,
          importedAt: new Date().toISOString(),
          timestamp: Math.floor(Date.now() / 1000),
          totalBuildings: obj.totalBuildings || obj.buildings.length,
          totalTraps: obj.totalTraps || 0,
          totalHeroes: obj.totalHeroes || 6,
          totalWalls: obj.totalWalls || 325,
          buildings: obj.buildings,
          activeUpgrades: obj.activeUpgrades || [],
          raw: obj
        };
      }

      const bldgsList = obj.buildings || obj.structures || obj.layout || [];
      let thLevel = Number(obj.townHallLevel || obj.townHall || obj.th || 18);
      let activeUpgrades = [];
      let totalBuildings = 0;
      let totalTraps = 0;
      let totalWalls = 0;

      const mappedBuildings = [];
      if (Array.isArray(bldgsList)) {
        bldgsList.forEach((b, idx) => {
          const rawId = b.data || b.id || b.buildingId || 0;
          const lvl = b.lvl !== undefined ? b.lvl : (b.level !== undefined ? b.level : 1);
          const name = b.name || (rawId === 1000001 ? 'Town Hall' : (b.buildingId || \`Building \${idx+1}\`));

          if (rawId === 1000001 || (name && name.toLowerCase().includes('town hall'))) {
            thLevel = Math.max(thLevel, Number(lvl));
          }

          if (name && name.toLowerCase().includes('wall')) {
            totalWalls++;
          } else if (name && (name.toLowerCase().includes('bomb') || name.toLowerCase().includes('trap') || name.toLowerCase().includes('mine'))) {
            totalTraps++;
          } else {
            totalBuildings++;
          }

          if (b.timer || b.upgradeEndTimestamp || b.remainingTime) {
            const timerSec = b.timer || b.remainingTime || 86400;
            const endTs = b.upgradeEndTimestamp || (Date.now() + timerSec * 1000);
            activeUpgrades.push({
              instanceId: b.instanceId || \`upg_\${idx}\`,
              buildingId: b.buildingId || String(rawId),
              name: name,
              category: b.category || 'Defense',
              currentLevel: Number(lvl),
              targetLevel: Number(lvl) + 1,
              durationSeconds: timerSec,
              upgradeEndTimestamp: endTs,
              image: b.image || { url: \`/downloads/images/Town_Hall/Town_Hall\${thLevel}.png\` }
            });
          }

          mappedBuildings.push({
            instanceId: b.instanceId || \`bldg_\${idx}\`,
            buildingId: b.buildingId || String(rawId),
            name: name,
            category: b.category || 'Defense',
            level: Number(lvl),
            quantity: 1,
            footprint: b.footprint || { width: 3, height: 3 },
            image: b.image || null,
            raw: b
          });
        });
      }

      return {
        tag: obj.tag || '#IMPORTED',
        playerName: obj.playerName || obj.name || 'Chief ClashMaster',
        townHallLevel: thLevel,
        importedAt: new Date().toISOString(),
        timestamp: Math.floor(Date.now() / 1000),
        totalBuildings: totalBuildings || mappedBuildings.length,
        totalTraps: totalTraps,
        totalHeroes: 6,
        totalWalls: totalWalls || 325,
        buildings: mappedBuildings,
        activeUpgrades: activeUpgrades.length > 0 ? activeUpgrades : (obj.activeUpgrades || []),
        raw: obj
      };
    }

    function getClientSidePreview(raw) {
      try {
        const parsed = parseVillageExportClientSide(raw);
        if (!parsed) return null;
        return {
          tag: parsed.tag,
          townHallLevel: parsed.townHallLevel,
          totalBuildings: parsed.totalBuildings,
          totalTraps: parsed.totalTraps,
          totalHeroes: parsed.totalHeroes,
          activeUpgradesCount: (parsed.activeUpgrades || []).length
        };
      } catch (e) {
        return null;
      }
    }

    let importDebounceTimer = null;
    function onImportInputChanged() {
      clearTimeout(importDebounceTimer);
      importDebounceTimer = setTimeout(async () => {
        const ta = document.getElementById('import-json-textarea');
        const text = ta ? ta.value.trim() : '';

        if (!text) {
          resetImportPreview();
          return;
        }

        try {
          const parsed = JSON.parse(text);
          let preview = null;

          // 1. Try server validate if available
          try {
            const res = await fetch('/api/village/validate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(parsed)
            });
            if (res.ok) {
              const result = await res.json();
              if (result.success && result.preview) preview = result.preview;
            }
          } catch (e) {}

          // 2. Client-side offline fallback
          if (!preview) {
            preview = getClientSidePreview(parsed);
          }

          if (preview) {
            setImportStatus('valid', 'Valid JSON (Ready to Apply)');
            document.getElementById('prev-tag').textContent = preview.tag || '#VILLAGE';
            document.getElementById('prev-th').textContent = \`TH \${preview.townHallLevel || 18}\`;
            document.getElementById('prev-buildings').textContent = preview.totalBuildings || 0;
            document.getElementById('prev-traps').textContent = preview.totalTraps || 0;
            document.getElementById('import-error-msg').style.display = 'none';
          } else {
            setImportStatus('invalid', 'Invalid Structure');
            document.getElementById('import-error-msg').textContent = 'Export JSON structure could not be identified.';
            document.getElementById('import-error-msg').style.display = 'block';
          }
        } catch (err) {
          setImportStatus('invalid', 'Malformed JSON');
          document.getElementById('import-error-msg').textContent = \`JSON Parse Error: \${err.message}\`;
          document.getElementById('import-error-msg').style.display = 'block';
        }
      }, 250);
    }`;

content = content.replace(oldImportHandlers, newImportHandlers);

// 7. Update commitVillageImport to support offline parsing directly
const oldCommitVillageImport = `    async function commitVillageImport() {
      const ta = document.getElementById('import-json-textarea');
      const text = ta ? ta.value.trim() : '';
      if (!text) {
        alert('Please paste or upload a JSON export first.');
        return;
      }

      try {
        const parsed = JSON.parse(text);
        const res = await fetch('/api/village/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed)
        });
        const data = await res.json();

        if (data.success && data.profile) {
          currentVillageProfile = data.profile;
          if (data.snapshot) {
            villageSnapshots.unshift(data.snapshot);
          }
          currentTH = currentVillageProfile.townHallLevel;

          renderDashboard();
          renderTownHallPills();
          renderBuildingsExplorer();
          renderMyVillage();
          renderTimelineUpgrades(currentVillageProfile);
          updateProfileDisplay();

          if (document.getElementById('view-layout').classList.contains('active')) {
            renderInventoryDrawer();
          }

          closeImportModal();
          alert(\`Successfully imported village \${data.profile.tag} (TH\${data.profile.townHallLevel}, \${data.profile.totalBuildings} structures)!\`);
        } else {
          alert(\`Import failed: \${data.error || 'Unknown error'}\`);
        }
      } catch (err) {
        alert(\`Failed executing import: \${err.message}\`);
      }
    }`;

const newCommitVillageImport = `    async function commitVillageImport() {
      const ta = document.getElementById('import-json-textarea');
      const text = ta ? ta.value.trim() : '';
      if (!text) {
        alert('Please paste or upload a JSON export first.');
        return;
      }

      try {
        let parsed = JSON.parse(text);
        let profile = null;

        // Try server endpoint first
        try {
          const res = await fetch('/api/village/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed)
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.profile) {
              profile = data.profile;
              if (data.snapshot) villageSnapshots.unshift(data.snapshot);
            }
          }
        } catch (fetchErr) {
          console.warn('Backend server import unavailable, using client-side offline parser');
        }

        // Offline client-side fallback
        if (!profile) {
          profile = parseVillageExportClientSide(parsed);
        }

        if (profile) {
          currentVillageProfile = profile;
          localStorage.setItem('vazoclash_village_profile', JSON.stringify(profile));

          if (window.Android && window.Android.syncUpgradesToWidget) {
            window.Android.syncUpgradesToWidget(JSON.stringify(profile));
          }

          currentTH = currentVillageProfile.townHallLevel || 18;
          renderDashboard();
          renderTownHallPills();
          renderBuildingsExplorer();
          renderMyVillage();
          renderTimelineUpgrades(currentVillageProfile);
          updateProfileDisplay();

          if (document.getElementById('view-layout') && document.getElementById('view-layout').classList.contains('active')) {
            renderInventoryDrawer();
          }

          closeImportModal();
          alert(\`Successfully imported village \${profile.tag || 'Chief'} (TH\${currentTH}, \${profile.totalBuildings || 0} structures)!\`);
        } else {
          alert('Import failed: Could not construct valid village profile from provided JSON.');
        }
      } catch (err) {
        alert(\`Failed executing import: \${err.message}\`);
      }
    }`;

content = content.replace(oldCommitVillageImport, newCommitVillageImport);

// 8. Also load saved localStorage profile on boot if present
const oldInitLocalStore = `        currentVillageProfile = villageData.currentProfile || (villageData.villageName ? villageData : null);`;
const newInitLocalStore = `        const savedLocalProfile = localStorage.getItem('vazoclash_village_profile');
        if (savedLocalProfile) {
          try {
            currentVillageProfile = JSON.parse(savedLocalProfile);
          } catch(e) {}
        }
        if (!currentVillageProfile) {
          currentVillageProfile = villageData.currentProfile || (villageData.villageName ? villageData : null);
        }`;

content = content.replace(oldInitLocalStore, newInitLocalStore);

fs.writeFileSync(indexPath, content, 'utf-8');
console.log('Successfully updated public/index.html with Settings modal and offline village import!');

// Sync to android asset
const androidIndexPath = path.resolve('android', 'app', 'src', 'main', 'assets', 'www', 'index.html');
fs.writeFileSync(androidIndexPath, content, 'utf-8');
console.log('Synced to android/app/src/main/assets/www/index.html!');
