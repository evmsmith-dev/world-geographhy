// World Geography Quiz: What can be learned: the topics (states, countries, capitals, flags, Land & Water), capitals, pronunciations, mix-up tips.
// One of the game's script files, loaded in number order by index.html (see src/README.md).
'use strict';

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
const NA_ALIAS = {'United States':['usa','u s a','us','u s','america','united states of america'],'Bahamas':['the bahamas'],'Saint Kitts and Nevis':['st kitts','saint kitts'],
  'Saint Vincent and the Grenadines':['st vincent','saint vincent'],'Trinidad and Tobago':['trinidad'],'Antigua and Barbuda':['antigua']};
const NA_CAP_ALIAS = {'Guatemala City':['guatemala'],'Panama City':['panama'],'Washington, D.C.':['washington','washington dc','dc'],'Mexico City':['mexico'],
  'Havana':['la habana'],"St. John's":['saint johns'],"St. George's":['saint georges']};
// North America in three parts, for shorter games
const NA_PARTS = {
  Northern:['Canada','United States','Mexico'],
  Central:['Belize','Costa Rica','El Salvador','Guatemala','Honduras','Nicaragua','Panama'],
  Caribbean:['Antigua and Barbuda','Bahamas','Barbados','Cuba','Dominica','Dominican Republic','Grenada','Haiti','Jamaica','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Trinidad and Tobago'],
};
// a part's name as a title ("Eastern Europe", "Middle East")
const PART_TITLE = {'Asia|Middle East':'Middle East','North America|Northern':'Canada, US & Mexico','North America|Central':'Central America','North America|Caribbean':'Caribbean'};
const partTitle = (region, part) => PART_TITLE[region + '|' + part] || `${part} ${region}`;
// how a part reads in a sentence ("12 of 13 learned in the Caribbean")
const PART_PHRASE = {'Asia|Middle East':'the Middle East','North America|Northern':'Canada, the US and Mexico','North America|Central':'Central America','North America|Caribbean':'the Caribbean'};
const partPhrase = (region, part) => PART_PHRASE[region + '|' + part] || `${part} ${region}`;
const CAP_NOTE = {'Bolivia':'The government meets in La Paz.',
  'South Africa':'South Africa has three capitals: Pretoria, Cape Town and Bloemfontein.',"Côte d'Ivoire":'Abidjan is the biggest city.',
  'Tanzania':'Dar es Salaam is the biggest city.','Benin':'The government works in Cotonou.','Eswatini':'Lobamba is the royal capital.',
  'Burundi':'The capital moved here from Bujumbura in 2019.',
  'Israel':'Many countries keep their embassies in Tel Aviv.','Sri Lanka':'Colombo is the biggest city, and the government works in both.',
  'Malaysia':'The government works in nearby Putrajaya.','Myanmar':'Yangon is the biggest city.','Kazakhstan':'It was called Nur-Sultan from 2019 to 2022.',
  'Nauru':'Nauru has no official capital. The government works in Yaren.','Tuvalu':'The government works on Funafuti, a ring of tiny islands.',
  'Palau':'It took over from Koror in 2006.','Australia':'Sydney is the biggest city.','New Zealand':'Auckland is the biggest city.',
  'United States':'New York City is the biggest city.','Canada':'Toronto is the biggest city.',
  'Indonesia':'A new capital, Nusantara, is being built on the island of Borneo.','Turkey':'Istanbul is the biggest city.'};
const MAPDATA = {}; // map files once loaded, with items indexed by name
// country flags live in flags.json; US state flags in usflags.json, kept as "us:Georgia" so the state and the country don't mix up
let FLAGURL = {}; const flagsLoading = {};
const loadFlags = (map) => { const us = map === 'us', file = us ? 'data/usflags.json' : 'data/flags.json';
  return flagsLoading[file] || (flagsLoading[file] = fetch(file).then(r => { if(!r.ok) throw new Error('flags ' + r.status); return r.json(); })
    .then(f => { for(const [n, svg] of Object.entries(f)) FLAGURL[(us ? 'us:' : '') + n] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); })
    .catch(e => { delete flagsLoading[file]; throw e; })); };
