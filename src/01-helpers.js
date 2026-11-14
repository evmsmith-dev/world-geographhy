// World Geography Quiz: Small helpers used everywhere: $, esc, shuffle, the saved-settings store (LS), toasts.
// One of the game's script files, loaded in number order by index.html (see src/README.md).
'use strict';

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
