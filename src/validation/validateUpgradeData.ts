import { BuildingLevel, ValidationItem } from '../types/building.js';

export class UpgradeDataValidator {
  public validate(levels: BuildingLevel[]): ValidationItem[] {
    const items: ValidationItem[] = [];
    const seenLevels = new Set<number>();

    for (let i = 0; i < levels.length; i++) {
      const lvl = levels[i];

      // 1. Level uniqueness and sequence
      if (seenLevels.has(lvl.level)) {
        items.push({
          field: 'level',
          level: lvl.level,
          status: 'unverified',
          value: lvl.level,
          message: `Duplicate level number detected: ${lvl.level}`
        });
      } else {
        seenLevels.add(lvl.level);
        items.push({
          field: 'level',
          level: lvl.level,
          status: 'verified',
          value: lvl.level,
          message: `Level ${lvl.level} verified sequential and unique.`
        });
      }

      // 2. Cost validation
      if (lvl.upgradeCost === null) {
        items.push({
          field: 'upgradeCost',
          level: lvl.level,
          status: lvl.level === 1 ? 'inferred' : 'missing',
          value: null,
          message: lvl.level === 1 ? 'Level 1 initial build cost may be 0 or free' : `Missing upgrade cost for level ${lvl.level}`
        });
      } else if (typeof lvl.upgradeCost === 'number' && lvl.upgradeCost >= 0) {
        items.push({
          field: 'upgradeCost',
          level: lvl.level,
          status: 'verified',
          value: lvl.upgradeCost,
          message: `Upgrade cost is numeric: ${lvl.upgradeCost.toLocaleString()} ${lvl.upgradeCurrency || ''}`
        });
      } else {
        items.push({
          field: 'upgradeCost',
          level: lvl.level,
          status: 'unverified',
          value: lvl.upgradeCost,
          message: `Invalid upgrade cost value: ${lvl.upgradeCost}`
        });
      }

      // 3. Duration validation
      if (lvl.upgradeTimeSeconds === null) {
        items.push({
          field: 'upgradeTime',
          level: lvl.level,
          status: 'missing',
          value: lvl.upgradeTimeOriginal,
          message: `Duration could not be converted to seconds: "${lvl.upgradeTimeOriginal}"`
        });
      } else if (typeof lvl.upgradeTimeSeconds === 'number' && lvl.upgradeTimeSeconds >= 0) {
        items.push({
          field: 'upgradeTime',
          level: lvl.level,
          status: 'verified',
          value: lvl.upgradeTimeSeconds,
          message: `Duration correctly converted: "${lvl.upgradeTimeOriginal}" -> ${lvl.upgradeTimeSeconds}s`
        });
      }

      // 4. Town Hall requirement validation
      if (lvl.townHallRequired === null) {
        items.push({
          field: 'townHallRequired',
          level: lvl.level,
          status: 'missing',
          value: null,
          message: `Town Hall requirement missing for level ${lvl.level}`
        });
      } else if (lvl.townHallRequired >= 1 && lvl.townHallRequired <= 30) {
        items.push({
          field: 'townHallRequired',
          level: lvl.level,
          status: 'verified',
          value: lvl.townHallRequired,
          message: `Town Hall requirement verified: TH ${lvl.townHallRequired}`
        });
      } else {
        items.push({
          field: 'townHallRequired',
          level: lvl.level,
          status: 'unverified',
          value: lvl.townHallRequired,
          message: `Suspicious Town Hall requirement: ${lvl.townHallRequired}`
        });
      }

      // 5. Hitpoints validation
      if (lvl.hitpoints !== null && lvl.hitpoints > 0) {
        items.push({
          field: 'hitpoints',
          level: lvl.level,
          status: 'verified',
          value: lvl.hitpoints,
          message: `Hitpoints verified: ${lvl.hitpoints}`
        });
      }

      // 6. DPS validation
      if (lvl.damagePerSecond !== null && lvl.damagePerSecond > 0) {
        items.push({
          field: 'damagePerSecond',
          level: lvl.level,
          status: 'verified',
          value: lvl.damagePerSecond,
          message: `Damage per second verified: ${lvl.damagePerSecond}`
        });
      }
    }

    return items;
  }
}

export const upgradeDataValidator = new UpgradeDataValidator();
