import fs from 'fs';
import path from 'path';

const TH_IMAGES = {
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
};

const HERO_IMAGES = {
  "barbarian_king": "https://assets.clashk.ing/heroes/barbarian_king/icon.webp",
  "archer_queen": "https://assets.clashk.ing/heroes/archer_queen/icon.webp",
  "grand_warden": "https://assets.clashk.ing/heroes/grand_warden/icon.webp",
  "royal_champion": "https://assets.clashk.ing/heroes/royal_champion/icon.webp",
  "minion_prince": "https://assets.clashk.ing/heroes/minion_prince/icon.webp",
  "dragon_duke": "https://assets.clashk.ing/heroes/dragon_duke/icon.webp"
};

const UI_IMAGES = {
  "shield": "https://static.wikia.nocookie.net/clashofclans/images/c/cf/Shield.png/revision/latest?cb=20151223062526",
  "trader": "https://static.wikia.nocookie.net/clashofclans/images/1/1e/Trader_Setup.png/revision/latest?cb=20180305180529",
  "trophy": "https://static.wikia.nocookie.net/clashofclans/images/c/cd/Trophy.png/revision/latest?cb=20171031024226",
  "hammer_building": "https://static.wikia.nocookie.net/clashofclans/images/6/6b/Hammer_of_Building.png/revision/latest?cb=20181023123704",
  "builder": "https://static.wikia.nocookie.net/clashofclans/images/1/14/Builder.png/revision/latest?cb=20210413073645",
  "league_medal": "https://static.wikia.nocookie.net/clashofclans/images/9/97/LeagueMedal.png/revision/latest?cb=20181023140411",
  "raid_medal": "https://static.wikia.nocookie.net/clashofclans/images/5/52/Raid_Medal.png/revision/latest?cb=20220505230502",
  "challenge_upgrade": "https://static.wikia.nocookie.net/clashofclans/images/c/c0/ChallengesIcon_BuildingUpgrade.png/revision/latest?cb=20260220113901",
  "clock_potion": "https://static.wikia.nocookie.net/clashofclans/images/a/a1/Clock_Tower_Potion.png/revision/latest?cb=20181023122737",
  "titan_league": "https://static.wikia.nocookie.net/clashofclans/images/e/e5/Titan_League.png/revision/latest?cb=20171003010915"
};

async function downloadFile(url, destPath) {
  try {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 100) {
      console.log('Already exists:', destPath);
      return true;
    }
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://clashofclans.fandom.com/'
      }
    });
    if (!res.ok) {
      console.error('Failed', url, res.status);
      return false;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buf);
    console.log('Downloaded:', destPath, buf.length, 'bytes');
    return true;
  } catch (e) {
    console.error('Error downloading', url, e.message);
    return false;
  }
}

async function main() {
  console.log('--- Downloading Town Hall Images ---');
  for (const [th, url] of Object.entries(TH_IMAGES)) {
    const dest = path.resolve('downloads', 'images', 'Town_Hall', `Town_Hall${th}.png`);
    await downloadFile(url, dest);
  }

  console.log('--- Downloading Hero Images ---');
  for (const [hero, url] of Object.entries(HERO_IMAGES)) {
    const dest = path.resolve('downloads', 'images', 'Heroes', `${hero}.webp`);
    await downloadFile(url, dest);
  }

  console.log('--- Downloading UI Images ---');
  for (const [key, url] of Object.entries(UI_IMAGES)) {
    const dest = path.resolve('downloads', 'images', 'ui', `${key}.png`);
    await downloadFile(url, dest);
  }

  console.log('--- Finished Asset Downloads ---');
}

main();
