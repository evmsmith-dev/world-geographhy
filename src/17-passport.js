// World Geography Quiz: The passport: a stamp for each landmark learned.
// One of the game's script files, loaded in number order by index.html (see src/README.md).
'use strict';

/* ===================== 10e. passport ===================== */
// A landmark gets its stamp the first time it's answered right in Find it, Practice, a Test, the Daily 10 or the World Tour
// (flashcards don't count, as with badges). A stamp is never taken away, even after a later miss.
const LANDMARK_TOPICS = TOPICS.filter(t => t.landmarks).sort((a, b) => (a.group === 'United States') - (b.group === 'United States')); // the continents, then US Landmarks
const STAMP_INK = ['#c0392b', '#2c5aa0', '#2e7d4f', '#7b4fa0', '#b5651d']; // each continent's postmark has its own ink
const stampDate = ms => new Date(ms).toLocaleDateString(undefined, {day:'numeric', month:'short', year:'numeric'});

// every landmark with its continent and country, and the date of its stamp if it has one
async function passportOf(pid){
  return (await Promise.all(LANDMARK_TOPICS.map(async (t, ti) => {
    const m = await loadMap(t.map), got = Object.fromEntries((await DB.byPT('items', pid, t.id)).filter(r => r.right > 0).map(r => [r.item, r.firstRight || r.at || Date.now()]));
    return m.items.map(i => ({n: i.n, where: i.where, group: t.group, topic: t.id, ink: STAMP_INK[ti % STAMP_INK.length], at: got[i.n] || null}));
  }))).flat();
}

// one stamp: the drawing with a postmark, or a blurred drawing to look forward to
const stampHtml = (s, small) => small ? `<span class="stamp on small" style="--tilt:${((s.n.length * 7) % 9) - 4}deg">${picImg(s.n)}</span>` // inside the home card's button
  : s.at
  ? `<button class="stamp on" data-stamp="${esc(s.n)}" aria-label="${esc(s.n)}, stamped ${esc(stampDate(s.at))}" style="--tilt:${((s.n.length * 7) % 9) - 4}deg;--ink:${s.ink}">
      ${picImg(s.n)}<span class="pmark" aria-hidden="true"><b>${esc(s.where.replace(/^the /, ''))}</b>${esc(stampDate(s.at))}</span><span class="sn">${esc(s.n)}</span></button>`
  : `<span class="stamp off" aria-label="A stamp not collected yet">${picImg(s.n)}<span class="sn">?</span></span>`;

// the home screen card: how many stamps, and the newest few
async function passportCard(){
  const all = await passportOf(player.id), got = all.filter(s => s.at).sort((a, b) => b.at - a.at);
  return `<button class="passbtn" id="passBtn"><span class="pi" aria-hidden="true">🛂</span>
    <span class="pt">My Passport</span>
    <span class="pd">${got.length ? `${got.length} of ${all.length} landmark stamps` : 'Learn a landmark to get your first stamp!'}</span>
    ${got.length ? `<span class="pnew" aria-hidden="true">${got.slice(0, 4).map(s => stampHtml(s, true)).join('')}</span>` : ''}</button>`;
}

async function openPassport(){
  const all = await passportOf(player.id), got = all.filter(s => s.at).length;
  const groups = LANDMARK_TOPICS.map(t => ({t, list: all.filter(s => s.topic === t.id)}));
  const panel = openPanel({kind:'full', title:`${player.name}'s Passport`, html:`<div class="passport">
    <p class="muted">${got} of ${all.length} stamps. Get a landmark right to stamp it, in Find it, Practice, a Test, the Daily 10 or the World Tour.</p>
    <div class="meter" role="img" aria-label="${got} of ${all.length} stamps"><i style="width:${Math.round(100 * got / all.length)}%"></i></div>
    ${groups.map(({t, list}) => `<section class="ppage"><h3>${esc(t.group)} <span class="muted">${list.filter(s => s.at).length} of ${list.length}</span></h3>
      <div class="stamps">${list.map(s => stampHtml(s)).join('')}</div></section>`).join('')}</div>`});
  panel.addEventListener('click', e => { const b = e.target.closest('[data-stamp]'); if(b) openStamp(all.find(s => s.n === b.dataset.stamp)); });
}

// one stamp up close, with its fun fact
async function openStamp(s){
  await loadFacts();
  const fact = FACTS && FACTS.geo && FACTS.geo[s.n];
  const panel = openPanel({kind:'center', label:s.n, html:`<div class="stampbig" style="--ink:${s.ink}">${picImg(s.n, 'big')}
    <h2>${esc(s.n)} ${sayBtn(s.n, [s.n])}</h2><p class="muted">A landmark in ${esc(s.where)} · Stamped ${esc(stampDate(s.at))}</p>
    ${fact ? `<p class="fact"><span class="fk">💡 Did you know?</span>${esc(fact)}</p>` : ''}
    <button class="primary" data-close>OK</button></div>`});
  panel.querySelector('[data-close]').onclick = () => popLayer();
  panel.querySelector('[data-close]').focus();
}

// after a game: say when there are new stamps (a new badge says so first)
async function newStamps(showToast){
  const got = (await passportOf(player.id)).filter(s => s.at), seen = new Set(player.stamps || []);
  const fresh = got.filter(s => !seen.has(s.n)).sort((a, b) => b.at - a.at);
  if(!fresh.length) return;
  player.stamps = got.map(s => s.n); await DB.put('players', player);
  if(showToast) toast(`🛂 ${fresh.length === 1 ? `New passport stamp: ${fresh[0].n}!` : `${fresh.length} new passport stamps!`}`,
    [{label:'See passport', run: () => { if(!$('scrPlay').hidden) popLayer(() => openPassport()); else openPassport(); }}, {label:'OK', ghost:true}], 7000);
}

$('homeGroups').addEventListener('click', e => { if(e.target.closest('#passBtn')) openPassport(); });
$('regionBody').addEventListener('click', e => { if(e.target.closest('[data-passport]')) openPassport(); });
