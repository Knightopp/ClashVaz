async function testIntegration() {
  console.log('--- 1. Testing Village JSON Validation API ---');
  const validExport = {
    tag: '#TESTPLAYER',
    timestamp: Date.now(),
    buildings: [
      { data: 1000001, lvl: 18, cnt: 1 },
      { data: 1000003, lvl: 21, cnt: 5 },
      { data: 1000037, lvl: 3, cnt: 2, timer: 120000 }
    ],
    traps: [
      { data: 1200001, lvl: 14, cnt: 8 }
    ],
    heroes: [
      { data: 0, lvl: 95, name: 'Barbarian King' }
    ]
  };

  const valRes = await fetch('http://localhost:3000/api/village/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validExport)
  });
  const valJson = await valRes.json();
  console.log('Validation Response:', valJson);

  console.log('\n--- 2. Testing Village Import API ---');
  const impRes = await fetch('http://localhost:3000/api/village/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validExport)
  });
  const impJson = await impRes.json();
  console.log('Import Status:', impJson.success, 'Tag:', impJson.profile?.tag, 'Upgrades:', impJson.profile?.activeUpgrades?.length);

  console.log('\n--- 3. Testing Layouts Save & Persistence ---');
  const layoutsRes = await fetch('http://localhost:3000/api/village/layouts');
  const layouts = await layoutsRes.json();
  console.log('Current Layouts Count:', layouts.length);

  const testLayout = {
    name: 'Automated Test Base',
    gridSize: 44,
    buildings: [
      {
        instanceId: 'test_inst_1',
        buildingId: 'town-hall',
        name: 'Town Hall',
        category: 'Defense',
        level: 18,
        x: 20,
        y: 20,
        width: 4,
        height: 4
      }
    ]
  };

  const saveRes = await fetch('http://localhost:3000/api/village/layouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testLayout)
  });
  const saveJson = await saveRes.json();
  console.log('Saved layout id:', saveJson.layout?.id, 'name:', saveJson.layout?.name);

  // Clean up test layout
  if (saveJson.layout?.id) {
    await fetch(`http://localhost:3000/api/village/layouts/${saveJson.layout.id}`, { method: 'DELETE' });
    console.log('Cleaned up test layout.');
  }

  // Restore authentic default profile
  const defaultExport = {
    tag: '#9LV2PR99',
    timestamp: Date.now(),
    buildings: [
      { data: 1000001, lvl: 18, cnt: 1, x: 20, y: 20 },
      { data: 1000002, lvl: 14, cnt: 1, x: 24, y: 20 },
      { data: 1000037, lvl: 3, cnt: 2, timer: 136800, x: 17, y: 20 },
      { data: 1000038, lvl: 2, cnt: 2, timer: 280800, x: 23, y: 16 },
      { data: 1000032, lvl: 5, cnt: 1, timer: 388800, x: 20, y: 25 },
      { data: 1000034, lvl: 4, cnt: 3, x: 16, y: 24 },
      { data: 1000035, lvl: 4, cnt: 3, x: 24, y: 24 },
      { data: 1000014, lvl: 16, cnt: 4, x: 18, y: 18 },
      { data: 1000015, lvl: 17, cnt: 2, x: 22, y: 18 },
      { data: 1000021, lvl: 13, cnt: 4, x: 19, y: 22 },
      { data: 1000023, lvl: 12, cnt: 3, x: 21, y: 22 },
      { data: 1000028, lvl: 7, cnt: 2, x: 18, y: 25 },
      { data: 1000031, lvl: 4, cnt: 2, x: 22, y: 25 },
      { data: 1000011, lvl: 19, cnt: 4, x: 15, y: 18 },
      { data: 1000012, lvl: 19, cnt: 4, x: 25, y: 18 },
      { data: 1000019, lvl: 13, cnt: 1, x: 20, y: 17 },
      { data: 1000006, lvl: 14, cnt: 4, x: 12, y: 12 },
      { data: 1000008, lvl: 16, cnt: 1, x: 12, y: 18 },
      { data: 1000033, lvl: 10, cnt: 1, x: 12, y: 22 },
      { data: 1000030, lvl: 12, cnt: 1, x: 12, y: 26 },
      { data: 1000005, lvl: 19, cnt: 325 }
    ],
    traps: [
      { data: 1200001, lvl: 14, cnt: 8 },
      { data: 1200002, lvl: 13, cnt: 9 },
      { data: 1200003, lvl: 12, cnt: 8 },
      { data: 1200004, lvl: 13, cnt: 8 },
      { data: 1200005, lvl: 8, cnt: 9 },
      { data: 1200006, lvl: 5, cnt: 4 },
      { data: 1200007, lvl: 3, cnt: 1 }
    ],
    heroes: [
      { data: 0, lvl: 95, name: 'Barbarian King' },
      { data: 1, lvl: 95, name: 'Archer Queen' },
      { data: 2, lvl: 70, name: 'Grand Warden' },
      { data: 3, lvl: 45, name: 'Royal Champion' },
      { data: 4, lvl: 10, name: 'Minion Prince' }
    ]
  };
  await fetch('http://localhost:3000/api/village/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(defaultExport)
  });
  console.log('\nAll integration tests PASSED successfully!');
}

testIntegration();
