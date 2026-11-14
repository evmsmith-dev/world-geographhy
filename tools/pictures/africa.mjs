import {cloud, sun, arches, repeat} from './common.mjs';
const statue = (x, head = true) => `
  <rect x="${x-13}" y="98" width="26" height="30" fill="#a8743e"/>
  <rect x="${x-12}" y="92" width="10" height="28" fill="#bb8549"/><rect x="${x+2}" y="92" width="10" height="28" fill="#bb8549"/>
  <path d="M${x-12},94 L${x-9},66 H${x+9} L${x+12},94 Z" fill="#c48d50"/>
  ${head ? `<path d="M${x-11},68 L${x-8},48 Q${x},42 ${x+8},48 L${x+11},68 Z" fill="#b07a40"/><ellipse cx="${x}" cy="57" rx="5" ry="7" fill="#d7a668"/>
    <rect x="${x-2}" y="64" width="4" height="7" fill="#9c6a35"/>` : ''}`;
// the zigzag pattern along the top of Great Zimbabwe's wall
const zig = () => { const pts = []; for(let i = 0; i <= 34; i++){ const x = i*6, t = x <= 140 ? x/140 : 1;
  let y = x <= 140 ? (1-t)*(1-t)*72 + 2*(1-t)*t*56 + t*t*80 : 80 + (x-140)/3; pts.push(`${x},${(y + 5 + (i%2 ? 0 : 5)).toFixed(1)}`); } return 'M' + pts.join(' L'); };
