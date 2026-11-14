// Data checks: fast checks that the game's lists agree with each other and with its files.
// They catch typos (a fun fact for "Lake Titikaka"), forgotten files, and counts that no longer match a map.
import fs from 'node:fs';
import path from 'node:path';
import { test, expect, openGame } from './helpers.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// Everything the game knows, read from the running game (through WGQ_TEST, which only exists with ?test)
async function gameData(page){
  await openGame(page);
  return page.evaluate(async () => {
    const W = window.WGQ_TEST, maps = {};
    for(const t of W.TOPICS) if(!maps[t.map]){ const m = await W.loadMap(t.map); maps[t.map] = {w: m.w, items: m.items.map(i => ({n: i.n, cap: i.cap, kind: i.kind, sub: i.sub, dot: !!i.dot, b: i.b}))}; }
    const flags = {};
    for(const t of W.TOPICS.filter(t => t.flags)) flags[t.map] = Object.keys(await W.flags(t.map));
    const mapW = {};
    for(const k in maps){ mapW[k] = maps[k].w; maps[k] = maps[k].items; }
    return {
      topics: W.TOPICS.map(t => ({id: t.id, group: t.group, map: t.map, count: t.count, tab: t.tab, name: t.name, flags: !!t.flags, geo: !!t.geo, parts: t.parts || null})),
      maps, mapW, flags, facts: await W.facts(), lookalikes: W.LOOKALIKES, say: W.SAY, geoAlias: W.GEO_ALIAS, worldFact: W.WORLD_FACT, tours: W.TOURS.map(t => ({id: t.id, count: t.count, from: t.from})), cap: W.CAP, capNote: W.CAP_NOTE,
    };
  });
}

let D;
test.beforeAll(async ({browser}, info) => {
  const ctx = await browser.newContext({baseURL: info.project.use.baseURL}), page = await ctx.newPage();
  D = await gameData(page); await ctx.close();
});

test('every topic has a unique id and a map with the number of places it says', () => {
  const ids = D.topics.map(t => t.id);
  expect(new Set(ids).size, 'topic ids are unique').toBe(ids.length);
  for(const t of D.topics) expect(D.maps[t.map].length, `${t.id}: places on ${t.map}`).toBe(t.count);
});

test('no map has the same place twice', () => {
  for(const [m, items] of Object.entries(D.maps)){
    const names = items.map(i => i.n);
    expect(names.filter((n, i) => names.indexOf(n) !== i), `repeated names on ${m}`).toEqual([]);
  }
});

test('every country has a capital, and every state too', () => {
  for(const t of D.topics.filter(t => /-capitals$/.test(t.id))){
    const missing = D.maps[t.map].filter(i => !(i.cap || D.cap[i.n])).map(i => i.n);
    expect(missing, `${t.id}: places with no capital`).toEqual([]);
  }
});

test('every place has a fun fact, and every fun fact belongs to a place', () => {
  const group = t => t.map === 'us' ? 'us' : t.geo ? 'geo' : t.map === 'world' ? null : 'country';
  const want = {us: new Set(), country: new Set(), geo: new Set()};
  for(const t of D.topics){ const g = group(t); if(g) D.maps[t.map].forEach(i => want[g].add(i.n)); }
  for(const g of Object.keys(want)){
    const have = new Set(Object.keys(D.facts[g] || {}));
    expect([...want[g]].filter(n => !have.has(n)), `places with no fun fact (${g})`).toEqual([]);
    expect([...have].filter(n => !want[g].has(n)), `fun facts for places that aren't on any map (${g})`).toEqual([]);
  }
  const world = D.maps.world.map(i => i.n);
  expect(world.filter(n => !D.worldFact[n]), 'continents and oceans with no fact').toEqual([]);
});

test('every flag topic has a flag for each of its places', () => {
  for(const t of D.topics.filter(t => t.flags)){
    const pre = t.map === 'us' ? 'us:' : '', have = new Set(D.flags[t.map]);
    expect(D.maps[t.map].filter(i => !have.has(pre + i.n)).map(i => i.n), `${t.id}: places with no flag`).toEqual([]);
  }
});

