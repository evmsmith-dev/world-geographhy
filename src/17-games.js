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
  const panel = openPanel({kind:'center', title:'Mystery Country', html:`<p class="muted">Where should the mystery places be?</p>
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

// The clues, hardest first: where it is, its size, a fun fact (with its name hidden), its capital, its letters, its flag
const ringArea = d => d.split(/M/).filter(Boolean).reduce((sum, ring) => {
  const p = ring.match(/-?\d+(\.\d+)?/g).map(Number); let a = 0;
  for(let i = 0; i + 3 < p.length; i += 2) a += p[i] * p[i+3] - p[i+2] * p[i+1];
  return sum + Math.abs(a) / 2; }, 0);
function hideName(text, n, word){
  const names = [n, ...((T.alias && T.alias[n]) || [])].filter(x => x.length > 3).sort((a, b) => b.length - a.length).map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const out = text.replace(new RegExp(`\\b(the\\s+)?(${names.join('|')})('s)?\\b`, 'gi'), (_, the, name, s) => `this ${word}${s ? "'s" : ''}`);
  return out.replace(/(^|[.!?]\s+)this/g, (_, a) => `${a}This`);
}
async function mysteryClues(n){
  const it = ITEM[n], word = T.itemWord || 'state', place = inPlace(T.group), clues = [];
  // where: which part of the map its middle is in
  const xs = M.items.flatMap(i => [i.b[0], i.b[2]]), ys = M.items.flatMap(i => [i.b[1], i.b[3]]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const col = Math.min(2, Math.floor(3 * (it.c[0] - x0) / (x1 - x0))), row = Math.min(2, Math.floor(3 * (it.c[1] - y0) / (y1 - y0)));
  const dir = [['north-west', 'north', 'north-east'], ['west', 'middle', 'east'], ['south-west', 'south', 'south-east']][row][col];
  clues.push(`It's in the ${dir} of ${place}.`);
  // size, from the area of its shape on the map
  const sizes = M.items.map(i => [i.n, ringArea(i.d)]).sort((a, b) => b[1] - a[1]), rank = sizes.findIndex(s => s[0] === n) / sizes.length;
  clues.push(rank < .25 ? `It's one of the biggest ${word === 'country' ? 'countries' : 'states'} in ${place}.` : rank >= .75 ? `It's one of the smallest ${word === 'country' ? 'countries' : 'states'} in ${place}.` : `It's not one of the biggest or the smallest ${word === 'country' ? 'countries' : 'states'} in ${place}.`);
  // a clue mustn't say the name: a fact that still does (like "DR Congo" for the Republic of the Congo) is left out,
  // and a capital named after its country (Mexico City, Kuwait City) is told without its name
  const words = n.split(/[\s-]+/).filter(w => w.length > 3 && !/^(saint|south|north|east|west|republic|islands|united|states|democratic|central|new|and)$/i.test(w));
  const says = text => words.some(w => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text));
  await loadFacts();
  const fact = FACTS && (FACTS.country || {})[n] || (FACTS.us || {})[n], hidden = fact && hideName(fact, n, word);
  if(hidden && !says(hidden)) clues.push(`Fun fact: ${hidden}`);
  const capTopic = TOPICS.find(t => t.group === T.group && t.showsItem), cap = capTopic && capTopic.answer(n);
  if(cap) clues.push(says(cap) || cap.split(/[\s-]+/).some(w => w.length > 3 && n.includes(w)) ? `Its capital has the same name as the ${word}, or almost!` : `Its capital is ${cap}.`);
  const letters = n.replace(/[^\p{L}]/gu, '').length;
  clues.push(`Its name starts with ${n.charAt(0)} and has ${letters} letters.`);
  const flagTopic = TOPICS.find(t => t.group === T.group && t.flags);
  if(flagTopic){ await loadFlags(flagTopic.map); if(flagSrc(n)) clues.push({flag: n}); }
  return clues;
}
const clueHtml = c => typeof c === 'string' ? esc(c) : `Its flag: ${flagImg(c.flag)}`;

async function mysteryShow(q){
  const R = DAILY, word = T.itemWord || 'state';
  R.clues = await mysteryClues(q.n); R.clue = 0;
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
  if(guess){ sound('wrong'); flashWrong(guess); feedback(`That's ${esc(the(guess))}, not the mystery ${T.itemWord || 'state'}. Here's another clue.`, 'bad'); }
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
