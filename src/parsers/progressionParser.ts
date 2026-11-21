import fs from 'fs';
import path from 'path';
import { townHallTableExtractor, ExtractedTownHallData } from '../extraction/extractTownHallTables.js';
import { ExtractedBuilding } from '../types/building.js';
import {
  TownHallProgression,
  ProgressionBuildingEntry,
  ProgressionImageInfo,
  TownHallSummary,
  BuildingCategory,
  TownHallComparison,
  BuildingProgressionHistory
} from '../types/progression.js';
import { logger } from '../utils/logger.js';

export class ProgressionParser {
  private extractedBuildings: ExtractedBuilding[] = [];
  private buildingMap: Map<string, ExtractedBuilding> = new Map();

  constructor() {
    this.loadExtractedBuildings();
  }

  public loadExtractedBuildings(): void {
    const filePath = path.resolve(process.cwd(), 'data', 'extracted_buildings.json');
    if (fs.existsSync(filePath)) {
      try {
        this.extractedBuildings = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        this.buildingMap.clear();

        for (const b of this.extractedBuildings) {
          // Normalize names for fuzzy lookup
          const cleanName = b.name.replace('/Home Village', '').trim().toLowerCase();
          const slug = this.slugify(cleanName);
          this.buildingMap.set(cleanName, b);
          this.buildingMap.set(slug, b);
          this.buildingMap.set(b.name.toLowerCase(), b);
        }
        logger.info('ProgressionParser', `Loaded ${this.extractedBuildings.length} buildings from extracted database.`);
      } catch (err: any) {
        logger.error('ProgressionParser', 'Failed loading extracted_buildings.json', err);
      }
    }
  }

