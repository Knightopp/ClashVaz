import fs from 'fs';
import path from 'path';
import { progressionParser } from './parsers/progressionParser.js';
import { progressionValidator } from './validation/validateProgression.js';
import { csvExporter } from './utils/csvExporter.js';
import { logger } from './utils/logger.js';
import { ExtractedBuilding } from './types/building.js';

export async function runProgressionGeneration(): Promise<void> {
  logger.info('ProgressionEngine', '=== STARTING PHASE 3: TOWN HALL PROGRESSION GENERATION ===');

  const { progressions, maxTownHall } = await progressionParser.buildProgressionDatabase();

  const buildingsPath = path.resolve(process.cwd(), 'data', 'extracted_buildings.json');
  const buildings: ExtractedBuilding[] = fs.existsSync(buildingsPath)
    ? JSON.parse(fs.readFileSync(buildingsPath, 'utf-8'))
    : [];

  const validationReport = progressionValidator.validate(progressions, buildings);

  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  // 1. Save full JSON progression
  fs.writeFileSync(
    path.join(dataDir, 'th_progression.json'),
    JSON.stringify(progressions, null, 2)
  );

  // 2. Save validation report
  fs.writeFileSync(
    path.join(dataDir, 'progression_validation.json'),
    JSON.stringify(validationReport, null, 2)
  );

  // 3. Save CSV matrices
  const qtyCsv = csvExporter.generateQuantityMatrixCsv(progressions);
  fs.writeFileSync(path.join(dataDir, 'th_quantities_matrix.csv'), qtyCsv);

  const lvlCsv = csvExporter.generateMaxLevelMatrixCsv(progressions);
  fs.writeFileSync(path.join(dataDir, 'th_maxlevels_matrix.csv'), lvlCsv);

  const sumCsv = csvExporter.generateSummaryCsv(progressions);
  fs.writeFileSync(path.join(dataDir, 'th_progression_summary.csv'), sumCsv);

  logger.info('ProgressionEngine', `Saved complete progression database for ${progressions.length} Town Halls!`);
  logger.info('ProgressionEngine', `Validation Status: ${validationReport.status.toUpperCase()} (${validationReport.errors.length} errors, ${validationReport.warnings.length} warnings)`);

  console.log('\n================================================================');
  console.log(`   PHASE 3: COMPLETE TOWN HALL PROGRESSION DATABASE (TH 1 - ${maxTownHall})`);
  console.log('================================================================');
  for (const p of progressions) {
    console.log(
      `• [TH ${p.townHall}] Instances: ${p.summary.totalBuildingInstances} | Types: ${p.summary.totalBuildingTypes} | Defenses: ${p.summary.totalDefenses} | Resources: ${p.summary.totalResources} | Army: ${p.summary.totalArmy} | Traps: ${p.summary.totalTraps} | Walls: ${p.summary.totalWalls} (Max Lvl: ${p.summary.wallMaxLevel}) | New Unlocks: ${p.summary.newlyUnlockedTypes} | Upgrades: ${p.summary.newUpgradeUnlocks}`
    );
  }
  console.log('================================================================\n');
}

// Allow direct CLI execution
if (process.argv[1]?.endsWith('progressionCli.ts') || process.argv[1]?.endsWith('progressionCli.js')) {
  runProgressionGeneration().catch(console.error);
}
