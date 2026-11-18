// World Geography Quiz: Mystery Country and Beat the Clock.
// One of the game's script files, loaded in number order by index.html (see src/README.md).
'use strict';

/* ===================== 10d. Beat the Clock ===================== */
// One topic, as many right as you can in 60 seconds: Find it and Name it questions, one try each, no waiting around.
const BEAT_SECONDS = 60;
const beatSeconds = () => (window.WGQ_TEST && WGQ_TEST.clockSeconds) || BEAT_SECONDS; // tests can make it shorter
const beatBest = t => ((player.clock || {})[t.id]) || 0;

async function startBeat(tid, part){
  const t = TOPIC[tid];
  return startRun({title:'Beat the Clock', home:'scrRegion', clock: beatSeconds(), topic: tid,
    pick: async () => { // plenty of questions, the whole topic over and over, never the same one twice in a row
      const m = await loadMap(t.map); if(t.flags) await loadFlags(t.map);
      const names = part && t.parts && t.parts[part] ? t.parts[part] : m.items.map(i => i.n), out = []; // just the part chosen, like West Africa
      while(out.length < 150){ const round = shuffle(names); if(out.length && round[0] === out[out.length-1].n) round.push(round.shift()); round.forEach(n => out.push({t: tid, n, style: runStyle(t)})); }
      return out;
    },
    finish: beatFinish, again: () => startBeat(tid, part)});
}
// the countdown, in the play bar's clock
function beatStart(){
  const run = DAILY, ends = Date.now() + run.clock * 1000, el = $('clock');
  el.hidden = false; el.classList.remove('low');
  const tick = () => {
    if(DAILY !== run || run.ended){ clearInterval(timer); if(DAILY !== run) el.hidden = true; return; }
    const left = Math.max(0, Math.ceil((ends - Date.now()) / 1000));
    el.textContent = fmtTime(left * 1000); el.setAttribute('aria-label', `${left} seconds left`); el.classList.toggle('low', left <= 10);
    if(left === 0){ clearInterval(timer); run.ended = true; run.busy = true; setTimeout(() => { if(DAILY === run) beatFinish(); }, 300); }
  };
  const timer = setInterval(tick, 250); tick();
}
async function beatFinish(){
  const R = DAILY, t = TOPIC[R.topic], got = R.right, before = beatBest(t);
  R.ended = true; R.busy = true; $('clock').hidden = true;
  player.clock = {...(player.clock || {}), [t.id]: Math.max(before, got)};
  player.feats = {...(player.feats || {}), beatBest: Math.max((player.feats || {}).beatBest || 0, got)};
  await DB.put('players', player);
  $('mapSheet').hidden = true; $('play').hidden = true; $('dailyDone').hidden = false;
  $('dailyDoneH').textContent = `Time's up! You got ${got} right!`;
  $('dailyDoneP').innerHTML = `${got > before && before ? `<span class="bigstreak">🏆 New best!</span>Your old best was ${before}.` : got > before ? `That's your best for ${esc(t.name)}. Can you beat it?` : before ? `Your best for ${esc(t.name)} is ${before}.` : 'Tap as fast as you can. Try again!'}
    <button class="secondary" id="runAgain">Play again</button>`;
  $('chipText').innerHTML = `Beat the Clock<small>${esc(t.name)} · Time's up</small>`;
  if(got > before && got >= 5){ confetti(); sound('done'); }
  checkBadges();
}

/* ===================== 10e. Mystery Country ===================== */
// Five mystery countries (or US states), one clue at a time. Tap the mystery place on the map: a wrong guess or
// "Next clue" shows the next clue. The fewer clues it takes, the more points.
const MYSTERY_ROUND = 5;
const MYSTERY_PLACES = REGIONS.filter(r => r.name !== 'World').map(r => r.name);
const mysteryTopic = region => TOPICS.find(t => t.group === region && /-(countries|states)$/.test(t.id));
const mysteryTitle = region => region === 'United States' ? 'Mystery State' : 'Mystery Country';

