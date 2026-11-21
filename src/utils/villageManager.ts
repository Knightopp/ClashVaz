import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger.js';
import {
  VillageProfile,
  VillageSnapshot,
  VillageLayout,
  PlacedBuilding,
  VillageRawExport
} from '../types/village.js';
import { villageExportParser, BUILDING_FOOTPRINTS, DEFAULT_FOOTPRINT } from '../parsers/villageExportParser.js';
import { ExtractedBuilding } from '../types/building.js';

export interface VillageStoreData {
  currentProfile: VillageProfile | null;
  snapshots: VillageSnapshot[];
}

export class VillageManager {
  private profileFile: string;
  private layoutFile: string;

  constructor() {
    this.profileFile = path.resolve(process.cwd(), 'data', 'village_profiles.json');
    this.layoutFile = path.resolve(process.cwd(), 'data', 'village_layouts.json');
    this.ensureInitialized();
  }

  private ensureInitialized(): void {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(this.profileFile)) {
      this.createDefaultProfile();
    }

    if (!fs.existsSync(this.layoutFile)) {
      this.createDefaultLayouts();
    }
  }

  private createDefaultProfile(): void {
    // Generate an initial authentic TH18 village profile matching our extracted database
    const mockExport: VillageRawExport = {
      tag: '#9LV2PR99',
      timestamp: Date.now(),
      helpers: [{ data: 0, lvl: 1 }],
      buildings: [
        { data: 1000001, lvl: 18, cnt: 1, x: 20, y: 20 }, // Town Hall 18
        { data: 1000002, lvl: 14, cnt: 1, x: 24, y: 20 }, // Clan Castle
        { data: 1000037, lvl: 3, cnt: 2, timer: 136800, x: 17, y: 20 }, // Firespitter (active upgrade)
        { data: 1000038, lvl: 2, cnt: 2, timer: 280800, x: 23, y: 16 }, // Firecracker Tower (active upgrade)
        { data: 1000032, lvl: 5, cnt: 1, timer: 388800, x: 20, y: 25 }, // Monolith (active upgrade)
        { data: 1000034, lvl: 4, cnt: 3, x: 16, y: 24 }, // Ricochet Cannon
        { data: 1000035, lvl: 4, cnt: 3, x: 24, y: 24 }, // Multi-Archer Tower
        { data: 1000014, lvl: 16, cnt: 4, x: 18, y: 18 }, // Air Defense
        { data: 1000015, lvl: 17, cnt: 2, x: 22, y: 18 }, // Wizard Tower
        { data: 1000021, lvl: 13, cnt: 4, x: 19, y: 22 }, // X-Bow
        { data: 1000023, lvl: 12, cnt: 3, x: 21, y: 22 }, // Inferno Tower
        { data: 1000028, lvl: 7, cnt: 2, x: 18, y: 25 }, // Scattershot
        { data: 1000031, lvl: 4, cnt: 2, x: 22, y: 25 }, // Spell Tower
        { data: 1000011, lvl: 19, cnt: 4, x: 15, y: 18 }, // Gold Storage
        { data: 1000012, lvl: 19, cnt: 4, x: 25, y: 18 }, // Elixir Storage
        { data: 1000019, lvl: 13, cnt: 1, x: 20, y: 17 }, // Dark Elixir Storage
        { data: 1000006, lvl: 14, cnt: 4, x: 12, y: 12 }, // Army Camp
        { data: 1000008, lvl: 16, cnt: 1, x: 12, y: 18 }, // Laboratory
        { data: 1000033, lvl: 10, cnt: 1, x: 12, y: 22 }, // Blacksmith
        { data: 1000030, lvl: 12, cnt: 1, x: 12, y: 26 }, // Pet House
        { data: 1000005, lvl: 19, cnt: 325 } // Walls
      ],
      traps: [
        { data: 1200001, lvl: 14, cnt: 8 }, // Bomb
        { data: 1200002, lvl: 13, cnt: 9 }, // Spring Trap
        { data: 1200003, lvl: 12, cnt: 8 }, // Giant Bomb
        { data: 1200004, lvl: 13, cnt: 8 }, // Air Bomb
        { data: 1200005, lvl: 8, cnt: 9 },  // Seeking Air Mine
        { data: 1200006, lvl: 5, cnt: 4 },  // Skeleton Trap
        { data: 1200007, lvl: 3, cnt: 1 }   // Tornado Trap
      ],
      heroes: [
        { data: 0, lvl: 95, name: 'Barbarian King' },
        { data: 1, lvl: 95, name: 'Archer Queen' },
        { data: 2, lvl: 70, name: 'Grand Warden' },
        { data: 3, lvl: 45, name: 'Royal Champion' },
        { data: 4, lvl: 10, name: 'Minion Prince' }
      ]
    };

    const profile = villageExportParser.parseVillage(mockExport);
    profile.playerName = 'Chief ClashMaster';
    const store: VillageStoreData = {
      currentProfile: profile,
      snapshots: [
        {
          id: `snap_${Date.now()}`,
          tag: profile.tag,
          playerName: profile.playerName,
          importedAt: profile.importedAt,
          townHallLevel: profile.townHallLevel,
          totalBuildings: profile.totalBuildings,
          totalTraps: profile.totalTraps,
          totalHeroes: profile.totalHeroes,
          activeUpgradesCount: profile.activeUpgrades.length,
          summary: `Initial Home Village TH18 Snapshot (${profile.totalBuildings} buildings, 3 active upgrades)`
        }
      ]
    };

    fs.writeFileSync(this.profileFile, JSON.stringify(store, null, 2));
    logger.info('VillageManager', 'Created initial default village profile');
  }

  private createDefaultLayouts(): void {
    const defaultLayout: VillageLayout = {
      id: 'layout-active-main',
      name: 'Active Village Base',
      isDefault: true,
      gridSize: 44,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      buildings: [
        {
          instanceId: 'inst_th',
          buildingId: 'town-hall',
          name: 'Town Hall',
          category: 'Defense',
          level: 18,
          x: 20,
          y: 20,
          width: 4,
          height: 4,
          image: '/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/4/4b/Town_Hall18.png/revision/latest?cb=20261118173500'
        },
        {
          instanceId: 'inst_cc',
          buildingId: 'clan-castle',
          name: 'Clan Castle',
          category: 'Defense',
          level: 14,
          x: 24,
          y: 20,
          width: 4,
          height: 4
        },
        {
          instanceId: 'inst_mono',
          buildingId: 'monolith',
          name: 'Monolith',
          category: 'Defense',
          level: 5,
          x: 20,
          y: 25,
          width: 3,
          height: 3
        },
        {
          instanceId: 'inst_fs1',
          buildingId: 'firespitter',
          name: 'Firespitter',
          category: 'Defense',
          level: 3,
          x: 17,
          y: 20,
          width: 3,
          height: 3
        },
        {
          instanceId: 'inst_fc1',
          buildingId: 'firecracker-tower',
          name: 'Firecracker Tower',
          category: 'Defense',
          level: 2,
          x: 23,
          y: 16,
          width: 3,
          height: 3
        },
        {
          instanceId: 'inst_rc1',
          buildingId: 'ricochet-cannon',
          name: 'Ricochet Cannon',
          category: 'Defense',
          level: 4,
          x: 16,
          y: 24,
          width: 3,
          height: 3
        },
        {
          instanceId: 'inst_mat1',
          buildingId: 'multiarcher-tower',
          name: 'Multi-Archer Tower',
          category: 'Defense',
          level: 4,
          x: 24,
          y: 24,
          width: 3,
          height: 3
        }
      ]
    };

    const warLayout: VillageLayout = {
      id: 'layout-war-anti3',
      name: 'Anti-3 Star War Base',
      isDefault: false,
      gridSize: 44,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      buildings: [
        {
          instanceId: 'inst_w_th',
          buildingId: 'town-hall',
          name: 'Town Hall',
          category: 'Defense',
          level: 18,
          x: 12,
          y: 20,
          width: 4,
          height: 4
        },
        {
          instanceId: 'inst_w_mono',
          buildingId: 'monolith',
          name: 'Monolith',
          category: 'Defense',
          level: 5,
          x: 28,
          y: 20,
          width: 3,
          height: 3
        }
      ]
    };

    fs.writeFileSync(this.layoutFile, JSON.stringify([defaultLayout, warLayout], null, 2));
    logger.info('VillageManager', 'Created initial default layouts');
  }

  public getProfileData(): VillageStoreData {
    try {
      if (!fs.existsSync(this.profileFile)) {
        this.createDefaultProfile();
      }
      return JSON.parse(fs.readFileSync(this.profileFile, 'utf-8'));
    } catch (err: any) {
      logger.error('VillageManager', 'Failed loading profile file', err);
      return { currentProfile: null, snapshots: [] };
    }
  }

  public saveImport(raw: VillageRawExport): { profile: VillageProfile; snapshot: VillageSnapshot } {
    const profile = villageExportParser.parseVillage(raw);
    const store = this.getProfileData();

    // Preserve existing player name if custom
    if (store.currentProfile?.playerName && store.currentProfile.playerName !== 'Chief #UNKNOWN') {
      profile.playerName = store.currentProfile.playerName;
    }

    const snapshot: VillageSnapshot = {
      id: `snap_${Date.now()}`,
      tag: profile.tag,
      playerName: profile.playerName,
      importedAt: profile.importedAt,
      townHallLevel: profile.townHallLevel,
      totalBuildings: profile.totalBuildings,
      totalTraps: profile.totalTraps,
      totalHeroes: profile.totalHeroes,
      activeUpgradesCount: profile.activeUpgrades.length,
      summary: `Imported village ${profile.tag} (TH${profile.townHallLevel}, ${profile.totalBuildings} buildings, ${profile.totalTraps} traps, ${profile.activeUpgrades.length} upgrades)`
    };

    store.currentProfile = profile;
    store.snapshots.unshift(snapshot);
    if (store.snapshots.length > 20) {
      store.snapshots = store.snapshots.slice(0, 20); // Keep last 20 snapshots
    }

    fs.writeFileSync(this.profileFile, JSON.stringify(store, null, 2));
    logger.info('VillageManager', `Successfully saved village import for ${profile.tag}`);
    return { profile, snapshot };
  }

  public getLayouts(): VillageLayout[] {
    try {
      if (!fs.existsSync(this.layoutFile)) {
        this.createDefaultLayouts();
      }
      return JSON.parse(fs.readFileSync(this.layoutFile, 'utf-8'));
    } catch (err: any) {
      logger.error('VillageManager', 'Failed loading layouts file', err);
      return [];
    }
  }

  public saveLayout(layout: VillageLayout): VillageLayout {
    const layouts = this.getLayouts();
    const existingIdx = layouts.findIndex(l => l.id === layout.id);

    layout.updatedAt = new Date().toISOString();
    if (existingIdx >= 0) {
      layouts[existingIdx] = layout;
    } else {
      layout.id = layout.id || `layout_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      layout.createdAt = layout.createdAt || new Date().toISOString();
      layouts.push(layout);
    }

    fs.writeFileSync(this.layoutFile, JSON.stringify(layouts, null, 2));
    logger.info('VillageManager', `Saved layout ${layout.name} (${layout.id})`);
    return layout;
  }

  public deleteLayout(layoutId: string): boolean {
    const layouts = this.getLayouts();
    const filtered = layouts.filter(l => l.id !== layoutId);
    if (filtered.length === layouts.length) return false;

    fs.writeFileSync(this.layoutFile, JSON.stringify(filtered, null, 2));
    logger.info('VillageManager', `Deleted layout ${layoutId}`);
    return true;
  }
}

export const villageManager = new VillageManager();
