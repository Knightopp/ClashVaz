import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { runFullExtraction, syncEngine } from './index.js';
import { progressionParser } from './parsers/progressionParser.js';
import { progressionValidator } from './validation/validateProgression.js';
import { csvExporter } from './utils/csvExporter.js';
import { logger } from './utils/logger.js';
import { ExtractedBuilding } from './types/building.js';
import { TownHallProgression } from './types/progression.js';

import { villageManager } from './utils/villageManager.js';
import { villageExportParser } from './parsers/villageExportParser.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend and downloaded image assets
app.use(express.static(path.resolve(process.cwd(), 'public')));
app.use('/downloads', express.static(path.resolve(process.cwd(), 'downloads')));

// In-memory cache for proxied images
const imageCache = new Map<string, { buffer: Buffer; contentType: string }>();

// API: Proxy image to bypass Fandom/Wikia hotlink referrer protection
app.get('/api/proxy-image', async (req, res) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    return res.status(400).send('Missing url parameter');
  }

  if (!imageUrl.includes('static.wikia.nocookie.net') && !imageUrl.includes('fandom.com') && !imageUrl.includes('assets.clashk.ing')) {
    return res.status(400).send('Invalid image host');
  }

  if (imageCache.has(imageUrl)) {
    const cached = imageCache.get(imageUrl)!;
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(cached.buffer);
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'VazoClash-Extractor/1.0 (Reverse Engineering Prototype)'
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(`Failed fetching upstream image: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    imageCache.set(imageUrl, { buffer, contentType });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (err: any) {
    logger.warn('Server', `Failed proxying image ${imageUrl}: ${err.message}`);
    res.status(500).send(`Image proxy error: ${err.message}`);
  }
});

// Helper to read JSON data safely
function readJsonFile<T>(filename: string, defaultValue: T): T {
  const filePath = path.resolve(process.cwd(), 'data', filename);
  if (!fs.existsSync(filePath)) return defaultValue;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return defaultValue;
  }
}

// API: Get current extracted data
app.get('/api/data', (req, res) => {
  const buildings = readJsonFile<ExtractedBuilding[]>('extracted_buildings.json', []);
  const validations = readJsonFile<Record<string, any>>('validation_reports.json', {});
  const progression = readJsonFile<Record<string, any>>('th_progression.json', {});
  res.json({ buildings, validations, progression });
});

// API: Get summary statistics for admin UI
app.get('/api/stats', (req, res) => {
  const buildings = readJsonFile<ExtractedBuilding[]>('extracted_buildings.json', []);
  const validations = readJsonFile<Record<string, any>>('validation_reports.json', {});

  let totalLevels = 0;
  let totalImages = 0;
  let verifiedImages = 0;
  let missingFields = 0;
  let failedPages = 0;

  for (const b of buildings) {
    totalLevels += b.levels.length;
    for (const lvl of b.levels) {
      if (lvl.image.url) {
        totalImages++;
        if (lvl.image.confidence === 'verified') {
          verifiedImages++;
        }
      }
    }

    const v = validations[b.name];
    if (v) {
      missingFields += v.missingLevels || 0;
      if (v.summary.overallStatus === 'FAIL') failedPages++;
    }
  }

  res.json({
    totalBuildings: buildings.length,
    totalLevels,
    totalImages,
    verifiedImages,
    missingFields,
    failedPages
  });
});

// API: Get logs
app.get('/api/logs', (req, res) => {
  const memoryLogs = logger.getLogs();
  if (memoryLogs.length > 0) {
    return res.json(memoryLogs);
  }
  const fileLogs = readJsonFile<any[]>('extraction_logs.json', []);
  res.json(fileLogs);
});

// API: Trigger Full Extraction
app.post('/api/extract', async (req, res) => {
  try {
    logger.info('Server', 'API trigger: starting full extraction...');
    const result = await runFullExtraction(true);
    res.json({
      success: true,
      timestamp: result.timestamp,
      totalBuildings: result.totalBuildings,
      totalLevels: result.totalLevels,
      buildings: result.buildings,
      validations: result.validations
    });
  } catch (err: any) {
    logger.error('Server', 'Extraction failed', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Trigger Incremental Synchronization
app.post('/api/sync', async (req, res) => {
  try {
    logger.info('Server', 'API trigger: starting incremental sync...');
    const result = await syncEngine.runIncrementalSync(true);
    const buildings = readJsonFile<ExtractedBuilding[]>('extracted_buildings.json', []);
    const validations = readJsonFile<Record<string, any>>('validation_reports.json', {});
    res.json({
      success: true,
      result,
      buildings,
      validations
    });
  } catch (err: any) {
    logger.error('Server', 'Incremental sync failed', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Export Full JSON
app.get('/api/export', (req, res) => {
  const filePath = path.resolve(process.cwd(), 'data', 'extracted_buildings.json');
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'No data file found.' });
  res.download(filePath, 'clash_of_clans_home_village_database.json');
});

// API: Export by Category
app.get('/api/export/category/:category', (req, res) => {
  const targetCategory = req.params.category.toLowerCase();
  const buildings = readJsonFile<ExtractedBuilding[]>('extracted_buildings.json', []);
  const filtered = buildings.filter(b => b.category.toLowerCase() === targetCategory);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=coc_${targetCategory}_buildings.json`);
  res.send(JSON.stringify(filtered, null, 2));
});

