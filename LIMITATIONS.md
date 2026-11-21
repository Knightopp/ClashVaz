# CoC Data Engine — Phase 2 Extraction Notes & Edge Cases

## 1. Multi-Mode Variations & Merged Defenses
- Merged defenses introduced in Town Hall 16/17 (Ricochet Cannon, Multi-Archer Tower, Multi-Gear Tower, Revenge Tower, Super Wizard Tower, Spiky Tower, Firecracker Tower) are discovered as distinct defense entities with their own upgrade level tables, construction costs, and appearance images.
- Geared-up variations on basic defenses (Double Cannon, Fast Attack Archer Tower, Multi Mortar) are retained as secondary mode tables in the source wiki pages and classified with `tableType: "geared-up"`.

## 2. Image Range Mapping in Traps & Seasonal Obstacles
- Several traps (such as Bombs and Spring Traps) share visual appearances across pairs of levels (e.g. `Level 1-2`, `Level 3-4`). Our `ImageExtractor` dynamically maps the appearance image across every level in the defined range with verified confidence.
- Seasonal traps (Pumpkin Bomb, Santa Strike, Freeze Trap, Shrink Trap) are single-level historical/temporary traps and are extracted as 1-level entities.

## 3. Town Hall Weapon Defense Progression
- Town Hall defense weapon modes (Giga Tesla TH12, Giga Inferno TH13-16, Inferno Artillery TH17, Guardians TH18) have their own subpages on the wiki. The primary `Town Hall` entity extracts the full progression of Town Hall upgrade levels (TH1 to TH19) along with HP, storage capacities, build costs, and build durations.

## 4. Construction vs. Upgrade Town Hall Level
- For high-level defenses (e.g., Eagle Artillery, Scattershot, Monolith, Spell Tower, Firespitter), the construction requirement is explicitly derived from `{{NumberAvailable}}` (e.g. `TH11=1` for Eagle Artillery, `TH13=2` for Scattershot, `TH15=1` for Monolith, `TH17=2` for Firespitter), while the upgrade requirement is extracted from the `Town Hall Level Required` column.

## 5. Rate Limiting and Incremental Synchronization
- The `SyncEngine` queries MediaWiki revision IDs (`revid`) to perform delta synchronization. Unchanged pages are skipped entirely, minimizing API traffic and ensuring sub-second sync runs.
