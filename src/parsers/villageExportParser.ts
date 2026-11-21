import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger.js';
import { ExtractedBuilding } from '../types/building.js';
import {
  RawBuildingRecord,
  VillageRawExport,
  IdentifiedBuilding,
  ActiveUpgrade,
  VillageProfile,
  VillageSnapshot,
  BuildingFootprint,
  VillageLayout
} from '../types/village.js';

// Standard Clash of Clans building footprint sizes (in tiles)
export const BUILDING_FOOTPRINTS: Record<string, BuildingFootprint> = {
  'town-hall': { width: 4, height: 4 },
  'clan-castle': { width: 4, height: 4 },
  'eagle-artillery': { width: 4, height: 4 },
  'workshop': { width: 4, height: 4 },
  'army-camp': { width: 5, height: 5 },
  'wall': { width: 1, height: 1 },
  // 1x1 Traps
  'bomb': { width: 1, height: 1 },
  'air-bomb': { width: 1, height: 1 },
  'seeking-air-mine': { width: 1, height: 1 },
  // 2x2 Traps & Special Huts
  'spring-trap': { width: 2, height: 2 },
  'giant-bomb': { width: 2, height: 2 },
  'skeleton-trap': { width: 2, height: 2 },
  'tornado-trap': { width: 2, height: 2 },
  'giga-bomb': { width: 2, height: 2 },
  'freeze-trap': { width: 2, height: 2 },
  'shrink-trap': { width: 2, height: 2 },
  'pumpkin-bomb': { width: 2, height: 2 },
  'santa-strike': { width: 2, height: 2 },
  'builders-hut': { width: 2, height: 2 },
  'master-builders-hut': { width: 2, height: 2 },
  'crafting-station': { width: 2, height: 2 },
  'helper-hut': { width: 2, height: 2 }
};

// Default fallback footprint is 3x3 (for standard defenses, resources, production buildings)
export const DEFAULT_FOOTPRINT: BuildingFootprint = { width: 3, height: 3 };

export function getFootprintForBuilding(buildingId: string): BuildingFootprint {
  const normalized = buildingId.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return BUILDING_FOOTPRINTS[normalized] || DEFAULT_FOOTPRINT;
}

// Global Supercell CSV ID to Building Key dictionary
// Class 1000000 = Buildings, 1200000 = Traps
export const SC_GLOBAL_ID_MAP: Record<number, string> = {
  1000000: 'army-camp',
  1000001: 'town-hall',
  1000002: 'elixir-collector',
  1000003: 'elixir-storage',
  1000004: 'gold-mine',
  1000005: 'gold-storage',
  1000006: 'barracks',
  1000007: 'laboratory',
  1000008: 'cannon',
  1000009: 'archer-tower',
  1000010: 'wall',
  1000011: 'wizard-tower',
  1000012: 'air-defense',
  1000013: 'mortar',
  1000014: 'clan-castle',
  1000015: 'builder-s-hut',
  1000019: 'hidden-tesla',
  1000020: 'spell-factory',
  1000021: 'x-bow',
  1000023: 'dark-elixir-drill',
  1000024: 'dark-elixir-storage',
  1000026: 'dark-barracks',
  1000027: 'inferno-tower',
  1000028: 'air-sweeper',
  1000029: 'dark-spell-factory',
  1000031: 'eagle-artillery',
  1000032: 'bomb-tower',
  1000033: 'wall',
  1000034: 'builder-hall',
  1000035: 'elixir-collector',
  1000036: 'elixir-storage',
  1000037: 'gold-mine',
  1000038: 'gold-storage',
  1000039: 'clock-tower',
  1000040: 'builder-barracks',
  1000041: 'double-cannon',
  1000042: 'army-camp',
  1000043: 'hidden-tesla',
  1000044: 'cannon',
  1000045: 'multi-mortar',
  1000046: 'star-laboratory',
  1000047: 'b-o-t-o-s-shack',
  1000048: 'archer-tower',
  1000049: 'reinforcement-camp',
  1000050: 'firecrackers',
  1000051: 'guard-post',
  1000052: 'mega-tesla',
  1000053: 'battle-machine',
  1000054: 'air-bombs',
  1000055: 'crusher',
  1000056: 'roaster',
  1000057: 'giant-cannon',
  1000058: 'gem-mine',
  1000059: 'workshop',
  1000063: 'lava-launcher',
  1000064: 'b-o-b-s-hut',
  1000065: 'b-o-b-control',
  1000067: 'scattershot',
  1000068: 'pet-house',
  1000070: 'blacksmith',
  1000071: 'hero-hall',
  1000072: 'spell-tower',
  1000077: 'monolith',
  1000078: 'o-t-t-o-s-outpost',
  1000079: 'multi-gear-tower',
  1000080: 'battle-copter',
  1000081: 'x-bow',
  1000082: 'healing-hut',
  1000084: 'multi-archer-tower',
  1000085: 'ricochet-cannon',
  1000086: 'revenge-tower',
  1000089: 'firespitter',
  1000093: 'helper-hut',
  1000097: 'crafting-station',
  1000102: 'super-wizard-tower',
  1000105: 'guardian-shrine',
  1000106: 'squad-barracks',
  1000107: 'spiky-tower',
  1000108: 'firecracker-tower',

  // Traps (12000000 series - Supercell Official)
  12000000: 'bomb',
  12000001: 'spring-trap',
  12000002: 'giant-bomb',
  12000005: 'air-bomb',
  12000006: 'seeking-air-mine',
  12000008: 'skeleton-trap',
  12000016: 'tornado-trap',
  12000020: 'giga-bomb'
};