const flagSrc = n => FLAGURL[(M && MAPDATA.us && M === MAPDATA.us ? 'us:' : '') + n] || '';
const flagImg = (n, cls='') => flagSrc(n) ? `<img class="flag ${cls}" src="${flagSrc(n)}" alt="" draggable="false">` : '';
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

// Land & Water: mountain ranges, deserts, seas and lakes, on the continent's map with its countries as a gray background
const GEO_ALIAS = {'Rocky Mountains':['rockies','rocky'],'Appalachian Mountains':['appalachians'],'Ural Mountains':['urals'],'Caucasus Mountains':['caucasus'],
  'Atlas Mountains':['atlas'],'Scandinavian Mountains':['scandes','kjolen'],'Himalayas':['himalaya'],'Great Dividing Range':['great dividing'],
  'Mediterranean Sea':['mediterranean','med'],'Adriatic Sea':['adriatic'],'Aegean Sea':['aegean'],'Caribbean Sea':['caribbean'],'Caspian Sea':['caspian'],'Lake Titicaca':['titicaca'],'Lake Baikal':['baikal'],
  'Carpathian Mountains':['carpathians','carpathian'],'Zagros Mountains':['zagros'],'Drakensberg':['drakensbergs','drakensberg mountains'],'Brazilian Highlands':['brazilian'],'Guiana Highlands':['guiana'],
  'Río de la Plata':['rio de la plata','river plate','plata'],'Great Australian Bight':['australian bight','bight'],'Gulf of Carpentaria':['carpentaria'],'English Channel':['channel'],'Bay of Biscay':['biscay'],
  'Sahara':['sahara desert'],'Kalahari Desert':['kalahari'],'Namib Desert':['namib'],'Arabian Desert':['arabian','rub al khali','empty quarter'],'Gobi Desert':['gobi'],'Taklamakan Desert':['taklamakan','taklimakan'],
  'Thar Desert':['thar','great indian desert'],'Atacama Desert':['atacama'],'Great Victoria Desert':['great victoria'],'Great Sandy Desert':['great sandy'],'Simpson Desert':['simpson'],
  'Sonoran Desert':['sonoran','sonora'],'Chihuahuan Desert':['chihuahuan','chihuahua'],'Mojave Desert':['mojave','mohave']};
