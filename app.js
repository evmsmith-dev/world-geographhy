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
const EU_ALIAS = {'United Kingdom':['uk','u k','great britain','britain'],'Czechia':['czech republic'],'North Macedonia':['macedonia'],
  'Netherlands':['holland','the netherlands'],'Vatican City':['vatican','holy see'],'Bosnia and Herzegovina':['bosnia'],'Russia':['russian federation']};
const EU_CAP_ALIAS = {'Kyiv':['kiev'],'Luxembourg City':['luxembourg'],'Vatican City':['vatican'],'Andorra la Vella':['andorra']};
const SA_CAP_ALIAS = {'Sucre':['la paz']};
const AF_ALIAS = {"Côte d'Ivoire":['ivory coast'],'Eswatini':['swaziland'],'Cape Verde':['cabo verde'],'DR Congo':['democratic republic of the congo','drc','congo kinshasa'],
  'Republic of the Congo':['congo brazzaville'],'São Tomé and Príncipe':['sao tome'],'Gambia':['the gambia'],'Central African Republic':['car']};
const AF_CAP_ALIAS = {'Pretoria':['cape town','bloemfontein']};
// the five African Union regions, for shorter games
const AF_PARTS = {
  North:['Algeria','Egypt','Libya','Mauritania','Morocco','Tunisia'],
  West:['Benin','Burkina Faso','Cape Verde',"Côte d'Ivoire",'Gambia','Ghana','Guinea','Guinea-Bissau','Liberia','Mali','Niger','Nigeria','Senegal','Sierra Leone','Togo'],
  Central:['Burundi','Cameroon','Central African Republic','Chad','Republic of the Congo','DR Congo','Equatorial Guinea','Gabon','São Tomé and Príncipe'],
  East:['Comoros','Djibouti','Eritrea','Ethiopia','Kenya','Madagascar','Mauritius','Rwanda','Seychelles','Somalia','South Sudan','Sudan','Tanzania','Uganda'],
  Southern:['Angola','Botswana','Eswatini','Lesotho','Malawi','Mozambique','Namibia','South Africa','Zambia','Zimbabwe'],
};
const AS_ALIAS = {'Turkey':['turkiye'],'Myanmar':['burma'],'Timor-Leste':['east timor'],'United Arab Emirates':['uae','u a e','emirates'],
  'North Korea':['dprk'],'South Korea':['korea'],'Laos':['lao'],'Kyrgyzstan':['kyrgyz republic'],'Saudi Arabia':['saudi'],'Iran':['persia']};
const AS_CAP_ALIAS = {'Sri Jayawardenepura Kotte':['kotte','colombo'],'Astana':['nur sultan'],"Sana'a":['sanaa','sana'],'Naypyidaw':['naypyitaw','nay pyi taw'],
  'Ulaanbaatar':['ulan bator'],'Kuwait City':['kuwait'],'Bandar Seri Begawan':['bandar seri begawan']};
// five parts of Asia, for shorter games
const AS_PARTS = {
  'Middle East':['Armenia','Azerbaijan','Bahrain','Cyprus','Georgia','Iran','Iraq','Israel','Jordan','Kuwait','Lebanon','Oman','Qatar','Saudi Arabia','Syria','Turkey','United Arab Emirates','Yemen'],
  Central:['Afghanistan','Kazakhstan','Kyrgyzstan','Tajikistan','Turkmenistan','Uzbekistan'],
  South:['Bangladesh','Bhutan','India','Maldives','Nepal','Pakistan','Sri Lanka'],
  East:['China','Japan','Mongolia','North Korea','South Korea','Taiwan'],
  Southeast:['Brunei','Cambodia','Indonesia','Laos','Malaysia','Myanmar','Philippines','Singapore','Thailand','Timor-Leste','Vietnam'],
};
const OC_ALIAS = {'Micronesia':['federated states of micronesia','fsm'],'Papua New Guinea':['png'],'Solomon Islands':['solomons'],'Marshall Islands':['marshalls']};
const OC_CAP_ALIAS = {'South Tarawa':['tarawa','bairiki'],"Nuku'alofa":['nukualofa'],'Ngerulmud':['melekeok']};
// the four parts of Europe (UN regions), for shorter games
const EU_PARTS = {
  Northern:['Denmark','Estonia','Finland','Iceland','Ireland','Latvia','Lithuania','Norway','Sweden','United Kingdom'],
  Western:['Austria','Belgium','France','Germany','Liechtenstein','Luxembourg','Monaco','Netherlands','Switzerland'],
  Southern:['Albania','Andorra','Bosnia and Herzegovina','Croatia','Greece','Italy','Malta','Montenegro','North Macedonia','Portugal','San Marino','Serbia','Slovenia','Spain','Vatican City'],
  Eastern:['Belarus','Bulgaria','Czechia','Hungary','Moldova','Poland','Romania','Russia','Slovakia','Ukraine'],
};
const CA_CAP_ALIAS = {'Guatemala City':['guatemala'],'Panama City':['panama']};
const CAP_NOTE = {'Bolivia':'The government meets in La Paz.',
  'South Africa':'South Africa has three capitals: Pretoria, Cape Town and Bloemfontein.',"Côte d'Ivoire":'Abidjan is the biggest city.',
  'Tanzania':'Dar es Salaam is the biggest city.','Benin':'The government works in Cotonou.','Eswatini':'Lobamba is the royal capital.',
  'Burundi':'The capital moved here from Bujumbura in 2019.',
  'Israel':'Many countries keep their embassies in Tel Aviv.','Sri Lanka':'Colombo is the biggest city, and the government works in both.',
  'Malaysia':'The government works in nearby Putrajaya.','Myanmar':'Yangon is the biggest city.','Kazakhstan':'It was called Nur-Sultan from 2019 to 2022.',
  'Nauru':'Nauru has no official capital. The government works in Yaren.','Tuvalu':'The government works on Funafuti, a ring of tiny islands.',
  'Palau':'It took over from Koror in 2006.','Australia':'Sydney is the biggest city.','New Zealand':'Auckland is the biggest city.',
  'Indonesia':'A new capital, Nusantara, is being built on the island of Borneo.','Turkey':'Istanbul is the biggest city.'};
const MAPDATA = {}; // map files once loaded, with items indexed by name
let FLAGURL = null, flagsLoading = null; // country name -> data: URL of its flag
const loadFlags = () => flagsLoading || (flagsLoading = fetch('flags.json').then(r => { if(!r.ok) throw new Error('flags ' + r.status); return r.json(); })
  .then(f => { FLAGURL = Object.fromEntries(Object.entries(f).map(([n, svg]) => [n, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)])); })
  .catch(e => { flagsLoading = null; throw e; }));