test('mix-up tips name two real places on the same map', () => {
  const onSameMap = (a, b) => Object.values(D.maps).some(items => { const s = new Set(items.map(i => i.n)); return s.has(a) && s.has(b); });
  const bad = D.lookalikes.filter(([, a, b]) => !onSameMap(a, b)).map(([k, a, b]) => `${k}: ${a} / ${b}`);
  expect(bad, 'mix-up tips with a name that is not on a map with the other').toEqual([]);
});

test('pronunciations and Land & Water spellings are for real places', () => {
  const names = new Set();
  for(const items of Object.values(D.maps)) for(const i of items){ names.add(i.n); if(i.cap) names.add(i.cap); }
  Object.values(D.cap).forEach(c => names.add(c));
  const notes = Object.values(D.capNote).join(' '); // notes like "It was called Nur-Sultan" are read aloud too
  expect(Object.keys(D.say).filter(n => !names.has(n) && !notes.includes(n)), 'pronunciations for names the game never shows').toEqual([]);
  const geo = new Set(D.topics.filter(t => t.geo).flatMap(t => D.maps[t.map].map(i => i.n)));
  expect(Object.keys(D.geoAlias).filter(n => !geo.has(n)), 'Land & Water spellings for places not on a map').toEqual([]);
});

test('Land & Water places each have a kind the game can name', () => {
  const words = ['river', 'usregion', 'city', 'park', 'range', 'plain', 'plateau', 'basin', 'valley', 'desert', 'highlands', 'region', 'sea', 'gulf', 'bay', 'channel', 'estuary', 'lake'];
  for(const t of D.topics.filter(t => t.geo)){
    const bad = D.maps[t.map].filter(i => !words.includes(i.sub) || !['mountain', 'water', 'desert', 'park', 'city', 'plain', 'usregion', 'river'].includes(i.kind)).map(i => `${i.n} (${i.kind}/${i.sub})`);
    expect(bad, `${t.id}: places with an unknown kind`).toEqual([]);
  }
});

