import { ExtractedBuilding, TownHallProgressionMap, ImageManifestEntry } from '../types/building.js';

export class ProgressionEngine {
  /**
   * Generates a complete Town Hall progression matrix (TH1 to TH19) for every building.
   */
  public generateProgression(buildings: ExtractedBuilding[]): TownHallProgressionMap {
    const progressionMap: TownHallProgressionMap = {};

    for (const b of buildings) {
      const constTH = b.construction.townHallRequired ?? 1;
      const levelsAtTH: { [th: number]: number } = {};

      for (let th = 1; th <= 19; th++) {
        if (th < constTH) {
          levelsAtTH[th] = 0; // Not unlocked yet
        } else {
          // Find the maximum level available at this Town Hall
          let maxAtThisTH = 0;
          for (const lvl of b.levels) {
            const req = lvl.townHallRequired;
            if (req !== null && req <= th) {
              if (lvl.level > maxAtThisTH) {
                maxAtThisTH = lvl.level;
              }
            } else if (req === null && maxAtThisTH === 0 && lvl.level === 1) {
              // Fallback for level 1 if explicit TH column was missing
              maxAtThisTH = 1;
            }
          }
          levelsAtTH[th] = maxAtThisTH;
        }
      }

      progressionMap[b.name] = {
        constructionTownHall: b.construction.townHallRequired,
        currentMaxLevel: b.maxLevel,
        maxLevelTownHall: b.maxLevelTownHall,
        levelsAtTownHall: levelsAtTH
      };
    }

    return progressionMap;
  }

  /**
   * Generates a complete image manifest for all extracted building levels.
   */
  public generateImageManifest(buildings: ExtractedBuilding[]): ImageManifestEntry[] {
    const manifest: ImageManifestEntry[] = [];

    for (const b of buildings) {
      for (const lvl of b.levels) {
        manifest.push({
          building: b.name,
          level: lvl.level,
          filename: lvl.image.filename,
          url: lvl.image.url,
          confidence: lvl.image.confidence,
          width: lvl.image.width,
          height: lvl.image.height,
          size: lvl.image.size,
          mime: lvl.image.mime,
          sha1: lvl.image.sha1
        });
      }
    }

    return manifest;
  }
}

export const progressionEngine = new ProgressionEngine();
