import {cloud, sun, arches, repeat} from './common.mjs';
// a lotus-bud tower (Angkor Wat)
const bud = (x, top, base, w, fill) => `<path d="M${x-w},${base} L${x-w*.9},${top+(base-top)*.45} Q${x-w*.85},${top+10} ${x},${top} Q${x+w*.85},${top+10} ${x+w*.9},${top+(base-top)*.45} L${x+w},${base} Z" fill="${fill}"/>
  <g stroke="#6d665a" stroke-width=".9">${repeat(4, i => { const y = top + 14 + i*(base-top-14)/4; return `<path d="M${x-w*.9},${y.toFixed(1)} H${x+w*.9}"/>`; })}</g>`;
// a terracotta soldier, standing at x with his feet at y
const soldier = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}">
  <path d="M-9,0 L-8,-26 Q0,-30 8,-26 L9,0 Z"/><rect x="-11" y="-26" width="4" height="16" rx="2"/><rect x="7" y="-26" width="4" height="16" rx="2"/>
  <circle cx="0" cy="-33" r="5.5"/><circle cx="2.5" cy="-39" r="2.6"/>
  <path d="M-8,-12 H8" stroke="#8a4f2e" stroke-width="1.4"/></g>`;
// a bell-shaped stupa (Borobudur)
const stupa = (x, y, s) => `<path d="M${x-6*s},${y} Q${x-6*s},${y-9*s} ${x},${y-10*s} Q${x+6*s},${y-9*s} ${x+6*s},${y} Z" fill="#9b9286"/><rect x="${x-.8*s}" y="${y-14*s}" width="${1.6*s}" height="${5*s}" fill="#9b9286"/>`;
export default {
'Great Wall of China': [['#bfe0f4', '#eef7fb'], `
  <path d="M0,90 L30,60 L60,80 L100,44 L140,74 L170,50 L200,66 V160 H0 Z" fill="#9fb8b0"/>
  <path d="M0,112 Q40,80 80,96 Q120,70 160,84 Q184,76 200,80 V160 H0 Z" fill="#6f9e5c"/>
  <path d="M0,140 Q60,110 110,126 Q160,108 200,116 V160 H0 Z" fill="#5a8a4a"/>
  <path d="M-10,148 Q20,128 46,118 T96,98 T140,90 T176,72 T210,70" fill="none" stroke="#a8977c" stroke-width="10" stroke-linecap="round"/>
  <path d="M-10,145 Q20,125 46,115 T96,95 T140,87 T176,69 T210,67" fill="none" stroke="#d3c3a6" stroke-width="3"/>
  ${[[46, 116, 1], [100, 96, .85], [140, 88, .75], [178, 70, .65]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-9" y="-16" width="18" height="16" fill="#b8a68a"/><rect x="-10" y="-18" width="20" height="3" fill="#c9b898"/>
    ${repeat(4, i => `<rect x="${-10+i*5.4}" y="-22" width="3.2" height="4" fill="#c9b898"/>`)}
    <path d="M-3,0 V-7 Q0,-10 3,-7 V0 Z" fill="#5d5242"/></g>`).join('')}`],

'Taj Mahal': [['#f7c9a3', '#fbe8d4'], `
  <defs><linearGradient id="pool" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fc3df"/><stop offset="1" stop-color="#6aa7cc"/></linearGradient></defs>
  <rect y="124" width="200" height="36" fill="#7fae5f"/>
  <path d="M78,124 H122 L132,160 H68 Z" fill="url(#pool)"/>
  <g stroke="#cbbfa9" stroke-width="1" fill="#fbf7ef">
    <rect x="30" y="66" width="7" height="52"/><rect x="163" y="66" width="7" height="52"/>
    <path d="M29,66 Q33.5,56 38,66 Z"/><path d="M162,66 Q166.5,56 171,66 Z"/>
    <rect x="28.5" y="80" width="10" height="2"/><rect x="28.5" y="96" width="10" height="2"/><rect x="161.5" y="80" width="10" height="2"/><rect x="161.5" y="96" width="10" height="2"/>
    <rect x="24" y="116" width="152" height="9"/>
    <rect x="60" y="80" width="80" height="36"/>
    <rect x="48" y="90" width="12" height="26"/><rect x="140" y="90" width="12" height="26"/>
    <path d="M62,80 Q62,68 70,64 Q78,68 78,80 Z"/><path d="M122,80 Q122,68 130,64 Q138,68 138,80 Z"/>
    <rect x="80" y="72" width="40" height="9"/>
    <path d="M78,72 C70,54 86,40 100,34 C114,40 130,54 122,72 Z"/>
  </g>
  <g fill="#e3d7c2">
    <path d="M89,116 V94 Q100,82 111,94 V116 Z"/>
    <path d="M66,116 V102 Q70,96 74,102 V116 Z"/><path d="M126,116 V102 Q130,96 134,102 V116 Z"/>
    <path d="M66,94 V88 Q70,84 74,88 V94 Z"/><path d="M126,94 V88 Q130,84 134,88 V94 Z"/>
  </g>
  <g stroke="#cbbfa9" stroke-width="1.2"><path d="M100,34 V24 M70,64 V58 M130,64 V58"/></g>
  <circle cx="100" cy="23" r="2" fill="#d8b45a"/>
  <path d="M86,132 Q100,129 114,132 M84,140 Q100,137 116,140" stroke="#fff" stroke-width="1.2" opacity=".55" fill="none"/>`],

'Mount Everest': [['#5f9fdb', '#d6e9f7'], `
  <path d="M0,100 L30,70 L52,86 L70,64 L90,84 V160 H0 Z" fill="#8a93a8"/>
  <path d="M150,90 L176,62 L200,80 V160 H120 Z" fill="#8a93a8"/>
  <path d="M30,140 L112,28 L168,96 L200,112 V160 H0 Z" fill="#646b7e"/>
  <path d="M112,28 L168,96 L200,112 V160 H130 L120,70 Z" fill="#535a6c"/>
  <path d="M112,28 L94,54 L102,52 L90,74 L104,64 L110,80 L118,62 L128,72 L126,54 L138,62 Z" fill="#fff"/>
  <path d="M30,70 L40,80 L44,76 L52,86 L40,78 Z M70,64 L64,74 L76,70 Z M176,62 L168,72 L180,68 L186,70 Z" fill="#fff"/>
  <path d="M114,30 Q150,24 186,32 Q150,30 120,36 Z" fill="#fff" opacity=".75"/>
  <path d="M0,142 Q50,132 100,140 T200,138 V160 H0 Z" fill="#8c8679"/>
  <path d="M-2,108 Q60,138 202,118" fill="none" stroke="#6b5a48" stroke-width=".8"/>
  ${repeat(13, i => { const t = (i+.5)/13, x = -2 + t*204, y = (1-t)*(1-t)*108 + 2*(1-t)*t*138 + t*t*118, c = ['#3a7bd5', '#f4f4f4', '#d9413a', '#3fa45b', '#f2c230'][i%5];
    return `<path d="M${(x-4).toFixed(1)},${(y-.4).toFixed(1)} L${(x+4).toFixed(1)},${(y+.3).toFixed(1)} L${x.toFixed(1)},${(y+9).toFixed(1)} Z" fill="${c}"/>`; })}`],

'Angkor Wat': [['#f2a97c', '#fbe0c4'], `
  ${sun(150, 50, 14, '#fbd38a')}
  <rect y="114" width="200" height="46" fill="#6a9a58"/>
  <rect y="120" width="200" height="40" fill="#e9b693"/>
  <g transform="translate(0 170) scale(1 -.5)" opacity=".28">${bud(100, 34, 108, 10, '#5f574b')}${bud(70, 54, 108, 8, '#5f574b')}${bud(130, 54, 108, 8, '#5f574b')}</g>
  ${bud(44, 66, 104, 7, '#8a8172')}${bud(156, 66, 104, 7, '#8a8172')}${bud(70, 54, 104, 8, '#958c7c')}${bud(130, 54, 104, 8, '#958c7c')}${bud(100, 32, 104, 10, '#a09684')}
  <rect x="18" y="98" width="164" height="16" fill="#8a8172"/>
  <path d="M14,98 L22,92 H178 L186,98 Z" fill="#7a7264"/>
  ${arches(24, 14, 11, 6, 102, 114, '#5a5246')}
  <g fill="#3f5d36"><path d="M8,114 L11,84 L13,114 Z"/><ellipse cx="11" cy="84" rx="9" ry="4"/><path d="M188,114 L191,88 L193,114 Z"/><ellipse cx="191" cy="88" rx="9" ry="4"/></g>`],

'Petra': [['#f2c6a8', '#f6dcc6'], `
  <rect width="200" height="160" fill="#c46f55"/>
  <path d="M30,0 Q40,40 36,80 Q30,120 40,160 H160 Q170,120 164,80 Q160,40 170,0 Z" fill="#d5866a"/>
  <path d="M48,134 V52 H152 V134 Z" fill="#e7a483"/>
  <rect x="52" y="86" width="96" height="6" fill="#d99375"/>
  <path d="M52,86 L100,72 L148,86 Z" fill="#eeb090"/>
  <g fill="#f0b896">${repeat(6, i => `<rect x="${56+i*16.5}" y="92" width="6" height="38"/>`)}</g>
  <rect x="93" y="104" width="14" height="30" fill="#5a2c1e"/>
  <rect x="50" y="128" width="100" height="6" fill="#d99375"/>
  <g fill="#f0b896"><rect x="58" y="48" width="5" height="24"/><rect x="72" y="48" width="5" height="24"/><rect x="123" y="48" width="5" height="24"/><rect x="137" y="48" width="5" height="24"/></g>
  <path d="M54,48 L68,40 L80,48 Z M120,48 L132,40 L146,48 Z" fill="#eeb090"/>
  <rect x="88" y="42" width="24" height="30" fill="#efb390"/>
  <g fill="#e09a7a"><rect x="92" y="44" width="3" height="28"/><rect x="99" y="44" width="3" height="28"/><rect x="106" y="44" width="3" height="28"/></g>
  <path d="M86,42 Q100,26 114,42 Z" fill="#eeb090"/><rect x="98" y="22" width="4" height="8" rx="2" fill="#eeb090"/>
  <path d="M0,0 H34 Q22,50 30,90 Q38,130 24,160 H0 Z" fill="#a85a43"/>
  <path d="M200,0 H166 Q178,50 170,90 Q162,130 176,160 H200 Z" fill="#a85a43"/>
  <path d="M0,148 Q100,140 200,148 V160 H0 Z" fill="#d9a07e"/>`],

'Mount Fuji': [['#a9d4f0', '#edf6fb'], `
  ${cloud(40, 34, .8)}
  <path d="M0,132 L80,52 Q100,44 120,52 L200,132 Z" fill="#5b78a8"/>
  <path d="M120,52 L200,132 H140 Z" fill="#4c6896" opacity=".7"/>
  <path d="M80,52 Q100,44 120,52 L134,66 L126,64 L120,72 L112,64 L104,72 L96,64 L88,72 L80,64 L72,68 Z" fill="#fff"/>
  <path d="M0,124 Q100,116 200,124 V160 H0 Z" fill="#8bb8d6"/>
  <path d="M30,134 H60 M120,140 H170" stroke="#c4e0f0" stroke-width="2" stroke-linecap="round"/>
  <path d="M0,150 Q30,128 60,132 L70,160 H0 Z" fill="#3e6b44"/>
  <g transform="translate(30 132)">
    ${repeat(5, i => `<rect x="${-7+i*1.1}" y="${-10-i*9}" width="${14-i*2.2}" height="${9}" fill="#f2ead8"/><path d="M${-12+i*1.6},${-10-i*9} L${-6+i*1.2},${-15-i*9} H${6-i*1.2} L${12-i*1.6},${-10-i*9} Z" fill="#c8352e"/>`)}
    <rect x="-.6" y="-62" width="1.2" height="9" fill="#c8352e"/></g>
  <g fill="#f4b6c8">${[[180, 8, 10], [168, 18, 8], [190, 26, 9], [158, 6, 7], [176, 32, 6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>
  <path d="M200,14 Q180,18 160,10 M196,30 Q186,28 172,34" stroke="#6b4a3a" stroke-width="1.6" fill="none"/>`],

'Burj Khalifa': [['#7fbbe6', '#f3e2c2'], `
  <rect y="132" width="200" height="28" fill="#e3c48c"/>
  <g fill="#9fb0c2">${[[10, 108, 14], [28, 116, 10], [40, 100, 12], [56, 112, 14], [132, 106, 12], [148, 114, 14], [166, 98, 12], [182, 110, 14]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${132-y}"/>`).join('')}</g>
  ${[[100, 132, 34, 98], [100, 98, 28, 70], [100, 70, 22, 48], [100, 48, 16, 30], [100, 30, 10, 16]].map(([x, b, w, t]) => `<rect x="${x-w/2}" y="${t}" width="${w}" height="${b-t}" fill="#b8c6d4"/><rect x="${x-w/2}" y="${t}" width="${w/2}" height="${b-t}" fill="#d9e3ec"/>`).join('')}
  <path d="M97,16 L100,0 L103,16 Z" fill="#b8c6d4"/>
  <g stroke="#9fb0c2" stroke-width=".8">${repeat(16, i => `<path d="M${84+ (i < 5 ? 0 : i < 9 ? 3 : i < 12 ? 6 : 9)},${126-i*7} H${116 - (i < 5 ? 0 : i < 9 ? 3 : i < 12 ? 6 : 9)}"/>`)}</g>`],

'Terracotta Army': [['#8a5a3a', '#a46a44'], `
  <rect width="200" height="160" fill="#9b6340"/>
  <rect y="0" width="200" height="22" fill="#7a4a2e"/>
  ${repeat(9, i => soldier(14+i*21.5, 56, .62, '#b57a52'))}
  <rect y="56" width="200" height="8" fill="#86532f"/>
  ${repeat(7, i => soldier(16+i*28, 100, .85, '#be8259'))}
  <rect y="100" width="200" height="10" fill="#86532f"/>
  ${repeat(5, i => soldier(22+i*39, 152, 1.15, '#c88b60'))}`],

'Petronas Towers': [['#35588f', '#f0a97c'], `
  <path d="M0,130 H200 V160 H0 Z" fill="#2f3f5a"/>
  <g fill="#3d5172">${[[0, 104, 20], [22, 112, 16], [168, 100, 14], [184, 110, 16], [86, 116, 28]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${130-y}"/>`).join('')}</g>
  ${[62, 138].map(x => `${[[132, 26, 70], [70, 22, 52], [52, 17, 40], [40, 12, 30], [30, 7, 22]].map(([b, w, t]) => `<rect x="${x-w/2}" y="${t}" width="${w}" height="${b-t}" fill="#c3ccd6"/><rect x="${x}" y="${t}" width="${w/2}" height="${b-t}" fill="#a5b0bd"/>`).join('')}
    <path d="M${x-1.4},22 L${x},4 L${x+1.4},22 Z" fill="#c3ccd6"/>
    <g fill="#ffd77a">${repeat(14, i => `<rect x="${x-8+(i%3)*6}" y="${74+Math.floor(i/3)*11}" width="2.4" height="3"/>`)}</g>`).join('')}
  <rect x="74" y="78" width="52" height="5" fill="#d7dee6"/>
  <path d="M84,83 L100,98 L116,83" fill="none" stroke="#d7dee6" stroke-width="2"/>`],

'Borobudur': [['#bcdcef', '#f2ece0'], `
  <path d="M110,92 L150,40 Q156,36 162,40 L200,84 V100 H110 Z" fill="#8fa3b4"/>
  <path d="M154,36 Q150,26 158,20 Q166,16 164,8" fill="none" stroke="#e8eef2" stroke-width="5" stroke-linecap="round"/>
  <path d="M0,104 Q40,84 80,96 Q140,80 200,98 V160 H0 Z" fill="#4f8a4a"/>
  <g fill="#3d7339"><circle cx="16" cy="112" r="12"/><circle cx="184" cy="110" r="12"/><circle cx="30" cy="118" r="9"/><circle cx="172" cy="118" r="9"/></g>
  ${[[20, 160, 128], [32, 136, 116], [44, 112, 104], [56, 88, 92], [68, 64, 82]].map(([x, w, y], i) => `<rect x="${100-w/2}" y="${y}" width="${w}" height="${i ? 12 : 16}" fill="${i%2 ? '#8d8478' : '#7f776c'}"/>`).join('')}
  ${repeat(7, i => stupa(72+i*9.3, 82, .9))}
  ${repeat(5, i => stupa(80+i*10, 74, .8))}
  <path d="M86,74 Q86,56 100,52 Q114,56 114,74 Z" fill="#a39a8e"/><rect x="98" y="38" width="4" height="15" fill="#a39a8e"/>
  <rect x="96" y="116" width="8" height="28" fill="#6e675d"/>
  <rect y="144" width="200" height="16" fill="#5f9a52"/>`],
};
