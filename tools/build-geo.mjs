// Builds the "Land & Water" map files (data/maps/europe-geo.json, africa-geo.json, ...).
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
  // the United States map (us-atlas, 975 × 610) is Albers USA; its lower 48 part is this Albers projection.
  // Places on land are cut to the lower 48 states, so a range doesn't spill into Canada or Mexico.
  us:       {make: () => d3.geoAlbers().scale(1300).translate([487.5, 305]), w:975, h:610, landOnly:true},
};
// [name in the game, kind, source, names in the data]. Natural Earth splits some seas into smaller named parts
// (the Tyrrhenian and Ionian in the Mediterranean, the Gulf of Bothnia in the Baltic...), so those parts are joined back in. Seas sit under the land; lakes and mountains sit on top of it.
const FEATURES = {
  us: [['Rocky Mountains','range','mtn',['ROCKY MOUNTAINS']], ['Appalachian Mountains','range','mtn',['APPALACHIAN MTS.']], ['Cascade Range','range','mtn',['CASCADE RANGE']],
    ['Sierra Nevada','range','mtn',['SIERRA NEVADA']], ['Black Hills','range','mtn',['Black Hills']],
    ['Great Plains','plain','mtn',['GREAT PLAINS']], ['Central Lowlands','plain','mtn',['CENTRAL LOWLAND']], ['Coastal Plain','plain','mtn',['COASTAL PLAIN']],
    ['Colorado Plateau','plateau','mtn',['COLORADO PLATEAU']], ['Ozark Plateau','plateau','mtn',['Ozark Plateau']], ['Great Basin','basin','mtn',['GREAT BASIN']], ['Central Valley','valley','mtn',['Central Valley']],
    ['Mojave Desert','desert','hand',['Mojave Desert']], ['Sonoran Desert','desert','mtn',['SONORAN DESERT']], ['Chihuahuan Desert','desert','mtn',['CHIHUAHUAN DESERT']],
    ['Lake Superior','lake','lake',['Lake Superior']], ['Lake Michigan','lake','lake',['Lake Michigan']], ['Lake Huron','lake','lake',['Lake Huron']], ['Lake Erie','lake','lake',['Lake Erie']], ['Lake Ontario','lake','lake',['Lake Ontario']],
    ['Great Salt Lake','lake','lake',['Great Salt Lake']], ['Lake Okeechobee','lake','lake',['Lake Okeechobee']],
    // rivers: lines, not shapes. The same name can be a river elsewhere too (a Colorado in Texas and one in Argentina), so each keeps only
    // the parts inside a longitude/latitude box; the Colorado stops at the Mexican border
    ['Mississippi River','river','river',['Mississippi'],{box:[-96, 28, -88, 48]}], ['Missouri River','river','river',['Missouri'],{box:[-114, 38, -90, 49]}],
    ['Ohio River','river','river',['Ohio'],{box:[-90, 36, -79, 41]}], ['Colorado River','river','river',['Colorado'],{box:[-116, 32.6, -105, 41]}],
    ['Rio Grande','river','river',['Rio Grande'],{box:[-108, 25, -96, 38]}],
    ['Gulf of Mexico','gulf','sea',['Gulf of Mexico']], ['Chesapeake Bay','bay','sea',['Chesapeake Bay'],{over:true}], ['San Francisco Bay','bay','sea',['San Francisco Bay'],{over:true}], ['Gulf of Maine','gulf','sea',['Gulf of Maine']]],
  namerica: [['Rocky Mountains','range','mtn',['ROCKY MOUNTAINS']], ['Appalachian Mountains','range','mtn',['APPALACHIAN MTS.']],
    ['Sierra Madre','range','mtn',['SIERRA MADRE OCCIDENTAL','SIERRA MADRE ORIENTAL','Sierra Madre del Sur']],
    ['Gulf of Mexico','gulf','sea',['Gulf of Mexico','Bahía de Campeche']], ['Hudson Bay','bay','sea',['Hudson Bay','James Bay']], ['Caribbean Sea','sea','sea',['Caribbean Sea','Gulf of Honduras']], ['Bering Sea','sea','sea',['Bering Sea']],
    ['Lake Superior','lake','lake',['Lake Superior']], ['Lake Michigan','lake','lake',['Lake Michigan']], ['Lake Huron','lake','lake',['Lake Huron']], ['Lake Erie','lake','lake',['Lake Erie']], ['Lake Ontario','lake','lake',['Lake Ontario']],
    ['Sierra Nevada','range','mtn',['SIERRA NEVADA']], ['Great Salt Lake','lake','lake',['Great Salt Lake']],
    ['Sonoran Desert','desert','mtn',['SONORAN DESERT']], ['Chihuahuan Desert','desert','mtn',['CHIHUAHUAN DESERT']], ['Mojave Desert','desert','hand',['Mojave Desert']]],
  // big land regions come first, so they draw under the mountain ranges they touch (Patagonia under the Andes)
  samerica: [['Patagonia','region','mtn',['PATAGONIA']], ['Brazilian Highlands','highlands','mtn',['BRAZILIAN HIGHLANDS']], ['Guiana Highlands','highlands','mtn',['GUIANA HIGHLANDS']],
    ['Andes','range','mtn',['ANDES']], ['Lake Titicaca','lake','lake',['Lago Titicaca']], ['Río de la Plata','estuary','sea',['Río de la Plata']], ['Atacama Desert','desert','mtn',['DESIERTO DE ATACAMA'],{top:true}]],
  europe: [['Alps','range','mtn',['ALPS']], ['Pyrenees','range','mtn',['PYRENEES']], ['Ural Mountains','range','mtn',['URAL MOUNTAINS']], ['Caucasus Mountains','range','mtn',['CAUCASUS MTS.','Lesser Caucasus']],
    ['Scandinavian Mountains','range','mtn',['KJØLEN MOUNTAINS']],
    ['Mediterranean Sea','sea','sea',['Mediterranean Sea','Alboran Sea','Balearic Sea','Golfe du Lion','Gulf of Gabès','Gulf of Sidra','Ionian Sea','Ligurian Sea','Tyrrhenian Sea']], ['Adriatic Sea','sea','sea',['Adriatic Sea']], ['Aegean Sea','sea','sea',['Aegean Sea','Sea of Crete']], ['Black Sea','sea','sea',['Black Sea']], ['Baltic Sea','sea','sea',['Baltic Sea','Gulf of Bothnia','Gulf of Finland','Gulf of Riga','Mecklenburger Bucht']], ['North Sea','sea','sea',['North Sea','Skagerrak']],
    ['Carpathian Mountains','range','mtn',['CARPATHIAN MOUNTAINS']], ['Bay of Biscay','bay','sea',['Bay of Biscay']], ['English Channel','channel','sea',['English Channel']]],
  africa: [['Atlas Mountains','range','mtn',['ATLAS MOUNTAINS','HAUT ATLAS','ATLAS SAHARIEN','Anti Atlas','Moyen Atlas','Atlas Tellien']], ['Ethiopian Highlands','highlands','mtn',['ETHIOPIAN HIGHLANDS']],
    ['Red Sea','sea','sea',['Red Sea']], ['Lake Victoria','lake','lake',['Lake Victoria']], ['Lake Tanganyika','lake','lake',['Lake Tanganyika']], ['Lake Malawi','lake','lake',['Lake Malawi']],
    ['Drakensberg','range','mtn',['DRAKENSBERG']], ['Gulf of Guinea','gulf','sea',['Gulf of Guinea','Bight of Benin','Bight of Biafra']], ['Gulf of Aden','gulf','sea',['Gulf of Aden']], ['Lake Chad','lake','lake',['Lake Chad']],
    ['Sahara','desert','mtn',['SAHARA']], ['Kalahari Desert','desert','mtn',['KALAHARI DESERT']], ['Namib Desert','desert','mtn',['NAMIB DESERT']]],
  asia: [['Himalayas','range','mtn',['HIMALAYAS']], ['Hindu Kush','range','mtn',['HINDU KUSH']], ['Tian Shan','range','mtn',['TIAN SHAN']],
    ['Caspian Sea','lake','sea',['Caspian Sea']], ['Arabian Sea','sea','sea',['Arabian Sea']], ['Persian Gulf','gulf','sea',['Persian Gulf']], ['Bay of Bengal','bay','sea',['Bay of Bengal']],
    ['South China Sea','sea','sea',['South China Sea','Gulf of Tonkin']], ['Sea of Japan','sea','sea',['Sea of Japan']], ['Lake Baikal','lake','lake',['Lake Baikal']],
    ['Zagros Mountains','range','mtn',['ZAGROS MOUNTAINS']], ['Yellow Sea','sea','sea',['Yellow Sea','Bo Hai']], ['East China Sea','sea','sea',['East China Sea']], ['Aral Sea','lake','lake',['South Aral Sea','North Aral Sea']], ['Dead Sea','lake','lake',['Dead Sea']],
    ['Arabian Desert','desert','mtn',['RUB’ AL KHALI','An Nafud Desert']], ['Gobi Desert','desert','mtn',['GOBI DESERT']], ['Taklamakan Desert','desert','mtn',['TAKLIMAKAN DESERT']], ['Thar Desert','desert','mtn',['THAR DESERT']]],
  oceania: [['Great Dividing Range','range','mtn',['GREAT DIVIDING RANGE']], ['Coral Sea','sea','sea',['Coral Sea']], ['Tasman Sea','sea','sea',['Tasman Sea']],
    ['Southern Alps','range','mtn',['SOUTHERN ALPS']], ['Gulf of Carpentaria','gulf','sea',['Gulf of Carpentaria']], ['Great Australian Bight','bay','sea',['Great Australian Bight']],
    ['Great Victoria Desert','desert','mtn',['GREAT VICTORIA DESERT']], ['Great Sandy Desert','desert','mtn',['GREAT SANDY DESERT']], ['Simpson Desert','desert','mtn',['Simpson Desert']]],
};
// Natural Earth has no Mojave Desert, so its outline is drawn here by hand (longitude, latitude), going clockwise:
// from the Antelope Valley north past Death Valley, east to Las Vegas and the Colorado River, then back west along the edge of the Sonoran Desert
const HAND = [{type:'Feature', properties:{name:'Mojave Desert'}, geometry:{type:'Polygon', coordinates:[[
  [-118.45,34.75], [-118.2,35.25], [-117.95,35.75], [-117.55,36.2], [-117.2,36.75], [-116.8,37.1], [-116.3,36.95], [-115.7,36.65], [-115.1,36.45],
  [-114.55,36.2], [-114.05,35.75], [-114.2,35.2], [-114.45,34.75], [-114.9,34.35], [-115.5,34.05], [-116.2,33.95], [-116.75,34.15], [-117.3,34.35],
  [-117.85,34.5], [-118.45,34.75]]]}}];
