// World Geography Quiz: Race a friend: two players on different devices see the same Find it place and race to tap it first.
// One of the game's script files, loaded in number order by index.html (see src/README.md).
// The online part is Firebase (src/race-online.js, loaded only when someone races); database.rules.json is the server's half.
// There are no names and no chat: players show up only as their emoji avatar, and join only with a code or a link.
'use strict';

/* ===================== 13. Race a friend ===================== */
// The Firebase web app's settings. Paste them from the Firebase console (Project settings → General → Your apps → Config),
// see docs/firebase-setup.md. They're meant to be public: they name the project, they don't open it. The database rules
// protect it. While this is null, Race a friend doesn't show up anywhere.
const RACE_FIREBASE = {
  apiKey: "AIzaSyBlMVV6AeSHYOl7teunY1Ef4zMog3PH8mw",
  authDomain: "world-geography-quiz-3d18a.firebaseapp.com",
  databaseURL: "https://world-geography-quiz-3d18a-default-rtdb.firebaseio.com",
  projectId: "world-geography-quiz-3d18a",
  storageBucket: "world-geography-quiz-3d18a.firebasestorage.app",
  messagingSenderId: "586568693845",
  appId: "1:586568693845:web:55e9bb8f564c076615fcdc",
};
// App Check (recommended): the reCAPTCHA site key, "6L…", and "enterprise" or "v3" (see docs/firebase-setup.md). null = off.
const RACE_APP_CHECK_KEY = "6Lc-2C0uAAAAAGUPeamuRXY6qMpJVUfsUyPWKU7L";
const RACE_APP_CHECK_PROVIDER = 'enterprise';

// How a race goes. database.rules.json holds the same limits: change them together.
const RACE_TIMES = {
  rounds: 10,        // places in a race
  round: 20000,      // most time for one place (ms)
  catchup: 6000,     // after one player finds it, the other has this long
  count: 3000,       // the 3-2-1 before each place
  reveal: 3000,      // showing where it was, after each place
  tries: 3,          // tries for each place
  lock: 1500,        // a wrong tap waits this long before the next one counts
  tie: 50,           // finds this close together both count as fastest
  away: 15000,       // between places, wait this long for a player who's away
  lobby: 30 * 60e3,  // a race that hasn't started is over after 30 minutes
  life: 24 * 3600e3, // a started race is deleted after a day
};
const raceTime = k => (window.WGQ_TEST && WGQ_TEST.raceTimes && WGQ_TEST.raceTimes[k] != null) ? WGQ_TEST.raceTimes[k] : RACE_TIMES[k]; // tests can make races quicker
// Topics to race on: big places everyone can tap on a phone. Capitals, Land & Water, landmarks, cities and parks are left out.
const RACE_TOPIC_RE = /^(world|[a-z][a-z]-(countries|states|flags))$/;
const HEAD_STARTS = [0, 2, 4, 6]; // seconds; the host can give either player a head start
// No 0/O and no 1/I/L: codes are read aloud and typed on phones (the same letters as Chess Quest)
const RACE_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function raceCode(){ return [...crypto.getRandomValues(new Uint32Array(6))].map(x => RACE_LETTERS[x % RACE_LETTERS.length]).join(''); }
function raceCleanCode(text){ const c = String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); return c.length === 6 && [...c].every(x => RACE_LETTERS.includes(x)) ? c : null; }
const raceLink = code => location.origin + location.pathname + '?race=' + code;
// Only ever one of the game's own avatars, whatever is stored, so another device can't put anything else on this screen
const raceAv = i => Number.isInteger(i) && i >= 0 && i < AVATARS.length ? AVATARS[i] : '❔';
const raceOther = s => s === 'a' ? 'b' : 'a';
const raceSecs = ms => (ms / 1000).toFixed(1) + ' s';

/* ---- the race record, as saved online ----
  races/{code}: {
    v: 1, created, expires,     // ms; a race is deleted after expires (30 minutes before it starts, a day after)
    topic, items: [names],      // what to find, picked by the device that made the race, the same for both
    seats: {a, b},              // anonymous player ids; a made the race (the host), b joined
    avatars: {a, b},            // numbers into AVATARS: no names
    head: {a, b},               // head start in seconds (0, 2, 4 or 6), set by the host before the start
    ready: {a, b},              // true once that device has its map loaded
    status,                     // waiting (for b) → joined → playing → over; waiting or joined → canceled
    canceledBy, left,           // 'a' or 'b': who canceled before the start, or left during the race
    presence: {a, b},           // false while that player is away
    rounds: [{at, end, a: {found, ms, tries, t}, b}],  // at: when the place shows (server time); end: when it was over;
                                // each player's own time from seeing the place to finding it, so a slow connection doesn't lose
    rematch,                    // the code of the next race, once someone starts one
  }
  Each change below returns the new record, or null when it isn't allowed. database.rules.json makes the same checks. */
