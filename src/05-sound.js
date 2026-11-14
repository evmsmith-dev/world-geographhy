// World Geography Quiz: Sounds, speech ("Say it") and confetti.
// One of the game's script files, loaded in number order by index.html (see src/README.md).
'use strict';

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
  'Vientiane':'vee-en-tee-ahn','Lake Titicaca':'lake tee-tee-kah-kah','Lake Baikal':'lake by-kahl','Lake Tanganyika':'lake tan-gan-yee-kah','Aegean Sea':'ih-jee-un sea',
  'Tian Shan':'tee-en shahn','Pyrenees':'peer-uh-neez','Caucasus Mountains':'kaw-kuh-sus mountains','Sierra Madre':'see-air-uh mah-dray','Hindu Kush':'hin-doo koosh','Drakensberg':'drah-kenz-berg','Zagros Mountains':'zag-ross mountains','Carpathian Mountains':'kar-pay-thee-un mountains','Río de la Plata':'ree-oh day lah plah-tah','Guiana Highlands':'ghee-ah-nah highlands','Gulf of Carpentaria':'gulf of kar-pen-tair-ee-uh','Great Australian Bight':'great australian bite','Patagonia':'pat-uh-go-nee-uh','Aral Sea':'air-ul sea','Lake Okeechobee':'lake oh-kee-choh-bee','Chesapeake Bay':'chess-uh-peek bay','Ozark Plateau':'oh-zark plateau','Sierra Nevada':'see-air-uh nuh-vad-uh','Honolulu':'hon-uh-loo-loo','San Antonio':'san an-toh-nee-oh','Shenandoah National Park':'shen-un-doh-uh national park','Haleakalā National Park':'hah-lay-ah-kuh-lah national park','Cuyahoga Valley National Park':'kai-uh-hoh-guh valley national park','Congaree National Park':'kon-guh-ree national park','Saguaro National Park':'suh-wahr-oh national park','Voyageurs National Park':'voy-uh-jurz national park','Wrangell–St. Elias National Park':'rang-gul saint ee-lie-us national park','Hawaiʻi Volcanoes National Park':'huh-why-ee volcanoes national park','Denali National Park':'duh-nah-lee national park','Acadia National Park':'uh-kay-dee-uh national park','Chihuahuan Desert':'chee-wah-wun desert','Taklamakan Desert':'tah-kluh-muh-kahn desert','Kalahari Desert':'kah-lah-hah-ree desert','Namib Desert':'nah-mib desert','Mojave Desert':'mo-hah-vee desert','Sonoran Desert':'so-nor-un desert','Atacama Desert':'ah-tah-kah-mah desert','Thar Desert':'tar desert','Sahara':'suh-hair-uh','Basseterre':'bass-tair','Castries':'kas-treez','Roseau':'roh-zoh','Port-au-Prince':'port oh prance','Grenada':'greh-nay-dah',
  'Belize':'beh-leez','Managua':'mah-nah-gwah','San José':'san ho-zay','Kiribati':'kee-ree-bahs','South Tarawa':'south tah-rah-wah','Ngerulmud':'neh-rool-mood',"Nuku'alofa":'noo-koo-ah-loh-fah',
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
// a place's capital, if its place has a Capitals topic (none for continents and oceans)
function capitalOf(R, n){ const ct = R.topics.find(t => t.showsItem); return ct ? ct.answer(n) : null; }
function sayParts(n){
  const R = REGIONS.find(r => r.topics.some(t => t.id === T.id)) || {topics:[T]}, cap = capitalOf(R, n);
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
