export interface RawBuildingRecord {
  data: number | string;
  lvl: number;
  cnt?: number;
  timer?: number;
  x?: number;
  y?: number;
  [key: string]: any;
}

export interface VillageRawExport {
  tag?: string;
  timestamp?: number;
  helpers?: any[];
  guardians?: any[];
  buildings?: RawBuildingRecord[];
  traps?: RawBuildingRecord[];
  decos?: any[];
  obstacles?: any[];
  units?: any[];
  siege_machines?: any[];
  heroes?: any[];
  spells?: any[];
  pets?: any[];
  equipment?: any[];
  house_parts?: any[];
  skins?: any[];
  sceneries?: any[];
  buildings2?: RawBuildingRecord[];
  traps2?: RawBuildingRecord[];
  decos2?: any[];
  obstacles2?: any[];
  units2?: any[];
  heroes2?: any[];
  [key: string]: any;
}

export interface BuildingFootprint {
  width: number;
  height: number;
  canRotate?: boolean;
}

export interface IdentifiedBuilding {
  instanceId?: string;
  buildingId: string;
  name: string;
  category: 'Defense' | 'Resource' | 'Army' | 'Trap' | 'Wall' | 'Other';
  level: number;
  quantity: number;
  timer?: number; // upgrade timer remaining in seconds
  upgradeEndTimestamp?: number;
  x?: number;
  y?: number;
  footprint: BuildingFootprint;
  image?: {
    filename: string;
    url: string;
    confidence: string;
  };
  raw?: RawBuildingRecord;
}

export interface ActiveUpgrade {
  id: string;
  name: string;
  currentLevel: number;
  targetLevel: number;
  timerSeconds: number;
  endTimestamp: number;
  builderType: string;
  image?: {
    filename: string;
    url: string;
  };
}

export interface VillageProfile {
  tag: string;
  playerName: string;
  townHallLevel: number;
  importedAt: string;
  timestamp?: number;
  totalBuildings: number;
  totalTraps: number;
  totalHeroes: number;
  totalWalls: number;
  buildings: IdentifiedBuilding[];
  traps: IdentifiedBuilding[];
  heroes: any[];
  pets: any[];
  equipment: any[];
  troops: any[];
  spells: any[];
  activeUpgrades: ActiveUpgrade[];
  unresolvedRecords: RawBuildingRecord[];
  builderBase?: {
    buildings2?: RawBuildingRecord[];
    traps2?: RawBuildingRecord[];
    heroes2?: any[];
    units2?: any[];
  };
  rawExport: VillageRawExport;
}

export interface VillageSnapshot {
  id: string;
  tag: string;
  playerName: string;
  importedAt: string;
  townHallLevel: number;
  totalBuildings: number;
  totalTraps: number;
  totalHeroes: number;
  activeUpgradesCount: number;
  summary: string;
}

export interface PlacedBuilding {
  instanceId: string;
  buildingId: string;
  name: string;
  category: string;
  level: number;
  x: number;
  y: number;
  width: number;
  height: number;
  image?: string;
}

export interface VillageLayout {
  id: string;
  name: string;
  tag?: string;
  isDefault?: boolean;
  gridSize: number; // default 44
  buildings: PlacedBuilding[];
  createdAt: string;
  updatedAt: string;
  isSandbox?: boolean;
}