const raceSeat = (r, uid) => r && r.seats ? (r.seats.a === uid ? 'a' : r.seats.b === uid ? 'b' : null) : null;
const raceRoundList = r => { const rs = r && r.rounds, out = []; if(rs) for(let k = 0; rs[k]; k++) out.push(rs[k]); return out; };
const raceRoundsWith = (r, i, R) => { const out = {}; raceRoundList(r).forEach((x, k) => out[k] = x); out[i] = R; return out; };
const raceNotStarted = r => r && (r.status === 'waiting' || r.status === 'joined');
function raceNewRecord({uid, avatar, topic, items, now}){
  return {v: 1, created: Math.round(now), expires: Math.round(now + raceTime('lobby')), topic, items, seats: {a: uid}, avatars: {a: avatar}, head: {a: 0, b: 0}, status: 'waiting'};
}
function raceWithJoin(r, uid, avatar, now){
  if(!r) return null;
  if(raceSeat(r, uid)) return r;
  if(r.status !== 'waiting' || r.seats.b || r.expires < now) return null;
  return {...r, seats: {...r.seats, b: uid}, avatars: {...r.avatars, b: avatar}, status: 'joined'};
}
function raceWithReady(r, uid){
  const s = raceSeat(r, uid);
  return s && raceNotStarted(r) && !(r.ready && r.ready[s]) ? {...r, ready: {...r.ready, [s]: true}} : null;
}
function raceWithHead(r, uid, seat, secs){
  return raceSeat(r, uid) === 'a' && raceNotStarted(r) && (seat === 'a' || seat === 'b') && HEAD_STARTS.includes(secs) ? {...r, head: {...r.head, [seat]: secs}} : null;
}
function raceWithStart(r, uid, now){
  if(raceSeat(r, uid) !== 'a' || r.status !== 'joined' || !(r.ready && r.ready.a && r.ready.b)) return null;
  return {...r, status: 'playing', expires: Math.round(now + raceTime('life')), rounds: {0: {at: Math.round(now + raceTime('count'))}}};
}
// Any race that hasn't started can be canceled, by either player
function raceWithCancel(r, uid){ const s = raceSeat(r, uid); return s && raceNotStarted(r) ? {...r, status: 'canceled', canceledBy: s} : null; }
function raceWithLeave(r, uid){ const s = raceSeat(r, uid); return s && r.status === 'playing' ? {...r, status: 'over', left: s} : null; }
function raceWithResult(r, uid, i, found, ms, tries, now){
  const s = raceSeat(r, uid), R = r && raceRoundList(r)[i];
  if(!s || r.status !== 'playing' || !R || R.end || R[s] || now < R.at) return null;
  const res = {found: !!found, ms: found ? Math.max(250, Math.min(raceTime('round'), Math.round(ms))) : 0, tries: Math.max(0, Math.min(3, tries | 0)), t: Math.round(Math.max(now, R.at))};
  return {...r, rounds: raceRoundsWith(r, i, {...R, [s]: res})};
}
// A place is over when both players are done, its time is up, or the second player's catch-up time is up
function raceRoundOver(r, i, now){
  const R = raceRoundList(r)[i]; if(!R || R.end || now < R.at) return false;
  if(R.a && R.b) return true;
  if(now >= R.at + raceTime('round')) return true;
  const found = ['a', 'b'].map(s => R[s]).filter(x => x && x.found).map(x => x.t);
  return found.length > 0 && now >= Math.min(...found) + raceTime('catchup');
}
function raceWithEnd(r, i, now){ return r && r.status === 'playing' && raceRoundOver(r, i, now) ? {...r, rounds: raceRoundsWith(r, i, {...raceRoundList(r)[i], end: Math.round(Math.max(now, raceRoundList(r)[i].at))})} : null; }
function raceWithNext(r, i, now){
  const list = raceRoundList(r), R = list[i];
  if(!r || r.status !== 'playing' || !R || !R.end || list[i + 1] || now < R.end + raceTime('reveal')) return null;
  if(i + 1 >= r.items.length) return {...r, status: 'over'};
  return {...r, rounds: raceRoundsWith(r, i + 1, {at: Math.round(now + raceTime('count'))})};
}
function raceWithRematch(r, code){ return r && r.status === 'over' && !r.rematch ? {...r, rematch: code} : null; }
// The points: 2 for the fastest find (after head starts), 1 for any other find, 0 for a miss
function raceScore(r){
  const head = r.head || {}, total = {a: 0, b: 0}, list = [];
  raceRoundList(r).forEach((R, i) => {
    if(!R.end) return;
    const adj = {};
    ['a', 'b'].forEach(s => { const x = R[s]; if(x && x.found) adj[s] = Math.max(0, x.ms - (head[s] || 0) * 1000); });
    const best = Math.min(...Object.values(adj)), pts = {a: 0, b: 0};
    for(const s in adj) pts[s] = adj[s] - best <= raceTime('tie') ? 2 : 1;
    total.a += pts.a; total.b += pts.b;
    list.push({i, n: r.items[i], R, pts});
  });
  return {total, list};
}
// The places to race on: no more than 2 tiny ones (with tap circles), not one after the other, and none from the last race if there are enough others
async function racePick(tid, avoid = []){
  if(window.WGQ_TEST && WGQ_TEST.raceItems) return WGQ_TEST.raceItems.slice();
  const m = await loadMap(TOPIC[tid].map), n = Math.min(raceTime('rounds'), m.items.length);
  const tiny = new Set(m.items.filter(i => i.dot).map(i => i.n)), all = shuffle(m.items.map(i => i.n));
  const fresh = all.filter(x => !avoid.includes(x)), pool = fresh.length >= n ? fresh : [...fresh, ...all.filter(x => avoid.includes(x))];
  const out = []; let small = 0;
  for(const x of pool){ if(out.length >= n) break; if(tiny.has(x)){ if(small >= 2) continue; small++; } out.push(x); }
  for(const x of pool){ if(out.length >= n) break; if(!out.includes(x)) out.push(x); } // a map of mostly tiny places (Oceania)
  for(let k = 1; k < out.length; k++) if(tiny.has(out[k]) && tiny.has(out[k - 1])){
    const j = out.findIndex((y, idx) => idx > k + 1 && !tiny.has(y) && !tiny.has(out[idx - 1]) && !(out[idx + 1] && tiny.has(out[idx + 1])));
    if(j > 0) [out[k], out[j]] = [out[j], out[k]];
  }
  return out;
}

