const fs = require('fs');
const path = require('path');

const entityMap = JSON.parse(fs.readFileSync('./data/entity_id_map.json', 'utf8'));
const indexPath = './public/index.html';
let content = fs.readFileSync(indexPath, 'utf8');

// 1. In initApp(), replace currentVillageProfile loading with initAccountsSystem
const oldInitProfile = `        const savedLocalProfile = localStorage.getItem('vazoclash_village_profile');
        if (savedLocalProfile) {
          try {
            currentVillageProfile = JSON.parse(savedLocalProfile);
          } catch(e) {}
        }
        if (!currentVillageProfile) {
          currentVillageProfile = villageData.currentProfile || (villageData.villageName ? villageData : null);
        }`;

const newInitProfile = `        // Initialize Multi-Account Village Management
        initAccountsSystem(villageData);`;

if (content.includes(oldInitProfile)) {
  content = content.replace(oldInitProfile, newInitProfile);
  console.log('Patched initApp profile loading');
} else {
  console.log('oldInitProfile not found directly, checking variations...');
}

// 2. Insert COC_ENTITY_MAP and Multi-Account logic before parseVillageExportClientSide
const targetFunc = 'function parseVillageExportClientSide(raw) {';
if (!content.includes(targetFunc)) {
  console.error('Could not find parseVillageExportClientSide in index.html');
  process.exit(1);
}

// Find function parseVillageExportClientSide up to getClientSidePreview
const startIdx = content.indexOf(targetFunc);
const endMarker = 'function getClientSidePreview(raw) {';
const endIdx = content.indexOf(endMarker);
if (startIdx === -1 || endIdx === -1) {
  console.error('Could not locate boundaries for parseVillageExportClientSide');
  process.exit(1);
}

