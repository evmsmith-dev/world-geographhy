// Shared steps for the tests: make a player, open a place, tap the map like a finger would.
import { test as base, expect } from '@playwright/test';

// Every test fails if the page throws an error or logs one to the console.
export const test = base.extend({
  page: async ({page}, use) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if(m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    await use(page);
    expect(errors, 'errors on the page').toEqual([]);
  },
});
export { expect };

// Open the game with the test hook on (see WGQ_TEST in app.js)
export async function openGame(page){
  await page.goto('/?test');
  await page.waitForFunction(() => window.WGQ_TEST);
}

// First visit: make a player and close the How to play panel
export async function newPlayer(page, name = 'Ama'){
  await openGame(page);
  await page.click('#addPlayer');
  await page.fill('#pName', name);
  await page.click('#pForm button[type=submit]');
  await page.click('#helpOk');
  await expect(page.locator('#scrHome')).toBeVisible();
}

export const REGIONS = [
  {name: 'United States', topics: ['us-states', 'us-capitals', 'us-flags']},
  {name: 'World', topics: ['world']},
  {name: 'Europe', topics: ['eu-countries', 'eu-capitals', 'eu-flags', 'eu-geo']},
  {name: 'Africa', topics: ['af-countries', 'af-capitals', 'af-flags', 'af-geo']},
  {name: 'Asia', topics: ['as-countries', 'as-capitals', 'as-flags', 'as-geo']},
  {name: 'Oceania', topics: ['oc-countries', 'oc-capitals', 'oc-flags', 'oc-geo']},
  {name: 'North America', topics: ['na-countries', 'na-capitals', 'na-flags', 'na-geo']},
  {name: 'South America', topics: ['sa-countries', 'sa-capitals', 'sa-flags', 'sa-geo']},
];

// From the home screen: open a place and pick a tab
export async function openTopic(page, region, topicId){
  await page.click(`.rtile[data-region="${region}"]`);
  await expect(page.locator('#scrRegion')).toBeVisible();
  const tab = page.locator(`#regionTabs [data-tab="${topicId}"]`);
  if(await tab.isVisible()) await tab.click(); // places with one topic (the World) have no tabs
}

export async function startMode(page, mode){
  await page.click(`.modebig[data-mode="${mode}"]`);
  await expect(page.locator('#scrPlay')).toBeVisible();
  await page.waitForFunction(() => document.querySelectorAll('#map path.st').length > 0);
}

export async function goHome(page){
  await openGame(page);
  await expect(page.locator('#scrHome')).toBeVisible();
}

// A spot on the screen where a finger tap lands on this place: its tap circle if it has one, otherwise a point
// inside it that nothing covers and that is clear of other places' tap circles (a tap near a circle picks the circle, as it should)
export async function spotFor(page, name){
  return page.evaluate(n => {
    const S = document.getElementById('map').getBoundingClientRect();
    const onMap = r => { const x = r.left + r.width/2, y = r.top + r.height/2; return r.width && x > S.left && x < S.right && y > S.top && y < S.bottom; };
    const dots = [...document.querySelectorAll('#map circle')].filter(c => c.style.display !== 'none').map(c => ({n: c.dataset.n, r: c.getBoundingClientRect()})).filter(d => onMap(d.r));
    const mine = dots.find(d => d.n === n);
    if(mine) return {x: mine.r.left + mine.r.width/2, y: mine.r.top + mine.r.height/2};
    const el = [...document.querySelectorAll('#map path.st')].find(p => p.dataset.n === n);
    if(!el) return {missing: true};
    const clear = (x, y) => Math.min(Infinity, ...dots.map(d => Math.hypot(x - (d.r.left + d.r.width/2), y - (d.r.top + d.r.height/2)) - d.r.width/2 - 8));
    const R = el.getBoundingClientRect();
    const x0 = Math.max(R.left, S.left), x1 = Math.min(R.right, S.right), y0 = Math.max(R.top, S.top), y1 = Math.min(R.bottom, S.bottom);
    // whole pixels, like real touch events, and a few pixels of the same place all around (a finger is not a pin point)
    let best = null;
    const hits = (x, y) => { const h = document.elementFromPoint(x, y); return h && h.dataset && h.dataset.n === n; };
    const roomy = (x, y) => [[0, 0], [4, 0], [-4, 0], [0, 4], [0, -4]].every(([dx, dy]) => hits(x + dx, y + dy));
    const tryAt = (x, y) => { x = Math.round(x); y = Math.round(y); if(!hits(x, y)) return; const c = clear(x, y) + (roomy(x, y) ? 1000 : 0); if(c > 2 && (!best || c > best.c)) best = {x, y, c}; };
    // a grid first (the same spots every run), then random points for odd shapes
    for(let i = 1; i < 16; i++) for(let j = 1; j < 16; j++) tryAt(x0 + (x1 - x0) * i / 16, y0 + (y1 - y0) * j / 16);
    for(let k = 0; k < 4000 && !best; k++) tryAt(x0 + Math.random() * (x1 - x0), y0 + Math.random() * (y1 - y0));
    return best;
  }, name);
}

// Tap a place on the map with a finger. If every spot of it is too close to a tiny neighbor's tap circle
// (Switzerland next to Liechtenstein on a phone), zoom in on it first, the way a kid would.
export async function tapPlace(page, name){
  let spot = await spotFor(page, name);
  expect(spot && spot.missing, `${name} is on the map`).toBeFalsy();
  if(!spot && !(await page.isDisabled('#zFit'))){ // zoomed in somewhere else: back to the whole map first
    await page.click('#zFit'); await mapSettled(page);
    spot = await spotFor(page, name);
  }
  if(!spot){
    await page.evaluate(n => window.WGQ_TEST.zoomTo(n), name);
    await mapSettled(page);
    spot = await spotFor(page, name);
  }
  expect(spot, `a spot where a finger can tap ${name}`).toBeTruthy();
  await page.touchscreen.tap(spot.x, spot.y);
  return spot;
}

// Wait until the map stops moving (zoom animations)
export async function mapSettled(page){
  let last = null;
  for(let i = 0; i < 40; i++){
    const vb = await page.getAttribute('#map', 'viewBox');
    if(vb === last) return;
    last = vb; await page.waitForTimeout(120);
  }
}

// The place a Find it question is asking for: "Find the Alps", "Which country has the capital Paris?" or a flag
export async function findTarget(page, topicId){
  await expect(page.locator('#findQ')).not.toBeEmpty(); // the question appears once the map has loaded
  return page.evaluate(async tid => {
    const W = window.WGQ_TEST, t = W.TOPIC[tid], q = document.getElementById('findQ');
    const img = q.querySelector('img.flag');
    if(img){ const urls = await W.flags(t.map), pre = t.map === 'us' ? 'us:' : ''; const hit = Object.entries(urls).find(([, u]) => u === img.getAttribute('src')); return hit ? hit[0].replace(pre, '') : null; }
    const text = q.textContent.replace(/\s*🔊\s*$/u, '').trim();
    const cap = text.match(/capital (.+)\?$/);
    if(cap){ const m = await W.loadMap(t.map); const it = m.items.find(i => (i.cap || W.CAP[i.n]) === cap[1]); return it ? it.n : null; }
    return text.replace(/^Find (the )?/, '').trim();
  }, topicId);
}
