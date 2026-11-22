import fs from 'fs';
import path from 'path';

const indexPath = path.resolve('public', 'index.html');
let content = fs.readFileSync(indexPath, 'utf-8');

// 1. Replace DEFAULT_TH_IMAGES in <head>
const oldThImagesHead = `    window.DEFAULT_TH_IMAGES = {
      "1": "https://static.wikia.nocookie.net/clashofclans/images/f/fd/Town_Hall1.png/revision/latest?cb=20170827034930",
      "2": "https://static.wikia.nocookie.net/clashofclans/images/7/7d/Town_Hall2.png/revision/latest?cb=20170827050036",
      "3": "https://static.wikia.nocookie.net/clashofclans/images/d/dd/Town_Hall3.png/revision/latest?cb=20170827050050",
      "4": "https://static.wikia.nocookie.net/clashofclans/images/e/e7/Town_Hall4.png/revision/latest?cb=20170827050104",
      "5": "https://static.wikia.nocookie.net/clashofclans/images/a/a3/Town_Hall5.png/revision/latest?cb=20170827050118",
      "6": "https://static.wikia.nocookie.net/clashofclans/images/5/52/Town_Hall6.png/revision/latest?cb=20170827050220",
      "7": "https://static.wikia.nocookie.net/clashofclans/images/7/75/Town_Hall7.png/revision/latest?cb=20170827051024",
      "8": "https://static.wikia.nocookie.net/clashofclans/images/f/fa/Town_Hall8.png/revision/latest?cb=20170827051039",
      "9": "https://static.wikia.nocookie.net/clashofclans/images/e/e0/Town_Hall9.png/revision/latest?cb=20170827045259",
      "10": "https://static.wikia.nocookie.net/clashofclans/images/5/5c/Town_Hall10.png/revision/latest?cb=20170827040043",
      "11": "https://static.wikia.nocookie.net/clashofclans/images/9/96/Town_Hall11.png/revision/latest?cb=20210410001514",
      "12": "https://static.wikia.nocookie.net/clashofclans/images/b/b7/Town_Hall12.png/revision/latest?cb=20251008133316",
      "13": "https://static.wikia.nocookie.net/clashofclans/images/7/73/Town_Hall13.png/revision/latest?cb=20251008133419",
      "14": "https://static.wikia.nocookie.net/clashofclans/images/b/b6/Town_Hall14.png/revision/latest?cb=20251008133902",
      "15": "https://static.wikia.nocookie.net/clashofclans/images/d/d4/Town_Hall15.png/revision/latest?cb=20251008075733",
      "16": "https://static.wikia.nocookie.net/clashofclans/images/5/53/Town_Hall16.png/revision/latest?cb=20231211062744",
      "17": "https://static.wikia.nocookie.net/clashofclans/images/1/17/Town_Hall17.png/revision/latest?cb=20261112160920",
      "18": "https://static.wikia.nocookie.net/clashofclans/images/7/76/Town_Hall18.png/revision/latest?cb=20251117162127",
      "19": "https://static.wikia.nocookie.net/clashofclans/images/7/77/Town_Hall19.png/revision/latest?cb=20261113134226"
    };`;

const newThImagesHead = `    window.DEFAULT_TH_IMAGES = {
      "1": "/downloads/images/Town_Hall/Town_Hall1.png",
      "2": "/downloads/images/Town_Hall/Town_Hall2.png",
      "3": "/downloads/images/Town_Hall/Town_Hall3.png",
      "4": "/downloads/images/Town_Hall/Town_Hall4.png",
      "5": "/downloads/images/Town_Hall/Town_Hall5.png",
      "6": "/downloads/images/Town_Hall/Town_Hall6.png",
      "7": "/downloads/images/Town_Hall/Town_Hall7.png",
      "8": "/downloads/images/Town_Hall/Town_Hall8.png",
      "9": "/downloads/images/Town_Hall/Town_Hall9.png",
      "10": "/downloads/images/Town_Hall/Town_Hall10.png",
      "11": "/downloads/images/Town_Hall/Town_Hall11.png",
      "12": "/downloads/images/Town_Hall/Town_Hall12.png",
      "13": "/downloads/images/Town_Hall/Town_Hall13.png",
      "14": "/downloads/images/Town_Hall/Town_Hall14.png",
      "15": "/downloads/images/Town_Hall/Town_Hall15.png",
      "16": "/downloads/images/Town_Hall/Town_Hall16.png",
      "17": "/downloads/images/Town_Hall/Town_Hall17.png",
      "18": "/downloads/images/Town_Hall/Town_Hall18.png",
      "19": "/downloads/images/Town_Hall/Town_Hall19.png"
    };`;

