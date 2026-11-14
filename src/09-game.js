// World Geography Quiz: Playing: Test, Practice and Review, answers and scores.
// One of the game's script files, loaded in number order by index.html (see src/README.md).
'use strict';

/* ===================== 9. game: test, practice, review ===================== */
let G = null, current = null, reviewing = false;
let saveTimer = 0;
const isSolved = n => !!G && (n in G.solved);
const isOpen = n => !isSolved(n) && !(G.mode!=='test' && G.answers[n]);
const remaining = () => PN().filter(n => !isSolved(n)).length;
// "Practice these" games use only a few items; everything else on the map is greyed out
const inPlay = n => !G || !G.only || G.only.includes(n);
const PN = () => (G && G.only) ? NAMES.filter(inPlay) : NAMES;
const timerOn = () => !!(player && player.prefs.timer && G && G.mode!=='flash');
function saveSoon(){ clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 300); }
function saveNow(){ clearTimeout(saveTimer); if(G && G.mode!=='flash' && G.active && (!G.only || G.part)){ G.updated = Date.now(); DB.put('games', {...G}); } }
const legend = items => $('legend').innerHTML = items.map(([c,t]) => `<span><i style="background:var(${c})"></i>${t}</span>`).join('');
function feedback(html, cls){ const f = $('feedback'); f.innerHTML = html || ''; f.className = 'feedback' + (cls ? ' '+cls : ''); }

async function enterGame(topicId, mode, fromPicker, only, part){
  saveNow(); stopClock(); endExplore(); loadMixes();
  T = TOPIC[topicId];
  if(part && !(T.parts && T.parts[part])) part = null;
  $('chipText').innerHTML = `<span class="ct">${esc(T.name)}</span><small>${part ? `${MODES[mode]} · ${esc(part)}` : only ? 'Practice the tricky ones' : MODES[mode]}</small>`;
  if(!fromPicker){ returnTo = SCREENS.find(id => !$(id).hidden) || 'scrHome'; showScreen('scrPlay'); pushLayer(leaveGame); }
  const R = regionOf(topicId); if(R) rememberTab(R, topicId);
  ['mapSheet','play','results','flash'].forEach(id => $(id).hidden = true);
  $('sub').textContent = 'Loading the map…'; $('tally').textContent = '';
  try{ M = await loadMap(T.map); if(T.flags) await loadFlags(T.map); }
  catch(e){ $('sub').textContent = 'The map could not load. Check your internet connection, then go back and try again.'; return; }
  drawMap();
  const gk = gameKey(player.id, T.id, part ? mode + '@' + part : mode);
  const saved = mode!=='flash' && (!only || part) ? await DB.get('games', gk) : null;
  G = saved || newGameState(mode);
  if(part){ G.only = T.parts[part]; G.part = part; G.key = gk; }
  else if(only){ G.only = only; G.key = gameKey(player.id, T.id, 'tricky'); }
  current = null; reviewing = false;
  if(mode === 'flash'){ $('flash').hidden = false; subText(); paint(); flashNew(); return; }
  $('mapSheet').hidden = false;
  G.busy = false; G.choices = G.choices || {};
  if(G.reviewed) showReview(true); else toPlay();
  startClock();
}
function newGameState(mode){ return {key:gameKey(player.id, T.id, mode), pid:player.id, topic:T.id, mode, round:1, answers:{}, solved:{}, elapsed:0, reviewed:false, scored:false, active:false, queue:null, tries:0, choices:{}}; }
let returnTo = 'scrHome';
function leaveGame(){ endExplore(); saveNow(); stopClock(); hideToast(); G = null; showScreen(returnTo); const to = returnTo;
  itemsSaved().then(() => { if(to === 'scrRegion') renderRegion(); else renderHome(); }); } // the last answers are saved first, so the progress shown is up to date
function afterGame(){ checkBadges(); }
$('backHome').onclick = () => popLayer();

