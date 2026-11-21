import { TownHallProgression } from '../types/progression.js';

export class CsvExporter {
  private escapeCsvCell(val: any): string {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Generates a CSV matrix of Building Quantities across all Town Halls
   */
  public generateQuantityMatrixCsv(progressions: TownHallProgression[]): string {
    const thLevels = progressions.map(p => p.townHall).sort((a, b) => a - b);
    const headers = ['Building ID', 'Building Name', 'Category', ...thLevels.map(th => `TH ${th}`)];

    // Gather distinct buildings across all THs
    const buildingInfo = new Map<string, { id: string; name: string; category: string }>();
    for (const p of progressions) {
      for (const b of p.buildings) {
        if (!buildingInfo.has(b.buildingId)) {
          buildingInfo.set(b.buildingId, { id: b.buildingId, name: b.name, category: b.category });
        }
      }
    }

    const rows: string[][] = [headers];

    for (const [bId, info] of buildingInfo.entries()) {
      const row: (string | number)[] = [info.id, info.name, info.category];
      for (const th of thLevels) {
        const p = progressions.find(x => x.townHall === th);
        const b = p?.buildings.find(x => x.buildingId === bId);
        row.push(b ? b.quantity : 0);
      }
      rows.push(row.map(c => this.escapeCsvCell(c)));
    }

    return rows.map(r => r.join(',')).join('\n');
  }

  /**
   * Generates a CSV matrix of Building Maximum Levels across all Town Halls
   */
  public generateMaxLevelMatrixCsv(progressions: TownHallProgression[]): string {
    const thLevels = progressions.map(p => p.townHall).sort((a, b) => a - b);
    const headers = ['Building ID', 'Building Name', 'Category', ...thLevels.map(th => `TH ${th}`)];

    const buildingInfo = new Map<string, { id: string; name: string; category: string }>();
    for (const p of progressions) {
      for (const b of p.buildings) {
        if (!buildingInfo.has(b.buildingId)) {
          buildingInfo.set(b.buildingId, { id: b.buildingId, name: b.name, category: b.category });
        }
      }
    }

    const rows: string[][] = [headers];

    for (const [bId, info] of buildingInfo.entries()) {
      const row: (string | number)[] = [info.id, info.name, info.category];
      for (const th of thLevels) {
        const p = progressions.find(x => x.townHall === th);
        const b = p?.buildings.find(x => x.buildingId === bId);
        row.push(b ? b.maxAvailableLevel : 0);
      }
      rows.push(row.map(c => this.escapeCsvCell(c)));
    }

    return rows.map(r => r.join(',')).join('\n');
  }

  /**
   * Generates a summary CSV showing overall statistics per Town Hall
   */
  public generateSummaryCsv(progressions: TownHallProgression[]): string {
    const headers = [
      'Town Hall',
      'Total Instances',
      'Total Types',
      'Defenses',
      'Resources',
      'Army',
      'Traps',
      'Walls',
      'Wall Max Level',
      'New Unlocks',
      'New Upgrade Levels'
    ];

    const rows: string[][] = [headers];

    for (const p of progressions) {
      rows.push([
        `TH ${p.townHall}`,
        p.summary.totalBuildingInstances,
        p.summary.totalBuildingTypes,
        p.summary.totalDefenses,
        p.summary.totalResources,
        p.summary.totalArmy,
        p.summary.totalTraps,
        p.summary.totalWalls,
        p.summary.wallMaxLevel,
        p.summary.newlyUnlockedTypes,
        p.summary.newUpgradeUnlocks
      ].map(c => this.escapeCsvCell(c)));
    }

    return rows.map(r => r.join(',')).join('\n');
  }
}

export const csvExporter = new CsvExporter();
