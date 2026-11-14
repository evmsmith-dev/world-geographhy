// World Geography Quiz: Settings, How to play, and backups.
// One of the game's script files, loaded in number order by index.html (see src/README.md).
'use strict';

/* ===================== 11. settings, help, backup ===================== */
function openSettings(){
  const p = player.prefs;
  const panel = openPanel({title:'Settings', html:`
    <div class="toggle"><div class="txt">Stopwatch<small>Time each Test and Practice game, and try to beat your best time.</small></div><button class="switch" role="switch" id="swTimer" aria-checked="${!!p.timer}" aria-label="Stopwatch"></button></div>
    <div class="toggle"><div class="txt">Easy answers<small>Pick from 4 answers instead of typing, in Test and Practice.</small></div><button class="switch" role="switch" id="swEasy" aria-checked="${!!p.easy}" aria-label="Easy answers"></button></div>
    ${CAN_SAY ? `<div class="toggle"><div class="txt">Say names out loud<small>Read names aloud on flashcards, in Find it and in Explore. You can always tap 🔊 to hear one.</small></div><button class="switch" role="switch" id="swSay" aria-checked="${!!p.say}" aria-label="Say names out loud"></button></div>` : ''}
    <div class="toggle"><div class="txt">Up next suggestion<small>Show a suggestion on the home screen for what to play next.</small></div><button class="switch" role="switch" id="swUpnext" aria-checked="${p.upnext !== false}" aria-label="Up next suggestion"></button></div>
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
  panel.querySelector('#swUpnext').onclick = async () => { player.prefs.upnext = player.prefs.upnext === false; panel.querySelector('#swUpnext').setAttribute('aria-checked', String(player.prefs.upnext)); await DB.put('players', player); renderHome(); };
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
      <li><h3>Pick a place</h3><p>On the home screen, tap a place: the United States, the World, Europe, Africa, Asia, Oceania, North America or South America. Then pick what to learn: <b>Countries</b>, <b>Capitals</b>, <b>Flags</b>, or <b>Land & Water</b> for mountain ranges, deserts, seas and lakes. The United States also has <b>Regions</b>, <b>Cities</b>, <b>National Parks</b> and its own <b>Land & Water</b>. Want a shorter game? Big places like Europe, Africa, Asia and North America have a <b>Part</b> row, so you can play just one part, like West Africa or the Caribbean. Learn every one in a part to earn its badge 🏅.</p></li>
      <li><h3>Look around first</h3><p>Tap <b>🔍 Explore the map</b> to look around with no quiz. Tap any place to see its name, flag, capital and a fun fact. Turn <b>Show names</b> off to hide the names and quiz yourself.</p></li>
      <li><h3>Pick how to play</h3><p><b>Learn:</b> flashcards, one at a time.<br><b>Find it:</b> the game shows a name, and you tap it on the map. You get 3 tries.<br><b>Practice:</b> find out right away if you are right.<br><b>Test:</b> answer them all, then press <b>Review</b> to see your score.</p></li>
      <li><h3>Tap the map</h3><p>In Practice and Test, tap a place. It turns orange. Then start typing its name in the box. Pick the name from the list and press <b>Save</b> or <b>Check</b>. Don't worry about spelling. The list helps you. Don't like typing? Turn on <b>Easy answers</b> in <b>⚙ Settings</b> to pick from 4 answers instead. Flags games always let you pick from 4.</p></li>
      <li><h3>Zoom in</h3><p>Small places are hard to tap. Pinch the map, or press <b>+</b>. Drag to move around. Press <b>⤢</b> to see the whole map again. Very small places, like Vatican City or tiny islands, have a circle you can tap. <b>Next</b> takes you to one you haven't answered.</p></li>
      <li><h3>Check your score</h3><p>After <b>Review</b>, green means right and red means missed. Press <b>Try the missed</b> to try again. Your right answers stay green.</p></li>
      <li><h3>Learn with flashcards</h3><p>Tap the card to flip it. Press <b>Got it</b> if you knew it. Press <b>Study again</b> if you didn't, and it will come back at the end. Press <b>🔊 Say it</b> to hear the answer. Flashcards are for studying. To count a place as learned and earn badges, get it right in <b>Find it</b>, <b>Practice</b>, <b>Test</b> or the <b>Daily 10</b>.</p></li>
      <li><h3>Hear the names</h3><p>Tap <b>🔊</b> next to a name to hear how to say it, or next to a fun fact to hear it read. Want every name read out loud? Turn on <b>Say names out loud</b> in <b>⚙ Settings</b>.</p></li>
      <li><h3>Up next</h3><p>Not sure what to play? Tap <b>Up next</b> on the home screen. It picks the next step for you, from flashcards to a perfect Test. You can turn it off in <b>⚙ Settings</b>.</p></li>
      <li><h3>World Tour</h3><p>Open <b>the World</b> and pick <b>All Countries</b> or <b>All Land & Water</b> to play every place in the world in one game, one continent at a time. <b>Find it</b> and <b>Name it</b> go through all of them and remember where you stopped. <b>World 20</b> is a quick round from all over. What you learn here counts for each continent too.</p></li>
      <li><h3>Daily 10</h3><p>Every day, tap <b>Daily 10</b> at the top of the home screen for 10 quick questions. It brings back ones you missed and ones you might be forgetting, so they stick. Play every day to grow your streak 🔥 and earn badges.</p></li>
      <li><h3>Your scores</h3><p>Each player has their own scores. Tap <b>★ Scores</b> on the home screen to see your games, your badges, the ones that need practice, and everyone's scores. Some badges are secret ❓. Get a perfect Test to find out what they are! Tap your name to switch players. <b>⚙ Settings</b> also turns on the stopwatch and sounds.</p></li>
    </ol>
    <p class="note">Your games are saved. Stop any time, and find them later under <b>Keep going</b> on the home screen.</p>
    <button class="primary" id="helpOk">Let's play!</button>`});
  document.getElementById('helpOk').onclick = () => popLayer();
  LS.set('help-seen','1');
}
$('playHelp').onclick = () => openHelp();
