export interface ParsedDuration {
  original: string | null;
  seconds: number | null;
}

export class DurationParser {
  /**
   * Converts a duration string into seconds while preserving the original string.
   * Examples:
   *  - "30s" -> 30
   *  - "30 minutes" / "30m" -> 1800
   *  - "2 hours" / "2h" -> 7200
   *  - "1 day 6 hours" / "1d 6h" -> 108000
   *  - "None" / "" / null -> null
   */
  public parseDuration(raw: string | null | undefined): ParsedDuration {
    if (!raw || typeof raw !== 'string') {
      return { original: null, seconds: null };
    }

    const trimmed = raw.trim();
    if (trimmed === '' || trimmed === '-' || trimmed.toLowerCase() === 'none' || trimmed.toLowerCase() === 'n/a') {
      return { original: trimmed, seconds: null };
    }

    // Match components: days, hours, minutes, seconds
    let totalSeconds = 0;
    let matchedAny = false;

    // Pattern for days
    const dayMatch = trimmed.match(/(\d+)\s*(?:d|day|days)\b/i);
    if (dayMatch) {
      totalSeconds += parseInt(dayMatch[1], 10) * 86400;
      matchedAny = true;
    }

    // Pattern for hours
    const hourMatch = trimmed.match(/(\d+)\s*(?:h|hr|hrs|hour|hours)\b/i);
    if (hourMatch) {
      totalSeconds += parseInt(hourMatch[1], 10) * 3600;
      matchedAny = true;
    }

    // Pattern for minutes
    const minMatch = trimmed.match(/(\d+)\s*(?:m|min|mins|minute|minutes)\b/i);
    if (minMatch) {
      totalSeconds += parseInt(minMatch[1], 10) * 60;
      matchedAny = true;
    }

    // Pattern for seconds
    const secMatch = trimmed.match(/(\d+)\s*(?:s|sec|secs|second|seconds)\b/i);
    if (secMatch) {
      totalSeconds += parseInt(secMatch[1], 10);
      matchedAny = true;
    }

    // Also handle purely numeric seconds (e.g. "30")
    if (!matchedAny && /^\d+$/.test(trimmed)) {
      totalSeconds = parseInt(trimmed, 10);
      matchedAny = true;
    }

    if (!matchedAny) {
      return { original: trimmed, seconds: null };
    }

    return {
      original: trimmed,
      seconds: totalSeconds
    };
  }
}

export const durationParser = new DurationParser();
