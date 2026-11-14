// World Geography Quiz: Players: making, picking and editing them.
// One of the game's script files, loaded in number order by index.html (see src/README.md).
'use strict';

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
async function choosePlayer(id){
  player = (await DB.get('players', id)) || players.find(p=>p.id===id); LS.set('player', id);
  const i = players.findIndex(p => p.id === id); if(i >= 0) players[i] = player;
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
    const rec = p ? {...((await DB.get('players', p.id)) || p), name:n, avatar:pick} : {id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6), name:n, avatar:pick, created:Date.now(), prefs:{timer:false, sound:false}};
    await DB.put('players', rec);
    if(isNew){ await migrateOldSave(rec.id); try{ navigator.storage && navigator.storage.persist && navigator.storage.persist(); }catch(e){} }
    await loadPlayers();
    if(player && player.id===rec.id) player = players.find(x => x.id === rec.id) || rec;
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

// One-time: Central America became the Central part of North America; carry each player's progress over.
async function migrateCentralAmerica(){
  if(LS.get('migrated-na')) return;
  try{
    const ren = t => t.replace(/^ca-/, 'na-');
    const items = (await DB.all('items')).filter(r => /^ca-/.test(r.topic));
    for(const r of items){ const topic = ren(r.topic), key = `${r.pid}|${topic}|${r.item}`; await DB.put('items', {...r, key, topic}); await DB.del('items', r.key); }
    const attempts = (await DB.all('attempts')).filter(a => /^ca-/.test(a.topic));
    for(const a of attempts) await DB.put('attempts', {...a, topic:ren(a.topic), part:a.part || 'Central'});
    const games = (await DB.all('games')).filter(g => /^ca-/.test(g.topic));
    for(const g of games){ const topic = ren(g.topic), key = gameKey(g.pid, topic, g.mode + '@Central');
      await DB.put('games', {...g, key, topic, part:'Central', only:NA_PARTS.Central}); await DB.del('games', g.key); }
    LS.set('migrated-na', '1');
  }catch(e){}
}