const flagImg = (n, cls='') => FLAGURL && FLAGURL[n] ? `<img class="flag ${cls}" src="${FLAGURL[n]}" alt="" draggable="false">` : '';
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
  { id:'us-states', group:'United States', tab:'States', name:'US States', blurb:'Name all 50 states on the map.', map:'us', count:50,
    answer:n=>n, nouns:'states', listWord:'state names', alias:STATE_ALIAS, maxZoom:10,
    tapWhat:'Tap a state, find its name', tapHint:'Tap a state on the map',
    ask:()=> 'Which state is this?', flashFront:()=> 'Which state is this?', card:'shape',
    back:n=>({answer:n, sub:`Capital: <b>${esc(CAP[n])}</b> ★`}) },
  { id:'us-capitals', group:'United States', tab:'Capitals', name:'State Capitals', blurb:'Name the capital of every state.', map:'us', count:50,
    answer:n=>CAP[n], nouns:'capitals', listWord:'capitals', alias:CAPITAL_ALIAS, maxZoom:10, showsItem:true, itemWord:'state',
    tapWhat:'Tap a state, find its capital', tapHint:'Tap a state on the map',
    ask:n=>`What is the capital of ${n}?`, flashFront:n=>`${n}: what is its capital?`, card:'shape',
    back:n=>({answer:CAP[n], sub:`Capital of <b>${esc(n)}</b> ★`}) },
  { id:'world', group:'World', tab:'Continents & Oceans', name:'Continents & Oceans', blurb:'Find the 7 continents and 5 oceans.', map:'world', count:12,
    answer:n=>n, nouns:'places', listWord:'continents and oceans', alias:WORLD_ALIAS, maxZoom:5,
    tapWhat:'Tap a continent or ocean, find its name', tapHint:'Tap a continent or ocean',
    ask:()=> 'Which continent or ocean is this?', flashFront:()=> 'Which continent or ocean is this?', card:'locate',
    back:(n,item)=>({answer:n, sub:worldSize(n, item.kind)}) },
  ...regionTopics('eu', 'Europe', 'europe', 44, 14, 'Find all 44 countries in Europe.', 'Name the capital of every country in Europe.', EU_ALIAS, EU_CAP_ALIAS, EU_PARTS),
  ...regionTopics('af', 'Africa', 'africa', 54, 10, 'Find all 54 countries in Africa.', 'Name the capital of every country in Africa.', AF_ALIAS, AF_CAP_ALIAS, AF_PARTS),
  ...regionTopics('as', 'Asia', 'asia', 48, 14, 'Find all 48 countries in Asia.', 'Name the capital of every country in Asia.', AS_ALIAS, AS_CAP_ALIAS, AS_PARTS),
  ...regionTopics('oc', 'Oceania', 'oceania', 14, 12, 'Find all 14 countries in Oceania.', 'Name the capital of every country in Oceania.', OC_ALIAS, OC_CAP_ALIAS),
  ...regionTopics('ca', 'Central America', 'camerica', 7, 6, 'Find all 7 countries in Central America.', 'Name the capital of every country in Central America.', {}, CA_CAP_ALIAS),
  ...regionTopics('sa', 'South America', 'samerica', 12, 6, 'Find all 12 countries in South America.', 'Name the capital of every country in South America.', {}, SA_CAP_ALIAS),
];
// Countries and capitals of a region. Capital names live in the region's map file.
function regionTopics(id, region, map, count, maxZoom, blurb, capBlurb, alias, capAlias, parts){
  const cap = n => MAPDATA[map].by[n].cap;
  const note = n => CAP_NOTE[n] ? ` ${esc(CAP_NOTE[n])}` : '';
  const base = {group:region, map, count, maxZoom, card:'shape', tapHint:'Tap a country on the map', itemWord:'country', parts};
  return [
    {...base, id:id+'-countries', tab:'Countries', name:`Countries of ${region}`, blurb, answer:n=>n, nouns:'countries', listWord:'countries', alias,
      tapWhat:'Tap a country, find its name', ask:()=>'Which country is this?', flashFront:()=>'Which country is this?',
      back:n=>({answer:n, sub:`Capital: <b>${esc(cap(n))}</b> ★${note(n)}`})},
    {...base, id:id+'-capitals', tab:'Capitals', name:region === 'Oceania' ? 'Capitals of Oceania' : `${({'Europe':'European','Africa':'African','Asia':'Asian','South America':'South American','Central America':'Central American'})[region]} Capitals`, blurb:capBlurb, answer:cap, nouns:'capitals', listWord:'capitals', alias:capAlias, showsItem:true,
      tapWhat:'Tap a country, find its capital', ask:n=>`What is the capital of ${n}?`, flashFront:n=>`${n}: what is its capital?`,
      back:n=>({answer:cap(n), sub:`Capital of <b>${esc(n)}</b> ★${note(n)}`})},
    {...base, id:id+'-flags', tab:'Flags', name:`Flags of ${region}`, blurb:`Learn the flag of every country in ${region}.`, flags:true, card:'flag', answer:n=>n, nouns:'flags', listWord:'countries', alias,
      tapWhat:'Tap a country, then pick its flag', ask:()=>'Which flag belongs to this country?', flashFront:()=>'Which country has this flag?',
      back:n=>({answer:n, sub:`Capital: <b>${esc(cap(n))}</b> ★`})},
  ];
}
const TOPIC = Object.fromEntries(TOPICS.map(t=>[t.id,t]));
const REGIONS = [...new Set(TOPICS.map(t => t.group))].map(g => ({name:g, topics:TOPICS.filter(t => t.group === g), map:TOPICS.find(t => t.group === g).map, parts:TOPICS.find(t => t.group === g).parts}));
// which part of a big place (like West Africa) the player last chose; 'All' plays everything
const getPart = r => { const v = r && r.parts ? LS.get(`part-${player ? player.id : ''}-${r.name}`) : null; return v && r.parts[v] ? v : 'All'; };
const setPart = (r, v) => LS.set(`part-${player ? player.id : ''}-${r.name}`, v);
const partChips = (r, cur) => r.parts ? `<div class="partrow"><span class="fieldlabel">Part:</span><div class="chips pick">${['All', ...Object.keys(r.parts)].map(v => `<button data-part="${v}" aria-pressed="${v===cur}">${v}</button>`).join('')}</div></div>` : '';
const regionOf = tid => REGIONS.find(r => r.topics.some(t => t.id === tid));
const lastTab = r => { const t = LS.get(`tab-${player ? player.id : ''}-${r.name}`); return r.topics.find(x => x.id === t) || r.topics[0]; };
const rememberTab = (r, tid) => LS.set(`tab-${player ? player.id : ''}-${r.name}`, tid);
const MODES = {flash:'Learn', find:'Find it', practice:'Practice', test:'Test'};
const MODE_DESC = {flash:'Flashcards, one at a time', find:'We show a name, you tap the map', practice:'Answer and find out right away', test:'Answer them all, then see your score'};
const modeDesc = (m, t) => m==='find' && t.flags ? 'We show a flag, you tap the country' : MODE_DESC[m];
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

const SCREENS = ['scrPlayers','scrHome','scrPlay','scrScores','scrRegion'];
function showScreen(id){ SCREENS.forEach(s => $(s).hidden = s !== id); window.scrollTo(0,0); }

/* ===================== 5. sound & confetti ===================== */
let actx = null;
/* Say it: read names aloud with the device's own voice (no downloads, works offline on most devices) */
const CAN_SAY = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
if(!CAN_SAY) document.documentElement.classList.add('nosay');
// sound-it-out spellings for names that device voices often get wrong
const SAY = {"Côte d'Ivoire":'coat dee-vwahr','Ouagadougou':'wah-gah-doo-goo','Yamoussoukro':'yah-moo-sook-roh','Nouakchott':'nwak-shot',"N'Djamena":'en-jah-may-nah',
  'Lesotho':'leh-soo-too','Mbabane':'em-bah-bah-nay','Bujumbura':'boo-jum-boo-rah','Gitega':'gee-tay-gah','Niamey':'nee-ah-may','Bamako':'bah-mah-koh','Malabo':'mah-lah-boh',
  'Libreville':'lee-bruh-veel','Porto-Novo':'portoh noh-voh','Lomé':'loh-may','Asmara':'ahs-mah-rah','Moroni':'moh-roh-nee','Thimphu':'tim-poo','Malé':'mah-lay',
  'Naypyidaw':'nay-pyee-daw','Ulaanbaatar':'oo-lahn bah-tar','Sri Jayawardenepura Kotte':'shree jaya-wardeena-poora koh-tay','Bishkek':'bish-kek','Dushanbe':'doo-shahn-bay',
  'Ashgabat':'ash-gah-baht',"Sana'a":'sah-nah','Qatar':'kah-tar','Doha':'doh-hah','Tbilisi':'tuh-bee-lee-see','Reykjavík':'rake-yah-veek','Chișinău':'kee-shee-now',
  'Ljubljana':'lee-oob-lee-ah-nah','Vaduz':'fah-doots','Podgorica':'pod-goh-reet-sah','Skopje':'skop-yeh','Vilnius':'vil-nee-us','Tallinn':'tah-lin','Bern':'bairn',
  'Kyiv':'keev','Czechia':'check-ee-uh','Brasília':'brah-zee-lee-ah','Bogotá':'boh-goh-tah','Asunción':'ah-soon-see-ohn','Tegucigalpa':'teh-goo-see-gal-pah',
  'Belmopan':'bel-moh-pan','Paramaribo':'pah-rah-mah-ree-boh','Antananarivo':'an-tah-nah-nah-ree-voh','Gaborone':'hah-boh-roh-nay','São Tomé and Príncipe':'sow toh-may and preen-see-pay',
  'São Tomé':'sow toh-may','Eswatini':'eh-swah-tee-nee','Djibouti':'jih-boo-tee','Timor-Leste':'tee-mor lesh-tay','Dili':'dee-lee','Bandar Seri Begawan':'bun-dar seh-ree beh-gah-wan',
  'Vientiane':'vee-en-tee-ahn','Kiribati':'kee-ree-bahs','South Tarawa':'south tah-rah-wah','Ngerulmud':'neh-rool-mood',"Nuku'alofa":'noo-koo-ah-loh-fah',
  'Palikir':'pah-lee-keer','Majuro':'mah-joo-roh','Funafuti':'foo-nah-foo-tee','Tuvalu':'too-vah-loo','Nauru':'nah-oo-roo','Yaren':'yah-ren','Apia':'ah-pee-ah',
  'Vanuatu':'vah-noo-ah-too','Port Vila':'port vee-lah','Honiara':'hoh-nee-ah-rah','Phnom Penh':'puh-nom pen','Nur-Sultan':'noor sool-tahn','Astana':'ah-stah-nah'};
