// World Geography Quiz: The Daily 10, streaks and badges.
// One of the game's script files, loaded in number order by index.html (see src/README.md).
'use strict';

/* ===================== 10c. Daily 10, streaks & badges ===================== */
const ymd = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today = () => ymd(new Date());
const yesterday = () => { const d = new Date(); d.setDate(d.getDate()-1); return ymd(d); };
// the streak only counts if the last Daily 10 was today or yesterday
function streakNow(p){ const d = p.daily || {}; const alive = d.last === today() || d.last === yesterday(); return {streak: alive ? (d.streak||0) : 0, best: d.best||0, doneToday: d.last === today(), lastScore: d.lastScore}; }
function dailyCard(){
  const s = streakNow(player);
  const status = s.doneToday ? `Done today! You got ${s.lastScore} of 10. Play again for fun.` : '10 quick questions, picked to help you remember what you learned.';
  return `<button class="dailybtn${s.doneToday?' done':''}" id="dailyBtn">
    <span class="dt">Daily 10${s.doneToday ? ' ✓' : ''}</span><span class="dd">${esc(status)}</span>
    <span class="streak" aria-label="${s.streak} day streak"><span aria-hidden="true">🔥</span> ${s.streak}<small>day${s.streak===1?'':'s'}</small></span>
  </button>`;
}

