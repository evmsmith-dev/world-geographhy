// World Geography Quiz: Explore: tap anything on the map to learn about it.
// One of the game's script files, loaded in number order by index.html (see src/README.md).
'use strict';

/* ===================== 10b2. Explore map: tap anything to learn about it ===================== */
let EXPLORE = null; // {R: the place, labels: show names on the map}
function enterExplore(regionName, fromPicker, topicId){
  saveNow(); hideToast();
  const R = REGIONS.find(r => r.name === regionName);
  if(!fromPicker){ returnTo = SCREENS.find(id => !$(id).hidden) || 'scrHome'; showScreen('scrPlay'); pushLayer(leaveGame); }
  endExplore(); G = null; current = null; reviewing = false;
  T = topicId && TOPIC[topicId] ? TOPIC[topicId] : R.topics[0];
  EXPLORE = {R, labels: LS.get('labels') !== '0', geo: !!T.geo};
  if(R.map !== 'world') loadFacts();
  $('chipText').innerHTML = `<span class="ct">${esc(R.name)}</span><small>${T.geo ? `Explore ${esc(T.tab.toLowerCase())}` : 'Explore the map'}</small>`;
  ['mapSheet','play','results','flash','dailyDone'].forEach(id => $(id).hidden = true);
  $('sub').textContent = 'Loading the map…'; $('tally').textContent = ''; $('clock').hidden = true;
  (async () => {
    try{ M = await loadMap(T.map); if(!T.geo && R.topics.some(t => t.flags)) await loadFlags(R.map); }
    catch(e){ $('sub').textContent = 'The map could not load. Check your internet connection, then go back and try again.'; return; }
    if(!EXPLORE || EXPLORE.R !== R) return;
    drawMap();
    // explore uses its own controls in the bottom bar
    ['.combo','#submit','#reviewBtn','#skipBtn','#findQ','#choices'].forEach(sel => { const el = $('play').querySelector(sel); if(el && !el.hidden){ el.hidden = true; el.setAttribute('data-ehide',''); } });
    $('findQ').hidden = true; $('choices').hidden = true; $('play').querySelector('.nav').hidden = false;
    $('exTools').hidden = false; $('exInfo').hidden = false;
    $('lblBtn').setAttribute('aria-pressed', String(EXPLORE.labels));
    $('mapSheet').hidden = false; $('play').hidden = false; legend([]);
    $('sub').textContent = 'Tap any place to learn about it. Pinch or press + to zoom in.';
    $('selLabel').textContent = 'Explore';
    feedback(''); explorePaint(); exploreInfo(null); drawLabels(); exploreScale();
    showWholeMap(true);
    barReserve = Math.min(340, innerHeight * 0.42); // room for a place's flag, capital and fun fact, so the map doesn't shrink on the first tap
  })();
}
function endExplore(){
  if(!EXPLORE) return;
  EXPLORE = null;
  $('play').querySelectorAll('[data-ehide]').forEach(el => { el.hidden = false; el.removeAttribute('data-ehide'); });
  $('exTools').hidden = true; $('exInfo').hidden = true;
  const g = svg.querySelector('#exLabels'); if(g) g.remove();
  const st = svg.querySelector('#exStar'); if(st) st.remove();
}
function explorePaint(){
  NAMES.forEach(n => {
    setPlaceClass(n, n === current ? 'sel' : '');
    els[n].setAttribute('aria-label', n);
  });
  if(current && !sinks(ITEM[current])){ svg.appendChild(els[current]); raiseDots(current); }
  // labels and the capital star stay on top
  const g = svg.querySelector('#exLabels'); if(g) svg.appendChild(g);
  let st = svg.querySelector('#exStar');
  const k = current && ITEM[current].k;
  if(k){ if(!st){ st = document.createElementNS(SVGNS, 'polygon'); st.id = 'exStar'; st.setAttribute('class','exstar'); } svg.appendChild(st); st.dataset.x = k[0]; st.dataset.y = k[1]; }
  else if(st) st.remove();
  exploreScale();
}
function exploreTap(n){ current = n; focusItem(n); explorePaint(); exploreInfo(n); sound('tap'); if(autoSay()){ const R = EXPLORE.R, cap = EXPLORE.geo ? null : capitalOf(R, n), f = factFor(n, R.map); say(...(cap ? [n, '. Its capital is', cap] : [n]), ...(f ? ['.', f] : [])); } }
function exploreStep(dir){
  const i = current ? ORDER.indexOf(current) : (dir > 0 ? -1 : 0), L = ORDER.length;
  exploreTap(ORDER[((i + dir) % L + L) % L]);
}
// "Did you know?" facts, loaded the first time Explore needs one
let FACTS = null, factsLoading = null;
const loadFacts = () => factsLoading || (factsLoading = fetch('data/facts.json').then(r => { if(!r.ok) throw 0; return r.json(); }).then(f => FACTS = f).catch(() => { factsLoading = null; }));
function factFor(n, map){ if(!FACTS) return null; if(T && T.geo) return (FACTS.geo || {})[n] || null; if(map === 'world') return null; return (map === 'us' ? FACTS.us : FACTS.country)[n] || null; }
function exploreInfo(n){
  const box = $('exInfo');
  if(!n){ box.innerHTML = '<p class="muted">Tap any place on the map to learn about it, or press <b>Next</b>.</p>'; return; }
  const R = EXPLORE.R, it = ITEM[n];
  const cap = EXPLORE.geo ? null : capitalOf(R, n);
  const flags = !EXPLORE.geo && R.topics.some(t => t.flags);
  const extra = EXPLORE.geo ? (it.sub === 'usregion' ? `${it.states} states: ${esc(it.where)}` : `A ${GEO_WORD[it.sub]} in ${esc(it.where || inPlace(R.name))}`) : R.map === 'world' ? worldSize(n, it.kind) : R.map === 'us' ? `Postal code: <b>${POSTAL[n]}</b>` : '';
  box.innerHTML = `${flags ? flagImg(n, 'exflag') : T.landmarks ? picImg(n, 'expic', `A drawing of ${the(n)}`) : ''}<div class="exbody"><p class="exname">${esc(n)} ${sayBtn(n, cap ? [n, '. Its capital is', cap] : [n])}</p>
    ${cap ? `<p>Capital: <b>${esc(cap)}</b> <span class="exstarkey" aria-hidden="true">★</span>${CAP_NOTE[n] ? ` <span class="muted">${esc(CAP_NOTE[n])}</span>` : ''}</p>` : ''}
    ${extra ? `<p class="muted">${extra}</p>` : ''}
    ${!EXPLORE.geo && R.map !== 'world' && R.map !== 'us' && COUNTRY_NOTE[n] ? `<p class="muted">${esc(COUNTRY_NOTE[n])}</p>` : ''}
    ${factFor(n, R.map) ? `<p class="fact"><span class="fk">💡 Did you know? ${sayBtn('the fact', [factFor(n, R.map)])}</span>${esc(factFor(n, R.map))}</p>` : ''}</div>`;
  if(!FACTS && R.map !== 'world') loadFacts().then(() => { if(EXPLORE && current === n && FACTS) exploreInfo(n); });
}
function drawLabels(){
  const old = svg.querySelector('#exLabels'); if(old) old.remove();
  if(!EXPLORE || !EXPLORE.labels) return;
  const g = document.createElementNS(SVGNS, 'g'); g.id = 'exLabels'; g.setAttribute('aria-hidden','true');
  M.items.forEach(i => {
    const t = document.createElementNS(SVGNS, 'text'); const [x,y] = i.dot || i.c;
    t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('class', 'exlbl' + (i.kind === 'ocean' || i.kind === 'water' ? ' sea' : ''));
    t.textContent = i.n; t.dataset.n = i.n; g.appendChild(t);
  });
  svg.appendChild(g); exploreScale();
}
// keep labels and the star the same size on screen at any zoom; show a name once its place is big enough
function exploreScale(){
  if(!EXPLORE) return;
  const cw = svg.clientWidth || 600, k = vb.w / cw;
  const g = svg.querySelector('#exLabels');
  if(g){
    g.setAttribute('font-size', (12*k).toFixed(2)); g.setAttribute('stroke-width', (3*k).toFixed(2));
    const fs = 12*k, placed = [];
    const texts = [...g.querySelectorAll('text')].map(t => { const [x0,y0,x1,y1] = ITEM[t.dataset.n].b; return {t, size: Math.max(x1-x0, y1-y0) / k}; })
      .sort((a,b) => (b.t.dataset.n === current) - (a.t.dataset.n === current) || b.size - a.size);
    texts.forEach(({t, size}) => {
      const show = size > 46 || t.dataset.n === current;
      if(!show){ t.style.display = 'none'; return; }
      const x = +t.getAttribute('x'), y = +t.getAttribute('y'), hw = t.textContent.length*fs*0.29, hh = fs*0.6;
      const box = [x-hw, y-hh, x+hw, y+hh];
      const hit = placed.some(b => !(box[2] < b[0] || box[0] > b[2] || box[3] < b[1] || box[1] > b[3]));
      t.style.display = hit ? 'none' : ''; if(!hit) placed.push(box);
    });
  }
  const st = svg.querySelector('#exStar');
  if(st && st.dataset.x) st.setAttribute('points', starPts(+st.dataset.x, +st.dataset.y, 9*k));
}
$('lblBtn').onclick = () => {
  if(!EXPLORE) return;
  EXPLORE.labels = !EXPLORE.labels; LS.set('labels', EXPLORE.labels ? '1' : '0');
  $('lblBtn').setAttribute('aria-pressed', String(EXPLORE.labels)); drawLabels(); explorePaint();
};