function mysteryCard(){
  return `<button class="passbtn mysterybtn" id="mysteryBtn"><span class="pi" aria-hidden="true">🕵️</span>
    <span class="pt">Mystery Country</span><span class="pd">Guess the country from clues. The fewer clues, the more points!</span></button>`;
}
function openMysteryPicker(){
  const best = player.mystery || {};
  const panel = openPanel({kind:'sheet', title:'Mystery Country', html:`<p class="muted">Where should the mystery places be?</p>
    <div class="mysterypick">${MYSTERY_PLACES.map(r => `<button data-mystery="${esc(r)}"><span>${esc(r === 'United States' ? 'United States (states)' : r)}</span>${best[r] ? `<small>Best: ${best[r]}</small>` : ''}</button>`).join('')}
    <button data-mystery="*" class="surprise"><span>🎲 Surprise me</span>${best['*'] ? `<small>Best: ${best['*']}</small>` : ''}</button></div>`});
  panel.addEventListener('click', e => { const b = e.target.closest('[data-mystery]'); if(b) popLayer(() => startMystery(b.dataset.mystery)); });
}
async function startMystery(region){
  const any = region === '*';
  return startRun({title: any ? 'Mystery Country' : mysteryTitle(region), home:'scrHome', mysteryOf: region, points: 0,
    pick: async () => {
      if(window.WGQ_TEST && WGQ_TEST.mysteryQuestions) return WGQ_TEST.mysteryQuestions.map(([t, n]) => ({t, n, style:'mystery'})); // tests can set them
      const out = [];
      for(let i = 0; i < MYSTERY_ROUND; i++){
        const t = mysteryTopic(any ? MYSTERY_PLACES.filter(r => r !== 'United States')[Math.floor(Math.random() * 6)] : region), m = await loadMap(t.map);
        const pool = m.items.filter(it => (it.b[2] - it.b[0]) + (it.b[3] - it.b[1]) > 14 && !out.some(q => q.n === it.n)); // no tiny ones: too hard to find from a clue
        out.push({t: t.id, n: pool[Math.floor(Math.random() * pool.length)].n, style:'mystery'});
      }
      return out;
    },
    finish: mysteryFinish, again: () => startMystery(region)});
}

// The clues, hardest first: where it is, its size, a fun fact (with its name hidden), its capital, its letters, its flag.
// Where and how big come from real geography (each place's `area` in km² and middle `ll`, added by tools/add-areas.mjs),
// and "where" uses the parts of the world the game already teaches ("It's in West Africa"), so a clue never contradicts them.
const NA_DIR = {Canada: 'the far north of North America', 'United States': 'the middle of North America, between Canada and Mexico', Mexico: 'the south of North America, just north of Central America'};
// which way a place lies from the middle of all the others on its map, using real latitude and longitude
function compass(n){
  const lon = l => T.group === 'Oceania' && l < 0 ? l + 360 : l; // Oceania crosses the 180° line
  const pts = M.items.map(i => [lon(i.ll[0]), i.ll[1]]), me = [lon(ITEM[n].ll[0]), ITEM[n].ll[1]];
  const [x0, x1, y0, y1] = [Math.min(...pts.map(p => p[0])), Math.max(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[1]))];
  const col = Math.min(2, Math.floor(3 * (me[0] - x0) / (x1 - x0 || 1))), row = Math.min(2, Math.floor(3 * (y1 - me[1]) / (y1 - y0 || 1)));
  return [['north-west', 'north', 'north-east'], ['west', 'middle', 'east'], ['south-west', 'south', 'south-east']][row][col];
}
async function whereClue(n){
  if(T.group === 'United States'){ // the five regions; each lists its states in a sentence ("Maine, New Hampshire, … and Maryland")
    const r = (await loadMap('usregions')).items.find(i => (i.where || '').replace(/ and /g, ', ').split(', ').includes(n)); if(r) return `It's in the ${r.n}.`; }
  if(NA_DIR[n]) return `It's in ${NA_DIR[n]}.`;
  const part = T.parts && Object.keys(T.parts).find(p => T.parts[p].includes(n));
  if(part) return `It's in ${partPhrase(T.group, part)}.`;
  const dir = compass(n);
  return `It's in the ${dir} of ${inPlace(T.group)}.`;
}
// words that would give the name away: the name's own words, and what its people are called (Irish, Korean)
const DEMONYM = {Ireland: 'Irish', France: 'French', Netherlands: 'Dutch', Switzerland: 'Swiss', Greece: 'Greek', Spain: 'Spanish', Portugal: 'Portuguese',
  Denmark: 'Danish', Sweden: 'Swedish', Finland: 'Finnish', Norway: 'Norwegian', Poland: 'Polish', Turkey: 'Turkish', Thailand: 'Thai', Philippines: 'Filipino',
  'United Kingdom': 'British', Germany: 'German', Iceland: 'Icelandic', 'New Zealand': 'Kiwi', Peru: 'Peruvian', China: 'Chinese', Japan: 'Japanese'};
