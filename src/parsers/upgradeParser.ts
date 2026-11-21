import { ExtractedTable } from '../extraction/extractTables.js';
import { BuildingLevel, ExtractedImage, SourceTrace } from '../types/building.js';
import { costNormalizer } from '../normalization/normalizeCosts.js';
import { durationNormalizer } from '../normalization/normalizeDurations.js';
import { townHallParser } from './townHallParser.js';
import { logger } from '../utils/logger.js';

export interface ColumnIndexMap {
  level: number;
  dps: number;
  dph: number;
  hitpoints: number;
  cost: number;
  time: number;
  xp: number;
  townHall: number;
  capacity: number;
  productionRate: number;
}

export class UpgradeParser {
  /**
   * Maps header names to column indices
   */
  public identifyColumns(headers: string[]): ColumnIndexMap {
    const map: ColumnIndexMap = {
      level: -1,
      dps: -1,
      dph: -1,
      hitpoints: -1,
      cost: -1,
      time: -1,
      xp: -1,
      townHall: -1,
      capacity: -1,
      productionRate: -1
    };

    headers.forEach((h, idx) => {
      const lower = h.toLowerCase();
      if (/^(?:th\s*)?level\b/i.test(lower) || lower === 'level') {
        if (map.level === -1) map.level = idx;
      } else if (/damage\s*per\s*second|\bdps\b/i.test(lower)) {
        map.dps = idx;
      } else if (/damage\s*per\s*(?:shot|hit|attack)|\bdph\b/i.test(lower)) {
        map.dph = idx;
      } else if (/\bdamage\b/i.test(lower) && map.dps === -1) {
        // e.g. Bomb damage
        map.dps = idx;
      } else if (/hitpoint|\bhp\b/i.test(lower)) {
        map.hitpoints = idx;
      } else if (/\bcost\b|build\s*cost|upgrade\s*cost/i.test(lower)) {
        if (map.cost === -1) map.cost = idx;
      } else if (/\btime\b|build\s*time|upgrade\s*time|\bduration\b/i.test(lower)) {
        if (!lower.includes('time to fill')) {
          map.time = idx;
        }
      } else if (/\bexperience\b|\bxp\b/i.test(lower)) {
        map.xp = idx;
      } else if (/town\s*hall/i.test(lower)) {
        map.townHall = idx;
      } else if (/capacity/i.test(lower) || /housing/i.test(lower)) {
        map.capacity = idx;
      } else if (/production\s*rate/i.test(lower)) {
        map.productionRate = idx;
      }
    });

    // Fallbacks if not explicitly labeled
    if (map.level === -1 && headers.length > 0) map.level = 0;

    return map;
  }

  /**
   * Parses the upgrade level table rows into BuildingLevel objects
   */
  public parseTable(
    table: ExtractedTable,
    buildingName: string,
    pageTitle: string,
    imageMap: Map<number, ExtractedImage>,
    generalStats?: {
      range: string | null;
      attackSpeed: string | null;
      damageType: string | null;
      unitTypeTargeted: string | null;
    }
  ): BuildingLevel[] {
    const colMap = this.identifyColumns(table.headers);
    logger.info('UpgradeParser', `Identified column mapping for table ${table.tableIndex} (${buildingName}):`, colMap);

    const costHeader = colMap.cost !== -1 ? table.rawHeaders[colMap.cost] || table.headers[colMap.cost] : '';
    const levels: BuildingLevel[] = [];

    const isTownHall = buildingName.toLowerCase() === 'town hall';

    for (let r = 0; r < table.rows.length; r++) {
      const row = table.rows[r];
      const rawRow = table.rawRows[r] || row;

      // Extract level number
      const rawLevel = colMap.level !== -1 ? row[colMap.level] : String(r + 1);
      const levelNum = parseInt(rawLevel.replace(/[^0-9]/g, ''), 10);
      if (isNaN(levelNum)) {
        logger.warn('UpgradeParser', `Skipping non-numeric level row ${r + 1}: "${rawLevel}"`);
        continue;
      }

      // Cost & Currency
      const rawCost = colMap.cost !== -1 ? row[colMap.cost] : null;
      const normalizedCost = costNormalizer.normalize(rawCost, costHeader);

      // Duration
      const rawTime = colMap.time !== -1 ? row[colMap.time] : null;
      const normalizedTime = durationNormalizer.normalize(rawTime);

      // Town Hall requirement
      let thRequired: number | null = null;
      if (isTownHall) {
        // Town Hall level X inherently requires Town Hall level X
        thRequired = levelNum;
      } else if (colMap.townHall !== -1) {
        const rawTH = row[colMap.townHall];
        thRequired = townHallParser.parseTownHall(rawTH);
      }

      // Hitpoints
      const rawHP = colMap.hitpoints !== -1 ? row[colMap.hitpoints] : null;
      const hp = rawHP ? parseInt(rawHP.replace(/,/g, '').replace(/[^0-9]/g, ''), 10) : null;

      // Damage per second
      const rawDPS = colMap.dps !== -1 ? row[colMap.dps] : null;
      const dps = rawDPS ? parseFloat(rawDPS.replace(/,/g, '').replace(/[^0-9.]/g, '')) : null;

      // Damage per shot
      const rawDPH = colMap.dph !== -1 ? row[colMap.dph] : null;
      const dph = rawDPH ? parseFloat(rawDPH.replace(/,/g, '').replace(/[^0-9.]/g, '')) : null;

      // Experience
      const rawXP = colMap.xp !== -1 ? row[colMap.xp] : null;
      const xp = rawXP ? parseInt(rawXP.replace(/,/g, '').replace(/[^0-9]/g, ''), 10) : null;

      // Capacity & Production Rate
      const capacity = colMap.capacity !== -1 ? row[colMap.capacity] || null : null;
      const productionRate = colMap.productionRate !== -1 ? row[colMap.productionRate] || null : null;

      // Image mapping
      const imageInfo: ExtractedImage = imageMap.get(levelNum) || {
        filename: null,
        url: null,
        confidence: 'missing',
        evidence: `No matching image discovered for Level ${levelNum}`
      };

      const source: SourceTrace = {
        page: pageTitle,
        table: `Table ${table.tableIndex} (${table.mode || 'Normal Mode'})`,
        section: 'Statistics',
        rawSnippet: rawRow.join(' | ')
      };

      levels.push({
        level: levelNum,
        townHallRequired: thRequired,
        upgradeCost: normalizedCost.amount,
        upgradeCurrency: normalizedCost.currency,
        upgradeTimeOriginal: normalizedTime.original,
        upgradeTimeSeconds: normalizedTime.seconds,
        hitpoints: isNaN(hp as any) ? null : hp,
        damagePerSecond: isNaN(dps as any) ? null : dps,
        damagePerShot: isNaN(dph as any) ? null : dph,
        range: generalStats?.range ?? null,
        attackSpeed: generalStats?.attackSpeed ?? null,
        damageType: generalStats?.damageType ?? null,
        unitTypeTargeted: generalStats?.unitTypeTargeted ?? null,
        experienceGained: isNaN(xp as any) ? null : xp,
        capacity,
        productionRate,
        image: imageInfo,
        source
      });
    }

    logger.info('UpgradeParser', `Successfully parsed ${levels.length} levels for "${buildingName}".`);
    return levels;
  }
}

export const upgradeParser = new UpgradeParser();