// API: Export Individual Building
app.get('/api/export/building/:name', (req, res) => {
  const buildingName = decodeURIComponent(req.params.name).toLowerCase();
  const buildings = readJsonFile<ExtractedBuilding[]>('extracted_buildings.json', []);
  const building = buildings.find(b => b.name.toLowerCase() === buildingName);

  if (!building) return res.status(404).json({ error: 'Building not found.' });

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=${building.name.replace(/\s+/g, '_')}.json`);
  res.send(JSON.stringify(building, null, 2));
});

// API: Export Image Manifest
app.get('/api/export/image-manifest', (req, res) => {
  const filePath = path.resolve(process.cwd(), 'data', 'image_manifest.json');
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Manifest not found.' });
  res.download(filePath, 'clash_of_clans_image_manifest.json');
});

// API: Export Town Hall Progression
app.get('/api/export/th-progression', (req, res) => {
  const filePath = path.resolve(process.cwd(), 'data', 'th_progression.json');
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Progression matrix not found.' });
  res.download(filePath, 'clash_of_clans_town_hall_progression.json');
});

// API: Official Supercell Progression Reference (Heroes, Troops, Spells, Pets, Buildings)
app.get('/api/official-progression', (req, res) => {
  const filePath = path.resolve(process.cwd(), 'data', 'official_sc_progression.json');
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Official progression data not found.' });
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  res.json(data);
});

// ==========================================
// PHASE 3: TOWN HALL PROGRESSION ENDPOINTS
// ==========================================

// API: Get full Town Hall progression database
app.get('/api/progression', (req, res) => {
  const progressions = readJsonFile<TownHallProgression[]>('th_progression.json', []);
  const validation = readJsonFile<any>('progression_validation.json', null);
  const thImages = readJsonFile<Record<string, string>>('th_images.json', {});
  res.json({
    totalTownHalls: progressions.length,
    maxTownHall: progressions.length > 0 ? progressions[progressions.length - 1].townHall : 0,
    progressions,
    validation,
    thImages
  });
});

// API: Get Town Hall image map
app.get('/api/th-images', (req, res) => {
  const images = readJsonFile<Record<string, string>>('th_images.json', {});
  res.json(images);
});

// API: Get Clash of Clans authentic game icons
app.get('/api/icons', (req, res) => {
  const icons = readJsonFile<Record<string, { url: string; width: number; height: number; mime: string }>>('game_icons.json', {});
  res.json(icons);
});

// API: Get progression for a single Town Hall
app.get('/api/progression/th/:level', (req, res) => {
  const level = parseInt(req.params.level, 10);
  const progressions = readJsonFile<TownHallProgression[]>('th_progression.json', []);
  const prog = progressions.find(p => p.townHall === level);
  if (!prog) {
    return res.status(404).json({ error: `Town Hall ${level} progression record not found.` });
  }
  res.json(prog);
});

// API: Compare two Town Hall levels
app.get('/api/progression/compare', (req, res) => {
  const fromTH = parseInt(req.query.from as string, 10);
  const toTH = parseInt(req.query.to as string, 10);

  if (isNaN(fromTH) || isNaN(toTH)) {
    return res.status(400).json({ error: 'Both "from" and "to" numeric parameters are required.' });
  }

  const progressions = readJsonFile<TownHallProgression[]>('th_progression.json', []);
  const fromProg = progressions.find(p => p.townHall === fromTH);
  const toProg = progressions.find(p => p.townHall === toTH);

  if (!fromProg || !toProg) {
    return res.status(404).json({ error: 'One or both Town Hall progression records not found.' });
  }

  const comparison = progressionParser.compareTownHalls(fromProg, toProg);
  res.json(comparison);
});

// API: Get building progression history across all Town Halls
app.get('/api/progression/building/:id', (req, res) => {
  const buildingId = req.params.id.toLowerCase();
  const progressions = readJsonFile<TownHallProgression[]>('th_progression.json', []);
  const history = progressionParser.getBuildingHistory(buildingId, progressions);

  if (!history) {
    return res.status(404).json({ error: `Building progression history for "${buildingId}" not found.` });
  }
  res.json(history);
});

// API: Trigger Re-synchronization of Town Hall Progression
app.post('/api/sync-progression', async (req, res) => {
  try {
    logger.info('Server', 'API trigger: re-building Town Hall progression database...');
    const { progressions, maxTownHall } = await progressionParser.buildProgressionDatabase();

    const buildingsPath = path.resolve(process.cwd(), 'data', 'extracted_buildings.json');
    const buildings: ExtractedBuilding[] = fs.existsSync(buildingsPath)
      ? JSON.parse(fs.readFileSync(buildingsPath, 'utf-8'))
      : [];

    const validationReport = progressionValidator.validate(progressions, buildings);
    const dataDir = path.resolve(process.cwd(), 'data');

    fs.writeFileSync(path.join(dataDir, 'th_progression.json'), JSON.stringify(progressions, null, 2));
    fs.writeFileSync(path.join(dataDir, 'progression_validation.json'), JSON.stringify(validationReport, null, 2));

    const qtyCsv = csvExporter.generateQuantityMatrixCsv(progressions);
    fs.writeFileSync(path.join(dataDir, 'th_quantities_matrix.csv'), qtyCsv);

    const lvlCsv = csvExporter.generateMaxLevelMatrixCsv(progressions);
    fs.writeFileSync(path.join(dataDir, 'th_maxlevels_matrix.csv'), lvlCsv);

    const sumCsv = csvExporter.generateSummaryCsv(progressions);
    fs.writeFileSync(path.join(dataDir, 'th_progression_summary.csv'), sumCsv);

    res.json({
      success: true,
      maxTownHall,
      totalTownHalls: progressions.length,
      validation: validationReport
    });
  } catch (err: any) {
    logger.error('Server', 'Sync progression failed', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Export Progression CSVs
app.get('/api/export/progression/csv', (req, res) => {
  const type = (req.query.type as string || 'summary').toLowerCase();
  const progressions = readJsonFile<TownHallProgression[]>('th_progression.json', []);

  if (progressions.length === 0) {
    return res.status(404).json({ error: 'No progression data found to export.' });
  }

  let csvContent = '';
  let filename = '';

  if (type === 'quantities') {
    csvContent = csvExporter.generateQuantityMatrixCsv(progressions);
    filename = 'coc_th_quantities_matrix.csv';
  } else if (type === 'maxlevels') {
    csvContent = csvExporter.generateMaxLevelMatrixCsv(progressions);
    filename = 'coc_th_max_levels_matrix.csv';
  } else {
    csvContent = csvExporter.generateSummaryCsv(progressions);
    filename = 'coc_th_progression_summary.csv';
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(csvContent);
});

// API: Export Single Town Hall JSON
app.get('/api/export/progression/th/:level', (req, res) => {
  const level = parseInt(req.params.level, 10);
  const progressions = readJsonFile<TownHallProgression[]>('th_progression.json', []);
  const prog = progressions.find(p => p.townHall === level);

  if (!prog) return res.status(404).json({ error: `Town Hall ${level} progression not found.` });

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=coc_th_${level}_progression.json`);
  res.send(JSON.stringify(prog, null, 2));
});

