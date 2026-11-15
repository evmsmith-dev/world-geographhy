// Builds the Landmarks maps: famous places on each continent's map (data/maps/<continent>-landmarks.json), each a tap circle,
// and US Landmarks on the United States map (data/maps/us-landmarks.json), where each is checked against its state instead.
// Each landmark is a point (longitude, latitude); the script checks that it lands inside the country it's in. A few that stand in
// the water (the Statue of Liberty, the Golden Gate Bridge, Milford Sound) are placed on the shore next to them, so they're on land at map size.
// Run: node tools/build-landmarks.mjs data/maps
import fs from 'node:fs';
import path from 'node:path';
import * as d3 from 'd3-geo';
import { PROJ, projectionFor } from './projections.mjs';
// the US map is Albers USA, with Alaska and Hawaii moved in next to the lower 48 (as for the national parks)
const US = {w: 975, h: 610, make: () => d3.geoAlbersUsa().scale(1300).translate([487.5, 305])};

const [out] = process.argv.slice(2);
// [name, [longitude, latitude], the country (or countries) as named on the map, how the game says where it is, options]
// noThe: the game says "Find Machu Picchu", not "Find the Machu Picchu"
const LANDMARKS = {
  europe: [
    ['Eiffel Tower', [2.2945, 48.8584], ['France'], 'France'],
    ['Colosseum', [12.4922, 41.8902], ['Italy'], 'Italy'],
    ['Big Ben', [-0.1246, 51.5007], ['United Kingdom'], 'the United Kingdom', {noThe: 1}],
    ['Leaning Tower of Pisa', [10.3966, 43.7230], ['Italy'], 'Italy'],
    ['Acropolis', [23.7257, 37.9715], ['Greece'], 'Greece'],
    ['Sagrada Família', [2.1744, 41.4036], ['Spain'], 'Spain'],
    ['Stonehenge', [-1.8262, 51.1789], ['United Kingdom'], 'the United Kingdom', {noThe: 1}],
    ['Neuschwanstein Castle', [10.7498, 47.5576], ['Germany'], 'Germany', {noThe: 1}],
    ['Kremlin', [37.6175, 55.7520], ['Russia'], 'Russia'],
    ['Brandenburg Gate', [13.3777, 52.5163], ['Germany'], 'Germany'],
  ],
  africa: [
    ['Pyramids of Giza', [31.1342, 29.9792], ['Egypt'], 'Egypt'],
    ['Abu Simbel', [31.6258, 22.3372], ['Egypt'], 'Egypt', {noThe: 1}],
    ['Mount Kilimanjaro', [37.3556, -3.0674], ['Tanzania'], 'Tanzania', {noThe: 1}],
    ['Victoria Falls', [25.8572, -17.9243], ['Zambia', 'Zimbabwe'], 'Zambia and Zimbabwe', {noThe: 1}],
    ['Table Mountain', [18.4098, -33.9628], ['South Africa'], 'South Africa', {noThe: 1}],
    ['Great Mosque of Djenné', [-4.5553, 13.9053], ['Mali'], 'Mali'],
    ['Great Zimbabwe', [30.9338, -20.2675], ['Zimbabwe'], 'Zimbabwe', {noThe: 1}],
    ['Rock Churches of Lalibela', [39.0473, 12.0317], ['Ethiopia'], 'Ethiopia'],
  ],
  asia: [
    ['Great Wall of China', [116.0204, 40.3587], ['China'], 'China'],
    ['Taj Mahal', [78.0421, 27.1751], ['India'], 'India'],
    ['Mount Everest', [86.9250, 27.9881], ['Nepal', 'China'], 'Nepal and China', {noThe: 1}],
    ['Angkor Wat', [103.8670, 13.4125], ['Cambodia'], 'Cambodia', {noThe: 1}],
    ['Petra', [35.4444, 30.3285], ['Jordan'], 'Jordan', {noThe: 1}],
    ['Mount Fuji', [138.7274, 35.3606], ['Japan'], 'Japan', {noThe: 1}],
    ['Burj Khalifa', [55.2744, 25.1972], ['United Arab Emirates'], 'the United Arab Emirates'],
    ['Terracotta Army', [109.2785, 34.3853], ['China'], 'China'],
    ['Petronas Towers', [101.7116, 3.1579], ['Malaysia'], 'Malaysia'],
    ['Borobudur', [110.2038, -7.6079], ['Indonesia'], 'Indonesia', {noThe: 1}],
  ],
  oceania: [
    ['Sydney Opera House', [151.2153, -33.8568], ['Australia'], 'Australia'],
    ['Uluru', [131.0369, -25.3444], ['Australia'], 'Australia', {noThe: 1}],
    ['Great Barrier Reef', [147.6992, -18.2871], ['Australia'], 'Australia', {sea: 1}], // out in the sea, off the coast
    ['Twelve Apostles', [143.10, -38.645], ['Australia'], 'Australia'],
    ['Milford Sound', [167.93, -44.67], ['New Zealand'], 'New Zealand', {noThe: 1}],
    ['Waitomo Glowworm Caves', [175.1036, -38.2610], ['New Zealand'], 'New Zealand'],
  ],
  namerica: [
    ['Statue of Liberty', [-74.094, 40.739], ['United States'], 'the United States'],
    ['White House', [-77.0365, 38.8977], ['United States'], 'the United States'],
    ['Mount Rushmore', [-103.4591, 43.8791], ['United States'], 'the United States', {noThe: 1}],
    ['Golden Gate Bridge', [-122.478, 37.87], ['United States'], 'the United States'],
    ['Hollywood Sign', [-118.3215, 34.1341], ['United States'], 'the United States'],
    ['Grand Canyon', [-112.1129, 36.1069], ['United States'], 'the United States'],
    ['Niagara Falls', [-79.0377, 43.0962], ['United States', 'Canada'], 'Canada and the United States', {noThe: 1}],
    ['Chichén Itzá', [-88.5678, 20.6843], ['Mexico'], 'Mexico', {noThe: 1}],
    ['Teotihuacan', [-98.8438, 19.6925], ['Mexico'], 'Mexico', {noThe: 1}],
    ['Panama Canal', [-79.68, 9.08], ['Panama'], 'Panama'],
  ],
  samerica: [
    ['Machu Picchu', [-72.5450, -13.1631], ['Peru'], 'Peru', {noThe: 1}],
    ['Christ the Redeemer', [-43.2105, -22.9519], ['Brazil'], 'Brazil', {noThe: 1}],
    ['Iguazu Falls', [-54.4367, -25.6953], ['Argentina', 'Brazil'], 'Argentina and Brazil', {noThe: 1}],
    ['Angel Falls', [-62.5362, 5.9701], ['Venezuela'], 'Venezuela', {noThe: 1}],
    ['Mitad del Mundo', [-78.4558, -0.0022], ['Ecuador'], 'Ecuador', {noThe: 1}], // (the Galápagos Islands are off the map)
    ['Perito Moreno Glacier', [-73.1377, -50.4967], ['Argentina'], 'Argentina'],
    ['Salar de Uyuni', [-67.4891, -20.1338], ['Bolivia'], 'Bolivia', {noThe: 1}],
    ['Nazca Lines', [-75.1300, -14.7390], ['Peru'], 'Peru'],
  ],
  // on the US map: the state (or states) each is in. None of North America's landmarks again: those are on that tab.
  us: [
    ['Gateway Arch', [-90.1847, 38.6247], ['Missouri'], 'Missouri'],
    ['Space Needle', [-122.3493, 47.6205], ['Washington'], 'Washington'],
    ['Liberty Bell', [-75.1503, 39.9496], ['Pennsylvania'], 'Pennsylvania'],
    ['Alamo', [-98.4861, 29.4260], ['Texas'], 'Texas'],
    ['Kennedy Space Center', [-80.6508, 28.5729], ['Florida'], 'Florida'],
    ['Hoover Dam', [-114.7377, 36.0161], ['Nevada', 'Arizona'], 'Nevada and Arizona'],
    ['Devils Tower', [-104.7146, 44.5902], ['Wyoming'], 'Wyoming', {noThe: 1}],
    ['Empire State Building', [-73.9857, 40.7484], ['New York'], 'New York'],
    ['Pearl Harbor', [-157.9500, 21.3649], ['Hawaii'], 'Hawaii', {noThe: 1}],
    ['Monument Valley', [-110.0985, 36.9980], ['Utah', 'Arizona'], 'Utah and Arizona', {noThe: 1}],
    ['Cape Hatteras Lighthouse', [-75.5288, 35.2505], ['North Carolina'], 'North Carolina'],
    ['Willis Tower', [-87.6359, 41.8789], ['Illinois'], 'Illinois'],
  ],
};

