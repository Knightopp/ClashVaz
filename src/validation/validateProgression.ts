import { TownHallProgression, ProgressionValidationReport } from '../types/progression.js';
import { ExtractedBuilding } from '../types/building.js';
import { logger } from '../utils/logger.js';

export class ProgressionValidator {
  public validate(
    progressions: TownHallProgression[],
    extractedBuildings: ExtractedBuilding[]
  ): ProgressionValidationReport {
    logger.info('ProgressionValidator', `Validating ${progressions.length} Town Hall progression records...`);

    const errors: string[] = [];
    const warnings: string[] = [];

    const buildingMaxMap = new Map<string, number>();
    for (const b of extractedBuildings) {
      const clean = b.name.replace('/Home Village', '').trim().toLowerCase();
      if (b.maxLevel !== null) {
        buildingMaxMap.set(clean, b.maxLevel);
      }
    }

    let totalEntries = 0;
    let verifiedCount = 0;
    let inferredCount = 0;
    let missingCount = 0;

    const maxDiscoveredTH = progressions.length > 0 ? progressions[progressions.length - 1].townHall : 0;

    // Check 1: Consecutive Town Halls 1..maxDiscoveredTH
    for (let th = 1; th <= maxDiscoveredTH; th++) {
      const p = progressions.find(x => x.townHall === th);
      if (!p) {
        errors.push(`Missing progression record for Town Hall ${th}`);
      }
    }

    // Check 2: Progression consistency per building
    const lastLevelSeen = new Map<string, number>();

    for (const p of progressions) {
      // Validate Summary counts
      let calcInstances = 0;
      let calcDefenses = 0;
      let calcResources = 0;
      let calcArmy = 0;
      let calcTraps = 0;

      for (const b of p.buildings) {
        totalEntries++;

        if (b.image.confidence === 'verified') verifiedCount++;
        else if (b.image.confidence === 'inferred') inferredCount++;
        else missingCount++;

        if (b.buildingId !== 'wall') {
          calcInstances += b.quantity;
        }

        if (b.category === 'Defense' && b.buildingId !== 'wall') calcDefenses += b.quantity;
        else if (b.category === 'Resource') calcResources += b.quantity;
        else if (b.category === 'Army') calcArmy += b.quantity;
        else if (b.category === 'Trap') calcTraps += b.quantity;

        // Check quantity validity
        if (b.quantity < 0 || !Number.isInteger(b.quantity)) {
          errors.push(`TH${p.townHall} ${b.name}: invalid quantity ${b.quantity}`);
        }

        // Check level validity
        if (b.maxAvailableLevel < 0 || !Number.isInteger(b.maxAvailableLevel)) {
          errors.push(`TH${p.townHall} ${b.name}: invalid maxAvailableLevel ${b.maxAvailableLevel}`);
        }

        // Check if level exceeds overall game maximum
        const cleanName = b.name.toLowerCase();
        const overallMax = buildingMaxMap.get(cleanName);
        if (overallMax !== undefined && b.maxAvailableLevel > overallMax) {
          warnings.push(
            `TH${p.townHall} ${b.name}: level ${b.maxAvailableLevel} exceeds overall building max ${overallMax}`
          );
        }

        // Check level monotonicity (a building's max level cannot drop at higher TH)
        const prevLvl = lastLevelSeen.get(b.buildingId);
        if (prevLvl !== undefined && b.maxAvailableLevel < prevLvl && b.maxAvailableLevel > 0) {
          warnings.push(
            `TH${p.townHall} ${b.name}: max level ${b.maxAvailableLevel} decreased from previous TH level ${prevLvl}`
          );
        }
        if (b.maxAvailableLevel > 0) {
          lastLevelSeen.set(b.buildingId, b.maxAvailableLevel);
        }

        // Check source references
        if (!b.sourceReferences || b.sourceReferences.length === 0) {
          warnings.push(`TH${p.townHall} ${b.name}: missing source references`);
        }
      }

      // Verify calculated summary against summary object
      if (calcInstances !== p.summary.totalBuildingInstances) {
        errors.push(
          `TH${p.townHall}: totalBuildingInstances mismatch. Calculated: ${calcInstances}, Recorded: ${p.summary.totalBuildingInstances}`
        );
      }
      if (calcDefenses !== p.summary.totalDefenses) {
        errors.push(`TH${p.townHall}: totalDefenses mismatch.`);
      }
      if (calcResources !== p.summary.totalResources) {
        errors.push(`TH${p.townHall}: totalResources mismatch.`);
      }
      if (calcArmy !== p.summary.totalArmy) {
        errors.push(`TH${p.townHall}: totalArmy mismatch.`);
      }
      if (calcTraps !== p.summary.totalTraps) {
        errors.push(`TH${p.townHall}: totalTraps mismatch.`);
      }
    }

    const status: ProgressionValidationReport['status'] =
      errors.length > 0 ? 'failed' : warnings.length > 0 ? 'warnings' : 'passed';

    logger.info(
      'ProgressionValidator',
      `Validation complete. Status: ${status} (Errors: ${errors.length}, Warnings: ${warnings.length})`
    );

    return {
      timestamp: new Date().toISOString(),
      totalTownHalls: progressions.length,
      maxTownHall: maxDiscoveredTH,
      status,
      errors,
      warnings,
      summary: {
        totalEvaluatedEntries: totalEntries,
        verifiedEntries: verifiedCount,
        inferredEntries: inferredCount,
        missingEntries: missingCount
      }
    };
  }
}

export const progressionValidator = new ProgressionValidator();
