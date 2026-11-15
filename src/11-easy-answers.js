// World Geography Quiz: Easy answers: pick from 4 instead of typing (and flag choices).
// One of the game's script files, loaded in number order by index.html (see src/README.md).
'use strict';

/* ---- Easy answers: pick from 4 instead of typing ---- */
// wrong choices, in the order to offer them. For mountains and water, places of the same kind come first,
// so "Which lake is this?" offers other lakes, not the Andes
function choiceOrder(right, list){
  const mix = shuffle(list.filter(v => v !== right));
  if(!(T && T.geo && ITEM[right])) return mix;
  const r = ITEM[right], rank = v => !ITEM[v] ? 3 : ITEM[v].sub === r.sub ? 0 : ITEM[v].kind === r.kind ? 1 : 2;
  return mix.sort((a, b) => rank(a) - rank(b));
}
const easy = () => !!(player && (player.prefs.easy || (T && T.flags))) && G && (G.mode === 'test' || G.mode === 'practice');
function renderChoices(){
  const box = $('choices');
  if(!easy() || !current || !isOpen(current)){ box.innerHTML = ''; return; }
  let opts = G.choices[current];
  if(!opts){ // the right answer plus 3 others, kept the same if you come back to this one
    const right = key(current);
    const others = choiceOrder(right, pool()).slice(0, 3);
    if(others.length < 3) others.push(...choiceOrder(right, NAMES.map(key).filter(v => !others.includes(v))).slice(0, 3 - others.length));
    opts = G.choices[current] = shuffle([right, ...others]);
  }
  box.classList.toggle('flags', !!T.flags);
  box.innerHTML = T.flags
    ? opts.map((v,i) => `<button data-v="${esc(v)}" aria-pressed="${G.answers[current] === v}" aria-label="Flag ${i+1}">${flagImg(v)}</button>`).join('')
    : opts.map(v => `<button data-v="${esc(v)}" aria-pressed="${G.answers[current] === v}">${esc(v)}</button>`).join('');
}
$('choices').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if(!b) return; inp.value = b.dataset.v; submit(); });

