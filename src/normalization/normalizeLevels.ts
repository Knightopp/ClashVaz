import { BuildingLevel } from '../types/building.js';

export class LevelNormalizer {
  /**
   * Sorts and validates sequence of building levels
   */
  public normalizeLevels(levels: BuildingLevel[]): BuildingLevel[] {
    const sorted = [...levels].sort((a, b) => a.level - b.level);
    return sorted;
  }
}

export const levelNormalizer = new LevelNormalizer();
