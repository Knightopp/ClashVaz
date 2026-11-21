import { ResolvedBuildingPage } from '../api/pageResolver.js';
import { BuildingConstruction, BuildingWikiMeta } from '../types/building.js';
import { ExtractedTable } from './extractTables.js';
import { logger } from '../utils/logger.js';

export interface GeneralBuildingStats {
  range: string | null;
  attackSpeed: string | null;
  damageType: string | null;
  unitTypeTargeted: string | null;
}

export class MetadataExtractor {
  /**
   * Extracts construction Town Hall requirement from NumberAvailable template and summary text
   */
  public extractConstructionRequirements(
    wikitext: string,
    buildingName: string
  ): BuildingConstruction {
    // 1. Check {{NumberAvailable|TH1=2|...}}
    const numAvailMatch = wikitext.match(/\{\{NumberAvailable\|([^\}]+)\}\}/i);
    let candidateTH: number | null = null;
    let evidence = '';
    let confidence: BuildingConstruction['confidence'] = 'missing';

    if (numAvailMatch) {
      const params = numAvailMatch[1].split('|');
      let minTH: number | null = null;
      for (const p of params) {
        const [key, val] = p.split('=').map(s => s.trim());
        const thNumMatch = key.match(/^TH(\d+)$/i);
        if (thNumMatch) {
          const thNum = parseInt(thNumMatch[1], 10);
          const count = parseInt(val.split('/')[0], 10);
          if (count > 0) {
            if (minTH === null || thNum < minTH) {
              minTH = thNum;
            }
          }
        }
      }

      if (minTH !== null) {
        candidateTH = minTH;
        confidence = 'verified';
        evidence = `Derived from {{NumberAvailable}}: lowest TH with count > 0 is TH${minTH}`;
      }
    }

    // 2. Check Summary text: e.g. "unlocked at [[Town Hall]] 2" or "unlocked at [[Town Hall]] level 4"
    const summaryMatch = wikitext.match(/unlocked\s+(?:after\s+upgrading\s+the\s+)?\[?\[?Town\s*Hall\]?\]?\s*(?:to\s*level\s*|level\s*)?(\d+)/i);
    if (summaryMatch) {
      const summaryTH = parseInt(summaryMatch[1], 10);
      if (!isNaN(summaryTH)) {
        if (candidateTH === null) {
          candidateTH = summaryTH;
          confidence = 'inferred';
          evidence = `Found in summary text: "${summaryMatch[0]}"`;
        } else if (candidateTH === summaryTH) {
          confidence = 'verified';
          evidence += ` (Corroborated by summary text: "${summaryMatch[0]}")`;
        }
      }
    }

    // 3. Fallback for Cannon (tutorial defense)
    if (candidateTH === null && buildingName.toLowerCase() === 'cannon') {
      candidateTH = 1;
      confidence = 'verified';
      evidence = 'First building unlocked at Town Hall 1 tutorial';
    }

    logger.info(
      'MetadataExtractor',
      `Construction TH requirement for ${buildingName}: TH ${candidateTH} (${confidence}) - ${evidence}`
    );

    return {
      townHallRequired: candidateTH,
      source: 'Wikitext Templates & Summary',
      evidence: evidence || 'Not explicitly found in wikitext',
      confidence
    };
  }

  /**
   * Extracts general stats (range, attack speed, damage type, targets)
   */
  public extractGeneralStats(tables: ExtractedTable[]): GeneralBuildingStats {
    const statsTable = tables.find(t => t.tableType === 'general-stats');
    if (!statsTable || statsTable.rows.length === 0) {
      return {
        range: null,
        attackSpeed: null,
        damageType: null,
        unitTypeTargeted: null
      };
    }

    const headers = statsTable.headers.map(h => h.toLowerCase());
    const row = statsTable.rows[0];

    const findVal = (keywords: string[]): string | null => {
      const idx = headers.findIndex(h => keywords.some(k => h.includes(k)));
      if (idx !== -1 && row[idx]) {
        return row[idx].trim();
      }
      return null;
    };

    return {
      range: findVal(['range']),
      attackSpeed: findVal(['attack speed', 'speed']),
      damageType: findVal(['damage type', 'type']),
      unitTypeTargeted: findVal(['unit type targeted', 'target'])
    };
  }
}

export const metadataExtractor = new MetadataExtractor();
