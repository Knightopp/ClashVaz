export class TownHallParser {
  /**
   * Parses Town Hall requirement strings into a clean numeric value.
   * Preserves null if unknown or missing.
   */
  public parseTownHall(raw: string | null | undefined): number | null {
    if (!raw || typeof raw !== 'string') return null;

    const trimmed = raw.trim();
    if (trimmed === '' || trimmed === '-' || trimmed.toLowerCase() === 'none' || trimmed.toLowerCase() === 'n/a') {
      return null;
    }

    // Match numbers, e.g. "TH15", "15", "Level 15"
    const match = trimmed.match(/(?:TH\s*|Level\s*)?(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0 && num <= 30) {
        return num;
      }
    }

    return null;
  }
}

export const townHallParser = new TownHallParser();
