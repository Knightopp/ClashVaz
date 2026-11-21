import { durationParser, ParsedDuration } from '../parsers/durationParser.js';

export class DurationNormalizer {
  public normalize(rawDuration: string | null | undefined): ParsedDuration {
    return durationParser.parseDuration(rawDuration);
  }
}

export const durationNormalizer = new DurationNormalizer();
