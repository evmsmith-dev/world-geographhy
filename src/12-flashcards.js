// World Geography Quiz: Flashcards (Learn).
// One of the game's script files, loaded in number order by index.html (see src/README.md).
'use strict';

/* ===================== 10. flashcards ===================== */
const card = $('card'), cardin = card.querySelector('.cardin');
let deck = [], fi = 0, flipped = false, again = [], firstKnew = 0, fround = 1, deckSize = 0;
const starPts = (cx,cy,r) => Array.from({length:10}, (_,i) => { const a = -Math.PI/2 + i*Math.PI/5, q = i%2 ? r*0.45 : r; return (cx+q*Math.cos(a)).toFixed(2)+','+(cy+q*Math.sin(a)).toFixed(2); }).join(' ');
function drawCardArt(el, n, side){
  if(T.card === 'flag' && side === 'front'){ // just the flag, in a 4:3 frame
    el.setAttribute('viewBox', '0 0 400 300');
    el.innerHTML = `<image href="${flagSrc(n)}" x="0" y="0" width="400" height="300" preserveAspectRatio="xMidYMid meet"/><rect x=".5" y=".5" width="399" height="299" fill="none" class="flagframe"/>`;
    return;
  }
  if(T.landmarks && side === 'front'){ // a drawing of the landmark; the back shows where it is
    el.setAttribute('viewBox', '0 0 200 160');
    el.innerHTML = `<title>A drawing of a landmark</title><image href="${picSrc(n)}" x="0" y="0" width="200" height="160"/>`;
    return;
  }
  const it = ITEM[n];
  if(T.card === 'shape' || T.card === 'flag'){ // the shape on its own, with a star on the capital
    const [x0,y0,x1,y1] = it.fb || it.b, w = x1-x0, h = y1-y0, pad = Math.max(w,h)*0.1, r = Math.max(w,h)*0.055;
    el.setAttribute('viewBox', `${x0-pad} ${y0-pad} ${w+2*pad} ${h+2*pad}`);
    const k = it.fk || it.k;
    el.innerHTML = `<path class="item" d="${it.fd || it.d}"/>` + (k ? `<polygon class="star" points="${starPts(k[0], k[1], r)}"/>` : '');
  } else if(T.geo){ // the continent, zoomed in around this mountain range, desert, sea or lake
    const [x0,y0,x1,y1] = it.b, cx = (x0+x1)/2, cy = (y0+y1)/2, w = Math.min(VW, Math.max((x1-x0)*1.8, (y1-y0)*1.8*4/3, VW*0.45)), h = w*3/4;
    el.setAttribute('viewBox', `${cx-w/2} ${cy-h/2} ${w} ${h}`);
    const cls = i => (i.n === n ? 'hi' : 'dim geo' + kindClass(i)) + (i.kind === 'river' ? ' rline' : ''); // rivers are lines
    el.innerHTML = `<rect class="dim dimsea" x="${cx-w}" y="${cy-h}" width="${w*2}" height="${h*2}"/>` +
      M.items.filter(sinks).map(i => `<path class="${cls(i)}" d="${i.d}"/>`).join('') +
      (M.other ? `<path class="dim" d="${M.other}" style="fill:var(--other)"/>` : '') + `<path class="dim" d="${M.bgland}"/>` +
      M.items.filter(i => !sinks(i)).map(i => `<path class="${cls(i)}" d="${i.d}"/>`).join('') +
      (it.dot ? `<circle class="hi" cx="${it.dot[0]}" cy="${it.dot[1]}" r="${w/45}"/>` : ''); // a small place also gets its tap circle, so it can be seen
  } else { // the whole world, with this place lit up
    el.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    el.innerHTML = (M.sphere ? `<path class="dim" d="${M.sphere}" style="fill:var(--globe);stroke:none"/>` : '') +
      M.items.filter(i=>i.kind==='ocean').map(i => `<path class="${i.n===n?'hi':'dim dimsea'}" d="${i.d}"/>`).join('') +
      (M.other ? `<path class="dim" d="${M.other}" style="fill:var(--other)"/>` : '') +
      M.items.filter(i=>i.kind!=='ocean').map(i => `<path class="${i.n===n?'hi':'dim'}" d="${i.d}"/>`).join('');
  }
}
function setFlip(on, instant){
  flipped = on;
  if(instant) cardin.classList.add('instant');
  card.classList.toggle('flipped', on);
  if(instant){ void cardin.offsetWidth; cardin.classList.remove('instant'); }
  card.querySelector('.front').setAttribute('aria-hidden', String(on));
  card.querySelector('.back').setAttribute('aria-hidden', String(!on));
  card.setAttribute('aria-label', on ? 'Flashcard, answer side. Press to flip back.' : 'Flashcard. Press to see the answer.');
  $('fReveal').hidden = on; $('fMiss').hidden = !on; $('fGot').hidden = !on; $('fSay').hidden = !on || !CAN_SAY;
}
function flashNew(){ deck = shuffle(PN().slice()); fi = 0; again = []; firstKnew = 0; fround = 1; deckSize = deck.length; showCard(); }
function showCard(){
  const done = fi >= deck.length;
  $('fdeck').hidden = done; $('fDone').hidden = !done; $('fBar').hidden = done;
  if(done) return showDone();
  const n = deck[fi];
  setFlip(false, true);
  $('fAnswer').textContent = ''; $('fSub').innerHTML = ''; // filled in only when flipped, so there's no peeking
  drawCardArt($('fFront'), n, 'front'); drawCardArt($('fBack'), n, 'back');
  $('fPrompt').textContent = T.flashFront(n);
  $('fProg').innerHTML = `Card <b>${fi+1}</b> of ${deck.length}` + (fround>1 ? ` · round ${fround}` : '') + (again.length ? ` · ${again.length} to study again` : '');
}
function reveal(){
  if(fi >= deck.length) return;
  const n = deck[fi];
  if(!flipped){
    const b = T.back(n, ITEM[n]);
    $('fAnswer').textContent = b.answer; $('fSub').innerHTML = b.sub;
    if(autoSay()) cardSay();
    const hasLoc = T.card === 'shape' || T.card === 'flag';
    const loc = $('fLoc'); loc.toggleAttribute('hidden', !hasLoc); // svg elements have no .hidden property
    if(hasLoc){
      loc.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
      loc.innerHTML = (M.other ? `<path class="o" d="${M.other}"/>` : '') + M.items.map(i => `<path class="${i.n===n?'hi':''}" d="${i.d}"/>`).join('') +
        (ITEM[n].dot ? `<circle class="hi" cx="${ITEM[n].dot[0]}" cy="${ITEM[n].dot[1]}" r="${VW/60}"/>` : '');
    }
  }
  setFlip(!flipped);
}
function grade(knew){
  if(!flipped || fi >= deck.length) return;
  if(knew){ if(fround===1) firstKnew++; } else again.push(deck[fi]);
  recordStudy(player.id, T.id, deck[fi], knew);
  fi++; showCard();
}
function showDone(){
  const first = fround === 1;
  if(again.length){
    $('fDoneH').textContent = first ? `You knew ${firstKnew} of ${deckSize}!` : `Round ${fround} done!`;
    $('fDoneP').textContent = `${again.length} card${again.length>1?'s':''} to study again.`;
    $('fAgainDeck').hidden = false; $('fAgainDeck').textContent = `Study the ${again.length} again`;
  } else {
    $('fDoneH').textContent = first ? `You knew all ${deckSize}!` : 'You learned them all!';
    $('fDoneP').textContent = (first ? 'Every card, first try. Amazing!' : `You finished in ${fround} rounds.`) + ' Now show what you know in Find it, Practice or Test to earn badges.';
    $('fAgainDeck').hidden = true; confetti(); sound('done'); afterGame();
  }
  $('fRestart2').focus({preventScroll:true});
}
card.addEventListener('click', reveal);
card.addEventListener('keydown', e => { if(e.key==='Enter' || e.key===' '){ e.preventDefault(); e.stopPropagation(); reveal(); } });
$('fReveal').onclick = reveal;
const cardSay = () => { const n = deck[fi]; if(n == null) return; say(...(T.showsItem ? [key(n), ', the capital of', n] : sayParts(n))); };
$('fSay').onclick = cardSay;
$('fGot').onclick = () => grade(true);
$('fMiss').onclick = () => grade(false);
$('fRestart').onclick = flashNew;
$('fRestart2').onclick = flashNew;
$('fAgainDeck').onclick = () => { deck = shuffle(again); again = []; fi = 0; fround++; showCard(); };
document.addEventListener('keydown', e => {
  if(!G || G.mode!=='flash' || $('scrPlay').hidden || overlays.length || e.target.closest('input,button,[contenteditable]')) return;
  if(e.key===' ' || e.key==='Enter'){ e.preventDefault(); reveal(); }
  else if(e.key==='ArrowRight') grade(true);
  else if((e.key==='s' || e.key==='S') && flipped) cardSay();
  else if(e.key==='ArrowLeft') grade(false);
});

