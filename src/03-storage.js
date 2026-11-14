// World Geography Quiz: Saving progress on the device (IndexedDB, with an in-memory fallback).
// One of the game's script files, loaded in number order by index.html (see src/README.md).
'use strict';

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
// extra: more fields to store with the answer (a Test also keeps its own last result). Returns the record as it was before.
const ITEMQ = {};
function withItem(key, fn){ const run = (ITEMQ[key] || Promise.resolve()).then(fn); ITEMQ[key] = run.catch(() => {}); return run; }
// resolves once every answer given so far is saved (screens that show progress wait for it)
const itemsSaved = () => Promise.all(Object.values(ITEMQ));
function recordItem(pid, topic, item, right, extra){ return withItem(`${pid}|${topic}|${item}`, () => recordItemNow(pid, topic, item, right, extra)); }
async function recordItemNow(pid, topic, item, right, extra){
  const key = `${pid}|${topic}|${item}`;
  const r = (await DB.get('items', key)) || {key, pid, topic, item, seen:0, right:0, wrong:0};
  const before = {...r};
  r.seen++; right ? r.right++ : r.wrong++; r.last = right ? 'right' : 'wrong'; r.at = Date.now();
  if(right && !r.firstRight) r.firstRight = r.at; // the first right answer: the date on a landmark's passport stamp (src/17-passport.js)
  r.streak = right ? itemStreak(before) + 1 : 0; // right answers in a row: the longer, the longer until it comes back in the Daily 10
  if(extra) Object.assign(r, extra);
  await DB.put('items', r);
  return before;
}
const itemStreak = r => r.streak != null ? r.streak : (r.last === 'right' ? Math.min(r.right || 0, 3) : 0); // older records had no streak
// Flashcards are for studying: "Got it" is the player's own call, so it is kept apart and never counts as learned or toward badges
async function recordStudy(pid, topic, item, knew){
  const key = `${pid}|${topic}|${item}`;
  const r = (await DB.get('items', key)) || {key, pid, topic, item, seen:0, right:0, wrong:0};
  r.studied = (r.studied || 0) + 1; if(!knew) r.studyAgain = (r.studyAgain || 0) + 1; r.studiedAt = Date.now();
  await DB.put('items', r);
}