// Common string key aliases
export const NAME_ALIAS_MAP: Record<string, string> = {
  'townhall': 'town-hall',
  'town_hall': 'town-hall',
  'th': 'town-hall',
  'clancastle': 'clan-castle',
  'clan_castle': 'clan-castle',
  'cc': 'clan-castle',
  'cannons': 'cannon',
  'archertower': 'archer-tower',
  'archer_tower': 'archer-tower',
  'airdefense': 'air-defense',
  'air_defense': 'air-defense',
  'wizardtower': 'wizard-tower',
  'wizard_tower': 'wizard-tower',
  'airsweeper': 'air-sweeper',
  'air_sweeper': 'air-sweeper',
  'hiddentesla': 'hidden-tesla',
  'hidden_tesla': 'hidden-tesla',
  'tesla': 'hidden-tesla',
  'bombtower': 'bomb-tower',
  'bomb_tower': 'bomb-tower',
  'infernotower': 'inferno-tower',
  'inferno_tower': 'inferno-tower',
  'eagleartillery': 'eagle-artillery',
  'eagle_artillery': 'eagle-artillery',
  'spelltower': 'spell-tower',
  'spell_tower': 'spell-tower',
  'multiarchertower': 'multiarcher-tower',
  'multi_archer_tower': 'multiarcher-tower',
  'ricochetcannon': 'ricochet-cannon',
  'ricochet_cannon': 'ricochet-cannon',
  'firespitter': 'firespitter',
  'firecracker': 'firecracker-tower',
  'firecracker_tower': 'firecracker-tower',
  'goldmine': 'gold-mine',
  'gold_mine': 'gold-mine',
  'elixircollector': 'elixir-collector',
  'elixir_collector': 'elixir-collector',
  'goldstorage': 'gold-storage',
  'gold_storage': 'gold-storage',
  'elixirstorage': 'elixir-storage',
  'elixir_storage': 'elixir-storage',
  'darkelixir_drill': 'dark-elixir-drill',
  'dark_elixir_drill': 'dark-elixir-drill',
  'darkelixirstorage': 'dark-elixir-storage',
  'dark_elixir_storage': 'dark-elixir-storage',
  'armycmp': 'army-camp',
  'army_camp': 'army-camp',
  'barrack': 'barracks',
  'darkbarracks': 'dark-barracks',
  'dark_barracks': 'dark-barracks',
  'darkspellfactory': 'dark-spell-factory',
  'dark_spell_factory': 'dark-spell-factory',
  'spellfactory': 'spell-factory',
  'spell_factory': 'spell-factory',
  'pethouse': 'pet-house',
  'pet_house': 'pet-house',
  'herohall': 'hero-hall',
  'hero_hall': 'hero-hall',
  'springtrap': 'spring-trap',
  'spring_trap': 'spring-trap',
  'giantbomb': 'giant-bomb',
  'giant_bomb': 'giant-bomb',
  'airbomb': 'air-bomb',
  'air_bomb': 'air-bomb',
  'seekingairmine': 'seeking-air-mine',
  'seeking_air_mine': 'seeking-air-mine',
  'skeletontrap': 'skeleton-trap',
  'skeleton_trap': 'skeleton-trap',
  'tornadotrap': 'tornado-trap',
  'tornado_trap': 'tornado-trap',
  'buildershut': 'builders-hut',
  'builder_hut': 'builders-hut'
};