let DAILY = null; // {qs:[{t,n,style}], i, right, tries, busy}
// Spaced review: a mix of places missed lately, places learned a while ago that are due to come back
// (1, 3, 7, 14, then 30 days after each right answer in a row), a few new ones, and some surprises.
const REVIEW_DAYS = [0, 1, 3, 7, 14, 30];
async function pickDaily(){
  if(window.WGQ_TEST && WGQ_TEST.dailyQuestions){ const out = WGQ_TEST.dailyQuestions.map(([t, n, style]) => ({t, n, style})); for(const q of out){ await loadMap(TOPIC[q.t].map); if(TOPIC[q.t].flags) await loadFlags(TOPIC[q.t].map); } return out; } // tests can set the questions
  const DAY = 864e5, now = Date.now();
  const all = (await DB.all('items')).filter(r => r.pid === player.id && TOPIC[r.topic] && r.last);
  const missed = all.filter(r => r.last === 'wrong').sort((a,b) => (b.at||0) - (a.at||0)).slice(0, 3);
  const due = all.filter(r => r.last === 'right').map(r => ({r, late: (now - (r.at||0)) / (REVIEW_DAYS[Math.min(itemStreak(r), 5)] * DAY || DAY)}))
    .filter(x => x.late >= 1).sort((a,b) => b.late - a.late).slice(0, 4).map(x => x.r);
  const played = [...new Set(all.map(r => r.topic))];
  // pairs mixed up twice or more, until both are solid (right twice in a row)
  const byKey = Object.fromEntries(all.map(r => [r.topic + '|' + r.item, r]));
  const pairs = Object.entries(MIXMEM).filter(([, c]) => c >= 2).map(([k]) => { const [t, ab] = [k.slice(0, k.indexOf(':')), k.slice(k.indexOf(':') + 1)], [a, b] = ab.split('|'); return {t, a, b}; })
    .filter(({t, a, b}) => TOPIC[t] && [a, b].some(n => itemStreak(byKey[t + '|' + n] || {}) < 2)).slice(0, 2);
  const pairQs = pairs.map(({t, a, b}) => [{t, n: a}, {t, n: b}]);
  const inPair = new Set(pairs.flatMap(({t, a, b}) => [t + '|' + a, t + '|' + b]));
  const qs = [...missed, ...due].filter(r => !inPair.has(r.topic + '|' + r.item)).map(r => ({t: r.topic, n: r.item})).slice(0, 7 - pairQs.length * 2);
  const seen = new Set([...qs.map(q => q.t + '|' + q.n), ...inPair]), known = new Set(all.map(r => r.topic + '|' + r.item));
  const room = 10 - pairQs.length * 2;
  // a few new ones from places the player already plays
  for(const tid of shuffle(played)){
    if(qs.length >= room - 2) break;
    const m = await loadMap(TOPIC[tid].map);
    const fresh = shuffle(m.items.map(i => i.n).filter(n => !known.has(tid + '|' + n) && !seen.has(tid + '|' + n)));
    if(fresh.length){ seen.add(tid + '|' + fresh[0]); qs.push({t: tid, n: fresh[0]}); }
  }
  let guard = 0;
  while(qs.length < room && guard++ < 200){
    const pool = played.length && Math.random() < 0.6 ? played : TOPICS.map(t => t.id);
    const tid = pool[Math.floor(Math.random()*pool.length)], t = TOPIC[tid];
    const m = await loadMap(t.map);
    const n = m.items[Math.floor(Math.random()*m.items.length)].n;
    if(seen.has(tid + '|' + n)) continue;
    seen.add(tid + '|' + n); qs.push({t: tid, n});
  }
  // put each mixed-up pair back to back, somewhere in the list
  const out = shuffle(qs);
  pairQs.forEach(pq => out.splice(Math.floor(Math.random() * (out.length + 1)), 0, ...shuffle(pq)));
  for(const q of out){ await loadMap(TOPIC[q.t].map); if(TOPIC[q.t].flags) await loadFlags(TOPIC[q.t].map); q.style = runStyle(TOPIC[q.t]); }
  return out;
}
// find it on the map, or pick its name; a landmark can also ask which country it's in
const runStyle = t => { const r = Math.random(); return t.landmarks ? (r < 1/3 ? 'find' : r < 2/3 ? 'pick' : 'country') : r < 0.5 ? 'find' : 'pick'; };
// "Which country is this landmark in?": its country (one of the two, for a landmark between two countries) and 3 more
// from the same continent, the countries of its other landmarks first
// (a US landmark asks which state it's in)
const placesOf = it => it.country || it.state, placeWord = n => ITEM[n].state ? 'state' : 'country';
async function countryChoices(n){
  const it = ITEM[n], base = await loadMap(M.base), theirs = new Set(placesOf(it));
  const right = placesOf(it)[Math.floor(Math.random() * placesOf(it).length)];
  const near = shuffle([...new Set(M.items.flatMap(placesOf))].filter(c => !theirs.has(c)));
  const rest = shuffle(base.items.map(i => i.n).filter(c => !theirs.has(c) && !near.includes(c)));
  return {right, opts: shuffle([right, ...[...near, ...rest].slice(0, 3)])};
}
const capFirst = s => s.charAt(0).toUpperCase() + s.slice(1);
async function startDaily(){ return startRun({title:'Daily 10', pick:pickDaily, home:'scrHome'}); }
// A run of questions, each on its own map: the Daily 10, and the World Tour (src/16-world-tour.js), which adds
// tour, mode and save (where to keep its place, so it can be finished later), saved (a run to pick up) and finish
async function startRun(run){
  returnTo = run.home; showScreen('scrPlay');
  pushLayer(() => { DAILY = null; $('dailyDone').hidden = true; $('play').querySelectorAll('[data-dhide]').forEach(el => { el.hidden = false; el.removeAttribute('data-dhide'); });
    showScreen(run.home); itemsSaved().then(() => { if(run.home === 'scrRegion') renderRegion(); else renderHome(); }); });
  ['mapSheet','play','results','flash','dailyDone'].forEach(id => $(id).hidden = true);
  $('chipText').innerHTML = `${esc(run.title)}<small>Getting your questions ready…</small>`; $('sub').textContent = ''; $('tally').textContent = ''; $('clock').hidden = true;
  $('dailyHome').textContent = run.home === 'scrRegion' ? 'Back' : 'Back home';
  try{ await loadMixes(); const was = run.saved;
    DAILY = {...run, qs: was ? was.qs : await run.pick(), i: was ? was.i : 0, right: was ? was.right : 0, missed: was ? was.missed : [], tries: 0, busy: false}; }
  catch(e){ $('sub').textContent = 'The questions could not load. Check your internet connection, then go back and try again.'; return; }
  // runs use their own controls
  ['.combo','#submit','.nav','#reviewBtn','#skipBtn'].forEach(sel => { const el = $('play').querySelector(sel); if(el && !el.hidden){ el.hidden = true; el.setAttribute('data-dhide',''); } });
  $('mapSheet').hidden = false; $('play').hidden = false; $('legend').innerHTML = '';
  dailyShow();
}
async function dailyShow(){
  const q = DAILY.qs[DAILY.i]; T = TOPIC[q.t]; M = await loadMap(T.map); drawMap();
  DAILY.tries = 0; DAILY.busy = false; const pic = q.style === 'pick' && T.landmarks; // a landmark: "Which landmark is this?" with its picture, not its place
  current = q.style === 'pick' && !pic ? q.n : null;
  $('chipText').innerHTML = `${esc(DAILY.title)}<small>Question ${DAILY.i+1} of ${DAILY.qs.length} · ${esc(T.name)}</small>`;
  $('tally').innerHTML = `<b>${DAILY.right}</b> right`;
  feedback('');
  const fq = $('findQ'), ch = $('choices');
  if(q.style === 'find'){
    $('sub').textContent = 'Tap the right place on the map. You get 2 tries.';
    $('selLabel').textContent = 'Find it on the map';
    if(T.flags) fq.innerHTML = `${flagImg(q.n,'big')}<span>Find the ${T.itemWord || 'country'} with this flag</span>`;
    else if(T.landmarks) fq.innerHTML = `${picImg(q.n, 'big')}<span>${esc(noThe(q.n) ? `Find ${q.n}` : `Find the ${q.n}`)}</span>`;
    else fq.textContent = T.showsItem ? `Which ${T.itemWord} has the capital ${key(q.n)}?` : (ITEM[q.n].kind==='ocean' || (T.geo && !noThe(q.n)) ? `Find the ${q.n}` : `Find ${q.n}`);
    fq.hidden = false; ch.hidden = true; ch.innerHTML = '';
  } else if(q.style === 'country'){
    $('sub').textContent = `Look at the landmark, then pick the ${placeWord(q.n)} it is in.`;
    $('selLabel').textContent = `Pick the ${placeWord(q.n)}`;
    const {right, opts} = await countryChoices(q.n); DAILY.cright = right;
    fq.innerHTML = `${picImg(q.n, 'big')}<span>Which ${placeWord(q.n)} is ${esc(the(q.n))} in?</span>`; fq.hidden = false;
    ch.classList.remove('flags'); ch.hidden = false;
    ch.innerHTML = opts.map(v => `<button data-dv="${esc(v)}">${esc(v)}</button>`).join('');
  } else {
    $('sub').textContent = pic ? 'Look at the picture, then pick the right answer.' : 'Look at the orange place on the map, then pick the right answer.';
    $('selLabel').textContent = T.flags ? `Which flag belongs to this ${T.itemWord || 'country'}?` : T.showsItem ? `What is the capital of ${q.n}?` : T.ask(q.n);
    fq.hidden = !pic; fq.innerHTML = pic ? picImg(q.n, 'big') : ''; ch.hidden = false;
    const right = key(q.n), others = choiceOrder(right, NAMES.map(key)).slice(0, 3), opts = shuffle([right, ...others]);
    ch.classList.toggle('flags', !!T.flags);
    ch.innerHTML = opts.map((v,i) => T.flags ? `<button data-dv="${esc(v)}" aria-label="Flag ${i+1}">${flagImg(v)}</button>` : `<button data-dv="${esc(v)}">${esc(v)}</button>`).join('');
    if(!pic) focusItem(q.n);
  }
  dailyPaint(); showWholeMap(DAILY.i === 0 || T !== DAILY.lastT); DAILY.lastT = T;
}
function dailyPaint(reveal, mark){
  NAMES.forEach(n => {
    setPlaceClass(n, mark && mark[n] ? mark[n] : n === current || n === reveal ? 'sel' : '');
  });
  if(current && !sinks(ITEM[current])){ svg.appendChild(els[current]); raiseDots(current); }
}
function dailyAnswer(right, msg){
  const q = DAILY.qs[DAILY.i];
  DAILY.busy = true; if(right) DAILY.right++; else DAILY.missed.push(q);
  recordItem(player.id, q.t, q.n, right);
  if(DAILY.save) DB.put('games', {key: DAILY.save, pid: player.id, topic: DAILY.tour, mode: DAILY.mode, qs: DAILY.qs, i: DAILY.i + 1, right: DAILY.right, missed: DAILY.missed, updated: Date.now()}); // pick up here next time
  sound(right ? 'right' : 'wrong');
  feedback(msg, right ? 'ok' : 'bad');
  $('tally').innerHTML = `<b>${DAILY.right}</b> right`;
  current = q.n; dailyPaint(null, {[q.n]: right ? 'ok' : 'sel'}); if(!right) focusItem(q.n);
  setTimeout(() => { if(!DAILY) return; DAILY.i++; if(DAILY.i < DAILY.qs.length) dailyShow(); else (DAILY.finish || dailyFinish)(); }, right ? 1000 : 2200);
}
function dailyTap(n){
  const q = DAILY && DAILY.qs[DAILY.i]; if(!q || DAILY.busy || q.style !== 'find') return;
  const thatIs = T.showsItem ? `That's ${esc(n)}. Its capital is ${esc(key(n))}.` : `That's ${esc(the(n))}.`;
  if(n === q.n){ dailyAnswer(DAILY.tries === 0, `Yes! That's <b>${esc(the(n))}</b>.`); return; }
  DAILY.tries++; flashWrong(n); noteMix(q.n, n);
  if(DAILY.tries < 2){ sound('wrong'); feedback(`${thatIs} Try once more! ${mixTip(q.n, n)}`, 'bad'); return; }
  dailyAnswer(false, `${thatIs} Here is <b>${esc(q.n)}</b>. ${mixTip(q.n, n)}`);
}
$('choices').addEventListener('click', e => {
  const b = e.target.closest('[data-dv]'); if(!b || !DAILY || DAILY.busy) return;
  const q = DAILY.qs[DAILY.i], v = b.dataset.dv, cq = q.style === 'country', right = cq ? placesOf(ITEM[q.n]).includes(v) : v === key(q.n);
  $('choices').querySelectorAll('button').forEach(x => x.disabled = true);
  b.classList.add(right ? 'picked-ok' : 'picked-bad');
  const r = $('choices').querySelector(`[data-dv="${CSS.escape(cq ? DAILY.cright : key(q.n))}"]`); if(r && !right) r.classList.add('picked-ok');
  if(cq){ const where = `${esc(capFirst(the(q.n)))} is in ${right ? esc(ITEM[q.n].where) : `<b>${esc(ITEM[q.n].where)}</b>`}`; dailyAnswer(right, right ? `Yes! ${where}.` : `Not quite. ${where}.`); return; }
  const w = right ? null : placeOf(v); if(w){ flashMix(w); noteMix(q.n, w); }
  dailyAnswer(right, right ? `Yes! ${T.flags ? `That's the flag of <b>${esc(q.n)}</b>` : T.geo ? `That's ${esc(the(v))}` : `<b>${esc(v)}</b> is right`}.` : `Not quite. ${T.flags ? `The flag of ${esc(q.n)} is the one with the green outline` : `The answer is ${T.geo ? esc(the(key(q.n))) : `<b>${esc(key(q.n))}</b>`}`}. ${mixTip(q.n, w)}`);
});
async function dailyFinish(){
  const score = DAILY.right, first = !streakNow(player).doneToday;
  const d = player.daily || {};
  if(first){
    const s = streakNow(player);
    d.streak = d.last === yesterday() ? s.streak + 1 : 1;
    d.best = Math.max(d.best||0, d.streak); d.last = today(); d.lastScore = score;
    d.days = [...(d.days || []), today()].slice(-60);
  }
  d.plays = (d.plays||0) + 1; if(score === 10) d.perfect = (d.perfect||0) + 1;
  player.daily = d; await DB.put('players', player);
  $('mapSheet').hidden = true; $('play').hidden = true; $('dailyDone').hidden = false;
  const st = streakNow(player);
  $('dailyDoneH').textContent = score === 10 ? '10 out of 10! Perfect!' : `You got ${score} out of 10!`;
  $('dailyDoneP').innerHTML = first
    ? `<span class="bigstreak"><span aria-hidden="true">🔥</span> ${st.streak} day${st.streak===1?'':'s'} in a row</span>${st.streak > 1 ? 'Keep it going tomorrow!' : 'Come back tomorrow to make it 2 days!'}`
    : `You already did today's Daily 10, so your streak stays at ${st.streak}. Nice extra practice!`;
  $('chipText').innerHTML = 'Daily 10<small>All done</small>';
  if(score >= 8){ confetti(); sound('done'); }
  DAILY.busy = true;
  checkBadges();
}
$('dailyHome').onclick = () => popLayer();

