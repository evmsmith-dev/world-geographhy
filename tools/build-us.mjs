// Builds two maps drawn over the US states: the 5 regions (data/maps/usregions.json) and 25 big cities (data/maps/uscities.json).
// Regions are made from the states' own shapes in data/maps/us.json; city locations come from Natural Earth's populated places (public domain).
// Run: node tools/build-us.mjs <folder with ne_10m_populated_places_simple.geojson> data/maps
import fs from 'node:fs';
import path from 'node:path';
import * as d3 from 'd3-geo';
import pc from 'polygon-clipping';

const [src, out] = process.argv.slice(2);
const r1 = x => Math.round(x * 10) / 10;
const US = JSON.parse(fs.readFileSync(path.join(out, 'us.json'), 'utf8'));
const rings = d => d.split('Z').filter(Boolean).map(r => { const pts = r.slice(1).split('L').map(p => p.split(',').map(Number)); return [[...pts, pts[0]]]; });
const area = ring => { let s = 0; for(let i = 0, j = ring.length-1; i < ring.length; j = i++) s += (ring[j][0]+ring[i][0]) * (ring[j][1]-ring[i][1]); return s/2; };
const centroid = ring => { let a = 0, x = 0, y = 0; for(let i = 0, j = ring.length-1; i < ring.length; j = i++){ const f = ring[j][0]*ring[i][1] - ring[i][0]*ring[j][1]; a += f; x += (ring[j][0]+ring[i][0])*f; y += (ring[j][1]+ring[i][1])*f; } return [x/(3*a), y/(3*a)]; };

// The 5 regions taught in school (as on National Geographic's map of US regions)
const REGIONS = {
  Northeast: ['Maine', 'New Hampshire', 'Vermont', 'Massachusetts', 'Rhode Island', 'Connecticut', 'New York', 'New Jersey', 'Pennsylvania', 'Delaware', 'Maryland'],
  Southeast: ['West Virginia', 'Virginia', 'Kentucky', 'Tennessee', 'North Carolina', 'South Carolina', 'Georgia', 'Florida', 'Alabama', 'Mississippi', 'Arkansas', 'Louisiana'],
  Midwest: ['Ohio', 'Indiana', 'Michigan', 'Illinois', 'Wisconsin', 'Minnesota', 'Iowa', 'Missouri', 'North Dakota', 'South Dakota', 'Nebraska', 'Kansas'],
  Southwest: ['Arizona', 'New Mexico', 'Texas', 'Oklahoma'],
  West: ['Colorado', 'Wyoming', 'Montana', 'Idaho', 'Washington', 'Oregon', 'Utah', 'Nevada', 'California', 'Alaska', 'Hawaii'],
};
const all = Object.values(REGIONS).flat();
if(all.length !== 50 || new Set(all).size !== 50 || all.some(s => !US.items.find(i => i.n === s))) throw new Error('every state in exactly one region');
const regions = Object.entries(REGIONS).map(([n, states], k) => {
  // the region's outline: its states joined, so the lines between them disappear
  const shape = pc.union(...states.flatMap(s => rings(US.items.find(i => i.n === s).d).map(r => [r])));
  const d = shape.map(poly => poly.map(r => 'M' + r.slice(0, -1).map(p => `${r1(p[0])},${r1(p[1])}`).join('L') + 'Z').join('')).join('');
  const pts = shape.flat(2), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const big = shape.map(p => p[0]).sort((u, v) => Math.abs(area(v)) - Math.abs(area(u)))[0];
  const where = states.slice(0, -1).join(', ') + ' and ' + states[states.length - 1];
  return {n, kind: 'usregion', sub: 'usregion', layer: 'over', tone: k + 1, where, states: states.length, d,
    b: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(r1), c: centroid(big).map(r1)};
});
fs.writeFileSync(path.join(out, 'usregions.json'), JSON.stringify({base: 'us', items: regions}));

// 25 big and well-known cities, spread over the country (only a few on the crowded East Coast)
const CITIES = [['New York', 'New York'], ['Los Angeles', 'California'], ['Chicago', 'Illinois'], ['Houston', 'Texas'], ['Phoenix', 'Arizona'],
  ['Philadelphia', 'Pennsylvania'], ['San Antonio', 'Texas'], ['San Diego', 'California'], ['Dallas', 'Texas'], ['San Francisco', 'California'],
  ['Seattle', 'Washington'], ['Denver', 'Colorado'], ['Washington, D.C.', 'District of Columbia'], ['Boston', 'Massachusetts'], ['Miami', 'Florida'],
  ['Atlanta', 'Georgia'], ['New Orleans', 'Louisiana'], ['Las Vegas', 'Nevada'], ['Detroit', 'Michigan'], ['Minneapolis', 'Minnesota'],
  ['St. Louis', 'Missouri'], ['Portland', 'Oregon'], ['Nashville', 'Tennessee'], ['Anchorage', 'Alaska'], ['Honolulu', 'Hawaii']];
const PLACES = JSON.parse(fs.readFileSync(path.join(src, 'ne_10m_populated_places_simple.geojson'), 'utf8')).features
  .filter(f => f.properties.adm0name === 'United States of America');
const proj = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]); // the US map's projection
const cities = CITIES.map(([n, state]) => {
  const f = PLACES.find(f => f.properties.name.replace(/\s+/g, ' ') === n && f.properties.adm1name === state);
  if(!f) throw new Error('not in Natural Earth: ' + n);
  const c = proj(f.geometry.coordinates).map(r1);
  return {n, kind: 'city', sub: 'city', layer: 'over', where: state === 'District of Columbia' ? 'the District of Columbia' : state,
    d: `M${r1(c[0] - 1.2)},${c[1]}a1.2,1.2 0 1,0 2.4,0a1.2,1.2 0 1,0 -2.4,0Z`, b: [c[0] - 1.2, c[1] - 1.2, c[0] + 1.2, c[1] + 1.2].map(r1), c, dot: c};
});
fs.writeFileSync(path.join(out, 'uscities.json'), JSON.stringify({base: 'us', items: cities}));
console.log(regions.length, 'regions,', cities.length, 'cities');
