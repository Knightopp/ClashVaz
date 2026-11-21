import http from 'http';

// Let's test what the DOM looks like when we evaluate script
import { execFileSync } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const out = execFileSync(chromePath, [
  '--headless=new',
  '--dump-dom',
  '--virtual-time-budget=5000',
  'http://localhost:3000'
]).toString();

console.log('Title text in DOM:', out.match(/id="banner-title-text"[^>]*>([^<]*)/)?.[1]);
console.log('Banner sub in DOM:', out.match(/id="banner-sub-text"[^>]*>([^<]*)/)?.[1]);
console.log('Banner img in DOM:', out.match(/<img[^>]*id="banner-th-img"[^>]*>/)?.[0]);
console.log('Tiers count in DOM:', (out.match(/class="obsidian-card/g) || []).length);
