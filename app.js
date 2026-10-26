/* World Geography Quiz
   Plain JavaScript, no libraries. Sections:
   1 helpers · 2 topic data · 3 storage (IndexedDB) · 4 navigation & overlays · 5 sound & confetti
   6 players · 7 home · 8 map, zoom & search · 9 game (test/practice/review) · 10 flashcards
   11 settings, help, backup · 12 updates & start-up */
'use strict';
(() => {

/* ===================== 1. helpers ===================== */
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS = {
  get(k){ try{ return localStorage.getItem('wgq-'+k); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem('wgq-'+k, v); }catch(e){} },
};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer:fine)').matches;
const BUILD = window.WGQ_BUILD || 'dev';
const fmtTime = ms => { const s=Math.floor(ms/1000); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
const ordinal = n => n+(['th','st','nd','rd'][(n%100-20)%10]||['th','st','nd','rd'][n%100]||'th');
const shuffle = a => { for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const SVGNS = 'http://www.w3.org/2000/svg';

/* ===================== 2. topic data ===================== */
const CAP = {"Alabama":"Montgomery","Alaska":"Juneau","Arizona":"Phoenix","Arkansas":"Little Rock","California":"Sacramento","Colorado":"Denver","Connecticut":"Hartford","Delaware":"Dover","Florida":"Tallahassee","Georgia":"Atlanta","Hawaii":"Honolulu","Idaho":"Boise","Illinois":"Springfield","Indiana":"Indianapolis","Iowa":"Des Moines","Kansas":"Topeka","Kentucky":"Frankfort","Louisiana":"Baton Rouge","Maine":"Augusta","Maryland":"Annapolis","Massachusetts":"Boston","Michigan":"Lansing","Minnesota":"Saint Paul","Mississippi":"Jackson","Missouri":"Jefferson City","Montana":"Helena","Nebraska":"Lincoln","Nevada":"Carson City","New Hampshire":"Concord","New Jersey":"Trenton","New Mexico":"Santa Fe","New York":"Albany","North Carolina":"Raleigh","North Dakota":"Bismarck","Ohio":"Columbus","Oklahoma":"Oklahoma City","Oregon":"Salem","Pennsylvania":"Harrisburg","Rhode Island":"Providence","South Carolina":"Columbia","South Dakota":"Pierre","Tennessee":"Nashville","Texas":"Austin","Utah":"Salt Lake City","Vermont":"Montpelier","Virginia":"Richmond","Washington":"Olympia","West Virginia":"Charleston","Wisconsin":"Madison","Wyoming":"Cheyenne"};
const POSTAL = {Alabama:'AL',Alaska:'AK',Arizona:'AZ',Arkansas:'AR',California:'CA',Colorado:'CO',Connecticut:'CT',Delaware:'DE',Florida:'FL',Georgia:'GA',Hawaii:'HI',Idaho:'ID',Illinois:'IL',Indiana:'IN',Iowa:'IA',Kansas:'KS',Kentucky:'KY',Louisiana:'LA',Maine:'ME',Maryland:'MD',Massachusetts:'MA',Michigan:'MI',Minnesota:'MN',Mississippi:'MS',Missouri:'MO',Montana:'MT',Nebraska:'NE',Nevada:'NV','New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND',Ohio:'OH',Oklahoma:'OK',Oregon:'OR',Pennsylvania:'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD',Tennessee:'TN',Texas:'TX',Utah:'UT',Vermont:'VT',Virginia:'VA',Washington:'WA','West Virginia':'WV',Wisconsin:'WI',Wyoming:'WY'};
const STATE_ALIAS = {Massachusetts:['mass'],Pennsylvania:['penn'],Washington:['wash']};
Object.entries(POSTAL).forEach(([n,c]) => (STATE_ALIAS[n]=STATE_ALIAS[n]||[]).push(c.toLowerCase()));
const CAPITAL_ALIAS = {'Salt Lake City':['slc'],'Oklahoma City':['okc'],'Jefferson City':['jeff city']};
const WORLD_ALIAS = {'Australia':['oceania','australia oceania'],'North America':['na'],'South America':['sa'],
  'Pacific Ocean':['pacific'],'Atlantic Ocean':['atlantic'],'Indian Ocean':['indian'],'Arctic Ocean':['arctic'],
  'Southern Ocean':['southern','antarctic ocean']};
// size rank among its kind, and one fact a kid can remember
const WORLD_FACT = {
  'Asia':[1,'Mount Everest, the tallest mountain on Earth, is here.'],
  'Africa':[2,'The Sahara, the biggest hot desert, is here.'],
  'North America':[3,'The United States, Canada and Mexico are here.'],
  'South America':[4,'The Amazon, the biggest rainforest, is here.'],
  'Antarctica':[5,'The coldest place on Earth. Flat maps make it look bigger than it really is.'],
  'Europe':[6,'It has more than 40 countries.'],
  'Australia':[7,'Kangaroos live here. It is also called Oceania.'],
  'Pacific Ocean':[1,'It is also the deepest ocean.'],
  'Atlantic Ocean':[2,'It lies between the Americas and Europe and Africa.'],
  'Indian Ocean':[3,'It is the warmest ocean.'],
  'Southern Ocean':[4,'It goes all the way around Antarctica.'],
  'Arctic Ocean':[5,'Much of it is frozen all year.'],
};
function worldSize(n, kind){
  const [rank, fact] = WORLD_FACT[n], last = kind==='ocean' ? 5 : 7, word = kind==='ocean' ? 'ocean' : 'continent';
  const size = rank===1 ? `Biggest ${word}` : rank===last ? `Smallest ${word}` : `${ordinal(rank)} biggest ${word}`;
  return `<b>${size}.</b> ${esc(fact)}`;
}

const TOPICS = [
  { id:'us-states', group:'United States', name:'US States', blurb:'Name all 50 states on the map.', map:'us', count:50,
    answer:n=>n, nouns:'states', listWord:'state names', alias:STATE_ALIAS, maxZoom:10,
    tapWhat:'Tap a state, find its name', tapHint:'Tap a state on the map',
    ask:()=> 'Which state is this?', flashFront:()=> 'Which state is this?', card:'shape',
    back:n=>({answer:n, sub:`Capital: <b>${esc(CAP[n])}</b> ★`}) },
  { id:'us-capitals', group:'United States', name:'State Capitals', blurb:'Name the capital of every state.', map:'us', count:50,
    answer:n=>CAP[n], nouns:'capitals', listWord:'capitals', alias:CAPITAL_ALIAS, maxZoom:10, showsItem:true,
    tapWhat:'Tap a state, find its capital', tapHint:'Tap a state on the map',
    ask:n=>`What is the capital of ${n}?`, flashFront:n=>`${n}: what is its capital?`, card:'shape',
    back:n=>({answer:CAP[n], sub:`Capital of <b>${esc(n)}</b> ★`}) },
  { id:'world', group:'World', name:'Continents & Oceans', blurb:'Find the 7 continents and 5 oceans.', map:'world', count:12,
    answer:n=>n, nouns:'places', listWord:'continents and oceans', alias:WORLD_ALIAS, maxZoom:5,
    tapWhat:'Tap a continent or ocean, find its name', tapHint:'Tap a continent or ocean',
    ask:()=> 'Which continent or ocean is this?', flashFront:()=> 'Which continent or ocean is this?', card:'locate',
    back:(n,item)=>({answer:n, sub:worldSize(n, item.kind)}) },
];
const TOPIC = Object.fromEntries(TOPICS.map(t=>[t.id,t]));
const MODES = {test:'Test', practice:'Practice', flash:'Flashcards'};
const AVATARS = ['🦊','🐼','🐸','🦁','🐧','🐢','🦉','🐙','🦄','🐝','🐬','🐨'];
const AV_BG = ['#f6d5c3','#dfe3e8','#d5ecd0','#f5e3b5','#d6e4f0','#d3eadf','#e6dccd','#f3d4dc','#e7d9f2','#f7eab4','#cfe6f2','#e2e2dc'];
const MAX_PLAYERS = 8;
const avatar = (p, big) => `<span class="av${big?' big':''}" style="background:${AV_BG[p.avatar%AV_BG.length]}" aria-hidden="true">${AVATARS[p.avatar%AVATARS.length]}</span>`;

/* ===================== 3. storage (IndexedDB, with an in-memory fallback) ===================== */
const DB = (() => {
  const KEY = {players:'id', games:'key', attempts:'id', items:'key'};
  let opening = null, mem = null, memId = 0;
  function open(){
    if(opening) return opening;
    opening = new Promise((res, rej) => {
      if(!('indexedDB' in window)) return rej(new Error('IndexedDB missing'));
      const r = indexedDB.open('world-geography-quiz', 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        d.createObjectStore('players', {keyPath:'id'});
        d.createObjectStore('games', {keyPath:'key'});
        d.createObjectStore('attempts', {keyPath:'id', autoIncrement:true}).createIndex('pt', ['pid','topic']);
        d.createObjectStore('items', {keyPath:'key'}).createIndex('pt', ['pid','topic']);
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
      r.onblocked = () => rej(new Error('blocked'));
    }).catch(() => { mem = {players:new Map(), games:new Map(), attempts:new Map(), items:new Map()}; return null; });
    return opening;
  }
  function req(d, st, mode, fn){
    return new Promise((res, rej) => {
      const t = d.transaction(st, mode); let out;
      const r = fn(t.objectStore(st)); if(r) r.onsuccess = () => { out = r.result; };
      t.oncomplete = () => res(out); t.onerror = t.onabort = () => rej(t.error);
    });
  }
  return {
    async ready(){ await open(); return !mem; },
    async get(st, k){ const d=await open(); return d ? req(d,st,'readonly',s=>s.get(k)) : mem[st].get(k); },
    async put(st, v){ const d=await open(); if(d) return req(d,st,'readwrite',s=>s.put(v)); if(st==='attempts' && v.id==null) v.id=++memId; mem[st].set(v[KEY[st]], structuredClone(v)); },
    async putMany(st, list){ const d=await open(); if(d) return req(d,st,'readwrite',s=>{ list.forEach(v=>s.put(v)); }); for(const v of list) await this.put(st, v); },
    async del(st, k){ const d=await open(); return d ? req(d,st,'readwrite',s=>s.delete(k)) : mem[st].delete(k); },
    async all(st){ const d=await open(); return d ? req(d,st,'readonly',s=>s.getAll()) : [...mem[st].values()]; },
    async byPT(st, pid, topic){ const d=await open(); return d ? req(d,st,'readonly',s=>s.index('pt').getAll([pid,topic])) : [...mem[st].values()].filter(v=>v.pid===pid && v.topic===topic); },
    async clear(st){ const d=await open(); return d ? req(d,st,'readwrite',s=>s.clear()) : mem[st].clear(); },
  };
})();
const gameKey = (pid, topic, mode) => `${pid}|${topic}|${mode}`;
async function recordItem(pid, topic, item, right){
  const key = `${pid}|${topic}|${item}`;
  const r = (await DB.get('items', key)) || {key, pid, topic, item, seen:0, right:0, wrong:0};
  r.seen++; right ? r.right++ : r.wrong++; r.last = right ? 'right' : 'wrong'; r.at = Date.now();
  await DB.put('items', r);
}

/* ===================== 4. navigation & overlays ===================== */
// Android's back button closes the top sheet or leaves the game, instead of closing the app.
const useHistory = (() => { try{ return window.self === window.top; }catch(e){ return false; } })();
const layers = []; let afterPop = null;
function pushLayer(close){ layers.push(close); if(useHistory) history.pushState({wgq:layers.length}, ''); }
function popLayer(then){
  if(!layers.length){ then && then(); return; }
  if(useHistory){ afterPop = then || null; history.back(); }
  else { layers.pop()(); then && then(); }
}
addEventListener('popstate', () => { const c = layers.pop(); if(c) c(); const f = afterPop; afterPop = null; f && f(); });

const overlays = [];
function openPanel({kind='sheet', title='', html='', label}){
  const scrim = document.createElement('div');
  scrim.className = 'scrim' + (kind==='center' ? ' center' : kind==='full' ? ' full' : '');
  scrim.innerHTML = `<div class="panel" role="dialog" aria-modal="true" tabindex="-1" aria-label="${esc(label||title)}">
    ${kind==='sheet' ? '<div class="grab" aria-hidden="true"></div>' : ''}
    ${kind!=='center' ? '<button class="x" aria-label="Close">×</button>' : ''}
    ${title ? `<h2>${esc(title)}</h2>` : ''}${html}</div>`;
  const panel = scrim.firstElementChild, back = document.activeElement;
  document.body.appendChild(scrim);
  overlays.push(scrim);
  scrim.addEventListener('click', e => { if(e.target === scrim || e.target.closest('.x')) popLayer(); });
  pushLayer(() => {
    scrim.remove(); overlays.splice(overlays.indexOf(scrim), 1);
    if(back && back.isConnected && back.focus) back.focus({preventScroll:true});
  });
  panel.focus({preventScroll:true});
  return panel;
}
document.addEventListener('keydown', e => {
  const top = overlays[overlays.length-1];
  if(!top) return;
  if(e.key === 'Escape'){ e.preventDefault(); popLayer(); }
  else if(e.key === 'Tab'){ // keep focus inside the open panel
    const f = [...top.querySelectorAll('button,input,[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled && x.offsetParent);
    if(!f.length) return;
    if(e.shiftKey && document.activeElement === f[0]){ e.preventDefault(); f[f.length-1].focus(); }
    else if(!e.shiftKey && document.activeElement === f[f.length-1]){ e.preventDefault(); f[0].focus(); }
  }
}, true);
function confirmDialog({title, text, ok='OK', danger=false}){
  return new Promise(resolve => {
    const p = openPanel({kind:'center', title, html:`<p>${text}</p><div class="rowbtns"><button id="dlgNo">Cancel</button><button id="dlgYes" class="${danger?'danger':'primary'}">${esc(ok)}</button></div>`});
    let done = false;
    p.querySelector('#dlgNo').onclick = () => popLayer(() => { done=true; resolve(false); });
    p.querySelector('#dlgYes').onclick = () => popLayer(() => { done=true; resolve(true); });
    const i = layers.length - 1, close = layers[i];
    layers[i] = () => { close(); if(!done) setTimeout(()=>{ if(!done){ done=true; resolve(false); } }); };
    p.querySelector('#dlgNo').focus();
  });
}
let toastEl = null, toastTimer = 0;
function toast(text, actions=[], ms=4000){
  if(toastEl) toastEl.remove(); clearTimeout(toastTimer);
  toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role','status');
  toastEl.innerHTML = `<span>${esc(text)}</span>` + actions.map((a,i)=>`<button data-i="${i}" class="${a.ghost?'ghost':''}">${esc(a.label)}</button>`).join('');
  toastEl.addEventListener('click', e => { const b=e.target.closest('button'); if(!b) return; const a=actions[+b.dataset.i]; hideToast(); a.run && a.run(); });
  document.body.appendChild(toastEl);
  if(ms) toastTimer = setTimeout(hideToast, ms);
}
function hideToast(){ if(toastEl){ toastEl.remove(); toastEl=null; } }

const SCREENS = ['scrPlayers','scrHome','scrPlay','scrScores'];
function showScreen(id){ SCREENS.forEach(s => $(s).hidden = s !== id); window.scrollTo(0,0); }

/* ===================== 5. sound & confetti ===================== */
let actx = null;
function sound(kind){
  if(!player || !player.prefs.sound) return;
  try{
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = {right:[[660,0],[880,.09]], wrong:[[240,0],[190,.13]], done:[[523,0],[659,.11],[784,.22],[1047,.33]], tap:[[740,0]]}[kind];
    const t0 = actx.currentTime;
    notes.forEach(([f,dt]) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0+dt); g.gain.exponentialRampToValueAtTime(0.16, t0+dt+0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0+dt+0.24);
      o.connect(g).connect(actx.destination); o.start(t0+dt); o.stop(t0+dt+0.26);
    });
  }catch(e){}
}
function confetti(){
  if(reduceMotion) return;
  const cv = document.createElement('canvas'); cv.className = 'confetti'; document.body.appendChild(cv);
  const dpr = Math.min(2, devicePixelRatio||1), W = innerWidth, H = innerHeight;
  cv.width = W*dpr; cv.height = H*dpr; const c = cv.getContext('2d'); c.scale(dpr,dpr);
  const cs = getComputedStyle(document.documentElement);
  const cols = ['--sel','--ok','--answered','--bad'].map(v=>cs.getPropertyValue(v).trim()).concat(['#f2c94c','#6fa8dc']);
  const bits = Array.from({length:140}, () => ({x:W/2+(Math.random()-.5)*W*.3, y:H*.35, vx:(Math.random()-.5)*14, vy:-Math.random()*14-4, r:Math.random()*6+4, a:Math.random()*6, va:(Math.random()-.5)*.3, c:cols[Math.floor(Math.random()*cols.length)]}));
  const t0 = performance.now();
  (function frame(t){
    const k = (t - t0)/1800; c.clearRect(0,0,W,H);
    bits.forEach(b => { b.vy += .35; b.vx *= .99; b.x += b.vx; b.y += b.vy; b.a += b.va;
      c.save(); c.globalAlpha = Math.max(0, 1-k); c.translate(b.x,b.y); c.rotate(b.a); c.fillStyle = b.c; c.fillRect(-b.r/2,-b.r/4,b.r,b.r/2); c.restore(); });
    if(k < 1) requestAnimationFrame(frame); else cv.remove();
  })(t0);
}

/* ===================== 6. players ===================== */
let players = [], player = null;
async function loadPlayers(){ players = (await DB.all('players')).sort((a,b)=>a.created-b.created); }
function renderPlayers(asLayer){
  $('playersBack').hidden = !asLayer;
  $('playersIntro').textContent = players.length ? 'Pick your name to keep your own scores. New here? Add yourself.' : 'Welcome! Add your name to start. Each player keeps their own scores.';
  $('playerGrid').innerHTML = players.map(p => `
    <div class="ptile" role="button" tabindex="0" data-id="${p.id}" aria-label="Play as ${esc(p.name)}">
      ${avatar(p, true)}<span class="pname">${esc(p.name)}</span>
      <button class="edit" data-edit="${p.id}" aria-label="Edit ${esc(p.name)}">✎</button>
    </div>`).join('') +
    (players.length < MAX_PLAYERS ? `<button class="ptile add" id="addPlayer"><span class="av big" style="background:var(--land)" aria-hidden="true">+</span>Add player</button>` : '');
}
function openPlayers(){
  renderPlayers(true); showScreen('scrPlayers');
  pushLayer(() => {
    if(player){ showScreen('scrHome'); renderHome(); }
    else { renderPlayers(false); showScreen('scrPlayers'); } // the current player was deleted
  });
}
$('playersBack').onclick = () => popLayer();
$('playerGrid').addEventListener('click', e => {
  const ed = e.target.closest('[data-edit]'); if(ed){ e.stopPropagation(); editPlayer(players.find(p=>p.id===ed.dataset.edit)); return; }
  if(e.target.closest('#addPlayer')){ editPlayer(null); return; }
  const t = e.target.closest('.ptile[data-id]'); if(t) choosePlayer(t.dataset.id);
});
$('playerGrid').addEventListener('keydown', e => { if((e.key==='Enter'||e.key===' ') && e.target.matches('.ptile[data-id]')){ e.preventDefault(); choosePlayer(e.target.dataset.id); } });
function choosePlayer(id){
  player = players.find(p=>p.id===id); LS.set('player', id);
  if(layers.length && !$('scrPlayers').hidden && !$('playersBack').hidden) popLayer(); // back to home
  else { showScreen('scrHome'); renderHome(); }
}
function editPlayer(p){
  const isNew = !p; let pick = p ? p.avatar : players.length % AVATARS.length;
  const panel = openPanel({title: isNew ? 'Add a player' : 'Edit player', html:`
    <form id="pForm" novalidate>
      <div class="field"><label for="pName">Name</label><input id="pName" maxlength="16" autocomplete="off" value="${esc(p ? p.name : '')}" placeholder="Your name"></div>
      <p class="fieldlabel" id="avLabel">Pick a picture</p>
      <div class="avgrid" role="group" aria-labelledby="avLabel">${AVATARS.map((a,i)=>`<button type="button" data-av="${i}" aria-pressed="${i===pick}" style="background:${AV_BG[i]}" aria-label="Picture ${i+1}">${a}</button>`).join('')}</div>
      <p class="feedback bad" id="pErr" aria-live="polite"></p>
      <div class="rowbtns">${isNew ? '' : '<button type="button" class="danger left" id="pDel">Delete player</button>'}<button type="submit" class="primary">${isNew ? 'Add player' : 'Save'}</button></div>
    </form>`});
  const name = panel.querySelector('#pName');
  panel.querySelector('.avgrid').addEventListener('click', e => { const b=e.target.closest('[data-av]'); if(!b) return; pick=+b.dataset.av; panel.querySelectorAll('[data-av]').forEach(x=>x.setAttribute('aria-pressed', String(+x.dataset.av===pick))); });
  panel.querySelector('#pForm').addEventListener('submit', async e => {
    e.preventDefault();
    const n = name.value.trim().replace(/\s+/g,' ');
    if(!n){ panel.querySelector('#pErr').textContent = 'Type a name first.'; name.focus(); return; }
    if(players.some(x => x.name.toLowerCase()===n.toLowerCase() && (!p || x.id!==p.id))){ panel.querySelector('#pErr').textContent = 'Someone already has that name. Try another one.'; name.focus(); return; }
    const rec = p ? {...p, name:n, avatar:pick} : {id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6), name:n, avatar:pick, created:Date.now(), prefs:{timer:false, sound:false}};
    await DB.put('players', rec);
    if(isNew){ await migrateOldSave(rec.id); try{ navigator.storage && navigator.storage.persist && navigator.storage.persist(); }catch(e){} }
    await loadPlayers();
    if(player && player.id===rec.id) player = rec;
    popLayer(() => {
      if(isNew){
        player = rec; LS.set('player', rec.id);
        const first = players.length === 1;
        if(!$('playersBack').hidden && layers.length) popLayer(() => { if(first) openHelp(); });
        else { showScreen('scrHome'); renderHome(); if(first) openHelp(); }
      } else renderPlayers(!$('playersBack').hidden);
    });
  });
  if(!isNew) panel.querySelector('#pDel').onclick = () => popLayer(async () => {
    const yes = await confirmDialog({title:`Delete ${p.name}?`, text:`This erases ${esc(p.name)}'s scores and saved games on this device. It can't be undone.`, ok:'Delete', danger:true});
    if(!yes) return;
    await DB.del('players', p.id);
    for(const st of ['games','attempts','items']) for(const r of await DB.all(st)) if(r.pid===p.id) await DB.del(st, st==='attempts' ? r.id : r.key);
    if(player && player.id===p.id){ player = null; LS.set('player',''); }
    await loadPlayers(); renderPlayers(!$('playersBack').hidden);
    toast(`${p.name} was deleted.`);
  });
  if(finePointer || isNew) name.focus();
}
// One-time: bring over a game saved by the older "Name the States" app on this site.
async function migrateOldSave(pid){
  if(LS.get('migrated')) return; LS.set('migrated','1');
  let old = null; try{ old = JSON.parse(localStorage.getItem('name-the-states-v1') || 'null'); }catch(e){}
  if(!old || !old.answers || !['test','practice'].includes(old.mode)) return;
  const topic = old.quiz === 'capitals' ? 'us-capitals' : 'us-states';
  if(!Object.keys(old.answers).length && !Object.keys(old.solved||{}).length) return;
  await DB.put('games', {key:gameKey(pid,topic,old.mode), pid, topic, mode:old.mode, round:old.round||1, answers:old.answers, solved:old.solved||{}, elapsed:0, reviewed:false, scored:false});
}

/* ===================== 7. home ===================== */
async function renderHome(){
  if(!player) return;
  $('homePlayer').innerHTML = `${avatar(player)}<span>${esc(player.name)}</span>`;
  $('hello').textContent = `Hi, ${player.name}! What do you want to learn today?`;
  const groups = [...new Set(TOPICS.map(t=>t.group))];
  const cards = await Promise.all(TOPICS.map(async t => {
    const [items, attempts, games] = await Promise.all([DB.byPT('items', player.id, t.id), DB.byPT('attempts', player.id, t.id), Promise.all(Object.keys(MODES).map(m => DB.get('games', gameKey(player.id, t.id, m))))]);
    const learned = items.filter(i => i.last==='right').length;
    const tests = attempts.filter(a => a.mode==='test');
    const best = tests.length ? Math.max(...tests.map(a=>a.correct)) : null;
    const times = attempts.filter(a => a.timeMs && a.correct===a.total).map(a=>a.timeMs);
    const bestTime = times.length ? Math.min(...times) : null;
    const resume = Object.keys(MODES).map((m,i) => !!games[i]);
    return {t, learned, best, bestTime, resume};
  }));
  $('homeGroups').innerHTML = groups.map(g => `
    <section class="group"><h2>${esc(g)}</h2><div class="cards">${cards.filter(c=>c.t.group===g).map(({t,learned,best,bestTime,resume}) => `
      <article class="tcard">
        <h3>${esc(t.name)}</h3>
        <p class="sub">${esc(t.blurb)}</p>
        <div class="meter" role="img" aria-label="${learned} of ${t.count} learned"><i style="width:${Math.round(100*learned/t.count)}%"></i></div>
        <p class="stats"><span><b>${learned}</b> of ${t.count} learned</span>${best!=null ? `<span>Best test: <b>${best}/${t.count}</b></span>` : ''}${bestTime ? `<span>Best time: <b>${fmtTime(bestTime)}</b></span>` : ''}</p>
        <div class="modebtns">${Object.entries(MODES).map(([m,label],i) => `<button data-topic="${t.id}" data-mode="${m}">${label}${resume[i] ? '<span class="resume">Keep going</span>' : ''}</button>`).join('')}</div>
      </article>`).join('')}</div>
      ${g==='World' ? '<p class="soon" style="margin-top:10px">Coming soon: countries and capitals of Europe.</p>' : ''}
    </section>`).join('');
}
$('homeGroups').addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if(b) enterGame(b.dataset.topic, b.dataset.mode); });
$('homePlayer').onclick = openPlayers;
$('homeHelp').onclick = () => openHelp();
$('homeSettings').onclick = () => openSettings();

/* ===================== 8. map, zoom & search ===================== */
const MAPS = {};
const loadMap = name => MAPS[name] || (MAPS[name] = fetch(name + '.json').then(r => { if(!r.ok) throw new Error('map ' + r.status); return r.json(); }).catch(e => { delete MAPS[name]; throw e; }));

const svg = $('map'), inp = $('answer'), opts = $('opts'), submitBtn = $('submit');
let T = null, M = null;              // current topic, current map data
let ITEM = {}, NAMES = [], ORDER = [], els = {};
let VW = 975, VH = 610, MINW = 97, vb = {x:0,y:0,w:975,h:610}, anim = 0;

function drawMap(){
  VW = M.w; VH = M.h; MINW = VW / (T.maxZoom || 10);
  ITEM = Object.fromEntries(M.items.map(i => [i.n, i]));
  NAMES = M.items.map(i => i.n).sort();
  ORDER = M.items.slice().sort((a,b) => a.c[0]-b.c[0]).map(i => i.n);
  const path = i => `<path class="st ${i.kind==='ocean'?'ocean':'land'}" d="${i.d}" data-n="${esc(i.n)}" tabindex="0" role="button"/>`;
  svg.innerHTML = (M.sphere ? `<path class="globe" d="${M.sphere}"/>` : '') +
    M.items.filter(i=>i.kind==='ocean').map(path).join('') +
    (M.other ? `<path class="other" d="${M.other}"/>` : '') +
    M.items.filter(i=>i.kind!=='ocean').map(path).join('');
  els = {}; svg.querySelectorAll('path.st').forEach(p => els[p.dataset.n] = p);
  setVB({x:0, y:0, w:VW});
}
svg.addEventListener('keydown', e => { const p = e.target.closest('path.st'); if(p && (e.key==='Enter'||e.key===' ')){ e.preventDefault(); select(p.dataset.n); } });

const clampW = w => Math.min(VW, Math.max(MINW, w));
function setVB(v){
  const w = clampW(v.w), h = w*VH/VW;
  const x = Math.min(VW-w, Math.max(0, v.x)), y = Math.min(VH-h, Math.max(0, v.y));
  vb = {x,y,w,h}; svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
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
  if(tap){ const el = document.elementFromPoint(e.clientX, e.clientY); const p = el && el.closest && el.closest('path.st'); if(p) select(p.dataset.n); }
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
const norm = s => s.toLowerCase().replace(/[.,'&\-/]/g,' ').replace(/\s+/g,' ').trim();
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
    return `<li role="option" id="o${i}" data-v="${esc(v)}" aria-selected="${i===active}">${label}${tag}</li>`;
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
inp.addEventListener('focus', () => { if(!inp.disabled) search(); });
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

/* ===================== 9. game: test, practice, review ===================== */
let G = null, current = null, reviewing = false;
let saveTimer = 0;
const isSolved = n => !!G && (n in G.solved);
const isOpen = n => !isSolved(n) && !(G.mode==='practice' && G.answers[n]);
const remaining = () => PN().filter(n => !isSolved(n)).length;
// "Practice these" games use only a few items; everything else on the map is greyed out
const inPlay = n => !G || !G.only || G.only.includes(n);
const PN = () => (G && G.only) ? NAMES.filter(inPlay) : NAMES;
const timerOn = () => !!(player && player.prefs.timer && G && G.mode!=='flash');
function saveSoon(){ clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 300); }
function saveNow(){ clearTimeout(saveTimer); if(G && G.mode!=='flash' && G.active && !G.only) DB.put('games', {...G}); }
const legend = items => $('legend').innerHTML = items.map(([c,t]) => `<span><i style="background:var(${c})"></i>${t}</span>`).join('');
function feedback(html, cls){ const f = $('feedback'); f.innerHTML = html || ''; f.className = 'feedback' + (cls ? ' '+cls : ''); }

async function enterGame(topicId, mode, fromPicker, only){
  saveNow(); stopClock();
  T = TOPIC[topicId];
  $('chipText').innerHTML = `${esc(T.name)}<small>${only ? 'Practice the tricky ones' : MODES[mode]}</small>`;
  if(!fromPicker){ showScreen('scrPlay'); pushLayer(leaveGame); }
  ['mapSheet','play','results','flash'].forEach(id => $(id).hidden = true);
  $('sub').textContent = 'Loading the map…'; $('tally').textContent = '';
  try{ M = await loadMap(T.map); }
  catch(e){ $('sub').textContent = 'The map could not load. Check your internet connection, then go back and try again.'; return; }
  drawMap();
  const saved = mode!=='flash' && !only ? await DB.get('games', gameKey(player.id, T.id, mode)) : null;
  G = saved || newGameState(mode);
  if(only){ G.only = only; G.key = gameKey(player.id, T.id, 'tricky'); }
  current = null; reviewing = false;
  if(mode === 'flash'){ $('flash').hidden = false; subText(); paint(); flashNew(); return; }
  $('mapSheet').hidden = false;
  if(G.reviewed) showReview(true); else toPlay();
  startClock();
}
function newGameState(mode){ return {key:gameKey(player.id, T.id, mode), pid:player.id, topic:T.id, mode, round:1, answers:{}, solved:{}, elapsed:0, reviewed:false, scored:false, active:false}; }
function leaveGame(){ saveNow(); stopClock(); hideToast(); G = null; showScreen('scrHome'); renderHome(); }
$('backHome').onclick = () => popLayer();

function subText(){
  if(G.mode === 'flash'){
    $('sub').textContent = T.card==='shape' ? 'Learn one at a time. The star shows where the capital is. Tap the card to see the answer.' : 'Learn one at a time. Tap the card to see the answer.';
    return;
  }
  $('sub').textContent = G.mode==='test'
    ? `${T.tapWhat}, and press Save. Press Review when you're done.`
    : `${T.tapWhat}, and press Check. You'll find out right away if you're right.`;
}
function paint(){
  NAMES.forEach(n => {
    let cls = 'st ' + (ITEM[n].kind==='ocean' ? 'ocean' : 'land');
    if(G.mode !== 'flash'){
      if(isSolved(n)) cls += ' ok';
      else if(reviewing || (G.mode==='practice' && G.answers[n])) cls += ' bad';
      else if(G.answers[n]) cls += ' done';
    }
    if(n === current) cls += ' sel';
    if(!inPlay(n)) cls += ' off';
    const el = els[n]; el.setAttribute('class', cls);
    el.setAttribute('aria-label', isSolved(n) || reviewing || T.showsItem ? `${n}${isSolved(n)?', correct':reviewing?', missed':''}` : G.answers[n] ? `Answered ${G.answers[n]}` : 'Not answered yet');
  });
  const named = Object.keys(G.answers).length, total = PN().filter(n => !(G.solved[n] < G.round)).length;
  $('tally').innerHTML = G.mode==='flash' || reviewing ? '' : (G.round===1 ? `<b>${named}</b> / ${total} answered` : `Round ${G.round} · <b>${named}</b> / ${total} answered`);
  const label = !current ? T.tapHint
    : T.showsItem ? (isSolved(current) ? `Capital of ${current}: ${key(current)}` : T.ask(current))
    : isSolved(current) ? 'You already got this one'
    : (G.mode==='practice' && G.answers[current]) ? 'Already answered'
    : G.answers[current] ? 'Change your answer?' : T.ask(current);
  $('selLabel').textContent = label;
}
function playLegend(){
  const items = [['--land','Not answered']];
  if(G.mode==='test') items.push(['--answered','Answered']);
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
  openList(false); syncSubmit();
}
function toPlay(){
  reviewing = false; current = null;
  $('play').hidden = false; $('results').hidden = true;
  feedback(G.round>1 ? `Round ${G.round}: your right answers stay green. ${remaining()} left to go!` : '');
  subText(); playLegend(); setInput(); paint();
}
function select(n){
  if(!G || G.mode==='flash' || !inPlay(n)) return;
  current = n; focusItem(n);
  if(reviewing){
    const a = G.answers[n], right = T.showsItem ? `The capital of <b>${esc(n)}</b> is <b>${esc(key(n))}</b>.` : `This is <b>${esc(n)}</b>.`;
    $('callout').innerHTML = isSolved(n) && G.solved[n] < G.round ? `${right} You got it in round ${G.solved[n]}.`
      : isSolved(n) ? `${right} You got it right!` : `${right} ${a ? `You said ${esc(a)}.` : `You left it blank.`}`;
    paint(); return;
  }
  if(ITEM[n].kind !== 'ocean') svg.appendChild(els[n]); // bring to front so its outline shows
  if(isSolved(n)) feedback(T.showsItem ? `<b>${esc(key(n))}</b>. You already got this one.` : `That's <b>${esc(n)}</b>. You already got this one.`, 'ok');
  else if(G.mode==='practice' && G.answers[n]) feedback(`You said ${esc(G.answers[n])}. ${T.showsItem ? `The capital is <b>${esc(key(n))}</b>` : `This is <b>${esc(n)}</b>`}.`, 'bad');
  else feedback('');
  setInput(); paint();
  if(!inp.disabled && finePointer) inp.focus({preventScroll:true});
}
async function submit(){
  const v = exact();
  if(!current || !isOpen(current) || !v) return;
  G.active = true;
  if(G.mode === 'practice'){
    G.answers[current] = v;
    const right = v === key(current);
    if(right){ G.solved[current] = G.round; feedback(`Yes! ${T.showsItem ? `The capital of ${esc(current)} is` : `That's`} <b>${esc(v)}</b>.`, 'ok'); sound('right'); }
    else { feedback(`Not quite. ${T.showsItem ? `The capital of ${esc(current)} is` : `That's`} <b>${esc(key(current))}</b>, not ${esc(v)}.`, 'bad'); sound('wrong'); }
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
$('next').onclick = () => step(1);
$('prev').onclick = () => step(-1);

async function review(){
  G.active = true;
  if(G.mode === 'test'){
    for(const n of PN()){
      if(isSolved(n)) continue;
      const right = G.answers[n] === key(n);
      if(right) G.solved[n] = G.round;
      recordItem(player.id, T.id, n, right);
    }
  }
  G.reviewed = true;
  let newBest = false, time = timerOn() ? G.elapsed : null;
  const correct = PN().filter(isSolved).length;
  if(G.round === 1 && !G.scored && !G.only){ // tricky-ones practice doesn't count toward best scores
    G.scored = true;
    const before = (await DB.byPT('attempts', player.id, T.id)).filter(a => a.timeMs && a.correct===a.total).map(a=>a.timeMs);
    if(time && correct === PN().length && (!before.length || time < Math.min(...before))) newBest = true;
    await DB.put('attempts', {pid:player.id, topic:T.id, mode:G.mode, at:Date.now(), correct, total:PN().length, timeMs:time});
  }
  const finished = correct === PN().length;
  if(finished) await DB.del('games', G.key); else saveNow();
  showReview(false, {newBest, time});
  if(finished){ confetti(); sound('done'); }
}
function showReview(restoring, extra={}){
  reviewing = true; current = null; openList(false); stopClock();
  const missed = PN().filter(n => !isSolved(n)), good = PN().filter(isSolved);
  const thisRound = good.filter(n => G.solved[n] === G.round).length, pool = thisRound + missed.length;
  const timeTxt = extra.time ? ` Time: <b>${fmtTime(extra.time)}</b>.` : '';
  $('score').innerHTML = missed.length === 0
    ? (G.round===1 ? `<b>${PN().length} out of ${PN().length}!</b> A perfect score!${timeTxt}${extra.newBest ? ' <b>New best time!</b>' : ''}` : `<b>You got all ${PN().length}!</b> It took ${G.round} rounds.`)
    : G.round===1 ? `You got <b>${good.length}</b> out of ${PN().length}.${timeTxt}`
    : `Round ${G.round}: <b>${thisRound}</b> of ${pool} right · ${good.length} of ${PN().length} in all`;
  $('badH').textContent = `Missed (${missed.length})`;
  $('goodH').textContent = `Right (${good.length})`;
  const meta = n => [T.showsItem ? n : '', G.round>1 && isSolved(n) ? `round ${G.solved[n]}` : ''].filter(Boolean).join(' · ');
  $('badList').innerHTML = missed.length ? missed.map(n => `<li data-n="${esc(n)}"><span class="you">${G.answers[n] ? esc(G.answers[n]) : 'blank'}</span> <span aria-hidden="true">→</span> <span class="right">${esc(key(n))}</span>${meta(n) ? `<span class="rnd">${esc(meta(n))}</span>` : ''}</li>`).join('') : '<li class="empty">None. Great job!</li>';
  $('goodList').innerHTML = good.length ? good.map(n => `<li data-n="${esc(n)}"><span class="right">${esc(key(n))}</span>${meta(n) ? `<span class="rnd">${esc(meta(n))}</span>` : ''}</li>`).join('') : '<li class="empty">None yet. Keep trying!</li>';
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
  if(left && !(await confirmDialog({title:'Finish now?', text:`You still have ${left} to answer. Blank ones count as missed.`, ok:'Review'}))) return;
  review();
};
$('retry').onclick = () => { G.round++; G.answers = {}; G.reviewed = false; saveNow(); toPlay(); startClock(); };
$('restart').onclick = async () => {
  if(PN().some(n => !isSolved(n)) && !(await confirmDialog({title:'Start a new game?', text:'Your answers in this game will be cleared.', ok:'New game'}))) return;
  await DB.del('games', G.key); G = {...newGameState(G.mode), only:G.only, key:G.key}; toPlay(); startClock();
};

// ---- stopwatch (when turned on in Settings) ----
let clockInt = 0, lastTick = 0;
function startClock(){
  stopClock();
  $('clock').hidden = !timerOn();
  if(!timerOn() || reviewing) return;
  lastTick = performance.now(); $('clock').textContent = fmtTime(G.elapsed);
  clockInt = setInterval(() => {
    const now = performance.now();
    if(!document.hidden && !overlays.length && G){ G.elapsed += now - lastTick; $('clock').textContent = fmtTime(G.elapsed); }
    lastTick = now;
  }, 500);
}
function stopClock(){ clearInterval(clockInt); clockInt = 0; }
document.addEventListener('visibilitychange', () => { if(document.hidden) saveNow(); else lastTick = performance.now(); });

/* ===================== 10. flashcards ===================== */
const card = $('card'), cardin = card.querySelector('.cardin');
let deck = [], fi = 0, flipped = false, again = [], firstKnew = 0, fround = 1, deckSize = 0;
const starPts = (cx,cy,r) => Array.from({length:10}, (_,i) => { const a = -Math.PI/2 + i*Math.PI/5, q = i%2 ? r*0.45 : r; return (cx+q*Math.cos(a)).toFixed(2)+','+(cy+q*Math.sin(a)).toFixed(2); }).join(' ');
function drawCardArt(el, n){
  const it = ITEM[n];
  if(T.card === 'shape'){ // the shape on its own, with a star on the capital
    const [x0,y0,x1,y1] = it.b, w = x1-x0, h = y1-y0, pad = Math.max(w,h)*0.1, r = Math.max(w,h)*0.055;
    el.setAttribute('viewBox', `${x0-pad} ${y0-pad} ${w+2*pad} ${h+2*pad}`);
    el.innerHTML = `<path class="item" d="${it.d}"/>` + (it.k ? `<polygon class="star" points="${starPts(it.k[0], it.k[1], r)}"/>` : '');
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
  $('fReveal').hidden = on; $('fMiss').hidden = !on; $('fGot').hidden = !on;
}
function flashNew(){ deck = shuffle(NAMES.slice()); fi = 0; again = []; firstKnew = 0; fround = 1; deckSize = deck.length; showCard(); }
function showCard(){
  const done = fi >= deck.length;
  $('fdeck').hidden = done; $('fDone').hidden = !done; $('fBar').hidden = done;
  if(done) return showDone();
  const n = deck[fi];
  setFlip(false, true);
  $('fAnswer').textContent = ''; $('fSub').innerHTML = ''; // filled in only when flipped, so there's no peeking
  drawCardArt($('fFront'), n); drawCardArt($('fBack'), n);
  $('fPrompt').textContent = T.flashFront(n);
  $('fProg').innerHTML = `Card <b>${fi+1}</b> of ${deck.length}` + (fround>1 ? ` · round ${fround}` : '') + (again.length ? ` · ${again.length} to study again` : '');
}
function reveal(){
  if(fi >= deck.length) return;
  const n = deck[fi];
  if(!flipped){
    const b = T.back(n, ITEM[n]);
    $('fAnswer').textContent = b.answer; $('fSub').innerHTML = b.sub;
    const loc = $('fLoc'); loc.toggleAttribute('hidden', T.card !== 'shape'); // svg elements have no .hidden property
    if(T.card === 'shape'){
      loc.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
      loc.innerHTML = M.items.map(i => `<path class="${i.n===n?'hi':''}" d="${i.d}"/>`).join('');
    }
  }
  setFlip(!flipped);
}
function grade(knew){
  if(!flipped || fi >= deck.length) return;
  if(knew){ if(fround===1) firstKnew++; } else again.push(deck[fi]);
  recordItem(player.id, T.id, deck[fi], knew);
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
    $('fDoneP').textContent = first ? 'Every card, first try. Amazing!' : `You finished in ${fround} rounds.`;
    $('fAgainDeck').hidden = true; confetti(); sound('done');
  }
  $('fRestart2').focus({preventScroll:true});
}
card.addEventListener('click', reveal);
card.addEventListener('keydown', e => { if(e.key==='Enter' || e.key===' '){ e.preventDefault(); e.stopPropagation(); reveal(); } });
$('fReveal').onclick = reveal;
$('fGot').onclick = () => grade(true);
$('fMiss').onclick = () => grade(false);
$('fRestart').onclick = flashNew;
$('fRestart2').onclick = flashNew;
$('fAgainDeck').onclick = () => { deck = shuffle(again); again = []; fi = 0; fround++; showCard(); };
document.addEventListener('keydown', e => {
  if(!G || G.mode!=='flash' || $('scrPlay').hidden || overlays.length || e.target.closest('input,button,[contenteditable]')) return;
  if(e.key===' ' || e.key==='Enter'){ e.preventDefault(); reveal(); }
  else if(e.key==='ArrowRight') grade(true);
  else if(e.key==='ArrowLeft') grade(false);
});

// topic & mode picker (bottom sheet)
$('topicChip').onclick = () => {
  const groups = [...new Set(TOPICS.map(t=>t.group))];
  const panel = openPanel({title:'What do you want to play?', html: groups.map(g => `
    <div class="pickgroup"><p class="sect">${esc(g)}</p>${TOPICS.filter(t=>t.group===g).map(t => `
      <div class="pickrow"><span class="nm">${esc(t.name)}</span><div class="modebtns">${Object.entries(MODES).map(([m,l]) => `<button data-topic="${t.id}" data-mode="${m}" aria-current="${T.id===t.id && G && G.mode===m}">${l}</button>`).join('')}</div></div>`).join('')}</div>`).join('')});
  panel.addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if(b) popLayer(() => enterGame(b.dataset.topic, b.dataset.mode, true)); });
};

/* ===================== 10b. scores ===================== */
let scoresTab = 'me';
const dateFmt = t => new Date(t).toLocaleDateString(undefined, {month:'short', day:'numeric'});
async function topicStats(pid, t){
  const [items, attempts] = await Promise.all([DB.byPT('items', pid, t.id), DB.byPT('attempts', pid, t.id)]);
  attempts.sort((a,b) => a.at - b.at);
  const tests = attempts.filter(a => a.mode==='test');
  const times = attempts.filter(a => a.timeMs && a.correct===a.total).map(a => a.timeMs);
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
    const parts = await Promise.all(TOPICS.map(async t => ({t, ...(await topicStats(player.id, t))})));
    body.innerHTML = `<div class="cards">${parts.map(({t, items, attempts, learned, best, bestTime}) => {
      const last = attempts.slice(-10), pct = a => Math.round(100*a.correct/a.total);
      const chart = last.length
        ? `<div class="bars" role="img" aria-label="Your last ${last.length} scores: ${last.map(a => pct(a)+'%').join(', ')}">${last.map(a => `<i class="${a.mode==='practice'?'p':''}" style="height:${Math.max(4, pct(a))}%" title="${esc(dateFmt(a.at))} · ${MODES[a.mode]} · ${a.correct}/${a.total}"></i>`).join('')}</div>
           <p class="cap"><span>Your last ${last.length} game${last.length>1?'s':''}. Taller is better.</span><span><i class="k"></i>Test</span><span><i class="k p"></i>Practice</span></p>
           <h4>Recent games</h4><ul class="recent">${attempts.slice(-5).reverse().map(a => `<li><span>${esc(dateFmt(a.at))}</span><span>${MODES[a.mode]}</span><b>${a.correct}/${a.total}</b><span>${a.timeMs ? fmtTime(a.timeMs) : ''}</span></li>`).join('')}</ul>`
        : `<p class="muted">No games yet. Finish a Test or Practice game to see your scores here.</p>`;
      const tricky = items.filter(i => i.wrong > 0 && (i.last==='wrong' || i.wrong >= i.right))
        .sort((a,b) => (b.wrong-b.right) - (a.wrong-a.right) || b.wrong - a.wrong).slice(0, 6);
      const name = i => t.showsItem ? `${t.answer(i.item)}, ${i.item}` : i.item;
      const practice = tricky.length
        ? `<h4>Needs practice</h4><div class="chips">${tricky.map(i => `<span class="chip">${esc(name(i))} <small>missed ${i.wrong}×</small></span>`).join('')}</div>
           <div><button class="primary" data-practice="${t.id}" data-items="${esc(JSON.stringify(tricky.map(i => i.item)))}">Practice these ${tricky.length}</button></div>`
        : items.length ? `<h4>Needs practice</h4><p class="muted">Nothing tricky right now. Great work!</p>` : '';
      return `<article class="tcard"><h3>${esc(t.name)}</h3>
        <p class="stats"><span><b>${learned}</b> of ${t.count} learned</span>${best!=null ? `<span>Best test: <b>${best}/${t.count}</b></span>` : ''}${bestTime ? `<span>Best time: <b>${fmtTime(bestTime)}</b></span>` : ''}<span>Games: <b>${attempts.length}</b></span></p>
        ${chart}${practice}</article>`;
    }).join('')}</div>`;
  } else {
    const rows = await Promise.all(players.map(async p => ({p, s: await Promise.all(TOPICS.map(t => topicStats(p.id, t)))})));
    body.innerHTML = `<div class="cards">${TOPICS.map((t, ti) => `<article class="tcard"><h3>${esc(t.name)}</h3>
      <div class="tablewrap"><table class="board"><thead><tr><th scope="col">Player</th><th scope="col">Learned</th><th scope="col">Best test</th><th scope="col">Best time</th></tr></thead><tbody>
      ${rows.slice().sort((a,b) => b.s[ti].learned - a.s[ti].learned || (b.s[ti].best||0) - (a.s[ti].best||0)).map(({p, s}) => `<tr class="${p.id===player.id?'me':''}">
        <th scope="row"><span class="who">${avatar(p)}${esc(p.name)}</span></th>
        <td>${s[ti].learned}/${t.count}</td><td>${s[ti].best!=null ? `${s[ti].best}/${t.count}` : '–'}</td><td>${s[ti].bestTime ? fmtTime(s[ti].bestTime) : '–'}</td></tr>`).join('')}
      </tbody></table></div></article>`).join('')}</div>
      ${players.length < 2 ? '<p class="muted" style="margin-top:12px">Add more players to compare scores.</p>' : ''}`;
  }
}
$('scoresBody').addEventListener('click', e => {
  const b = e.target.closest('[data-practice]'); if(!b) return;
  const topic = b.dataset.practice, items = JSON.parse(b.dataset.items);
  popLayer(() => enterGame(topic, 'practice', false, items));
});

/* ===================== 11. settings, help, backup ===================== */
function openSettings(){
  const p = player.prefs;
  const panel = openPanel({title:'Settings', html:`
    <div class="toggle"><div class="txt">Stopwatch<small>Time each Test and Practice game, and try to beat your best time.</small></div><button class="switch" role="switch" id="swTimer" aria-checked="${!!p.timer}" aria-label="Stopwatch"></button></div>
    <div class="toggle"><div class="txt">Sounds<small>Play a sound for right and wrong answers.</small></div><button class="switch" role="switch" id="swSound" aria-checked="${!!p.sound}" aria-label="Sounds"></button></div>
    <p class="muted" style="margin-top:8px;font-size:.9rem">These settings are just for ${esc(player.name)}.</p>
    <p class="sect">Backup</p>
    <p class="muted" style="font-size:.95rem;margin-bottom:10px">Scores are saved only on this device. Save a backup file to keep them safe, or to move them to a new device.</p>
    <div class="rowbtns" style="justify-content:flex-start"><button id="doExport">Save a backup</button><button id="doImport">Load a backup</button></div>
    <p class="muted" style="margin-top:18px;font-size:.85rem">World Geography Quiz · version ${esc(BUILD.slice(0,16).replace('T',' '))}</p>`});
  const flip = async (id, k) => { player.prefs[k] = !player.prefs[k]; panel.querySelector('#'+id).setAttribute('aria-checked', String(player.prefs[k])); await DB.put('players', player); if(k==='sound') sound('right'); };
  panel.querySelector('#swTimer').onclick = () => flip('swTimer','timer');
  panel.querySelector('#swSound').onclick = () => flip('swSound','sound');
  panel.querySelector('#doExport').onclick = exportData;
  panel.querySelector('#doImport').onclick = () => $('importFile').click();
}
async function exportData(){
  const data = {app:'world-geography-quiz', version:1, saved:new Date().toISOString()};
  for(const st of ['players','games','attempts','items']) data[st] = await DB.all(st);
  const blob = new Blob([JSON.stringify(data)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `geography-quiz-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('Backup saved to your downloads.');
}
$('importFile').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if(!f) return;
  let data; try{ data = JSON.parse(await f.text()); }catch(err){ data = null; }
  if(!data || data.app !== 'world-geography-quiz' || !Array.isArray(data.players)){ toast('That file is not a World Geography Quiz backup.'); return; }
  popLayer(async () => {
    const ok = await confirmDialog({title:'Load this backup?', text:`It has ${data.players.length} player${data.players.length===1?'':'s'}. Everything saved on this device now will be replaced.`, ok:'Load backup', danger:true});
    if(!ok) return;
    for(const st of ['players','games','attempts','items']){ await DB.clear(st); if(Array.isArray(data[st])) await DB.putMany(st, data[st]); }
    await loadPlayers();
    player = players.find(p => p.id === LS.get('player')) || players[0] || null;
    if(player){ LS.set('player', player.id); renderHome(); toast('Backup loaded.'); } else { renderPlayers(false); showScreen('scrPlayers'); }
  });
});
function openHelp(){
  openPanel({kind:'full', title:'How to play', html:`
    <ol class="steps">
      <li><h3>Pick a game</h3><p>On the home screen, pick <b>US States</b>, <b>State Capitals</b>, or <b>Continents &amp; Oceans</b>.</p></li>
      <li><h3>Pick how to play</h3><p><b>Flashcards:</b> learn them one at a time.<br><b>Practice:</b> find out right away if you are right.<br><b>Test:</b> answer them all, then press <b>Review</b> to see your score.</p></li>
      <li><h3>Tap the map</h3><p>Tap a place. It turns orange. Then start typing its name in the box. Pick the name from the list and press <b>Save</b> or <b>Check</b>. Don't worry about spelling. The list helps you.</p></li>
      <li><h3>Zoom in</h3><p>Small places are hard to tap. Pinch the map, or press <b>+</b>. Drag to move around. Press <b>⤢</b> to see the whole map again. <b>Next</b> takes you to one you haven't answered.</p></li>
      <li><h3>Check your score</h3><p>After <b>Review</b>, green means right and red means missed. Press <b>Try the missed</b> to try again. Your right answers stay green.</p></li>
      <li><h3>Flashcards</h3><p>Tap the card to flip it. Press <b>Got it</b> if you knew it. Press <b>Study again</b> if you didn't, and it will come back at the end.</p></li>
      <li><h3>Your scores</h3><p>Each player has their own scores. Tap <b>★ Scores</b> on the home screen to see your games, the ones that need practice, and everyone's scores. Tap your name to switch players. The <b>⚙</b> button turns on the stopwatch and sounds.</p></li>
    </ol>
    <p class="note">Your games are saved, so you can stop and keep going later.</p>
    <button class="primary" id="helpOk">Let's play!</button>`});
  document.getElementById('helpOk').onclick = () => popLayer();
  LS.set('help-seen','1');
}
$('playHelp').onclick = () => openHelp();

/* ===================== 12. updates & start-up ===================== */
// Installed app only: offline support, and a check for a newer index.html (at most once an hour).
const CORE = ['./','index.html','app.js','app.css'];
let latest = null;
async function checkForUpdate(force){
  if(!navigator.onLine) return;
  const last = +LS.get('update-check') || 0;
  if(!force && Date.now() - last < 3600e3) return;
  LS.set('update-check', String(Date.now()));
  try{
    const res = await fetch('index.html?check=' + Date.now(), {cache:'no-store'});
    if(!res.ok) return;
    const html = await res.text(), m = html.match(/WGQ_BUILD='([^']+)'/);
    if(m && m[1] !== BUILD){ latest = m[1]; toast('A new version is ready.', [{label:'Update', run:applyUpdate}, {label:'Not now', ghost:true}], 0); }
  }catch(e){}
}
async function applyUpdate(){
  saveNow(); toast('Updating…', [], 0);
  try{
    if('caches' in window){
      const cache = await caches.open('wgq-v1');
      await Promise.all(CORE.map(async u => { const r = await fetch(u + (u.includes('?')?'&':'?') + 'check=' + Date.now(), {cache:'no-store'}); if(r.ok) await cache.put(u, r); }));
      for(const k of ['us.json','world.json']){ const r = await fetch(k + '?check=' + Date.now(), {cache:'no-store'}); if(r.ok) await cache.put(k, r); }
    }
    const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); reg && await reg.update();
  }catch(e){}
  location.reload();
}
async function start(){
  const persistent = await DB.ready();
  await loadPlayers();
  player = players.find(p => p.id === LS.get('player')) || null;
  if(player){ showScreen('scrHome'); renderHome(); }
  else { renderPlayers(false); showScreen('scrPlayers'); }
  if(!persistent) toast("Scores can't be saved in this browser mode.", [], 6000);
  if(useHistory && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')){
    navigator.serviceWorker.register('sw.js').catch(() => {});
    checkForUpdate(true);
    document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible') checkForUpdate(false); });
  }
}
start();
})();