// ---- badges ----
const BADGES = [
  {id:'first', icon:'🎉', name:'First Game', desc:'Finish your first Test, Practice or Find it game.'},
  {id:'perfect', icon:'⭐', name:'Perfect!', desc:'Get every answer right in a Test.'},
  {id:'speed', icon:'⚡', name:'Speed Star', desc:'Get every answer right with the stopwatch on.'},
  {id:'explorer', icon:'🧭', name:'Explorer', desc:'Finish a game in every place.'},
  {id:'daily1', icon:'📅', name:'Daily Player', desc:'Finish your first Daily 10.'},
  {id:'daily10', icon:'💯', name:'Daily Perfect', desc:'Get 10 out of 10 on a Daily 10.'},
  {id:'streak3', icon:'🔥', name:'3-Day Streak', desc:'Do the Daily 10 three days in a row.'},
  {id:'streak7', icon:'🔥', name:'7-Day Streak', desc:'Do the Daily 10 seven days in a row.'},
  {id:'streak30', icon:'🏆', name:'30-Day Streak', desc:'Do the Daily 10 thirty days in a row.'},
  // secret badges: shown locked with a hint until earned
  {id:'flawless', icon:'💎', name:'Flawless', desc:'Got every answer right in a Test of one part, like West Africa.', hint:'Get every answer right in a Test of one part.', secret:true},
  {id:'sweep', icon:'🧹', name:'Clean Sweep', desc:'Got every answer right in a Test of every part of one place.', hint:'Get a perfect Test in every part of one place.', secret:true},
  {id:'lightning', icon:'🌩️', name:'Lightning', desc:'Got every answer right in a Test of 5 or more, with 5 seconds or less for each one, stopwatch on.', hint:'Be perfect and very fast in a Test, with the stopwatch on.', secret:true},
  {id:'globetrotter', icon:'✈️', name:'Globe Trotter', desc:'Got every answer right in a Test in every place.', hint:'Get a perfect Test all around the world.', secret:true},
  {id:'comeback', icon:'💪', name:'Comeback Kid', desc:'Got one right in a Test that you missed in an earlier Test.', hint:'Miss one in a Test, then get it right next time.', secret:true},
  ...TOPICS.flatMap(t => [
    {id:'master-'+t.id, icon:badgeIcon(t), name:`${t.name} Master`, desc:`Learn all ${t.count} ${t.nouns === 'places' ? 'continents and oceans' : t.nouns}.`, group:t.group, topic:t.id, need:t.count, master:true},
    // smaller badges, one for each part of a big place, so there's always one within reach
    ...(t.parts ? Object.entries(t.parts).map(([part, names]) => ({id:`part-${t.id}-${part}`, icon:badgeIcon(t), name:`${partTitle(t.group, part)} ${t.tab}`,
      desc:`Learn all ${names.length} ${t.nouns} in ${partPhrase(t.group, part)}.`, group:t.group, topic:t.id, part, need:names.length})) : []),
  ]),
  // the World Tour: learn everything on every continent (learned anywhere counts)
  ...TOURS.map(t => ({id:'master-'+t.id, icon:t.icon, name:`${t.name} Master`, desc:`Learn all ${t.count} ${t.nouns} in the world.`, group:t.group, tour:t.id, need:t.count, master:true})),
  {id:'worldtour', icon:'🌐', name:'Around the World', desc:'Found all 195 countries in one World Tour without a single miss.', hint:'Find every country in the world in one go, without a miss.', secret:true},
];
function badgeIcon(t){ return t.landmarks ? '🗽' : t.flags ? '🚩' : t.showsItem ? '🏛️' : t.geo ? '🏞️' : '🗺️'; }
async function computeBadges(p){
  const attempts = (await DB.all('attempts')).filter(a => a.pid === p.id && TOPIC[a.topic]);
  const items = (await DB.all('items')).filter(r => r.pid === p.id);
  const d = p.daily || {};
  const learned = Object.fromEntries(TOPICS.map(t => [t.id, items.filter(r => r.topic === t.id && r.last === 'right').length]));
  const placesPlayed = new Set(attempts.map(a => TOPIC[a.topic].group));
  const has = {
    first: attempts.length > 0,
    perfect: attempts.some(a => a.mode === 'test' && a.correct === a.total),
    speed: attempts.some(a => a.timeMs && a.correct === a.total),
    explorer: REGIONS.every(r => placesPlayed.has(r.name)),
    daily1: (d.plays||0) > 0, daily10: (d.perfect||0) > 0,
    streak3: (d.best||0) >= 3, streak7: (d.best||0) >= 7, streak30: (d.best||0) >= 30,
  };
  // secret badges come from perfect Tests
  const perfect = attempts.filter(a => a.mode === 'test' && a.total > 0 && a.correct === a.total);
  has.flawless = perfect.some(a => a.part);
  has.sweep = TOPICS.some(t => t.parts && Object.keys(t.parts).every(part => perfect.some(a => a.topic === t.id && a.part === part)));
  has.lightning = perfect.some(a => a.total >= 5 && a.timeMs && a.timeMs <= a.total * 5000);
  has.globetrotter = REGIONS.every(r => perfect.some(a => TOPIC[a.topic].group === r.name));
  has.comeback = !!(p.feats && p.feats.comeback);
  has.worldtour = !!(p.feats && p.feats.worldtour);
  // how many times a repeatable badge has been done, shown quietly as ×2, ×3…
  const sweeps = TOPICS.filter(t => t.parts && Object.keys(t.parts).every(part => perfect.some(a => a.topic === t.id && a.part === part))).length;
  const times = {perfect: perfect.length, flawless: perfect.filter(a => a.part).length, sweep: sweeps,
    lightning: perfect.filter(a => a.total >= 5 && a.timeMs && a.timeMs <= a.total * 5000).length,
    comeback: (p.feats && (p.feats.comebackN || (p.feats.comeback ? 1 : 0))) || 0, daily10: d.perfect || 0, worldtour: (p.feats && p.feats.worldtourN) || 0};
  TOPICS.forEach(t => has['master-'+t.id] = learned[t.id] >= t.count);
  TOURS.forEach(t => has['master-'+t.id] = t.from.every(f => learned[f] >= TOPIC[f].count));
  // progress toward each place and part badge
  const rightSet = {}; items.forEach(r => { if(r.last === 'right') (rightSet[r.topic] = rightSet[r.topic] || new Set()).add(r.item); });
  const have = b => { if(b.tour) return TOUR[b.tour].from.reduce((sum, f) => sum + learned[f], 0); if(!b.topic) return null; const set = rightSet[b.topic] || new Set(); return b.part ? TOPIC[b.topic].parts[b.part].filter(n => set.has(n)).length : learned[b.topic]; };
  BADGES.forEach(b => { if(b.part) has[b.id] = have(b) >= b.need; });
  const kept = p.badges || {}; // once earned, a badge is never taken away (a later miss doesn't remove it)
  return BADGES.map(b => ({...b, earned: !!has[b.id] || !!kept[b.id], have: have(b), times: times[b.id] || 0}));
}
const badgeCard = b => b.secret && !b.earned ? `<div class="badge off secret"><span class="bi" aria-hidden="true">❓</span><span class="bn">Secret badge</span><span class="bd">${esc(b.hint)}</span><span class="sr">Not earned yet</span></div>` : `<div class="badge ${b.earned?'on':'off'}${b.secret?' secret':''}">${b.earned && b.times > 1 ? `<span class="btimes" aria-label="Done ${b.times} times">×${b.times}</span>` : ''}<span class="bi" aria-hidden="true">${b.icon}</span><span class="bn">${esc(b.name)}</span><span class="bd">${esc(b.desc)}</span>${b.earned ? '' : b.have != null && b.have > 0 ? `<span class="bp" role="img" aria-label="${b.have} of ${b.need} learned"><i style="width:${Math.round(100*b.have/b.need)}%"></i></span><span class="bd"><b>${b.have}</b> of ${b.need}</span>` : '<span class="sr">Not earned yet</span>'}</div>`;
// one folding section per place, so the list stays short; open the ones being worked on
function badgeGroups(badges){
  const groups = [{name:'Getting started', list:badges.filter(b => !b.group && !b.secret)}, {name:'Secret badges', list:badges.filter(b => b.secret)}, ...REGIONS.map(r => ({name:r.name, list:badges.filter(b => b.group === r.name)}))];
  const sorted = l => l.slice().sort((a,b) => b.earned - a.earned || (b.have||0)/b.need - (a.have||0)/a.need || (a.master?1:0) - (b.master?1:0));
  return groups.filter(g => g.list.length).map((g, i) => {
    const got = g.list.filter(b => b.earned).length, busy = g.list.some(b => !b.earned && b.have > 0);
    return `<details class="bgroup"${i <= 1 || busy ? ' open' : ''}><summary><span class="bgn">${esc(g.name)}</span><span class="bgc">${got} of ${g.list.length}</span>${got ? `<span class="bgi" aria-hidden="true">${g.list.filter(b => b.earned).slice(0, 6).map(b => b.icon).join('')}</span>` : ''}</summary>
      <div class="badges">${sorted(g.list).map(badgeCard).join('')}</div></details>`;
  }).join('');
}
// One check at a time, and always against the badges already saved, so a badge is celebrated exactly once,
// even if two checks overlap or this screen's copy of the player is out of date (another tab, a backup, a switch of players).
let badgeChain = Promise.resolve();
function checkBadges(){ badgeChain = badgeChain.then(checkBadgesNow).catch(() => {}); return badgeChain; }
async function checkBadgesNow(){
  if(!player) return;
  const saved = await DB.get('players', player.id);
  if(saved){ player.badges = {...(saved.badges || {}), ...(player.badges || {})}; player.feats = {...(saved.feats || {}), ...(player.feats || {})}; player.times = {...(saved.times || {}), ...(player.times || {})}; }
  const list = await computeBadges(player), had = player.badges || {};
  // a badge already earned and done again: count it, and say so quietly
  const seen = player.times || {}, again = list.filter(b => had[b.id] && seen[b.id] != null && b.times > seen[b.id]); // nothing on the first check after an update
  if(list.some(b => b.times && b.times !== seen[b.id])){ player.times = Object.fromEntries(list.filter(b => b.times).map(b => [b.id, b.times])); await DB.put('players', player); }
  if(again.length){ const b = again.sort((x, y) => (y.secret ? 1 : 0) - (x.secret ? 1 : 0))[0], el = $('callout'); // the rarer badge wins
    if(el && !$('results').hidden) el.innerHTML = `<span class="again">${b.icon} ${esc(b.name.replace(/!$/, ''))} again! That's ${b.times} times.</span> ` + el.innerHTML; }
  const rank = b => b.secret ? 0 : b.part ? 1 : b.master ? 2 : 3;
  const fresh = list.filter(b => b.earned && !had[b.id]).sort((a,b) => rank(a) - rank(b)); // show a secret or place badge first
  await newStamps(!fresh.length); // new passport stamps (src/17-passport.js), said only when there's no new badge to say
  if(!fresh.length) return;
  player.badges = {...had}; fresh.forEach(b => player.badges[b.id] = Date.now());
  await DB.put('players', player);
  toast(`${fresh[0].icon} ${fresh[0].secret ? 'Secret badge unlocked' : 'New badge'}: ${fresh[0].name}!${fresh.length > 1 ? ` (and ${fresh.length-1} more)` : ''}`, [{label:'See badges', run: () => { if(!$('scrPlay').hidden) popLayer(() => openScores()); else openScores(); }}, {label:'OK', ghost:true}], 7000);
  confetti();
}
