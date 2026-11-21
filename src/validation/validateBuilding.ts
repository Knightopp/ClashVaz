import {
  ExtractedBuilding,
  ExtractedBuildingSchema,
  BuildingValidationReport,
  ValidationItem
} from '../types/building.js';
import { upgradeDataValidator } from './validateUpgradeData.js';
import { imageValidator } from './validateImages.js';
import { logger } from '../utils/logger.js';

export class BuildingValidator {
  public validate(building: ExtractedBuilding): BuildingValidationReport {
    logger.info('BuildingValidator', `Validating building: ${building.name}`);
    const items: ValidationItem[] = [];

    // 1. Zod Schema Validation
    const zodResult = ExtractedBuildingSchema.safeParse(building);
    if (!zodResult.success) {
      for (const issue of zodResult.error.issues) {
        items.push({
          field: issue.path.join('.'),
          status: 'unverified',
          value: null,
          message: `Zod validation error: ${issue.message}`
        });
      }
    }

    // 2. Construction Town Hall validation
    const constTH = building.construction.townHallRequired;
    if (constTH === null) {
      items.push({
        field: 'construction.townHallRequired',
        status: 'missing',
        value: null,
        message: 'Construction Town Hall requirement unknown or not explicitly specified.',
        evidence: building.construction.evidence ?? undefined
      });
    } else {
      items.push({
        field: 'construction.townHallRequired',
        status: building.construction.confidence ?? 'verified',
        value: constTH,
        message: `Building unlocked at Town Hall ${constTH}.`,
        evidence: building.construction.evidence ?? undefined
      });
    }

    // 3. Max Level & Max Level TH Validation
    if (building.levels.length > 0) {
      const highestLevel = building.levels[building.levels.length - 1];
      if (building.maxLevel === highestLevel.level) {
        items.push({
          field: 'maxLevel',
          status: 'verified',
          value: building.maxLevel,
          message: `Max level ${building.maxLevel} corresponds to highest verified level row.`
        });
      } else {
        items.push({
          field: 'maxLevel',
          status: 'unverified',
          value: building.maxLevel,
          message: `Mismatch: maxLevel is ${building.maxLevel} but highest row level is ${highestLevel.level}.`
        });
      }

      if (building.maxLevelTownHall === highestLevel.townHallRequired) {
        items.push({
          field: 'maxLevelTownHall',
          status: 'verified',
          value: building.maxLevelTownHall,
          message: `Max level TH ${building.maxLevelTownHall} corresponds to max level requirement.`
        });
      } else {
        items.push({
          field: 'maxLevelTownHall',
          status: 'unverified',
          value: building.maxLevelTownHall,
          message: `Max level TH ${building.maxLevelTownHall} does not match highest row TH requirement ${highestLevel.townHallRequired}.`
        });
      }
    }

    // 4. Upgrade Data Validation
    const upgradeItems = upgradeDataValidator.validate(building.levels);
    items.push(...upgradeItems);

    // 5. Image Validation
    const imageItems = imageValidator.validate(building.levels);
    items.push(...imageItems);

    // Summary calculations
    const verifiedLevels = items.filter(i => i.status === 'verified').length;
    const inferredLevels = items.filter(i => i.status === 'inferred').length;
    const unverifiedLevels = items.filter(i => i.status === 'unverified').length;
    const missingLevels = items.filter(i => i.status === 'missing').length;

    const levelsValid = !items.some(i => i.field === 'level' && i.status === 'unverified');
    const imagesValid = !items.some(i => i.field === 'image' && i.status === 'unverified');
    const durationsValid = !items.some(i => i.field === 'upgradeTime' && i.status === 'missing');
    const costsValid = !items.some(i => i.field === 'upgradeCost' && i.status === 'unverified');
    const townHallValid = !items.some(i => i.field === 'townHallRequired' && i.status === 'unverified');

    let overallStatus: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
    if (!levelsValid || unverifiedLevels > 0) {
      overallStatus = 'WARNING';
    }
    if (!zodResult.success) {
      overallStatus = 'FAIL';
    }

    return {
      buildingName: building.name,
      totalLevels: building.levels.length,
      verifiedLevels,
      inferredLevels,
      unverifiedLevels,
      missingLevels,
      items,
      summary: {
        levelsValid,
        imagesValid,
        durationsValid,
        costsValid,
        townHallValid,
        overallStatus
      }
    };
  }
}

export const buildingValidator = new BuildingValidator();
