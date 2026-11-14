// World Geography Quiz: The World Tour: every country, or every Land & Water place, in one game.
// One of the game's script files, loaded in number order by index.html (see src/README.md).
'use strict';

/* ===================== 10d. World Tour ===================== */
// The tours are listed in 02-topics.js (TOURS). Each question is shown on its own continent's map and runs on the
// Daily 10's engine (startRun in 15-daily.js). Answers are saved under the continent topics, so progress is shared.
const TOUR_MODES = {
  find: {name:'Find it', desc: t => `We name ${t.id === 'world-geo' ? 'a place' : 'a country'}, you tap it. All ${t.count}, one continent at a time.`},
  name: {name:'Name it', desc: t => `We show ${t.id === 'world-geo' ? 'a place' : 'a country'}, you pick its name. All ${t.count}, one continent at a time.`},
  quick: {name:'World 20', desc: () => '20 from all over the world, picked to help you remember.'},
};
const tourKey = (t, mode) => gameKey(player.id, t.id, mode);

// how much of a tour is learned, all together and continent by continent
async function tourStats(t){
  const per = await Promise.all(t.from.map(async f => ({f, learned: (await DB.byPT('items', player.id, f)).filter(i => i.last === 'right').length, count: TOPIC[f].count})));
  return {per, learned: per.reduce((sum, p) => sum + p.learned, 0)};
}

async function renderTour(t){
  const st = await tourStats(t), kept = player.badges || {};
  const done = st.learned >= t.count || !!kept['master-' + t.id];
  const saved = await Promise.all(Object.keys(TOUR_MODES).map(m => DB.get('games', tourKey(t, m))));
  $('regionBody').innerHTML = `
    <p class="sub">${t.id === 'world-geo' ? `Find all ${t.count} mountains, deserts, seas and lakes` : `Find all ${t.count} countries of the world`}, continent by continent.
      What you learn here counts for each continent too.</p>
    <div class="meter" role="img" aria-label="${st.learned} of ${t.count} learned"><i style="width:${Math.round(100*st.learned/t.count)}%"></i></div>
    <p class="stats"><span><b>${st.learned}</b> of ${t.count} learned</span>${done ? `<span class="gotbadge">🏅 Badge earned: <b>${esc(t.name)} Master</b></span>` : ''}</p>
    <ul class="tourparts">${st.per.map(p => `<li><span>${esc(TOPIC[p.f].group)}</span> <b>${p.learned}</b> of ${p.count}</li>`).join('')}</ul>
    <div class="modelist">${Object.entries(TOUR_MODES).map(([m, x], i) => `
      <button class="modebig" data-tour="${t.id}" data-tmode="${m}">
        <span class="mn">${x.name}</span><span class="md">${esc(x.desc(t))}</span>${saved[i] ? `<span class="resume">Keep going: ${saved[i].i} of ${saved[i].qs.length}</span>` : ''}
      </button>`).join('')}</div>`;
}
$('regionBody').addEventListener('click', e => { const b = e.target.closest('[data-tmode]'); if(b) startTour(TOUR[b.dataset.tour], b.dataset.tmode); });

// All of a tour, one continent at a time (in random order within each continent)
async function tourQuestions(t, mode){
  const qs = [];
  for(const f of t.from){
    const m = await loadMap(TOPIC[f].map);
    shuffle(m.items.map(i => i.n)).forEach(n => qs.push({t: f, n, style: mode === 'name' ? 'pick' : 'find'}));
  }
  return qs;
}
// World 20: places missed lately and places due for review first (as in the Daily 10), then new ones from every continent in turn
async function tourQuick(t){
  const DAY = 864e5, now = Date.now(), from = new Set(t.from);
  const mine = (await DB.all('items')).filter(r => r.pid === player.id && from.has(r.topic) && r.last);
  const missed = shuffle(mine.filter(r => r.last === 'wrong')).slice(0, 6);
  const due = mine.filter(r => r.last === 'right').map(r => ({r, late: (now - (r.at||0)) / (REVIEW_DAYS[Math.min(itemStreak(r), 5)] * DAY || DAY)}))
    .filter(x => x.late >= 1).sort((a, b) => b.late - a.late).slice(0, 6).map(x => x.r);
  const qs = [...missed, ...due].map(r => ({t: r.topic, n: r.item}));
  const seen = new Set(qs.map(q => q.t + '|' + q.n)), known = new Set(mine.map(r => r.topic + '|' + r.item));
  const pools = await Promise.all(t.from.map(async f => shuffle((await loadMap(TOPIC[f].map)).items.map(i => ({t: f, n: i.n})))));
  for(const fresh of [true, false]) for(let k = 0; qs.length < 20 && k < pools.length * 60; k++){
    const q = pools[k % pools.length].find(q => !seen.has(q.t + '|' + q.n) && (!fresh || !known.has(q.t + '|' + q.n)));
    if(q){ seen.add(q.t + '|' + q.n); qs.push(q); }
  }
  return shuffle(qs).slice(0, 20).map(q => ({...q, style: Math.random() < 0.5 ? 'find' : 'pick'}));
}

async function startTour(t, mode, only){
  const save = mode === 'quick' || only ? null : tourKey(t, mode); // World 20 and practice rounds are short, so they aren't saved
  const saved = save ? await DB.get('games', save) : null;
  return startRun({title: only ? `${t.tab}: practice` : mode === 'quick' ? 'World 20' : `${t.tab}: ${TOUR_MODES[mode].name}`, home: 'scrRegion',
    tour: t.id, mode, save, saved: saved && saved.i < saved.qs.length ? saved : null,
    pick: only ? async () => shuffle(only) : mode === 'quick' ? () => tourQuick(t) : () => tourQuestions(t, mode),
    finish: tourFinish});
}

async function tourFinish(){
  const R = DAILY, t = TOUR[R.tour], total = R.qs.length, missed = R.missed;
  R.busy = true;
  if(R.save) await DB.del('games', R.save);
  if(R.save && t.id === 'world-countries' && R.mode === 'find' && !missed.length && total === t.count){ // every country, first try
    player.feats = {...(player.feats || {}), worldtour: true, worldtourN: ((player.feats || {}).worldtourN || 0) + 1};
    await DB.put('players', player);
  }
  $('mapSheet').hidden = true; $('play').hidden = true; $('dailyDone').hidden = false;
  $('dailyDoneH').textContent = !missed.length ? `${total} out of ${total}! Perfect!` : `You got ${R.right} out of ${total}!`;
  const names = missed.map(q => q.n);
  $('dailyDoneP').innerHTML = missed.length
    ? `To practice: ${esc(names.slice(0, 12).join(', '))}${names.length > 12 ? ` and ${names.length - 12} more` : ''}.
       <button class="secondary" id="tourAgain">Practice the ${missed.length === 1 ? 'one' : missed.length} you missed</button>`
    : R.mode === 'quick' ? 'Every one right. Come back for another World 20!' : `Every one right, all around the world!`;
  $('chipText').innerHTML = `${esc(R.title)}<small>All done</small>`;
  if(R.right >= total * 0.8){ confetti(); sound('done'); }
  checkBadges();
}
$('dailyDone').addEventListener('click', e => {
  if(!e.target.closest('#tourAgain') || !DAILY) return;
  const t = TOUR[DAILY.tour], mode = DAILY.mode, again = DAILY.missed.map(q => ({...q}));
  popLayer(() => startTour(t, mode, again));
});
