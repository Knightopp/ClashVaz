import { villageManager } from '../utils/villageManager';
import fs from 'fs';

const rawExport = JSON.parse(fs.readFileSync('data/latest_user_export.json', 'utf8'));

const result = villageManager.saveImport(rawExport);

console.log('Saved latest import:');
console.log('Town Hall Level:', result.profile.townHallLevel);
console.log('Tag:', result.profile.tag);
console.log('Heroes count:', result.profile.heroes.length);
console.log('Dragon Duke level:', result.profile.heroes.find((h: any) => h.data === 28000007)?.lvl);
