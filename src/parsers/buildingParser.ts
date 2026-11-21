import { ResolvedBuildingPage } from '../api/pageResolver.js';
import { wikitextExtractor } from '../extraction/extractWikitext.js';
import { tableExtractor, ExtractedTable } from '../extraction/extractTables.js';
import { imageExtractor } from '../extraction/extractImages.js';
import { metadataExtractor } from '../extraction/extractMetadata.js';
import { upgradeParser } from './upgradeParser.js';
import { ExtractedBuilding } from '../types/building.js';
import { logger } from '../utils/logger.js';

export class BuildingParser {
  /**
   * Orchestrates extraction and parsing for a resolved building page
   */
  public async parseBuilding(resolved: ResolvedBuildingPage): Promise<ExtractedBuilding> {
    logger.info('BuildingParser', `Starting full extraction for: ${resolved.originalQuery} (${resolved.resolvedTitle})`);

    // 1. Extract wikitext
    const wikitextData = await wikitextExtractor.extract(resolved.resolvedTitle);
    const wikitext = wikitextData.wikitext;

    // 2. Extract tables
    const tables = tableExtractor.extractTablesFromWikitext(wikitext);
    // Find the primary upgrade levels table (table with upgrade-levels and rows)
    const upgradeTable = tables.find(t => t.tableType === 'upgrade-levels' && t.rows.length > 0) ||
      tables.find(t => t.tableType === 'upgrade-levels');

    if (!upgradeTable) {
      throw new Error(`Could not find primary upgrade levels table for "${resolved.resolvedTitle}". Tables detected: ${tables.length}`);
    }

    // 3. Extract general building properties (range, speed, targets)
    const generalStats = metadataExtractor.extractGeneralStats(tables);

    // 4. Extract construction Town Hall requirement
    const construction = metadataExtractor.extractConstructionRequirements(wikitext, resolved.originalQuery);

    // 5. Discover & resolve images
    const rawImageMappings = imageExtractor.discoverLevelImages(wikitext, resolved.originalQuery);
    const resolvedImageMap = await imageExtractor.resolveImageMetadata(rawImageMappings, resolved.pageUrl);

    // 6. Parse level rows
    const levels = upgradeParser.parseTable(
      upgradeTable,
      resolved.originalQuery,
      resolved.resolvedTitle,
      resolvedImageMap,
      generalStats
    );

    // 7. Calculate maxLevel and maxLevelTownHall
    let maxLevel: number | null = null;
    let maxLevelTownHall: number | null = null;

    if (levels.length > 0) {
      const highestLevelObj = levels[levels.length - 1];
      maxLevel = highestLevelObj.level;
      maxLevelTownHall = highestLevelObj.townHallRequired;
    }

    const notes: string[] = [];
    if (resolved.isDisambiguation) {
      notes.push(`Resolved from disambiguation page "${resolved.originalQuery}" to subpage "${resolved.resolvedTitle}".`);
    }
    notes.push(`Discovered ${rawImageMappings.length} visual level representations.`);

    const building: ExtractedBuilding = {
      name: resolved.originalQuery,
      category: resolved.category,
      village: resolved.village,
      wiki: {
        url: resolved.pageUrl,
        pageTitle: resolved.originalQuery,
        resolvedTitle: resolved.resolvedTitle,
        pageId: resolved.pageId,
        revisionId: resolved.revisionId,
        lastUpdated: resolved.lastUpdated
      },
      construction,
      levels,
      maxLevel,
      maxLevelTownHall,
      extractionStatus: levels.length > 0 ? 'success' : 'partial',
      generalStats,
      notes
    };

    logger.info(
      'BuildingParser',
      `Completed parsing for "${resolved.originalQuery}": ${levels.length} levels, Max Level: ${maxLevel} (TH ${maxLevelTownHall})`
    );

    return building;
  }
}

export const buildingParser = new BuildingParser();
