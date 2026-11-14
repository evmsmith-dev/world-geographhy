// World Geography Quiz: Updates and start-up (this file runs last).
// One of the game's script files, loaded in number order by index.html (see src/README.md).
'use strict';

/* ===================== 12. updates & start-up ===================== */
// Installed app only: offline support, and a check for a newer index.html (at most once an hour).
const CORE = ['./', 'index.html', 'src/app.css', ...[...document.scripts].map(s => s.getAttribute('src')).filter(Boolean)]; // the page and its code
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
      // the service worker keeps the one list of the game's files and fetches them all fresh
      const sw = navigator.serviceWorker && navigator.serviceWorker.controller;
      const done = sw ? await new Promise(res => { const ch = new MessageChannel(); ch.port1.onmessage = e => res(e.data === 'refreshed'); sw.postMessage('refresh', [ch.port2]); setTimeout(() => res(false), 20000); }) : false;
      if(!done){ // an older service worker that can't do this yet: refresh the main files directly
        const cache = await caches.open('wgq-v2');
        await Promise.all(CORE.map(async u => { const r = await fetch(u + (u.includes('?')?'&':'?') + 'check=' + Date.now(), {cache:'no-store'}); if(r.ok) await cache.put(u, r); }));
      }
    }
    const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); reg && await reg.update();
  }catch(e){}
  location.reload();
}
// the automatic tests read the game's data through this. It only exists when the page is opened with ?test,
// so players never see it. Keep these names working when the code moves around.
if(/[?&]test\b/.test(location.search)) window.WGQ_TEST = {TOPICS, TOPIC, TOURS, TOUR, LOOKALIKES, SAY, GEO_ALIAS, WORLD_FACT, CAP, CAP_NOTE, POSTAL, loadMap, picSrc,
  facts: async () => { await loadFacts(); return FACTS; }, zoomTo: n => zoomToItems([n]), flags: async map => { await loadFlags(map); return FLAGURL; }};
async function start(){
  const persistent = await DB.ready();
  await migrateCentralAmerica();
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
