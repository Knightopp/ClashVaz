import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.resolve(__dirname, '../../public/index.html');

let content = fs.readFileSync(indexPath, 'utf8');

const newStyles = `  <style>
    /* -------------------------------------------------------------
       MONOCHROMATIC OBSIDIAN BLACK & WHITE THEME
       - Clean, minimal, high-contrast grayscale aesthetic
       - Deep matte black canvas (#09090b, #000000)
       - Sleek charcoal card panels (#141416, #18181b)
       - Precision 1px borders (#27272a, #3f3f46, #ffffff)
       - White primary typography (#ffffff), muted grey secondary (#a1a1aa, #71717a)
       - Strictly monochromatic tags and controls (NO pink, purple, orange, green)
    -------------------------------------------------------------- */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background: #09090b;
      color: #ffffff;
      font-family: 'Nunito', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      font-weight: 700;
      line-height: 1.4;
      height: 100vh;
      overflow: hidden;
      user-select: none;
      -webkit-font-smoothing: antialiased;
    }

    /* Scrollbar */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #09090b;
    }
    ::-webkit-scrollbar-thumb {
      background: #27272a;
      border-radius: 99px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #3f3f46;
    }

    /* App Frame: 3 Columns */
    .app-frame {
      display: flex;
      width: 100vw;
      height: 100vh;
      padding: 12px;
      gap: 12px;
      overflow: hidden;
      background: #09090b;
    }

    /* ============================================================
       COLUMN 1: LEFT SIDEBAR (~215px)
    ============================================================ */
    .left-sidebar {
      width: 215px;
      flex-shrink: 0;
      background: #111113;
      border: 1px solid #27272a;
      border-radius: 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 18px 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
    }

    .brand-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 6px 14px 6px;
      border-bottom: 1px solid #27272a;
      margin-bottom: 12px;
    }

    .brand-logo {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .brand-logo svg {
      width: 18px;
      height: 18px;
      fill: #000000;
    }

    .brand-text h1 {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 18px;
      letter-spacing: 0.5px;
      color: #ffffff;
      line-height: 1.1;
    }

    .brand-text span {
      font-size: 10px;
      color: #71717a;
      display: block;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 800;
    }

    .nav-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 12px;
      border-radius: 10px;
      color: #a1a1aa;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.15s ease;
      position: relative;
      border: 1px solid transparent;
    }

    .nav-item svg {
      width: 17px;
      height: 17px;
      fill: currentColor;
      transition: fill 0.15s ease;
      flex-shrink: 0;
    }

    .nav-coc-icon {
      width: 18px;
      height: 18px;
      object-fit: contain;
      flex-shrink: 0;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
    }

    .brand-logo-img {
      width: 22px;
      height: 22px;
      object-fit: contain;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
    }

    .axis-stud-coc {
      position: absolute;
      top: 17px;
      width: 13px;
      height: 13px;
      object-fit: contain;
      transform: translateX(-50%);
      z-index: 6;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7));
    }

    .builder-coc-avatar {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      object-fit: cover;
      background: #18181b;
      border: 1px solid #3f3f46;
      flex-shrink: 0;
    }

    .nav-item:hover {
      background: #18181b;
      color: #ffffff;
      border-color: #27272a;
    }

    /* Active Item: Clean flat monochromatic highlight matching reference */
    .nav-item.active {
      background: #27272a;
      border: 1px solid rgba(255, 255, 255, 0.22);
      color: #ffffff;
    }

    .nav-item.active svg {
      fill: #ffffff;
    }

    .sidebar-footer {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 12px;
      border-top: 1px solid #27272a;
    }

    .sidebar-footer .nav-item {
      color: #71717a;
      font-size: 12px;
    }

    .sidebar-footer .nav-item:hover {
      color: #ffffff;
    }

    /* ============================================================
       COLUMN 2: CENTRAL MAIN CONTENT (~61% width, scrollable)
    ============================================================ */
    .center-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
      padding-right: 4px;
    }

    /* Search Bar: Clean flat pill */
    .search-bar-wrap {
      width: 100%;
      height: 42px;
      background: #141416;
      border: 1px solid #27272a;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 12px;
      position: sticky;
      top: 0;
      z-index: 10;
      backdrop-filter: blur(8px);
    }

    .search-bar-wrap svg {
      width: 16px;
      height: 16px;
      fill: #71717a;
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #ffffff;
      font-size: 13px;
      font-weight: 700;
      font-family: inherit;
    }

    .search-input::placeholder {
      color: #71717a;
      font-weight: 600;
    }

    /* Section Views */
    .view-container {
      display: none;
      flex-direction: column;
      gap: 12px;
    }

    .view-container.active {
      display: flex;
    }

    /* -------------------------------------------------------------
       DASHBOARD ROW 1: FEATURED BANNER + QUICK STATS
    -------------------------------------------------------------- */
    .dash-row-1 {
      display: flex;
      gap: 12px;
      min-height: 200px;
    }

    .featured-banner {
      flex: 1.6;
      background: #141416;
      border: 1px solid #27272a;
      border-radius: 18px;
      padding: 22px 24px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    }

    .banner-badge {
      display: inline-flex;
      align-items: center;
      background: #202024;
      border: 1px solid #2e2e34;
      color: #d4d4d8;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      width: fit-content;
      margin-bottom: 8px;
    }

    .banner-title {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 28px;
      letter-spacing: 0.5px;
      color: #ffffff;
      line-height: 1.1;
      text-transform: uppercase;
    }

    .banner-subtitle {
      font-size: 13px;
      font-weight: 800;
      color: #a1a1aa;
      margin-top: 3px;
    }

    .banner-desc {
      font-size: 12px;
      color: #71717a;
      max-width: 65%;
      margin-top: 6px;
      line-height: 1.4;
    }

    /* Flat Clean Action Pill Button (NO 3D bevels, Monochromatic) */
    .flat-action-btn {
      background: #ffffff;
      border: none;
      color: #000000;
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 13px;
      letter-spacing: 0.5px;
      padding: 7px 18px;
      border-radius: 9999px;
      cursor: pointer;
      width: fit-content;
      margin-top: 14px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      font-weight: 800;
    }

    .flat-action-btn:hover {
      background: #e4e4e7;
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.25);
    }

    .banner-artwork {
      position: absolute;
      right: 14px;
      bottom: 8px;
      height: 175px;
      width: 180px;
      object-fit: contain;
      filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.8));
      pointer-events: none;
      transition: all 0.3s ease;
    }

    /* Quick Overview Stat Box */
    .overview-stats-card {
      flex: 1;
      background: #141416;
      border: 1px solid #27272a;
      border-radius: 18px;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    }

    .card-title-clean {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 15px;
      color: #ffffff;
      letter-spacing: 0.3px;
    }

    .stats-2x2-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 8px;
    }

    .stat-mini-box {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 10px;
      padding: 10px;
      display: flex;
      flex-direction: column;
    }

    .stat-mini-val {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 20px;
      color: #ffffff;
    }

    .stat-mini-lbl {
      font-size: 10px;
      color: #71717a;
      font-weight: 800;
      text-transform: uppercase;
      margin-top: 2px;
    }

    /* ============================================================
       AUTHENTIC CLASH EVENT TIMELINE (Monochromatic recreation)
    ============================================================ */
    .timeline-container-card {
      background: #141416;
      border: 1px solid #27272a;
      border-radius: 18px;
      padding: 14px 18px 12px 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    }

    .timeline-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 4px;
    }

    .timeline-title {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 15px;
      color: #ffffff;
      letter-spacing: 0.3px;
    }

    .timeline-scroll-wrap {
      width: 100%;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .timeline-canvas-inner {
      min-width: 820px;
      height: 152px;
      position: relative;
      background: #0f0f11;
      border: 1px solid #27272a;
      border-radius: 14px;
      overflow: hidden;
    }

    /* 17 Grid Columns Background */
    .timeline-grid-bg {
      position: absolute;
      inset: 0;
      display: grid;
      grid-template-columns: repeat(17, 1fr);
      pointer-events: none;
    }

    .grid-col {
      border-right: 1px solid rgba(255, 255, 255, 0.05);
      height: 100%;
      position: relative;
    }

    .grid-col:last-child {
      border-right: none;
    }

    /* Past Time Diagonal Shading (Day 18) */
    .grid-col.col-past {
      background: repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.6) 0px, rgba(0, 0, 0, 0.6) 5px, rgba(255, 255, 255, 0.02) 5px, rgba(255, 255, 255, 0.02) 10px);
    }

    /* Top Dates Ruler Bar */
    .timeline-ruler-row {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 38px;
      display: grid;
      grid-template-columns: repeat(17, 1fr);
      z-index: 8;
    }

    .ruler-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding-top: 4px;
      position: relative;
    }

    .ruler-num {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 13px;
      color: #a1a1aa;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
      line-height: 1;
    }

    .ruler-cell.past-day .ruler-num {
      color: #52525b;
    }

    .ruler-cell.now-day .ruler-num {
      color: #ffffff;
      font-size: 11px;
      margin-bottom: 1px;
    }

    /* "Now" Marker */
    .now-badge-pill {
      background: #ffffff;
      color: #000000;
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 4px;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
      letter-spacing: 0.3px;
      z-index: 10;
    }

    /* Horizontal Axis Baseline */
    .timeline-axis-line {
      position: absolute;
      top: 24px;
      left: 0;
      right: 0;
      height: 2px;
      background: #27272a;
      z-index: 4;
    }

    /* Axis to left of Now */
    .axis-green-segment {
      position: absolute;
      left: 0;
      width: 5.88%;
      height: 2px;
      background: #ffffff;
      box-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
      z-index: 5;
    }

    /* Vertical Glowing "Now" Cursor */
    .now-cursor-line {
      position: absolute;
      left: 5.88%;
      top: 24px;
      bottom: 0;
      width: 2px;
      background: #ffffff;
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
      z-index: 10;
      pointer-events: none;
    }

    /* Hexagonal Silver Studs on Axis */
    .axis-stud {
      position: absolute;
      top: 20px;
      width: 10px;
      height: 10px;
      background: linear-gradient(135deg, #a1a1aa 0%, #52525b 100%);
      clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
      transform: translateX(-50%);
      z-index: 6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
    }

    /* Golden Trophies on Axis (Monochromatic) */
    .axis-trophy {
      position: absolute;
      top: 15px;
      transform: translateX(-50%);
      z-index: 7;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .axis-trophy svg {
      width: 15px;
      height: 15px;
      fill: #ffffff;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7));
    }

    /* Dashed Vertical Guideline Dropping from Trophy */
    .trophy-drop-line {
      position: absolute;
      top: 16px;
      bottom: -100px;
      width: 1px;
      border-left: 1px dashed rgba(255, 255, 255, 0.2);
      pointer-events: none;
    }

    /* Event Capsule Bars (Monochromatic B&W recreation) */
    .timeline-pill-event {
      position: absolute;
      height: 32px;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      padding: 0 10px;
      gap: 7px;
      cursor: pointer;
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 12px;
      letter-spacing: 0.3px;
      white-space: nowrap;
      transition: all 0.15s ease;
      z-index: 6;
    }

    .timeline-pill-event:hover {
      transform: translateY(-1px);
      filter: brightness(1.15);
    }

    /* Raid Weekend: Monochromatic dark charcoal pill */
    .pill-raid-weekend {
      background: #27272a;
      border: 1px solid #3f3f46;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      color: #ffffff;
    }

    .pill-raid-weekend svg {
      width: 19px;
      height: 19px;
      flex-shrink: 0;
    }

    /* Clan Games: Charcoal pill */
    .pill-clan-games {
      background: #1f1f23;
      border: 1px solid #333338;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      color: #ffffff;
    }

    .pill-clan-games svg {
      width: 19px;
      height: 19px;
      flex-shrink: 0;
    }

    /* CWL: White bordered sleek pill */
    .pill-cwl {
      background: #222226;
      border: 1.5px solid #ffffff;
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.15), 0 4px 12px rgba(0, 0, 0, 0.5);
      color: #ffffff;
    }

    .pill-cwl svg {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    /* Mini Milestone Badges */
    .timeline-character-badge {
      position: absolute;
      top: 114px;
      transform: translateX(-50%);
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
      z-index: 8;
      cursor: pointer;
      transition: transform 0.15s ease;
      background: #27272a;
      border: 1px solid #3f3f46;
    }

    .timeline-character-badge:hover {
      transform: translateX(-50%) scale(1.15);
    }

    .badge-potion, .badge-fiend, .badge-goldpass, .badge-trader {
      background: #27272a;
      border: 1px solid #3f3f46;
    }

    .badge-trader img {
      border-radius: 50%;
    }

    .timeline-character-badge svg {
      width: 14px;
      height: 14px;
      fill: #ffffff;
    }

    /* Zoom Glass Button in Bottom Right */
    .timeline-zoom-btn {
      position: absolute;
      right: 12px;
      bottom: 8px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #18181b;
      border: 1px solid #27272a;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
      cursor: pointer;
      z-index: 12;
      transition: all 0.15s ease;
    }

    .timeline-zoom-btn:hover {
      background: #27272a;
      border-color: #3f3f46;
    }

    .timeline-zoom-btn svg {
      width: 13px;
      height: 13px;
      fill: #ffffff;
    }

    /* ============================================================
       ROW 3: TOWN HALL PROGRESSION TIERS
    ============================================================ */
    .section-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 2px 4px;
    }

    .section-heading {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 15px;
      color: #ffffff;
      letter-spacing: 0.3px;
    }

    .section-arrow {
      color: #71717a;
      font-size: 12px;
      font-weight: 800;
      text-decoration: none;
      cursor: pointer;
      transition: color 0.15s ease;
    }

    .section-arrow:hover {
      color: #ffffff;
    }

    .tri-card-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .obsidian-card {
      background: #141416;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      flex-direction: column;
      gap: 8px;
      position: relative;
    }

    .obsidian-card:hover {
      border-color: #3f3f46;
      background: #1a1a1e;
      transform: translateY(-2px);
    }

    /* Active Highlighted Town Hall Card (Clean Monochromatic White Border) */
    .obsidian-card.active-th-card {
      border: 1px solid #ffffff;
      box-shadow: 0 0 16px rgba(255, 255, 255, 0.1);
      background: #1c1c20;
    }

    .card-thumb-wrap {
      width: 100%;
      height: 95px;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .card-thumb-img {
      max-height: 80px;
      max-width: 90%;
      object-fit: contain;
      filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.7));
      transition: transform 0.2s ease;
    }

    .obsidian-card:hover .card-thumb-img {
      transform: scale(1.05);
    }

    .th-tier-tag {
      position: absolute;
      top: 6px;
      right: 6px;
      background: #ffffff;
      color: #000000;
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 800;
    }

    .card-title-light {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 14px;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-sub-light {
      font-size: 11px;
      font-weight: 800;
      color: #71717a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ============================================================
       COLUMN 3: RIGHT SIDEBAR (~285px)
    ============================================================ */
    .right-sidebar {
      width: 285px;
      flex-shrink: 0;
      background: #111113;
      border: 1px solid #27272a;
      border-radius: 18px;
      padding: 18px 14px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      overflow-y: auto;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    }

    .profile-header-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .profile-top-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .profile-avatar-wrap {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 1px solid #3f3f46;
      padding: 2px;
      background: #18181b;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .profile-avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .profile-name-wrap {
      flex: 1;
    }

    .profile-name-wrap h2 {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 16px;
      letter-spacing: 0.3px;
      color: #ffffff;
      line-height: 1.1;
    }

    .profile-name-wrap span {
      font-size: 11px;
      color: #71717a;
      font-weight: 700;
    }

    .profile-league-badge {
      width: 24px;
      height: 24px;
      fill: #ffffff;
    }

    /* Progress bar */
    .profile-progress-wrap {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 800;
    }

    .progress-label-name {
      color: #71717a;
    }

    .progress-label-val {
      color: #ffffff;
    }

    .progress-track {
      width: 100%;
      height: 6px;
      background: #27272a;
      border-radius: 99px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      width: 91%;
      background: #ffffff;
      border-radius: 99px;
      transition: width 0.3s ease;
    }

    .profile-status-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: #71717a;
    }

    .status-badge-active {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #a1a1aa;
      font-weight: 800;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ffffff;
    }

    .right-section-title {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 11px;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      font-weight: 700;
    }

    /* Upgrades list on obsidian cards */
    .upgrade-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .upgrade-item-card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 10px;
      padding: 8px 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .upgrade-item-card:hover {
      background: #202024;
      border-color: #3f3f46;
    }

    .upgrade-icon-wrap {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      background: #27272a;
      border: 1px solid #3f3f46;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .upgrade-icon-wrap svg {
      width: 14px;
      height: 14px;
      fill: #ffffff;
    }

    .upgrade-text-wrap {
      flex: 1;
      overflow: hidden;
    }

    .upgrade-title {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 13px;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .upgrade-time {
      font-size: 11px;
      color: #71717a;
      font-weight: 700;
    }

    /* Builders List */
    .builders-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .builder-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      padding: 4px 6px;
      background: #18181b;
      border-radius: 6px;
      border: 1px solid #27272a;
    }

    .builder-info-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .builder-avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #27272a;
      border: 1px solid #3f3f46;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 900;
      color: #ffffff;
    }

    .builder-name {
      color: #ffffff;
      font-weight: 700;
    }

    .builder-status-tag {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .status-busy {
      background: #27272a;
      color: #ffffff;
      border: 1px solid #3f3f46;
    }

    .status-idle {
      background: #18181b;
      color: #71717a;
      border: 1px solid #27272a;
    }

    /* Quick Metrics */
    .village-stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .v-stat-card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 10px;
      padding: 8px;
      text-align: center;
    }

    .v-stat-num {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 18px;
      color: #ffffff;
    }

    .v-stat-label {
      font-size: 10px;
      color: #71717a;
      font-weight: 800;
      margin-top: 1px;
    }

    /* Strategy Note */
    .strategy-note-card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .strategy-note-quote {
      font-size: 11px;
      color: #a1a1aa;
      font-style: italic;
      font-weight: 700;
      line-height: 1.35;
    }

    .strategy-note-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      color: #71717a;
      font-weight: 800;
      padding-top: 4px;
      border-top: 1px solid #27272a;
    }

    /* ============================================================
       OTHER VIEWS: MY VILLAGE, PROGRESSION, BUILDINGS, PLANNER, STATS
    ============================================================ */
    .view-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 8px;
      border-bottom: 1px solid #27272a;
    }

    .view-title-wrap h2 {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 20px;
      color: #ffffff;
    }

    .view-title-wrap p {
      font-size: 12px;
      color: #71717a;
    }

    .th-pill-selector {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 6px;
    }

    .th-pill {
      padding: 5px 12px;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 99px;
      color: #a1a1aa;
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 12px;
      letter-spacing: 0.3px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .th-pill:hover {
      background: #27272a;
      color: #ffffff;
      border-color: #3f3f46;
    }

    .th-pill.active {
      background: #ffffff;
      color: #000000;
      border-color: #ffffff;
      font-weight: 800;
    }

    .category-tabs {
      display: flex;
      gap: 6px;
    }

    .cat-tab {
      padding: 5px 12px;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 12px;
      color: #a1a1aa;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .cat-tab:hover {
      background: #27272a;
      color: #ffffff;
      border-color: #3f3f46;
    }

    .cat-tab.active {
      background: #ffffff;
      color: #000000;
      border-color: #ffffff;
      font-weight: 800;
    }

    .buildings-explorer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;
    }

    /* Progression Matrix Table */
    .progression-table-wrap {
      width: 100%;
      background: #141416;
      border: 1px solid #27272a;
      border-radius: 16px;
      overflow-x: auto;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    }

    .prog-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      text-align: left;
    }

    .prog-table th {
      background: #18181b;
      color: #a1a1aa;
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 12px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      padding: 10px 14px;
      border-bottom: 1px solid #27272a;
      white-space: nowrap;
    }

    .prog-table td {
      padding: 10px 14px;
      border-bottom: 1px solid #1f1f23;
      color: #ffffff;
      white-space: nowrap;
    }

    .prog-table tr {
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .prog-table tr:hover td {
      background: #1c1c20;
    }

    /* Clean Card Meta */
    .clean-card-meta {
      font-size: 12px;
      font-weight: 600;
      color: #a1a1aa;
      margin-top: 4px;
    }

    /* Badges & Status Tags - Monochromatic Subtle Style */
    .badge-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }

    .badge-cat {
      font-size: 10px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .cat-defense { background: #27272a; color: #ffffff; border: 1px solid #3f3f46; }
    .cat-army { background: #27272a; color: #ffffff; border: 1px solid #3f3f46; }
    .cat-resource { background: #27272a; color: #ffffff; border: 1px solid #3f3f46; }
    .cat-trap { background: #27272a; color: #ffffff; border: 1px solid #3f3f46; }

    .badge-verified {
      background: #27272a;
      color: #ffffff;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 800;
      border: 1px solid #3f3f46;
    }

    .badge-unlocked {
      background: #ffffff;
      color: #000000;
      font-weight: 800;
      border: none;
    }

    .badge-newlevel {
      background: #27272a;
      color: #ffffff;
      border: 1px solid #3f3f46;
      font-weight: 700;
    }

    .badge-active {
      background: #18181b;
      color: #a1a1aa;
      border: 1px solid #27272a;
      font-weight: 600;
    }

    .badge-merged {
      background: #18181b;
      color: #71717a;
      border: 1px solid #27272a;
      font-weight: 600;
    }

    .badge-unavailable {
      background: #111113;
      color: #52525b;
      border: 1px solid #222226;
    }

    /* Modal Dialog */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(6px);
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-overlay.active {
      display: flex;
    }

    .modal-card {
      background: #141416;
      border: 1px solid #27272a;
      border-radius: 18px;
      width: 100%;
      max-width: 840px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);
    }

    .modal-header {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #27272a;
      background: #18181b;
    }

    .modal-header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .modal-header-img {
      width: 46px;
      height: 46px;
      object-fit: contain;
    }

    .modal-title {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 20px;
      color: #ffffff;
      letter-spacing: 0.3px;
    }

    .modal-subtitle {
      font-size: 11px;
      color: #71717a;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 800;
    }

    .modal-close-btn {
      background: #27272a;
      border: 1px solid #3f3f46;
      color: #ffffff;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      transition: all 0.15s ease;
    }

    .modal-close-btn:hover {
      background: #ffffff;
      color: #000000;
    }

    .modal-body {
      padding: 18px 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .level-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .level-table th {
      background: #18181b;
      color: #a1a1aa;
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 12px;
      padding: 8px 12px;
      border-bottom: 1px solid #27272a;
      text-align: left;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .level-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #1f1f23;
      color: #ffffff;
      font-weight: 800;
    }

    .level-table tr:hover td {
      background: #1c1c20;
    }

    .level-img-mini {
      width: 38px;
      height: 38px;
      object-fit: contain;
      vertical-align: middle;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
    }

    /* ========================================================
       TIMELINE ACTIVE UPGRADES EXPANSION & TRADER MILESTONE
    ======================================================== */
    .timeline-upgrades-section {
      position: absolute;
      top: 144px;
      left: 0;
      right: 0;
      padding: 10px 14px;
      border-top: 1px solid #27272a;
      background: rgba(17, 17, 19, 0.98);
      border-radius: 0 0 14px 14px;
      animation: fadeIn 0.25s ease-out;
      z-index: 10;
    }

    .timeline-upgrades-divider {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .timeline-upgrades-label {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 11px;
      color: #a1a1aa;
      letter-spacing: 0.4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .timeline-upgrades-count {
      font-size: 11px;
      color: #ffffff;
      font-weight: 800;
    }

    .timeline-upgrades-tracks {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .timeline-upgrade-row {
      position: relative;
      height: 28px;
      display: flex;
      align-items: center;
      background: #18181b;
      border-radius: 6px;
      border: 1px solid #27272a;
    }

    .timeline-upgrade-bar {
      position: absolute;
      top: 2px;
      bottom: 2px;
      border-radius: 6px;
      background: #27272a;
      border: 1px solid #ffffff;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      padding: 0 8px;
      gap: 6px;
      cursor: pointer;
      z-index: 7;
      transition: all 0.15s ease;
    }

    .timeline-upgrade-bar:hover {
      filter: brightness(1.2);
      transform: translateY(-1px);
    }

    .timeline-upgrade-bar img {
      width: 20px;
      height: 20px;
      object-fit: contain;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));
    }

    .timeline-upgrade-bar span {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 11px;
      color: #ffffff;
      white-space: nowrap;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    }

    .timeline-upgrade-badge {
      margin-left: auto;
      background: rgba(0, 0, 0, 0.6);
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 10px;
      color: #ffffff;
      font-weight: 800;
    }

    /* Topbar Import Button */
    .topbar-import-btn {
      background: #ffffff;
      border: none;
      color: #000000;
      padding: 6px 14px;
      border-radius: 8px;
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 12px;
      letter-spacing: 0.3px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 7px;
      transition: all 0.15s ease;
      font-weight: 800;
    }

    .topbar-import-btn:hover {
      background: #e4e4e7;
      transform: translateY(-1px);
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.3);
    }

    /* ========================================================
       IMPORT VILLAGE MODAL
    ======================================================== */
    .import-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.88);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }

    .import-modal-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    .import-modal-card {
      background: #141416;
      border: 1px solid #27272a;
      border-radius: 16px;
      width: 100%;
      max-width: 760px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);
      overflow: hidden;
    }

    .import-modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid #27272a;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #18181b;
    }

    .import-modal-title {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 17px;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .import-modal-body {
      padding: 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .import-textarea {
      width: 100%;
      height: 150px;
      background: #0d0d0f;
      border: 1px solid #27272a;
      border-radius: 10px;
      padding: 12px;
      color: #ffffff;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 12px;
      line-height: 1.5;
      resize: vertical;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s ease;
    }

    .import-textarea:focus {
      border-color: #ffffff;
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.15);
    }

    .import-btn-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .import-sub-btn {
      background: #18181b;
      border: 1px solid #27272a;
      color: #ffffff;
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 12px;
      padding: 7px 14px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }

    .import-sub-btn:hover {
      background: #27272a;
      border-color: #3f3f46;
    }

    .import-status-box {
      background: #0d0d0f;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 14px;
    }

    .import-status-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .import-status-pill {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .import-status-pill.valid {
      background: #27272a;
      color: #ffffff;
      border: 1px solid #ffffff;
    }

    .import-status-pill.invalid {
      background: #27272a;
      color: #ffffff;
      border: 1px solid #52525b;
    }

    .import-status-pill.waiting {
      background: #18181b;
      color: #71717a;
      border: 1px solid #27272a;
    }

    .import-preview-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }

    .import-preview-cell {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 8px 10px;
      text-align: center;
    }

    .import-preview-val {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 16px;
      color: #ffffff;
      margin-bottom: 2px;
    }

    .import-preview-lbl {
      font-size: 10px;
      color: #71717a;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .import-history-wrap {
      margin-top: 10px;
    }

    .import-history-title {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 13px;
      color: #ffffff;
      margin-bottom: 8px;
    }

    .import-history-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 120px;
      overflow-y: auto;
    }

    .import-history-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #18181b;
      border: 1px solid #27272a;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 11px;
    }

    .import-modal-footer {
      padding: 14px 20px;
      background: #18181b;
      border-top: 1px solid #27272a;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
    }

    /* ========================================================
       VISUAL VILLAGE BUILDER / BASE LAYOUT EDITOR
    ======================================================== */
    .layout-editor-container {
      display: flex;
      flex-direction: column;
      gap: 14px;
      width: 100%;
    }

    .layout-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #141416;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 10px 16px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .layout-toolbar-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .layout-select {
      background: #18181b;
      border: 1px solid #27272a;
      color: #ffffff;
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 13px;
      padding: 6px 12px;
      border-radius: 8px;
      outline: none;
      cursor: pointer;
    }

    .layout-tool-btn {
      background: #18181b;
      border: 1px solid #27272a;
      color: #ffffff;
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 12px;
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s ease;
    }

    .layout-tool-btn:hover {
      background: #27272a;
      border-color: #3f3f46;
    }

    .layout-tool-btn.primary {
      background: #ffffff;
      border: 1px solid #ffffff;
      color: #000000;
      font-weight: 800;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
    }

    .layout-tool-btn.primary:hover {
      background: #e4e4e7;
    }

    .layout-tool-btn.danger {
      background: #27272a;
      border: 1px solid #3f3f46;
      color: #ffffff;
    }

    .layout-tool-btn.danger:hover {
      background: #3f3f46;
    }

    .sandbox-toggle-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 9999px;
      background: #18181b;
      border: 1px solid #27272a;
      color: #71717a;
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 11px;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;
    }

    .sandbox-toggle-pill.active {
      background: #ffffff;
      border-color: #ffffff;
      color: #000000;
      font-weight: 800;
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.25);
    }

    /* Work Area Split Layout */
    .layout-workarea {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 16px;
      height: 720px;
    }

    @media (max-width: 1200px) {
      .layout-workarea {
        grid-template-columns: 1fr;
        height: auto;
      }
    }

    /* Terrain Viewport */
    .layout-canvas-viewport {
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 14px;
      overflow: hidden;
      position: relative;
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 580px;
      user-select: none;
      box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.9);
    }

    .layout-canvas-viewport.grabbing {
      cursor: grabbing;
    }

    .layout-canvas-transform {
      transform-origin: center center;
      position: absolute;
      transition: transform 0.05s linear;
    }

    /* 48x48 Full Map with Border (Blueprint Dark Theme) */
    .coc-terrain-map {
      width: 1152px; /* 48 * 24px */
      height: 1152px;
      background: #111113;
      border: 2px solid #27272a;
      border-radius: 8px;
      position: relative;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.95);
    }

    /* 44x44 Active Grass Playfield */
    .coc-active-playfield {
      position: absolute;
      left: 48px;  /* 2 tiles * 24px */
      top: 48px;
      width: 1056px; /* 44 tiles * 24px */
      height: 1056px;
      background-color: #161619;
      background-image: 
        linear-gradient(45deg, #1c1c20 25%, transparent 25%), 
        linear-gradient(-45deg, #1c1c20 25%, transparent 25%), 
        linear-gradient(45deg, transparent 75%, #1c1c20 75%), 
        linear-gradient(-45deg, transparent 75%, #1c1c20 75%);
      background-size: 48px 48px;
      background-position: 0 0, 0 24px, 24px -24px, -24px 0px;
      border: 2px dashed rgba(255, 255, 255, 0.2);
      outline: 1px solid rgba(0, 0, 0, 0.8);
    }

    /* Grid Lines (Overlay) */
    .coc-grid-overlay {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
      background-size: 24px 24px;
      pointer-events: none;
      z-index: 2;
    }

    /* Center Crosshair */
    .coc-center-marker {
      position: absolute;
      left: 528px;
      top: 528px;
      width: 2px;
      height: 2px;
      background: #ffffff;
      box-shadow: 0 0 10px #ffffff;
      pointer-events: none;
      z-index: 3;
    }

    /* Placed Building Tile */
    .placed-building-tile {
      position: absolute;
      box-sizing: border-box;
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.04);
      cursor: pointer;
      z-index: 5;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .placed-building-tile:hover {
      border-color: #ffffff;
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
      z-index: 10;
    }

    .placed-building-tile.selected {
      border: 2px solid #ffffff;
      box-shadow: 0 0 16px rgba(255, 255, 255, 0.6);
      z-index: 12;
    }

    .placed-building-img {
      width: 90%;
      height: 90%;
      object-fit: contain;
      filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.8));
      pointer-events: none;
    }

    .placed-building-lvl {
      position: absolute;
      bottom: 2px;
      right: 2px;
      background: rgba(0, 0, 0, 0.85);
      border: 1px solid #3f3f46;
      color: #ffffff;
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 9px;
      padding: 0 3px;
      border-radius: 3px;
      pointer-events: none;
      line-height: 1.1;
    }

    /* Floating Selected Building Action Menu */
    .building-action-popup {
      position: absolute;
      top: -38px;
      left: 50%;
      transform: translateX(-50%);
      background: #18181b;
      border: 1px solid #ffffff;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.8);
      border-radius: 6px;
      padding: 3px 6px;
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 20;
      white-space: nowrap;
    }

    .action-popup-btn {
      background: transparent;
      border: none;
      color: #a1a1aa;
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 11px;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      transition: all 0.15s ease;
    }

    .action-popup-btn:hover {
      background: #27272a;
      color: #ffffff;
    }

    .action-popup-btn.remove {
      color: #ffffff;
    }

    .action-popup-btn.remove:hover {
      background: #3f3f46;
      color: #ffffff;
    }

    /* Placement Ghost Indicator */
    .placement-ghost {
      position: absolute;
      box-sizing: border-box;
      pointer-events: none;
      z-index: 15;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: all 0.05s ease;
    }

    .placement-ghost.valid {
      background: rgba(255, 255, 255, 0.25);
      border: 2px solid #ffffff;
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
    }

    .placement-ghost.invalid {
      background: rgba(113, 113, 122, 0.35);
      border: 2px dashed #71717a;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.6);
    }

    .ghost-info-tag {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 3px;
      background: rgba(0, 0, 0, 0.85);
      color: #ffffff;
      white-space: nowrap;
    }

    /* Inventory Drawer Panel */
    .layout-inventory-panel {
      background: #141416;
      border: 1px solid #27272a;
      border-radius: 14px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .inventory-header {
      padding: 12px 14px;
      background: #18181b;
      border-bottom: 1px solid #27272a;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .inventory-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .inventory-title {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 14px;
      color: #ffffff;
    }

    .inventory-placed-ratio {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 12px;
      color: #ffffff;
    }

    .inventory-filter-tabs {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .inventory-tab {
      background: #18181b;
      border: 1px solid #27272a;
      color: #a1a1aa;
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 6px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .inventory-tab.active {
      background: #ffffff;
      border-color: #ffffff;
      color: #000000;
      font-weight: 800;
    }

    .inventory-list {
      padding: 12px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }

    .inventory-card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 10px;
      padding: 8px 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: all 0.15s ease;
      position: relative;
    }

    .inventory-card:hover:not(.disabled) {
      border-color: #3f3f46;
      background: #202024;
      transform: translateX(2px);
    }

    .inventory-card.selected {
      border-color: #ffffff;
      background: #27272a;
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.2);
    }

    .inventory-card.disabled {
      opacity: 0.4;
      cursor: not-allowed;
      filter: grayscale(1);
    }

    .inventory-card-thumb {
      width: 36px;
      height: 36px;
      object-fit: contain;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
      flex-shrink: 0;
    }

    .inventory-card-info {
      flex: 1;
      min-width: 0;
    }

    .inventory-card-name {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 12px;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .inventory-card-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 2px;
      font-size: 10px;
      color: #a1a1aa;
      font-weight: 800;
    }

    .inventory-badge-footprint {
      background: #27272a;
      color: #ffffff;
      padding: 1px 4px;
      border-radius: 4px;
      border: 1px solid #3f3f46;
    }

    .inventory-count-badge {
      font-family: 'Lilita One', cursive, sans-serif;
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 6px;
      background: #27272a;
      border: 1px solid #3f3f46;
      color: #ffffff;
      white-space: nowrap;
    }

    .inventory-card.disabled .inventory-count-badge {
      color: #52525b;
      border-color: #27272a;
      background: #18181b;
    }
  </style>`;