export class VillageExportParser {
  private extractedBuildings: ExtractedBuilding[] = [];
  private buildingIdToExtracted: Map<string, ExtractedBuilding> = new Map();
  private buildingIndexToExtracted: Map<number, ExtractedBuilding> = new Map();
  private thImages: Record<string, string> = {};

  constructor() {
    this.loadExtractedDatabase();
  }

  private loadExtractedDatabase(): void {
    try {
      const dbPath = path.resolve(process.cwd(), 'data', 'extracted_buildings.json');
      if (fs.existsSync(dbPath)) {
        this.extractedBuildings = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        this.extractedBuildings.forEach((b, idx) => {
          this.buildingIndexToExtracted.set(idx, b);
          const slug = b.name.toLowerCase()
            .replace(/\/home village/i, '')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
          this.buildingIdToExtracted.set(slug, b);

          const cleanName = b.name.replace(/\/Home Village/i, '').trim().toLowerCase();
          this.buildingIdToExtracted.set(cleanName, b);
        });
      }

      const thPath = path.resolve(process.cwd(), 'data', 'th_images.json');
      if (fs.existsSync(thPath)) {
        this.thImages = JSON.parse(fs.readFileSync(thPath, 'utf-8'));
      }
    } catch (err: any) {
      logger.error('VillageExportParser', 'Failed loading extracted buildings database', err);
    }
  }

