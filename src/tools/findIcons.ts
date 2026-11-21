import { mediaWikiClient } from '../api/mediawiki.js';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const targetPages = [
    'Magic_Items',
    'Leagues',
    'Clan_Games',
    'Clan_War_Leagues',
    'Raid_Weekend',
    'Season_Challenges',
    'Builder',
    'Master_Builder',
    'Resource_Buildings'
  ];

  console.log('Discovering official image filenames from Wiki pages...');
  const discoveredFiles = new Set<string>();

  // Add standard icon candidates
  [
    'Gold.png',
    'Elixir.png',
    'Dark_Elixir.png',
    'Gem.png',
    'Builder.png',
    'Master_Builder.png',
    'B.O.B.png',
    'O.T.T.O.png',
    'Trophy.png',
    'Shield.png',
    'Titan_League.png',
    'Legend_League.png',
    'Raid_Medal.png',
    'Strongman.png',
    'Hammer_of_Building.png',
    'Resource_Potion.png',
    'Research_Potion.png',
    'Builder_Potion.png',
    'Season_Challenges.png'
  ].forEach(f => discoveredFiles.add(f));

  for (const page of targetPages) {
    try {
      const parsed = await mediaWikiClient.parsePage(page, ['images']);
      if (parsed && parsed.images) {
        for (const img of parsed.images) {
          // Look for icons, medals, badges, trophies, logos
          if (/icon|badge|medal|trophy|logo|ticket|pass|strongman|caravan|league|potion|hammer|builder/i.test(img)) {
            discoveredFiles.add(img);
          }
        }
      }
    } catch (e: any) {
      console.warn(`Failed parsing images for page ${page}: ${e.message}`);
    }
  }

  const fileList = Array.from(discoveredFiles);
  console.log(`Querying image info for ${fileList.length} relevant Clash of Clans assets...`);
  const imageInfoMap = await mediaWikiClient.getImageInfoBatch(fileList);

  const foundIcons: Record<string, { url: string; width: number; height: number; mime: string }> = {};

  for (const [key, info] of imageInfoMap.entries()) {
    if (!key.startsWith('File:')) {
      foundIcons[key] = {
        url: info.url,
        width: info.width,
        height: info.height,
        mime: info.mime
      };
    }
  }

  const outPath = path.join(process.cwd(), 'data', 'game_icons.json');
  fs.writeFileSync(outPath, JSON.stringify(foundIcons, null, 2), 'utf-8');
  console.log(`Successfully saved ${Object.keys(foundIcons).length} authentic CoC icons to ${outPath}`);
  
  // Print some key highlights
  const keys = Object.keys(foundIcons);
  console.log('Sample discovered icons:', keys.slice(0, 30));
}

main().catch(err => {
  console.error('Error finding icons:', err);
  process.exit(1);
});