/* ---- where races are kept: Firebase, or (for the automatic tests) this browser ---- */
// window.WGQ_RACE_BACKEND = 'local' keeps races in a shared worker (src/race-local.js) that every tab of the game talks to,
// so two tabs in one browser race each other like two phones would. Each tab is its own player (its id is in sessionStorage).
function raceLocalBackend(){
  const port = new SharedWorker('src/race-local.js').port, waiting = {}, subs = {};
  const copy = x => x == null ? null : JSON.parse(JSON.stringify(x));
  let n = 0;
  port.onmessage = e => {
    const d = e.data;
    if(d.id){ const done = waiting[d.id]; delete waiting[d.id]; done && done(d.reply); return; }
    (subs[d.code] || []).forEach(cb => cb(copy(d.rec)));
  };
  port.start();
  const ask = msg => new Promise(done => { const id = ++n; waiting[id] = done; port.postMessage({...msg, id}); });
  let uid = null; try{ uid = sessionStorage.getItem('wgq-race-uid'); }catch(e){}
  if(!uid){ uid = 'local-' + Math.random().toString(36).slice(2, 10); try{ sessionStorage.setItem('wgq-race-uid', uid); }catch(e){} }
  // like a Firebase transaction: read, change, and save only if nobody else saved in between (otherwise try again)
  async function transact(code, change){
    for(let k = 0; k < 25; k++){
      const cur = await ask({op: 'read', code}); if(!cur.rec) return false;
      const next = change(copy(cur.rec)); if(next === null) return false;
      if((await ask({op: 'cas', code, ver: cur.ver, rec: next})).ok) return true;
    }
    return false;
  }
  return {
    kind: 'local', uid, serverNow: () => Date.now(),
    async create(make){ for(;;){ const code = raceCode(); if((await ask({op: 'cas', code, ver: 0, rec: make(code)})).ok) return code; } },
    async read(code){ return copy((await ask({op: 'read', code})).rec); },
    transact,
    async remove(code){ return transact(code, () => undefined); },
    watch(code, cb){ (subs[code] = subs[code] || []).push(cb); ask({op: 'read', code}).then(cur => cb(copy(cur.rec))); return () => { subs[code] = subs[code].filter(f => f !== cb); }; },
    setPresence(code, seat){
      const mark = on => port.postMessage({op: 'presence', code, seat, on}), off = () => mark(false);
      mark(true); addEventListener('pagehide', off);
      return () => { removeEventListener('pagehide', off); off(); };
    },
    async sweep(){},
  };
}
const raceOnline = () => window.WGQ_RACE_BACKEND === 'local' || (!!RACE_FIREBASE && window.WGQ_RACE_BACKEND !== 'off'); // 'off': as if not set up (for the tests)
let raceBackendP = null;
function raceBackend(){
  return raceBackendP || (raceBackendP = (async () => {
    if(window.WGQ_RACE_BACKEND === 'local') return raceLocalBackend();
    const mod = await import('./race-online.js');
    return mod.createRaceBackend({config: RACE_FIREBASE, appCheckKey: RACE_APP_CHECK_KEY, appCheckProvider: RACE_APP_CHECK_PROVIDER, makeCode: raceCode});
  })().catch(e => { raceBackendP = null; throw e; })); // let the next try start over (after coming back online)
}

/* ---- the race on this device ---- */
let RACE = null; // {backend, code, seat, rec, …} while the race screen is open
const raceAvOf = s => raceAv(RACE.rec && RACE.rec.avatars && RACE.rec.avatars[s]);
const raceAway = (r, s) => !!(r.presence && r.presence[s] === false);
const raceMyAvatar = () => ((player && player.avatar) || 0) % AVATARS.length;
// a join link (?race=K7QF2M) is kept until a player is picked, then joined
(() => {
  const m = location.search.match(/[?&]race=([A-Za-z0-9]{6})/); if(!m) return;
  try{ sessionStorage.setItem('wgq-race-link', m[1].toUpperCase()); }catch(e){}
  const rest = location.search.replace(/[?&]race=[^&]*/, '').replace(/^&/, '?');
  try{ history.replaceState(history.state, '', location.pathname + rest + location.hash); }catch(e){}
})();
function raceFromLink(){
  if(!player || RACE || !raceOnline()) return;
  let code = null; try{ code = sessionStorage.getItem('wgq-race-link'); sessionStorage.removeItem('wgq-race-link'); }catch(e){}
  if(code){ raceJoin(code); return; }
  // back after the game was closed in the middle of a race: offer to go back to it
  const saved = (LS.get('race') || '').split('|');
  if(raceFromLink.asked) return; raceFromLink.asked = true; // ask once
  if(saved.length === 2 && raceCleanCode(saved[0])) raceBackend().then(async b => {
    const r = await b.read(saved[0]);
    if(RACE || !r || raceSeat(r, b.uid) !== saved[1] || !(raceNotStarted(r) || r.status === 'playing')){ LS.set('race', ''); return; }
    toast("You're in a race.", [{label: 'Back to it', run: () => { if(!RACE) raceOpen(saved[0], saved[1]); }}, {label: 'Not now', ghost: true, run: () => raceQuit(saved[0])}], 0);
  }).catch(() => {});
}
async function raceQuit(code){ // "Not now" on that question: the race goes on without this player, or is canceled if it hasn't started
  LS.set('race', '');
  try{ const b = await raceBackend(); await b.transact(code, r => raceWithCancel(r, b.uid) || raceWithLeave(r, b.uid)); }catch(e){}
}