async function review(){
  G.active = true;
  if(G.mode === 'test'){
    let comeback = false;
    const counts = G.round === 1 && !G.scored && (!G.only || G.part); // a real Test, not a retry of the missed ones
    for(const n of PN()){
      if(isSolved(n)) continue;
      const right = G.answers[n] === key(n);
      if(right) G.solved[n] = G.round;
      if(!right) noteMix(n, placeOf(G.answers[n]));
      const before = await recordItem(player.id, T.id, n, right, counts ? {testLast: right ? 'right' : 'wrong'} : null);
      if(counts && right && before.testLast === 'wrong') comeback = true; // missed it in an earlier Test, got it now
    }
    if(comeback){ const f = player.feats || {}; player.feats = {...f, comeback: f.comeback || Date.now(), comebackN: (f.comebackN || (f.comeback ? 1 : 0)) + 1}; await DB.put('players', player); }
  }
  G.reviewed = true;
  const correct = PN().filter(isSolved).length;
  if(G.round === 1 && !G.scored && (!G.only || G.part)){ // tricky-ones practice doesn't count toward best scores; a part of a place does
    G.scored = true;
    await DB.put('attempts', {pid:player.id, topic:T.id, mode:G.mode, part:G.part || null, at:Date.now(), correct, total:PN().length});
  }
  const finished = correct === PN().length;
  if(finished) await DB.del('games', G.key); else saveNow();
  showReview(false);
  if(finished){ confetti(); sound('done'); }
  afterGame();
}
function showReview(restoring){
  reviewing = true; current = null; openList(false);
  const missed = PN().filter(n => !isSolved(n)), good = PN().filter(isSolved);
  const thisRound = good.filter(n => G.solved[n] === G.round).length, pool = thisRound + missed.length;
  $('score').innerHTML = missed.length === 0
    ? (G.round===1 ? `<b>${PN().length} out of ${PN().length}!</b> A perfect score!` : `<b>You got all ${PN().length}!</b> It took ${G.round} rounds.`)
    : G.round===1 ? `You got <b>${good.length}</b> out of ${PN().length}.${timeTxt}`
    : `Round ${G.round}: <b>${thisRound}</b> of ${pool} right · ${good.length} of ${PN().length} in all`;
  $('badH').textContent = `Missed (${missed.length})`;
  $('goodH').textContent = `Right (${good.length})`;
  const meta = n => [T.showsItem ? n : '', G.round>1 && isSolved(n) ? `round ${G.solved[n]}` : ''].filter(Boolean).join(' · ');
  if(G.mode === 'find') $('badList').innerHTML = missed.length ? missed.map(n => `<li data-n="${esc(n)}"><span class="right">${esc(T.showsItem ? `${key(n)} (${n})` : n)}</span>${sayBtn(key(n), [key(n)])}${G.answers[n] && G.answers[n] !== 'skipped' ? `<span class="rnd">you tapped ${esc(G.answers[n])}</span>` : G.answers[n]==='skipped' ? '<span class="rnd">skipped</span>' : ''}</li>`).join('') : '<li class="empty">None. Great job!</li>';
  else $('badList').innerHTML = missed.length ? missed.map(n => `<li data-n="${esc(n)}">${T.flags ? flagImg(n, 'tiny') : ''}<span class="you">${G.answers[n] ? esc(G.answers[n]) : 'blank'}</span> <span aria-hidden="true">→</span> <span class="right">${esc(key(n))}</span>${sayBtn(key(n), [key(n)])}${meta(n) ? `<span class="rnd">${esc(meta(n))}</span>` : ''}${mixTip(n, placeOf(G.answers[n]))}</li>`).join('') : '<li class="empty">None. Great job!</li>';
  $('goodList').innerHTML = good.length ? good.map(n => `<li data-n="${esc(n)}">${T.flags ? flagImg(n, 'tiny') : ''}<span class="right">${esc(key(n))}</span>${meta(n) ? `<span class="rnd">${esc(meta(n))}</span>` : ''}</li>`).join('') : '<li class="empty">None yet. Keep trying!</li>';
  $('retry').hidden = missed.length === 0;
  $('retry').textContent = `Try the ${missed.length} missed`;
  $('callout').textContent = 'Tap the map or a name in the lists to see where it is.';
  $('play').hidden = true; $('results').hidden = false;
  legend([['--ok','Right'],['--bad','Missed'],['--sel','Picked']]);
  subText(); paint();
  if(!restoring) window.scrollTo({top:0, behavior: reduceMotion ? 'auto' : 'smooth'});
}
document.querySelector('.review').addEventListener('click', e => { const li = e.target.closest('li[data-n]'); if(li){ select(li.dataset.n); svg.scrollIntoView({behavior: reduceMotion?'auto':'smooth', block:'center'}); } });
$('reviewBtn').onclick = async () => {
  const left = PN().filter(n => isOpen(n) && !G.answers[n]).length;
  if(G.mode === 'find' && left){ if(!(await confirmDialog({title:'Finish now?', text:`You still have ${left} to find. They count as missed.`, ok:'Review'}))) return; review(); return; }
  if(left && !(await confirmDialog({title:'Finish now?', text:`You still have ${left} to answer. Blank ones count as missed.`, ok:'Review'}))) return;
  review();
};
$('retry').onclick = () => { G.round++; G.answers = {}; G.reviewed = false; G.queue = null; G.choices = {}; saveNow(); toPlay(); };
$('restart').onclick = async () => {
  if(PN().some(n => !isSolved(n)) && !(await confirmDialog({title:'Start a new game?', text:'Your answers in this game will be cleared.', ok:'New game'}))) return;
  await DB.del('games', G.key); G = {...newGameState(G.mode), only:G.only, key:G.key, part:G.part}; toPlay();
};

document.addEventListener('visibilitychange', () => { if(document.hidden) saveNow(); });
