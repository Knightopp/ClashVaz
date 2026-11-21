import { villageExportParser } from '../parsers/villageExportParser';
import fs from 'fs';

const rawExport = JSON.parse(fs.readFileSync('data/latest_user_export.json', 'utf8'));

console.log('Testing villageExportParser on latest_user_export.json:');
const validation = villageExportParser.validateExport(rawExport);
console.log('Validation result:');
console.log('Preview TH:', validation.preview?.townHallLevel);
console.log('Preview totalBuildings:', validation.preview?.totalBuildings);
console.log('Preview active upgrades count:', validation.preview?.activeUpgradesCount);

const profile = villageExportParser.parseVillage(rawExport);
console.log('Parsed profile TownHallLevel:', profile.townHallLevel);
console.log('Parsed profile total buildings:', profile.totalBuildings);
console.log('Parsed profile active upgrades:');
profile.activeUpgrades.forEach(u => console.log(`- ${u.name} Lv ${u.currentLevel} -> Lv ${u.targetLevel} (${u.timerSeconds}s)`));

const thBldg = profile.buildings.find(b => b.buildingId === 'town-hall' || b.name.toLowerCase().includes('town hall'));
console.log('Town Hall building in profile:', thBldg);
