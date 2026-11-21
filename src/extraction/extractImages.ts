import { MediaWikiClient, mediaWikiClient } from '../api/mediawiki.js';
import { ExtractedImage } from '../types/building.js';
import { logger } from '../utils/logger.js';

export interface LevelImageMapping {
  level: number;
  filename: string;
  sourceType: 'active-flexbox' | 'gallery' | 'pattern' | 'unknown';
  confidence: 'verified' | 'inferred' | 'unverified' | 'missing';
  evidence: string;
}

export class ImageExtractor {
  private client: MediaWikiClient;

  constructor(client: MediaWikiClient = mediaWikiClient) {
    this.client = client;
  }

  /**
   * Discovers level-to-image mappings from the wikitext
   */
  public discoverLevelImages(wikitext: string, buildingName: string): LevelImageMapping[] {
    const mappings: LevelImageMapping[] = [];
    const seenLevels = new Set<number>();

    // 1. Primary Strategy: Extract from the "Normal Mode" or active visual flexbox
    let searchScope = wikitext;
    const activeMatch = wikitext.match(/<div class="active">([\s\S]*?)<\/div>\s*<!--\s*End of Normal/i);
    if (activeMatch) {
      searchScope = activeMatch[1];
      logger.info('ImageExtractor', `Focusing image search within active Normal Mode container (${searchScope.length} chars).`);
    } else {
      const summaryIdx = wikitext.indexOf('==Summary==') !== -1 ? wikitext.indexOf('==Summary==') : wikitext.indexOf('== Summary ==');
      if (summaryIdx !== -1) {
        searchScope = wikitext.slice(0, summaryIdx);
      }
    }

    // Regex for: <div...>[[File:FILENAME...]]<div...>...Level (\d+)(?:-(\d+))?...</div></div>
    const flexboxItemRegex = /<div[^>]*>\[\[File:([^|\]]+)[^\]]*\]\]\s*<div[^>]*>(?:'''|<[^>]+>)*\s*(?:TH\s*|Level\s*)?(\d+)(?:\s*[-–]\s*(\d+))?(?:'''|<[^>]+>)*\s*<\/div><\/div>/gi;
    let match;

    while ((match = flexboxItemRegex.exec(searchScope)) !== null) {
      const filename = match[1].trim();
      const startLevel = parseInt(match[2], 10);
      const endLevel = match[3] ? parseInt(match[3], 10) : startLevel;

      if (!isNaN(startLevel) && !this.isExcludedImage(filename)) {
        for (let lvl = startLevel; lvl <= endLevel; lvl++) {
          if (!seenLevels.has(lvl)) {
            seenLevels.add(lvl);
            mappings.push({
              level: lvl,
              filename,
              sourceType: 'active-flexbox',
              confidence: 'verified',
              evidence: startLevel === endLevel
                ? `Directly mapped in active flexbox UI: [[File:${filename}]] -> Level ${lvl}`
                : `Mapped from range in flexbox UI: [[File:${filename}]] -> Level ${startLevel}-${endLevel} (Applies to Level ${lvl})`
            });
          }
        }
      }
    }

    // 2. Secondary Strategy: If some levels are missing, check <gallery> tags
    const galleryMatches = [...wikitext.matchAll(/<gallery[^>]*>([\s\S]*?)<\/gallery>/gi)];
    for (const g of galleryMatches) {
      const lines = g[1].split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        const gMatch = line.match(/^(?:File:)?([^|]+)\|(?:'''|Level\s*)*(\d+)(?:\s*[-–]\s*(\d+))?/i);
        if (gMatch) {
          const filename = gMatch[1].trim();
          const startLevel = parseInt(gMatch[2], 10);
          const endLevel = gMatch[3] ? parseInt(gMatch[3], 10) : startLevel;

          if (!isNaN(startLevel) && !this.isExcludedImage(filename)) {
            for (let lvl = startLevel; lvl <= endLevel; lvl++) {
              if (!seenLevels.has(lvl)) {
                seenLevels.add(lvl);
                mappings.push({
                  level: lvl,
                  filename,
                  sourceType: 'gallery',
                  confidence: 'inferred',
                  evidence: `Mapped from <gallery> tag line: ${line}`
                });
              }
            }
          }
        }
      }
    }

    logger.info('ImageExtractor', `Discovered ${mappings.length} raw image mappings for "${buildingName}".`);
    return mappings.sort((a, b) => a.level - b.level);
  }

  /**
   * Filters out non-building images
   */
  public isExcludedImage(filename: string): boolean {
    const lower = filename.toLowerCase();

    // Check specific excluded whole-name assets or UI badges
    const exactExcluded = [
      'gold.png', 'elixir.png', 'dark_elixir.png', 'darkelixir.png', 'gem.png',
      'season_challenges_gold.png', 'res_range.png', 'attackspeed.png',
      'damagetype.png', 'target.png', 'size.png', 'level.png', 'damage.png',
      'hitpoint.png', 'stopwatch.png', 'xp.png'
    ];
    if (exactExcluded.includes(lower)) return true;

    // Prefixes / substrings denoting non-building assets
    const excludedPrefixes = ['icon_', 'logo', 'infobutton', 'trophy', 'achievement', 'concept_art'];
    if (excludedPrefixes.some(p => lower.includes(p))) return true;

    // Audio/video files
    if (/\.(ogg|mp3|wav|mp4|webm)$/i.test(lower)) return true;

    return false;
  }

  /**
   * Fetches full image metadata from MediaWiki API and builds ExtractedImage objects
   */
  public async resolveImageMetadata(
    mappings: LevelImageMapping[],
    pageUrl: string
  ): Promise<Map<number, ExtractedImage>> {
    const result = new Map<number, ExtractedImage>();
    const filenames = mappings.map(m => m.filename);

    const apiImageMap = await this.client.getImageInfoBatch(filenames);

    for (const mapping of mappings) {
      const info = apiImageMap.get(mapping.filename) || apiImageMap.get(`File:${mapping.filename}`);

      if (info && info.url) {
        result.set(mapping.level, {
          filename: mapping.filename,
          url: info.url,
          confidence: mapping.confidence,
          width: info.width,
          height: info.height,
          size: info.size,
          mime: info.mime,
          sha1: info.sha1,
          descriptionUrl: info.descriptionurl || pageUrl,
          evidence: mapping.evidence
        });
      } else {
        logger.warn('ImageExtractor', `Image metadata not found for ${mapping.filename} (Level ${mapping.level})`);
        result.set(mapping.level, {
          filename: mapping.filename,
          url: null,
          confidence: 'unverified',
          evidence: `${mapping.evidence} (Warning: URL could not be resolved from API)`
        });
      }
    }

    return result;
  }
}

export const imageExtractor = new ImageExtractor();