export default {
'Pyramids of Giza': [['#9fd0ee', '#e3f1f8'], `
  ${sun(162, 32, 13)}
  <path d="M0,124 Q60,116 110,122 T200,118 V160 H0 Z" fill="#e6c07a"/>
  <path d="M36,128 L92,48 L148,128 Z" fill="#e9bd6b"/><path d="M92,48 L148,128 L112,128 Z" fill="#c8984c"/>
  <path d="M120,124 L156,74 L192,124 Z" fill="#e3b463"/><path d="M156,74 L192,124 L168,124 Z" fill="#bf8e45"/>
  <path d="M8,134 L32,104 L56,134 Z" fill="#edc37a"/><path d="M32,104 L56,134 L41,134 Z" fill="#cc9e55"/>
  <g stroke="#b88a45" stroke-width=".8" opacity=".6"><path d="M53,104 L131,104 M65,88 L119,88 M77,71 L107,71"/></g>
  <path d="M0,140 Q50,132 100,138 T200,134 V160 H0 Z" fill="#dcb26a"/>`],

'Abu Simbel': [['#8ec7ec', '#f3e3c4'], `
  ${sun(172, 24, 10)}
  <path d="M0,160 V40 Q30,30 60,36 L140,34 Q170,30 200,38 V160 Z" fill="#c8945a"/>
  <path d="M18,128 L24,40 H176 L182,128 Z" fill="#e0b273"/>
  <rect x="24" y="40" width="152" height="5" fill="#cfa064"/>
  ${statue(44)}${statue(78, false)}${statue(122)}${statue(156)}
  <rect x="93" y="96" width="14" height="32" fill="#5a3d22"/>
  <rect x="95" y="76" width="10" height="16" fill="#cf9f60"/><circle cx="100" cy="74" r="4" fill="#d8aa6c"/>
  <rect y="126" width="200" height="34" fill="#e8c88c"/>
  <path d="M60,134 Q66,124 76,128 Q84,130 82,138 Z" fill="#cf9f60"/>`],

'Mount Kilimanjaro': [['#f3c79a', '#fbe9d2'], `
  ${cloud(40, 40, .9, .7)}
  <path d="M0,124 L40,92 Q74,56 96,52 Q126,50 148,72 L200,108 V160 H0 Z" fill="#6e6a7a"/>
  <path d="M60,78 Q80,58 96,52 Q126,50 140,64 L132,68 L124,60 L116,68 L106,60 L96,68 L86,60 L76,70 L68,66 Z" fill="#fff"/>
  <path d="M120,58 Q140,64 148,72 L200,108 V124 L130,90 Z" fill="#5d596a"/>
  <path d="M0,120 Q100,110 200,118 V160 H0 Z" fill="#d6b35c"/>
  <path d="M0,138 Q100,128 200,140 V160 H0 Z" fill="#c9a24c"/>
  <path d="M152,136 L154,112 L157,112 L159,136 Z" fill="#5c4630"/>
  <path d="M130,112 Q140,100 156,102 Q172,100 182,112 Z" fill="#4f7a3a"/>
  <path d="M30,140 L31,126 L33,126 L34,140 Z" fill="#5c4630"/><path d="M20,127 Q26,120 32,121 Q38,120 44,127 Z" fill="#4f7a3a"/>`],

'Victoria Falls': [['#a6d6f2', '#e8f5fc'], `
  <path d="M0,24 Q100,16 200,26 V44 H0 Z" fill="#5c9c4a"/>
  <path d="M0,40 Q100,32 200,42 V54 H0 Z" fill="#6fb2d6"/>
  <rect y="52" width="200" height="70" fill="#e9f5fb"/>
  <g fill="#b9dcef">${repeat(25, i => `<rect x="${i*8+2}" y="54" width="${i%3 ? 2 : 3}" height="${50 + (i*7)%22}" rx="1"/>`)}</g>
  <rect y="118" width="200" height="42" fill="#4c7b4a"/>
  <path d="M0,124 Q100,116 200,124 V160 H0 Z" fill="#3e6b3d"/>
  <g fill="#fff" opacity=".85"><ellipse cx="30" cy="118" rx="34" ry="12"/><ellipse cx="90" cy="114" rx="40" ry="14"/><ellipse cx="160" cy="118" rx="44" ry="12"/></g>
  <g fill="none" stroke-width="2" opacity=".45">
    <path d="M110,120 A40,40 0 0 1 190,120" stroke="#e55"/><path d="M112,120 A38,38 0 0 1 188,120" stroke="#fb3"/>
    <path d="M114,120 A36,36 0 0 1 186,120" stroke="#4b4"/><path d="M116,120 A34,34 0 0 1 184,120" stroke="#49f"/></g>`],

'Table Mountain': [['#a6d6f2', '#e8f5fc'], `
  <path d="M0,104 L30,64 L50,50 H150 L166,62 L184,96 L200,104 V160 H0 Z" fill="#7d8f95"/>
  <path d="M50,50 H150 L166,62 L184,96 L200,104 V120 L120,118 L148,58 Z" fill="#69797f"/>
  <g fill="#fff">${repeat(9, i => `<ellipse cx="${50+i*12.5}" cy="${50 - (i%2)*2}" rx="10" ry="5"/>`)}</g>
  <path d="M0,116 L10,104 Q22,70 34,96 L44,116 Z" fill="#6f8187"/>
  <path d="M0,112 Q100,104 200,112 V124 H0 Z" fill="#7caa5a"/>
  <g>${repeat(18, i => `<rect x="${4+i*11}" y="${110 - (i*5)%7}" width="${6 + i%3}" height="${8 + (i*5)%7}" fill="${['#f4f1ea', '#e6dccb', '#f9e3c6'][i%3]}"/>`)}</g>
  <rect y="122" width="200" height="38" fill="#3f8fc0"/>
  <path d="M10,134 H40 M70,142 H110 M140,132 H180" stroke="#9ccbe6" stroke-width="2" stroke-linecap="round"/>`],

'Great Mosque of Djenné': [['#9fd0ee', '#f3e2c2'], `
  ${sun(30, 26, 10)}
  <rect y="124" width="200" height="36" fill="#e2c08a"/>
  <path d="M26,128 L30,66 H170 L174,128 Z" fill="#b98352"/>
  <g fill="#b98352">${repeat(13, i => `<path d="M${33+i*11},68 V58 Q${36+i*11},53 ${39+i*11},58 V68 Z"/>`)}</g>
  ${[62, 100, 138].map(x => `<path d="M${x-10},128 L${x-9},40 Q${x},22 ${x+9},40 L${x+10},128 Z" fill="#c48d5a"/>
    <circle cx="${x}" cy="27" r="2.6" fill="#fbf6ea"/>
    <g stroke="#6e4a2a" stroke-width="1.6" stroke-linecap="round">${repeat(5, i => `<path d="M${x-12},${48+i*14} h4 M${x+8},${48+i*14} h4 M${x-3},${54+i*14} h6"/>`)}</g>`).join('')}
  <g stroke="#6e4a2a" stroke-width="1.6" stroke-linecap="round">${repeat(4, i => `<path d="M${76+i*6},80 v4 M${114+i*6},80 v4 M${36+i*6},80 v4 M${150+i*6},80 v4"/>`)}</g>
  <path d="M94,128 V110 Q100,102 106,110 V128 Z" fill="#6e4a2a"/>`],

'Great Zimbabwe': [['#a6d6f2', '#eaf5fb'], `
  ${cloud(44, 30, .9)}
  <path d="M0,118 Q100,108 200,118 V160 H0 Z" fill="#a9b45a"/>
  <g fill="#4f7a3a"><circle cx="20" cy="104" r="12"/><circle cx="36" cy="100" r="10"/><circle cx="184" cy="96" r="12"/></g>
  <path d="M150,124 L152,58 Q160,53 168,58 L170,124 Z" fill="#9a8f7e"/>
  <g stroke="#7e7464" stroke-width=".8">${repeat(8, i => `<path d="M151,${64+i*7} h18"/>`)}</g>
  <defs><clipPath id="wall"><path d="M0,128 V72 Q70,56 140,80 L200,100 V128 Z"/></clipPath></defs>
  <path d="M0,128 V72 Q70,56 140,80 L200,100 V128 Z" fill="#8f8576"/>
  <g clip-path="url(#wall)" fill="none" stroke="#776d5f" stroke-width=".9">
    ${repeat(10, i => `<path d="M0,${78+i*5.5} Q70,${62+i*5.5} 140,${86+i*5} L200,${106+i*2.4}"/>`)}
    <path d="${zig()}" stroke="#d8cfbf" stroke-width="1.6"/>
  </g>
  <path d="M84,128 V96 H98 V128 Z" fill="#4b4338"/>
  <path d="M0,130 Q100,122 200,132 V160 H0 Z" fill="#9aa64f"/>`],

'Rock Churches of Lalibela': [['#c97a55', '#c27050'], `
  <g fill="#7f9a4a">${[[16, 20], [30, 140], [180, 30], [170, 146], [10, 92], [192, 100]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7"/><circle cx="${x+7}" cy="${y+3}" r="5"/>`).join('')}</g>
  <rect x="38" y="18" width="124" height="124" rx="4" fill="#6f3423"/>
  <path d="M38,18 H162 L156,24 H44 V136 L38,142 Z" fill="#5a2a1c"/>
  <path d="M84,30 H116 V64 H150 V96 H116 V130 H84 V96 H50 V64 H84 Z" fill="#000" opacity=".25" transform="translate(3 3)"/>
  <path d="M84,30 H116 V64 H150 V96 H116 V130 H84 V96 H50 V64 H84 Z" fill="#d68a62"/>
  <path d="M90,38 H110 V70 H142 V90 H110 V122 H90 V90 H58 V70 H90 Z" fill="none" stroke="#b0603e" stroke-width="2"/>
  <path d="M96,46 H104 V76 H134 V84 H104 V114 H96 V84 H66 V76 H96 Z" fill="none" stroke="#b0603e" stroke-width="2"/>`],
};
