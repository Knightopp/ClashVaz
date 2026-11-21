import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';

export interface ExtractedTable {
  tableIndex: number;
  headers: string[];
  rawHeaders: string[];
  rows: string[][];
  rawRows: string[][];
  tableType: 'upgrade-levels' | 'general-stats' | 'supercharge' | 'geared-up' | 'history' | 'other';
  mode?: string;
  sourceText?: string;
}

export class TableExtractor {
  /**
   * Cleans a raw cell value by removing HTML comments, extracting text after attributes,
   * stripping templates and wikilinks.
   */
  public cleanCellValue(raw: string): string {
    if (!raw) return '';

    // 1. Remove HTML comments
    let cleaned = raw.replace(/<!--[\s\S]*?-->/g, '').trim();

    // 2. Check for attribute prefix before pipe
    // e.g. class="GoldPass bTime" style="white-space:nowrap;"|5s
    // or data-type="level"|Level
    // or class="change-highlight|9
    // or style="..."|value
    const pipeIdx = cleaned.lastIndexOf('|');
    if (pipeIdx !== -1) {
      const beforePipe = cleaned.slice(0, pipeIdx);
      // Ensure we don't accidentally split a wikilink like [[Resources#Gold|Cost]]
      if (
        (beforePipe.includes('class=') ||
          beforePipe.includes('style=') ||
          beforePipe.includes('data-type=') ||
          beforePipe.includes('data-') ||
          beforePipe.includes('scope=') ||
          beforePipe.includes('colspan=') ||
          beforePipe.includes('rowspan=') ||
          beforePipe.includes('width=') ||
          beforePipe.includes('align=') ||
          beforePipe.startsWith('class="change-highlight')) &&
        !beforePipe.includes('[[')
      ) {
        cleaned = cleaned.slice(pipeIdx + 1).trim();
      }
    }

    // 3. Remove wikilinks: [[Link|Text]] -> Text, [[Text]] -> Text
    cleaned = cleaned.replace(/\[\[(?:[^\|\]]+\|)?([^\]]+)\]\]/g, '$1');

    // 4. Remove templates: {{Res|Gold}} -> Gold, {{Res|RES=Gold}} -> Gold
    cleaned = cleaned.replace(/\{\{Res\|(?:RES=)?([^\}]+)\}\}/gi, '$1');
    cleaned = cleaned.replace(/\{\{[^\}]+\}\}/g, '');

    // 5. Remove HTML tags like <br/>, <span>, etc.
    cleaned = cleaned.replace(/<[^>]+>/g, ' ');

    // 6. Normalize non-breaking spaces and whitespace
    cleaned = cleaned.replace(/&nbsp;/gi, ' ');
    cleaned = cleaned.replace(/&#8224;/gi, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }

  /**
   * Extracts tables from wikitext
   */
  public extractTablesFromWikitext(wikitext: string): ExtractedTable[] {
    const tables: ExtractedTable[] = [];
    // Match any wikitable tag, whether class or style comes first
    const tableRegex = /\{\|[^\n]*wikitable[^\n]*\n([\s\S]*?)\|\}/g;

    let match;
    let tableIndex = 0;

    while ((match = tableRegex.exec(wikitext)) !== null) {
      tableIndex++;
      const fullTableText = match[1];

      // Check for preceding mode label
      const preText = wikitext.slice(Math.max(0, match.index - 400), match.index);
      let detectedMode = 'Normal Mode';
      if (/geared\s*up/i.test(preText)) {
        detectedMode = 'Geared Up';
      } else if (/supercharge/i.test(preText) || /charge\s*level/i.test(fullTableText)) {
        detectedMode = 'Supercharge';
      }

      // Split by row separator |-
      const rowChunks = fullTableText.split(/\n\|-/).map(c => c.trim()).filter(Boolean);
      if (rowChunks.length === 0) continue;

      // Extract headers from first chunk or chunks with !
      const headerChunk = rowChunks[0];
      const rawHeaderLines: string[] = [];

      // Headers can be on separate lines starting with ! or split by !!
      const hLines = headerChunk.split('\n').filter(l => l.startsWith('!'));
      for (const line of hLines) {
        const withoutExcl = line.replace(/^!+/, '');
        const parts = withoutExcl.split('!!');
        for (const p of parts) {
          rawHeaderLines.push(p.trim());
        }
      }

      const cleanHeaders = rawHeaderLines.map(h => this.cleanCellValue(h));

      // Extract rows
      const extractedRows: string[][] = [];
      const rawRowsList: string[][] = [];

      for (let r = 1; r < rowChunks.length; r++) {
        const rowText = rowChunks[r];
        if (rowText.startsWith('|}')) continue;

        const rawCells: string[] = [];
        const lines = rowText.split('\n');

        for (const line of lines) {
          if (!line.startsWith('|')) continue;
          const withoutPipe = line.slice(1);
          // Split by ||
          const parts = withoutPipe.split('||');
          for (const part of parts) {
            rawCells.push(part.trim());
          }
        }

        if (rawCells.length > 0) {
          rawRowsList.push(rawCells);
          extractedRows.push(rawCells.map(c => this.cleanCellValue(c)));
        }
      }

      // Classify table type
      const headerString = cleanHeaders.join(' ').toLowerCase();
      let tableType: ExtractedTable['tableType'] = 'other';

      if (headerString.includes('charge level')) {
        tableType = 'supercharge';
      } else if (
        (headerString.includes('level') || headerString.includes('th level')) &&
        (headerString.includes('cost') || headerString.includes('build cost') || headerString.includes('upgrade cost') || headerString.includes('time to fill')) &&
        (headerString.includes('time') || headerString.includes('build time') || headerString.includes('upgrade time') || headerString.includes('town hall'))
      ) {
        if (detectedMode === 'Geared Up' || headerString.includes('burst') || headerString.includes('double cannon')) {
          tableType = 'geared-up';
        } else {
          tableType = 'upgrade-levels';
        }
      } else if (headerString.includes('range') && headerString.includes('attack speed')) {
        tableType = 'general-stats';
      } else if (headerString.includes('date') || headerString.includes('patch') || headerString.includes('version')) {
        tableType = 'history';
      }

      tables.push({
        tableIndex,
        headers: cleanHeaders,
        rawHeaders: rawHeaderLines,
        rows: extractedRows,
        rawRows: rawRowsList,
        tableType,
        mode: detectedMode,
        sourceText: fullTableText
      });
    }

    logger.info('TableExtractor', `Extracted ${tables.length} tables from wikitext.`);
    return tables;
  }

  /**
   * Fallback / Cross-check table extraction using Cheerio on parsed HTML
   */
  public extractTablesFromHtml(html: string): ExtractedTable[] {
    const $ = cheerio.load(html);
    const tables: ExtractedTable[] = [];

    $('table.wikitable').each((idx, tableElem) => {
      const headers: string[] = [];
      $(tableElem).find('tr').first().find('th').each((_, th) => {
        headers.push($(th).text().replace(/\s+/g, ' ').trim());
      });

      const rows: string[][] = [];
      $(tableElem).find('tr').slice(1).each((_, tr) => {
        const rowData: string[] = [];
        $(tr).find('td').each((_, td) => {
          rowData.push($(td).text().replace(/\s+/g, ' ').trim());
        });
        if (rowData.length > 0) {
          rows.push(rowData);
        }
      });

      const headerString = headers.join(' ').toLowerCase();
      let tableType: ExtractedTable['tableType'] = 'other';
      if (headerString.includes('charge level')) {
        tableType = 'supercharge';
      } else if (
        headerString.includes('level') &&
        headerString.includes('cost') &&
        (headerString.includes('time') || headerString.includes('town hall'))
      ) {
        tableType = 'upgrade-levels';
      } else if (headerString.includes('range') && headerString.includes('attack speed')) {
        tableType = 'general-stats';
      }

      tables.push({
        tableIndex: idx + 1,
        headers,
        rawHeaders: headers,
        rows,
        rawRows: rows,
        tableType
      });
    });

    return tables;
  }
}

export const tableExtractor = new TableExtractor();
