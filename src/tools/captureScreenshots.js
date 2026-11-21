import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function capture(url, outputFile, width = 1440, height = 900) {
  console.log(`Capturing ${url} -> ${outputFile}...`);
  try {
    // Note: DO NOT use --virtual-time-budget as it pauses real localhost socket network requests!
    // Instead use --run-all-compositor-stages-before-draw
    execFileSync(chromePath, [
      '--headless=new',
      `--window-size=${width},${height}`,
      '--run-all-compositor-stages-before-draw',
      `--screenshot=${outputFile}`,
      url
    ]);
    console.log(`Saved ${outputFile}`);
  } catch (err) {
    console.error(`Error capturing ${url}:`, err.message);
  }
}

const outDir = path.resolve(__dirname, '../../public');
capture('http://localhost:3000', path.join(outDir, 'real_dashboard.png'), 1440, 950);