  /**
   * Resolves raw `data` identifier to standard building entry
   */
  public resolveBuilding(rawId: number | string, isTrap = false): { buildingId: string; extracted?: ExtractedBuilding; name: string; category: string } {
    let resolvedId: string | null = null;

    if (typeof rawId === 'number') {
      if (SC_GLOBAL_ID_MAP[rawId]) {
        resolvedId = SC_GLOBAL_ID_MAP[rawId];
      } else if (rawId >= 1000000 && rawId < 1100000) {
        // Offset SCID
        const offset = rawId - 1000000;
        resolvedId = SC_GLOBAL_ID_MAP[1000000 + offset] || null;
      } else if (rawId >= 12000000 && rawId < 13000000) {
        // Offset Trap
        const offset = rawId - 12000000;
        resolvedId = SC_GLOBAL_ID_MAP[12000000 + offset] || null;
      } else if (this.buildingIndexToExtracted.has(rawId)) {
        const b = this.buildingIndexToExtracted.get(rawId)!;
        const slug = b.name.toLowerCase().replace(/\/home village/i, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        return {
          buildingId: slug,
          extracted: b,
          name: b.name.replace(/\/Home Village/i, ''),
          category: b.category
        };
      }
    } else {
      const clean = String(rawId).trim().toLowerCase();
      resolvedId = NAME_ALIAS_MAP[clean] || clean;
    }

    if (resolvedId === 'town-hall' || String(rawId).toLowerCase().includes('town-hall') || String(rawId).toLowerCase().includes('townhall')) {
      return {
        buildingId: 'town-hall',
        name: 'Town Hall',
        category: 'Defense'
      };
    }

    if (resolvedId && this.buildingIdToExtracted.has(resolvedId)) {
      const b = this.buildingIdToExtracted.get(resolvedId)!;
      return {
        buildingId: resolvedId,
        extracted: b,
        name: b.name.replace(/\/Home Village/i, ''),
        category: b.category
      };
    }

    // Fallback: search by partial name match
    const searchKey = String(resolvedId || rawId).toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const b of this.extractedBuildings) {
      const bClean = b.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (bClean.includes(searchKey) || searchKey.includes(bClean)) {
        const slug = b.name.toLowerCase().replace(/\/home village/i, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        return {
          buildingId: slug,
          extracted: b,
          name: b.name.replace(/\/Home Village/i, ''),
          category: b.category
        };
      }
    }

    const specialNames: Record<string, string> = {
      'b-o-b-s-hut': "B.O.B's Hut",
      'builder-s-hut': "Builder's Hut",
      'helper-hut': "Helper Hut",
      'crafting-station': "Crafting Station",
      'dark-elixir-drill': "Dark Elixir Drill",
      'dark-elixir-storage': "Dark Elixir Storage",
      'dark-barracks': "Dark Barracks",
      'dark-spell-factory': "Dark Spell Factory",
      'multi-archer-tower': "Multi-Archer Tower",
      'ricochet-cannon': "Ricochet Cannon",
      'multi-gear-tower': "Multi-Gear Tower",
      'revenge-tower': "Revenge Tower",
      'squad-barracks': "Squad Barracks",
      'hero-hall': "Hero Hall",
      'pet-house': "Pet House",
      'spell-tower': "Spell Tower",
      'seeking-air-mine': "Seeking Air Mine",
      'air-sweeper': "Air Sweeper",
      'hidden-tesla': "Hidden Tesla",
      'bomb-tower': "Bomb Tower",
      'wizard-tower': "Wizard Tower",
      'air-defense': "Air Defense",
      'clan-castle': "Clan Castle",
      'army-camp': "Army Camp",
      'elixir-collector': "Elixir Collector",
      'elixir-storage': "Elixir Storage",
      'gold-mine': "Gold Mine",
      'gold-storage': "Gold Storage",
      'spring-trap': "Spring Trap",
      'giant-bomb': "Giant Bomb",
      'air-bomb': "Air Bomb",
      'skeleton-trap': "Skeleton Trap",
      'tornado-trap': "Tornado Trap",
      'giga-bomb': "Giga Bomb",
      'bomb': "Bomb"
    };

    const fallbackCategory = isTrap ? 'Trap' : 'Defense';
    let fallbackName = `Structure #${rawId}`;
    if (resolvedId) {
      fallbackName = specialNames[resolvedId] || resolvedId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    return {
      buildingId: String(resolvedId || rawId),
      name: fallbackName,
      category: fallbackCategory
    };
  }

  /**
   * Validates raw JSON string or object and generates preview without mutating saved village
   */
  public validateExport(jsonContent: string | object): {
    isValid: boolean;
    error?: string;
    preview?: {
      tag: string;
      townHallLevel: number;
      totalBuildings: number;
      totalTraps: number;
      totalHeroes: number;
      totalPets: number;
      activeUpgradesCount: number;
      activeUpgrades: ActiveUpgrade[];
      unresolvedCount: number;
      unresolved: RawBuildingRecord[];
    };
  } {
    let parsed: VillageRawExport;
    if (typeof jsonContent === 'string') {
      try {
        parsed = JSON.parse(jsonContent);
      } catch (err: any) {
        return { isValid: false, error: `Invalid JSON format: ${err.message}` };
      }
    } else {
      parsed = jsonContent as VillageRawExport;
    }

    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, error: 'Parsed content must be a JSON object.' };
    }

    if (!parsed.buildings && !parsed.buildings2 && !parsed.tag) {
      return { isValid: false, error: 'Export does not contain standard Clash of Clans export fields ("buildings" or "tag").' };
    }

    const rawBuildings = parsed.buildings || [];
    const rawTraps = parsed.traps || [];
    const rawHeroes = parsed.heroes || [];
    const rawPets = parsed.pets || [];

    // Detect 0-indexed vs 1-indexed level notation
    // b.lvl is 1-indexed in Clash of Clans export; do not offset
    const hasZeroLevel = false;

    let detectedTH = 1;
    const unresolved: RawBuildingRecord[] = [];
    const activeUpgrades: ActiveUpgrade[] = [];
    let totalBuildingCount = 0;

    for (const b of rawBuildings) {
      const resolved = this.resolveBuilding(b.data, false);
      const lvl = b.lvl !== undefined ? b.lvl : 1;
      const count = b.cnt !== undefined ? b.cnt : 1;
      if (resolved.buildingId !== 'wall') {
        totalBuildingCount += count;
      }

      if (resolved.buildingId === 'town-hall' || resolved.name.toLowerCase().includes('town hall')) {
        detectedTH = Math.max(detectedTH, lvl);
      }

      if (!resolved.extracted && resolved.buildingId !== 'town-hall') {
        unresolved.push(b);
      }

      if (b.timer && b.timer > 0) {
        const nextImg = resolved.extracted?.levels.find(l => l.level === lvl + 1)?.image || resolved.extracted?.levels.find(l => l.level === lvl)?.image;
        activeUpgrades.push({
          id: `${resolved.buildingId}-${lvl}`,
          name: resolved.name,
          currentLevel: lvl,
          targetLevel: lvl + 1,
          timerSeconds: b.timer,
          endTimestamp: Date.now() + (b.timer * 1000),
          builderType: 'Master Builder',
          image: nextImg && nextImg.filename && nextImg.url ? { filename: nextImg.filename, url: nextImg.url } : undefined
        });
      }
    }

    return {
      isValid: true,
      preview: {
        tag: parsed.tag || '#UNKNOWN',
        townHallLevel: detectedTH,
        totalBuildings: totalBuildingCount,
        totalTraps: rawTraps.reduce((acc, t) => acc + (t.cnt !== undefined ? t.cnt : 1), 0),
        totalHeroes: rawHeroes.length,
        totalPets: rawPets.length,
        activeUpgradesCount: activeUpgrades.length,
        activeUpgrades,
        unresolvedCount: unresolved.length,
        unresolved
      }
    };
  }

