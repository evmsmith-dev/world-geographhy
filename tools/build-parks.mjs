// Builds the National Parks map (data/maps/usparks.json): 23 well-known parks on the US map.
// Outlines come from Natural Earth's parks (public domain); the four parks Natural Earth doesn't have are a point,
// from the National Park Service (public domain). Every park gets a tap circle, since most are small on the map.
// Run: node tools/build-parks.mjs <folder with ne_10m_parks_and_protected_lands_area.geojson> data/maps
import fs from 'node:fs';
import path from 'node:path';
import * as d3 from 'd3-geo';

const [src, out] = process.argv.slice(2);
// the same projection as the US map (us-atlas's states-albers-10m: Albers USA, 975 × 610)
const proj = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]), geoPath = d3.geoPath(proj);
const NE = JSON.parse(fs.readFileSync(path.join(src, 'ne_10m_parks_and_protected_lands_area.geojson'), 'utf8')).features;

// [name in the game, name in Natural Earth or [longitude, latitude], the state(s) it's in]
const PARKS = [
  ['Yellowstone National Park', 'Yellowstone NP', 'Wyoming, Montana and Idaho'],
  ['Yosemite National Park', 'Yosemite NP', 'California'],
  ['Grand Canyon National Park', 'Grand Canyon NP', 'Arizona'],
  ['Zion National Park', 'Zion NP', 'Utah'],
  ['Arches National Park', [-109.586, 38.7225], 'Utah'],
  ['Rocky Mountain National Park', 'Rocky Mountain NP', 'Colorado'],
  ['Grand Teton National Park', 'Grand Teton NP', 'Wyoming'],
  ['Glacier National Park', 'Glacier NP', 'Montana'],
  ['Olympic National Park', 'Olympic NP', 'Washington'],
  ['Mount Rainier National Park', 'Mount Rainier NP', 'Washington'],
  ['Crater Lake National Park', 'Crater Lake NP', 'Oregon'],
  ['Great Smoky Mountains National Park', 'Great Smoky Mountains NP', 'Tennessee and North Carolina'],
  ['Everglades National Park', 'Everglades NP', 'Florida'],
  ['Acadia National Park', [-68.2397, 44.3594], 'Maine'],
  ['Shenandoah National Park', 'Shenandoah NP', 'Virginia'],
  ['Mammoth Cave National Park', [-86.101, 37.187], 'Kentucky'],
  ['Badlands National Park', 'Badlands NP', 'South Dakota'],
  ['Death Valley National Park', 'Death Valley NP', 'California and Nevada'],
  ['Joshua Tree National Park', 'Joshua Tree NP', 'California'],
  ['Carlsbad Caverns National Park', [-104.4439, 32.1753], 'New Mexico'],
  ['Big Bend National Park', 'Big Bend NP', 'Texas'],
  ['Denali National Park', 'Denali NP & PRES', 'Alaska'],
  ['Hawaiʻi Volcanoes National Park', "Hawai'i Volcanoes NP", 'Hawaii'],
];

const r1 = x => Math.round(x * 10) / 10;
// simplify a ring (Ramer–Douglas–Peucker), in map units
function rdp(pts, tol){
  if(pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]]; let idx = 0, max = 0;
  for(let i = 1; i < pts.length - 1; i++){
    const [x, y] = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const d = Math.abs(dy * x - dx * y + b[0] * a[1] - b[1] * a[0]) / len;
    if(d > max){ max = d; idx = i; }
  }
  return max > tol ? [...rdp(pts.slice(0, idx + 1), tol).slice(0, -1), ...rdp(pts.slice(idx), tol)] : [a, b];
}
const ringsOf = g => g.type === 'Polygon' ? [g.coordinates[0]] : g.coordinates.map(p => p[0]);
// a closed ring is simplified as two halves, so its ends (the same point) don't collapse it
const simplifyRing = (r, tol) => { const h = r.length >> 1; return [...rdp(r.slice(0, h + 1), tol).slice(0, -1), ...rdp(r.slice(h), tol)]; };

const items = PARKS.map(([n, from, where]) => {
  let d, c, b;
  if(Array.isArray(from)){ // a point: a small round mark, with the tap circle on it
    c = proj(from).map(r1);
    d = `M${r1(c[0] - 1.5)},${c[1]}a1.5,1.5 0 1,0 3,0a1.5,1.5 0 1,0 -3,0Z`;
    b = [c[0] - 1.5, c[1] - 1.5, c[0] + 1.5, c[1] + 1.5].map(r1);
  } else {
    const f = NE.find(f => f.properties.unit_name === from);
    if(!f) throw new Error('not in Natural Earth: ' + from);
    const rings = ringsOf(f.geometry).map(r => simplifyRing(r.map(p => proj(p)).filter(Boolean), 0.4)).filter(r => r.length >= 3);
    d = rings.map(r => 'M' + r.map(p => `${r1(p[0])},${r1(p[1])}`).join('L') + 'Z').join('');
    c = geoPath.centroid(f).map(r1);
  }
  const xs = [...d.matchAll(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g)].map(m => [+m[1], +m[2]]);
  b = b || [Math.min(...xs.map(p => p[0])), Math.min(...xs.map(p => p[1])), Math.max(...xs.map(p => p[0])), Math.max(...xs.map(p => p[1]))].map(r1);
  return {n, kind: 'park', sub: 'park', layer: 'over', where, d, b, c, dot: c};
});
fs.writeFileSync(path.join(out, 'usparks.json'), JSON.stringify({base: 'us', items}));
console.log(items.length, 'parks,', fs.statSync(path.join(out, 'usparks.json')).size, 'bytes');
