import fs from 'fs';
import path from 'path';
import { buildingDiscovery } from './discovery/buildingDiscovery.js';
import { buildingParser } from './parsers/buildingParser.js';
import { buildingValidator } from './validation/validateBuilding.js';
import { progressionEngine } from './utils/progressionEngine.js';
import { syncEngine, SyncResult } from './discovery/syncEngine.js';
import { ExtractedBuilding, BuildingValidationReport } from './types/building.js';
import { logger } from './utils/logger.js';

export interface ExtractionRunResult {
  timestamp: string;
  totalBuildings: number;
  totalLevels: number;
  buildings: ExtractedBuilding[];
  validations: Record<string, BuildingValidationReport>;
  logs: any[];
}

export async function runFullExtraction(downloadImages = true): Promise<ExtractionRunResult> {
  logger.info('VazoClash', '=== STARTING COMPREHENSIVE HOME VILLAGE EXTRACTION ===');

  const resolvedPages = await buildingDiscovery.discoverAllHomeVillageBuildings();
  const buildings: ExtractedBuilding[] = [];
  const validations: Record<string, BuildingValidationReport> = {};

  const dataDir = path.resolve(process.cwd(), 'data');
  const downloadsDir = path.resolve(process.cwd(), 'downloads', 'images');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

  for (let i = 0; i < resolvedPages.length; i++) {
    const resolved = resolvedPages[i];
    try {
      logger.info('VazoClash', `[${i + 1}/${resolvedPages.length}] Extracting: ${resolved.originalQuery} (${resolved.resolvedTitle})`);
      const building = await buildingParser.parseBuilding(resolved);
      buildings.push(building);

      const validation = buildingValidator.validate(building);
      validations[building.name] = validation;

      if (downloadImages) {
        const buildingImgDir = path.join(downloadsDir, building.name.replace(/[\s\/]/g, '_'));
        if (!fs.existsSync(buildingImgDir)) fs.mkdirSync(buildingImgDir, { recursive: true });

        const sampleLevels = [
          building.levels[0],
          building.levels[1],
          building.levels[Math.floor(building.levels.length / 2)],
          building.levels[building.levels.length - 1]
        ].filter(Boolean);

        for (const lvl of sampleLevels) {
          if (lvl.image.url && lvl.image.filename) {
            const ext = path.extname(lvl.image.filename) || '.png';
            const destPath = path.join(buildingImgDir, `level-${lvl.level}${ext}`);
            if (!fs.existsSync(destPath)) {
              try {
                const imgRes = await fetch(lvl.image.url, {
                  headers: { 'User-Agent': 'VazoClash-Extractor/1.0' }
                });
                if (imgRes.ok) {
                  const buffer = Buffer.from(await imgRes.arrayBuffer());
                  fs.writeFileSync(destPath, buffer);
                }
              } catch (dlErr: any) {
                logger.warn('VazoClash', `Failed downloading image for ${building.name} Lvl ${lvl.level}: ${dlErr.message}`);
              }
            }
          }
        }
      }
    } catch (err: any) {
      logger.error('VazoClash', `Failed extracting ${resolved.originalQuery}`, err);
    }
  }

  // 1. Save extracted buildings JSON
  const buildingsJsonPath = path.join(dataDir, 'extracted_buildings.json');
  fs.writeFileSync(buildingsJsonPath, JSON.stringify(buildings, null, 2), 'utf-8');
  logger.info('VazoClash', `Saved extracted buildings database (${buildings.length} buildings) to: ${buildingsJsonPath}`);

  // 2. Save validation report JSON
  const validationJsonPath = path.join(dataDir, 'validation_reports.json');
  fs.writeFileSync(validationJsonPath, JSON.stringify(validations, null, 2), 'utf-8');
  logger.info('VazoClash', `Saved validation reports to: ${validationJsonPath}`);

  // 3. Save Town Hall Progression Matrix
  const progression = progressionEngine.generateProgression(buildings);
  const progJsonPath = path.join(dataDir, 'th_progression.json');
  fs.writeFileSync(progJsonPath, JSON.stringify(progression, null, 2), 'utf-8');
  logger.info('VazoClash', `Saved Town Hall progression matrix to: ${progJsonPath}`);

  // 4. Save Image Manifest
  const manifest = progressionEngine.generateImageManifest(buildings);
  const manifestJsonPath = path.join(dataDir, 'image_manifest.json');
  fs.writeFileSync(manifestJsonPath, JSON.stringify(manifest, null, 2), 'utf-8');
  logger.info('VazoClash', `Saved image manifest (${manifest.length} images) to: ${manifestJsonPath}`);

  // 5. Save logs JSON
  const logsJsonPath = path.join(dataDir, 'extraction_logs.json');
  const allLogs = logger.getLogs();
  fs.writeFileSync(logsJsonPath, JSON.stringify(allLogs, null, 2), 'utf-8');

  const totalLevels = buildings.reduce((sum, b) => sum + b.levels.length, 0);

  return {
    timestamp: new Date().toISOString(),
    totalBuildings: buildings.length,
    totalLevels,
    buildings,
    validations,
    logs: allLogs
  };
}

export { syncEngine };

// Direct execution
if (process.argv[1] && process.argv[1].endsWith('index.ts')) {
  const isSync = process.argv.includes('--sync') || process.argv.includes('-s');

  if (isSync) {
    syncEngine.runIncrementalSync()
      .then(result => {
        console.log('\n================================================================');
        console.log(`   VAZOCLASH INCREMENTAL SYNC COMPLETED: ${result.totalBuildingsInDatabase} BUILDINGS IN DB`);
        console.log(`   Unchanged: ${result.unchangedCount} | Modified: ${result.modifiedCount} | New: ${result.newBuildingsCount}`);
        console.log('================================================================\n');
      })
      .catch(err => {
        console.error('Incremental sync failed:', err);
        process.exit(1);
      });
  } else {
    runFullExtraction()
      .then(result => {
        console.log('\n================================================================');
        console.log(`   VAZOCLASH EXTRACTION RUN COMPLETED: ${result.totalBuildings} BUILDINGS, ${result.totalLevels} LEVELS EXTRACTED`);
        console.log('================================================================');
        for (const b of result.buildings) {
          const v = result.validations[b.name];
          console.log(`• [${b.category}] ${b.name.toUpperCase()}: ${b.levels.length} levels (Max: ${b.maxLevel}, Construction TH: ${b.construction.townHallRequired}) - ${v?.summary.overallStatus}`);
        }
        console.log('\n================================================================\n');
      })
      .catch(err => {
        console.error('Extraction failed:', err);
        process.exit(1);
      });
  }
}