// the race screen: the play screen, with the race's own box for the lobby and the end, and the map for the places
let raceFrom = 'scrHome'; // the screen the race was started from, to go back to
function raceScreen(title){
  raceFrom = SCREENS.find(id => !$(id).hidden && id !== 'scrPlay') || 'scrHome';
  returnTo = raceFrom; showScreen('scrPlay'); pushLayer(raceClose);
  ['mapSheet', 'play', 'results', 'flash', 'dailyDone'].forEach(id => $(id).hidden = true);
  $('raceBox').hidden = false; $('clock').hidden = true; $('tally').textContent = ''; $('sub').textContent = '';
  $('chipText').innerHTML = `🏁 Race a friend<small>${esc(title)}</small>`;
  RACE = {screen: true};
}
function raceBox(html){ $('raceBox').innerHTML = html; }
// When connecting fails, a line under "Couldn't connect" says why, for whoever looks after the game's Firebase project
function raceWhy(e){
  const code = String((e && (e.code || e.message)) || e || 'unknown').slice(0, 80);
  const hint = /admin-restricted-operation|operation-not-allowed/.test(code) ? 'Anonymous sign-in is turned off in Firebase (Authentication → Sign-in method).'
    : /api-key|referer|referrer/.test(code) ? "Firebase didn't accept the API key from this site (Google Cloud → Credentials)."
    : /app-check|appCheck|recaptcha/i.test(code) ? "App Check didn't accept this device (check the reCAPTCHA key and its domain, or turn enforcement off)."
    : /permission.denied/i.test(code) ? "The database refused it: publish database.rules.json in Firebase (Realtime Database → Rules), or check App Check enforcement."
    : /network|offline|timeout/i.test(code) ? 'No connection to Firebase.' : '';
  return `<p class="raceerr">For a grown-up: ${esc(hint)} <code>${esc(code)}</code></p>`;
}
const raceHomeBtn = '<div class="rowbtns center"><button class="primary" data-race="home">Back</button></div>';
async function raceCreate(tid, avoid){
  if(!player || !TOPIC[tid]) return;
  if(!RACE) raceScreen(TOPIC[tid].name); else raceStop(true);
  raceBox(`<h2>🏁 Race a friend</h2><p>Making your race…</p>`);
  const here = RACE;
  try{
    const b = await raceBackend(), items = await racePick(tid, avoid || []);
    const code = await b.create(() => raceNewRecord({uid: b.uid, avatar: raceMyAvatar(), topic: tid, items, now: b.serverNow()}));
    if(RACE !== here) return raceDrop(b, code); // left meanwhile
    raceOpen(code, 'a');
  }catch(e){ if(RACE === here) raceBox(`<h2>🏁 Race a friend</h2><p>Couldn't connect. Check your internet connection, then try again.</p>${raceWhy(e)}${raceHomeBtn}`); }
}
async function raceDrop(b, code){ try{ await b.remove(code); }catch(e){} }
async function raceJoin(code){
  if(!player) return;
  if(!RACE) raceScreen('Joining…'); else raceStop(true);
  raceBox(`<h2>🏁 Race a friend</h2><p>Joining race ${esc(code)}…</p><div class="rowbtns center"><button data-race="home">Cancel</button></div>`);
  const here = RACE, fail = msg => { if(RACE === here) raceBox(`<h2>🏁 Race a friend</h2><p>${msg}</p>${raceHomeBtn}`); };
  try{
    const b = await raceBackend(), r = await b.read(code);
    if(RACE !== here) return;
    if(!r || r.expires < b.serverNow()) return fail(`There's no race with the code <b>${esc(code)}</b>. Check the code, or ask your friend for a new one.`);
    if(!TOPIC[r.topic] || r.v !== 1) return fail('This race is from a newer version of the game. Update the game (⚙ Settings), then try again.');
    const mine = raceSeat(r, b.uid);
    if(mine) return raceOpen(code, mine);
    if(r.status !== 'waiting' || r.seats.b) return fail(r.status === 'canceled' ? 'That race was canceled. Ask your friend for a new code.' : 'That race already has two players. Ask your friend for a new code.');
    const ok = await b.transact(code, x => raceWithJoin(x, b.uid, raceMyAvatar(), b.serverNow()));
    if(RACE !== here) return;
    if(!ok) return fail('Someone else joined that race first. Ask your friend for a new code.');
    raceOpen(code, 'b');
  }catch(e){ fail(`Couldn't connect. Check your internet connection, then try again.</p>${raceWhy(e)}<p>`); }
}
async function raceOpen(code, seat){
  if(!RACE) raceScreen('');
  const b = await raceBackend(), R0 = Object.assign(RACE, {backend: b, code, seat, rec: null, round: -1, view: '', recorded: {}, prepared: false, busyUntil: 0});
  LS.set('race', code + '|' + seat);
  R0.unwatch = b.watch(code, rec => { if(RACE === R0) raceUpdate(rec); });
  R0.stopPresence = b.setPresence(code, seat);
  R0.timer = setInterval(() => { if(RACE === R0) raceTick(); }, 100);
  b.sweep();
}
// stop watching this race (when leaving it, or moving on to a rematch); the screen stays
function raceStop(keep){
  const R0 = RACE; if(!R0) return;
  clearInterval(R0.timer); R0.unwatch && R0.unwatch(); R0.stopPresence && R0.stopPresence();
  RACE = keep ? {screen: true} : null;
}
// Leaving the race screen (← or the phone's back button): a race that hasn't started is canceled; one that's going on is left
function raceClose(){
  const R0 = RACE; if(!R0) return;
  const r = R0.rec, b = R0.backend, code = R0.code;
  raceStop(false); LS.set('race', '');
  if(b && r){
    if(r.status === 'waiting' && !r.seats.b){ b.remove(code); toast('Race canceled.'); }
    else if(raceNotStarted(r)){ b.transact(code, x => raceWithCancel(x, b.uid)); toast('Race canceled.'); }
    else if(r.status === 'playing') b.transact(code, x => raceWithLeave(x, b.uid));
  }
  raceRestoreBar(); $('raceBox').hidden = true; $('raceBox').innerHTML = ''; $('clock').hidden = true; $('clock').classList.remove('low');
  showScreen(raceFrom); itemsSaved().then(() => { if(raceFrom === 'scrRegion') renderRegion(); else renderHome(); });
}
// the race uses the Find it bar without its other buttons
function raceHideBar(){
  ['.combo', '#submit', '.nav', '#reviewBtn', '#skipBtn', '#choices', '#exTools', '#exInfo'].forEach(sel => { const el = $('play').querySelector(sel); if(el && !el.hidden){ el.hidden = true; el.setAttribute('data-rhide', ''); } });
}
function raceRestoreBar(){ $('play').querySelectorAll('[data-rhide]').forEach(el => { el.hidden = false; el.removeAttribute('data-rhide'); }); $('findQ').hidden = true; $('findQ').innerHTML = ''; feedback(''); }