content = content.replace(oldThImagesHead, newThImagesHead);

// 2. Replace handleImgError fallbacks
content = content.replace(
  `img.src = '/api/proxy-image?url=' + encodeURIComponent('https://static.wikia.nocookie.net/clashofclans/images/7/76/Town_Hall18.png/revision/latest?cb=20251117162127');`,
  `img.src = '/downloads/images/Town_Hall/Town_Hall18.png';`
);
content = content.replace(
  `img.src = 'https://assets.clashk.ing/heroes/barbarian_king/icon.webp';`,
  `img.src = '/downloads/images/Heroes/barbarian_king.webp';`
);

// 3. Replace Hero icons in OFFICIAL_SC_DATA
content = content.replace(
  `"icon":"https://assets.clashk.ing/heroes/barbarian_king/icon.webp"`,
  `"icon":"/downloads/images/Heroes/barbarian_king.webp"`
);
content = content.replace(
  `"icon":"https://assets.clashk.ing/heroes/archer_queen/icon.webp"`,
  `"icon":"/downloads/images/Heroes/archer_queen.webp"`
);
content = content.replace(
  `"icon":"https://assets.clashk.ing/heroes/grand_warden/icon.webp"`,
  `"icon":"/downloads/images/Heroes/grand_warden.webp"`
);
content = content.replace(
  `"icon":"https://assets.clashk.ing/heroes/royal_champion/icon.webp"`,
  `"icon":"/downloads/images/Heroes/royal_champion.webp"`
);
content = content.replace(
  `"icon":"https://assets.clashk.ing/heroes/minion_prince/icon.webp"`,
  `"icon":"/downloads/images/Heroes/minion_prince.webp"`
);
content = content.replace(
  `"icon":"https://assets.clashk.ing/heroes/dragon_duke/icon.webp"`,
  `"icon":"/downloads/images/Heroes/dragon_duke.webp"`
);

// 4. Replace Banner & Avatar TH18 images
content = content.replace(
  `id="banner-th-img" class="banner-artwork" src="/api/proxy-image?url=https%3A%2F%2Fstatic.wikia.nocookie.net%2Fclashofclans%2Fimages%2F7%2F76%2FTown_Hall18.png%2Frevision%2Flatest%3Fcb%3D20251117162127"`,
  `id="banner-th-img" class="banner-artwork" src="/downloads/images/Town_Hall/Town_Hall18.png"`
);
content = content.replace(
  `id="mob-profile-avatar" src="/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/7/76/Town_Hall18.png/revision/latest?cb=20251117162127"`,
  `id="mob-profile-avatar" src="/downloads/images/Town_Hall/Town_Hall18.png"`
);
content = content.replace(
  `<img class="profile-avatar-img" src="/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/7/76/Town_Hall18.png/revision/latest?cb=20251117162127"`,
  `<img class="profile-avatar-img" src="/downloads/images/Town_Hall/Town_Hall18.png"`
);

