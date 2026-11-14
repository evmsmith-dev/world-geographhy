// World Geography Quiz: Loading and drawing maps, zooming, dragging, tapping and search.
// One of the game's script files, loaded in number order by index.html (see src/README.md).
'use strict';

/* ===================== 8. map, zoom & search ===================== */
const MAPS = {};
const loadMap = name => MAPS[name] || (MAPS[name] = fetch('data/maps/' + name + '.json').then(r => { if(!r.ok) throw new Error('map ' + r.status); return r.json(); })
  .then(async m => {
    if(m.base){ // a Land & Water map: its continent's countries become a plain gray background
      const b = await loadMap(m.base);
      Object.assign(m, {w:b.w, h:b.h, seabg:b.seabg, other:b.other, bgland:b.items.map(i => i.d).join('')});
    }
    m.by = Object.fromEntries(m.items.map(i => [i.n, i])); MAPDATA[name] = m; return m; })
  .catch(e => { delete MAPS[name]; throw e; }));
let DOTS = {}; // tap targets for countries too small to tap (Vatican City, Monaco…)

const svg = $('map'), inp = $('answer'), opts = $('opts'), submitBtn = $('submit');
let T = null, M = null;              // current topic, current map data
let ITEM = {}, NAMES = [], ORDER = [], els = {};
let VW = 975, VH = 610, MINW = 97, vb = {x:0,y:0,w:975,h:610}, anim = 0;

function drawMap(){
  VW = M.w; VH = M.h; MINW = VW / (T.maxZoom || 10);
  ITEM = Object.fromEntries(M.items.map(i => [i.n, i]));
  NAMES = M.items.map(i => i.n).sort();
  ORDER = M.items.slice().sort((a,b) => a.c[0]-b.c[0]).map(i => i.n);
  const path = i => `<path class="st ${kindClass(i)}" d="${i.d}" data-n="${esc(i.n)}" tabindex="0" role="button"/>`;
  // bottom to top: sea, oceans and seas, other land, the countries' gray background (Land & Water), then places on land
  svg.innerHTML = (M.seabg ? `<rect class="seabg" width="${VW}" height="${VH}"/>` : '') + (M.sphere ? `<path class="globe" d="${M.sphere}"/>` : '') +
    M.items.filter(sinks).map(path).join('') +
    (M.other ? `<path class="other" d="${M.other}"/>` : '') +
    (M.bgland ? `<path class="bgland" d="${M.bgland}"/>` : '') +
    M.items.filter(i => !sinks(i)).map(path).join('');
  els = {}; svg.querySelectorAll('path.st').forEach(p => els[p.dataset.n] = p);
  DOTS = {};
  M.items.filter(i => i.dot).forEach(i => { const c = document.createElementNS(SVGNS, 'circle'); c.setAttribute('cx', i.dot[0]); c.setAttribute('cy', i.dot[1]); c.dataset.n = i.n; c.setAttribute('aria-hidden','true'); svg.appendChild(c); DOTS[i.n] = c; });
  // tall maps (South America) shouldn't run off the bottom of the screen
  fitMap();
  setVB({x:0, y:0, w:VW});
}
svg.addEventListener('keydown', e => { const p = e.target.closest('path.st'); if(p && (e.key==='Enter'||e.key===' ')){ e.preventDefault(); select(p.dataset.n); } });