const COMMON = /^(saint|south|north|east|west|republic|islands|united|states|democratic|central|new|and|the|of)$/i;
const nameWords = n => n.split(/[\s-]+/).filter(w => w.length > 3 && !COMMON.test(w));
const reEsc = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function givesAway(text, n){
  const words = [...nameWords(n), DEMONYM[n]].filter(Boolean);
  return words.some(w => new RegExp(`(^|[^\\p{L}])${reEsc(w)}`, 'iu').test(text)) // the word, or the start of a longer one (Korea → Korean)
    || nameWords(n).some(w => w.length >= 5 && new RegExp(`(^|[^\\p{L}])${reEsc(w.slice(0, 4))}\\p{L}*(an|ian|ese|ish)\\b`, 'iu').test(text))
    || nameWords(n).some(w => w.length >= 6 && new RegExp(`(^|[^\\p{L}])${reEsc(w.slice(0, 5))}`, 'iu').test(text)); // the Namib Desert (Namibia)
}
// a fun fact with the place's name hidden ("This country…"), or nothing if hiding it would garble the sentence
// ("Lake this country", "this country River") or something else in it still gives the name away
function hideName(text, n, word){
  const names = [n, ...((T.alias && T.alias[n]) || [])].filter(x => x.length > 3).sort((a, b) => b.length - a.length).map(reEsc);
  const re = new RegExp(`(\\S+\\s+)?\\b(the\\s+)?(${names.join('|')})\\b('s)?(\\s+\\S+)?`, 'gi');
  let garbled = new RegExp(`\\b[A-Z][a-z]+ of (the )?(${names.join('|')})\\b`).test(text); // the Great Wall of China, the Gulf of Mexico
  const out = text.replace(re, (all, before = '', the, name, s, after = '') => {
    const b = before.trim(), a = after.trim();
    // part of a longer name: Lake Chad, Great Zimbabwe, ancient Greece, Panama Canal, New York City; or "once called Persia"
    if(/^(lake|great|ancient|mount|gulf|sea|bay|south|north|east|west|new|old|called|named)$/i.test(b.replace(/[^\p{L}]/gu, ''))) garbled = true;
    if(/^(River|Lake|Canal|City|Islands?|Sea|Gulf|Mountains?|Desert|Basin|Valley|Plateau|Falls)\b/.test(a)) garbled = true;
    return `${before}this ${word}${s ? "'s" : ''}${after}`;
  });
  if(garbled || /this (country|state) (are|were)\b/i.test(out) || givesAway(out, n)) return null;
  return out.replace(/\bthe this (country|state)/gi, 'this $1').replace(/\bon this country\b(?!')/g, 'in this country').replace(/^this (country|state) means\b/i, "This $1's name means").replace(/(^|[.!?]\s+)this/g, (_, x) => `${x}This`);
}
async function mysteryClues(n){
  const it = ITEM[n], word = T.itemWord || 'state', words = word === 'country' ? 'countries' : 'states', place = inPlace(T.group), clues = [];
  clues.push(await whereClue(n));
  // size, from real area: the biggest quarter, the smallest quarter, or in between
  const rank = [...M.items].sort((a, b) => b.area - a.area).findIndex(i => i.n === n) / M.items.length;
  clues.push(rank < .25 ? `It's one of the biggest ${words} in ${place}.` : rank >= .75 ? `It's one of the smallest ${words} in ${place}.` : `It's not one of the biggest or the smallest ${words} in ${place}.`);
  await loadFacts();
  const fact = FACTS && (T.group === 'United States' ? FACTS.us : FACTS.country || {})[n], hidden = fact && hideName(fact, n, word); // (Georgia the state isn't Georgia the country)
  if(hidden) clues.push(`Fun fact: ${hidden}`);
  // a capital named after its place (Mexico City, Kuwait City, Oklahoma City) is told without its name
  const capTopic = TOPICS.find(t => t.group === T.group && t.showsItem), cap = capTopic && capTopic.answer(n);
  if(cap) clues.push(givesAway(cap, n) || cap.split(/[\s-]+/).some(w => w.length > 3 && n.includes(w)) ? `Its capital has the same name as the ${word}, or almost!` : `Its capital is ${cap}${/[.!?]$/.test(cap) ? '' : '.'}`);
  const letters = n.replace(/[^\p{L}]/gu, '').length;
  clues.push(`Its name starts with ${n.charAt(0)} and has ${letters} letters.`);
  const flagTopic = TOPICS.find(t => t.group === T.group && t.flags);
  if(flagTopic){ await loadFlags(flagTopic.map); if(flagSrc(n)) clues.push({flag: n}); }
  return clues;
}
const clueHtml = c => typeof c === 'string' ? esc(c) : `Its flag: ${flagImg(c.flag)}`;

async function mysteryShow(q){
  const R = DAILY, word = T.itemWord || 'state';
  R.clues = await mysteryClues(q.n); R.clue = 0; R.guessed = [];
  if(DAILY !== R) return;
  $('chipText').innerHTML = `${esc(R.title)}<small>Mystery ${R.i + 1} of ${R.qs.length} · ${esc(T.group)}</small>`;
  $('tally').innerHTML = `<b>${R.points}</b> points`;
  $('sub').textContent = `Read the clue, then tap the mystery ${word} on the map. Each wrong guess shows another clue.`;
  $('choices').hidden = true; $('choices').innerHTML = '';
  dailyPaint(); showWholeMap(true);
  mysteryClue();
}
// show the clues so far, newest last, and what this one is worth
function mysteryClue(){
  const R = DAILY, left = R.clues.length - R.clue, last = left === 1;
  $('selLabel').textContent = `Clue ${R.clue + 1} of ${R.clues.length} · worth ${left} point${left === 1 ? '' : 's'}`;
  const fq = $('findQ'); fq.hidden = false;
  fq.innerHTML = `<ol class="clues">${R.clues.slice(0, R.clue + 1).map((c, i) => `<li${i === R.clue ? ' class="new"' : ''}>${clueHtml(c)}</li>`).join('')}</ol>
    <button class="secondary small" id="nextClue">${last ? 'Show me the answer' : 'Next clue'}</button>`;
  fq.querySelector('.clues li.new').scrollIntoView({block:'nearest'});
  $('nextClue').onclick = () => { if(!R.busy && DAILY === R) mysteryMore(null); };
}
// a wrong guess (or "Next clue"): the next clue, or the answer when there are no more
function mysteryMore(guess){
  const R = DAILY, q = R.qs[R.i];
  if(R.clue + 1 >= R.clues.length){ mysteryDone(false, guess); return; }
  R.clue++;
  if(guess){ sound('wrong'); flashWrong(guess); feedback(`That's ${esc(the(guess))}, not the mystery ${T.itemWord || 'state'}. Here's another clue.`, 'bad');
    if(!R.guessed.includes(guess)) R.guessed.push(guess);
    dailyPaint(null, Object.fromEntries(R.guessed.map(g => [g, 'bad']))); } // places already guessed stay red, so they needn't be remembered
  else feedback('');
  mysteryClue();
}
function mysteryTap(n){
  const R = DAILY, q = R.qs[R.i];
  if(n === q.n) mysteryDone(true); else mysteryMore(n);
}
function mysteryDone(found, guess){
  const R = DAILY, q = R.qs[R.i], got = found ? R.clues.length - R.clue : 0;
  R.points += got;
  $('nextClue').disabled = true;
  if(guess) flashWrong(guess);
  // dailyAnswer counts it, saves it and moves on; the points are Mystery Country's own
  dailyAnswer(found, found ? `Yes! It's <b>${esc(the(q.n))}</b>! You found it with ${R.clue + 1} clue${R.clue ? 's' : ''}: <b>+${got} point${got === 1 ? '' : 's'}</b>.`
    : `The mystery ${T.itemWord || 'state'} was <b>${esc(the(q.n))}</b>.`);
  $('tally').innerHTML = `<b>${R.points}</b> points`;
}
async function mysteryFinish(){
  const R = DAILY, max = R.qs.length * 6, key = R.mysteryOf, before = (player.mystery || {})[key] || 0;
  R.busy = true;
  player.mystery = {...(player.mystery || {}), [key]: Math.max(before, R.points)};
  player.feats = {...(player.feats || {}), mysteryBest: Math.max((player.feats || {}).mysteryBest || 0, R.points)};
  await DB.put('players', player);
  $('mapSheet').hidden = true; $('play').hidden = true; $('dailyDone').hidden = false;
  $('dailyDoneH').textContent = `You scored ${R.points} points!`;
  $('dailyDoneP').innerHTML = `${R.right} of ${R.qs.length} mysteries solved, out of ${max} points.
    ${R.points > before && before ? `<span class="bigstreak">🏆 New best!</span>` : before && R.points <= before ? ` Your best is ${before}.` : ''}
    <button class="secondary" id="runAgain">Play again</button>`;
  $('chipText').innerHTML = `${esc(R.title)}<small>All done</small>`;
  if(R.points >= max * 0.6){ confetti(); sound('done'); }
  checkBadges();
}

$('homeGroups').addEventListener('click', e => { if(e.target.closest('#mysteryBtn')) openMysteryPicker(); });
$('regionBody').addEventListener('click', e => { const b = e.target.closest('[data-clock]'); if(b) startBeat(b.dataset.clock, b.dataset.part || null); });