// ==========================================
// PHASE 4: VILLAGE IMPORTER & BASE BUILDER
// ==========================================

// API: Get current village profile and historical snapshots
app.get('/api/village/current', (req, res) => {
  const data = villageManager.getProfileData();
  res.json(data);
});

// API: Validate village export without saving (preview)
app.post('/api/village/validate', (req, res) => {
  const content = req.body.rawExport || req.body;
  const validation = villageExportParser.validateExport(content);
  if (!validation.isValid) {
    return res.status(400).json({ success: false, error: validation.error });
  }
  res.json({ success: true, preview: validation.preview });
});

// API: Import Village (commits snapshot and updates profile)
app.post('/api/village/import', (req, res) => {
  try {
    const content = req.body.rawExport || req.body;
    const validation = villageExportParser.validateExport(content);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const rawExport = (typeof content === 'string') ? JSON.parse(content) : content;
    const result = villageManager.saveImport(rawExport);
    res.json({
      success: true,
      profile: result.profile,
      snapshot: result.snapshot
    });
  } catch (err: any) {
    logger.error('Server', 'Village import failed', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Get all saved layouts
app.get('/api/village/layouts', (req, res) => {
  const layouts = villageManager.getLayouts();
  res.json(layouts);
});

// API: Save or update layout
app.post('/api/village/layouts', (req, res) => {
  try {
    const layout = req.body;
    if (!layout || !layout.name) {
      return res.status(400).json({ error: 'Layout name is required' });
    }
    const saved = villageManager.saveLayout(layout);
    res.json({ success: true, layout: saved });
  } catch (err: any) {
    logger.error('Server', 'Save layout failed', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Delete layout
app.delete('/api/village/layouts/:id', (req, res) => {
  const layoutId = req.params.id;
  const success = villageManager.deleteLayout(layoutId);
  if (!success) {
    return res.status(404).json({ error: 'Layout not found' });
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`\n================================================================`);
  console.log(`   VAZOCLASH PROTOTYPE SERVER RUNNING AT: http://localhost:${PORT}`);
  console.log(`================================================================\n`);
});