  /**
   * Fully parses export and constructs normalized VillageProfile
   */
  public parseVillage(raw: VillageRawExport): VillageProfile {
    const rawBuildings = raw.buildings || [];
    const rawTraps = raw.traps || [];
    const rawHeroes = raw.heroes || [];
    const rawPets = raw.pets || [];
    const rawEquipment = raw.equipment || [];
    const rawTroops = raw.units || [];
    const rawSpells = raw.spells || [];

    // Detect 0-indexing
    // b.lvl is 1-indexed in Clash of Clans export; do not offset
    const hasZeroLevel = false;

    const identifiedBuildings: IdentifiedBuilding[] = [];
    const identifiedTraps: IdentifiedBuilding[] = [];
    const activeUpgrades: ActiveUpgrade[] = [];
    const unresolved: RawBuildingRecord[] = [];

    let detectedTH = 1;
    let totalWalls = 0;

    // Process Home Village Buildings
    for (const b of rawBuildings) {
      const resolved = this.resolveBuilding(b.data, false);
      const lvl = b.lvl !== undefined ? b.lvl : 1;
      const count = b.cnt !== undefined ? b.cnt : 1;

      if (resolved.buildingId === 'town-hall' || resolved.name.toLowerCase().includes('town hall')) {
        detectedTH = Math.max(detectedTH, lvl);
      }
      if (resolved.buildingId === 'wall' || resolved.name.toLowerCase().includes('wall')) {
        totalWalls += count;
      }

      if (!resolved.extracted && resolved.buildingId !== 'town-hall') {
        unresolved.push(b);
      }

      let imgLevel = resolved.extracted?.levels.find(l => l.level === lvl)?.image;
      if (resolved.buildingId === 'town-hall') {
        const thUrl = this.thImages[String(lvl)] || this.thImages['18'];
        if (thUrl) {
          imgLevel = {
            filename: `Town_Hall${lvl}.png`,
            url: thUrl,
            confidence: 'verified' as any
          };
        }
      }
      const footprint = getFootprintForBuilding(resolved.buildingId);

      identifiedBuildings.push({
        instanceId: `bldg_${resolved.buildingId}_${lvl}_${Math.random().toString(36).substring(2, 7)}`,
        buildingId: resolved.buildingId,
        name: resolved.name,
        category: (resolved.category as any) || 'Defense',
        level: lvl,
        quantity: count,
        timer: b.timer,
        upgradeEndTimestamp: b.timer ? Date.now() + (b.timer * 1000) : undefined,
        x: b.x,
        y: b.y,
        footprint,
        image: (imgLevel && imgLevel.filename && imgLevel.url) ? {
          filename: imgLevel.filename,
          url: imgLevel.url,
          confidence: imgLevel.confidence
        } : undefined,
        raw: b
      });

      if (b.timer && b.timer > 0) {
        const nextImg = resolved.extracted?.levels.find(l => l.level === lvl + 1)?.image || imgLevel;
        activeUpgrades.push({
          id: `${resolved.buildingId}-${lvl}`,
          name: resolved.name,
          currentLevel: lvl,
          targetLevel: lvl + 1,
          timerSeconds: b.timer,
          endTimestamp: Date.now() + (b.timer * 1000),
          builderType: 'Master Builder',
          image: (nextImg && nextImg.filename && nextImg.url) ? { filename: nextImg.filename, url: nextImg.url } : undefined
        });
      }
    }

    // Process Home Village Traps
    for (const t of rawTraps) {
      const resolved = this.resolveBuilding(t.data, true);
      const lvl = t.lvl !== undefined ? t.lvl : 1;
      const count = t.cnt !== undefined ? t.cnt : 1;

      if (!resolved.extracted) {
        unresolved.push(t);
      }

      const imgLevel = resolved.extracted?.levels.find(l => l.level === lvl)?.image;
      const footprint = getFootprintForBuilding(resolved.buildingId);

      identifiedTraps.push({
        instanceId: `trap_${resolved.buildingId}_${lvl}_${Math.random().toString(36).substring(2, 7)}`,
        buildingId: resolved.buildingId,
        name: resolved.name,
        category: 'Trap',
        level: lvl,
        quantity: count,
        timer: t.timer,
        upgradeEndTimestamp: t.timer ? Date.now() + (t.timer * 1000) : undefined,
        x: t.x,
        y: t.y,
        footprint,
        image: (imgLevel && imgLevel.filename && imgLevel.url) ? {
          filename: imgLevel.filename,
          url: imgLevel.url,
          confidence: imgLevel.confidence
        } : undefined,
        raw: t
      });

      if (t.timer && t.timer > 0) {
        const nextImg = resolved.extracted?.levels.find(l => l.level === lvl + 1)?.image || imgLevel;
        activeUpgrades.push({
          id: `${resolved.buildingId}-${lvl}`,
          name: resolved.name,
          currentLevel: lvl,
          targetLevel: lvl + 1,
          timerSeconds: t.timer,
          endTimestamp: Date.now() + (t.timer * 1000),
          builderType: 'Builder',
          image: (nextImg && nextImg.filename && nextImg.url) ? { filename: nextImg.filename, url: nextImg.url } : undefined
        });
      }
    }

    // Separate Builder Base
    const builderBase = (raw.buildings2 || raw.traps2 || raw.heroes2 || raw.units2) ? {
      buildings2: raw.buildings2,
      traps2: raw.traps2,
      heroes2: raw.heroes2,
      units2: raw.units2
    } : undefined;

    return {
      tag: raw.tag || '#UNKNOWN',
      playerName: raw.tag ? `Chief ${raw.tag}` : 'Chief ClashMaster',
      townHallLevel: detectedTH,
      importedAt: new Date().toISOString(),
      timestamp: raw.timestamp || Date.now(),
      totalBuildings: identifiedBuildings.filter(b => b.buildingId !== 'wall').reduce((acc, b) => acc + b.quantity, 0),
      totalTraps: identifiedTraps.reduce((acc, t) => acc + t.quantity, 0),
      totalHeroes: rawHeroes.length,
      totalWalls,
      buildings: identifiedBuildings,
      traps: identifiedTraps,
      heroes: rawHeroes,
      pets: rawPets,
      equipment: rawEquipment,
      troops: rawTroops,
      spells: rawSpells,
      activeUpgrades,
      unresolvedRecords: unresolved,
      builderBase,
      rawExport: raw
    };
  }
}

export const villageExportParser = new VillageExportParser();