const replacement = `window.COC_ENTITY_MAP = ${JSON.stringify(entityMap)};

    // ========================================================
    // MULTI-ACCOUNT MANAGEMENT SYSTEM (Persistent Villages)
    // ========================================================
    const ACCOUNTS_STORAGE_KEY = 'vazoclash_accounts';
    const ACTIVE_ACCOUNT_KEY = 'vazoclash_active_account_id';

    function getSavedAccounts() {
      try {
        const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list) && list.length > 0) return list;
        }
      } catch (e) {
        console.warn('Failed reading saved accounts', e);
      }
      return [];
    }

    function saveAccounts(accountsList) {
      try {
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accountsList));
      } catch (e) {
        console.warn('Failed writing saved accounts', e);
      }
    }

    function getActiveAccountId() {
      return localStorage.getItem(ACTIVE_ACCOUNT_KEY) || null;
    }

    function getActiveAccount() {
      const accounts = getSavedAccounts();
      const activeId = getActiveAccountId();
      if (activeId) {
        const found = accounts.find(a => a.id === activeId);
        if (found) return found;
      }
      return accounts.length > 0 ? accounts[0] : null;
    }

    function initAccountsSystem(initialVillageData) {
      let accounts = getSavedAccounts();
      const savedLocalProfile = localStorage.getItem('vazoclash_village_profile');
      let baseProfile = null;

      if (savedLocalProfile) {
        try { baseProfile = JSON.parse(savedLocalProfile); } catch(e) {}
      }
      if (!baseProfile) {
        baseProfile = initialVillageData?.currentProfile || (initialVillageData?.villageName ? initialVillageData : null);
      }

      if (accounts.length === 0 && baseProfile) {
        const initName = baseProfile.playerName || ('Main TH' + (baseProfile.townHallLevel || 18));
        const mainAcc = {
          id: 'acc_main_' + Date.now(),
          name: initName,
          tag: baseProfile.tag || '#VILLAGE',
          townHallLevel: baseProfile.townHallLevel || 18,
          profile: baseProfile,
          createdAt: new Date().toISOString()
        };
        accounts = [mainAcc];
        saveAccounts(accounts);
        localStorage.setItem(ACTIVE_ACCOUNT_KEY, mainAcc.id);
      }

      const activeAcc = getActiveAccount();
      if (activeAcc && activeAcc.profile) {
        currentVillageProfile = activeAcc.profile;
        localStorage.setItem('vazoclash_village_profile', JSON.stringify(currentVillageProfile));
        localStorage.setItem(ACTIVE_ACCOUNT_KEY, activeAcc.id);
      } else if (baseProfile) {
        currentVillageProfile = baseProfile;
      }

      syncWithAndroidWidget(currentVillageProfile);
    }

    function saveOrUpdateAccount(customName, profile) {
      let accounts = getSavedAccounts();
      const activeId = getActiveAccountId();
      const foundIdx = accounts.findIndex(a => a.id === activeId);

      const name = customName && customName.trim() ? customName.trim() : (profile.playerName || ('Village TH' + (profile.townHallLevel || 18)));
      profile.playerName = name;

      if (foundIdx >= 0) {
        accounts[foundIdx].name = name;
        accounts[foundIdx].tag = profile.tag || accounts[foundIdx].tag;
        accounts[foundIdx].townHallLevel = profile.townHallLevel || accounts[foundIdx].townHallLevel;
        accounts[foundIdx].profile = profile;
        accounts[foundIdx].updatedAt = new Date().toISOString();
      } else {
        const newAcc = {
          id: 'acc_' + Date.now(),
          name: name,
          tag: profile.tag || '#VILLAGE',
          townHallLevel: profile.townHallLevel || 18,
          profile: profile,
          createdAt: new Date().toISOString()
        };
        accounts.push(newAcc);
        localStorage.setItem(ACTIVE_ACCOUNT_KEY, newAcc.id);
      }

      saveAccounts(accounts);
      currentVillageProfile = profile;
      localStorage.setItem('vazoclash_village_profile', JSON.stringify(profile));
      syncWithAndroidWidget(profile);
    }

    function switchAccount(accountId) {
      const accounts = getSavedAccounts();
      const target = accounts.find(a => a.id === accountId);
      if (!target || !target.profile) {
        alert('Could not find account to switch to.');
        return;
      }

      currentVillageProfile = target.profile;
      localStorage.setItem('vazoclash_village_profile', JSON.stringify(currentVillageProfile));
      localStorage.setItem(ACTIVE_ACCOUNT_KEY, target.id);

      currentTH = currentVillageProfile.townHallLevel || 18;
      syncWithAndroidWidget(currentVillageProfile);

      renderDashboard();
      renderTownHallPills();
      renderBuildingsExplorer();
      renderMyVillage();
      renderTimelineUpgrades(currentVillageProfile);
      updateProfileDisplay();

      closeAccountsModal();
      if (window.Android && window.Android.showToast) {
        window.Android.showToast('Switched to ' + target.name);
      }
    }

    function renameAccountPrompt(accountId) {
      const accounts = getSavedAccounts();
      const target = accounts.find(a => a.id === accountId);
      if (!target) return;

      const newName = prompt('Enter new custom name for village (' + target.tag + '):', target.name);
      if (!newName || !newName.trim()) return;

      target.name = newName.trim();
      if (target.profile) {
        target.profile.playerName = target.name;
      }
      saveAccounts(accounts);

      const activeId = getActiveAccountId();
      if (activeId === accountId) {
        currentVillageProfile.playerName = target.name;
        localStorage.setItem('vazoclash_village_profile', JSON.stringify(currentVillageProfile));
        syncWithAndroidWidget(currentVillageProfile);
        updateProfileDisplay();
      }

      renderAccountsList();
    }

    function deleteAccount(accountId) {
      let accounts = getSavedAccounts();
      if (accounts.length <= 1) {
        alert('You cannot delete the only remaining village account.');
        return;
      }

      const target = accounts.find(a => a.id === accountId);
      const name = target ? target.name : 'this account';
      if (!confirm('Are you sure you want to delete "' + name + '"?')) return;

      accounts = accounts.filter(a => a.id !== accountId);
      saveAccounts(accounts);

      const activeId = getActiveAccountId();
      if (activeId === accountId) {
        switchAccount(accounts[0].id);
      } else {
        renderAccountsList();
      }
    }

    function openAccountsModal() {
      const m = document.getElementById('accounts-modal');
      if (m) {
        m.style.display = 'flex';
        renderAccountsList();
      }
    }

    function closeAccountsModal() {
      const m = document.getElementById('accounts-modal');
      if (m) m.style.display = 'none';
    }

    function renderAccountsList() {
      const container = document.getElementById('accounts-list-container');
      if (!container) return;
      container.innerHTML = '';

      const accounts = getSavedAccounts();
      const activeId = getActiveAccountId() || (accounts[0] ? accounts[0].id : null);

      if (accounts.length === 0) {
        container.innerHTML = '<div style="color:#71717a; font-size:12px; text-align:center; padding:12px;">No accounts saved. Add your first account below.</div>';
        return;
      }

      accounts.forEach(acc => {
        const isActive = acc.id === activeId;
        const th = acc.profile?.townHallLevel || acc.townHallLevel || 18;
        const tag = acc.profile?.tag || acc.tag || '#VILLAGE';
        const upgrades = acc.profile?.activeUpgrades || [];
        const busyBuilders = Math.min(6, upgrades.length);

        const card = document.createElement('div');
        card.style.cssText = 'background: ' + (isActive ? '#1c1c20' : '#141416') + ';' +
          'border: 1px solid ' + (isActive ? '#ffffff' : '#27272a') + ';' +
          'border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; transition: all 0.2s ease;';

        card.innerHTML = 
          '<div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">' +
            '<img src="/downloads/images/Town_Hall/Town_Hall' + th + '.png" style="width:36px; height:36px; object-fit:contain; flex-shrink:0;" alt="TH" onerror="handleImgError(this)">' +
            '<div style="flex:1; min-width:0;">' +
              '<div style="display:flex; align-items:center; gap:8px;">' +
                '<span style="font-family:\\'Lilita One\\',cursive; font-size:14px; color:#ffffff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + acc.name + '</span>' +
                (isActive ? '<span style="font-size:9px; font-weight:800; background:#ffffff; color:#000000; padding:1px 6px; border-radius:99px; text-transform:uppercase;">Active</span>' : '') +
              '</div>' +
              '<div style="font-size:11px; color:#a1a1aa; margin-top:2px;">' +
                '<span>TH' + th + ' • ' + tag + ' • ' + busyBuilders + '/6 Builders Busy</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">' +
            '<button class="flat-action-btn" style="margin:0; padding:4px 8px; font-size:11px; background:#27272a; color:#a1a1aa;" onclick="renameAccountPrompt(\\'' + acc.id + '\\')" title="Rename Account">' +
              '<span>Rename</span>' +
            '</button>' +
            (!isActive ? 
              '<button class="flat-action-btn" style="margin:0; padding:4px 10px; font-size:11px; background:#ffffff; color:#000000;" onclick="switchAccount(\\'' + acc.id + '\\')">' +
                '<span>Switch</span>' +
              '</button>' : '') +
            (accounts.length > 1 ? 
              '<button class="flat-action-btn" style="margin:0; padding:4px 8px; font-size:11px; background:#27272a; color:#ef4444;" onclick="deleteAccount(\\'' + acc.id + '\\')" title="Delete Account">' +
                '<span>✕</span>' +
              '</button>' : '') +
          '</div>';
        container.appendChild(card);
      });
    }

    function handleAddNewAccountFromForm() {
      const nameInput = document.getElementById('new-account-name-input');
      const jsonInput = document.getElementById('new-account-json-input');

      const name = nameInput ? nameInput.value.trim() : '';
      const text = jsonInput ? jsonInput.value.trim() : '';

      if (!text) {
        alert('Please paste the Clash of Clans JSON export for the new account.');
        return;
      }

      try {
        const parsed = JSON.parse(text);
        const profile = parseVillageExportClientSide(parsed);
        if (!profile) {
          alert('Could not parse village data from the provided JSON.');
          return;
        }

        const finalName = name || profile.playerName || ('Village TH' + (profile.townHallLevel || 18));
        profile.playerName = finalName;

        let accounts = getSavedAccounts();
        const newAcc = {
          id: 'acc_' + Date.now(),
          name: finalName,
          tag: profile.tag || '#VILLAGE',
          townHallLevel: profile.townHallLevel || 18,
          profile: profile,
          createdAt: new Date().toISOString()
        };
        accounts.push(newAcc);
        saveAccounts(accounts);

        // Switch to newly added account immediately
        switchAccount(newAcc.id);

        if (nameInput) nameInput.value = '';
        if (jsonInput) jsonInput.value = '';
      } catch (e) {
        alert('Invalid JSON: ' + e.message);
      }
    }

    // ========================================================
    // CLIENT-SIDE VILLAGE EXPORT & UPGRADE PARSER
    // ========================================================
    function parseVillageExportClientSide(raw) {
      if (!raw) return null;
      let obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (obj.currentProfile) obj = obj.currentProfile;

      const tag = obj.tag || '#IMPORTED';
      let thLevel = Number(obj.townHallLevel || obj.townHall || obj.th || 0);

      const bldgsList = obj.buildings || obj.structures || obj.layout || [];
      const heroesList = obj.heroes || [];
      const unitsList = obj.units || [];
      const spellsList = obj.spells || [];
      const petsList = obj.pets || [];
      const equipmentList = obj.equipment || [];

      let activeUpgrades = [];
      let totalBuildings = 0;
      let totalTraps = 0;
      let totalWalls = 0;
      const mappedBuildings = [];

      function resolveEntityName(id, defaultName) {
        if (window.COC_ENTITY_MAP && window.COC_ENTITY_MAP[id]) return window.COC_ENTITY_MAP[id];
        const sId = String(id);
        if (window.COC_ENTITY_MAP && window.COC_ENTITY_MAP[sId]) return window.COC_ENTITY_MAP[sId];
        return defaultName;
      }

      // 1. Parse Buildings
      if (Array.isArray(bldgsList)) {
        bldgsList.forEach((b, idx) => {
          const rawId = b.data || b.id || b.buildingId || 0;
          const lvl = b.lvl !== undefined ? b.lvl : (b.level !== undefined ? b.level : 1);
          let name = b.name || resolveEntityName(rawId, (rawId === 1000001 ? 'Town Hall' : ('Building ' + (idx+1))));

          if (rawId === 1000001 || (name && name.toLowerCase().includes('town hall'))) {
            name = 'Town Hall';
            thLevel = Math.max(thLevel, Number(lvl));
          }

          if (name && name.toLowerCase().includes('wall')) {
            totalWalls += (b.cnt || 1);
          } else if (name && (name.toLowerCase().includes('bomb') || name.toLowerCase().includes('trap') || name.toLowerCase().includes('mine'))) {
            totalTraps += (b.cnt || 1);
          } else {
            totalBuildings += (b.cnt || 1);
          }

          if (b.timer || b.upgradeEndTimestamp || b.remainingTime) {
            const timerSec = Number(b.timer || b.remainingTime || 86400);
            const endTs = b.upgradeEndTimestamp || (Date.now() + timerSec * 1000);
            activeUpgrades.push({
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
              image: b.image || { url: '/downloads/images/Town_Hall/Town_Hall' + (thLevel || 18) + '.png' }
            });
          }

          mappedBuildings.push({
            instanceId: b.instanceId || ('bldg_' + idx),
            buildingId: b.buildingId || String(rawId),
            name: name,
            category: b.category || 'Defense',
            level: Number(lvl),
            quantity: b.cnt || 1,
            footprint: b.footprint || { width: 3, height: 3 },
            image: b.image || null,
            raw: b
          });
        });
      }

      if (!thLevel || thLevel < 1) thLevel = 18;

      // 2. Parse Heroes (Extract levels and active upgrade timers)
      const mappedHeroes = [];
      const HERO_ID_MAP = {
        28000000: 'Barbarian King',
        28000001: 'Archer Queen',
        28000002: 'Grand Warden',
        28000004: 'Royal Champion',
        28000006: 'Minion Prince',
        28000007: 'Dragon Duke'
      };

      if (Array.isArray(heroesList) && heroesList.length > 0) {
        heroesList.forEach((h, idx) => {
          const rawId = h.data || h.id || 0;
          const hName = h.name || HERO_ID_MAP[rawId] || resolveEntityName(rawId, ('Hero ' + (idx+1)));
          const lvl = h.lvl !== undefined ? h.lvl : (h.level !== undefined ? h.level : 1);

          mappedHeroes.push({
            data: rawId,
            id: rawId,
            name: hName,
            lvl: Number(lvl),
            level: Number(lvl),
            timer: h.timer || 0
          });

          if (h.timer && Number(h.timer) > 0) {
            const timerSec = Number(h.timer);
            activeUpgrades.push({
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
            });
          }
        });
      } else if (Array.isArray(obj.rawHeroes)) {
        mappedHeroes.push(...obj.rawHeroes);
      }

      // 3. Parse Units & Spells (Laboratory Upgrades)
      [...(Array.isArray(unitsList) ? unitsList : []), ...(Array.isArray(spellsList) ? spellsList : [])].forEach((u, idx) => {
        if (u.timer && Number(u.timer) > 0) {
          const rawId = u.data || u.id || 0;
          const uName = u.name || resolveEntityName(rawId, ('Lab Item ' + (idx+1)));
          const lvl = u.lvl !== undefined ? u.lvl : (u.level !== undefined ? u.level : 1);
          const timerSec = Number(u.timer);
          activeUpgrades.push({
            instanceId: 'upg_lab_' + idx,
            buildingId: String(rawId),
            name: uName + ' (Laboratory)',
            category: 'Lab',
            currentLevel: Number(lvl),
            targetLevel: Number(lvl) + 1,
            timerSeconds: timerSec,
            durationSeconds: timerSec,
            upgradeEndTimestamp: Date.now() + timerSec * 1000,
            type: 'lab'
          });
        }
      });

      // 4. Parse Pets (Pet House Upgrades)
      if (Array.isArray(petsList)) {
        petsList.forEach((p, idx) => {
          if (p.timer && Number(p.timer) > 0) {
            const rawId = p.data || p.id || 0;
            const pName = p.name || resolveEntityName(rawId, ('Pet ' + (idx+1)));
            const lvl = p.lvl !== undefined ? p.lvl : (p.level !== undefined ? p.level : 1);
            const timerSec = Number(p.timer);
            activeUpgrades.push({
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
            });
          }
        });
      }

      // Sort active upgrades by remaining timer (shortest first)
      activeUpgrades.sort((a, b) => (a.timerSeconds || 0) - (b.timerSeconds || 0));

      if (activeUpgrades.length === 0 && Array.isArray(obj.activeUpgrades) && obj.activeUpgrades.length > 0) {
        activeUpgrades = obj.activeUpgrades;
      }

      const playerName = obj.playerName || obj.name || 'Chief ClashMaster';

      return {
        tag: tag,
        playerName: playerName,
        townHallLevel: thLevel,
        importedAt: new Date().toISOString(),
        timestamp: obj.timestamp || Math.floor(Date.now() / 1000),
        totalBuildings: totalBuildings || mappedBuildings.length,
        totalTraps: totalTraps,
        totalHeroes: mappedHeroes.length || 6,
        totalWalls: totalWalls || 325,
        completionPercentage: obj.completionPercentage || 91,
        buildings: mappedBuildings.length > 0 ? mappedBuildings : (obj.buildings || []),
        heroes: mappedHeroes.length > 0 ? mappedHeroes : (obj.heroes || []),
        units: unitsList,
        spells: spellsList,
        pets: petsList,
        equipment: equipmentList,
        activeUpgrades: activeUpgrades,
        raw: obj
      };
    }

    `;

