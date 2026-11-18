// Borders as the UN and almost every school atlas draw them, where Natural Earth's maps show who controls a place instead.
// Western Sahara: Natural Earth draws the part Morocco controls as part of Morocco; the UN lists Western Sahara as a
// territory whose future hasn't been decided. This cuts Morocco at its recognised southern border (27°40'N) and adds the
// part south of it to the gray land that isn't one of the game's countries.
// Crimea: Natural Earth draws it as part of Russia; UN General Assembly Resolution 68/262 (2014) affirms it is part of
// Ukraine. This moves it from Russia to Ukraine on the Europe map (joined to mainland Ukraine, so no line crosses the
// isthmus) and out of Russia's flashcard shape. Safe to run more than once. Run tools/add-areas.mjs afterwards.
// Usage: node tools/borders.mjs <folder with d3-geo and polygon-clipping installed> [data/maps]
import fs from 'fs';
import path from 'path';
import {createRequire} from 'module';
import {PROJ, projectionFor} from './projections.mjs';
const mods = process.argv[2], out = process.argv[3] || 'data/maps';
const require = createRequire(path.resolve(mods, 'node_modules', 'x.js'));
const pc = require('polygon-clipping');
const CRIMEA = [34.1, 45.3]; // the middle of the peninsula
const rings = d => d.split(/(?=M)/).filter(r => r.trim()).map(r => { const p = r.match(/-?\d+(\.\d+)?/g).map(Number), pts = []; for(let i = 0; i < p.length; i += 2) pts.push([p[i], p[i+1]]); return pts; });
const ringPath = pts => 'M' + pts.map(([x, y]) => `${+x.toFixed(1)},${+y.toFixed(1)}`).join('L') + 'Z';
const inside = ([x, y], pts) => { let c = false; for(let i = 0, j = pts.length - 1; i < pts.length; j = i++){ const [xi, yi] = pts[i], [xj, yj] = pts[j]; if((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const box = all => { const xs = all.flat().map(p => p[0]), ys = all.flat().map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(v => +v.toFixed(1)); };

const file = path.join(out, 'europe.json'), raw = fs.readFileSync(file, 'utf8'), map = JSON.parse(raw);
const ru = map.items.find(i => i.n === 'Russia'), ua = map.items.find(i => i.n === 'Ukraine');
const at = projectionFor(PROJ.europe)(CRIMEA), ruRings = rings(ru.d), k = ruRings.findIndex(r => inside(at, r));
if(k < 0) console.log('Crimea is already part of Ukraine on the Europe map.');
else {
  const crimea = ruRings.splice(k, 1)[0];
  ru.d = ruRings.map(ringPath).join('');
  const joined = pc.union(rings(ua.d).map(r => [r]), [[crimea]]); // Ukraine's pieces, plus Crimea
  ua.d = joined.map(poly => poly.map(ringPath).join('')).join('');
  ua.b = box(joined.flat()); ru.b = box(ruRings);
  console.log(`Moved Crimea (${crimea.length} points) from Russia to Ukraine on the Europe map; Ukraine is now ${joined.length} piece(s).`);
}
// Russia's flashcard shape uses its own projection: there, Crimea is the small piece at the far south-west (Kaliningrad is
// the one further north)
const fdRings = rings(ru.fd), f = fdRings.findIndex(r => { const [x0, y0] = box([r]); return x0 < 20 && y0 > 150 && r.length < 60; });
if(f < 0) console.log("Crimea is already out of Russia's flashcard shape.");
else { fdRings.splice(f, 1); ru.fd = fdRings.map(ringPath).join(''); ru.fb = box(fdRings); console.log("Took Crimea out of Russia's flashcard shape."); }
fs.writeFileSync(file, JSON.stringify(map) + (raw.endsWith('\n') ? '\n' : ''));

// Western Sahara, on the Africa map
{
  const file = path.join(out, 'africa.json'), raw = fs.readFileSync(file, 'utf8'), map = JSON.parse(raw), mo = map.items.find(i => i.n === 'Morocco');
  const proj = projectionFor(PROJ.africa), LINE = 27 + 40 / 60; // Morocco's recognised southern border
  const south = [...Array.from({length: 31}, (_, i) => proj([-20 + i * 0.5, LINE])), proj([-5, 15]), proj([-20, 15])]; // everything south of the line, near the coast
  const moPolys = rings(mo.d).map(r => [r]), cut = pc.intersection(moPolys, [[south]]);
  const area = cut.flat().reduce((a, r) => { let s = 0; for(let i = 0, j = r.length - 1; i < r.length; j = i++) s += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return a + Math.abs(s) / 2; }, 0);
  if(area < 50) console.log('Western Sahara is already apart from Morocco on the Africa map.');
  else {
    const rest = pc.difference(moPolys, [[south]]);
    mo.d = rest.map(poly => poly.map(ringPath).join('')).join(''); mo.b = box(rest.flat());
    map.other = (map.other || '') + cut.map(poly => poly.map(ringPath).join('')).join(''); // gray, like the rest of Western Sahara
    fs.writeFileSync(file, JSON.stringify(map) + (raw.endsWith('\n') ? '\n' : ''));
    console.log(`Took Western Sahara out of Morocco on the Africa map (${cut.length} piece(s)); Morocco is now ${rest.length} piece(s).`);
  }
}
