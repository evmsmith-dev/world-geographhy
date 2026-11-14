// World Geography Quiz: Moving between screens, the back button, panels and dialogs.
// One of the game's script files, loaded in number order by index.html (see src/README.md).
'use strict';

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