const r1 = x => Math.round(x * 10) / 10;
const inside = (d, x, y) => { let r = false; for(const ring of d.split('Z').filter(Boolean)){ const p = ring.slice(1).split('L').map(q => q.split(',').map(Number));
  for(let i = 0, j = p.length - 1; i < p.length; j = i++) if((p[i][1] > y) !== (p[j][1] > y) && x < p[i][0] + (y - p[i][1]) * (p[j][0] - p[i][0]) / (p[j][1] - p[i][1])) r = !r; } return r; };

for(const [region, list] of Object.entries(LANDMARKS)){
  const P = region === 'us' ? US : PROJ[region], proj = projectionFor(P), word = region === 'us' ? 'state' : 'country';
  const countries = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(out, `${region}.json`), 'utf8')).items.map(i => [i.n, i.d]));
  const items = list.map(([n, lonlat, inCountries, where, opt = {}]) => {
    inCountries.forEach(c => { if(!countries[c]) throw new Error(`${n}: no ${word} named ${c} on the ${region} map`); });
    const c = proj(lonlat).map(r1);
    if(!(c[0] >= 0 && c[0] <= P.w && c[1] >= 0 && c[1] <= P.h)) throw new Error(`${n} is off the ${region} map`);
    if(!opt.sea && !inCountries.some(k => inside(countries[k], c[0], c[1]))) console.log(`  ${n} is not inside ${inCountries.join(' or ')} on the map`);
    const item = {n, kind: 'landmark', sub: 'landmark', layer: 'over', where, [word]: inCountries,
      d: `M${r1(c[0] - 1.2)},${c[1]}a1.2,1.2 0 1,0 2.4,0a1.2,1.2 0 1,0 -2.4,0Z`, b: [c[0] - 1.2, c[1] - 1.2, c[0] + 1.2, c[1] + 1.2].map(r1), c, dot: c};
    if(opt.noThe) item.noThe = 1;
    if(opt.sea) item.sea = 1;
    return item;
  });
  fs.writeFileSync(path.join(out, `${region}-landmarks.json`), JSON.stringify({base: region, items}));
  console.log(region, items.length, 'landmarks');
}
