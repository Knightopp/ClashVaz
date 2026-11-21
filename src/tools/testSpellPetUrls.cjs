async function test() {
  const spells = ['lightning_spell', 'healing_spell', 'rage_spell', 'jump_spell', 'freeze_spell', 'poison_spell', 'earthquake_spell', 'haste_spell', 'clone_spell', 'skeleton_spell', 'bat_spell', 'invisibility_spell', 'recall_spell', 'overgrowth_spell', 'revive_spell', 'ice_block_spell'];
  for (const s of spells) {
    const url = 'https://assets.clashk.ing/spells/' + s + '/icon.webp';
    try {
      const r = await fetch(url, { method: 'HEAD' });
      console.log('Spell ' + s + ':', r.status);
    } catch (e) {
      console.error(s, e.message);
    }
  }

  const pets = ['l.a.s.s.i', 'lassi', 'mighty_yak', 'electro_owl', 'unicorn', 'phoenix', 'poison_lizard', 'diggy', 'frosty', 'spirit_fox', 'angry_jelly', 'sneezy'];
  for (const p of pets) {
    const url = 'https://assets.clashk.ing/pets/' + p + '/icon.webp';
    try {
      const r = await fetch(url, { method: 'HEAD' });
      console.log('Pet ' + p + ':', r.status);
    } catch (e) {
      console.error(p, e.message);
    }
  }
}
test();