  public slugify(name: string): string {
    return name
      .toLowerCase()
      .replace('/home village', '')
      .replace(/['\.\-]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private findMatchingBuilding(rawName: string): ExtractedBuilding | null {
    const cleanName = rawName.replace('/Home Village', '').trim().toLowerCase();
    const slug = this.slugify(cleanName);

    if (this.buildingMap.has(cleanName)) return this.buildingMap.get(cleanName)!;
    if (this.buildingMap.has(slug)) return this.buildingMap.get(slug)!;

    // Fuzzy fallbacks
    for (const [key, b] of this.buildingMap.entries()) {
      if (key.includes(cleanName) || cleanName.includes(key)) {
        return b;
      }
    }

    return null;
  }

  private inferCategory(buildingName: string, matchedBuilding?: ExtractedBuilding | null): BuildingCategory {
    if (matchedBuilding) {
      if (matchedBuilding.category === 'Defense') return 'Defense';
      if (matchedBuilding.category === 'Resource') return 'Resource';
      if (matchedBuilding.category === 'Army') return 'Army';
      if (matchedBuilding.category === 'Trap') return 'Trap';
    }

    const lower = buildingName.toLowerCase();
    if (/wall/i.test(lower)) return 'Defense';
    if (/bomb|trap|mine/i.test(lower)) return 'Trap';
    if (/mine|collector|storage|drill|castle/i.test(lower)) return 'Resource';
    if (/camp|barracks|lab|factory|hall|smith|workshop|pet/i.test(lower)) return 'Army';
    if (/cannon|tower|mortar|defense|sweeper|tesla|x-bow|bow|artillery|scatter|hut|monolith/i.test(lower)) return 'Defense';
    if (/town hall/i.test(lower)) return 'Other';

    return 'Defense';
  }

  /**
   * Builds the complete Town Hall progression database across all discovered Town Halls
   */
  public async buildProgressionDatabase(): Promise<{
    progressions: TownHallProgression[];
    maxTownHall: number;
    rawExtraction: ExtractedTownHallData;
  }> {
    this.loadExtractedBuildings();
    const rawData = await townHallTableExtractor.extractAllTownHallTables();
    const maxTH = rawData.maxDiscoveredTH;

    const progressions: TownHallProgression[] = [];
    // Track previous quantities and levels across THs to detect unlocks
    const previousQuantities = new Map<string, number>();
    const previousMaxLevels = new Map<string, number>();

    for (let th = 1; th <= maxTH; th++) {
      const thBuildingsMap = rawData.matrix.get(th) || new Map();
      const wallData = rawData.wallsByTH.get(th) || { quantity: 0, maxLevel: 0 };

      const buildingEntries: ProgressionBuildingEntry[] = [];
      const seenBuildingIds = new Set<string>();

      // 1. Process all standard buildings from Town Hall tables
      for (const [rawName, cell] of thBuildingsMap.entries()) {
        const matched = this.findMatchingBuilding(rawName);
        const cleanDisplayName = matched ? matched.name.replace('/Home Village', '') : rawName;
        const bId = this.slugify(cleanDisplayName);

        if (seenBuildingIds.has(bId)) continue;
        seenBuildingIds.add(bId);

        let quantity = cell.quantity;
        let maxLevel = cell.maxLevel;

        // Cross-validation with building's extracted levels
        let crossValidationStatus: 'verified' | 'inferred' = 'verified';
        let crossValEvidence = `Corroborated by Town Hall master table`;

        if (matched) {
          // Find highest level available at this TH from building's own levels
          const levelsAtTH = matched.levels.filter(l => l.townHallRequired !== null && l.townHallRequired <= th);
          if (levelsAtTH.length > 0) {
            const calculatedMaxLvl = levelsAtTH[levelsAtTH.length - 1].level;
            if (calculatedMaxLvl > maxLevel) {
              maxLevel = calculatedMaxLvl;
              crossValidationStatus = 'verified';
              crossValEvidence = `Updated from verified building upgrade table: Level ${calculatedMaxLvl} is available at TH${levelsAtTH[levelsAtTH.length - 1].townHallRequired}`;
            } else if (maxLevel === 0 && quantity > 0) {
              maxLevel = calculatedMaxLvl;
              crossValidationStatus = 'inferred';
              crossValEvidence = `Inferred from building upgrade table (Level ${calculatedMaxLvl} requires TH${levelsAtTH[levelsAtTH.length - 1].townHallRequired})`;
            } else if (maxLevel !== calculatedMaxLvl && maxLevel > 0) {
              crossValEvidence = `Town Hall table states Level ${maxLevel}; Building upgrade table indicates Level ${calculatedMaxLvl}`;
            }
          }
        }

        // Only include if player can have at least 1 copy or if it has reached a level
        if (quantity === 0 && maxLevel === 0) continue;

        const prevQty = previousQuantities.get(bId) || 0;
        const prevLvl = previousMaxLevels.get(bId) || 0;

        const isNewlyUnlocked = prevQty === 0 && quantity > 0;
        const isNewUpgradeLevel = maxLevel > prevLvl;

        // Image lookup: find level image for maxLevel
        let imageInfo = {
          filename: null as string | null,
          url: null as string | null,
          confidence: 'missing' as 'verified' | 'inferred' | 'unverified' | 'missing'
        };

        if (matched && maxLevel > 0) {
          const lvlObj = matched.levels.find(l => l.level === maxLevel);
          if (lvlObj && lvlObj.image.url) {
            imageInfo = {
              filename: lvlObj.image.filename,
              url: lvlObj.image.url,
              confidence: lvlObj.image.confidence
            };
          } else {
            // Fallback to highest level <= maxLevel that has a verified/inferred image
            const validLevels = matched.levels.filter(l => l.image && l.image.url);
            const nearest = validLevels.filter(l => l.level <= maxLevel).pop() || validLevels[validLevels.length - 1];
            if (nearest && nearest.image.url) {
              imageInfo = {
                filename: nearest.image.filename,
                url: nearest.image.url,
                confidence: 'inferred'
              };
            }
          }
        }

        // Check verified special structures map if image was not resolved
        if (!imageInfo.url) {
          const SPECIAL_BUILDING_ASSETS: Record<string, { filename: string; url: string; confidence: 'verified' | 'inferred' }> = {
            'helper-hut': {
              filename: 'Helper_Hut.png',
              url: 'https://static.wikia.nocookie.net/clashofclans/images/9/93/Helper_Hut.png/revision/latest?cb=20241123131422',
              confidence: 'verified'
            },
            'crafting-station': {
              filename: 'Crafting_Station.png',
              url: 'https://static.wikia.nocookie.net/clashofclans/images/c/c6/Crafting_Station.png/revision/latest?cb=20250624113727',
              confidence: 'verified'
            },
            'giga-tesla': {
              filename: 'Giga_Tesla1.png',
              url: 'https://static.wikia.nocookie.net/clashofclans/images/9/94/Giga_Tesla1.png/revision/latest?cb=20180606163756',
              confidence: 'verified'
            },
            'giga-inferno': {
              filename: 'Giga_Inferno1.png',
              url: 'https://static.wikia.nocookie.net/clashofclans/images/0/0e/Giga_Inferno1.png/revision/latest?cb=20200831024428',
              confidence: 'verified'
            },
            'inferno-artillery': {
              filename: 'Inferno_Artillery5.png',
              url: 'https://static.wikia.nocookie.net/clashofclans/images/9/9a/Inferno_Artillery5.png/revision/latest?cb=20241123024000',
              confidence: 'verified'
            }
          };

          const fallback = SPECIAL_BUILDING_ASSETS[bId];
          if (fallback) {
            imageInfo = { ...fallback };
          }
        }

        const category = this.inferCategory(cleanDisplayName, matched);

        const sourceRefs: string[] = [
          ...rawData.sourcePages,
          matched?.wiki.url || `https://clashofclans.fandom.com/wiki/${encodeURIComponent(cleanDisplayName)}`
        ];

        buildingEntries.push({
          buildingId: bId,
          name: cleanDisplayName,
          category,
          quantity,
          maxAvailableLevel: maxLevel,
          isNewlyUnlocked,
          isNewUpgradeLevel,
          previousQuantity: prevQty,
          previousMaxLevel: prevLvl,
          image: imageInfo,
          sourceReferences: sourceRefs
        });

        previousQuantities.set(bId, quantity);
        previousMaxLevels.set(bId, maxLevel);
      }

      // 2. Add Special Building: Walls
      if (wallData.quantity > 0 || wallData.maxLevel > 0) {
        const wallMatched = this.findMatchingBuilding('Wall');
        const prevWallQty = previousQuantities.get('wall') || 0;
        const prevWallLvl = previousMaxLevels.get('wall') || 0;

        let wallImg: ProgressionImageInfo = {
          filename: `Wall${wallData.maxLevel}.png`,
          url: null,
          confidence: 'verified'
        };

        if (wallMatched && wallData.maxLevel > 0) {
          const wLvl = wallMatched.levels.find(l => l.level === wallData.maxLevel);
          if (wLvl && wLvl.image.url) {
            wallImg = {
              filename: wLvl.image.filename,
              url: wLvl.image.url,
              confidence: wLvl.image.confidence
            };
          }
        }

        buildingEntries.push({
          buildingId: 'wall',
          name: 'Wall',
          category: 'Defense',
          quantity: wallData.quantity,
          maxAvailableLevel: wallData.maxLevel,
          isNewlyUnlocked: prevWallQty === 0 && wallData.quantity > 0,
          isNewUpgradeLevel: wallData.maxLevel > prevWallLvl,
          previousQuantity: prevWallQty,
          previousMaxLevel: prevWallLvl,
          image: wallImg,
          sourceReferences: [
            'https://clashofclans.fandom.com/wiki/Town_Hall#Defensive_Buildings_and_Traps',
            'https://clashofclans.fandom.com/wiki/Wall/Home_Village'
          ]
        });

        previousQuantities.set('wall', wallData.quantity);
        previousMaxLevels.set('wall', wallData.maxLevel);
      }

      // 3. Add Special Building: Town Hall itself
      const prevTHQty = th === 1 ? 0 : 1;
      const prevTHLvl = th - 1;
      buildingEntries.push({
        buildingId: 'town-hall',
        name: 'Town Hall',
        category: 'Other',
        quantity: 1,
        maxAvailableLevel: th,
        isNewlyUnlocked: th === 1,
        isNewUpgradeLevel: true,
        previousQuantity: prevTHQty,
        previousMaxLevel: prevTHLvl,
        image: {
          filename: `Town_Hall${th}.png`,
          url: `https://static.wikia.nocookie.net/clashofclans/images/thumb/Town_Hall${th}.png/200px-Town_Hall${th}.png`,
          confidence: 'inferred'
        },
        sourceReferences: ['https://clashofclans.fandom.com/wiki/Town_Hall']
      });

      // 4. Calculate Derived Statistics
      let totalInstances = 0;
      let totalDefenses = 0;
      let totalResources = 0;
      let totalArmy = 0;
      let totalTraps = 0;
      let newUnlockCount = 0;
      let newUpgradeCount = 0;

      for (const entry of buildingEntries) {
        if (entry.buildingId !== 'wall') {
          totalInstances += entry.quantity;
        }

        if (entry.category === 'Defense' && entry.buildingId !== 'wall') {
          totalDefenses += entry.quantity;
        } else if (entry.category === 'Resource') {
          totalResources += entry.quantity;
        } else if (entry.category === 'Army') {
          totalArmy += entry.quantity;
        } else if (entry.category === 'Trap') {
          totalTraps += entry.quantity;
        }

        if (entry.isNewlyUnlocked) newUnlockCount++;
        if (entry.isNewUpgradeLevel) newUpgradeCount++;
      }

      const summary: TownHallSummary = {
        totalBuildingInstances: totalInstances,
        totalBuildingTypes: buildingEntries.length,
        totalDefenses,
        totalResources,
        totalArmy,
        totalTraps,
        totalWalls: wallData.quantity,
        wallMaxLevel: wallData.maxLevel,
        newlyUnlockedTypes: newUnlockCount,
        newUpgradeUnlocks: newUpgradeCount
      };

      const progression: TownHallProgression = {
        townHall: th,
        name: `Town Hall ${th}`,
        wikiUrl: `https://clashofclans.fandom.com/wiki/Town_Hall#TH${th}`,
        buildings: buildingEntries.sort((a, b) => {
          const catOrder: Record<string, number> = { Defense: 1, Resource: 2, Army: 3, Trap: 4, Other: 5 };
          const cDiff = (catOrder[a.category] || 99) - (catOrder[b.category] || 99);
          if (cDiff !== 0) return cDiff;
          return a.name.localeCompare(b.name);
        }),
        summary,
        walls: {
          quantity: wallData.quantity,
          maxLevel: wallData.maxLevel
        },
        validation: {
          status: 'verified',
          notes: [
            `Total building types: ${buildingEntries.length}`,
            `Total building instances: ${totalInstances} (plus ${wallData.quantity} walls)`,
            `Newly unlocked: ${newUnlockCount} types, Upgrade unlocks: ${newUpgradeCount}`
          ]
        }
      };

      progressions.push(progression);
    }

    logger.info('ProgressionParser', `Built full progression database for ${progressions.length} Town Halls.`);

    return {
      progressions,
      maxTownHall: maxTH,
      rawExtraction: rawData
    };
  }

  /**
   * Compares two Town Hall levels and returns detailed deltas
   */
  public compareTownHalls(fromProg: TownHallProgression, toProg: TownHallProgression): TownHallComparison {
    const fromMap = new Map<string, ProgressionBuildingEntry>();
    for (const b of fromProg.buildings) fromMap.set(b.buildingId, b);

    const toMap = new Map<string, ProgressionBuildingEntry>();
    for (const b of toProg.buildings) toMap.set(b.buildingId, b);

    const newlyUnlockedBuildings: ProgressionBuildingEntry[] = [];
    const quantityChanges: TownHallComparison['quantityChanges'] = [];
    const maxLevelChanges: TownHallComparison['maxLevelChanges'] = [];
    const unchangedBuildings: ProgressionBuildingEntry[] = [];

    for (const [bId, toEntry] of toMap.entries()) {
      const fromEntry = fromMap.get(bId);

      if (!fromEntry) {
        newlyUnlockedBuildings.push(toEntry);
      } else {
        let changed = false;

        if (toEntry.quantity !== fromEntry.quantity) {
          quantityChanges.push({
            buildingId: bId,
            name: toEntry.name,
            category: toEntry.category,
            from: fromEntry.quantity,
            to: toEntry.quantity,
            delta: toEntry.quantity - fromEntry.quantity
          });
          changed = true;
        }

        if (toEntry.maxAvailableLevel !== fromEntry.maxAvailableLevel) {
          maxLevelChanges.push({
            buildingId: bId,
            name: toEntry.name,
            category: toEntry.category,
            from: fromEntry.maxAvailableLevel,
            to: toEntry.maxAvailableLevel,
            delta: toEntry.maxAvailableLevel - fromEntry.maxAvailableLevel
          });
          changed = true;
        }

        if (!changed) {
          unchangedBuildings.push(toEntry);
        }
      }
    }

    const summaryDiff = {
      instanceDelta: toProg.summary.totalBuildingInstances - fromProg.summary.totalBuildingInstances,
      typeDelta: toProg.summary.totalBuildingTypes - fromProg.summary.totalBuildingTypes,
      wallDelta: toProg.summary.totalWalls - fromProg.summary.totalWalls,
      defenseDelta: toProg.summary.totalDefenses - fromProg.summary.totalDefenses,
      resourceDelta: toProg.summary.totalResources - fromProg.summary.totalResources,
      armyDelta: toProg.summary.totalArmy - fromProg.summary.totalArmy,
      trapDelta: toProg.summary.totalTraps - fromProg.summary.totalTraps
    };

    return {
      fromTownHall: fromProg.townHall,
      toTownHall: toProg.townHall,
      newlyUnlockedBuildings,
      quantityChanges,
      maxLevelChanges,
      unchangedBuildings,
      summaryDiff
    };
  }

  /**
   * Retrieves full TH1..MAX_TH progression history for an individual building
   */
  public getBuildingHistory(buildingId: string, progressions: TownHallProgression[]): BuildingProgressionHistory | null {
    const historyEntries: BuildingProgressionHistory['history'] = [];
    let buildingName = '';
    let category: BuildingCategory = 'Defense';
    let overallMaxLevel = 0;
    let unlockedAtTH = 0;

    for (const p of progressions) {
      const entry = p.buildings.find(b => b.buildingId === buildingId);
      if (entry) {
        if (!buildingName) {
          buildingName = entry.name;
          category = entry.category;
          unlockedAtTH = p.townHall;
        }
        if (entry.maxAvailableLevel > overallMaxLevel) {
          overallMaxLevel = entry.maxAvailableLevel;
        }

        historyEntries.push({
          townHall: p.townHall,
          quantity: entry.quantity,
          maxAvailableLevel: entry.maxAvailableLevel,
          isNewlyUnlocked: entry.isNewlyUnlocked,
          isNewUpgradeLevel: entry.isNewUpgradeLevel,
          image: entry.image
        });
      }
    }

    if (historyEntries.length === 0) return null;

    return {
      buildingId,
      name: buildingName,
      category,
      overallMaxLevel,
      unlockedAtTownHall: unlockedAtTH,
      history: historyEntries
    };
  }
}

export const progressionParser = new ProgressionParser();
