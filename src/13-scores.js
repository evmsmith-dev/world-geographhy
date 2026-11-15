// World Geography Quiz: The Progress screen (it used to be called Scores, as the ids and this file still are).
// One of the game's script files, loaded in number order by index.html (see src/README.md).
'use strict';

/* ===================== 10b. scores ===================== */
let scoresTab = 'me', scoresPlace = null;
const dateFmt = t => new Date(t).toLocaleDateString(undefined, {month:'short', day:'numeric'});
async function topicStats(pid, t, part){
  let [items, attempts] = await Promise.all([DB.byPT('items', pid, t.id), DB.byPT('attempts', pid, t.id)]);
  attempts.sort((a,b) => a.at - b.at);
  if(part){ const inPart = new Set(t.parts[part]); items = items.filter(i => inPart.has(i.item)); }
  const scored = attempts.filter(a => (a.part || null) === (part || null)); // a West Africa score isn't a whole-Africa score
  const tests = scored.filter(a => a.mode==='test');
  const times = scored.filter(a => a.timeMs && a.correct===a.total).map(a => a.timeMs);
  return {items, attempts, learned: items.filter(i => i.last==='right').length,
    best: tests.length ? Math.max(...tests.map(a => a.correct)) : null, bestTime: times.length ? Math.min(...times) : null};
}
function openScores(){
  scoresTab = 'me'; showScreen('scrScores');
  pushLayer(() => { showScreen('scrHome'); renderHome(); });
  renderScores();
}
$('homeScores').onclick = openScores;
$('scoresBack').onclick = () => popLayer();
$('tabMe').onclick = () => { scoresTab = 'me'; renderScores(); };
$('tabAll').onclick = () => { scoresTab = 'all'; renderScores(); };
async function renderScores(){
  $('tabMe').setAttribute('aria-selected', String(scoresTab==='me'));
  $('tabAll').setAttribute('aria-selected', String(scoresTab==='all'));
  const body = $('scoresBody');
  if(scoresTab === 'me'){
    await Promise.all([...new Set(TOPICS.filter(t => t.showsItem).map(t => t.map))].map(m => loadMap(m).catch(() => null)));
    const parts = await Promise.all(TOPICS.map(async t => ({t, ...(await topicStats(player.id, t))})));
    const badges = await computeBadges(player);
    const got = badges.filter(b => b.earned).length;
    const d = streakNow(player);
    const passport = await passportCard();
    body.innerHTML = `<section class="passsec">${passport}</section>
      <section class="badgesec"><h2>Badges <span class="muted">${got} of ${badges.length}</span></h2>
      <p class="muted streakline">Daily 10 streak: <b>${d.streak} day${d.streak===1?'':'s'}</b> · Best: <b>${d.best} day${d.best===1?'':'s'}</b></p>
      ${badgeGroups(badges)}</section>
      <div class="cards">${parts.map(({t, items, attempts, learned, best, bestTime}) => {
      const last = attempts.slice(-10), pct = a => Math.round(100*a.correct/a.total);
      const chart = last.length
        ? `<div class="bars" role="img" aria-label="Your last ${last.length} scores: ${last.map(a => pct(a)+'%').join(', ')}">${last.map(a => `<i class="${a.mode==='practice'?'p':a.mode==='find'?'f':''}" style="height:${Math.max(4, pct(a))}%" title="${esc(dateFmt(a.at))} · ${MODES[a.mode]} · ${a.correct}/${a.total}"></i>`).join('')}</div>
           <p class="cap"><span>Your last ${last.length} game${last.length>1?'s':''}. Taller is better.</span><span><i class="k"></i>Test</span><span><i class="k p"></i>Practice</span><span><i class="k f"></i>Find it</span></p>
           <h4>Recent games</h4><ul class="recent">${attempts.slice(-5).reverse().map(a => `<li><span>${esc(dateFmt(a.at))}</span><span>${MODES[a.mode]}${a.part ? ` · ${esc(a.part)}` : ''}</span><b>${a.correct}/${a.total}</b><span>${a.timeMs ? fmtTime(a.timeMs) : ''}</span></li>`).join('')}</ul>`
        : `<p class="muted">No games yet. Finish a Test or Practice game to see your scores here.</p>`;
      const tricky = items.filter(i => i.wrong > 0 && (i.last==='wrong' || i.wrong >= i.right))
        .sort((a,b) => (b.wrong-b.right) - (a.wrong-a.right) || b.wrong - a.wrong).slice(0, 6);
      const name = i => { if(!t.showsItem) return i.item; try{ return `${t.answer(i.item)}, ${i.item}`; }catch(e){ return i.item; } };
      const practice = tricky.length
        ? `<h4>Needs practice</h4><div class="chips">${tricky.map(i => `<span class="chip">${esc(name(i))} <small>missed ${i.wrong}×</small></span>`).join('')}</div>
           <div><button class="primary" data-practice="${t.id}" data-items="${esc(JSON.stringify(tricky.map(i => i.item)))}">Practice these ${tricky.length}</button></div>`
        : items.length ? `<h4>Needs practice</h4><p class="muted">Nothing tricky right now. Great work!</p>` : '';
      return `<article class="tcard"><h3>${esc(t.name)}</h3>
        <p class="stats"><span><b>${learned}</b> of ${t.count} learned</span>${best!=null ? `<span>Best test: <b>${best}/${t.count}</b></span>` : ''}${bestTime ? `<span>Best time: <b>${fmtTime(bestTime)}</b></span>` : ''}<span>Games: <b>${attempts.length}</b></span></p>
        ${chart}${practice}</article>`;
    }).join('')}</div>`;
  } else {
    // everyone's data in two reads, then grouped per player
    const [allItems, allAttempts, allBadges, allStamps] = await Promise.all([DB.all('items'), DB.all('attempts'), Promise.all(players.map(computeBadges)),
      Promise.all(players.map(async p => (await passportOf(p.id)).filter(s => s.at).length))]);
    const weekAgo = Date.now() - 7*864e5, weekStart = ymd(new Date(weekAgo));
    const totalItems = TOPICS.reduce((n, t) => n + t.count, 0);
    const fam = players.map((p, i) => {
      const items = allItems.filter(r => r.pid === p.id && TOPIC[r.topic]), att = allAttempts.filter(a => a.pid === p.id && TOPIC[a.topic]);
      const learned = items.filter(r => r.last === 'right').length, s = streakNow(p);
      return {p, items, att, learned, badges: allBadges[i].filter(b => b.earned).length, stamps: allStamps[i], streak: s.streak, best: s.best,
        weekGames: att.filter(a => a.at >= weekAgo).length, weekDaily: ((p.daily && p.daily.days) || []).filter(d => d > weekStart).length};
    });
    if(!scoresPlace || !REGIONS.find(r => r.name === scoresPlace)) scoresPlace = REGIONS[0].name;
    const R = REGIONS.find(r => r.name === scoresPlace);
    const cell = (v, empty='–') => v == null ? `<td class="dim">${empty}</td>` : `<td>${v}</td>`;
    const topicTable = t => {
      const rows = fam.map(f => {
        const its = f.items.filter(r => r.topic === t.id), at = f.att.filter(a => a.topic === t.id);
        const best = m => { const xs = at.filter(a => a.mode === m && !a.part).map(a => a.correct); return xs.length ? Math.max(...xs) : null; };
        const times = at.filter(a => a.timeMs && a.correct === a.total && !a.part).map(a => a.timeMs);
        const who = `<th scope="row"><span class="who">${avatar(f.p)}${esc(f.p.name)}</span></th>`;
        if(!its.length && !at.length) return `<tr class="${f.p.id===player.id?'me':''}">${who}<td colspan="4" class="dim">Just getting started!</td></tr>`;
        const b1 = best('test'), b2 = best('find');
        return `<tr class="${f.p.id===player.id?'me':''}">${who}<td>${its.filter(r => r.last==='right').length}/${t.count}</td>${cell(b1 != null ? `${b1}/${t.count}` : null)}${cell(b2 != null ? `${b2}/${t.count}` : null)}${cell(times.length ? fmtTime(Math.min(...times)) : null)}</tr>`;
      }).join('');
      return `<article class="tcard"><h3>${esc(t.tab === t.name ? t.name : t.tab)}</h3>
        <div class="tablewrap"><table class="board"><thead><tr><th scope="col">Player</th><th scope="col">Learned</th><th scope="col" title="Best Test score">Test</th><th scope="col" title="Best Find it score">Find it</th><th scope="col" title="Best time on a perfect game">Time</th></tr></thead><tbody>${rows}</tbody></table></div></article>`;
    };
    body.innerHTML = `
      <section class="famsec"><h2>Our family</h2>
        <div class="famcards">${fam.map(f => `
          <article class="famcard${f.p.id===player.id?' me':''}">
            <div class="fhead">${avatar(f.p, true)}<span class="fname">${esc(f.p.name)}</span></div>
            <div class="meter" aria-hidden="true"><i style="width:${Math.round(100*f.learned/totalItems)}%"></i></div>
            <p class="fline"><b>${f.learned}</b> of ${totalItems} learned</p>
            <div class="fstats">
              <span><b>${f.badges}</b><small>badge${f.badges===1?'':'s'}</small></span>
              <span><b>${f.stamps}</b><small>stamp${f.stamps===1?'':'s'}</small></span>
              <span><b>🔥 ${f.streak}</b><small>day streak</small></span>
              <span><b>${f.best}</b><small>best streak</small></span>
            </div>
            <p class="fweek">${f.weekGames || f.weekDaily ? `This week: <b>${f.weekGames}</b> game${f.weekGames===1?'':'s'} · <b>${f.weekDaily}</b> Daily 10${f.weekDaily===1?'':'s'}` : 'This week: just getting started!'}</p>
          </article>`).join('')}</div>
        ${players.length < 2 ? '<p class="muted" style="margin-top:10px">Add more players to see how everyone is doing.</p>' : ''}
      </section>
      <section class="famsec"><h2>By place</h2>
        <div class="chips pick" id="placeChips">${REGIONS.map(r => `<button data-place="${esc(r.name)}" aria-pressed="${r.name===scoresPlace}">${esc(r.name)}</button>`).join('')}</div>
        <div class="cards" style="margin-top:12px">${R.topics.map(topicTable).join('')}</div>
      </section>`;
  }
}
$('scoresBody').addEventListener('click', e => {
  const pc = e.target.closest('[data-place]'); if(pc){ scoresPlace = pc.dataset.place; renderScores(); return; }
  const b = e.target.closest('[data-practice]'); if(!b) return;
  const topic = b.dataset.practice, items = JSON.parse(b.dataset.items);
  popLayer(() => enterGame(topic, 'practice', false, items));
});
