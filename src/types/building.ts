import { z } from 'zod';

export type ConfidenceLevel = 'verified' | 'inferred' | 'unverified' | 'missing';

export type ExtractionStatus = 'pending' | 'success' | 'partial' | 'failed';

export const ImageMetadataSchema = z.object({
  filename: z.string().nullable(),
  url: z.string().nullable(),
  confidence: z.enum(['verified', 'inferred', 'unverified', 'missing']),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  size: z.number().nullable().optional(),
  mime: z.string().nullable().optional(),
  sha1: z.string().nullable().optional(),
  descriptionUrl: z.string().nullable().optional(),
  evidence: z.string().nullable().optional()
});

export type ExtractedImage = z.infer<typeof ImageMetadataSchema>;

export const SourceTraceSchema = z.object({
  page: z.string().nullable(),
  table: z.string().nullable(),
  section: z.string().nullable().optional(),
  rawSnippet: z.string().nullable().optional()
});

export type SourceTrace = z.infer<typeof SourceTraceSchema>;

export const BuildingLevelSchema = z.object({
  level: z.number(),
  townHallRequired: z.number().nullable(),
  upgradeCost: z.number().nullable(),
  upgradeCurrency: z.string().nullable(),
  upgradeTimeOriginal: z.string().nullable(),
  upgradeTimeSeconds: z.number().nullable(),
  hitpoints: z.number().nullable(),
  damagePerSecond: z.number().nullable(),
  damagePerShot: z.number().nullable().optional(),
  range: z.string().nullable().optional(),
  attackSpeed: z.string().nullable().optional(),
  damageType: z.string().nullable().optional(),
  unitTypeTargeted: z.string().nullable().optional(),
  experienceGained: z.number().nullable().optional(),
  capacity: z.string().nullable().optional(),
  productionRate: z.string().nullable().optional(),
  image: ImageMetadataSchema,
  source: SourceTraceSchema
});

export type BuildingLevel = z.infer<typeof BuildingLevelSchema>;

export const BuildingConstructionSchema = z.object({
  townHallRequired: z.number().nullable(),
  source: z.string().nullable().optional(),
  evidence: z.string().nullable().optional(),
  confidence: z.enum(['verified', 'inferred', 'unverified', 'missing']).optional()
});

export type BuildingConstruction = z.infer<typeof BuildingConstructionSchema>;

export const BuildingWikiMetaSchema = z.object({
  url: z.string(),
  pageTitle: z.string(),
  resolvedTitle: z.string(),
  pageId: z.number().optional(),
  revisionId: z.number().nullable(),
  lastUpdated: z.string().nullable()
});

export type BuildingWikiMeta = z.infer<typeof BuildingWikiMetaSchema>;

export const ExtractedBuildingSchema = z.object({
  name: z.string(),
  category: z.string(),
  village: z.string(),
  wiki: BuildingWikiMetaSchema,
  construction: BuildingConstructionSchema,
  levels: z.array(BuildingLevelSchema),
  maxLevel: z.number().nullable(),
  maxLevelTownHall: z.number().nullable(),
  extractionStatus: z.enum(['pending', 'success', 'partial', 'failed']),
  generalStats: z.object({
    range: z.string().nullable().optional(),
    attackSpeed: z.string().nullable().optional(),
    damageType: z.string().nullable().optional(),
    unitTypeTargeted: z.string().nullable().optional()
  }).optional(),
  notes: z.array(z.string()).optional()
});

export type ExtractedBuilding = z.infer<typeof ExtractedBuildingSchema>;

export interface ValidationItem {
  field: string;
  level?: number;
  status: ConfidenceLevel;
  value: any;
  message: string;
  evidence?: string;
}

export interface BuildingValidationReport {
  buildingName: string;
  totalLevels: number;
  verifiedLevels: number;
  inferredLevels: number;
  unverifiedLevels: number;
  missingLevels: number;
  items: ValidationItem[];
  summary: {
    levelsValid: boolean;
    imagesValid: boolean;
    durationsValid: boolean;
    costsValid: boolean;
    townHallValid: boolean;
    overallStatus: 'PASS' | 'WARNING' | 'FAIL';
  };
}

export interface TownHallProgressionMap {
  [buildingName: string]: {
    constructionTownHall: number | null;
    currentMaxLevel: number | null;
    maxLevelTownHall: number | null;
    levelsAtTownHall: { [thLevel: number]: number };
  };
}

export interface ImageManifestEntry {
  building: string;
  level: number;
  filename: string | null;
  url: string | null;
  confidence: ConfidenceLevel;
  width?: number | null;
  height?: number | null;
  size?: number | null;
  mime?: string | null;
  sha1?: string | null;
}