content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
console.log('Patched parseVillageExportClientSide and Multi-Account subsystem');

// 3. Update commitVillageImport to use customName and saveOrUpdateAccount
const oldCommitVillage = `        if (profile) {
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
        }`;

const newCommitVillage = `        if (profile) {
          const nameInput = document.getElementById('import-account-name-input');
          const customName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : (profile.playerName || ('Village TH' + (profile.townHallLevel || 18)));
          
          saveOrUpdateAccount(customName, profile);

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
          alert('Successfully imported village ' + customName + ' (' + (profile.tag || '#VILLAGE') + ', TH' + currentTH + ')!');
        }`;

if (content.includes(oldCommitVillage)) {
  content = content.replace(oldCommitVillage, newCommitVillage);
  console.log('Patched commitVillageImport');
} else {
  console.log('oldCommitVillage not matched exactly, checking...');
}

// 4. Update updateProfileDisplay to show displayName and update chips
const oldUpdateProfile = `    function updateProfileDisplay() {
      if (!currentVillageProfile) return;
      const profile = currentVillageProfile;
      const upgrades = profile.activeUpgrades || [];

      // Desktop Profile
      const playerNameEl = document.querySelector('.profile-name-wrap h2');
      if (playerNameEl && profile.playerName) {
        playerNameEl.textContent = profile.playerName;
      }`;

