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
  return {items, attempts, learned: items.filter(i => i.last==='right').length,
    best: tests.length ? Math.max(...tests.map(a => a.correct)) : null};
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
    const stamps = (await passportOf(player.id)).filter(s => s.at).length, total = LANDMARK_TOPICS.reduce((n, t) => n + t.count, 0);
    const played = parts.filter(x => x.attempts.length || x.items.length);
    const learnedAll = played.reduce((n, x) => n + x.learned, 0);
    const kept = player.badges || {}, newest = badges.filter(b => b.earned).sort((a, b) => (kept[b.id] || 0) - (kept[a.id] || 0)).slice(0, 5);
    // the ones to practice, from every topic played: the top few of each
    const name = (t, i) => { if(!t.showsItem) return i.item; try{ return `${t.answer(i.item)}, ${i.item}`; }catch(e){ return i.item; } };
    const trickyOf = x => x.items.filter(i => i.wrong > 0 && (i.last === 'wrong' || i.wrong >= i.right))
      .sort((a, b) => (b.wrong - b.right) - (a.wrong - a.right) || b.wrong - a.wrong).slice(0, 6);
    const practice = played.map(x => ({...x, tricky: trickyOf(x)})).filter(x => x.tricky.length)
      .sort((a, b) => b.tricky.reduce((n, i) => n + i.wrong, 0) - a.tricky.reduce((n, i) => n + i.wrong, 0)); // the most missed first
    const prow = x => `<div class="prow"><div class="pw"><h3>${esc(x.t.name)}</h3><p class="pnames">${x.tricky.map(i => esc(name(x.t, i))).join(' · ')}</p></div>
      <button class="primary" data-practice="${x.t.id}" data-items="${esc(JSON.stringify(x.tricky.map(i => i.item)))}" aria-label="Practice these ${x.tricky.length}: ${esc(x.t.name)}">Practice ${x.tricky.length}</button></div>`;
    // a topic: one line (name, how much is learned, best Test), and its games when opened
    const topicRow = ({t, items, attempts, learned, best}) => {
      const last = attempts.slice(-10), pct = a => Math.round(100 * a.correct / a.total);
      const chart = last.length
        ? `<div class="bars" role="img" aria-label="Your last ${last.length} scores: ${last.map(a => pct(a)+'%').join(', ')}">${last.map(a => `<i class="${a.mode==='practice'?'p':a.mode==='find'?'f':''}" style="height:${Math.max(4, pct(a))}%" title="${esc(dateFmt(a.at))} · ${MODES[a.mode]} · ${a.correct}/${a.total}"></i>`).join('')}</div>
           <p class="cap"><span>Your last ${last.length} game${last.length>1?'s':''}. Taller is better.</span><span><i class="k"></i>Test</span><span><i class="k p"></i>Practice</span><span><i class="k f"></i>Find it</span></p>
           <ul class="recent">${attempts.slice(-5).reverse().map(a => `<li><span>${esc(dateFmt(a.at))}</span><span>${MODES[a.mode]}${a.part ? ` · ${esc(a.part)}` : ''}</span><b>${a.correct}/${a.total}</b></li>`).join('')}</ul>`
        : `<p class="muted">No games yet. Finish a game to see your scores here.</p>`;
      return `<details class="trow"><summary><span class="tn">${esc(t.tab === t.name ? t.name : t.tab)}</span>
          <span class="tbar" aria-hidden="true"><i style="width:${Math.round(100 * learned / t.count)}%"></i></span>
          <span class="tl">${learned}/${t.count}</span></summary>
        <div class="tbody"><p class="stats"><span><b>${learned}</b> of ${t.count} learned</span>${best!=null ? `<span>Best test: <b>${best}/${t.count}</b></span>` : ''}<span>Games: <b>${attempts.length}</b></span></p>${chart}</div></details>`;
    };
    const groups = REGIONS.map(r => ({r, list: played.filter(x => x.t.group === r.name)})).filter(g => g.list.length);
    body.innerHTML = `<section class="psum" aria-label="Summary">
        <div><b>${learnedAll}</b><small>learned</small></div>
        <div><b>🔥 ${d.streak}</b><small>day streak${d.best > d.streak ? ` · best ${d.best}` : ''}</small></div>
        <div><b>${got}</b><small>badge${got === 1 ? '' : 's'}</small></div>
        <div><b>${stamps}</b><small>stamp${stamps === 1 ? '' : 's'}</small></div></section>
      <section class="pcards">
        <button class="pcard" id="passBtn"><span class="pt">🛂 My Passport</span><span class="pd">${stamps} of ${total} stamps</span>
          <span class="pi" aria-hidden="true">${(await passportOf(player.id)).filter(s => s.at).sort((a, b) => b.at - a.at).slice(0, 3).map(s => stampHtml(s, true)).join('') || '<span class="muted">Learn a landmark to get your first stamp!</span>'}</span></button>
        <button class="pcard" id="badgesBtn"><span class="pt">🏅 Badges</span><span class="pd">${got} of ${badges.length}</span>
          <span class="pi bicons" aria-hidden="true">${newest.map(b => b.icon).join('') || '<span class="muted">Play a game to earn your first badge!</span>'}</span></button></section>
      ${practice.length ? `<section class="psec"><h2>Needs practice</h2>${practice.slice(0, 3).map(prow).join('')}
        ${practice.length > 3 ? `<details class="pmore"><summary>${practice.length - 3} more to practice</summary>${practice.slice(3).map(prow).join('')}</details>` : ''}</section>` : ''}
      <section class="psec"><h2>Your places</h2>${groups.length ? groups.map(({r, list}) => `<details class="pgroup"${groups.length === 1 ? ' open' : ''}>
          <summary><span class="gn">${esc(r.name)}</span><span class="gc">${list.reduce((n, x) => n + x.learned, 0)} learned</span></summary>
          ${list.map(topicRow).join('')}</details>`).join('') : '<p class="muted">Play a game and your places show up here.</p>'}</section>`;
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
        const who = `<th scope="row"><span class="who">${avatar(f.p)}${esc(f.p.name)}</span></th>`;
        if(!its.length && !at.length) return `<tr class="${f.p.id===player.id?'me':''}">${who}<td colspan="3" class="dim">Just getting started!</td></tr>`;
        const b1 = best('test'), b2 = best('find');
        return `<tr class="${f.p.id===player.id?'me':''}">${who}<td>${its.filter(r => r.last==='right').length}/${t.count}</td>${cell(b1 != null ? `${b1}/${t.count}` : null)}${cell(b2 != null ? `${b2}/${t.count}` : null)}</tr>`;
      }).join('');
      return `<article class="tcard"><h3>${esc(t.tab === t.name ? t.name : t.tab)}</h3>
        <div class="tablewrap"><table class="board"><thead><tr><th scope="col">Player</th><th scope="col">Learned</th><th scope="col" title="Best Test score">Test</th><th scope="col" title="Best Find it score">Find it</th></tr></thead><tbody>${rows}</tbody></table></div></article>`;
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
        <div class="chips pick scrollrow" id="placeChips">${REGIONS.map(r => `<button data-place="${esc(r.name)}" aria-pressed="${r.name===scoresPlace}">${esc(r.name)}</button>`).join('')}</div>
        ${(() => { // a table for each topic someone has played; the rest on one line
          const started = t => fam.some(f => f.items.some(r => r.topic === t.id) || f.att.some(a => a.topic === t.id)), on = R.topics.filter(started), off = R.topics.filter(t => !started(t));
          return `${on.length ? `<div class="cards" style="margin-top:12px">${on.map(topicTable).join('')}</div>` : ''}
            ${off.length ? `<p class="muted notyet">${on.length ? 'Not started yet' : 'Nobody has started these yet'}: ${off.map(t => esc(t.tab === t.name ? t.name : t.tab)).join(' · ')}</p>` : ''}`; })()}
      </section>`;
  }
}
$('scoresBody').addEventListener('click', e => {
  if(e.target.closest('#badgesBtn')){ openBadges(); return; }
  const pc = e.target.closest('[data-place]'); if(pc){ scoresPlace = pc.dataset.place; renderScores(); return; }
  const b = e.target.closest('[data-practice]'); if(!b) return;
  const topic = b.dataset.practice, items = JSON.parse(b.dataset.items);
  popLayer(() => enterGame(topic, 'practice', false, items));
});

// all the badges, in their groups, in a screen of their own
async function openBadges(){
  const badges = await computeBadges(player), got = badges.filter(b => b.earned).length, d = streakNow(player);
  openPanel({kind:'full', title:`Badges · ${got} of ${badges.length}`, html:`<div class="badgesec">
    <p class="muted streakline">Daily 10 streak: <b>${d.streak} day${d.streak===1?'':'s'}</b> · Best: <b>${d.best} day${d.best===1?'':'s'}</b></p>
    ${badgeGroups(badges)}</div>`});
}