async function racePrepare(){
  const R0 = RACE, r = R0.rec, t = TOPIC[r.topic];
  R0.prepared = 'loading';
  try{
    if(!t) throw new Error('topic');
    const m = await loadMap(t.map); if(t.flags) await loadFlags(t.map);
    if(r.items.some(n => !m.by[n])) throw new Error('update'); // a place this version of the game doesn't have
    if(RACE !== R0) return;
    R0.prepared = true;
    R0.backend.transact(R0.code, x => raceWithReady(x, R0.backend.uid));
    raceRender();
  }catch(e){
    if(RACE !== R0) return;
    R0.prepared = e && e.message === 'update' ? 'update' : 'failed';
    raceRender();
  }
}
function raceUpdate(rec){
  const R0 = RACE;
  if(!rec){ if(R0.rec && R0.rec.status === 'over') return; R0.rec = null; R0.view = 'gone'; raceStop(true); raceBox(`<h2>🏁 Race a friend</h2><p>This race isn't there anymore. Ask your friend for a new code.</p>${raceHomeBtn}`); return; }
  R0.rec = rec;
  if(!raceSeat(rec, R0.backend.uid)){ R0.view = 'gone'; raceBox(`<h2>🏁 Race a friend</h2><p>You're not in this race.</p>${raceHomeBtn}`); return; }
  if(!R0.prepared && rec.status !== 'canceled' && rec.status !== 'over') racePrepare();
  if(rec.status === 'canceled' || rec.status === 'over') LS.set('race', '');
  raceRender();
}
function raceRender(){
  const R0 = RACE, r = R0.rec; if(!r) return;
  if(r.status === 'playing' && R0.prepared !== true){ // back in a race that has started: the map first
    R0.view = 'loading';
    raceBox(`<h2>🏁 Race a friend</h2><p>${R0.prepared === 'update' ? "This race has places this version of the game doesn't know. Update the game (⚙ Settings)." : R0.prepared === 'failed' ? "The map couldn't load. Check your internet connection." : 'Getting the map ready…'}</p>${R0.prepared === 'loading' ? '' : raceHomeBtn}`);
    return;
  }
  if(r.status === 'playing'){ if(R0.view !== 'play') raceStartView(); raceTick(); return; }
  if(r.status === 'over'){ raceEndView(); return; }
  raceLobby();
}

/* ---- before the start: the code, who's here, head starts, and Cancel ---- */
function raceLobby(){
  const R0 = RACE, r = R0.rec, me = R0.seat, them = raceOther(me), t = TOPIC[r.topic], av = raceAvOf;
  R0.view = 'lobby';
  $('chipText').innerHTML = `🏁 Race a friend<small>${esc(t ? t.name : '')}</small>`;
  let html = `<h2>🏁 Race a friend</h2><p class="racetopic"><b>${esc(t ? t.name : '')}</b> · ${r.items.length} ${r.items.length === 1 ? "place" : "places"} to find</p>`;
  const now = R0.backend.serverNow();
  if(R0.prepared === 'update') html += `<p>This race has places this version of the game doesn't know. Update the game (⚙ Settings), or ask your friend to update theirs.</p>`;
  else if(R0.prepared === 'failed') html += `<p>The map couldn't load. Check your internet connection.</p><div class="rowbtns center"><button data-race="retry">Try again</button></div>`;
  if(r.status === 'canceled'){
    raceBox(html + `<p class="racenote">${r.canceledBy === me ? 'You canceled the race.' : `${av(them)} canceled the race.`}</p>${raceHomeBtn}`); return;
  }
  if(r.expires < now){ // nobody can join or start it now, and it's deleted soon
    raceBox(html + `<p class="racenote">This race ran out of time before it started.</p>${raceHomeBtn}`); return;
  }
  if(r.status === 'waiting' && R0.invite){ // the next race with the same friend: they join from their end screen
    html += `<p class="racenote">${R0.invite} can join from their screen. No code needed.</p>
      <p class="muted racewait">Waiting for ${R0.invite} to join…</p>
      <p class="racehow">Not there anymore? Send them this code: <b class="racecodesmall">${esc(R0.code)}</b></p>`;
  } else if(r.status === 'waiting'){
    html += `<p>Send your friend this code. They tap <b>🏁 Race a friend</b> on the home screen and type it in.</p>
      <p class="racecode" aria-label="Race code ${[...R0.code].join(' ')}">${esc(R0.code)}</p>
      <div class="rowbtns center"><button data-race="share">📤 Send the link</button></div>
      <p class="muted racewait">Waiting for your friend to join…</p>`;
  } else {
    const st = s => raceAway(r, s) ? 'is away' : r.ready && r.ready[s] ? 'is ready ✓' : 'is getting the map…';
    html += `<div class="racevs"><span class="rv"><span class="ra">${av('a')}</span>${me === 'a' ? 'You' : ''}<small>${st('a')}</small></span><span class="rvs">vs</span><span class="rv"><span class="ra">${av('b')}</span>${me === 'b' ? 'You' : ''}<small>${st('b')}</small></span></div>`;
    const head = r.head || {};
    if(me === 'a'){
      html += `<p class="sect">Head start (for a younger player)</p>` + ['a', 'b'].map(s => `<div class="racehead"><span>${av(s)} ${s === me ? 'You' : 'Your friend'}</span><div class="chips pick" role="group" aria-label="Head start for ${s === me ? 'you' : 'your friend'}">${HEAD_STARTS.map(h => `<button data-head="${s}" data-secs="${h}" aria-pressed="${(head[s] || 0) === h}">${h ? h + ' s' : 'None'}</button>`).join('')}</div></div>`).join('');
      const canGo = r.ready && r.ready.a && r.ready.b && !raceAway(r, 'b');
      html += `<div class="rowbtns center"><button class="primary" data-race="start"${canGo ? '' : ' disabled'}>Start the race!</button></div>${canGo ? '' : `<p class="muted racewait">${raceAway(r, 'b') ? `Waiting for ${av('b')} to come back…` : 'Getting both maps ready…'}</p>`}`;
    } else {
      const given = ['a', 'b'].filter(s => head[s]).map(s => `${s === me ? 'You get' : `${av(s)} gets`} a ${head[s]}-second head start.`).join(' ');
      html += `${given ? `<p>${given}</p>` : ''}<p class="muted racewait">${raceAway(r, 'a') ? `${av('a')} is away…` : `Waiting for ${av('a')} to start the race…`}</p>`;
    }
  }
  html += `<p class="racehow">${r.items.length} ${r.items.length === 1 ? "place" : "places"}, one at a time. Find it first for 2 points, find it at all for 1.</p><div class="rowbtns center"><button class="danger" data-race="cancel">Cancel race</button></div>`;
  raceBox(html);
}
async function raceShare(){
  const code = RACE && RACE.code; if(!code) return;
  const url = raceLink(code), text = `Race me in World Geography Quiz! The code is ${code}.`;
  if(navigator.share){ try{ await navigator.share({title: 'Race me!', text, url}); return; }catch(e){ if(e && e.name === 'AbortError') return; } }
  try{ await navigator.clipboard.writeText(url); toast('Link copied. Send it to your friend!'); }catch(e){ toast(`Tell your friend the code: ${code}`); }
}