// topic & mode picker (bottom sheet): place → what → how
$('topicChip').onclick = () => {
  if(DAILY){ toast('Finish your Daily 10 first, or press ← to stop.'); return; }
  let r = regionOf(T.id), tid = T.id, part = G && G.part ? G.part : getPart(r);
  const panel = openPanel({title:'What do you want to play?', html:'<div class="pbody"></div>'});
  const body = panel.querySelector('.pbody');
  const draw = () => {
    const t = TOPIC[tid], rp = withParts(r, t);
    if(!(t.parts && t.parts[part])) part = getPart(rp); // a part this tab has
    body.innerHTML = `<p class="sect">Place</p><div class="chips pick">${REGIONS.map(x => `<button data-r="${esc(x.name)}" aria-pressed="${x===r}">${esc(x.name)}</button>`).join('')}</div>
      ${r.topics.length > 1 ? `<p class="sect">Learn about</p><div class="tabs${r.topics.length > 3 ? ' many' : ''}">${r.topics.map(x => `<button data-tab="${x.id}" aria-selected="${x.id===tid}">${esc(x.tab)}</button>`).join('')}</div>` : ''}
      ${t.parts ? `<p class="sect">Part</p>${partChips(rp, part)}` : ''}
      <p class="sect">How to play</p><div class="modelist">${modeButtons(t, null, t.id===T.id && G && (G.part || 'All') === part ? G.mode : null, part === 'All' || !t.parts ? null : part)}
        <button class="modebig" data-explore="${esc(r.name)}"${t.geo ? ` data-etopic="${t.id}"` : ''}${EXPLORE && EXPLORE.R===r ? ' aria-current="true"' : ''}><span class="mn">Explore</span><span class="md">A map to look around, no quiz</span></button></div>`;
  };
  draw();
  body.addEventListener('click', e => {
    const rb = e.target.closest('[data-r]'); if(rb){ r = REGIONS.find(x => x.name === rb.dataset.r); tid = lastTab(r).id; part = getPart(r); draw(); return; }
    const pc = e.target.closest('.partrow [data-part]'); if(pc){ part = pc.dataset.part; setPart(withParts(r, TOPIC[tid]), part); draw(); return; }
    const tb = e.target.closest('[data-tab]'); if(tb){ tid = tb.dataset.tab; draw(); return; }
    const ex = e.target.closest('[data-explore]'); if(ex){ popLayer(() => enterExplore(ex.dataset.explore, true, ex.dataset.etopic)); return; }
    const mb = e.target.closest('[data-mode]'); if(mb) popLayer(() => enterGame(mb.dataset.topic, mb.dataset.mode, true, null, mb.dataset.part || null));
  });
};