const clampW = w => Math.min(VW, Math.max(MINW, w));
// how a place is drawn: land, ocean, water (seas and lakes), mountain range or desert
const kindClass = i => i.kind === 'ocean' ? 'ocean' : i.kind === 'water' ? 'water' : i.kind === 'mountain' ? 'mtn' : i.kind === 'desert' ? 'desert' : i.kind === 'park' ? 'park' : i.kind === 'city' ? 'city' : i.kind === 'plain' ? 'plain' : i.kind === 'river' ? 'river' : i.kind === 'landmark' ? 'landmark' : i.kind === 'usregion' ? `usregion tone${i.tone}` : 'land';
// oceans and seas lie under the land, so they are never brought to the front over it
const sinks = i => i.kind === 'ocean' || i.layer === 'under';
// color a place and its tap dot; extra is the state ('sel', 'ok'…). The mixed-up place keeps its outline for a moment.
function setPlaceClass(n, extra){
  let cls = 'st ' + kindClass(ITEM[n]) + (extra ? ' ' + extra.trim() : '');
  if(MIX && MIX.n === n && Date.now() < MIX.until) cls += ' mixup';
  els[n].setAttribute('class', cls); if(DOTS[n]) DOTS[n].setAttribute('class', cls + ' dot');
}
// tap dots for tiny places always sit above the countries, or a big neighbor (Italy) could cover one (Vatican City)
// the map's size on screen changes (first layout, turning the iPad, Explore), so resize the tap dots to match
if('ResizeObserver' in window) new ResizeObserver(() => { if(DOTS && Object.keys(DOTS).length && vb && vb.w) setVB(vb); }).observe(svg);
function raiseDots(last){ for(const k in DOTS) if(k !== last) svg.appendChild(DOTS[k]); if(last && DOTS[last]) svg.appendChild(DOTS[last]); const g = svg.querySelector('#exLabels'); if(g) svg.appendChild(g); }
// a finger is bigger than a dot: a tap near a dot picks it, so tiny places are easy to hit
// The tap circle a finger tap is meant for, if any. Fingers get some extra room around each circle. But a circle can sit
// on top of a bigger neighbor (Qatar's on the edge of the UAE, Liechtenstein's on Switzerland): a tap on that neighbor's
// land only goes to the circle when it's near the circle's middle, so the neighbor can still be tapped.
const DOT_ROOM = 8, DOT_CORE = 5;
function dotNear(cx, cy, under){
  let best = null, bd = 1e9;
  for(const k in DOTS){ const c = DOTS[k]; if(c.classList.contains('off') || c.style.display === 'none') continue;
    const r = c.getBoundingClientRect(); if(!r.width) continue;
    const d = Math.hypot(cx - (r.left + r.width/2), cy - (r.top + r.height/2));
    const reach = under && under !== k ? DOT_CORE : r.width/2 + DOT_ROOM;
    if(d <= reach && d < bd){ bd = d; best = k; } }
  return best;
}
// A river is a thin line, so a finger tap counts for it when it lands within a few pixels of the line
const RIVER_ROOM = 8;
function riverNear(cx, cy){
  const rivers = M && M.items.filter(i => i.kind === 'river' && els[i.n] && !els[i.n].classList.contains('off'));
  if(!rivers || !rivers.length) return null;
  const ctm = svg.getScreenCTM(); if(!ctm) return null;
  const pt = new DOMPoint(cx, cy).matrixTransform(ctm.inverse()), room = RIVER_ROOM / ctm.a; // the finger, in map units
  let best = null, bd = room;
  for(const i of rivers){
    i.lines = i.lines || i.d.split('M').filter(Boolean).map(l => l.split('L').map(p => p.split(',').map(Number)));
    for(const l of i.lines) for(let k = 1; k < l.length; k++){
      const [ax, ay] = l[k-1], [bx, by] = l[k], dx = bx - ax, dy = by - ay, L = dx*dx + dy*dy;
      const t = L ? Math.max(0, Math.min(1, ((pt.x - ax)*dx + (pt.y - ay)*dy) / L)) : 0, d = Math.hypot(pt.x - ax - t*dx, pt.y - ay - t*dy);
      if(d < bd){ bd = d; best = i.n; }
    }
  }
  return best;
}
// the place drawn under the finger, looking through any tap circles
function placeUnder(cx, cy){
  for(const el of document.elementsFromPoint(cx, cy)){
    if(el.tagName === 'circle') continue;
    const p = el.closest && el.closest('.st');
    if(p && svg.contains(p)) return p.classList.contains('off') ? null : p.dataset.n;
    if(el === svg) return null;
  }
  return null;
}
function setVB(v){
  const w = clampW(v.w), h = w*VH/VW;
  const x = Math.min(VW-w, Math.max(0, v.x)), y = Math.min(VH-h, Math.max(0, v.y));
  vb = {x,y,w,h}; svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
  // tap dots stay about the same size on screen at any zoom; a map limited by its height draws smaller, so use the real scale
  const cw = svg.clientWidth || 600, ch = svg.clientHeight || cw*VH/VW, px = Math.min(cw / w, ch / h) || 1;
  const r = 10 / px;
  for(const k in DOTS) DOTS[k].setAttribute('r', r.toFixed(2));
  if(EXPLORE) exploreScale();
  const full = w >= VW-0.5;
  $('zOut').disabled = full; $('zFit').disabled = full; $('zIn').disabled = w <= MINW+0.5;
  svg.classList.toggle('zoomed', !full);
}
function animateTo(t){
  cancelAnimationFrame(anim);
  if(reduceMotion){ setVB(t); return; }
  const from = {...vb}, t0 = performance.now();
  const tick = now => { const k = Math.min(1,(now-t0)/280), e = 1-Math.pow(1-k,3);
    setVB({x:from.x+(t.x-from.x)*e, y:from.y+(t.y-from.y)*e, w:from.w+(t.w-from.w)*e});
    if(k < 1) anim = requestAnimationFrame(tick); };
  anim = requestAnimationFrame(tick);
}
function zoomTarget(k, px=vb.x+vb.w/2, py=vb.y+vb.h/2){ const w = clampW(vb.w/k), f = w/vb.w; return {x:px-(px-vb.x)*f, y:py-(py-vb.y)*f, w}; }
$('zIn').onclick = () => animateTo(zoomTarget(1.8));
$('zOut').onclick = () => animateTo(zoomTarget(1/1.8));
$('zFit').onclick = () => animateTo({x:0, y:0, w:VW});
// make sure a selected item is on screen and big enough to see
function focusItem(n){
  const [x0,y0,x1,y1] = ITEM[n].b, rect = svg.getBoundingClientRect();
  if(!rect.width) return;
  const bw = x1-x0, bh = y1-y0, size = Math.max(bw,bh) * rect.width/vb.w;
  const inView = x0>=vb.x && y0>=vb.y && x1<=vb.x+vb.w && y1<=vb.y+vb.h;
  if(inView && size >= 34) return;
  const w = size >= 34 ? vb.w : clampW(Math.max(bw*4, bh*4*VW/VH));
  animateTo({x:(x0+x1)/2 - w/2, y:(y0+y1)/2 - w*VH/VW/2, w});
}
const toSvg = (cx, cy, v=vb) => { const r = svg.getBoundingClientRect(); return [v.x+(cx-r.left)/r.width*v.w, v.y+(cy-r.top)/r.height*v.h]; };
const pts = new Map(); let drag = null, pinch0 = null, dragged = false;
svg.addEventListener('pointerdown', e => {
  if(e.button > 0) return;
  svg.setPointerCapture && svg.setPointerCapture(e.pointerId);
  pts.set(e.pointerId, {x:e.clientX, y:e.clientY}); cancelAnimationFrame(anim);
  if(pts.size === 1){ drag = {x:e.clientX, y:e.clientY, vb:{...vb}}; dragged = false; }
  if(pts.size === 2){ const [a,b] = [...pts.values()]; pinch0 = {d:Math.hypot(a.x-b.x,a.y-b.y)||1, m:[(a.x+b.x)/2,(a.y+b.y)/2], vb:{...vb}}; dragged = true; }
});
svg.addEventListener('pointermove', e => {
  if(!pts.has(e.pointerId)) return;
  pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
  const r = svg.getBoundingClientRect();
  if(pts.size === 1 && drag){
    const dx = e.clientX-drag.x, dy = e.clientY-drag.y;
    if(Math.hypot(dx,dy) > 8) dragged = true;
    if(dragged){ const s = drag.vb.w/r.width; setVB({x:drag.vb.x-dx*s, y:drag.vb.y-dy*s, w:drag.vb.w}); }
  } else if(pts.size === 2 && pinch0){
    const [a,b] = [...pts.values()], d = Math.hypot(a.x-b.x,a.y-b.y), m = [(a.x+b.x)/2,(a.y+b.y)/2];
    const [px,py] = toSvg(pinch0.m[0], pinch0.m[1], pinch0.vb), w = clampW(pinch0.vb.w*pinch0.d/d), h = w*VH/VW;
    setVB({x:px-(m[0]-r.left)/r.width*w, y:py-(m[1]-r.top)/r.height*h, w});
  }
});
function endPointer(e){
  if(!pts.has(e.pointerId)) return;
  const tap = e.type==='pointerup' && pts.size===1 && !dragged;
  pts.delete(e.pointerId);
  if(tap){ let n;
    if(e.pointerType === 'mouse'){ const el = document.elementFromPoint(e.clientX, e.clientY), p = el && el.closest && el.closest('.st'); n = p && p.dataset.n; } // a mouse is exact
    else { const under = placeUnder(e.clientX, e.clientY); n = dotNear(e.clientX, e.clientY, under) || riverNear(e.clientX, e.clientY) || under; }
    if(n) select(n); }
  if(pts.size === 1){ const [p] = [...pts.values()]; drag = {x:p.x, y:p.y, vb:{...vb}}; pinch0 = null; }
  if(!pts.size){ drag = null; pinch0 = null; }
}
svg.addEventListener('pointerup', endPointer);
svg.addEventListener('pointercancel', endPointer);
svg.addEventListener('wheel', e => { // trackpad pinch or ctrl+scroll; plain scrolling still moves the page
  if(!e.ctrlKey && !e.metaKey) return;
  e.preventDefault(); cancelAnimationFrame(anim);
  const [px,py] = toSvg(e.clientX, e.clientY); setVB(zoomTarget(Math.exp(-e.deltaY*0.01), px, py));
}, {passive:false});

