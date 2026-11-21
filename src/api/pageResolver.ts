import { MediaWikiClient, mediaWikiClient } from './mediawiki.js';
import { logger } from '../utils/logger.js';

export interface ResolvedBuildingPage {
  originalQuery: string;
  resolvedTitle: string;
  pageUrl: string;
  pageId: number;
  revisionId: number;
  lastUpdated: string;
  isDisambiguation: boolean;
  village: string;
  category: string;
}

export class PageResolver {
  private client: MediaWikiClient;

  constructor(client: MediaWikiClient = mediaWikiClient) {
    this.client = client;
  }

  public async resolveBuildingPage(
    buildingQuery: string,
    targetVillage: string = 'Home Village'
  ): Promise<ResolvedBuildingPage> {
    logger.info('PageResolver', `Resolving page for query: "${buildingQuery}" (Target village: ${targetVillage})`);

    // 1. Initial query on the base name
    const initialPage = await this.client.getPageInfo(buildingQuery);
    if (!initialPage) {
      throw new Error(`Failed to find page for building query "${buildingQuery}" on Fandom Wiki.`);
    }

    let activeTitle = initialPage.title;
    let isDisambiguation = false;

    // 2. Inspect wikitext of initial page
    const parsed = await this.client.parsePage(activeTitle, ['wikitext', 'categories']);
    const wikitext = parsed?.wikitext?.['*'] || '';
    const categories = parsed?.categories?.map(c => c['*']) || [];

    const isDisambigCategory = categories.some(c => c.toLowerCase().includes('disambiguation'));
    const hasTabber = wikitext.includes('<tabber>') || wikitext.includes('{{:');

    if (isDisambigCategory || hasTabber) {
      logger.info('PageResolver', `Page "${activeTitle}" is a disambiguation / tabber page.`);
      isDisambiguation = true;

      // Look for subpage corresponding to targetVillage
      // e.g. Home Village={{:Cannon/Home Village}} or [[Cannon/Home Village]]
      const subpagePattern = new RegExp(`(?:${targetVillage}\\s*=\\s*\\{\\{:([^\\}]+)\\}\\}|\\[\\[([^\\]\\|]+)\\]\\])`, 'gi');
      let candidateTitle: string | null = null;

      let match;
      while ((match = subpagePattern.exec(wikitext)) !== null) {
        const potential = (match[1] || match[2]).trim();
        if (potential.toLowerCase().includes(targetVillage.toLowerCase())) {
          candidateTitle = potential;
          break;
        }
      }

      // If pattern didn't match directly, construct the standard subpage pattern: `${buildingQuery}/${targetVillage}`
      if (!candidateTitle) {
        candidateTitle = `${buildingQuery}/${targetVillage}`;
      }

      logger.info('PageResolver', `Checking subpage candidate: "${candidateTitle}"`);
      const subpageInfo = await this.client.getPageInfo(candidateTitle);
      if (subpageInfo && !subpageInfo.missing) {
        activeTitle = subpageInfo.title;
      } else {
        logger.warn('PageResolver', `Subpage "${candidateTitle}" was not found. Falling back to "${activeTitle}".`);
      }
    }

    // 3. Retrieve final page metadata
    const finalInfo = await this.client.getPageInfo(activeTitle);
    if (!finalInfo) {
      throw new Error(`Unable to fetch final metadata for resolved page "${activeTitle}".`);
    }

    const lastRevision = finalInfo.revisions?.[0];
    const encodedTitle = encodeURIComponent(finalInfo.title.replace(/ /g, '_'));
    const pageUrl = `https://clashofclans.fandom.com/wiki/${encodedTitle}`;

    // Infer category
    let category = 'Defense';
    if (categories.some(c => c.toLowerCase().includes('resource'))) {
      category = 'Resource';
    } else if (categories.some(c => c.toLowerCase().includes('army'))) {
      category = 'Army';
    } else if (categories.some(c => c.toLowerCase().includes('trap'))) {
      category = 'Trap';
    }

    const result: ResolvedBuildingPage = {
      originalQuery: buildingQuery,
      resolvedTitle: finalInfo.title,
      pageUrl,
      pageId: finalInfo.pageid,
      revisionId: lastRevision?.revid ?? 0,
      lastUpdated: lastRevision?.timestamp ?? new Date().toISOString(),
      isDisambiguation,
      village: targetVillage,
      category
    };

    logger.info('PageResolver', `Successfully resolved "${buildingQuery}" -> "${result.resolvedTitle}" (Rev ${result.revisionId})`);
    return result;
  }
}

export const pageResolver = new PageResolver();