/* ---- the race: one place at a time ---- */
function raceStartView(){
  const R0 = RACE, r = R0.rec;
  R0.view = 'play'; R0.round = -1;
  T = TOPIC[r.topic]; M = MAPDATA[T.map]; drawMap();
  $('raceBox').hidden = true; $('mapSheet').hidden = false; $('play').hidden = false; $('legend').innerHTML = '';
  raceHideBar(); $('findQ').hidden = false; $('clock').hidden = false;
  $('chipText').innerHTML = `🏁 Race a friend<small>${esc(T.name)}</small>`;
  showWholeMap(true);
}
function raceSet(id, html){ const d = RACE.drawn || (RACE.drawn = {}); if(d[id] !== html){ d[id] = html; $(id).innerHTML = html; } } // only what changed, ten times a second
function racePaint(mark){ NAMES.forEach(n => setPlaceClass(n, (mark && mark[n]) || '')); }
function raceEnterRound(i){
  const R0 = RACE, R = raceRoundList(R0.rec)[i];
  Object.assign(R0, {round: i, shown: false, shownAt: 0, revealed: false, tries: 0, lastWrong: null, firstWrong: null, lockUntil: 0, mine: R[R0.seat] || null});
  R0.drawn = {}; current = null; racePaint(); cancelAnimationFrame(anim); setVB({x: 0, y: 0, w: VW}); // every place starts from the whole map, on both devices
  feedback('');
}
function raceTick(){
  const R0 = RACE, r = R0 && R0.rec; if(!r || !R0.backend) return;
  const b = R0.backend, now = b.serverNow(), me = R0.seat, them = raceOther(me);
  if(raceNotStarted(r)){ // the lobby: keep "is away" and the time limit up to date
    const sig = JSON.stringify([r.presence, r.ready, r.status, r.expires < now]);
    if(sig !== R0.lobbySig){ R0.lobbySig = sig; raceLobby(); }
    return;
  }
  if(r.status !== 'playing' || R0.view !== 'play') return;
  const list = raceRoundList(r), i = list.length - 1, R = list[i], n = r.items.length, av = raceAvOf;
  if(i < 0) return;
  if(i !== R0.round) raceEnterRound(i);
  const {total} = raceScore(r);
  raceSet('tally', `<span class="racescore">${av(me)} You <b>${total[me]}</b></span> <span class="racescore">${av(them)} <b>${total[them]}</b></span>`);
  const target = r.items[i], theirs = R[them], mine = R[me] || R0.mine;
  const status = raceAway(r, them) ? `${av(them)} is away` : theirs ? (theirs.found ? `${av(them)} found it! ✅` : `${av(them)} is out of tries`) : `${av(them)} is looking…`;
  if(now < R.at){ // 3, 2, 1
    const left = Math.ceil((R.at - now) / 1000);
    $('selLabel').textContent = `Place ${i + 1} of ${n}: get ready!`;
    raceSet('findQ', `<span class="racecount" aria-live="off">${left}</span>`);
    raceSet('sub', raceAway(r, them) ? status : `${av(them)} is ready`);
    $('clock').textContent = fmtTime(raceTime('round')); $('clock').classList.remove('low');
    return;
  }
  if(!R.end){
    if(!R0.shown){ // the place, the same moment on both devices; each player's time starts when it's on their own screen
      R0.shown = true;
      raceSet('findQ', T.flags ? `${flagImg(target, 'big')}<span>Find the ${T.itemWord || 'country'} with this flag</span>` : `<span>${esc(findAsk(target))}</span>`);
      R0.shownAt = performance.now(); requestAnimationFrame(() => { if(RACE === R0 && R0.round === i) R0.shownAt = performance.now(); });
    }
    const caught = theirs && theirs.found ? theirs.t + raceTime('catchup') : Infinity, ends = Math.min(R.at + raceTime('round'), caught);
    const left = Math.max(0, ends - now);
    $('clock').textContent = fmtTime(Math.ceil(left / 1000) * 1000); $('clock').classList.toggle('low', left <= 5000);
    $('selLabel').textContent = mine ? (mine.found ? 'You found it!' : 'Watch where it is…') : theirs && theirs.found ? `Hurry! ${av(them)} found it!` : `Place ${i + 1} of ${n}`;
    raceSet('sub', status);
    if(raceRoundOver(r, i, now) && performance.now() > R0.busyUntil){ R0.busyUntil = performance.now() + 600; b.transact(R0.code, x => raceWithEnd(x, i, b.serverNow())); }
    return;
  }
  if(!R0.revealed) raceReveal(i);
  $('clock').textContent = fmtTime(0); $('clock').classList.remove('low');
  // after the reveal, on to the next place, waiting a little for a player who's away
  const more = i + 1 < n, wait = more && raceAway(r, them);
  if(now >= R.end + raceTime('reveal')){
    if(wait && now < R.end + raceTime('reveal') + raceTime('away')){ raceSet('sub', `Waiting for ${av(them)}…`); return; }
    if(performance.now() > R0.busyUntil){ R0.busyUntil = performance.now() + 600; b.transact(R0.code, x => raceWithNext(x, i, b.serverNow())); }
  }
}
function raceTap(n){
  const R0 = RACE, r = R0 && R0.rec; if(!r || r.status !== 'playing' || R0.view !== 'play') return;
  const i = R0.round, R = raceRoundList(r)[i]; if(!R || R.end || !R0.shown || R0.mine || R[R0.seat]) return;
  const target = r.items[i], now = performance.now();
  if(now < R0.lockUntil){ flashWrong(n); return; } // a moment's wait after a wrong tap, so tapping everywhere doesn't pay
  if(n === target){
    const ms = now - R0.shownAt; R0.mine = {found: true, ms};
    sound('right'); setPlaceClass(n, 'ok');
    feedback(`Yes! That's <b>${esc(the(n))}</b>! ${raceSecs(ms)}`, 'ok');
    raceSend(i, true, ms); return;
  }
  if(n === R0.lastWrong){ feedback(`That's ${esc(the(n))} again. Try another place!`, 'bad'); flashWrong(n); return; } // a second tap on the same place doesn't use up a try
  R0.tries++; R0.lastWrong = n; if(!R0.firstWrong) R0.firstWrong = n;
  sound('wrong'); flashWrong(n); noteMix(target, n);
  const left = raceTime('tries') - R0.tries;
  if(left <= 0){ R0.mine = {found: false}; feedback(`That's ${esc(the(n))}. Out of tries! Watch where it is…`, 'bad'); raceSend(i, false, 0); return; }
  R0.lockUntil = now + raceTime('lock');
  feedback(`That's ${esc(the(n))}. Try again! ${left} ${left === 1 ? 'try' : 'tries'} left.`, 'bad');
}
function raceSend(i, found, ms){
  const R0 = RACE, b = R0.backend, wrong = R0.tries;
  b.transact(R0.code, r => raceWithResult(r, b.uid, i, found, ms, wrong, b.serverNow()));
}
function raceReveal(i){
  const R0 = RACE, r = R0.rec, me = R0.seat, them = raceOther(me), R = raceRoundList(r)[i], target = r.items[i], av = raceAvOf;
  R0.revealed = true;
  const pts = (raceScore(r).list.find(x => x.i === i) || {pts: {a: 0, b: 0}}).pts;
  const line = (s, who) => { const x = R[s]; return x && x.found ? `${who} <b>+${pts[s]}</b> (${raceSecs(x.ms)})` : `${who} missed it`; };
  const mine = R[me];
  current = target; racePaint({[target]: mine && mine.found ? 'ok' : 'sel'});
  if(!sinks(ITEM[target])){ svg.appendChild(els[target]); raiseDots(target); }
  focusItem(target);
  const late = R0.mine && R0.mine.found && !(mine && mine.found) ? ' Time was up before your tap got there.' : '';
  feedback(`It's <b>${esc(the(target))}</b>. ${line(me, 'You')} · ${line(them, av(them))}.${late} ${mine && mine.found ? '' : mixTip(target, R0.firstWrong)}`, mine && mine.found ? 'ok' : 'bad');
  $('selLabel').textContent = i + 1 < r.items.length ? 'Here it is' : 'That was the last one!';
  // racing counts as practice: a find on the first try is learned, anything else needs more practice
  if(R0.shown && !R0.recorded[i]){ R0.recorded[i] = true; recordItem(player.id, r.topic, target, !!(mine && mine.found && mine.tries === 0)); }
}

