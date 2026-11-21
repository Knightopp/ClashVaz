async function test() {
  const heroes = ['barbarian_king', 'archer_queen', 'grand_warden', 'royal_champion', 'minion_prince', 'dragon_duke'];
  for (const h of heroes) {
    const url = 'https://assets.clashk.ing/heroes/' + h + '/icon.webp';
    try {
      const r = await fetch(url, { method: 'HEAD' });
      console.log('Hero ' + h + ':', r.status);
    } catch (e) {
      console.error(h, e.message);
    }
  }

  const troops = ['barbarian', 'archer', 'giant', 'goblin', 'wall_breaker', 'balloon', 'wizard', 'dragon', 'p.e.k.k.a', 'pekka'];
  for (const t of troops) {
    const url = 'https://assets.clashk.ing/troops/' + t + '/icon.webp';
    try {
      const r = await fetch(url, { method: 'HEAD' });
      console.log('Troop ' + t + ':', r.status);
    } catch (e) {
      console.error(t, e.message);
    }
  }
}
test();
