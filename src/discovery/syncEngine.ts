import fs from 'fs';
import path from 'path';
import { buildingDiscovery } from './buildingDiscovery.js';
import { buildingParser } from '../parsers/buildingParser.js';
import { buildingValidator } from '../validation/validateBuilding.js';
import { progressionEngine } from '../utils/progressionEngine.js';
import { ExtractedBuilding, BuildingValidationReport } from '../types/building.js';
import { logger } from '../utils/logger.js';

export interface SyncResult {
  timestamp: string;
  mode: 'full' | 'incremental';
  totalPagesChecked: number;
  unchangedCount: number;
  modifiedCount: number;
  newBuildingsCount: number;
  totalBuildingsInDatabase: number;
  totalLevelsInDatabase: number;
  changes: Array<{
    buildingName: string;
    type: 'NEW' | 'MODIFIED' | 'UNCHANGED';
    details: string;
  }>;
}

export class SyncEngine {
  /**
   * Executes incremental synchronization against the Wiki revision IDs
   */
  public async runIncrementalSync(downloadImages = true): Promise<SyncResult> {
    logger.info('SyncEngine', '=== STARTING INCREMENTAL WIKI SYNCHRONIZATION ===');

    const dataDir = path.resolve(process.cwd(), 'data');
    const downloadsDir = path.resolve(process.cwd(), 'downloads', 'images');
    const buildingsPath = path.join(dataDir, 'extracted_buildings.json');
    const validationsPath = path.join(dataDir, 'validation_reports.json');

    // 1. Load existing database
    let existingBuildings: ExtractedBuilding[] = [];
    if (fs.existsSync(buildingsPath)) {
      try {
        existingBuildings = JSON.parse(fs.readFileSync(buildingsPath, 'utf-8'));
      } catch (err: any) {
        logger.warn('SyncEngine', `Could not parse existing database: ${err.message}. Running fresh extraction.`);
      }
    }

    const buildingMap = new Map<string, ExtractedBuilding>();
    for (const b of existingBuildings) {
      buildingMap.set(b.name.toLowerCase(), b);
    }

    // 2. Discover all current Home Village pages
    const currentPages = await buildingDiscovery.discoverAllHomeVillageBuildings();

    const changes: SyncResult['changes'] = [];
    let unchangedCount = 0;
    let modifiedCount = 0;
    let newBuildingsCount = 0;

    for (const page of currentPages) {
      const existing = buildingMap.get(page.originalQuery.toLowerCase());

      // Check revision ID
      if (existing && existing.wiki.revisionId === page.revisionId) {
        // Page has not changed on the Wiki!
        unchangedCount++;
        changes.push({
          buildingName: page.originalQuery,
          type: 'UNCHANGED',
          details: `Revision ID ${page.revisionId} unchanged. Skipped re-extraction.`
        });
        logger.info('SyncEngine', `[UNCHANGED] ${page.originalQuery} (Rev ${page.revisionId})`);
        continue;
      }

      const isNew = !existing;
      logger.info(
        'SyncEngine',
        isNew
          ? `[NEW BUILDING DETECTED] ${page.originalQuery} (Rev ${page.revisionId})`
          : `[PAGE MODIFIED ON WIKI] ${page.originalQuery} (Old Rev: ${existing?.wiki.revisionId} -> New Rev: ${page.revisionId})`
      );

      try {
        // Re-extract modified or new building
        const updated = await buildingParser.parseBuilding(page);

        // Detect specific differences
        if (existing) {
          const diffs: string[] = [];
          if (existing.levels.length !== updated.levels.length) {
            diffs.push(`Levels changed: ${existing.levels.length} -> ${updated.levels.length}`);
          }
          if (existing.maxLevel !== updated.maxLevel) {
            diffs.push(`Max level changed: ${existing.maxLevel} -> ${updated.maxLevel}`);
          }
          if (existing.maxLevelTownHall !== updated.maxLevelTownHall) {
            diffs.push(`Max level TH changed: ${existing.maxLevelTownHall} -> ${updated.maxLevelTownHall}`);
          }
          const diffSummary = diffs.length > 0 ? diffs.join(', ') : 'Minor wiki text / statistics update';
          modifiedCount++;
          changes.push({
            buildingName: page.originalQuery,
            type: 'MODIFIED',
            details: diffSummary
          });
        } else {
          newBuildingsCount++;
          changes.push({
            buildingName: page.originalQuery,
            type: 'NEW',
            details: `Extracted ${updated.levels.length} levels, Max Level: ${updated.maxLevel} (TH ${updated.maxLevelTownHall})`
          });
        }

        // Download images if requested
        if (downloadImages) {
          const buildingImgDir = path.join(downloadsDir, updated.name.replace(/[\s\/]/g, '_'));
          if (!fs.existsSync(buildingImgDir)) fs.mkdirSync(buildingImgDir, { recursive: true });

          const sampleLevels = [
            updated.levels[0],
            updated.levels[1],
            updated.levels[Math.floor(updated.levels.length / 2)],
            updated.levels[updated.levels.length - 1]
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
                } catch {}
              }
            }
          }
        }

        // Update database map
        buildingMap.set(updated.name.toLowerCase(), updated);
      } catch (err: any) {
        logger.error('SyncEngine', `Failed extracting ${page.originalQuery}`, err);
        changes.push({
          buildingName: page.originalQuery,
          type: 'MODIFIED',
          details: `Extraction error: ${err.message}`
        });
      }
    }

    // 3. Save updated database
    const finalBuildings = Array.from(buildingMap.values());
    fs.writeFileSync(buildingsPath, JSON.stringify(finalBuildings, null, 2), 'utf-8');

    // 4. Update validations
    const validations: Record<string, BuildingValidationReport> = {};
    for (const b of finalBuildings) {
      validations[b.name] = buildingValidator.validate(b);
    }
    fs.writeFileSync(validationsPath, JSON.stringify(validations, null, 2), 'utf-8');

    // 5. Update Town Hall progression matrix & Image manifest
    const progression = progressionEngine.generateProgression(finalBuildings);
    fs.writeFileSync(path.join(dataDir, 'th_progression.json'), JSON.stringify(progression, null, 2), 'utf-8');

    const manifest = progressionEngine.generateImageManifest(finalBuildings);
    fs.writeFileSync(path.join(dataDir, 'image_manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

    // 6. Save sync logs
    const totalLevels = finalBuildings.reduce((sum, b) => sum + b.levels.length, 0);

    const result: SyncResult = {
      timestamp: new Date().toISOString(),
      mode: 'incremental',
      totalPagesChecked: currentPages.length,
      unchangedCount,
      modifiedCount,
      newBuildingsCount,
      totalBuildingsInDatabase: finalBuildings.length,
      totalLevelsInDatabase: totalLevels,
      changes
    };

    logger.info(
      'SyncEngine',
      `Incremental sync complete: ${unchangedCount} unchanged, ${modifiedCount} modified, ${newBuildingsCount} new. Total buildings: ${finalBuildings.length} (${totalLevels} levels)`
    );

    return result;
  }
}

export const syncEngine = new SyncEngine();
