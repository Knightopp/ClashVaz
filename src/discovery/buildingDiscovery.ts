import { PageResolver, pageResolver, ResolvedBuildingPage } from '../api/pageResolver.js';
import { mediaWikiClient } from '../api/mediawiki.js';
import { logger } from '../utils/logger.js';

export interface BuildingDiscoveryTarget {
  name: string;
  category: 'Defense' | 'Army' | 'Resource' | 'Trap' | 'Other';
  resolvedSubpage?: string;
  expectedVillage?: string;
}

export class BuildingDiscovery {
  private resolver: PageResolver;

  constructor(resolver: PageResolver = pageResolver) {
    this.resolver = resolver;
  }

  /**
   * Recursively and dynamically discovers all Home Village buildings from Wiki hub pages and categories.
   */
  public async discoverAllHomeVillageBuildings(): Promise<ResolvedBuildingPage[]> {
    logger.info('BuildingDiscovery', 'Starting dynamic discovery of all Home Village building pages...');

    const discoveredTargets = new Map<string, BuildingDiscoveryTarget>();

    // 1. Discover from Home Village Hub Pages
    const hubPages = [
      { title: 'Defensive Buildings/Home Village', category: 'Defense' as const },
      { title: 'Army Buildings/Home Village', category: 'Army' as const },
      { title: 'Resource Buildings/Home Village', category: 'Resource' as const },
      { title: 'Traps/Home Village', category: 'Trap' as const }
    ];

    for (const hub of hubPages) {
      try {
        const parsed = await mediaWikiClient.parsePage(hub.title, ['wikitext']);
        const wt = parsed?.wikitext?.['*'] || '';

        // Match links in flexbox-display hovernav: link=TARGET]]...<div>NAME
        const matches = [...wt.matchAll(/link=([^\|\]]+)\]\](?:<[^>]+>)*<div>(?:\{\{H\|)?\[?\[?([^\]\}<\n]+)/gi)];

        for (const m of matches) {
          const rawLink = m[1].trim();
          let rawName = m[2].trim().replace(/^\[\[/, '').replace(/\]\]$/, '').split('|')[0].trim();
          rawName = rawName.replace(/\{\{[^\}]+\}\}/g, '').trim();

          // Filter out navigation hubs and non-buildings
          if (
            rawLink.startsWith('Traps') ||
            rawLink.startsWith('Defensive Buildings') ||
            rawLink.startsWith('Army Buildings') ||
            rawLink.startsWith('Resource Buildings') ||
            rawName.toLowerCase() === 'traps' ||
            rawName.toLowerCase().includes('hero banner') ||
            rawLink.startsWith('Town Hall/') ||
            rawLink.includes('Builder Base') ||
            rawLink.includes('Clan Capital')
          ) {
            continue;
          }

          if (!discoveredTargets.has(rawName)) {
            discoveredTargets.set(rawName, {
              name: rawName,
              category: hub.category,
              resolvedSubpage: rawLink
            });
          }
        }
      } catch (err: any) {
        logger.warn('BuildingDiscovery', `Failed reading hub page ${hub.title}: ${err.message}`);
      }
    }

    // Ensure Wall is included
    if (!discoveredTargets.has('Wall')) {
      discoveredTargets.set('Wall', { name: 'Wall', category: 'Defense', resolvedSubpage: 'Wall/Home Village' });
    }

    logger.info('BuildingDiscovery', `Discovered ${discoveredTargets.size} candidate Home Village buildings. Resolving pages...`);

    const resolvedPages: ResolvedBuildingPage[] = [];

    for (const target of discoveredTargets.values()) {
      try {
        const pageToQuery = target.resolvedSubpage || target.name;
        const resolved = await this.resolver.resolveBuildingPage(pageToQuery, 'Home Village');

        // Retain category classified from hub
        if (target.category) {
          resolved.category = target.category;
        }

        // Avoid duplicates by resolved page URL or title
        if (!resolvedPages.some(p => p.resolvedTitle === resolved.resolvedTitle)) {
          resolvedPages.push(resolved);
        }
      } catch (err: any) {
        logger.warn('BuildingDiscovery', `Could not resolve building "${target.name}": ${err.message}`);
      }
    }

    logger.info('BuildingDiscovery', `Successfully resolved ${resolvedPages.length} Home Village building pages.`);
    return resolvedPages;
  }

  /**
   * Discovers specific targets (e.g. prototype 5 or custom list)
   */
  public async discoverTargets(
    targets: BuildingDiscoveryTarget[]
  ): Promise<ResolvedBuildingPage[]> {
    const resolvedPages: ResolvedBuildingPage[] = [];
    for (const target of targets) {
      try {
        const resolved = await this.resolver.resolveBuildingPage(
          target.resolvedSubpage || target.name,
          target.expectedVillage ?? 'Home Village'
        );
        if (target.category) resolved.category = target.category;
        resolvedPages.push(resolved);
      } catch (err: any) {
        logger.error('BuildingDiscovery', `Failed resolving target: ${target.name}`, err);
      }
    }
    return resolvedPages;
  }
}

export const buildingDiscovery = new BuildingDiscovery();