let voice = null;
function pickVoice(){
  if(!CAN_SAY) return;
  const vs = speechSynthesis.getVoices(); if(!vs.length) return;
  const score = v => (/^en[-_]US/i.test(v.lang) ? 4 : /^en/i.test(v.lang) ? 3 : 0) + (v.localService ? 1 : 0) + (/natural|enhanced|premium|samantha|google us/i.test(v.name) ? 1 : 0);
  voice = vs.slice().sort((a,b) => score(b) - score(a))[0];
  if(voice && !/^en/i.test(voice.lang)) voice = null;
}
if(CAN_SAY){ pickVoice(); speechSynthesis.addEventListener?.('voiceschanged', pickVoice); }
// parts: a list of names and plain words; names get their sound-it-out spelling
function say(...parts){
  if(!CAN_SAY) return;
  const text = parts.filter(Boolean).map(t => SAY[t] || t).join(' ');
  try{
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = voice ? voice.lang : 'en-US'; if(voice) u.voice = voice; u.rate = 0.85;
    speechSynthesis.speak(u);
  }catch(e){}
}
const autoSay = () => !!(player && player.prefs.say);
// what to say for a place: its name, and its capital when the topic has one
function sayParts(n, withCap = true){
  const R = REGIONS.find(r => r.topics.some(t => t.id === T.id)) || {topics:[T]};
  const capTopic = R.topics.find(t => t.showsItem), cap = capTopic && withCap ? capTopic.answer(n) : null;
  return cap && cap !== n ? [n, '. Its capital is', cap] : [n];
}
const sayBtn = (label, parts) => CAN_SAY ? `<button class="say" type="button" data-say="${esc(JSON.stringify(parts))}" aria-label="Say ${esc(label)}">🔊</button>` : '';
document.addEventListener('click', e => { const b = e.target.closest('.say'); if(!b) return; e.stopPropagation(); e.preventDefault(); try{ say(...JSON.parse(b.dataset.say)); }catch(err){} }, true);

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
let THUMBS = null;
const loadThumbs = () => THUMBS ? Promise.resolve(THUMBS) : fetch('thumbs.json').then(r => r.ok ? r.json() : {}).then(t => (THUMBS = t)).catch(() => (THUMBS = {}));
const thumbSvg = map => { const t = THUMBS && THUMBS[map]; return t ? `<svg class="rthumb" viewBox="0 0 ${t.w} ${t.h}" aria-hidden="true">${t.o ? `<path class="o" d="${t.o}"/>` : ''}<path d="${t.d}"/></svg>` : '<span class="rthumb"></span>'; };
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
  $('homeGroups').innerHTML = dailyCard() +
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
  curRegion = REGIONS.find(r => r.name === name); curTab = lastTab(curRegion).id;
  showScreen('scrRegion'); pushLayer(() => { showScreen('scrHome'); renderHome(); });
  renderRegion();
}
$('regionBack').onclick = () => popLayer();
$('exploreBtn').onclick = () => enterExplore(curRegion.name);
async function renderRegion(){
  if(!curRegion || !player) return;
  const r = curRegion, t = TOPIC[curTab];
  $('regionTitle').textContent = r.name;
  $('regionTabs').hidden = r.topics.length < 2;
  $('regionTabs').innerHTML = r.topics.map(x => `<button role="tab" data-tab="${x.id}" aria-selected="${x.id===curTab}">${esc(x.tab)}</button>`).join('');
  const part = getPart(r), pp = part === 'All' ? null : part, n = pp ? r.parts[pp].length : t.count;
  const st = await topicStats(player.id, t, pp);
  const saved = await Promise.all(Object.keys(MODES).map(m => DB.get('games', gameKey(player.id, t.id, pp ? m + '@' + pp : m))));
  $('regionBody').innerHTML = `
    <p class="sub">${esc(t.blurb)}</p>
    ${partChips(r, part)}
    <div class="meter" role="img" aria-label="${st.learned} of ${n} learned"><i style="width:${Math.round(100*st.learned/n)}%"></i></div>
    <p class="stats"><span><b>${st.learned}</b> of ${n} learned${pp ? ` in ${pp === 'Middle East' ? 'the Middle East' : esc(pp + ' ' + r.name)}` : ''}</span>${st.best!=null ? `<span>Best test: <b>${st.best}/${n}</b></span>` : ''}${st.bestTime ? `<span>Best time: <b>${fmtTime(st.bestTime)}</b></span>` : ''}</p>
    <div class="modelist">${modeButtons(t, saved, null, pp)}</div>`;
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

/* ===================== 8. map, zoom & search ===================== */
const MAPS = {};
const loadMap = name => MAPS[name] || (MAPS[name] = fetch(name + '.json').then(r => { if(!r.ok) throw new Error('map ' + r.status); return r.json(); })
  .then(m => { m.by = Object.fromEntries(m.items.map(i => [i.n, i])); MAPDATA[name] = m; return m; })
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
  const path = i => `<path class="st ${i.kind==='ocean'?'ocean':'land'}" d="${i.d}" data-n="${esc(i.n)}" tabindex="0" role="button"/>`;
  svg.innerHTML = (M.seabg ? `<rect class="seabg" width="${VW}" height="${VH}"/>` : '') + (M.sphere ? `<path class="globe" d="${M.sphere}"/>` : '') +
    M.items.filter(i=>i.kind==='ocean').map(path).join('') +
    (M.other ? `<path class="other" d="${M.other}"/>` : '') +
    M.items.filter(i=>i.kind!=='ocean').map(path).join('');
  els = {}; svg.querySelectorAll('path.st').forEach(p => els[p.dataset.n] = p);
  DOTS = {};
  M.items.filter(i => i.dot).forEach(i => { const c = document.createElementNS(SVGNS, 'circle'); c.setAttribute('cx', i.dot[0]); c.setAttribute('cy', i.dot[1]); c.dataset.n = i.n; c.setAttribute('aria-hidden','true'); svg.appendChild(c); DOTS[i.n] = c; });
  // tall maps (South America) shouldn't run off the bottom of the screen
  svg.style.maxWidth = VH/VW > 0.7 ? `calc(max(300px, 100vh - 340px) * ${(VW/VH).toFixed(3)})` : '';
  setVB({x:0, y:0, w:VW});
}
svg.addEventListener('keydown', e => { const p = e.target.closest('path.st'); if(p && (e.key==='Enter'||e.key===' ')){ e.preventDefault(); select(p.dataset.n); } });

const clampW = w => Math.min(VW, Math.max(MINW, w));
// tap dots for tiny places always sit above the countries, or a big neighbor (Italy) could cover one (Vatican City)
// the map's size on screen changes (first layout, turning the iPad, Explore), so resize the tap dots to match
if('ResizeObserver' in window) new ResizeObserver(() => { if(DOTS && Object.keys(DOTS).length && vb && vb.w) setVB(vb); }).observe(svg);
function raiseDots(last){ for(const k in DOTS) if(k !== last) svg.appendChild(DOTS[k]); if(last && DOTS[last]) svg.appendChild(DOTS[last]); const g = svg.querySelector('#exLabels'); if(g) svg.appendChild(g); }
// a finger is bigger than a dot: a tap near a dot picks it, so tiny places are easy to hit
function dotNear(cx, cy){
  let best = null, bd = 1e9;
  for(const k in DOTS){ const c = DOTS[k]; if(c.classList.contains('off') || c.style.display === 'none') continue;
    const r = c.getBoundingClientRect(); if(!r.width) continue;
    const d = Math.hypot(cx - (r.left + r.width/2), cy - (r.top + r.height/2));
    if(d <= r.width/2 + 8 && d < bd){ bd = d; best = k; } } // the dot plus a little extra for fingers
  return best;
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
  if(tap){ const near = e.pointerType === 'mouse' ? null : dotNear(e.clientX, e.clientY); const el = document.elementFromPoint(e.clientX, e.clientY); const p = el && el.closest && el.closest('.st');
    const n = near || (p && p.dataset.n); if(n) select(n); }
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
  saveNow(); stopClock(); endExplore();
  T = TOPIC[topicId];
  if(part && !(T.parts && T.parts[part])) part = null;
  $('chipText').innerHTML = `${esc(T.name)}<small>${part ? `${MODES[mode]} · ${esc(part)}` : only ? 'Practice the tricky ones' : MODES[mode]}</small>`;
  if(!fromPicker){ returnTo = SCREENS.find(id => !$(id).hidden) || 'scrHome'; showScreen('scrPlay'); pushLayer(leaveGame); }
  const R = regionOf(topicId); if(R) rememberTab(R, topicId);
  ['mapSheet','play','results','flash'].forEach(id => $(id).hidden = true);
  $('sub').textContent = 'Loading the map…'; $('tally').textContent = '';
  try{ M = await loadMap(T.map); if(T.flags) await loadFlags(); }
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
function leaveGame(){ endExplore(); saveNow(); stopClock(); hideToast(); G = null; showScreen(returnTo); if(returnTo === 'scrRegion') renderRegion(); else renderHome(); }
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
    let cls = 'st ' + (ITEM[n].kind==='ocean' ? 'ocean' : 'land');
    if(G.mode !== 'flash'){
      if(isSolved(n)) cls += ' ok';
      else if(reviewing || (G.mode!=='test' && G.answers[n])) cls += ' bad';
      else if(G.answers[n]) cls += ' done';
    }
    if(n === current) cls += ' sel';
    if(!inPlay(n)) cls += ' off';
    const el = els[n]; el.setAttribute('class', cls);
    if(DOTS[n]) DOTS[n].setAttribute('class', cls + ' dot');
    el.setAttribute('aria-label', isSolved(n) || reviewing || T.showsItem ? `${n}${isSolved(n)?', correct':reviewing?', missed':''}` : G.answers[n] ? `Answered ${G.answers[n]}` : 'Not answered yet');
  });
  const named = Object.keys(G.answers).length, total = PN().filter(n => !(G.solved[n] < G.round)).length;
  const verb = G.mode==='find' ? 'done' : 'answered';
  $('tally').innerHTML = G.mode==='flash' || reviewing ? '' : (G.round===1 ? `<b>${named}</b> / ${total} ${verb}` : `Round ${G.round} · <b>${named}</b> / ${total} ${verb}`);
  if(G.mode === 'find'){ $('selLabel').textContent = 'Find it on the map'; const t = findTarget(); if(T.flags) $('findQ').innerHTML = t ? `${flagImg(t, 'big')}<span>Find the country with this flag</span>` : ''; else { $('findQ').innerHTML = t ? `${esc(findAsk(t))} ${sayBtn(key(t), [key(t)])}` : ''; if(t && autoSay() && G.sayLast !== t){ G.sayLast = t; say(key(t)); } } return; }
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
function toPlay(){
  reviewing = false; current = null;
  $('play').hidden = false; $('results').hidden = true;
  feedback(G.round>1 ? `Round ${G.round}: your right answers stay green. ${remaining()} left to go!` : '');
  layoutBar(); subText(); playLegend(); setInput();
  if(G.mode === 'find'){ if(!G.queue || !G.queue.length) G.queue = shuffle(PN().filter(n => isOpen(n))); G.tries = 0; G.firstWrong = null; }
  paint();
  if(G.part) zoomToItems(PN());
}
// frame a group of places (a part of a big place like West Africa)
function zoomToItems(names){
  let x0=1e9, y0=1e9, x1=-1e9, y1=-1e9;
  const small = names.filter(n => ITEM[n].dot || (ITEM[n].b[2]-ITEM[n].b[0]) < VW*0.4);
  if(small.length) names = small;
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
  if(ITEM[n].kind !== 'ocean'){ svg.appendChild(els[n]); raiseDots(n); } // bring to front so its outline shows, but keep tap dots on top
  if(isSolved(n)) feedback(T.showsItem ? `<b>${esc(key(n))}</b>. You already got this one.` : `That's <b>${esc(n)}</b>. You already got this one.`, 'ok');
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
      else { feedback(`Not quite. That's the flag of ${esc(v)}. Here is the flag of <b>${esc(current)}</b>: ${flagImg(current, 'tiny')}`, 'bad'); sound('wrong'); }
    }
    else if(right){ G.solved[current] = G.round; feedback(`Yes! ${T.showsItem ? `The capital of ${esc(current)} is` : `That's`} <b>${esc(v)}</b>.`, 'ok'); sound('right'); }
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
$('next').onclick = () => EXPLORE ? exploreStep(1) : step(1);
$('prev').onclick = () => EXPLORE ? exploreStep(-1) : step(-1);

/* ---- Find it: the app names a place, the player taps it ---- */
const findTarget = () => G.queue && G.queue[0];
function findAsk(n){
  if(T.showsItem) return `Which ${T.itemWord} has the capital ${key(n)}?`;
  return ITEM[n].kind === 'ocean' ? `Find the ${n}` : `Find ${n}`;
}
function flashWrong(n){ [els[n], DOTS[n]].forEach(el => { if(!el) return; el.classList.add('wrongflash'); setTimeout(() => el.classList.remove('wrongflash'), 700); }); }
function findTap(n){
  const t = findTarget(); if(!t || G.busy) return;
  G.active = true;
  if(n === t){
    G.solved[t] = G.round; G.answers[t] = t;
    recordItem(player.id, T.id, t, G.tries === 0); sound('right');
    feedback(`Yes! That's <b>${esc(t)}</b>${T.showsItem ? `. Its capital is ${esc(key(t))}` : ''}.`, 'ok');
    current = t; paint(); G.busy = true; setTimeout(nextFind, 900); return;
  }
  if(isSolved(n) || G.answers[n]){ feedback(`That's ${esc(n)}. You already did that one. Keep looking!`); flashWrong(n); return; }
  G.tries++; if(!G.firstWrong) G.firstWrong = n; sound('wrong'); flashWrong(n);
  const hint = T.showsItem ? `That's ${esc(n)}. Its capital is ${esc(key(n))}.` : `That's ${esc(n)}.`;
  if(G.tries < 3) feedback(`${hint} Try again! ${3-G.tries} ${3-G.tries === 1 ? 'try' : 'tries'} left.`, 'bad');
  else revealFind(`${hint} Here is <b>${esc(t)}</b>.`);
}
function revealFind(msg){
  const t = findTarget(); if(!t) return;
  G.answers[t] = G.firstWrong || 'skipped';
  recordItem(player.id, T.id, t, false);
  current = t; focusItem(t); feedback(msg, 'bad'); paint();
  G.busy = true; setTimeout(nextFind, 2000);
}
function nextFind(){
  G.queue.shift(); G.tries = 0; G.firstWrong = null; G.busy = false; current = null;
  saveSoon();
  if(!G.queue.length){ feedback('That was the last one!', 'ok'); paint(); setTimeout(() => { if(G && G.mode==='find' && !reviewing) review(); }, 700); return; }
  paint();
}
$('skipBtn').onclick = () => { if(G && !G.busy && findTarget()) revealFind(`Skipped. Here is <b>${esc(findTarget())}</b>.`); };

/* ---- Easy answers: pick from 4 instead of typing ---- */
const easy = () => !!(player && (player.prefs.easy || (T && T.flags))) && G && (G.mode === 'test' || G.mode === 'practice');
function renderChoices(){
  const box = $('choices');
  if(!easy() || !current || !isOpen(current)){ box.innerHTML = ''; return; }
  let opts = G.choices[current];
  if(!opts){ // the right answer plus 3 others, kept the same if you come back to this one
    const right = key(current);
    const others = shuffle(pool().filter(v => v !== right)).slice(0, 3);
    if(others.length < 3) others.push(...shuffle(NAMES.map(key).filter(v => v !== right && !others.includes(v))).slice(0, 3 - others.length));
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
  if(G.round === 1 && !G.scored && (!G.only || G.part)){ // tricky-ones practice doesn't count toward best scores; a part of a place does
    G.scored = true;
    const before = (await DB.byPT('attempts', player.id, T.id)).filter(a => a.timeMs && a.correct===a.total).map(a=>a.timeMs);
    if(time && correct === PN().length && (!before.length || time < Math.min(...before))) newBest = true;
    await DB.put('attempts', {pid:player.id, topic:T.id, mode:G.mode, part:G.part || null, at:Date.now(), correct, total:PN().length, timeMs:time});
  }
  const finished = correct === PN().length;
  if(finished) await DB.del('games', G.key); else saveNow();
  showReview(false, {newBest, time});
  if(finished){ confetti(); sound('done'); }
  afterGame();
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
  if(G.mode === 'find') $('badList').innerHTML = missed.length ? missed.map(n => `<li data-n="${esc(n)}"><span class="right">${esc(T.showsItem ? `${key(n)} (${n})` : n)}</span>${sayBtn(key(n), [key(n)])}${G.answers[n] && G.answers[n] !== 'skipped' ? `<span class="rnd">you tapped ${esc(G.answers[n])}</span>` : G.answers[n]==='skipped' ? '<span class="rnd">skipped</span>' : ''}</li>`).join('') : '<li class="empty">None. Great job!</li>';
  else $('badList').innerHTML = missed.length ? missed.map(n => `<li data-n="${esc(n)}">${T.flags ? flagImg(n, 'tiny') : ''}<span class="you">${G.answers[n] ? esc(G.answers[n]) : 'blank'}</span> <span aria-hidden="true">→</span> <span class="right">${esc(key(n))}</span>${sayBtn(key(n), [key(n)])}${meta(n) ? `<span class="rnd">${esc(meta(n))}</span>` : ''}</li>`).join('') : '<li class="empty">None. Great job!</li>';
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
$('retry').onclick = () => { G.round++; G.answers = {}; G.reviewed = false; G.queue = null; G.choices = {}; saveNow(); toPlay(); startClock(); };
$('restart').onclick = async () => {
  if(PN().some(n => !isSolved(n)) && !(await confirmDialog({title:'Start a new game?', text:'Your answers in this game will be cleared.', ok:'New game'}))) return;
  await DB.del('games', G.key); G = {...newGameState(G.mode), only:G.only, key:G.key, part:G.part}; toPlay(); startClock();
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
function drawCardArt(el, n, side){
  if(T.card === 'flag' && side === 'front'){ // just the flag, in a 4:3 frame
    el.setAttribute('viewBox', '0 0 400 300');
    el.innerHTML = `<image href="${FLAGURL[n]}" x="0" y="0" width="400" height="300" preserveAspectRatio="xMidYMid meet"/><rect x=".5" y=".5" width="399" height="299" fill="none" class="flagframe"/>`;
    return;
  }
  const it = ITEM[n];
  if(T.card === 'shape' || T.card === 'flag'){ // the shape on its own, with a star on the capital
    const [x0,y0,x1,y1] = it.fb || it.b, w = x1-x0, h = y1-y0, pad = Math.max(w,h)*0.1, r = Math.max(w,h)*0.055;
    el.setAttribute('viewBox', `${x0-pad} ${y0-pad} ${w+2*pad} ${h+2*pad}`);
    const k = it.fk || it.k;
    el.innerHTML = `<path class="item" d="${it.fd || it.d}"/>` + (k ? `<polygon class="star" points="${starPts(k[0], k[1], r)}"/>` : '');
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
    const t = TOPIC[tid];
    body.innerHTML = `<p class="sect">Place</p><div class="chips pick">${REGIONS.map(x => `<button data-r="${esc(x.name)}" aria-pressed="${x===r}">${esc(x.name)}</button>`).join('')}</div>
      ${r.topics.length > 1 ? `<p class="sect">Learn about</p><div class="tabs">${r.topics.map(x => `<button data-tab="${x.id}" aria-selected="${x.id===tid}">${esc(x.tab)}</button>`).join('')}</div>` : ''}
      ${r.parts ? `<p class="sect">Part</p>${partChips(r, part)}` : ''}
      <p class="sect">How to play</p><div class="modelist">${modeButtons(t, null, t.id===T.id && G && (G.part || 'All') === part ? G.mode : null, part === 'All' ? null : part)}
        <button class="modebig" data-explore="${esc(r.name)}"${EXPLORE && EXPLORE.R===r ? ' aria-current="true"' : ''}><span class="mn">Explore</span><span class="md">A map to look around, no quiz</span></button></div>`;
  };
  draw();
  body.addEventListener('click', e => {
    const rb = e.target.closest('[data-r]'); if(rb){ r = REGIONS.find(x => x.name === rb.dataset.r); tid = lastTab(r).id; part = getPart(r); draw(); return; }
    const pc = e.target.closest('.partrow [data-part]'); if(pc){ part = pc.dataset.part; setPart(r, part); draw(); return; }
    const tb = e.target.closest('[data-tab]'); if(tb){ tid = tb.dataset.tab; draw(); return; }
    const ex = e.target.closest('[data-explore]'); if(ex){ popLayer(() => enterExplore(ex.dataset.explore, true)); return; }
    const mb = e.target.closest('[data-mode]'); if(mb) popLayer(() => enterGame(mb.dataset.topic, mb.dataset.mode, true, null, mb.dataset.part || null));
  });
};

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
    body.innerHTML = `<section class="badgesec"><h2>Badges <span class="muted">${got} of ${badges.length}</span></h2>
      <p class="muted streakline">Daily 10 streak: <b>${d.streak} day${d.streak===1?'':'s'}</b> · Best: <b>${d.best} day${d.best===1?'':'s'}</b></p>
      <div class="badges">${badges.slice().sort((a,b) => b.earned - a.earned).map(b => `<div class="badge ${b.earned?'on':'off'}"><span class="bi" aria-hidden="true">${b.icon}</span><span class="bn">${esc(b.name)}</span><span class="bd">${esc(b.desc)}</span>${b.earned?'':'<span class="sr">Not earned yet</span>'}</div>`).join('')}</div></section>
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
    const [allItems, allAttempts, allBadges] = await Promise.all([DB.all('items'), DB.all('attempts'), Promise.all(players.map(computeBadges))]);
    const weekAgo = Date.now() - 7*864e5, weekStart = ymd(new Date(weekAgo));
    const totalItems = TOPICS.reduce((n, t) => n + t.count, 0);
    const fam = players.map((p, i) => {
      const items = allItems.filter(r => r.pid === p.id && TOPIC[r.topic]), att = allAttempts.filter(a => a.pid === p.id && TOPIC[a.topic]);
      const learned = items.filter(r => r.last === 'right').length, s = streakNow(p);
      return {p, items, att, learned, badges: allBadges[i].filter(b => b.earned).length, streak: s.streak, best: s.best,
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
              <span><b>🔥 ${f.streak}</b><small>day streak</small></span>
              <span><b>${f.best}</b><small>best streak</small></span>
            </div>
            <p class="fweek">${f.weekGames || f.weekDaily ? `This week: <b>${f.weekGames}</b> game${f.weekGames===1?'':'s'} · <b>${f.weekDaily}</b> Daily 10${f.weekDaily===1?'':'s'}` : 'This week: just getting started!'}</p>
          </article>`).join('')}</div>
        ${players.length < 2 ? '<p class="muted" style="margin-top:10px">Add more players to compare scores.</p>' : ''}
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

/* ===================== 10b2. Explore map: tap anything to learn about it ===================== */
let EXPLORE = null; // {R: the place, labels: show names on the map}
function enterExplore(regionName, fromPicker){
  saveNow(); stopClock(); hideToast();
  const R = REGIONS.find(r => r.name === regionName);
  if(!fromPicker){ returnTo = SCREENS.find(id => !$(id).hidden) || 'scrHome'; showScreen('scrPlay'); pushLayer(leaveGame); }
  endExplore(); G = null; current = null; reviewing = false;
  EXPLORE = {R, labels: LS.get('labels') !== '0'};
  T = R.topics[0];
  $('chipText').innerHTML = `${esc(R.name)}<small>Explore the map</small>`;
  ['mapSheet','play','results','flash','dailyDone'].forEach(id => $(id).hidden = true);
  $('sub').textContent = 'Loading the map…'; $('tally').textContent = ''; $('clock').hidden = true;
  (async () => {
    try{ M = await loadMap(T.map); if(R.topics.some(t => t.flags)) await loadFlags(); }
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
    const cls = 'st ' + (ITEM[n].kind==='ocean' ? 'ocean' : 'land') + (n === current ? ' sel' : '');
    els[n].setAttribute('class', cls); if(DOTS[n]) DOTS[n].setAttribute('class', cls + ' dot');
    els[n].setAttribute('aria-label', n);
  });
  if(current && ITEM[current].kind !== 'ocean'){ svg.appendChild(els[current]); raiseDots(current); }
  // labels and the capital star stay on top
  const g = svg.querySelector('#exLabels'); if(g) svg.appendChild(g);
  let st = svg.querySelector('#exStar');
  const k = current && ITEM[current].k;
  if(k){ if(!st){ st = document.createElementNS(SVGNS, 'polygon'); st.id = 'exStar'; st.setAttribute('class','exstar'); } svg.appendChild(st); st.dataset.x = k[0]; st.dataset.y = k[1]; }
  else if(st) st.remove();
  exploreScale();
}
function exploreTap(n){ current = n; focusItem(n); explorePaint(); exploreInfo(n); sound('tap'); if(autoSay()){ const R = EXPLORE.R, ct = R.topics.find(t => t.showsItem), cap = ct ? ct.answer(n) : null; say(...(cap ? [n, '. Its capital is', cap] : [n])); } }
function exploreStep(dir){
  const i = current ? ORDER.indexOf(current) : (dir > 0 ? -1 : 0), L = ORDER.length;
  exploreTap(ORDER[((i + dir) % L + L) % L]);
}
function exploreInfo(n){
  const box = $('exInfo');
  if(!n){ box.innerHTML = '<p class="muted">Tap any place on the map to learn about it, or press <b>Next</b>.</p>'; return; }
  const R = EXPLORE.R, it = ITEM[n];
  const capTopic = R.topics.find(t => t.showsItem), cap = capTopic ? capTopic.answer(n) : null;
  const flags = R.topics.some(t => t.flags);
  const extra = R.map === 'world' ? worldSize(n, it.kind) : R.map === 'us' ? `Postal code: <b>${POSTAL[n]}</b>` : '';
  box.innerHTML = `${flags ? flagImg(n, 'exflag') : ''}<div class="exbody"><p class="exname">${esc(n)} ${sayBtn(n, cap ? [n, '. Its capital is', cap] : [n])}</p>
    ${cap ? `<p>Capital: <b>${esc(cap)}</b> <span class="exstarkey" aria-hidden="true">★</span>${CAP_NOTE[n] ? ` <span class="muted">${esc(CAP_NOTE[n])}</span>` : ''}</p>` : ''}
    ${extra ? `<p class="muted">${extra}</p>` : ''}</div>`;
}
function drawLabels(){
  const old = svg.querySelector('#exLabels'); if(old) old.remove();
  if(!EXPLORE || !EXPLORE.labels) return;
  const g = document.createElementNS(SVGNS, 'g'); g.id = 'exLabels'; g.setAttribute('aria-hidden','true');
  M.items.forEach(i => {
    const t = document.createElementNS(SVGNS, 'text'); const [x,y] = i.dot || i.c;
    t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('class', 'exlbl' + (i.kind === 'ocean' ? ' sea' : ''));
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

/* ===================== 10c. Daily 10, streaks & badges ===================== */
const ymd = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today = () => ymd(new Date());
const yesterday = () => { const d = new Date(); d.setDate(d.getDate()-1); return ymd(d); };
// the streak only counts if the last Daily 10 was today or yesterday
function streakNow(p){ const d = p.daily || {}; const alive = d.last === today() || d.last === yesterday(); return {streak: alive ? (d.streak||0) : 0, best: d.best||0, doneToday: d.last === today(), lastScore: d.lastScore}; }
function dailyCard(){
  const s = streakNow(player);
  const status = s.doneToday ? `Done today! You got ${s.lastScore} of 10. Play again for fun.` : '10 quick questions from everywhere. New every day.';
  return `<button class="dailybtn${s.doneToday?' done':''}" id="dailyBtn">
    <span class="dt">Daily 10${s.doneToday ? ' ✓' : ''}</span><span class="dd">${esc(status)}</span>
    <span class="streak" aria-label="${s.streak} day streak"><span aria-hidden="true">🔥</span> ${s.streak}<small>day${s.streak===1?'':'s'}</small></span>
  </button>`;
}

let DAILY = null; // {qs:[{t,n,style}], i, right, tries, busy}
async function pickDaily(){
  const all = (await DB.all('items')).filter(r => r.pid === player.id && TOPIC[r.topic]);
  const tricky = shuffle(all.filter(r => r.last === 'wrong' || r.wrong > r.right)).slice(0, 4);
  const played = [...new Set(all.map(r => r.topic))];
  const qs = tricky.map(r => ({t: r.topic, n: r.item}));
  const seen = new Set(qs.map(q => q.t + '|' + q.n));
  let guard = 0;
  while(qs.length < 10 && guard++ < 200){
    const pool = played.length && Math.random() < 0.6 ? played : TOPICS.map(t => t.id);
    const tid = pool[Math.floor(Math.random()*pool.length)], t = TOPIC[tid];
    const m = await loadMap(t.map);
    const n = m.items[Math.floor(Math.random()*m.items.length)].n;
    if(seen.has(tid + '|' + n)) continue;
    seen.add(tid + '|' + n); qs.push({t: tid, n});
  }
  for(const q of qs){ await loadMap(TOPIC[q.t].map); if(TOPIC[q.t].flags) await loadFlags(); q.style = Math.random() < 0.5 ? 'find' : 'pick'; }
  return shuffle(qs);
}
async function startDaily(){
  returnTo = 'scrHome'; showScreen('scrPlay');
  pushLayer(() => { DAILY = null; $('dailyDone').hidden = true; $('play').querySelectorAll('[data-dhide]').forEach(el => { el.hidden = false; el.removeAttribute('data-dhide'); }); showScreen('scrHome'); renderHome(); });
  ['mapSheet','play','results','flash','dailyDone'].forEach(id => $(id).hidden = true);
  $('chipText').innerHTML = 'Daily 10<small>Getting your questions ready…</small>'; $('sub').textContent = ''; $('tally').textContent = ''; $('clock').hidden = true;
  try{ DAILY = {qs: await pickDaily(), i: 0, right: 0, tries: 0, busy: false}; }
  catch(e){ $('sub').textContent = 'The questions could not load. Check your internet connection, then go back and try again.'; return; }
  // the Daily 10 uses its own controls
  ['.combo','#submit','.nav','#reviewBtn','#skipBtn'].forEach(sel => { const el = $('play').querySelector(sel); if(el && !el.hidden){ el.hidden = true; el.setAttribute('data-dhide',''); } });
  $('mapSheet').hidden = false; $('play').hidden = false; $('legend').innerHTML = '';
  dailyShow();
}
async function dailyShow(){
  const q = DAILY.qs[DAILY.i]; T = TOPIC[q.t]; M = await loadMap(T.map); drawMap();
  DAILY.tries = 0; DAILY.busy = false; current = q.style === 'pick' ? q.n : null;
  $('chipText').innerHTML = `Daily 10<small>Question ${DAILY.i+1} of 10 · ${esc(T.name)}</small>`;
  $('tally').innerHTML = `<b>${DAILY.right}</b> right`;
  feedback('');
  const fq = $('findQ'), ch = $('choices');
  if(q.style === 'find'){
    $('sub').textContent = 'Tap the right place on the map. You get 2 tries.';
    $('selLabel').textContent = 'Find it on the map';
    if(T.flags) fq.innerHTML = `${flagImg(q.n,'big')}<span>Find the country with this flag</span>`;
    else fq.textContent = T.showsItem ? `Which ${T.itemWord} has the capital ${key(q.n)}?` : (ITEM[q.n].kind==='ocean' ? `Find the ${q.n}` : `Find ${q.n}`);
    fq.hidden = false; ch.hidden = true; ch.innerHTML = '';
  } else {
    $('sub').textContent = 'Look at the orange place on the map, then pick the right answer.';
    $('selLabel').textContent = T.flags ? 'Which flag belongs to this country?' : T.showsItem ? `What is the capital of ${q.n}?` : T.ask(q.n);
    fq.hidden = true; ch.hidden = false;
    const right = key(q.n), others = shuffle(NAMES.map(key).filter(v => v !== right)).slice(0, 3), opts = shuffle([right, ...others]);
    ch.classList.toggle('flags', !!T.flags);
    ch.innerHTML = opts.map((v,i) => T.flags ? `<button data-dv="${esc(v)}" aria-label="Flag ${i+1}">${flagImg(v)}</button>` : `<button data-dv="${esc(v)}">${esc(v)}</button>`).join('');
    focusItem(q.n);
  }
  dailyPaint();
}
function dailyPaint(reveal, mark){
  NAMES.forEach(n => {
    let cls = 'st ' + (ITEM[n].kind==='ocean' ? 'ocean' : 'land');
    if(mark && mark[n]) cls += ' ' + mark[n];
    else if(n === current || n === reveal) cls += ' sel';
    els[n].setAttribute('class', cls); if(DOTS[n]) DOTS[n].setAttribute('class', cls + ' dot');
  });
  if(current && ITEM[current].kind !== 'ocean'){ svg.appendChild(els[current]); raiseDots(current); }
}
function dailyAnswer(right, msg){
  const q = DAILY.qs[DAILY.i];
  DAILY.busy = true; if(right) DAILY.right++;
  recordItem(player.id, q.t, q.n, right);
  sound(right ? 'right' : 'wrong');
  feedback(msg, right ? 'ok' : 'bad');
  $('tally').innerHTML = `<b>${DAILY.right}</b> right`;
  current = q.n; dailyPaint(null, {[q.n]: right ? 'ok' : 'sel'}); if(!right) focusItem(q.n);
  setTimeout(() => { if(!DAILY) return; DAILY.i++; if(DAILY.i < DAILY.qs.length) dailyShow(); else dailyFinish(); }, right ? 1000 : 2200);
}
function dailyTap(n){
  const q = DAILY && DAILY.qs[DAILY.i]; if(!q || DAILY.busy || q.style !== 'find') return;
  const say = T.showsItem ? `That's ${esc(n)}. Its capital is ${esc(key(n))}.` : `That's ${esc(n)}.`;
  if(n === q.n){ dailyAnswer(DAILY.tries === 0, `Yes! That's <b>${esc(n)}</b>.`); return; }
  DAILY.tries++; flashWrong(n);
  if(DAILY.tries < 2){ sound('wrong'); feedback(`${say} Try once more!`, 'bad'); return; }
  dailyAnswer(false, `${say} Here is <b>${esc(q.n)}</b>.`);
}
$('choices').addEventListener('click', e => {
  const b = e.target.closest('[data-dv]'); if(!b || !DAILY || DAILY.busy) return;
  const q = DAILY.qs[DAILY.i], v = b.dataset.dv, right = v === key(q.n);
  $('choices').querySelectorAll('button').forEach(x => x.disabled = true);
  b.classList.add(right ? 'picked-ok' : 'picked-bad');
  const r = $('choices').querySelector(`[data-dv="${CSS.escape(key(q.n))}"]`); if(r && !right) r.classList.add('picked-ok');
  dailyAnswer(right, right ? `Yes! ${T.flags ? `That's the flag of <b>${esc(q.n)}</b>` : `<b>${esc(v)}</b> is right`}.` : `Not quite. ${T.flags ? `The flag of ${esc(q.n)} is the one with the green outline` : `The answer is <b>${esc(key(q.n))}</b>`}.`);
});
async function dailyFinish(){
  const score = DAILY.right, first = !streakNow(player).doneToday;
  const d = player.daily || {};
  if(first){
    const s = streakNow(player);
    d.streak = d.last === yesterday() ? s.streak + 1 : 1;
    d.best = Math.max(d.best||0, d.streak); d.last = today(); d.lastScore = score;
    d.days = [...(d.days || []), today()].slice(-60);
  }
  d.plays = (d.plays||0) + 1; if(score === 10) d.perfect = (d.perfect||0) + 1;
  player.daily = d; await DB.put('players', player);
  $('mapSheet').hidden = true; $('play').hidden = true; $('dailyDone').hidden = false;
  const st = streakNow(player);
  $('dailyDoneH').textContent = score === 10 ? '10 out of 10! Perfect!' : `You got ${score} out of 10!`;
  $('dailyDoneP').innerHTML = first
    ? `<span class="bigstreak"><span aria-hidden="true">🔥</span> ${st.streak} day${st.streak===1?'':'s'} in a row</span>${st.streak > 1 ? 'Keep it going tomorrow!' : 'Come back tomorrow to make it 2 days!'}`
    : `You already did today's Daily 10, so your streak stays at ${st.streak}. Nice extra practice!`;
  $('chipText').innerHTML = 'Daily 10<small>All done</small>';
  if(score >= 8){ confetti(); sound('done'); }
  DAILY.busy = true;
  checkBadges();
}
$('dailyHome').onclick = () => popLayer();

// ---- badges ----
const BADGES = [
  {id:'first', icon:'🎉', name:'First Game', desc:'Finish your first Test, Practice or Find it game.'},
  {id:'perfect', icon:'⭐', name:'Perfect!', desc:'Get every answer right in a Test.'},
  {id:'speed', icon:'⚡', name:'Speed Star', desc:'Get every answer right with the stopwatch on.'},
  {id:'explorer', icon:'🧭', name:'Explorer', desc:'Finish a game in every place.'},
  {id:'daily1', icon:'📅', name:'Daily Player', desc:'Finish your first Daily 10.'},
  {id:'daily10', icon:'💯', name:'Daily Perfect', desc:'Get 10 out of 10 on a Daily 10.'},
  {id:'streak3', icon:'🔥', name:'3-Day Streak', desc:'Do the Daily 10 three days in a row.'},
  {id:'streak7', icon:'🔥', name:'7-Day Streak', desc:'Do the Daily 10 seven days in a row.'},
  {id:'streak30', icon:'🏆', name:'30-Day Streak', desc:'Do the Daily 10 thirty days in a row.'},
  ...TOPICS.map(t => ({id:'master-'+t.id, icon: t.flags ? '🚩' : t.showsItem ? '🏛️' : '🗺️', name:`${t.name} Master`, desc:`Learn all ${t.count} ${t.nouns === 'places' ? 'continents and oceans' : t.nouns}.`})),
];
async function computeBadges(p){
  const attempts = (await DB.all('attempts')).filter(a => a.pid === p.id && TOPIC[a.topic]);
  const items = (await DB.all('items')).filter(r => r.pid === p.id);
  const d = p.daily || {};
  const learned = Object.fromEntries(TOPICS.map(t => [t.id, items.filter(r => r.topic === t.id && r.last === 'right').length]));
  const placesPlayed = new Set(attempts.map(a => TOPIC[a.topic].group));
  const has = {
    first: attempts.length > 0,
    perfect: attempts.some(a => a.mode === 'test' && a.correct === a.total),
    speed: attempts.some(a => a.timeMs && a.correct === a.total),
    explorer: REGIONS.every(r => placesPlayed.has(r.name)),
    daily1: (d.plays||0) > 0, daily10: (d.perfect||0) > 0,
    streak3: (d.best||0) >= 3, streak7: (d.best||0) >= 7, streak30: (d.best||0) >= 30,
  };
  TOPICS.forEach(t => has['master-'+t.id] = learned[t.id] >= t.count);
  return BADGES.map(b => ({...b, earned: !!has[b.id]}));
}
async function checkBadges(){
  if(!player) return;
  const list = await computeBadges(player), had = player.badges || {};
  const fresh = list.filter(b => b.earned && !had[b.id]);
  if(!fresh.length) return;
  player.badges = {...had}; fresh.forEach(b => player.badges[b.id] = Date.now());
  await DB.put('players', player);
  toast(`${fresh[0].icon} New badge: ${fresh[0].name}!${fresh.length > 1 ? ` (and ${fresh.length-1} more)` : ''}`, [{label:'See badges', run: () => { if(!$('scrPlay').hidden) popLayer(() => openScores()); else openScores(); }}, {label:'OK', ghost:true}], 7000);
  confetti();
}

/* ===================== 11. settings, help, backup ===================== */
function openSettings(){
  const p = player.prefs;
  const panel = openPanel({title:'Settings', html:`
    <div class="toggle"><div class="txt">Stopwatch<small>Time each Test and Practice game, and try to beat your best time.</small></div><button class="switch" role="switch" id="swTimer" aria-checked="${!!p.timer}" aria-label="Stopwatch"></button></div>
    <div class="toggle"><div class="txt">Easy answers<small>Pick from 4 answers instead of typing, in Test and Practice.</small></div><button class="switch" role="switch" id="swEasy" aria-checked="${!!p.easy}" aria-label="Easy answers"></button></div>
    ${CAN_SAY ? `<div class="toggle"><div class="txt">Say names out loud<small>Read names aloud on flashcards, in Find it and in Explore. You can always tap 🔊 to hear one.</small></div><button class="switch" role="switch" id="swSay" aria-checked="${!!p.say}" aria-label="Say names out loud"></button></div>` : ''}
    <div class="toggle"><div class="txt">Sounds<small>Play a sound for right and wrong answers.</small></div><button class="switch" role="switch" id="swSound" aria-checked="${!!p.sound}" aria-label="Sounds"></button></div>
    <p class="muted" style="margin-top:8px;font-size:.9rem">These settings are just for ${esc(player.name)}.</p>
    <p class="sect">Backup</p>
    <p class="muted" style="font-size:.95rem;margin-bottom:10px">Scores are saved only on this device. Save a backup file to keep them safe, or to move them to a new device.</p>
    <div class="rowbtns" style="justify-content:flex-start"><button id="doExport">Save a backup</button><button id="doImport">Load a backup</button></div>
    <p class="muted" style="margin-top:18px;font-size:.85rem">World Geography Quiz · version ${esc(BUILD.slice(0,16).replace('T',' '))}</p>`});
  const flip = async (id, k) => { player.prefs[k] = !player.prefs[k]; panel.querySelector('#'+id).setAttribute('aria-checked', String(player.prefs[k])); await DB.put('players', player); if(k==='sound') sound('right'); if(k==='say' && player.prefs.say) say('Hello', player.name + '!'); };
  panel.querySelector('#swTimer').onclick = () => flip('swTimer','timer');
  panel.querySelector('#swSound').onclick = () => flip('swSound','sound');
  panel.querySelector('#swEasy').onclick = () => flip('swEasy','easy');
  if(CAN_SAY) panel.querySelector('#swSay').onclick = () => flip('swSay','say');
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
      <li><h3>Pick a place</h3><p>On the home screen, tap a place: the United States, the World, Europe, Africa, Asia, Oceania, Central America or South America. Then pick what to learn: <b>Countries</b>, <b>Capitals</b> or <b>Flags</b>. Want a shorter game? Big places like Europe, Africa and Asia have a <b>Part</b> row, so you can play just one part, like West Africa or the Middle East.</p></li>
      <li><h3>Look around first</h3><p>Tap <b>🔍 Explore the map</b> to look around with no quiz. Tap any place to see its name, flag and capital. Turn <b>Show names</b> off to hide the names and quiz yourself.</p></li>
      <li><h3>Pick how to play</h3><p><b>Learn:</b> flashcards, one at a time.<br><b>Find it:</b> the game shows a name, and you tap it on the map. You get 3 tries.<br><b>Practice:</b> find out right away if you are right.<br><b>Test:</b> answer them all, then press <b>Review</b> to see your score.</p></li>
      <li><h3>Tap the map</h3><p>In Practice and Test, tap a place. It turns orange. Then start typing its name in the box. Pick the name from the list and press <b>Save</b> or <b>Check</b>. Don't worry about spelling. The list helps you. Don't like typing? Turn on <b>Easy answers</b> in <b>⚙ Settings</b> to pick from 4 answers instead. Flags games always let you pick from 4.</p></li>
      <li><h3>Zoom in</h3><p>Small places are hard to tap. Pinch the map, or press <b>+</b>. Drag to move around. Press <b>⤢</b> to see the whole map again. Tiny islands have a circle you can tap. <b>Next</b> takes you to one you haven't answered.</p></li>
      <li><h3>Check your score</h3><p>After <b>Review</b>, green means right and red means missed. Press <b>Try the missed</b> to try again. Your right answers stay green.</p></li>
      <li><h3>Learn with flashcards</h3><p>Tap the card to flip it. Press <b>Got it</b> if you knew it. Press <b>Study again</b> if you didn't, and it will come back at the end. Press <b>🔊 Say it</b> to hear the answer.</p></li>
      <li><h3>Hear the names</h3><p>Tap <b>🔊</b> next to a name to hear how to say it. Want every name read out loud? Turn on <b>Say names out loud</b> in <b>⚙ Settings</b>.</p></li>
      <li><h3>Daily 10</h3><p>Every day, tap <b>Daily 10</b> at the top of the home screen for 10 quick questions from everywhere. Play every day to grow your streak 🔥 and earn badges.</p></li>
      <li><h3>Your scores</h3><p>Each player has their own scores. Tap <b>★ Scores</b> on the home screen to see your games, your badges, the ones that need practice, and everyone's scores. Tap your name to switch players. <b>⚙ Settings</b> also turns on the stopwatch and sounds.</p></li>
    </ol>
    <p class="note">Your games are saved. Stop any time, and find them later under <b>Keep going</b> on the home screen.</p>
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
      for(const k of ['us.json','world.json','europe.json','samerica.json','camerica.json','africa.json','asia.json','oceania.json','flags.json','thumbs.json']){ const r = await fetch(k + '?check=' + Date.now(), {cache:'no-store'}); if(r.ok) await cache.put(k, r); }
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
