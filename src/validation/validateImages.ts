import { BuildingLevel, ValidationItem } from '../types/building.js';

export class ImageValidator {
  public validate(levels: BuildingLevel[]): ValidationItem[] {
    const items: ValidationItem[] = [];

    for (const lvl of levels) {
      const img = lvl.image;

      if (!img.filename || !img.url) {
        items.push({
          field: 'image',
          level: lvl.level,
          status: 'missing',
          value: null,
          message: `No image found for level ${lvl.level}`,
          evidence: img.evidence ?? undefined
        });
        continue;
      }

      // Check URL format
      const hasValidUrl = img.url.startsWith('http://') || img.url.startsWith('https://');
      if (!hasValidUrl) {
        items.push({
          field: 'image',
          level: lvl.level,
          status: 'unverified',
          value: img.url,
          message: `Malformed image URL for level ${lvl.level}: ${img.url}`,
          evidence: img.evidence ?? undefined
        });
        continue;
      }

      // Check confidence
      items.push({
        field: 'image',
        level: lvl.level,
        status: img.confidence,
        value: img.filename,
        message: `Image ${img.filename} mapped with status ${img.confidence.toUpperCase()}`,
        evidence: `${img.evidence || 'No direct evidence'} | URL: ${img.url}`
      });
    }

    return items;
  }
}

export const imageValidator = new ImageValidator();