// 5. Replace Shield & UI Icons
content = content.replaceAll(
  `/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/c/cf/Shield.png/revision/latest?cb=20151223062526`,
  `/downloads/images/ui/shield.png`
);
content = content.replaceAll(
  `/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/c/cd/Trophy.png/revision/latest?cb=20171031024226`,
  `/downloads/images/ui/trophy.png`
);
content = content.replaceAll(
  `/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/6/6b/Hammer_of_Building.png/revision/latest?cb=20181023123704`,
  `/downloads/images/ui/hammer_building.png`
);
content = content.replaceAll(
  `/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/1/14/Builder.png/revision/latest?cb=20210413073645`,
  `/downloads/images/ui/builder.png`
);
content = content.replaceAll(
  `/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/9/97/LeagueMedal.png/revision/latest?cb=20181023140411`,
  `/downloads/images/ui/league_medal.png`
);
content = content.replaceAll(
  `/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/5/52/Raid_Medal.png/revision/latest?cb=20220505230502`,
  `/downloads/images/ui/raid_medal.png`
);
content = content.replaceAll(
  `/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/c/c0/ChallengesIcon_BuildingUpgrade.png/revision/latest?cb=20260220113901`,
  `/downloads/images/ui/challenge_upgrade.png`
);
content = content.replaceAll(
  `/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/a/a1/Clock_Tower_Potion.png/revision/latest?cb=20181023122737`,
  `/downloads/images/ui/clock_potion.png`
);
content = content.replaceAll(
  `/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/e/e5/Titan_League.png/revision/latest?cb=20171003010915`,
  `/downloads/images/ui/titan_league.png`
);
content = content.replaceAll(
  `/api/proxy-image?url=https://static.wikia.nocookie.net/clashofclans/images/1/1e/Trader_Setup.png/revision/latest?cb=20180305180529`,
  `/downloads/images/ui/trader.png`
);

// 6. Update getProxyUrl to preserve /downloads/ and local URLs
const oldProxyHelper = `    function getProxyUrl(url) {
      if (!url || typeof url !== 'string' || url.trim() === '') {
        return '';
      }
      const clean = url.trim();
      if (clean.startsWith('/downloads/') || clean.startsWith('/') || clean.includes('assets.clashk.ing')) {
        return clean;
      }
      return \`/api/proxy-image?url=\${encodeURIComponent(clean)}\`;
    }`;

const newProxyHelper = `    function getProxyUrl(url) {
      if (!url || typeof url !== 'string' || url.trim() === '') {
        return '';
      }
      const clean = url.trim();
      if (clean.startsWith('/downloads/') || clean.startsWith('/') || clean.startsWith('data:')) {
        return clean;
      }
      // Check if this is a known hero or town hall url that maps to local downloads
      const lower = clean.toLowerCase();
      for (let i = 1; i <= 19; i++) {
        if (lower.includes('town_hall' + i + '.') || lower.includes('town_hall' + i + '_') || lower.includes('townhall' + i + '.')) {
          return '/downloads/images/Town_Hall/Town_Hall' + i + '.png';
        }
      }
      if (lower.includes('barbarian_king')) return '/downloads/images/Heroes/barbarian_king.webp';
      if (lower.includes('archer_queen')) return '/downloads/images/Heroes/archer_queen.webp';
      if (lower.includes('grand_warden')) return '/downloads/images/Heroes/grand_warden.webp';
      if (lower.includes('royal_champion')) return '/downloads/images/Heroes/royal_champion.webp';
      if (lower.includes('minion_prince')) return '/downloads/images/Heroes/minion_prince.webp';
      if (lower.includes('dragon_duke')) return '/downloads/images/Heroes/dragon_duke.webp';

      return \`/api/proxy-image?url=\${encodeURIComponent(clean)}\`;
    }`;

content = content.replace(oldProxyHelper, newProxyHelper);

fs.writeFileSync(indexPath, content, 'utf-8');
console.log('Updated public/index.html with local offline image paths!');

// Also write to android asset
const androidIndexPath = path.resolve('android', 'app', 'src', 'main', 'assets', 'www', 'index.html');
fs.writeFileSync(androidIndexPath, content, 'utf-8');
console.log('Synced to android/app/src/main/assets/www/index.html!');