// ---- answer search: prefix, word, contains, abbreviations, and forgiving spelling ----
const ABBR = {st:'saint', ste:'sainte', mt:'mount', ft:'fort', n:'north', s:'south', w:'west', e:'east', no:'north', so:'south'};
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[.,'&\-/]/g,' ').replace(/\s+/g,' ').trim(); // "Bogota" finds Bogotá
const expand = q => q.split(' ').map(w => ABBR[w] || w).join(' ');
function lev(a, b, max){
  if(Math.abs(a.length-b.length) > max) return max+1;
  let prev = Array.from({length:b.length+1}, (_,i) => i);
  for(let i=1; i<=a.length; i++){
    const cur = [i]; let best = i;
    for(let j=1; j<=b.length; j++){ cur[j] = Math.min(prev[j]+1, cur[j-1]+1, prev[j-1] + (a[i-1]===b[j-1]?0:1)); if(cur[j] < best) best = cur[j]; }
    if(best > max) return max+1; prev = cur;
  }
  return prev[b.length];
}
const aliasesOf = v => (T.alias[stateOf(v)] || T.alias[v] || []);
function rank(v, q){
  if(!q) return 0;
  const name = norm(v), qs = [...new Set([q, expand(q)])], words = name.split(' ');
  if(aliasesOf(v).includes(q)) return 0;
  for(const x of qs) if(name.startsWith(x)) return 1;
  for(const x of qs) if(words.some((_,i) => words.slice(i).join(' ').startsWith(x))) return 2;
  for(const x of qs) if(name.includes(x)) return 3;
  return -1;
}
// forgiving spelling, used only when nothing matches the normal way ("Pacfic" finds Pacific Ocean)
function fuzzy(v, q){
  const name = norm(v), words = name.split(' ');
  const tol = q.length >= 8 ? 2 : q.length >= 4 ? 1 : 0;
  if(tol){
    const starts = words.map((_,i) => words.slice(i).join(' '));
    for(const s of starts) for(let L=q.length-1; L<=q.length+1; L++) if(L>0 && lev(q, s.slice(0,L), tol) <= tol) return 4;
  }
  return -1;
}
const key = n => T.answer(n);
const stateOf = v => NAMES.find(n => key(n) === v);
const pool = () => NAMES.map(key).filter(v => !isSolved(stateOf(v))).sort();
const exact = () => { const q = norm(inp.value); if(!q) return undefined; return pool().find(v => { const n = norm(v); return n===q || n===expand(q) || aliasesOf(v).includes(q); }); };
let matches = [], active = -1;
function search(){
  const q = norm(inp.value), all = pool();
  matches = !q ? all : all.map(v => [v, rank(v,q)]).filter(([,r]) => r >= 0).sort((a,b) => a[1]-b[1] || a[0].localeCompare(b[0])).map(([v]) => v);
  if(q && !matches.length) matches = all.filter(v => fuzzy(v, q) > 0);
  active = matches.length ? 0 : -1;
  const raw = inp.value.trim().toLowerCase(), used = new Set(Object.values(G.answers));
  opts.innerHTML = matches.length ? matches.map((v,i) => {
    const at = raw ? v.toLowerCase().indexOf(raw) : -1;
    const label = at < 0 ? esc(v) : esc(v.slice(0,at)) + '<mark>' + esc(v.slice(at, at+raw.length)) + '</mark>' + esc(v.slice(at+raw.length));
    const tag = G.mode==='test' && used.has(v) && G.answers[current]!==v ? '<span class="tag">already used</span>' : '';
    return `<li role="option" id="o${i}" data-v="${esc(v)}" aria-selected="${i===active}"><span>${label}</span>${tag}</li>`;
  }).join('') : `<li class="none">No ${esc(T.listWord)} match that. Check the spelling?</li>`;
  openList(true);
}
function openList(on){ opts.hidden = !on; inp.setAttribute('aria-expanded', String(on)); inp.setAttribute('aria-activedescendant', on && active>=0 ? 'o'+active : ''); }
function moveActive(d){
  if(!matches.length) return;
  active = (active + d + matches.length) % matches.length;
  [...opts.children].forEach((li,i) => li.setAttribute('aria-selected', String(i===active)));
  opts.children[active] && opts.children[active].scrollIntoView({block:'nearest'});
  inp.setAttribute('aria-activedescendant', 'o'+active);
}
function choose(v){ inp.value = v; openList(false); syncSubmit(); submitBtn.focus({preventScroll:true}); }
function syncSubmit(){ const pick = exact(); submitBtn.disabled = !current || !isOpen(current) || !pick || (G.mode==='test' && G.answers[current]===pick); $('clearTxt').hidden = !inp.value; }
inp.addEventListener('input', () => { search(); syncSubmit(); });
// the whole list opens as soon as the box is ready, except over a landmark's picture: there it waits for typing (or the down arrow)
inp.addEventListener('focus', () => { if(!inp.disabled && (inp.value || !T.landmarks)) search(); });
inp.addEventListener('keydown', e => {
  if(e.key==='ArrowDown'){ e.preventDefault(); opts.hidden ? search() : moveActive(1); }
  else if(e.key==='ArrowUp'){ e.preventDefault(); moveActive(-1); }
  else if(e.key==='Enter'){ e.preventDefault(); if(!opts.hidden && active>=0) choose(matches[active]); else if(!submitBtn.disabled) submit(); }
  else if(e.key==='Escape' && !opts.hidden){ e.stopPropagation(); openList(false); }
});
inp.addEventListener('blur', () => setTimeout(() => openList(false), 150));
opts.addEventListener('mousedown', e => e.preventDefault());
opts.addEventListener('click', e => { const li = e.target.closest('li[data-v]'); if(li) choose(li.dataset.v); });
$('clearTxt').onclick = () => { inp.value = ''; syncSubmit(); inp.focus(); };
