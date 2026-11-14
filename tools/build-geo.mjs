// Builds the "Mountains & Water" map files (europe-geo.json, africa-geo.json, ...).
// Each file holds only mountain ranges, seas and lakes; the game draws the continent's countries underneath as a gray background.
// Data: Natural Earth (public domain), https://www.naturalearthdata.com
//   ne_10m_geography_marine_polys, ne_50m_lakes, ne_10m_geography_regions_polys (from github.com/nvkelso/natural-earth-vector)
// Usage: node tools/build-geo.mjs <folder with the Natural Earth .geojson files> <output folder>
// Needs: npm i d3-geo polygon-clipping
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const d3 = require('d3-geo'), pc = require('polygon-clipping');
const [NE, OUT] = [process.argv[2], process.argv[3] || '.'];
const load = f => JSON.parse(fs.readFileSync(path.join(NE, f + '.geojson'))).features;

// Each continent map's projection (azimuthal equal-area), recovered to within 0.03 px of the existing country maps.
const PROJ = {
  europe:   {c:[12, 52.95],     s:1345.53, t:[434.24, 466.53], w:1000, h:901},
  africa:   {c:[16.99, 2.01],   s:690.51,  t:[505.13, 438.8],  w:1000, h:892},
  asia:     {c:[86, 27.01],     s:562.64,  t:[451.74, 332.3],  w:1000, h:703},
  oceania:  {c:[158, -18],      s:622.86,  t:[482.03, 358.5],  w:1000, h:700},
  namerica: {c:[-96, 44],       s:794.25,  t:[484.85, 552.98], w:1000, h:1056},
  samerica: {c:[-59.99, -20.05],s:1177.09, t:[462.78, 675.62], w:1000, h:1422},
};
// [name in the game, kind, source, names in the data]. Natural Earth splits some seas into smaller named parts
// (the Tyrrhenian and Ionian in the Mediterranean, the Gulf of Bothnia in the Baltic...), so those parts are joined back in. Seas sit under the land; lakes and mountains sit on top of it.
const FEATURES = {
  namerica: [['Rocky Mountains','range','mtn',['ROCKY MOUNTAINS']], ['Appalachian Mountains','range','mtn',['APPALACHIAN MTS.']],
    ['Sierra Madre','range','mtn',['SIERRA MADRE OCCIDENTAL','SIERRA MADRE ORIENTAL','Sierra Madre del Sur']],
    ['Gulf of Mexico','gulf','sea',['Gulf of Mexico','Bahía de Campeche']], ['Hudson Bay','bay','sea',['Hudson Bay','James Bay']], ['Caribbean Sea','sea','sea',['Caribbean Sea','Gulf of Honduras']], ['Bering Sea','sea','sea',['Bering Sea']],
    ['Lake Superior','lake','lake',['Lake Superior']], ['Lake Michigan','lake','lake',['Lake Michigan']], ['Lake Huron','lake','lake',['Lake Huron']], ['Lake Erie','lake','lake',['Lake Erie']], ['Lake Ontario','lake','lake',['Lake Ontario']]],
  samerica: [['Andes','range','mtn',['ANDES']], ['Lake Titicaca','lake','lake',['Lago Titicaca']]],
  europe: [['Alps','range','mtn',['ALPS']], ['Pyrenees','range','mtn',['PYRENEES']], ['Ural Mountains','range','mtn',['URAL MOUNTAINS']], ['Caucasus Mountains','range','mtn',['CAUCASUS MTS.','Lesser Caucasus']],
    ['Scandinavian Mountains','range','mtn',['KJØLEN MOUNTAINS']],
    ['Mediterranean Sea','sea','sea',['Mediterranean Sea','Alboran Sea','Balearic Sea','Golfe du Lion','Gulf of Gabès','Gulf of Sidra','Ionian Sea','Ligurian Sea','Tyrrhenian Sea']], ['Adriatic Sea','sea','sea',['Adriatic Sea']], ['Aegean Sea','sea','sea',['Aegean Sea','Sea of Crete']], ['Black Sea','sea','sea',['Black Sea']], ['Baltic Sea','sea','sea',['Baltic Sea','Gulf of Bothnia','Gulf of Finland','Gulf of Riga','Mecklenburger Bucht']], ['North Sea','sea','sea',['North Sea','Skagerrak']]],
  africa: [['Atlas Mountains','range','mtn',['ATLAS MOUNTAINS','HAUT ATLAS','ATLAS SAHARIEN','Anti Atlas','Moyen Atlas','Atlas Tellien']], ['Ethiopian Highlands','range','mtn',['ETHIOPIAN HIGHLANDS']],
    ['Red Sea','sea','sea',['Red Sea']], ['Lake Victoria','lake','lake',['Lake Victoria']], ['Lake Tanganyika','lake','lake',['Lake Tanganyika']], ['Lake Malawi','lake','lake',['Lake Malawi']]],
  asia: [['Himalayas','range','mtn',['HIMALAYAS']], ['Hindu Kush','range','mtn',['HINDU KUSH']], ['Tian Shan','range','mtn',['TIAN SHAN']],
    ['Caspian Sea','lake','sea',['Caspian Sea']], ['Arabian Sea','sea','sea',['Arabian Sea']], ['Persian Gulf','gulf','sea',['Persian Gulf']], ['Bay of Bengal','bay','sea',['Bay of Bengal']],
    ['South China Sea','sea','sea',['South China Sea','Gulf of Tonkin']], ['Sea of Japan','sea','sea',['Sea of Japan']], ['Lake Baikal','lake','lake',['Lake Baikal']]],
  oceania: [['Great Dividing Range','range','mtn',['GREAT DIVIDING RANGE']], ['Coral Sea','sea','sea',['Coral Sea']], ['Tasman Sea','sea','sea',['Tasman Sea']]],
};
const SRC = {sea: load('ne_10m_geography_marine_polys'), lake: load('ne_50m_lakes'), mtn: load('ne_10m_geography_regions_polys')};
const nameOf = f => f.properties.name || f.properties.NAME;

