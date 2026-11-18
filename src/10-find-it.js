// World Geography Quiz: Find it: the game names a place and the player taps it.
// One of the game's script files, loaded in number order by index.html (see src/README.md).
'use strict';

/* ---- Find it: the app names a place, the player taps it ---- */
const findTarget = () => G.queue && G.queue[0];
function findAsk(n){
  if(T.showsItem) return `Which ${T.itemWord} has the capital ${key(n)}?`;
  return ITEM[n].kind === 'ocean' || (T.geo && !noThe(n)) ? `Find the ${n}` : `Find ${n}`;
}
// Mix-up help: when a kid picks the wrong place, show both and say how to tell them apart
function placeOf(answer){ return answer ? (NAMES.find(x => key(x) === answer) || (ITEM[answer] ? answer : null)) : null; }
// Look-alikes: pairs kids famously confuse, with a hand-written way to tell them apart.
// 'name' pairs help in place and capital games, 'flag' pairs in flag games.
const LOOKALIKES = [
  ['name','Niger','Nigeria','Niger is the big desert country farther north. Nigeria is south of it, on the coast.'],
  ['name','DR Congo','Republic of the Congo','DR Congo is the huge one. The Republic of the Congo is the smaller one just west of it.'],
  ['name','Guinea','Guinea-Bissau','Guinea-Bissau is the small one on the coast, northwest of Guinea.'],
  ['name','Guinea','Equatorial Guinea','Guinea is in West Africa. Equatorial Guinea is much farther east, next to Cameroon.'],
  ['name','Guinea-Bissau','Equatorial Guinea','Guinea-Bissau is in West Africa. Equatorial Guinea is far to the east, next to Cameroon.'],
  ['name','Gambia','Zambia','The Gambia is a thin strip inside Senegal in West Africa. Zambia is much bigger, in southern Africa.'],
  ['name','Mali','Malawi','Mali is a big country in West Africa. Malawi is long and thin, in the southeast, beside a big lake.'],
  ['name','Libya','Liberia','Libya is a big desert country on the Mediterranean Sea. Liberia is small, on the west coast.'],
  ['name','Mauritania','Mauritius','Mauritania is a big desert country in north-west Africa. Mauritius is a tiny island in the Indian Ocean.'],
  ['name','Slovakia','Slovenia','Slovakia is north of Hungary. Slovenia is smaller, next to Italy and the sea.'],
  ['name','Sweden','Switzerland','Sweden is in the far north. Switzerland is small and full of mountains, in the middle of Europe.'],
  ['name','Latvia','Lithuania','Of the three Baltic countries, Lithuania is the one at the bottom. Latvia is in the middle.'],
  ['name','Iceland','Ireland','Iceland is far north, near the Arctic. Ireland is the island next to Great Britain.'],
  ['name','Iran','Iraq','Iraq is the smaller one, to the west. Iran is bigger, to its east.'],
  ['name','Bahrain','Qatar','Bahrain is the tiny island. Qatar is the bigger piece of land poking into the sea just southeast of it.'],
  ['name','Kyrgyzstan','Tajikistan','Kyrgyzstan is the one on top. Tajikistan is just south of it.'],
  ['name','Turkmenistan','Uzbekistan','Turkmenistan is to the southwest, along the Caspian Sea. Uzbekistan is just northeast of it.'],
  ['name','Dominica','Dominican Republic','The Dominican Republic shares a big island with Haiti. Dominica is a tiny island far to the southeast.'],
  ['name','Saint Lucia','Saint Vincent and the Grenadines','Saint Lucia is just north of Saint Vincent.'],
  ['name','Paraguay','Uruguay','Uruguay is on the coast. Paraguay has no coast and is north of Argentina.'],
  ['name','Virginia','West Virginia','West Virginia is the smaller, mountain state to the northwest. Virginia reaches the ocean.'],
  ['name','Vermont','New Hampshire','Vermont is on the left and wide at the top. New Hampshire is on the right and wide at the bottom, like Vermont upside down.'],
  ['name','Mississippi','Missouri','Mississippi is in the south, by the Gulf. Missouri is farther north, in the middle of the country.'],
  ['name','Alabama','Mississippi','Mississippi is the one on the left. Alabama is just to its east.'],
  ['name','Kansas','Nebraska','Nebraska is the one on top. Kansas is just south of it.'],
  ['name','Lake Michigan','Lake Huron','Lake Michigan is the long one that points south. Lake Huron is just east of it.'],
  ['name','Lake Erie','Lake Ontario','Lake Ontario is the one farthest east. Lake Erie is just southwest of it, and Niagara Falls is between them.'],
  ['name','Lake Superior','Lake Huron','Lake Superior is the biggest one, at the top. Lake Huron is southeast of it.'],
  ['name','Lake Tanganyika','Lake Malawi','Lake Tanganyika is the long one farther north and west. Lake Malawi is to its southeast.'],
  ['name','Arabian Sea','Bay of Bengal','The Arabian Sea is west of India. The Bay of Bengal is east of India.'],
  ['name','Coral Sea','Tasman Sea','The Coral Sea is the northern one, by the Great Barrier Reef. The Tasman Sea is south, between Australia and New Zealand.'],
  ['name','Himalayas','Hindu Kush','The Himalayas are the long range to the east, along Nepal. The Hindu Kush is to the west, in Afghanistan.'],
  ['name','Big Ben','Stonehenge','Both are in England. Big Ben is in London; Stonehenge is out in the countryside to the west.'],
  ['name','Colosseum','Leaning Tower of Pisa','Both are in Italy. The Colosseum is in Rome; Pisa is farther north, near the coast.'],
  ['name','Great Wall of China','Terracotta Army','The Great Wall is in the north, near Beijing. The Terracotta Army is farther southwest, in Xi\'an.'],
  ['name','Mount Everest','Mount Fuji','Mount Everest is in the Himalayas, between Nepal and China. Mount Fuji is in Japan.'],
  ['name','Iguazu Falls','Angel Falls','Iguazu Falls is in the south, between Argentina and Brazil. Angel Falls is in the north, in Venezuela.'],
  ['name','Machu Picchu','Nazca Lines','Both are in Peru. Machu Picchu is up in the Andes; the Nazca Lines are in the desert near the coast.'],
  ['name','Chichén Itzá','Teotihuacan','Both are in Mexico. Teotihuacan is near Mexico City; Chichén Itzá is far east, on the Yucatán.'],
  ['name','Statue of Liberty','White House','The Statue of Liberty is in New York. The White House is farther south, in Washington, D.C.'],
  ['name','Northeast','Southeast','The Northeast is the small region at the top right. The Southeast is below it.'],
  ['name','Southwest','West','The Southwest is just four states, with Texas. The West is bigger and goes all the way to the Pacific Ocean.'],
  ['name','Dallas','Houston','Dallas is in north Texas. Houston is in the south, near the Gulf of Mexico.'],
  ['name','Los Angeles','San Diego','Los Angeles is the bigger one, farther north. San Diego is right by Mexico.'],
  ['name','Mississippi River','Missouri River','The Mississippi runs north to south down the middle of the country. The Missouri comes in from the west and joins it.'],
  ['name','Great Plains','Central Lowlands','The Great Plains are farther west, next to the Rocky Mountains. The Central Lowlands are east of them.'],
  ['name','Colorado Plateau','Great Basin','The Colorado Plateau is around the Grand Canyon. The Great Basin is west of it, mostly in Nevada.'],
  ['name','Cascade Range','Sierra Nevada','The Cascades are farther north, in Washington and Oregon. The Sierra Nevada is in California.'],
  ['name','Glacier National Park','Glacier Bay National Park','Glacier National Park is in Montana. Glacier Bay is in Alaska, by the sea.'],
  ['name','White Sands National Park','Great Sand Dunes National Park','White Sands is in New Mexico, with white sand. Great Sand Dunes is farther north, in Colorado.'],
  ['name','Bryce Canyon National Park','Zion National Park','Both are in southern Utah. Zion is in the corner; Bryce Canyon is a little farther northeast.'],
  ['name','Sequoia National Park','Redwood National Park','Redwood is on the coast in the far north of California. Sequoia is inland, in the mountains.'],
  ['name','Yellowstone National Park','Grand Teton National Park','Yellowstone is the big park on top. Grand Teton is the smaller one just south of it.'],
  ['name','Zion National Park','Arches National Park','Both are in Utah. Zion is in the southwest corner; Arches is in the east, near Colorado.'],
  ['name','Olympic National Park','Mount Rainier National Park','Both are in Washington. Olympic is out on the coast; Mount Rainier is farther inland.'],
  ['name','Death Valley National Park','Joshua Tree National Park','Death Valley is farther north, by Nevada. Joshua Tree is south, closer to Mexico.'],
  ['name','Rocky Mountains','Appalachian Mountains','The Rocky Mountains are in the west. The Appalachian Mountains are in the east.'],
  ['name','Sierra Nevada','Sierra Madre','The Sierra Nevada is in California, in the United States. The Sierra Madre is farther south, in Mexico.'],
  ['name','Yellow Sea','East China Sea','The Yellow Sea is the northern one, between China and Korea. The East China Sea is south of it.'],
  ['name','Aral Sea','Caspian Sea','The Caspian Sea is the huge one farther west. The Aral Sea is the small one to its east.'],
  ['name','Gulf of Guinea','Gulf of Aden','The Gulf of Guinea is on Africa’s west coast. The Gulf of Aden is on the east, by the Horn of Africa.'],
  ['name','Brazilian Highlands','Guiana Highlands','The Brazilian Highlands are the big area in eastern Brazil. The Guiana Highlands are the smaller area farther north.'],
  ['name','Great Victoria Desert','Great Sandy Desert','The Great Sandy Desert is farther north, near the northwest coast. The Great Victoria Desert is in the south.'],
  ['name','Sonoran Desert','Chihuahuan Desert','The Sonoran Desert is in the west, by the Gulf of California. The Chihuahuan Desert is farther east, near Texas.'],
  ['name','Mojave Desert','Sonoran Desert','The Mojave Desert is the northern one, around Death Valley and Las Vegas. The Sonoran Desert is south of it.'],
  ['name','Kalahari Desert','Namib Desert','The Namib Desert is the thin strip along the coast. The Kalahari Desert is the bigger one inland, to its east.'],
  ['name','Gobi Desert','Taklamakan Desert','The Gobi Desert is farther east, in Mongolia and China. The Taklamakan Desert is to the west, below the Tian Shan.'],
  ['name','Gulf of Carpentaria','Great Australian Bight','The Gulf of Carpentaria is in the north of Australia. The Great Australian Bight is the big curve in the south.'],
  ['name','Arkansas','Kansas','Kansas is in the middle of the country. Arkansas is farther southeast, next to the Mississippi River.'],
  ['flag','Belgium','Germany','Belgium’s stripes go up and down. Germany’s go across.'],
  ['flag','Ireland','Italy','Ireland’s flag is green, white and orange. Italy’s is green, white and red.'],
  ['flag','Netherlands','Luxembourg','Luxembourg’s blue is lighter, like the sky. The Netherlands’ blue is darker.'],
  ['flag','Slovakia','Slovenia','Both are white, blue and red. Slovakia’s shield has a white cross. Slovenia’s shows a mountain.'],
  ['flag','Russia','Slovakia','Russia’s flag is plain. Slovakia’s has a shield with a white cross.'],
  ['flag','Russia','Slovenia','Russia’s flag is plain. Slovenia’s has a small shield with a mountain.'],
  ['flag','Romania','Moldova','Moldova’s flag has an eagle in the middle. Romania’s is plain.'],
  ['flag','Mali','Guinea','Mali’s stripes go green, yellow, red. Guinea’s go the other way: red, yellow, green.'],
  ['flag','Mali','Senegal','Senegal’s flag has a green star in the middle. Mali’s is plain.'],
  ['flag','Iraq','Yemen','Iraq’s flag has green writing. Yemen’s is plain red, white and black.'],
  ['flag','Bahrain','Qatar','Qatar’s is a dark maroon. Bahrain’s is a brighter red with fewer points.'],
  ['flag','Honduras','Nicaragua','Honduras has five blue stars in the middle. Nicaragua has a round emblem.'],
  ['flag','Honduras','El Salvador','Honduras has five blue stars in the middle. El Salvador has a round emblem.'],
  ['flag','El Salvador','Nicaragua','Both have a round emblem. El Salvador’s blue is darker.'],
  ['flag','Colombia','Ecuador','Ecuador’s flag has a coat of arms with a condor. Colombia’s is plain.'],
  ['flag','Colombia','Venezuela','Venezuela’s flag has white stars in an arc. Colombia’s has a wide yellow stripe and nothing else.'],
  ['flag','Ecuador','Venezuela','Venezuela’s flag has white stars in an arc. Ecuador’s has a coat of arms.'],
  ['flag','Australia','New Zealand','New Zealand has four red stars. Australia has white stars, plus a big one under the Union Jack.'],
];
const pairKey = (a, b) => a < b ? a + '|' + b : b + '|' + a;
const LOOK = {}; LOOKALIKES.forEach(([kind, a, b, tip]) => LOOK[kind + ':' + pairKey(a, b)] = tip);
// "North Dakota" and "South Dakota", "North Korea" and "South Korea", "Sudan" and "South Sudan"
function northSouthTip(a, b){
  const base = n => n.replace(/^(North|South) /, '');
  if(a === b || base(a) !== base(b)) return '';
  const north = /^North /.test(a) || /^South /.test(b) ? a : b, south = north === a ? b : a;
  return `${north} is the one on top. ${south} is just south of it.`;
}
function lookalikeTip(a, b){ return T.flags ? LOOK['flag:' + pairKey(a, b)] : (LOOK['name:' + pairKey(a, b)] || northSouthTip(a, b)); }
// Mix-ups this player has made, per game topic, counted both ways (so a swap counts twice)
let MIXMEM = {};
async function loadMixes(){
  MIXMEM = {};
  if(!player) return;
  (await DB.all('items')).filter(r => r.pid === player.id && r.mix).forEach(r => {
    for(const [w, c] of Object.entries(r.mix)){ const k = r.topic + ':' + pairKey(r.item, w); MIXMEM[k] = (MIXMEM[k] || 0) + c; }
  });
}
// remember that `wrong` was given for `right`
function noteMix(right, wrong){
  if(!player || !T || !wrong || wrong === right || !ITEM[right] || !ITEM[wrong]) return;
  const k = T.id + ':' + pairKey(right, wrong); MIXMEM[k] = (MIXMEM[k] || 0) + 1;
  const pid = player.id, topic = T.id, key = `${pid}|${topic}|${right}`;
  withItem(key, async () => { const r = (await DB.get('items', key)) || {key, pid, topic, item:right, seen:0, right:0, wrong:0}; r.mix = {...(r.mix || {}), [wrong]: ((r.mix || {})[wrong] || 0) + 1}; await DB.put('items', r); });
}
// A tip only for a real mix-up: a known look-alike, or a pair this player has mixed up twice (a swap counts)
function mixTip(right, wrong){
  const a = ITEM[right], b = ITEM[wrong]; if(!a || !b || right === wrong || a.kind === 'ocean' || b.kind === 'ocean') return '';
  const lead = T.showsItem ? `${key(wrong)} is the capital of ${wrong}. ` : '';
  const look = lookalikeTip(right, wrong);
  if(look) return `<span class="mixtip">💡 ${esc(lead)}${esc(look)}</span>`;
  if((MIXMEM[T.id + ':' + pairKey(right, wrong)] || 0) < 2) return '';
  const dx = a.c[0] - b.c[0], dy = a.c[1] - b.c[1];
  const dir = Math.abs(dy) > Math.abs(dx) * 0.7 ? (dy < 0 ? 'north' : 'south') : (dx < 0 ? 'west' : 'east');
  const area = it => Math.max(1, (it.b[2]-it.b[0]) * (it.b[3]-it.b[1])), k = area(a) / area(b);
  const size = k > 1.8 ? ' and bigger' : k < 1/1.8 ? ' and smaller' : '';
  return `<span class="mixtip">💡 You've mixed up ${esc(right)} and ${esc(wrong)}. ${esc(lead)}${esc(right)} is ${dir} of ${esc(wrong)}${size}.</span>`;
}
// the mixed-up place stays marked for a few seconds, even when the map repaints
let MIX = null;
function flashMix(n){
  if(!n) return;
  MIX = {n, until: Date.now() + 2600};
  const mark = on => [els[n], DOTS[n]].forEach(el => el && el.classList.toggle('mixup', on));
  setTimeout(() => mark(true), 0); setTimeout(() => { if(MIX && MIX.n === n && Date.now() >= MIX.until - 50){ mark(false); MIX = null; } }, 2600);
}
function flashWrong(n){ [els[n], DOTS[n]].forEach(el => { if(!el) return; el.classList.add('wrongflash'); setTimeout(() => el.classList.remove('wrongflash'), 700); }); }
function findTap(n){
  const t = findTarget(); if(!t || G.busy) return;
  G.active = true;
  if(n === t){
    G.solved[t] = G.round; G.answers[t] = t;
    recordItem(player.id, T.id, t, G.tries === 0); sound('right');
    feedback(`Yes! That's <b>${esc(the(t))}</b>${T.showsItem ? `. Its capital is ${esc(key(t))}` : ''}.`, 'ok');
    current = t; paint(); G.busy = true; setTimeout(nextFind, 900); return;
  }
  if(isSolved(n) || G.answers[n]){ feedback(`That's ${esc(the(n))}. You already did that one. Keep looking!`); flashWrong(n); return; }
  if(n === G.lastWrong){ feedback(`That's ${esc(the(n))} again. Try another place!`, 'bad'); flashWrong(n); return; } // a second tap on the same wrong place (often by accident) doesn't use up a try
  G.tries++; G.lastWrong = n; if(!G.firstWrong) G.firstWrong = n; sound('wrong'); flashWrong(n); noteMix(t, n);
  const hint = T.showsItem ? `That's ${esc(n)}. Its capital is ${esc(key(n))}.` : `That's ${esc(the(n))}.`;
  if(G.tries < 3) feedback(`${hint} Try again! ${3-G.tries} ${3-G.tries === 1 ? 'try' : 'tries'} left. ${mixTip(t, n)}`, 'bad');
  else revealFind(`${hint} Here is <b>${esc(t)}</b>. ${mixTip(t, n)}`);
}
function revealFind(msg){
  const t = findTarget(); if(!t) return;
  G.answers[t] = G.firstWrong || 'skipped';
  recordItem(player.id, T.id, t, false);
  current = t; focusItem(t); feedback(msg, 'bad'); paint();
  G.busy = true; setTimeout(nextFind, 2000);
}
function nextFind(){
  G.queue.shift(); G.tries = 0; G.firstWrong = null; G.lastWrong = null; G.busy = false; current = null;
  saveSoon();
  if(!G.queue.length){ feedback('That was the last one!', 'ok'); paint(); setTimeout(() => { if(G && G.mode==='find' && !reviewing) review(); }, 700); return; }
  paint();
}
$('skipBtn').onclick = () => { if(G && !G.busy && findTarget()) revealFind(`Skipped. Here is <b>${esc(findTarget())}</b>.`); };