test('the offline list has every file the game needs, and only files that exist', () => {
  const sw = read('sw.js'), files = JSON.parse('[' + sw.match(/const FILES = \[([\s\S]*?)\];/)[1].replace(/'/g, '"') + ']');
  expect(files.filter(f => f !== './' && !fs.existsSync(path.join(ROOT, f))), 'files in sw.js that do not exist').toEqual([]);
  const need = new Set(['index.html', 'manifest.webmanifest', 'data/facts.json', 'data/flags.json', 'data/usflags.json', 'data/thumbs.json']);
  D.topics.forEach(t => { need.add(`data/maps/${t.map}.json`); });
  for(const t of D.topics.filter(t => t.geo)) need.add(`data/maps/${t.map.replace(/-geo$/, '')}.json`); // a Land & Water map is drawn on its continent's map
  // files named in the page, the stylesheet (relative to the stylesheet) and the manifest
  const local = f => !/^(https?:|data:|mailto:|#)/.test(f) && f !== './';
  for(const m of read('index.html').matchAll(/(?:href|src)="([^"#?]+)(?:\?[^"]*)?"/g)) if(local(m[1])) need.add(m[1]);
  for(const css of [...need].filter(f => f.endsWith('.css')))
    for(const m of read(css).matchAll(/url\(['"]?([^'")]+)['"]?\)/g)) if(local(m[1])) need.add(path.posix.normalize(path.posix.join(path.posix.dirname(css), m[1])));
  for(const js of [...need].filter(f => f.endsWith('.js')))
    for(const m of read(js).matchAll(/^\s*import\s[^'"]*['"](\.[^'"]+)['"]/gm)) need.add(path.posix.normalize(path.posix.join(path.posix.dirname(js), m[1])));
  (JSON.parse(read('manifest.webmanifest')).icons || []).forEach(i => need.add(i.src));
  expect([...need].filter(f => !files.includes(f)), 'files the game uses that are missing from the offline list in sw.js').toEqual([]);
  expect([...need].filter(f => !fs.existsSync(path.join(ROOT, f))), 'files the game uses that do not exist').toEqual([]);
});

test('the build stamp in index.html is a real date and time', () => {
  const m = read('index.html').match(/WGQ_BUILD='([^']+)'/);
  expect(m, 'index.html sets WGQ_BUILD').toBeTruthy();
  expect(Number.isNaN(Date.parse(m[1])), `WGQ_BUILD '${m[1]}' is a date`).toBe(false);
});

test('every JSON file is valid', () => {
  const files = ['manifest.webmanifest', ...fs.readdirSync(path.join(ROOT, 'data'), {recursive: true}).filter(f => f.endsWith('.json')).map(f => path.join('data', f))];
  expect(files.length, "JSON files found").toBeGreaterThanOrEqual(19);
  for(const f of files) expect(() => JSON.parse(read(f)), f).not.toThrow();
});

test('places too small for a finger on a phone have a tap circle', () => {
  // on a phone a map is about 340 pixels wide; anything under 8 pixels across needs a circle to tap
  for(const t of D.topics.filter(t => !t.geo)){
    const items = D.maps[t.map], px = 340 / D.mapW[t.map];
    expect(px, `${t.map} has a width`).toBeGreaterThan(0);
    const tiny = items.filter(i => i.b && !i.dot && Math.max(i.b[2] - i.b[0], i.b[3] - i.b[1]) * px < 8).map(i => i.n);
    expect(tiny, `${t.map}: tiny places with no tap circle`).toEqual([]);
  }
});

test('the World Tour covers every country once, and every Land & Water place once', () => {
  const tour = id => D.tours.find(t => t.id === id);
  const names = t => t.from.flatMap(f => D.maps[D.topics.find(x => x.id === f).map].map(i => i.n));
  const countries = names(tour('world-countries')), geo = names(tour('world-geo'));
  expect(new Set(countries).size, 'different countries').toBe(countries.length);
  expect(countries.length).toBe(tour('world-countries').count);
  expect(tour('world-countries').count, 'countries in the world').toBe(195);
  expect(new Set(geo).size, 'different Land & Water places').toBe(geo.length);
  const allGeo = D.topics.filter(t => t.tab === 'Land & Water' && t.group !== 'United States').reduce((sum, t) => sum + t.count, 0); // the tour is the six continents
  expect(tour('world-geo').count, 'every Land & Water place').toBe(allGeo);
  const allCountries = D.topics.filter(t => /-countries$/.test(t.id)).map(t => t.id).sort();
  expect([...tour('world-countries').from].sort(), 'every continent').toEqual(allCountries);
});

test('every national park and city is placed inside its own state', () => {
  const us = Object.fromEntries(JSON.parse(read('data/maps/us.json')).items.map(i => [i.n, i.d]));
  const inside = (d, x, y) => { let r = false; for(const ring of d.split('Z').filter(Boolean)){ const p = ring.slice(1).split('L').map(q => q.split(',').map(Number));
    for(let i = 0, j = p.length - 1; i < p.length; j = i++) if((p[i][1] > y) !== (p[j][1] > y) && x < p[i][0] + (y - p[i][1]) * (p[j][0] - p[i][0]) / (p[j][1] - p[i][1])) r = !r; } return r; };
  for(const f of ['usparks', 'uscities']){
    const wrong = JSON.parse(read(`data/maps/${f}.json`)).items.filter(i => !/District of Columbia/.test(i.where))
      .filter(i => !i.where.split(/, | and /).some(s => us[s] && inside(us[s], i.dot[0], i.dot[1]))).map(i => `${i.n} (${i.where})`);
    expect(wrong, `${f}: places outside the state they say`).toEqual([]);
  }
});
