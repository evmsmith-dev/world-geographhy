// Adds each country's and US state's real area (km², rounded) to the maps, as `area`, and the latitude and longitude of the
// middle of its biggest piece of land, as `ll` [longitude, latitude]: what Mystery Country's size and direction clues use.
// Before, they came from the map shapes, which aren't a fair measure: Russia is cut off at the map's edge, and Alaska is drawn at about 35%.
// Countries come from world-atlas (Natural Earth, public domain), states from us-atlas (US Census), measured on the globe.
// Usage: node tools/add-areas.mjs <folder with world-atlas, us-atlas, topojson-client and d3-geo installed> [data/maps]
import fs from 'fs';
import path from 'path';
import {createRequire} from 'module';
const mods = process.argv[2], out = process.argv[3] || 'data/maps';
const require = createRequire(path.resolve(mods, 'node_modules', 'x.js'));
const tj = require('topojson-client'), d3 = require('d3-geo');
const R = 6371.0088; // the Earth's mean radius, km
// each island (polygon) on its own: some are stored the other way round, which would measure the rest of the globe
const ring = g => { let a = d3.geoArea(g); return a > 2 * Math.PI ? 4 * Math.PI - a : a; };
const km2 = f => {
  const g = f.geometry, a = g.type === 'MultiPolygon' ? g.coordinates.reduce((s, c) => s + ring({type: 'Polygon', coordinates: c}), 0) : ring(g);
  const k = a * R * R; return k >= 100 ? Math.round(k) : Number(k.toPrecision(3)); // tiny places (Vatican City) keep their size
};
// the middle of the biggest piece (mainland France, not French Guiana; Alaska's mainland, not the Aleutians)
const middle = f => { const g = f.geometry, polys = g.type === 'MultiPolygon' ? g.coordinates.map(c => ({type: 'Polygon', coordinates: c})) : [g];
  const big = polys.reduce((a, b) => ring(b) > ring(a) ? b : a); return d3.geoCentroid(big).map(v => Math.round(v * 100) / 100); };
// game name -> world-atlas name, where they differ
const ATLAS = {'Vatican City': 'Vatican', 'North Macedonia': 'Macedonia', 'Bosnia and Herzegovina': 'Bosnia and Herz.', Eswatini: 'eSwatini',
  'South Sudan': 'S. Sudan', 'São Tomé and Príncipe': 'São Tomé and Principe', 'Equatorial Guinea': 'Eq. Guinea', 'DR Congo': 'Dem. Rep. Congo',
  'Republic of the Congo': 'Congo', 'Central African Republic': 'Central African Rep.', 'Cape Verde': 'Cabo Verde', 'Marshall Islands': 'Marshall Is.',
  'Solomon Islands': 'Solomon Is.', 'United States': 'United States of America', 'Saint Vincent and the Grenadines': 'St. Vin. and Gren.',
  'Saint Kitts and Nevis': 'St. Kitts and Nevis', 'Dominican Republic': 'Dominican Rep.', 'Antigua and Barbuda': 'Antigua and Barb.'};
// too small for the atlas's outline to measure: the official area
// and Morocco without Western Sahara (Natural Earth's Morocco includes the part it controls; see tools/borders.mjs)
const KNOWN = {'Vatican City': 0.49, Morocco: 446550}, KNOWN_LL = {Morocco: [-6.3, 31.8]};
const world = require('world-atlas/countries-10m.json'), states = require('us-atlas/states-10m.json');
const C = Object.fromEntries(tj.feature(world, world.objects.countries).features.map(f => [f.properties.name, f]));
const S = Object.fromEntries(tj.feature(states, states.objects.states).features.map(f => [f.properties.name, f]));
// Crimea is part of Ukraine (UN General Assembly Resolution 68/262; see tools/borders.mjs), though Natural Earth
// draws it as part of Russia: move its piece across before measuring
{ const ru = C.Russia.geometry, ua = C.Ukraine.geometry, polys = ru.coordinates, k = polys.findIndex(c => d3.geoContains({type: 'Polygon', coordinates: c}, [34.1, 45.3]));
  if(k >= 0){ const [crimea] = polys.splice(k, 1); ua.type === 'MultiPolygon' ? ua.coordinates.push(crimea) : Object.assign(ua, {type: 'MultiPolygon', coordinates: [ua.coordinates, crimea]}); } }
const missing = [];
for(const [file, from] of [...['europe', 'africa', 'asia', 'oceania', 'namerica', 'samerica'].map(m => [m, C]), ['us', S]]){
  const p = path.join(out, file + '.json'), raw = fs.readFileSync(p, 'utf8'), j = JSON.parse(raw);
  for(const it of j.items){ const f = from[ATLAS[it.n] || it.n]; if(!f){ missing.push(`${file}: ${it.n}`); continue; } it.area = KNOWN[it.n] || km2(f); it.ll = KNOWN_LL[it.n] || middle(f); }
  fs.writeFileSync(p, JSON.stringify(j) + (raw.endsWith('\n') ? '\n' : ''));
  const big = [...j.items].sort((a, b) => b.area - a.area);
  console.log(file.padEnd(9), `${j.items.length} places; biggest ${big[0].n} ${big[0].area.toLocaleString()} km², smallest ${big.at(-1).n} ${big.at(-1).area.toLocaleString()} km²`);
}
if(missing.length){ console.error('No shape found for:', missing.join(', ')); process.exit(1); }
