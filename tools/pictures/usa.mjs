import {cloud, sun, arches, repeat} from './common.mjs';
const tree = (x, y, s, c = '#2f5d3a') => `<path d="M${x},${y-24*s} L${x+8*s},${y-6*s} H${x-8*s} Z M${x},${y-16*s} L${x+10*s},${y} H${x-10*s} Z" fill="${c}"/>`;
// windows on a tower: rows of little lights
const lights = (x, y, w, h, c = '#ffd77a', gap = 5) => `<g fill="${c}">${repeat(Math.floor(h/gap), r => repeat(Math.floor(w/4), k => (r*7 + k*3) % 5 ? `<rect x="${x+1+k*4}" y="${y+2+r*gap}" width="2" height="2"/>` : ''))}</g>`;
export default {
'Gateway Arch': [['#9fd0ee', '#eaf5fb'], `
  ${cloud(160, 30, .8)}
  <g fill="#9fb0c2">${[[4, 112, 12], [18, 104, 10], [30, 116, 14], [150, 110, 12], [164, 100, 14], [180, 114, 16]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${130-y}"/>`).join('')}</g>
  <path d="M38,132 C40,70 70,14 100,12 C130,14 160,70 162,132 H150 C148,76 124,26 100,25 C76,26 52,76 50,132 Z" fill="#c9d3dc"/>
  <path d="M38,132 C40,70 70,14 100,12 L100,25 C76,26 52,76 50,132 Z" fill="#eef3f7"/>
  <rect y="128" width="200" height="8" fill="#7cb85e"/>
  <rect y="136" width="200" height="24" fill="#6f8f9c"/>
  <path d="M20,146 H60 M120,152 H170" stroke="#9fb8c2" stroke-width="2" stroke-linecap="round"/>`],

'Space Needle': [['#a9d4f0', '#eef7fb'], `
  <path d="M100,96 L148,50 Q156,44 164,50 L200,84 V110 H60 Z" fill="#a9b8c8"/>
  <path d="M140,58 L148,50 Q156,44 164,50 L172,58 L166,62 L160,56 L152,62 L146,57 Z" fill="#fff"/>
  <path d="M0,118 Q100,110 200,118 V160 H0 Z" fill="#5f9a52"/>
  <g fill="#7f93a8">${[[6, 100, 12], [20, 108, 10], [150, 104, 12], [166, 96, 12], [182, 106, 14]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${130-y}"/>`).join('')}</g>
  <path d="M84,132 L94,74 L97,40 H103 L106,74 L116,132 H110 L102,74 H98 L90,132 Z" fill="#e8ecf0"/>
  <path d="M100,40 L103,40 L106,74 L116,132 H110 L102,74 H100 Z" fill="#c9d1d9"/>
  <path d="M92,60 H108" stroke="#c9d1d9" stroke-width="2"/>
  <ellipse cx="100" cy="36" rx="26" ry="5" fill="#f2f4f6"/>
  <rect x="80" y="30" width="40" height="5" fill="#9fb3c4"/>
  <ellipse cx="100" cy="30" rx="24" ry="4" fill="#e3e7eb"/>
  <path d="M90,27 Q100,18 110,27 Z" fill="#e3e7eb"/>
  <rect x="99.3" y="4" width="1.4" height="18" fill="#c9d1d9"/>
  <rect y="130" width="200" height="30" fill="#4f8a4a"/>`],

'Liberty Bell': [['#f3ead8', '#e9dcc1'], `
  <rect y="126" width="200" height="34" fill="#b9a07a"/>
  <path d="M0,126 H200" stroke="#a08560" stroke-width="2"/>
  <rect x="44" y="20" width="112" height="12" rx="2" fill="#7a5233"/>
  <rect x="58" y="32" width="10" height="94" fill="#8a6040"/><rect x="132" y="32" width="10" height="94" fill="#8a6040"/>
  <rect x="94" y="30" width="12" height="10" fill="#5e5e5e"/>
  <path d="M70,118 Q72,104 76,90 Q78,64 84,50 Q90,40 100,40 Q110,40 116,50 Q122,64 124,90 Q128,104 130,118 Z" fill="#9a7444"/>
  <path d="M100,40 Q110,40 116,50 Q122,64 124,90 Q128,104 130,118 H112 Q110,90 108,62 Q106,46 100,40 Z" fill="#7d5c34"/>
  <rect x="66" y="116" width="68" height="8" rx="3" fill="#8a6639"/>
  <path d="M80,58 H120 M79,64 H121" stroke="#c4a06a" stroke-width="1.2"/>
  <path d="M98,124 L96,112 L99,102 L96,92 L98,82 L95,74" fill="none" stroke="#2f2418" stroke-width="2.2" stroke-linejoin="round"/>
  <circle cx="100" cy="122" r="3" fill="#5e4a30"/>`],

'Alamo': [['#8fc6ee', '#eaf5fb'], `
  ${cloud(40, 26, .8)}
  <g fill="#4f7a3a"><circle cx="18" cy="96" r="18"/><circle cx="182" cy="92" r="20"/><circle cx="168" cy="104" r="14"/></g>
  <rect y="122" width="200" height="38" fill="#c9b892"/>
  <path d="M36,126 V64 H70 Q74,64 76,58 Q86,36 100,36 Q114,36 124,58 Q126,64 130,64 H164 V126 Z" fill="#e3d4ae"/>
  <path d="M36,64 H164 V70 H36 Z" fill="#cdbd94"/>
  <path d="M100,36 Q114,36 124,58 Q126,64 130,64 H164 V126 H100 Z" fill="#000" opacity=".05"/>
  <path d="M88,126 V96 Q100,82 112,96 V126 Z" fill="#6b5a3e"/>
  <path d="M84,96 Q100,76 116,96" fill="none" stroke="#cdbd94" stroke-width="3"/>
  <g fill="#b9a67c">${[[56, 84], [136, 84]].map(([x, y]) => `<path d="M${x-5},${y+22} V${y+6} Q${x},${y} ${x+5},${y+6} V${y+22} Z"/>`).join('')}
    <path d="M51,80 h10 v3 h-10 Z M131,80 h10 v3 h-10 Z"/><rect x="95" y="52" width="10" height="12" rx="5"/></g>
  <path d="M0,130 Q100,124 200,130 V160 H0 Z" fill="#b8a77f"/>`],

'Kennedy Space Center': [['#6fb2e6', '#e3f1fa'], `
  <rect y="128" width="200" height="32" fill="#3f8fc0"/>
  <path d="M0,124 H200 V132 H0 Z" fill="#cdbf98"/>
  <rect x="58" y="30" width="10" height="96" fill="#c0362c"/>
  <g stroke="#c0362c" stroke-width="1.4">${repeat(9, i => `<path d="M58,${36+i*10} L68,${44+i*10} M68,${36+i*10} L58,${44+i*10}"/>`)}<path d="M68,50 H86 M68,80 H86"/></g>
  <path d="M100,8 Q108,18 108,30 V92 H92 V30 Q92,18 100,8 Z" fill="#f6f6f4"/>
  <path d="M100,8 Q108,18 108,30 V92 H100 Z" fill="#dcdcd8"/>
  <path d="M92,24 Q100,10 108,24 Z" fill="#3a3a3a"/>
  <rect x="92" y="44" width="16" height="4" fill="#3a3a3a"/>
  <path d="M92,80 L82,96 H92 Z M108,80 L118,96 H108 Z" fill="#c0362c"/>
  <rect x="94" y="92" width="12" height="5" fill="#555"/>
  <path d="M94,97 Q100,128 106,97 Z" fill="#ffb238"/><path d="M97,97 Q100,116 103,97 Z" fill="#fff3b0"/>
  <g fill="#fff">${[[70, 118, 18], [92, 122, 22], [118, 116, 20], [138, 122, 16], [56, 124, 14], [104, 128, 20]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r/1.6}"/>`).join('')}</g>
  <g fill="#e6eef3"><circle cx="80" cy="126" r="9"/><circle cx="126" cy="126" r="10"/></g>`],

'Hoover Dam': [['#9fd0ee', '#f3e6cf'], `
  <rect y="30" width="200" height="22" fill="#3f8fc0"/>
  <path d="M0,0 H44 Q60,60 56,160 H0 Z" fill="#a86a42"/>
  <path d="M200,0 H156 Q140,60 144,160 H200 Z" fill="#9a5f3a"/>
  <path d="M0,40 Q30,50 46,46 L44,160 H0 Z" fill="#8f5634" opacity=".6"/>
  <path d="M46,48 H154 L144,138 H56 Z" fill="#dcd8cf"/>
  <path d="M46,48 Q100,62 154,48 L144,138 Q100,150 56,138 Z" fill="#cfcac0"/>
  <g stroke="#bdb7ab" stroke-width="1" fill="none">${repeat(6, i => `<path d="M${48+i*1.6},${62+i*13} Q100,${76+i*14} ${152-i*1.6},${62+i*13}"/>`)}</g>
  <rect x="44" y="44" width="112" height="5" fill="#efece6"/>
  ${[60, 76].map(x => `<rect x="${x}" y="22" width="9" height="26" fill="#e9e5dd"/><path d="M${x-1},22 h11 l-2,-4 h-7 Z" fill="#cfc9bd"/>`).join('')}
  <rect x="56" y="136" width="88" height="10" fill="#bdb7ab"/>
  <path d="M60,146 H140 L150,160 H50 Z" fill="#4f8fa8"/>`],

'Devils Tower': [['#9fd0ee', '#eef7fb'], `
  ${cloud(160, 28, .8)}
  <path d="M0,118 Q100,104 200,116 V160 H0 Z" fill="#b8b46a"/>
  <path d="M30,124 Q60,108 80,108 L120,108 Q150,110 172,124 Z" fill="#8f8a6a"/>
  <path d="M74,110 L80,40 Q100,30 120,40 L126,110 Z" fill="#9a8a78"/>
  <path d="M100,32 Q112,34 120,40 L126,110 H104 Z" fill="#7f705f"/>
  <g stroke="#6f6252" stroke-width="1.2">${repeat(9, i => `<path d="M${82+i*4.5},${42 - (i > 2 && i < 7 ? 3 : 0)} L${78+i*5.6},110"/>`)}</g>
  <path d="M80,40 Q100,30 120,40" fill="none" stroke="#b5a693" stroke-width="2"/>
  <path d="M60,118 Q100,104 140,118 L150,124 H50 Z" fill="#a69a86"/>
  ${repeat(12, i => tree(6+i*17, 136 + (i%3)*5, .8 + (i%2)*.25))}
  <path d="M0,146 Q100,138 200,146 V160 H0 Z" fill="#a3a05a"/>`],

'Empire State Building': [['#2f4f86', '#f0b88a'], `
  <g fill="#34465f">${[[0, 92, 22], [24, 104, 18], [44, 86, 16], [140, 90, 18], [160, 102, 16], [178, 84, 22]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${150-y}"/>`).join('')}</g>
  ${lights(0, 94, 20, 50)}${lights(44, 88, 16, 54)}${lights(140, 92, 18, 50)}${lights(178, 86, 20, 58)}
  ${[[100, 150, 56, 112], [100, 112, 44, 82], [100, 82, 32, 48], [100, 48, 22, 36], [100, 36, 14, 26], [100, 26, 8, 18]].map(([x, b, w, t]) => `<rect x="${x-w/2}" y="${t}" width="${w}" height="${b-t}" fill="#b7aea0"/><rect x="${x}" y="${t}" width="${w/2}" height="${b-t}" fill="#968d80"/>`).join('')}
  <g stroke="#7f776b" stroke-width=".8">${repeat(9, i => `<path d="M${88+i*3},50 V150"/>`)}</g>
  ${lights(73, 114, 54, 34)}${lights(79, 84, 42, 26)}${lights(85, 50, 30, 30)}
  <rect x="99.3" y="2" width="1.4" height="17" fill="#b7aea0"/>
  <rect y="148" width="200" height="12" fill="#26354a"/>`],

'Pearl Harbor': [['#8fd0f0', '#eef8fc'], `
  ${cloud(44, 28, .9)}
  <path d="M0,92 Q30,56 70,66 Q110,44 150,62 Q180,56 200,70 V100 H0 Z" fill="#4f8a4a"/>
  <path d="M0,96 Q60,84 120,92 Q160,86 200,94 V104 H0 Z" fill="#3f7a40"/>
  <rect y="100" width="200" height="60" fill="#2f8fc0"/>
  <path d="M30,98 Q100,116 170,98 V112 Q100,126 30,112 Z" fill="#fbfbf8"/>
  <path d="M30,112 Q100,126 170,112 V116 Q100,130 30,116 Z" fill="#dfe3e6"/>
  <g fill="#c4ccd2">${repeat(7, i => { const x = 48+i*15, t = (x+3-30)/140, y = 98 + 4*t*(1-t)*9 + 4; return `<rect x="${x}" y="${y.toFixed(1)}" width="6" height="5" rx="1"/>`; })}</g>
  <rect x="99.4" y="80" width="1.2" height="28" fill="#888"/>
  <g transform="translate(100.6 80)"><rect width="12" height="8" fill="#fff"/>${repeat(4, i => `<rect y="${i*2.1}" width="12" height="1.05" fill="#c8352e"/>`)}<rect width="5" height="4.4" fill="#2c4a8a"/></g>
  <path d="M40,128 h14 v4 h-14 Z M146,128 h14 v4 h-14 Z" fill="#9aa5ad"/>
  <path d="M20,140 H60 M120,148 H180" stroke="#7cc4e4" stroke-width="2" stroke-linecap="round"/>`],

'Monument Valley': [['#7fb8e6', '#f6dcb4'], `
  <path d="M0,112 Q100,104 200,110 V160 H0 Z" fill="#c9673a"/>
  <path d="M22,112 L26,80 H34 L36,64 H44 L46,80 H56 L60,112 Z" fill="#b5532e"/>
  <path d="M120,112 L126,74 H142 L144,58 H150 L152,74 H168 L174,112 Z" fill="#b5532e"/>
  <path d="M142,74 H168 L174,112 H150 Z M36,80 H56 L60,112 H44 Z" fill="#9a4426"/>
  <path d="M80,112 L82,94 H96 L98,112 Z" fill="#a84a29"/>
  <path d="M90,160 L98,112 H104 L130,160 Z" fill="#d98a5c"/>
  <path d="M99,160 L101,112 H102 L106,160 Z" fill="#f2c96a"/>
  <path d="M0,124 Q40,118 70,130 L60,160 H0 Z M200,122 Q160,120 140,134 L150,160 H200 Z" fill="#b85a30"/>
  <g fill="#7a8a4a">${repeat(6, i => `<ellipse cx="${12+i*34}" cy="${140 + (i%2)*8}" rx="5" ry="2.4"/>`)}</g>`],

'Cape Hatteras Lighthouse': [['#9fd0ee', '#eef7fb'], `
  ${cloud(160, 30, .9)}
  <rect y="112" width="200" height="48" fill="#3f8fc0"/>
  <path d="M0,124 Q60,116 120,122 Q160,126 200,120 V160 H0 Z" fill="#ead9a8"/>
  <path d="M0,132 Q30,118 60,126 Q80,120 100,128 L100,160 H0 Z" fill="#c9c08a"/>
  <g fill="#7f9a52">${repeat(8, i => `<path d="M${6+i*11},${130 - (i%2)*4} l2,-8 l2,8 Z"/>`)}</g>
  <defs><clipPath id="tower"><path d="M126,124 L131,30 H145 L150,124 Z"/></clipPath></defs>
  <path d="M126,124 L131,30 H145 L150,124 Z" fill="#fbfbf8"/>
  <g clip-path="url(#tower)" fill="#1f1f1f">${repeat(7, i => `<path d="M120,${42+i*14} L160,${30+i*14} V${37+i*14} L120,${49+i*14} Z"/>`)}</g>
  <rect x="124" y="112" width="28" height="14" fill="#b5533a"/>
  <rect x="130" y="24" width="16" height="6" fill="#1f1f1f"/>
  <rect x="133" y="16" width="10" height="8" fill="#ffe89a"/>
  <path d="M132,16 L138,9 L144,16 Z" fill="#1f1f1f"/>
  <path d="M30,144 H70 M150,150 H190" stroke="#d9c58a" stroke-width="2" stroke-linecap="round"/>`],

'Willis Tower': [['#8fc6ee', '#eaf5fb'], `
  ${cloud(40, 30, .9)}
  <rect y="104" width="70" height="56" fill="#4f9ac8"/>
  <path d="M10,120 H50 M20,136 H60" stroke="#9fd0ea" stroke-width="2" stroke-linecap="round"/>
  <g fill="#8c9bab">${[[70, 104, 14], [86, 112, 10], [150, 100, 16], [168, 110, 12], [182, 96, 18]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${150-y}"/>`).join('')}</g>
  ${[[98, 150, 50, 112, 38], [98, 112, 38, 60, 38], [107, 150, 32, 40, 0], [91, 150, 20, 76, 0]].map(([x, b, w, t]) => `<rect x="${x}" y="${t}" width="${w/2}" height="${b-t}" fill="#2b2f36"/>`).join('')}
  <rect x="98" y="40" width="25" height="110" fill="#2b2f36"/>
  <rect x="86" y="76" width="12" height="74" fill="#33373e"/><rect x="123" y="60" width="12" height="90" fill="#33373e"/><rect x="135" y="104" width="8" height="46" fill="#2b2f36"/>
  <g stroke="#4a515c" stroke-width=".8">${repeat(10, i => `<path d="M86,${84+i*7} H143"/>`)}</g>
  <rect x="103" y="14" width="2" height="26" fill="#e8ecf0"/><rect x="115" y="20" width="2" height="20" fill="#e8ecf0"/>
  <rect y="148" width="200" height="12" fill="#5f6f5a"/>`],
};
