const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');

// 1. Check for any emojis
const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

const emojisFound = [];
let match;
const globalEmojiRegex = new RegExp(emojiRegex.source, 'gu');
while ((match = globalEmojiRegex.exec(html)) !== null) {
  emojisFound.push(match[0]);
}
console.log('Emojis found count:', emojisFound.length, emojisFound);

// 2. Extract script tags and test syntax
const scriptMatches = [...html.matchAll(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi)];
console.log('Script tags found:', scriptMatches.length);

scriptMatches.forEach((m, idx) => {
  const code = m[1];
  try {
    new Function(code);
    console.log(`Script ${idx + 1} syntax: OK (${code.length} chars)`);
  } catch (err) {
    console.error(`Script ${idx + 1} syntax error:`, err.message);
  }
});

// 3. Check for Dragon Duke and TH17 removal
console.log('Dragon Duke in index.html?', html.includes('Dragon Duke'));
console.log('Calc hero builders?', html.includes('calcHeroBuilders'));
console.log('Maxing Roadmap table?', html.includes('maxing-roadmap-section'));
console.log('Relevant THs filtering present?', html.includes('relevantTHs = (villageTH >= 18) ? [18, 19]'));