function subText(){
  if(G.mode === 'flash'){
    $('sub').textContent = T.card==='shape' ? 'Learn one at a time. The star shows where the capital is. Tap the card to see the answer.' : 'Learn one at a time. Tap the card to see the answer.';
    return;
  }
  if(G.mode === 'find'){ $('sub').textContent = T.flags ? 'Look at the flag, then tap its country on the map. You get 3 tries for each one.' : `Read the name, then tap it on the map. You get 3 tries for each one.`; return; }
  const how = easy() ? T.tapWhat.replace(/, find its (name|capital)$/, ', then pick the right answer') : T.tapWhat;
  $('sub').textContent = G.mode==='test'
    ? `${how}${easy() ? '' : ', and press Save'}. Press Review when you're done.`
    : `${how}${easy() ? '' : ', and press Check'}. You'll find out right away if you're right.`;
}
function paint(){
  NAMES.forEach(n => {
    let cls = '';
    if(G.mode !== 'flash'){
      if(isSolved(n)) cls += ' ok';
      else if(reviewing || (G.mode!=='test' && G.answers[n])) cls += ' bad';
      else if(G.answers[n]) cls += ' done';
    }
    if(n === current) cls += ' sel';
    if(!inPlay(n)) cls += ' off';
    setPlaceClass(n, cls); const el = els[n];
    el.setAttribute('aria-label', isSolved(n) || reviewing || T.showsItem ? `${n}${isSolved(n)?', correct':reviewing?', missed':''}` : G.answers[n] ? `Answered ${G.answers[n]}` : 'Not answered yet');
  });
  const named = Object.keys(G.answers).length, total = PN().filter(n => !(G.solved[n] < G.round)).length;
  const verb = G.mode==='find' ? 'done' : 'answered';
  $('tally').innerHTML = G.mode==='flash' || reviewing ? '' : (G.round===1 ? `<b>${named}</b> / ${total} ${verb}` : `Round ${G.round} · <b>${named}</b> / ${total} ${verb}`);
  if(G.mode === 'find'){ $('selLabel').textContent = 'Find it on the map'; const t = findTarget(); if(T.flags) $('findQ').innerHTML = t ? `${flagImg(t, 'big')}<span>Find the ${T.itemWord || 'country'} with this flag</span>` : ''; else { $('findQ').innerHTML = t ? (T.landmarks ? `${picImg(t, 'big')}<span>${esc(findAsk(t))} ${sayBtn(key(t), [key(t)])}</span>` : `${esc(findAsk(t))} ${sayBtn(key(t), [key(t)])}`) : ''; if(t && autoSay() && G.sayLast !== t){ G.sayLast = t; say(key(t)); } } return; }
  const label = !current ? T.tapHint
    : T.showsItem ? (isSolved(current) ? `Capital of ${current}: ${key(current)}` : T.ask(current))
    : isSolved(current) ? 'You already got this one'
    : (G.mode==='practice' && G.answers[current]) ? 'Already answered'
    : G.answers[current] ? 'Change your answer?' : T.ask(current);
  $('selLabel').textContent = label;
  if(T.landmarks){ const fq = $('findQ'), show = !!current && !reviewing; fq.hidden = !show; fq.innerHTML = show ? picImg(current, 'big') : ''; } // the picture of the landmark that's picked
}
function playLegend(){
  const items = [['--land','Not answered']];
  if(G.mode==='test') items.push(['--answered','Answered']);
  if(G.mode==='find'){ legend([['--land','Not found yet'],['--ok','Found'],['--bad','Missed'],['--sel','Shown']]); return; }
  if(G.mode==='practice' || G.round>1) items.push(['--ok','Right']);
  if(G.mode==='practice') items.push(['--bad','Missed']);
  items.push(['--sel','Picked']);
  legend(items);
}
function setInput(){
  inp.disabled = !current || !isOpen(current);
  inp.value = current && G.answers[current] && !isSolved(current) && G.mode==='test' ? G.answers[current] : '';
  inp.placeholder = !current ? 'Tap the map first' : `Type to find ${T.listWord}`;
  submitBtn.textContent = G.mode==='practice' ? 'Check' : 'Save';
  openList(false); syncSubmit(); renderChoices();
}
// which controls show depends on the mode: typing, 4 choices (Easy answers), or Find it
function layoutBar(){
  const find = G.mode === 'find', pick = easy();
  $('play').querySelector('.combo').hidden = find || pick;
  submitBtn.hidden = find || pick;
  $('play').querySelector('.nav').hidden = find;
  $('findQ').hidden = !find; $('skipBtn').hidden = !find;
  $('choices').hidden = !pick;
}
// The answer bar sticks to the bottom of the screen. Size the map so the whole game fits on the screen with no scrolling:
// nothing is stuck under the answer bar (Central America under the flag choices, say), and the page never moves by itself.
let barReserve = 0;
function fitMap(reset){
  if(reset) barReserve = 0;
  const scr = $('scrPlay'), ms = $('mapSheet');
  if(scr.hidden || !VW) return;
  const ae = document.activeElement;
  if(!reset && ae && ae.tagName === 'INPUT') return; // the on-screen keyboard shrinks the window only for a moment
  scr.classList.toggle('compact', innerHeight < 760 && !ms.hidden); // short screens: drop the instructions line, the answer bar says what to do
  const shown = el => el && !el.hidden && el.offsetParent !== null;
  const h = Math.max(0, ...[$('play'), $('results').querySelector('.bar'), $('dailyDone')].filter(shown).map(b => b.offsetHeight));
  const sv = svg.getBoundingClientRect(), below = Math.max(0, ms.getBoundingClientRect().bottom - sv.bottom); // the legend under the map
  // a small change in the answer bar (a tip line) only covers the legend, so the map keeps its size; a big one makes room once
  if(h > barReserve + below + 12) barReserve = h;
  const avail = innerHeight - (sv.top + scrollY) - below - barReserve - 24; // a little spare so the page has nothing to scroll
  const maxW = Math.max(200, avail) * VW / VH;
  const want = maxW < (svg.parentElement.clientWidth || 1e9) ? Math.floor(maxW) + 'px' : '';
  if(svg.style.maxWidth !== want){ svg.style.maxWidth = want; if(vb && vb.w) setVB(vb); }
}
// a new game starts at the top of the page, with the map sized to fit
function showWholeMap(fresh){
  if(fresh){ barReserve = 0; window.scrollTo(0, 0); }
  requestAnimationFrame(() => fitMap());
}
if('ResizeObserver' in window){ const ro = new ResizeObserver(() => fitMap()); ro.observe($('play')); ro.observe($('results')); }
addEventListener('resize', () => fitMap());
function toPlay(){
  reviewing = false; current = null;
  $('play').hidden = false; $('results').hidden = true;
  feedback(G.round>1 ? `Round ${G.round}: your right answers stay green. ${remaining()} left to go!` : '');
  layoutBar(); subText(); playLegend(); setInput();
  if(G.mode === 'find'){ if(!G.queue || !G.queue.length) G.queue = shuffle(PN().filter(n => isOpen(n))); G.tries = 0; G.firstWrong = null; }
  paint();
  if(G.part) zoomToItems(PN());
  showWholeMap(true);
}
// frame a group of places (a part of a big place like West Africa)
function zoomToItems(names){
  let x0=1e9, y0=1e9, x1=-1e9, y1=-1e9;
  const small = names.filter(n => ITEM[n].dot || (ITEM[n].b[2]-ITEM[n].b[0]) < VW*0.4);
  if(small.length >= names.length / 2) names = small;
  names.forEach(n => { const b = ITEM[n].dot ? [ITEM[n].dot[0]-12, ITEM[n].dot[1]-12, ITEM[n].dot[0]+12, ITEM[n].dot[1]+12] : ITEM[n].b; x0=Math.min(x0,b[0]); y0=Math.min(y0,b[1]); x1=Math.max(x1,b[2]); y1=Math.max(y1,b[3]); });
  const pad = 0.08, w = clampW(Math.max((x1-x0)*(1+2*pad), (y1-y0)*(1+2*pad)*VW/VH));
  animateTo({x:(x0+x1)/2 - w/2, y:(y0+y1)/2 - w*VH/VW/2, w});
}
function select(n){
  if(EXPLORE){ exploreTap(n); return; }
  if(DAILY){ dailyTap(n); return; }
  if(!G || G.mode==='flash' || !inPlay(n)) return;
  if(G.mode === 'find' && !reviewing){ findTap(n); return; }
  current = n; focusItem(n);
  if(reviewing){
    const a = G.answers[n], right = T.showsItem ? `The capital of <b>${esc(n)}</b> is <b>${esc(key(n))}</b>.` : `This is <b>${esc(n)}</b>.`;
    $('callout').innerHTML = isSolved(n) && G.solved[n] < G.round ? `${right} You got it in round ${G.solved[n]}.`
      : isSolved(n) ? `${right} You got it right!` : G.mode === 'find' ? `${right} ${a && a !== 'skipped' ? `You tapped ${esc(a)}.` : 'You skipped it.'}`
      : `${right} ${a ? `You said ${esc(a)}.` : `You left it blank.`}`;
    paint(); return;
  }
  if(!sinks(ITEM[n])){ svg.appendChild(els[n]); raiseDots(n); } // bring to front so its outline shows, but keep tap dots on top
  if(isSolved(n)) feedback(T.showsItem ? `<b>${esc(key(n))}</b>. You already got this one.` : `That's <b>${esc(the(n))}</b>. You already got this one.`, 'ok');
  else if(G.mode==='practice' && G.answers[n]) feedback(`You said ${esc(G.answers[n])}. ${T.showsItem ? `The capital is <b>${esc(key(n))}</b>` : `This is <b>${esc(n)}</b>`}.`, 'bad');
  else feedback('');
  setInput(); paint();
  if(!inp.disabled && finePointer) inp.focus({preventScroll:true});
}
async function submit(){
  const v = easy() && NAMES.some(x => key(x) === inp.value) ? inp.value : exact();
  if(!current || !isOpen(current) || !v) return;
  G.active = true;
  if(G.mode === 'practice'){
    G.answers[current] = v;
    const right = v === key(current);
    if(T.flags){
      if(right){ G.solved[current] = G.round; feedback(`Yes! That's the flag of <b>${esc(current)}</b>.`, 'ok'); sound('right'); }
      else { const w = placeOf(v); noteMix(current, w); feedback(`Not quite. That's the flag of ${esc(v)}. Here is the flag of <b>${esc(current)}</b>: ${flagImg(current, 'tiny')} ${mixTip(current, w)}`, 'bad'); flashMix(w); sound('wrong'); }
    }
    else if(right){ G.solved[current] = G.round; feedback(`Yes! ${T.showsItem ? `The capital of ${esc(current)} is` : `That's`} <b>${esc(T.showsItem ? v : the(v))}</b>.`, 'ok'); sound('right'); }
    else { const w = placeOf(v); noteMix(current, w); feedback(`Not quite. ${T.showsItem ? `The capital of ${esc(current)} is` : `That's`} <b>${esc(T.showsItem ? key(current) : the(key(current)))}</b>, not ${esc(T.showsItem ? v : the(v))}. ${mixTip(current, w)}`, 'bad'); flashMix(w); sound('wrong'); }
    recordItem(player.id, T.id, current, right);
    setInput(); paint(); saveSoon();
    if(PN().every(n => !isOpen(n))) feedback($('feedback').innerHTML + ' That was the last one. Press <b>Review</b> to see how you did!', right ? 'ok' : 'bad');
    return;
  }
  for(const k in G.answers) if(G.answers[k] === v && k !== current) delete G.answers[k]; // each answer fits only one place
  G.answers[current] = v; sound('tap');
  feedback(`Saved ${esc(v)}.`); paint(); saveSoon();
  if(!step(1, true)){ setInput(); feedback(`Every one has an answer. Press <b>Review</b> when you're ready!`); }
}
submitBtn.onclick = submit;
function step(dir, quiet){
  const i = current ? ORDER.indexOf(current) : (dir>0 ? -1 : 0), L = ORDER.length;
  for(let k=1; k<=L; k++){
    const n = ORDER[((i+dir*k)%L+L)%L];
    if(inPlay(n) && isOpen(n) && !G.answers[n]){
      const msg = $('feedback').innerHTML, cls = $('feedback').className;
      select(n);
      if(quiet){ $('feedback').innerHTML = msg; $('feedback').className = cls; }
      return true;
    }
  }
  if(!quiet) feedback(`Every one has an answer. Press <b>Review</b> when you're ready!`);
  return false;
}
$('next').onclick = () => EXPLORE ? exploreStep(1) : step(1);
$('prev').onclick = () => EXPLORE ? exploreStep(-1) : step(-1);