const newUpdateProfile = `    function updateProfileDisplay() {
      if (!currentVillageProfile) return;
      const profile = currentVillageProfile;
      const upgrades = profile.activeUpgrades || [];
      const activeAcc = typeof getActiveAccount === 'function' ? getActiveAccount() : null;
      const displayName = activeAcc?.name || profile.playerName || 'Chief ClashMaster';

      // Desktop Profile
      const playerNameEl = document.querySelector('.profile-name-wrap h2');
      if (playerNameEl) {
        playerNameEl.textContent = displayName;
      }`;

if (content.includes(oldUpdateProfile)) {
  content = content.replace(oldUpdateProfile, newUpdateProfile);
  console.log('Patched updateProfileDisplay top');
}

// Update chipTh in updateProfileDisplay
const oldChipTh = `      // Mobile Top Bar Chips
      const chipTh = document.getElementById('mobile-chip-th');
      if (chipTh) chipTh.textContent = \`TH\${profile.townHallLevel}\`;`;

const newChipTh = `      // Mobile Top Bar Chips
      const chipTh = document.getElementById('mobile-chip-th');
      if (chipTh) chipTh.textContent = displayName;
      const chipAvatar = document.getElementById('mobile-chip-avatar-img');
      if (chipAvatar) chipAvatar.src = '/downloads/images/Town_Hall/Town_Hall' + (profile.townHallLevel || 18) + '.png';`;

if (content.includes(oldChipTh)) {
  content = content.replace(oldChipTh, newChipTh);
  console.log('Patched mobile-chip-th display');
}

fs.writeFileSync(indexPath, content, 'utf8');
console.log('Updated public/index.html successfully');

// Copy to android assets
fs.copyFileSync(indexPath, './android/app/src/main/assets/www/index.html');
console.log('Copied updated index.html to android/app/src/main/assets/www/index.html');
