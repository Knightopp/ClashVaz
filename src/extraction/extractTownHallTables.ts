import { MediaWikiClient, mediaWikiClient } from '../api/mediawiki.js';
import { logger } from '../utils/logger.js';

export interface RawProgressionCell {
  quantity: number;
  maxLevel: number;
  rawQtyStr?: string;
  rawLvlStr?: string;
}

export interface ExtractedTownHallData {
  maxDiscoveredTH: number;
  // townHall -> buildingName -> RawProgressionCell
  matrix: Map<number, Map<string, RawProgressionCell>>;
  wallsByTH: Map<number, { quantity: number; maxLevel: number }>;
  sourcePages: string[];
}

export class TownHallTableExtractor {
  private client: MediaWikiClient;

  constructor(client: MediaWikiClient = mediaWikiClient) {
    this.client = client;
  }

  private cleanCell(cell: string): string {
    return cell
      .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
      .replace(/\{\{H\|(?:[^|}]*\|)?([^}]+)\}\}/g, '$1')
      .replace(/\{\{[^}]+\}\}/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();
  }

  private parseCellToken(token: string): string {
    const trimmed = token.trim();
    if (/^(?:scope|class|style|id|width|colspan|rowspan)\s*=/i.test(trimmed)) {
      const pipeIdx = trimmed.indexOf('|');
      if (pipeIdx !== -1) {
        return this.cleanCell(trimmed.slice(pipeIdx + 1));
      }
    }
    return this.cleanCell(trimmed);
  }

  private parseWikiTable(tableWikitext: string): string[][] {
    const rows = tableWikitext.split(/\n\|-/);
    const parsedRows: string[][] = [];

    for (let r = 0; r < rows.length; r++) {
      const rawRow = rows[r];
      const lines = rawRow
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('{|') && !l.startsWith('|}') && !l.startsWith('|+'));

      if (lines.length === 0) continue;

      const cells: string[] = [];
      for (const line of lines) {
        if (line.startsWith('!') || line.startsWith('|')) {
          const lineContent = line.slice(1);
          const tokens = lineContent.split(/!!|\|\|/);
          for (const token of tokens) {
            cells.push(this.parseCellToken(token));
          }
        }
      }
      if (cells.length > 0) {
        parsedRows.push(cells);
      }
    }
    return parsedRows;
  }

  private expandTHRange(thStr: string): number[] {
    const clean = thStr.replace(/[^0-9\-–]/g, '').trim();
    if (!clean) return [];

    const rangeMatch = clean.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      let end = parseInt(rangeMatch[2], 10);
      // If table row ends at 18 but higher TH (like 19) exists in the game, expand the range to include current max TH
      if (end === 18) {
        end = 19;
      }
      const list: number[] = [];
      for (let i = start; i <= end; i++) list.push(i);
      return list;
    }

    const single = parseInt(clean, 10);
    return isNaN(single) ? [] : [single];
  }

  private parseNumber(val: string): number {
    if (!val || val === '-' || val === 'N/A' || val === 'None') return 0;
    // Extract leading base number, e.g. "13 + 2{{Res|Supercharge}}" -> 13, "3*" -> 3, "25" -> 25
    const match = val.trim().match(/^(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return 0;
  }

  /**
   * Parses quantity or level table with possible horizontal split
   */
  private processTable(
    tableWikitext: string,
    isQuantityTable: boolean,
    buildingData: Map<number, Map<string, { qty?: number; lvl?: number; rawQty?: string; rawLvl?: string }>>,
    wallsMap: Map<number, { quantity?: number; maxLevel?: number }>
  ) {
    const parsedRows = this.parseWikiTable(tableWikitext);
    let currentHeaders: string[] = [];

    for (const row of parsedRows) {
      if (row.length === 0) continue;

      // Header row check
      if (row[0].toLowerCase().includes('th level') || row[0].toLowerCase().includes('th')) {
        currentHeaders = row.map(h => h.trim());
        continue;
      }

      if (currentHeaders.length === 0) continue;

      const thList = this.expandTHRange(row[0]);
      if (thList.length === 0) continue;

      for (const th of thList) {
        if (!buildingData.has(th)) {
          buildingData.set(th, new Map());
        }
        const thBuildings = buildingData.get(th)!;

        for (let col = 1; col < currentHeaders.length && col < row.length; col++) {
          const header = currentHeaders[col];
          const rawVal = row[col];
          const numVal = this.parseNumber(rawVal);

          // Handle special combined headers
          let targetBuildings: string[] = [header];
          if (/gold mine.*elixir collector/i.test(header)) {
            targetBuildings = ['Gold Mine', 'Elixir Collector'];
          } else if (/gold.*elixir storage/i.test(header)) {
            targetBuildings = ['Gold Storage', 'Elixir Storage'];
          } else if (/^wall\b/i.test(header)) {
            // Track wall specifically
            if (!wallsMap.has(th)) wallsMap.set(th, {});
            const wObj = wallsMap.get(th)!;
            if (isQuantityTable) wObj.quantity = numVal;
            else wObj.maxLevel = numVal;
            continue;
          }

          for (const bName of targetBuildings) {
            // Clean building name
            const cleanName = bName
              .replace(/[\*†#]/g, '')
              .replace(/\(.*\)/g, '')
              .trim();

            if (!cleanName) continue;

            if (!thBuildings.has(cleanName)) {
              thBuildings.set(cleanName, {});
            }
            const entry = thBuildings.get(cleanName)!;
            if (isQuantityTable) {
              entry.qty = numVal;
              entry.rawQty = rawVal;
            } else {
              entry.lvl = numVal;
              entry.rawLvl = rawVal;
            }
          }
        }
      }
    }
  }

  public async extractAllTownHallTables(): Promise<ExtractedTownHallData> {
    logger.info('TownHallTableExtractor', 'Fetching sections 11, 12, 13 from Town_Hall page...');

    const [s11, s12, s13] = await Promise.all([
      this.client.parsePage('Town_Hall', ['wikitext'], 11),
      this.client.parsePage('Town_Hall', ['wikitext'], 12),
      this.client.parsePage('Town_Hall', ['wikitext'], 13)
    ]);

    const wt11 = s11?.wikitext?.['*'] || '';
    const wt12 = s12?.wikitext?.['*'] || '';
    const wt13 = s13?.wikitext?.['*'] || '';

    const tables11 = wt11.match(/\{\|[\s\S]*?\|\}/g) || [];
    const tables12 = wt12.match(/\{\|[\s\S]*?\|\}/g) || [];
    const tables13 = wt13.match(/\{\|[\s\S]*?\|\}/g) || [];

    logger.info(
      'TownHallTableExtractor',
      `Found tables: Sec 11 (${tables11.length}), Sec 12 (${tables12.length}), Sec 13 (${tables13.length})`
    );

    // Intermediate collection
    const buildingData = new Map<number, Map<string, { qty?: number; lvl?: number; rawQty?: string; rawLvl?: string }>>();
    const wallsMap = new Map<number, { quantity?: number; maxLevel?: number }>();

    // Section 11: Resources (Table 1 = Quantities, Table 2 = Max Levels)
    if (tables11[0]) this.processTable(tables11[0], true, buildingData, wallsMap);
    if (tables11[1]) this.processTable(tables11[1], false, buildingData, wallsMap);

    // Section 12: Army (Table 1 = Quantities, Table 2 = Max Levels)
    if (tables12[0]) this.processTable(tables12[0], true, buildingData, wallsMap);
    if (tables12[1]) this.processTable(tables12[1], false, buildingData, wallsMap);

    // Section 13: Defenses & Traps
    // Table 1 = Defenses Quantities
    // Table 2 = Defenses Max Levels
    // Table 3 = Traps Quantities
    // Table 4 = Traps Max Levels
    if (tables13[0]) this.processTable(tables13[0], true, buildingData, wallsMap);
    if (tables13[1]) this.processTable(tables13[1], false, buildingData, wallsMap);
    if (tables13[2]) this.processTable(tables13[2], true, buildingData, wallsMap);
    if (tables13[3]) this.processTable(tables13[3], false, buildingData, wallsMap);

    // Find highest Town Hall discovered
    const thKeys = Array.from(buildingData.keys()).sort((a, b) => a - b);
    const maxDiscoveredTH = thKeys.length > 0 ? thKeys[thKeys.length - 1] : 19;

    logger.info('TownHallTableExtractor', `Extracted progression across ${thKeys.length} Town Halls (Max: TH${maxDiscoveredTH})`);

    // Consolidate into final matrix
    const matrix = new Map<number, Map<string, RawProgressionCell>>();
    for (const th of thKeys) {
      const thMap = new Map<string, RawProgressionCell>();
      const rawMap = buildingData.get(th)!;
      for (const [bName, vals] of rawMap.entries()) {
        thMap.set(bName, {
          quantity: vals.qty || 0,
          maxLevel: vals.lvl || 0,
          rawQtyStr: vals.rawQty,
          rawLvlStr: vals.rawLvl
        });
      }
      matrix.set(th, thMap);
    }

    const finalWalls = new Map<number, { quantity: number; maxLevel: number }>();
    for (let th = 1; th <= maxDiscoveredTH; th++) {
      const w = wallsMap.get(th) || {};
      finalWalls.set(th, {
        quantity: w.quantity || 0,
        maxLevel: w.maxLevel || 0
      });
    }

    return {
      maxDiscoveredTH,
      matrix,
      wallsByTH: finalWalls,
      sourcePages: [
        'https://clashofclans.fandom.com/wiki/Town_Hall#Resource_Buildings',
        'https://clashofclans.fandom.com/wiki/Town_Hall#Army_Buildings_and_Heroes',
        'https://clashofclans.fandom.com/wiki/Town_Hall#Defensive_Buildings_and_Traps'
      ]
    };
  }
}

export const townHallTableExtractor = new TownHallTableExtractor();