/* ---- the end: the score, what each player found, Rematch and Practice these ---- */
function raceEndView(){
  const R0 = RACE, r = R0.rec, me = R0.seat, them = raceOther(me), av = raceAvOf, {total, list} = raceScore(r);
  const first = R0.view !== 'end'; R0.view = 'end';
  raceRestoreBar();
  $('mapSheet').hidden = true; $('play').hidden = true; $('raceBox').hidden = false; $('clock').hidden = true;
  $('sub').textContent = ''; $('tally').textContent = '';
  const my = total[me], their = total[them];
  const head = r.left ? (r.left === me ? 'You left the race' : `${av(them)} had to go`) : my > their ? `You won, ${my} to ${their}!` : my < their ? `${av(them)} won, ${their} to ${my}!` : `It's a tie, ${my} to ${my}!`;
  const sub = r.left ? `The score was ${my} to ${their}.` : my < their ? 'Great racing! Every place you found counted.' : my === their ? 'Neck and neck!' : 'Great racing!';
  const together = list.reduce((k, x) => k + ['a', 'b'].filter(s => x.R[s] && x.R[s].found).length, 0);
  const fast = list.filter(x => x.R[me] && x.R[me].found).sort((x, y) => x.R[me].ms - y.R[me].ms)[0];
  const cell = (x, s) => x.R[s] && x.R[s].found ? `✅ ${raceSecs(x.R[s].ms)}` : '—';
  const misses = list.filter(x => !(x.R[me] && x.R[me].found && x.R[me].tries === 0)).map(x => x.n);
  // the other player already started the next race: show what it's on (read from the new race), and Join
  const theirRematch = r.rematch && r.rematch !== R0.madeRematch;
  if(theirRematch && (!R0.next || R0.next.code !== r.rematch)){
    R0.next = {code: r.rematch, topic: null};
    R0.backend.read(r.rematch).then(x => { if(RACE === R0 && R0.next.code === r.rematch){ R0.next.topic = x && x.topic; if(R0.view === 'end') raceEndView(); } }).catch(() => {});
  }
  const nextName = theirRematch && R0.next && TOPIC[R0.next.topic] ? TOPIC[R0.next.topic].name : '';
  raceBox(`<h2>${esc(head)}</h2><p>${esc(sub)}</p>
    ${list.length ? `<p class="racenote">Together you found ${together} of ${list.length * 2}!${fast ? ` Your fastest: ${esc(fast.n)} in ${raceSecs(fast.R[me].ms)}.` : ''}</p>` : ''}
    ${list.length ? `<table class="racelist"><thead><tr><th scope="col">Place</th><th scope="col">${av(me)} You</th><th scope="col">${av(them)}</th></tr></thead><tbody>${list.map(x => `<tr><td>${esc(x.n)}</td><td>${cell(x, me)}</td><td>${cell(x, them)}</td></tr>`).join('')}</tbody></table>` : ''}
    <div class="rowbtns center">
      ${r.left ? '' : theirRematch ? `<button class="primary" data-race="rematch">${nextName && R0.next.topic !== r.topic ? `${av(them)} wants to race again: ${esc(nextName)}! Join` : `${av(them)} wants a rematch! Join`}</button>`
        : `<button class="primary" data-race="rematch">Rematch</button><button data-race="again">Race again: pick a topic</button>`}
      ${misses.length ? `<button data-race="practice">Practice these (${misses.length})</button>` : ''}
      <button data-race="home">Back home</button>
    </div>`);
  $('chipText').innerHTML = `🏁 Race a friend<small>${esc(TOPIC[r.topic] ? TOPIC[r.topic].name : '')} · All done</small>`;
  if(first && !r.left && my > their){ confetti(); sound('done'); }
  R0.misses = misses;
}
// The next race with the same friend, no new code: the same topic with new places (Rematch), or a topic either player
// picks (Race again). The other player's end screen offers to join it; if both start one at once, both join the first.
async function raceRematch(tid){
  const R0 = RACE, r = R0.rec, b = R0.backend, topic = TOPIC[tid] ? tid : r.topic, invite = raceAvOf(raceOther(R0.seat));
  if(r.rematch){ const code = r.rematch; raceStop(true); raceJoin(code); return; }
  $('raceBox').querySelectorAll('[data-race="rematch"], [data-race="again"]').forEach(x => x.disabled = true);
  try{
    const items = await racePick(topic, topic === r.topic ? r.items : []);
    const code = await b.create(() => raceNewRecord({uid: b.uid, avatar: raceMyAvatar(), topic, items, now: b.serverNow()}));
    R0.madeRematch = code;
    if(await b.transact(R0.code, x => raceWithRematch(x, code))){ raceStop(true); RACE.invite = invite; raceOpen(code, 'a'); return; }
    // the other player started one at the same moment: join theirs
    raceDrop(b, code); const now = await b.read(R0.code);
    if(now && now.rematch){ toast(`${invite} picked first.`); raceStop(true); raceJoin(now.rematch); }
  }catch(e){ toast("Couldn't connect. Check your internet connection."); if(RACE === R0 && R0.view === 'end') raceEndView(); }
}
function raceAgainPanel(){
  const panel = openPanel({title: 'Race again', html: `<p class="muted">Pick what to race on next. Your friend gets a Join button. No new code needed.</p>${raceTopicButtons()}`});
  panel.addEventListener('click', e => { const b = e.target.closest('[data-race-topic]'); if(b) popLayer(() => { if(RACE && RACE.view === 'end') raceRematch(b.dataset.raceTopic); }); });
}

