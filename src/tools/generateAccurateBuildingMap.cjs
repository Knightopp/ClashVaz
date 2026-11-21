const fs = require('fs');

const ck = JSON.parse(fs.readFileSync('data/clashking_static_data.json', 'utf8'));
const ext = JSON.parse(fs.readFileSync('data/extracted_buildings.json', 'utf8'));

console.log('Extracted buildings count:', ext.length);
const extNames = ext.map(b => b.name);

const scMap = {};
ck.buildings.forEach(b => {
  const clean = b.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  // Match with extracted buildings
  const found = ext.find(eb => eb.name.toLowerCase().replace(/\/home village/i, '').trim() === b.name.toLowerCase().trim());
  scMap[b._id] = clean;
  console.log(`${b._id}: '${clean}' (found in extracted: ${!!found})`);
});

fs.writeFileSync('data/sc_verified_map.json', JSON.stringify(scMap, null, 2));
console.log('Saved data/sc_verified_map.json');