// Replace <style>...</style>
const styleStartIndex = content.indexOf('<style>');
const styleEndIndex = content.indexOf('</style>') + '</style>'.length;

content = content.slice(0, styleStartIndex) + newStyles + content.slice(styleEndIndex);

// Now perform surgical monochromatic replacements in HTML and JS
// 1. November 2026 Schedule
content = content.replace(/color:\s*#a78bfa;\s*font-weight:\s*800;">November 2026 Schedule/g, 'color: #71717a; font-weight: 800;">November 2026 Schedule');

// 2. Active Base: label
content = content.replace(/color:#a78bfa;">Active Base:/g, 'color:#a1a1aa;">Active Base:');

// 3. Stats view numbers (57, 592, 567)
content = content.replace(/color:\s*#f59e0b;\s*margin:\s*8px 0;">57<\/div>/g, 'color: #ffffff; margin: 8px 0;">57</div>');
content = content.replace(/color:\s*#4ade80;\s*margin:\s*8px 0;">592<\/div>/g, 'color: #ffffff; margin: 8px 0;">592</div>');
content = content.replace(/color:\s*#a855f7;\s*margin:\s*8px 0;">567<\/div>/g, 'color: #ffffff; margin: 8px 0;">567</div>');

// 4. Stats view buttons
content = content.replace(/background:#201038;\s*border-color:#6d28d9;/g, 'background:#18181b; border:1px solid #27272a; color:#ffffff;');

// 5. Modal wiki link
content = content.replace(/color:\s*#f59e0b;\s*text-decoration:\s*none;">View Wiki Page/g, 'color: #ffffff; text-decoration: underline;">View Wiki Page');

// 6. Import modal text & buttons
content = content.replace(/color:#cbd5e1;\s*margin-bottom:6px;\s*display:block;">Paste Clash of Clans JSON/g, 'color:#a1a1aa; margin-bottom:6px; display:block;">Paste Clash of Clans JSON');
content = content.replace(/color:#cbd5e1;">Import Validation & Structure Preview:/g, 'color:#a1a1aa;">Import Validation & Structure Preview:');
content = content.replace(/color:#f87171;\s*font-size:12px;\s*font-weight:700;/g, 'color:#ffffff; font-size:12px; font-weight:700;');
content = content.replace(/background:#1c0e33;\s*color:#cbd5e1;\s*border:1px solid rgba\(139,92,246,0.3\);/g, 'background:#18181b; color:#ffffff; border:1px solid #27272a;');

// 7. Progression matrix summary numbers
content = content.replace(/color:\s*#f59e0b;\s*margin:\s*4px 0;">\s*\$\{unlockedCount\}/g, 'color: #ffffff; margin: 4px 0;">\n          ${unlockedCount}');
content = content.replace(/color:\s*#60a5fa;\s*margin:\s*4px 0;">\s*\$\{newLevelCount\}/g, 'color: #ffffff; margin: 4px 0;">\n          ${newLevelCount}');
content = content.replace(/color:\s*#c084fc;\s*margin:\s*4px 0;">\s*\$\{thData\.wallSegments/g, 'color: #ffffff; margin: 4px 0;">\n          ${thData.wallSegments');

// 8. Progression table Qty & Level styles
content = content.replace(/color:\s*#e2e8f0;/g, 'color: #ffffff;');
content = content.replace(/color:\s*#cbd5e1;/g, 'color: #a1a1aa;');

// 9. metaColor in JS
content = content.replace(/const metaColor = isMerged \? '#c084fc' : '#94a3b8';/g, "const metaColor = '#a1a1aa';");

// 10. Building explorer cards prices
content = content.replace(/<span style="color: #94a3b8;">Lv \$\{maxLvl\.level\}<\/span>/g, '<span style="color: #a1a1aa;">Lv ${maxLvl.level}</span>');
content = content.replace(/<span style="color: #fbbf24;">\$\{formatCost\(cost, currency\)\}<\/span>/g, '<span style="color: #ffffff;">${formatCost(cost, currency)}</span>');

// 11. Planner & Modal prices and levels
content = content.replace(/color:\s*#f59e0b;\s*font-size:15px;">Lv \$\{r\.level\.level\}<\/span>/g, 'color: #ffffff; font-size:15px;">Lv ${r.level.level}</span>');
content = content.replace(/color:#c4b5fd;\s*font-weight:800;">Build Time:/g, 'color:#a1a1aa; font-weight:800;">Build Time:');
content = content.replace(/background:#1d0f33;\s*padding:6px 10px;\s*border-radius:8px;\s*border:1px solid rgba\(139,\s*92,\s*246,\s*0\.2\);/g, 'background:#18181b; padding:6px 10px; border-radius:8px; border:1px solid #27272a;');
content = content.replace(/font-size:14px;\s*color:#f59e0b;">\$\{formatCost\(cost, currency\)\}<\/span>/g, 'font-size:14px; color:#ffffff;">${formatCost(cost, currency)}</span>');
content = content.replace(/<td style="color:#fbbf24;\s*font-weight:700;">\$\{formatCost\(cost, currency\)\}<\/td>/g, '<td style="color:#ffffff; font-weight:700;">${formatCost(cost, currency)}</td>');
content = content.replace(/<td style="color:\s*#fbbf24;\s*font-weight:\s*700;">\$\{formatCost\(cost, currency\)\}<\/td>/g, '<td style="color:#ffffff; font-weight:700;">${formatCost(cost, currency)}</td>');

// 12. Saved imports tags
content = content.replace(/<strong style="color:#f59e0b;">\$\{s\.tag\}<\/strong>/g, '<strong style="color:#ffffff;">${s.tag}</strong>');

// 13. dotEl.style.background = '#fbbf24' -> '#ffffff'
content = content.replace(/dotEl\.style\.background = '#fbbf24';/g, "dotEl.style.background = '#ffffff';");
content = content.replace(/dotEl\.style\.background = '#64748b';/g, "dotEl.style.background = '#52525b';");

// 14. Fix player profile subtitle in HTML:
// Ensure Chief ClashMaster subtitle has class/inline style ensuring clean muted grey
content = content.replace(/<span id="player-profile-subtitle">Town Hall 18 • Titan League<\/span>/g, '<span id="player-profile-subtitle" style="color: #71717a; font-size: 11px; font-weight: 700;">Town Hall 18 • Titan League</span>');

// Verify JS syntax inside the script tag
const scriptStartTag = content.indexOf('<script>');
const scriptEndTag = content.lastIndexOf('</script>');
const scriptBody = content.slice(scriptStartTag + '<script>'.length, scriptEndTag);

try {
  vm.compileFunction(scriptBody);
  console.log('Script syntax check PASSED! 0 errors.');
} catch (err) {
  console.error('Script syntax check FAILED:', err);
  process.exit(1);
}

fs.writeFileSync(indexPath, content, 'utf8');
console.log('Successfully wrote monochromatic black & white theme to public/index.html!');