const GEO_WORD = {range:'mountain range', desert:'desert', highlands:'highland area', region:'region', sea:'sea', gulf:'gulf', bay:'bay', channel:'channel', estuary:'river mouth', lake:'lake'};
const geoSub = n => { const it = M && M.by && M.by[n]; return it ? it.sub : 'range'; };
const geoAsk = n => `Which ${GEO_WORD[geoSub(n)]} is this?`;
// "That's the Black Sea", "That's the Alps", but "That's Lake Erie", "That's Patagonia" and "That's France"
const noThe = n => /^Lake |^Patagonia$/.test(n);
const the = n => T && T.geo && !noThe(n) ? 'the ' + n : n;
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
  { id:'us-flags', group:'United States', tab:'Flags', name:'State Flags', blurb:'Learn the flag of every state.', map:'us', count:50, flags:true, card:'flag',
    answer:n=>n, nouns:'flags', listWord:'states', alias:STATE_ALIAS, maxZoom:10, itemWord:'state',
    tapWhat:'Tap a state, then pick its flag', tapHint:'Tap a state on the map',
    ask:()=>'Which flag belongs to this state?', flashFront:()=>'Which state has this flag?',
    back:n=>({answer:n, sub:`Capital: <b>${esc(CAP[n])}</b> ★`}) },
  { id:'world', group:'World', tab:'Continents & Oceans', name:'Continents & Oceans', blurb:'Find the 7 continents and 5 oceans.', map:'world', count:12,
    answer:n=>n, nouns:'places', listWord:'continents and oceans', alias:WORLD_ALIAS, maxZoom:5,
    tapWhat:'Tap a continent or ocean, find its name', tapHint:'Tap a continent or ocean',
    ask:()=> 'Which continent or ocean is this?', flashFront:()=> 'Which continent or ocean is this?', card:'locate',
    back:(n,item)=>({answer:n, sub:worldSize(n, item.kind)}) },
  ...regionTopics('eu', 'Europe', 'europe', 44, 14, EU_ALIAS, EU_CAP_ALIAS, EU_PARTS),
  geoTopic('eu', 'Europe', 'europe', 14, 14, '(Europe has no big deserts!)'),
  ...regionTopics('af', 'Africa', 'africa', 54, 10, AF_ALIAS, AF_CAP_ALIAS, AF_PARTS),
  geoTopic('af', 'Africa', 'africa', 13, 14),
  ...regionTopics('as', 'Asia', 'asia', 48, 14, AS_ALIAS, AS_CAP_ALIAS, AS_PARTS),
  geoTopic('as', 'Asia', 'asia', 19, 14),
  ...regionTopics('oc', 'Oceania', 'oceania', 14, 12, OC_ALIAS, OC_CAP_ALIAS),
  geoTopic('oc', 'Oceania', 'oceania', 9, 12),
  ...regionTopics('na', 'North America', 'namerica', 23, 20, NA_ALIAS, NA_CAP_ALIAS, NA_PARTS),
  geoTopic('na', 'North America', 'namerica', 17, 20),
  ...regionTopics('sa', 'South America', 'samerica', 12, 6, {}, SA_CAP_ALIAS),
  geoTopic('sa', 'South America', 'samerica', 7, 12),
];
// Countries and capitals of a region. Capital names live in the region's map file.
// The place screen's line for a Land & Water topic, worked out from its map: "Find 6 mountain ranges, 5 seas, a bay and a channel in Europe."
const GEO_ORDER = ['range', 'highlands', 'region', 'desert', 'sea', 'gulf', 'bay', 'channel', 'estuary', 'lake'];
function geoBlurb(t, m){
  const n = {}; m.items.forEach(i => { n[i.sub] = (n[i.sub] || 0) + 1; });
  const parts = GEO_ORDER.filter(s => n[s]).map(s => n[s] === 1 ? `a ${GEO_WORD[s]}` : `${n[s]} ${GEO_WORD[s]}s`);
  const list = parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : parts[0];
  return `Find ${list} in ${t.group}.` + (t.note ? ` ${t.note}` : '');
}
function geoTopic(id, region, map, count, maxZoom, note){
  return {id:id+'-geo', group:region, map:map+'-geo', count, maxZoom, geo:true, card:'locate', tab:'Land & Water', name:`Land & Water of ${region}`, note,
    answer:n=>n, nouns:'mountains, deserts, seas and lakes', listWord:'places', itemWord:'place', alias:GEO_ALIAS,
    tapHint:'Tap a mountain, desert, sea or lake', tapWhat:'Tap a mountain, desert, sea or lake, find its name', ask:geoAsk, flashFront:geoAsk,
    back:n=>({answer:n, sub:`A ${GEO_WORD[geoSub(n)]} in ${esc(region)}`})};
}
function regionTopics(id, region, map, count, maxZoom, alias, capAlias, parts){
  const blurb = `Find all ${count} countries in ${region}.`, capBlurb = `Name the capital of every country in ${region}.`;
  const cap = n => MAPDATA[map].by[n].cap;
  const note = n => CAP_NOTE[n] ? ` ${esc(CAP_NOTE[n])}` : '';
  const base = {group:region, map, count, maxZoom, card:'shape', tapHint:'Tap a country on the map', itemWord:'country', parts};
  return [
    {...base, id:id+'-countries', tab:'Countries', name:`Countries of ${region}`, blurb, answer:n=>n, nouns:'countries', listWord:'countries', alias,
      tapWhat:'Tap a country, find its name', ask:()=>'Which country is this?', flashFront:()=>'Which country is this?',
      back:n=>({answer:n, sub:`Capital: <b>${esc(cap(n))}</b> ★${note(n)}`})},
    {...base, id:id+'-capitals', tab:'Capitals', name:region === 'Oceania' ? 'Capitals of Oceania' : `${({'Europe':'European','Africa':'African','Asia':'Asian','South America':'South American','North America':'North American'})[region]} Capitals`, blurb:capBlurb, answer:cap, nouns:'capitals', listWord:'capitals', alias:capAlias, showsItem:true,
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
const partChips = (r, cur, done = {}) => r.parts ? `<div class="partrow"><span class="fieldlabel">Part:</span><div class="chips pick">${['All', ...Object.keys(r.parts)].map(v => `<button data-part="${v}" aria-pressed="${v===cur}"${done[v] ? ` aria-label="${v}, badge earned"` : ''}>${v}${done[v] ? '<span class="pdone" aria-hidden="true">🏅</span>' : ''}</button>`).join('')}</div></div>` : '';
// World Tour: every country (or every Land & Water place) in one game, each question on its own continent's map.
// Answers count for the continent topics they come from, so what's learned in one place counts in the other.
const TOURS = [
  {id:'world-countries', group:'World', tab:'All Countries', name:'Countries of the World', nouns:'countries', icon:'🌍',
    from:['eu-countries', 'af-countries', 'as-countries', 'oc-countries', 'na-countries', 'sa-countries']},
  {id:'world-geo', group:'World', tab:'All Land & Water', name:'Land & Water of the World', nouns:'mountains, deserts, seas and lakes', icon:'🏞️',
    from:['eu-geo', 'af-geo', 'as-geo', 'oc-geo', 'na-geo', 'sa-geo']},
].map(t => ({...t, tour:true, count:t.from.reduce((sum, f) => sum + TOPIC[f].count, 0)}));
const TOUR = Object.fromEntries(TOURS.map(t => [t.id, t]));
const tabsOf = r => r.name === 'World' ? [...r.topics, ...TOURS] : r.topics; // the place screen's tabs
const regionOf = tid => REGIONS.find(r => r.topics.some(t => t.id === tid));
// the tab last used in a place; the World Tour tabs only count on the place screen (tours = true)
const lastTab = (r, tours) => { const t = LS.get(`tab-${player ? player.id : ''}-${r.name}`), all = tours ? tabsOf(r) : r.topics; return all.find(x => x.id === t) || r.topics[0]; };
const rememberTab = (r, tid) => LS.set(`tab-${player ? player.id : ''}-${r.name}`, tid);
const MODES = {flash:'Learn', find:'Find it', practice:'Practice', test:'Test'};
const MODE_DESC = {flash:'Flashcards, one at a time', find:'We show a name, you tap the map', practice:'Answer and find out right away', test:'Answer them all, then see your score'};
const modeDesc = (m, t) => m==='find' && t.flags ? 'We show a flag, you tap the country' : MODE_DESC[m];
const AVATARS = ['🦊','🐼','🐸','🦁','🐧','🐢','🦉','🐙','🦄','🐝','🐬','🐨'];
const AV_BG = ['#f6d5c3','#dfe3e8','#d5ecd0','#f5e3b5','#d6e4f0','#d3eadf','#e6dccd','#f3d4dc','#e7d9f2','#f7eab4','#cfe6f2','#e2e2dc'];
const MAX_PLAYERS = 8;
const avatar = (p, big) => `<span class="av${big?' big':''}" style="background:${AV_BG[p.avatar%AV_BG.length]}" aria-hidden="true">${AVATARS[p.avatar%AVATARS.length]}</span>`;
