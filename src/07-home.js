// World Geography Quiz: The home screen and the place screen (tabs and ways to play).
// One of the game's script files, loaded in number order by index.html (see src/README.md).
'use strict';

/* ===================== 7. home ===================== */
let THUMBS = null;
const loadThumbs = () => THUMBS ? Promise.resolve(THUMBS) : fetch('data/thumbs.json').then(r => r.ok ? r.json() : {}).then(t => (THUMBS = t)).catch(() => (THUMBS = {}));
const thumbSvg = map => { const t = THUMBS && THUMBS[map]; return t ? `<svg class="rthumb" viewBox="0 0 ${t.w} ${t.h}" aria-hidden="true">${t.o ? `<path class="o" d="${t.o}"/>` : ''}<path d="${t.d}"/></svg>` : '<span class="rthumb"></span>'; };
// Up next: one suggestion for what to play, moving each part from Learn to Find it to Practice to Test.
async function upNext(){
  const items = (await DB.all('items')).filter(r => r.pid === player.id && TOPIC[r.topic]);
  const attempts = (await DB.all('attempts')).filter(a => a.pid === player.id && TOPIC[a.topic]);
  const right = {}, studied = {};
  items.forEach(r => { if(r.last === 'right') (right[r.topic] = right[r.topic] || new Set()).add(r.item); if(r.studied) (studied[r.topic] = studied[r.topic] || new Set()).add(r.item); });
  const latest = [...items.map(r => [Math.max(r.at||0, r.studiedAt||0), r.topic]), ...attempts.map(a => [a.at, a.topic])].sort((a,b) => b[0] - a[0])[0];
  const order = TOPICS.map(t => t.id), start = latest ? order.indexOf(latest[1]) : order.indexOf('world'); // newcomers start with continents and oceans
  for(let k = 0; k < order.length; k++){
    const t = TOPIC[order[(start + k) % order.length]], R = right[t.id] || new Set(), S = studied[t.id] || new Set();
    let scopes = t.parts ? Object.entries(t.parts).map(([part, names]) => ({part, names})) : [{part:null, names:null}];
    if(t.parts && k === 0){ const cur = getPart(withParts(REGIONS.find(r => r.name === t.group), t)), i = scopes.findIndex(x => x.part === cur); if(i > 0) scopes = [...scopes.slice(i), ...scopes.slice(0, i)]; }
    for(const {part, names} of scopes){
      const n = names ? names.length : t.count, L = names ? names.filter(x => R.has(x)).length : R.size, st = names ? names.filter(x => S.has(x)).length : S.size;
      const perfect = attempts.some(a => a.topic === t.id && a.mode === 'test' && a.total && a.correct === a.total && (a.part || null) === part);
      const mode = L === 0 && st < n / 2 ? 'flash' : L < n * 0.5 ? 'find' : L < n ? 'practice' : !perfect ? 'test' : null;
      if(mode) return {t, part, mode, L, n};
    }
  }
  return null;
}
async function upNextCard(){
  if(player.prefs.upnext === false) return '';
  const u = await upNext(); if(!u) return '';
  const title = u.part ? `${partTitle(u.t.group, u.part)} ${u.t.tab}` : u.t.name;
  const why = {flash:`Start with flashcards to meet all ${u.n}.`, find:`${u.L} of ${u.n} learned. Find them on the map.`, practice:`${u.L} of ${u.n} learned. Practice the rest.`, test:`All ${u.n} learned! Can you get a perfect Test?`}[u.mode];
  return `<section class="group upnextsec"><h2>Up next</h2><button class="resumebtn upnext" data-topic="${u.t.id}" data-mode="${u.mode}"${u.part ? ` data-part="${esc(u.part)}"` : ''}>
    <span class="rt">${MODES[u.mode]}: ${esc(title)}</span><span class="rm">${esc(why)}</span><span class="go" aria-hidden="true">▶</span></button></section>`;
}
async function renderHome(){
  if(!player) return;
  $('homePlayer').innerHTML = `${avatar(player)}<span>${esc(player.name)}</span>`;
  $('hello').textContent = `Hi, ${player.name}! Where do you want to explore today?`;
  await loadThumbs();
  const games = (await DB.all('games')).filter(g => g.pid === player.id && TOPIC[g.topic] && MODES[g.mode] && !g.reviewed)
    .sort((a,b) => (b.updated||0) - (a.updated||0)).slice(0, 3);
  const regions = await Promise.all(REGIONS.map(async r => {
    let learned = 0, total = 0;
    for(const t of r.topics){ learned += (await DB.byPT('items', player.id, t.id)).filter(i => i.last==='right').length; total += t.count; }
    return {r, learned, total};
  }));
  const upnext = await upNextCard();
  $('homeGroups').innerHTML = dailyCard() + upnext + mysteryCard() +
    (games.length ? `<section class="group"><h2>Keep going</h2><div class="resumes">${games.map(g => { const t = TOPIC[g.topic]; return `
      <button class="resumebtn" data-topic="${g.topic}" data-mode="${g.mode}"${g.part ? ` data-part="${esc(g.part)}"` : ''}><span class="rt">${esc(t.name)}${g.part ? ` · ${esc(g.part)}` : ''}</span><span class="rm">${MODES[g.mode]} · ${Object.keys(g.answers).length} of ${g.part && t.parts ? t.parts[g.part].length : t.count} done${g.round>1 ? ` · round ${g.round}` : ''}</span><span class="go" aria-hidden="true">▶</span></button>`; }).join('')}</div></section>` : '') +
    `<section class="group"><h2>Pick a place</h2><div class="regions">${regions.map(({r, learned, total}) => `
      <button class="rtile" data-region="${esc(r.name)}">${thumbSvg(r.map)}
        <span class="rname">${esc(r.name)}</span>
        <span class="rsub">${r.topics.map(t => esc(t.tab)).join(' · ')}</span>
        <span class="meter" aria-hidden="true"><i style="width:${Math.round(100*learned/total)}%"></i></span>
        <span class="rprog">${learned} of ${total} learned</span>
      </button>`).join('')}</div></section>`;
}
$('homeGroups').addEventListener('click', e => {
  if(e.target.closest('#dailyBtn')){ startDaily(); return; }
  const g = e.target.closest('[data-mode]'); if(g){ enterGame(g.dataset.topic, g.dataset.mode, false, null, g.dataset.part || null); return; }
  const r = e.target.closest('[data-region]'); if(r) openRegion(r.dataset.region);
});

