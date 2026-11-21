# CoC Data Engine — Phase 2: Complete Home Village Database

## Overview
**VazoClash (CoC Data Engine Phase 2)** is an automated MediaWiki extraction, synchronization, and validation system built in TypeScript. It extracts a comprehensive, verified database of all Clash of Clans **Home Village** buildings, defenses, army structures, resources, and traps directly from the [Clash of Clans Fandom MediaWiki API](https://clashofclans.fandom.com/api.php).

---

## Phase 2 Scope & Accomplishments

- **Strict Scope Isolation**: Extracted **exclusively Home Village** content. Excluded all Builder Base buildings/troops and Clan Capital districts.
- **56 Discovered Home Village Structures**:
  - **Defenses (26)**: Cannon, Archer Tower, Mortar, Air Defense, Wizard Tower, Air Sweeper, Hidden Tesla, Bomb Tower, X-Bow, Inferno Tower, Eagle Artillery, Scattershot, Builder's Hut, Spell Tower, Monolith, Multi-Archer Tower, Ricochet Cannon, Multi-Gear Tower, Firespitter, Revenge Tower, Super Wizard Tower, Spiky Tower, Firecracker Tower, Hot Candle, Hero Hunter, Cake-A-Pult.
  - **Army Buildings (11)**: Army Camp, Barracks, Dark Barracks, Laboratory, Spell Factory, Dark Spell Factory, Workshop, Pet House, Blacksmith, Hero Hall, Squad Barracks.
  - **Resources (7)**: Gold Mine, Elixir Collector, Gold Storage, Elixir Storage, Dark Elixir Drill, Dark Elixir Storage, Clan Castle.
  - **Traps (12)**: Bomb, Spring Trap, Giant Bomb, Air Bomb, Seeking Air Mine, Skeleton Trap, Tornado Trap, Giga Bomb, Pumpkin Bomb, Santa Strike, Freeze Trap, Shrink Trap.
- **572 Extracted Upgrade Levels**:
  - Upgrade Costs & Currencies (Gold, Elixir, Dark Elixir, Gems)
  - Upgrade Durations (original formatted strings + exact normalized seconds)
  - Combat Statistics (HP, DPS, Damage per Shot/Hit, Range, Attack Speed, Targets, Damage Type)
  - Economic Statistics (Resource Capacity, Production Rate)
  - Town Hall Requirements (distinguishing construction requirement from upgrade requirement)
- **572 Image Level Mappings & Manifest**:
  - Filenames, dimensions, CDN URLs, SHA-1 hashes, and confidence statuses (`VERIFIED`, `INFERRED`, `MISSING`)
- **Complete Town Hall Progression Matrix (TH 1 to 19)**:
  - Progression map showing maximum available level of each building at each Town Hall level.
- **Incremental Synchronization**:
  - Compares MediaWiki revision IDs (`revid`) to re-extract modified pages and add newly created buildings without overwriting valid existing data.
- **Export Formats**:
  - Full Home Village JSON
  - Per-category JSON (`/api/export/category/:category`)
  - Individual building JSON (`/api/export/building/:name`)
  - Image Manifest JSON (`/api/export/image-manifest`)
  - Town Hall Progression JSON (`/api/export/th-progression`)

---

## Database Summary Metrics

| Metric | Count |
|---|---|
| **Total Home Village Buildings** | **56** |
| **Total Upgrade Levels Extracted** | **572** |
| **Total Level Images Extracted** | **451** |
| **Verified Image Mappings** | **451** |
| **Town Hall Progression Matrix** | **56 Buildings &times; 19 Town Halls** |
| **Failed Pages** | **0** |
| **Overall Validation Status** | **PASS** |

---

## Project Structure

```
src/
├── api/
│   ├── mediawiki.ts             # Throttled MediaWiki client with batch imageinfo queries
│   └── pageResolver.ts          # Disambiguation & tabber subpage resolver
├── discovery/
│   ├── buildingDiscovery.ts     # Dynamic Home Village building discovery engine
│   └── syncEngine.ts            # Incremental synchronization engine (checks revids)
├── extraction/
│   ├── extractWikitext.ts       # Wikitext & sections extractor
│   ├── extractTables.ts         # Wikitable cell & HTML table parser (Cheerio + Wikitext)
│   ├── extractImages.ts         # Level-to-image mapper (flexbox ranges & galleries)
│   └── extractMetadata.ts       # Construction TH requirements and combat properties
├── parsers/
│   ├── buildingParser.ts        # Building entity orchestrator
│   ├── upgradeParser.ts         # Dynamic column parser (HP, DPS, Cost, Time, TH, Capacity, Production)
│   ├── durationParser.ts        # Human duration parser (converts 5s, 30m, 1d 12h into exact seconds)
│   └── townHallParser.ts        # Town Hall level parser
├── normalization/
│   ├── normalizeCosts.ts        # Cost cleaner & currency detector (Gold, Elixir, Dark Elixir)
│   ├── normalizeDurations.ts    # Duration normalizer preserving original strings
│   └── normalizeLevels.ts       # Sequential level validator and sorter
├── validation/
│   ├── validateBuilding.ts      # Zod schema validation & validation report generator
│   ├── validateImages.ts        # Image URL accessibility and confidence validator
│   └── validateUpgradeData.ts   # Level sequence, cost, duration, and TH validator
├── types/
│   └── building.ts              # TypeScript interfaces & Zod validation schemas
├── utils/
│   ├── logger.ts                # Structured memory & file audit logger
│   └── progressionEngine.ts     # Town Hall progression matrix & image manifest generator
├── index.ts                     # CLI runner for full extraction & incremental sync
├── milestone.ts                 # Milestone 1 reconnaissance runner
└── server.ts                    # Express server with REST API, image proxy & admin frontend
public/
└── index.html                   # Utilitarian frontend with filters, metrics, tables & export
data/
├── extracted_buildings.json     # Complete Home Village database (56 buildings, 572 levels)
├── th_progression.json          # Town Hall progression matrix (TH 1 to 19)
├── image_manifest.json          # Complete image manifest (572 level records)
├── validation_reports.json      # Comprehensive field validation reports
└── extraction_logs.json         # Complete audit trail logs
downloads/
└── images/                      # Downloaded representative building level images
```

---

## How to Run & Use

### 1. Launch Web Interface & API Server
```bash
npm start
```
Navigate to [http://localhost:3000](http://localhost:3000).
- Filter by Category: `Defenses`, `Army Buildings`, `Resources`, `Traps`, `Other Structures`
- Filter by Town Hall: `Town Hall 1` through `Town Hall 19`
- View full tables, original images, and validation reports
- Export JSON database, Town Hall progression, or Image manifest with 1 click

### 2. Run Full Extraction CLI
```bash
npm run extract
```

### 3. Run Incremental Synchronization CLI
```bash
npm run sync
```
*Checks live Wiki revision IDs, skips unchanged pages, re-extracts modified records, and appends newly added buildings.*

---

## API Endpoints

- `GET /api/data`: Full database + validations + TH progression
- `GET /api/stats`: Summary counts (buildings, levels, images, verified, missing, failed)
- `GET /api/export`: Downloads `clash_of_clans_home_village_database.json`
- `GET /api/export/category/:category`: Downloads JSON filtered by category (e.g. `/api/export/category/Defense`)
- `GET /api/export/building/:name`: Downloads JSON for a single building (e.g. `/api/export/building/Eagle%20Artillery`)
- `GET /api/export/th-progression`: Downloads `clash_of_clans_town_hall_progression.json`
- `GET /api/export/image-manifest`: Downloads `clash_of_clans_image_manifest.json`
- `POST /api/extract`: Triggers full extraction
- `POST /api/sync`: Triggers incremental synchronization
- `GET /api/proxy-image?url=...`: Proxies Wikia CDN images to bypass referrer hotlink protection
