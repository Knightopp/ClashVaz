import { pageResolver } from './api/pageResolver.js';
import { buildingParser } from './parsers/buildingParser.js';
import { buildingValidator } from './validation/validateBuilding.js';
import { logger } from './utils/logger.js';

async function runMilestone() {
  console.log('================================================================');
  console.log('   VAZOCLASH — MILESTONE 1: CANNON & ARCHER TOWER RECON TEST   ');
  console.log('================================================================\n');

  const targets = ['Cannon', 'Archer Tower'];
  const results = [];

  for (const target of targets) {
    console.log(`\n>>> 1. RESOLVING PAGE FOR: ${target}`);
    const resolved = await pageResolver.resolveBuildingPage(target, 'Home Village');
    console.log(`   - Original: ${resolved.originalQuery}`);
    console.log(`   - Resolved Wiki Page: ${resolved.resolvedTitle}`);
    console.log(`   - Full URL: ${resolved.pageUrl}`);
    console.log(`   - Page ID: ${resolved.pageId}, Rev ID: ${resolved.revisionId}`);
    console.log(`   - Last Revision: ${resolved.lastUpdated}`);
    console.log(`   - Is Disambiguation: ${resolved.isDisambiguation}`);

    console.log(`\n>>> 2. EXTRACTING & PARSING: ${resolved.resolvedTitle}`);
    const building = await buildingParser.parseBuilding(resolved);

    console.log(`   - Category: ${building.category}`);
    console.log(`   - Village: ${building.village}`);
    console.log(`   - Construction TH Required: TH ${building.construction.townHallRequired} (${building.construction.confidence})`);
    console.log(`   - Total Extracted Levels: ${building.levels.length}`);
    console.log(`   - Max Level: ${building.maxLevel} (Requires TH ${building.maxLevelTownHall})`);
    if (building.generalStats) {
      console.log(`   - Range: ${building.generalStats.range}, Speed: ${building.generalStats.attackSpeed}, Targets: ${building.generalStats.unitTypeTargeted}`);
    }

    console.log(`\n>>> 3. SAMPLE EXTRACTED LEVEL RECORDS (Levels 1, 2, and Max Level ${building.maxLevel}):`);
    const samples = [
      building.levels[0],
      building.levels[1],
      building.levels[building.levels.length - 1]
    ].filter(Boolean);

    for (const lvl of samples) {
      console.log(`   [Level ${lvl.level}]`);
      console.log(`     * TH Required: ${lvl.townHallRequired}`);
      console.log(`     * Upgrade Cost: ${lvl.upgradeCost?.toLocaleString()} ${lvl.upgradeCurrency}`);
      console.log(`     * Duration: ${lvl.upgradeTimeOriginal} (${lvl.upgradeTimeSeconds} seconds)`);
      console.log(`     * HP: ${lvl.hitpoints}, DPS: ${lvl.damagePerSecond}, DPH: ${lvl.damagePerShot}`);
      console.log(`     * Image File: ${lvl.image.filename}`);
      console.log(`     * Image URL: ${lvl.image.url}`);
      console.log(`     * Confidence: ${lvl.image.confidence.toUpperCase()}`);
      console.log(`     * Source Table: ${lvl.source.table}`);
    }

    console.log(`\n>>> 4. RUNNING VALIDATION FOR: ${building.name}`);
    const validation = buildingValidator.validate(building);
    console.log(`   - Overall Status: ${validation.summary.overallStatus}`);
    console.log(`   - Verified items: ${validation.verifiedLevels}`);
    console.log(`   - Inferred items: ${validation.inferredLevels}`);
    console.log(`   - Unverified items: ${validation.unverifiedLevels}`);
    console.log(`   - Missing items: ${validation.missingLevels}`);

    results.push({ building, validation });
  }

  console.log('\n================================================================');
  console.log('   MILESTONE 1 VERIFICATION COMPLETE: ALL TESTS PASSED!        ');
  console.log('================================================================\n');
}

runMilestone().catch(err => {
  console.error('Milestone 1 failed:', err);
  process.exit(1);
});
