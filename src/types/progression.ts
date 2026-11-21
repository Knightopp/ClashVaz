export type BuildingCategory = 'Defense' | 'Resource' | 'Army' | 'Trap' | 'Other';

export interface ProgressionImageInfo {
  filename: string | null;
  url: string | null;
  confidence: 'verified' | 'inferred' | 'unverified' | 'missing';
}

export interface ProgressionBuildingEntry {
  buildingId: string;
  name: string;
  category: BuildingCategory;
  quantity: number;
  maxAvailableLevel: number;
  isNewlyUnlocked: boolean;
  isNewUpgradeLevel: boolean;
  previousQuantity?: number;
  previousMaxLevel?: number;
  image: ProgressionImageInfo;
  sourceReferences: string[];
}

export interface TownHallSummary {
  totalBuildingInstances: number; // Sum of building copies (excluding walls)
  totalBuildingTypes: number;
  totalDefenses: number;
  totalResources: number;
  totalArmy: number;
  totalTraps: number;
  totalWalls: number;
  wallMaxLevel: number;
  newlyUnlockedTypes: number;
  newUpgradeUnlocks: number;
}

export interface TownHallProgression {
  townHall: number;
  name: string; // "Town Hall 10"
  wikiUrl: string;
  buildings: ProgressionBuildingEntry[];
  summary: TownHallSummary;
  walls: {
    quantity: number;
    maxLevel: number;
  };
  validation: {
    status: 'verified' | 'inferred' | 'unverified';
    notes: string[];
  };
}

export interface TownHallComparisonChange<T> {
  buildingId: string;
  name: string;
  category: BuildingCategory;
  from: T;
  to: T;
  delta: number;
}

export interface TownHallComparison {
  fromTownHall: number;
  toTownHall: number;
  newlyUnlockedBuildings: ProgressionBuildingEntry[];
  quantityChanges: TownHallComparisonChange<number>[];
  maxLevelChanges: TownHallComparisonChange<number>[];
  unchangedBuildings: ProgressionBuildingEntry[];
  summaryDiff: {
    instanceDelta: number;
    typeDelta: number;
    wallDelta: number;
    defenseDelta: number;
    resourceDelta: number;
    armyDelta: number;
    trapDelta: number;
  };
}

export interface BuildingProgressionHistory {
  buildingId: string;
  name: string;
  category: BuildingCategory;
  overallMaxLevel: number;
  unlockedAtTownHall: number;
  history: {
    townHall: number;
    quantity: number;
    maxAvailableLevel: number;
    isNewlyUnlocked: boolean;
    isNewUpgradeLevel: boolean;
    image: ProgressionImageInfo;
  }[];
}

export interface ProgressionValidationReport {
  timestamp: string;
  totalTownHalls: number;
  maxTownHall: number;
  status: 'passed' | 'failed' | 'warnings';
  errors: string[];
  warnings: string[];
  summary: {
    totalEvaluatedEntries: number;
    verifiedEntries: number;
    inferredEntries: number;
    missingEntries: number;
  };
}