// Ramer–Douglas–Peucker on one closed ring (split at the far point first, so the ring can't collapse)
function rdp(pts, tol){
  if(pts.length < 3) return pts;
  const d2 = (p, a, b) => { const dx = b[0]-a[0], dy = b[1]-a[1], L = dx*dx + dy*dy; let t = L ? ((p[0]-a[0])*dx + (p[1]-a[1])*dy) / L : 0; t = Math.max(0, Math.min(1, t)); const x = a[0]+t*dx - p[0], y = a[1]+t*dy - p[1]; return x*x + y*y; };
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length-1] = 1;
  const stack = [[0, pts.length-1]];
  while(stack.length){ const [i, j] = stack.pop(); let m = -1, md = tol*tol; for(let k = i+1; k < j; k++){ const dd = d2(pts[k], pts[i], pts[j]); if(dd > md){ md = dd; m = k; } } if(m > 0){ keep[m] = 1; stack.push([i, m], [m, j]); } }
  return pts.filter((_, k) => keep[k]);
}
function simplifyRing(ring, tol){
  const r = ring[0][0] === ring[ring.length-1][0] && ring[0][1] === ring[ring.length-1][1] ? ring.slice(0, -1) : ring.slice();
  if(r.length < 4) return r;
  let far = 0, fd = -1; r.forEach((p, k) => { const d = (p[0]-r[0][0])**2 + (p[1]-r[0][1])**2; if(d > fd){ fd = d; far = k; } });
  const a = rdp(r.slice(0, far+1), tol), b = rdp([...r.slice(far), r[0]], tol);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}
const area = ring => { let s = 0; for(let i = 0, j = ring.length-1; i < ring.length; j = i++) s += (ring[j][0]+ring[i][0]) * (ring[j][1]-ring[i][1]); return s/2; };
const centroid = ring => { let a = 0, x = 0, y = 0; for(let i = 0, j = ring.length-1; i < ring.length; j = i++){ const f = ring[j][0]*ring[i][1] - ring[i][0]*ring[j][1]; a += f; x += (ring[j][0]+ring[i][0])*f; y += (ring[j][1]+ring[i][1])*f; } a /= 2; return [x/(6*a), y/(6*a)]; };

for(const [region, list] of Object.entries(FEATURES)){
  const P = PROJ[region];
  const proj = d3.geoAzimuthalEqualArea().rotate([-P.c[0], -P.c[1]]).scale(P.s).translate(P.t).clipAngle(90).precision(0.1);
  const box = [[[0,0],[P.w,0],[P.w,P.h],[0,P.h],[0,0]]];
  const items = [];
  for(const [n, sub, src, dataNames] of list){
    const feats = SRC[src].filter(f => dataNames.includes(nameOf(f)));
    if(!feats.length) throw new Error('not found: ' + n);
    // project each feature to flat map coordinates (d3 handles the globe; we read the projected rings back)
    const parts = [];
    for(const f of feats){
      const rings = [];
      const stream = proj.stream({ point(x, y){ rings[rings.length-1].push([x, y]); }, lineStart(){ rings.push([]); }, lineEnd(){}, polygonStart(){}, polygonEnd(){}, sphere(){} });
      d3.geoStream(f, stream);
      const good = rings.filter(r => r.length >= 3).map(r => [...r, r[0]]);
      // a feature's own rings: xor, so a ring inside another becomes a hole (an island in a lake)
      if(good.length) parts.push(good.length > 1 ? pc.xor(...good.map(r => [r])) : [[good[0]]]);
    }
    // several features (the sub-ranges of the Atlas, the parts of the Mediterranean) overlap or touch: join them
    let shape = parts.length > 1 ? pc.union(...parts) : (parts[0] || []);
    shape = pc.intersection(shape, box);               // only what is on this map
    const tol = sub === 'range' ? 1.2 : 0.6;
    shape = shape.map(poly => poly.map(r => simplifyRing(r, tol)).filter(r => r.length >= 3 && Math.abs(area(r)) > 0.8)).filter(p => p.length);
    if(!shape.length){ console.log(`  ${region}: ${n} is off this map, skipped`); continue; }
    const d = shape.map(poly => poly.map(r => 'M' + r.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z').join('')).join('');
    const all = shape.flat(2); const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
    const b = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(v => +v.toFixed(1));
    const big = shape.map(p => p[0]).sort((u, v) => Math.abs(area(v)) - Math.abs(area(u)))[0];
    let c = centroid(big).map(v => +v.toFixed(1));
    const item = {n, kind: sub === 'range' ? 'mountain' : 'water', sub, layer: (sub === 'lake' || sub === 'range') ? 'over' : 'under', d, b, c};
    if(Math.max(b[2]-b[0], b[3]-b[1]) < (sub === 'lake' ? 32 : 14)) item.dot = c; // too small to tap: give it a tap circle (lakes sit inside land and mountains, so a bit more generous)
    items.push(item);
  }
  const out = {base: region, items};
  fs.writeFileSync(path.join(OUT, `${region}-geo.json`), JSON.stringify(out));
  console.log(region, items.length, 'features', (JSON.stringify(out).length/1024).toFixed(0) + ' KB', items.filter(i => i.dot).map(i => i.n).join(', '));
}