$('raceBox').addEventListener('click', e => {
  const h = e.target.closest('[data-head]');
  if(h && RACE && RACE.backend){ const b = RACE.backend; b.transact(RACE.code, r => raceWithHead(r, b.uid, h.dataset.head, +h.dataset.secs)); return; }
  const a = e.target.closest('[data-race]'); if(!a) return;
  const what = a.dataset.race;
  if(what === 'home' || what === 'cancel'){ popLayer(); return; } // leaving cancels a race that hasn't started (raceClose)
  if(!RACE || !RACE.backend) return;
  const b = RACE.backend;
  if(what === 'share') raceShare();
  else if(what === 'retry'){ RACE.prepared = false; racePrepare(); raceLobby(); }
  else if(what === 'start'){ a.disabled = true; b.transact(RACE.code, r => raceWithStart(r, b.uid, b.serverNow())); }
  else if(what === 'rematch') raceRematch();
  else if(what === 'again') raceAgainPanel();
  else if(what === 'practice'){ const tid = RACE.rec.topic, only = RACE.misses; popLayer(() => enterGame(tid, 'find', false, only)); }
});

/* ---- ways in: a card on the home screen, a button on each place's screen, and join links ---- */
function raceCard(){
  return raceOnline() ? `<button class="passbtn racebtn" id="raceBtn"><span class="pi" aria-hidden="true">🏁</span>
    <span class="pt">Race a friend</span><span class="pd">Who can find it first? Race a friend on another phone or tablet.</span></button>` : '';
}
const raceModeButton = t => raceOnline() && RACE_TOPIC_RE.test(t.id) ? `<button class="modebig racemode" data-race-topic="${t.id}"><span class="mn">🏁 Race a friend</span><span class="md">Who can find ${Math.min(raceTime('rounds'), t.count)} ${esc(t.flags ? 'flags' : t.nouns)} first? Race a friend on another device.</span></button>` : '';
// every topic to race on, by place, as buttons (data-race-topic)
function raceTopicButtons(){
  return REGIONS.map(r => ({r, ts: r.topics.filter(t => RACE_TOPIC_RE.test(t.id))})).filter(g => g.ts.length)
    .map(g => `<div class="racegroup"><span class="rgn">${esc(g.r.name)}</span><div class="chips pick">${g.ts.map(t => `<button data-race-topic="${t.id}">${esc(t.tab)}</button>`).join('')}</div></div>`).join('');
}
function openRacePanel(){
  const panel = openPanel({title: 'Race a friend', html: `
    <p class="sect">Got a code from a friend?</p>
    <form class="racejoin" id="raceJoinForm"><input id="raceCodeIn" maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="go" placeholder="ABC234" aria-label="Race code"><button class="primary" type="submit">Join</button></form>
    <p class="racemsg" id="raceMsg" aria-live="polite"></p>
    <p class="sect">Or start a race</p>
    <p class="muted">Pick what to race on. You'll get a code to send your friend.</p>
    ${raceTopicButtons()}`});
  panel.querySelector('#raceJoinForm').onsubmit = e => {
    e.preventDefault();
    const code = raceCleanCode(panel.querySelector('#raceCodeIn').value);
    if(!code){ panel.querySelector('#raceMsg').textContent = 'A race code has 6 letters and numbers, like K7QF2M.'; return; }
    popLayer(() => raceJoin(code));
  };
  panel.addEventListener('click', e => { const b = e.target.closest('[data-race-topic]'); if(b) popLayer(() => raceCreate(b.dataset.raceTopic)); });
}
$('homeGroups').addEventListener('click', e => { if(e.target.closest('#raceBtn')) openRacePanel(); });
$('regionBody').addEventListener('click', e => { const b = e.target.closest('[data-race-topic]'); if(b) raceCreate(b.dataset.raceTopic); });
// ← in the middle of a race asks first: leaving ends it for both players
{
  const back = $('backHome').onclick;
  $('backHome').onclick = async () => {
    if(RACE && RACE.rec && RACE.rec.status === 'playing' && RACE.view === 'play' && !await confirmDialog({title: 'Leave the race?', text: 'The race ends for both of you.', ok: 'Leave', danger: true})) return;
    back();
  };
}
