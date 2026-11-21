const fs = require('fs');
const path = require('path');

function removeGrayscaleFromFiles(filePath) {
  console.log(`Removing grayscale from ${filePath}...`);
  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Remove the strict monochrome filter block at lines 3222-3227
  const strictBlock = `    /* Strict Monochromatic Black and White Enforcements */
    .nav-coc-icon, .mobile-brand-icon, .brand-logo-img, .profile-league-badge, .builder-coc-avatar,
    .card-thumb-img, .th-render-img, #banner-th-img, .timeline-pill-event img, .timeline-upgrade-capsule img,
    .hero-avatar-img, .sidebar-footer img {
      filter: grayscale(100%) contrast(115%) !important;
    }`;
  html = html.split(strictBlock).join('');

  // 2. Remove grayscale from top styles block
  const oldTopRules = `    /* Monochromatic Black & White Asset Filters & Contrast Adjustments */
    .nav-coc-icon, .mobile-brand-icon, .brand-logo-img, .profile-league-badge, .builder-coc-avatar {
      filter: grayscale(100%) contrast(115%);
    }
    .axis-trophy svg {
      fill: #ffffff !important;
    }
    .timeline-pill-event img {
      filter: grayscale(100%) contrast(115%);
    }
    .timeline-upgrade-capsule img {
      filter: grayscale(100%) contrast(115%);
    }
    .card-thumb-img, .th-render-img, #banner-th-img {
      filter: grayscale(100%) contrast(110%);
    }`;

  const cleanTopRules = `    .axis-trophy svg {
      fill: #ffffff !important;
    }`;

  html = html.split(oldTopRules).join(cleanTopRules);

  // 3. Remove .hero-avatar-img grayscale
  const oldHeroImg = `    .hero-avatar-img {
      filter: grayscale(100%) contrast(110%);
    }`;
  html = html.split(oldHeroImg).join('');

  // 4. Ensure hero portraits, building icons, town halls, and badges have natural colors with clean drop-shadow
  const naturalImageStyles = `
    /* Restore Official Vibrant Colors for Heroes, Buildings, Town Halls, and In-Game Assets */
    .hero-avatar-img, .card-thumb-img, .th-render-img, #banner-th-img,
    .timeline-upgrade-capsule img, .timeline-pill-event img, .nav-coc-icon,
    .mobile-brand-icon, .brand-logo-img, .profile-league-badge, .builder-coc-avatar,
    .upgrade-item-card img, .roadmap-bldg-thumb, .sidebar-footer img {
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5)) !important;
    }
  `;

  if (!html.includes('Restore Official Vibrant Colors for Heroes')) {
    html = html.replace('</style>', `${naturalImageStyles}\n  </style>`);
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Successfully updated ${filePath}`);
}

removeGrayscaleFromFiles(path.resolve(__dirname, '../../public/index.html'));
removeGrayscaleFromFiles(path.resolve(__dirname, '../../android/app/src/main/assets/www/index.html'));