const SRC = {sea: load('ne_10m_geography_marine_polys'), lake: load('ne_50m_lakes'), mtn: load('ne_10m_geography_regions_polys'), hand: HAND, river: load('ne_50m_rivers_lake_centerlines')};
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

// A river: its lines inside opt.box (longitude/latitude), projected, cut at the map's edges and simplified
function riverItem(n, feats, proj, P, opt){
  const [w, s, e, nn] = opt.box, lines = [];
  for(const f of feats){
    const parts = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for(const line of parts){
      let cur = [];
      for(const [lon, lat] of line){
        const p = lon >= w && lon <= e && lat >= s && lat <= nn ? proj([lon, lat]) : null;
        if(p && p[0] >= 0 && p[0] <= P.w && p[1] >= 0 && p[1] <= P.h) cur.push(p); else { if(cur.length > 1) lines.push(cur); cur = []; }
      }
      if(cur.length > 1) lines.push(cur);
    }
  }
  const simple = lines.map(l => rdp(l, 0.5)).filter(l => l.length > 1);
  const d = simple.map(l => 'M' + l.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L')).join('');
  const all = simple.flat(), xs = all.map(p => p[0]), ys = all.map(p => p[1]);
  const longest = simple.slice().sort((a, b) => b.length - a.length)[0];
  return {n, kind: 'river', sub: 'river', layer: 'over', d, b: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(v => +v.toFixed(1)),
    c: longest[longest.length >> 1].map(v => +v.toFixed(1))};
}

for(const [region, list] of Object.entries(FEATURES)){
  const P = PROJ[region];
  const proj = P.make ? P.make() : d3.geoAzimuthalEqualArea().rotate([-P.c[0], -P.c[1]]).scale(P.s).translate(P.t).clipAngle(90).precision(0.1);
  const box = [[[0,0],[P.w,0],[P.w,P.h],[0,P.h],[0,0]]];
  // the land of this map's own places (the lower 48 states), read from its map file
  const land = P.landOnly ? pc.union(...JSON.parse(fs.readFileSync(path.join(OUT, `${region}.json`), 'utf8')).items.filter(i => !['Alaska', 'Hawaii'].includes(i.n))
    .flatMap(i => i.d.split('Z').filter(Boolean).map(r => [[...r.slice(1).split('L').map(p => p.split(',').map(Number)), r.slice(1).split('L')[0].split(',').map(Number)]]))) : null;
  const items = [];
  for(const [n, sub, src, dataNames, opt = {}] of list){
    const feats = SRC[src].filter(f => dataNames.includes(nameOf(f)));
    if(!feats.length) throw new Error('not found: ' + n);
    if(src === 'river'){ items.push(riverItem(n, feats, proj, P, opt)); continue; }
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
    if(land && (src === 'mtn' || src === 'hand')) shape = pc.intersection(shape, land);
    const tol = src === 'mtn' || src === 'hand' ? 1.2 : 0.6;
    shape = shape.map(poly => poly.map(r => simplifyRing(r, tol)).filter(r => r.length >= 3 && Math.abs(area(r)) > 0.8)).filter(p => p.length);
    if(!shape.length){ console.log(`  ${region}: ${n} is off this map, skipped`); continue; }
    const d = shape.map(poly => poly.map(r => 'M' + r.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z').join('')).join('');
    const all = shape.flat(2); const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
    const b = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(v => +v.toFixed(1));
    const big = shape.map(p => p[0]).sort((u, v) => Math.abs(area(v)) - Math.abs(area(u)))[0];
    let c = centroid(big).map(v => +v.toFixed(1));
    const onLand = src === 'mtn' || src === 'hand';
    const flat = ['plain', 'plateau', 'basin', 'valley'].includes(sub); // the US's plains and plateaus: land, but not mountains
    const item = {n, kind: sub === 'desert' ? 'desert' : flat ? 'plain' : onLand ? 'mountain' : 'water', sub, layer: (sub === 'lake' || onLand || opt.over) ? 'over' : 'under', d, b, c}; // bays tucked inside the states' land are drawn on top of it (opt.over)
    if(opt.top) item.top = 1;
    if(Math.max(b[2]-b[0], b[3]-b[1]) < (sub === 'lake' || opt.over ? 32 : 14)) item.dot = c; // too small to tap: give it a tap circle (lakes sit inside land and mountains, so a bit more generous)
    items.push(item);
  }
  // places on land are drawn bottom to top: deserts, then big regions and highlands, then mountain ranges, then lakes.
  // A desert that lies inside a mountain range (the Atacama, in the Andes) is marked top, so it sits above the range
  const rank = i => i.layer === 'under' ? 0 : i.kind === 'river' ? 6 : i.top ? 4 : i.kind === 'plain' ? 0.5 : i.sub === 'desert' ? 1 : (i.sub === 'region' || i.sub === 'highlands') ? 2 : i.sub === 'range' ? 3 : 5;
  items.sort((u, v) => rank(u) - rank(v));
  items.forEach(i => delete i.top);
  const out = {base: region, items};
  fs.writeFileSync(path.join(OUT, `${region}-geo.json`), JSON.stringify(out));
  console.log(region, items.length, 'features', (JSON.stringify(out).length/1024).toFixed(0) + ' KB', items.filter(i => i.dot).map(i => i.n).join(', '));
}