// ---- a place: tabs for what to learn, then how to play ----
let curRegion = null, curTab = null;
function openRegion(name){
  curRegion = REGIONS.find(r => r.name === name); curTab = lastTab(curRegion, true).id;
  showScreen('scrRegion'); pushLayer(() => { showScreen('scrHome'); renderHome(); });
  renderRegion();
}
$('regionBack').onclick = () => popLayer();
$('exploreBtn').onclick = () => enterExplore(curRegion.name, false, TOPIC[curTab] && TOPIC[curTab].geo ? curTab : null);
// Drawing a tab waits for saved progress (and sometimes a map). A newer drawing, after a quick tap on another tab,
// replaces an older one that is still waiting, so the screen always shows the tab that was tapped last.
let regionDraw = 0;
async function renderRegion(){
  if(!curRegion || !player) return;
  const draw = ++regionDraw;
  const tabs = tabsOf(curRegion);
  $('regionTitle').textContent = curRegion.name;
  $('regionTabs').hidden = tabs.length < 2;
  $('regionTabs').classList.toggle('many', tabs.length > 3);
  $('regionTabs').classList.toggle('lots', tabs.length > 6);
  $('regionTabs').innerHTML = tabs.map(x => `<button role="tab" data-tab="${x.id}" aria-selected="${x.id===curTab}">${esc(x.tab)}</button>`).join('');
  if(TOUR[curTab]) return renderTour(TOUR[curTab], draw); // the World Tour (src/16-world-tour.js)
  const t = TOPIC[curTab], r = withParts(curRegion, t); // the parts for this tab (Land & Water has none)
  const part = getPart(r), pp = part === 'All' ? null : part, n = pp ? r.parts[pp].length : t.count;
  const st = await topicStats(player.id, t, pp);
  const right = new Set((await DB.byPT('items', player.id, t.id)).filter(i => i.last === 'right').map(i => i.item));
  const kept = player.badges || {}; // a badge stays once earned, even after a later miss
  const done = Object.fromEntries(r.parts ? Object.entries(r.parts).map(([k, names]) => [k, names.every(n => right.has(n)) || !!kept[`part-${t.id}-${k}`]]) : []);
  done.All = right.size >= t.count || !!kept['master-' + t.id];
  const saved = await Promise.all(Object.keys(MODES).map(m => DB.get('games', gameKey(player.id, t.id, pp ? m + '@' + pp : m))));
  const blurb = t.blurb || geoBlurb(t, await loadMap(t.map)); // Land & Water lines are worked out from the map
  if(draw !== regionDraw) return; // another tab was tapped meanwhile
  $('regionBody').innerHTML = `
    <p class="sub">${esc(blurb)}</p>
    ${t.landmarks ? '<button class="passlink" data-passport>🛂 See the stamps in your passport</button>' : ''}
    ${partChips(r, part, done)}
    <div class="meter" role="img" aria-label="${st.learned} of ${n} learned"><i style="width:${Math.round(100*st.learned/n)}%"></i></div>
    <p class="stats"><span><b>${st.learned}</b> of ${n} learned${pp ? ` in ${esc(partPhrase(r.name, pp))}` : ''}</span>${done[part] ? `<span class="gotbadge">🏅 Badge earned: <b>${esc(pp ? partTitle(r.name, pp) + ' ' + t.tab : t.name + ' Master')}</b></span>` : ''}${st.best!=null ? `<span>Best test: <b>${st.best}/${n}</b></span>` : ''}</p>
    <div class="modelist">${modeButtons(t, saved, null, pp)}
      <button class="modebig clockbtn" data-clock="${t.id}"${pp ? ` data-part="${pp}"` : ''}><span class="mn">⏱️ Beat the Clock</span><span class="md">How many can you get right in ${BEAT_SECONDS} seconds?${beatBest(t) ? ` Your best: ${beatBest(t)}.` : ''}</span></button></div>`;
}
const modeButtons = (t, saved, current, part) => Object.keys(MODES).map((m,i) => `
  <button class="modebig" data-topic="${t.id}" data-mode="${m}"${part ? ` data-part="${part}"` : ''}${current===m ? ' aria-current="true"' : ''}>
    <span class="mn">${MODES[m]}</span><span class="md">${esc(modeDesc(m, t))}</span>${saved && saved[i] && !saved[i].reviewed ? '<span class="resume">Keep going</span>' : ''}
  </button>`).join('');
$('regionTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if(!b) return; curTab = b.dataset.tab; rememberTab(curRegion, curTab); renderRegion(); });
$('regionBody').addEventListener('click', e => {
  const pc = e.target.closest('.partrow [data-part]'); if(pc){ setPart(curRegion, pc.dataset.part); renderRegion(); return; }
  const b = e.target.closest('[data-mode]'); if(b) enterGame(b.dataset.topic, b.dataset.mode, false, null, b.dataset.part || null);
});
$('homePlayer').onclick = openPlayers;
$('homeHelp').onclick = () => openHelp();
$('homeSettings').onclick = () => openSettings();
