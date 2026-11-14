import {cloud, sun, repeat} from './common.mjs';
// the hummingbird drawn on the Nazca desert: one half, mirrored for the other
const birdHalf = `M100,40 Q108,44 106,58 L104,64 L150,48 L172,40 L160,54 L176,52 L162,64 L176,66 L158,74 L104,84 L106,108 L118,128 L110,130 L104,118 L102,134`;
export default {
'Machu Picchu': [['#b8d8ec', '#eef5f9'], `
  <path d="M0,88 L34,40 L70,74 L96,50 L120,80 V160 H0 Z" fill="#8fa9a0"/>
  <path d="M84,112 L126,20 Q132,15 138,21 L182,112 Z" fill="#3f6b44"/>
  <path d="M132,18 L138,21 L182,112 H150 Z" fill="#335a39"/>
  <path d="M150,96 Q170,70 200,80 V112 H150 Z" fill="#4d7a50"/>
  ${cloud(60, 50, 1.2, .8)}${cloud(170, 66, .9, .75)}
  <path d="M0,104 Q100,94 200,108 V160 H0 Z" fill="#6f9e5c"/>
  ${repeat(6, i => `<path d="M0,${110+i*8} Q60,${104+i*8} 120,${112+i*8} L200,${118+i*8}" fill="none" stroke="#5d8a4c" stroke-width="2"/>`)}
  <g fill="#a39b8c">${[[24, 104, 16, 8], [44, 102, 12, 10], [62, 104, 18, 7], [84, 106, 10, 9], [100, 108, 20, 7], [126, 112, 14, 8], [146, 114, 18, 7]].map(([x, y, w, h]) => `<rect x="${x}" y="${y-h}" width="${w}" height="${h}"/><path d="M${x},${y-h} L${x+w/2},${y-h-5} L${x+w},${y-h} Z"/>`).join('')}</g>
  <g fill="#6f675a">${[[28, 100], [48, 96], [68, 101], [106, 104], [130, 108], [152, 110]].map(([x, y]) => `<path d="M${x},${y} h3 l-.5,-3.5 h-2 Z"/>`).join('')}</g>`],

'Christ the Redeemer': [['#8fc6ee', '#eaf5fb'], `
  ${cloud(40, 34, .9)}
  <path d="M120,160 Q130,120 150,110 Q166,92 176,108 Q186,126 200,130 V160 Z" fill="#6f7f6a"/>
  <path d="M30,160 L88,92 Q100,84 112,92 L170,160 Z" fill="#3f7a44"/>
  <path d="M100,86 L112,92 L170,160 H120 Z" fill="#356a3a"/>
  <path d="M0,136 Q40,128 70,140 V160 H0 Z" fill="#3f8fc0"/><path d="M150,148 Q180,140 200,142 V160 H150 Z" fill="#3f8fc0"/>
  <rect x="95" y="80" width="10" height="8" fill="#d9d6cf"/>
  <path d="M95,80 L96.5,52 H103.5 L105,80 Z" fill="#f1f1ee"/>
  <path d="M100,52 H103.5 L105,80 H100 Z" fill="#dcdcd6"/>
  <path d="M74,52 Q76,50 96,50 H104 Q124,50 126,52 L126,55 Q116,56 104,57 H96 Q84,56 74,55 Z" fill="#f1f1ee"/>
  <circle cx="100" cy="46" r="3.6" fill="#f1f1ee"/>`],

'Iguazu Falls': [['#a9d4f0', '#eef7fb'], `
  <path d="M0,30 Q50,22 100,28 T200,26 V52 H0 Z" fill="#3f8a44"/>
  <g fill="#2f7a3a">${repeat(10, i => `<circle cx="${i*22}" cy="${30 - (i%2)*4}" r="${12 + (i%3)*2}"/>`)}</g>
  <rect y="46" width="200" height="8" fill="#8a7a5a"/>
  ${[[6, 30], [44, 22], [74, 36], [118, 24], [150, 40]].map(([x, w]) => `<rect x="${x}" y="52" width="${w}" height="40" fill="#eef7fb"/><g stroke="#c4e2ef" stroke-width="1.6">${repeat(Math.floor(w/5), i => `<path d="M${x+3+i*5},54 V${86 - (i%2)*6}"/>`)}</g>`).join('')}
  <g fill="#3f7a40">${[[0, 6], [36, 8], [66, 8], [110, 8], [142, 8], [190, 10]].map(([x, w]) => `<rect x="${x}" y="52" width="${w}" height="40"/>`).join('')}</g>
  <path d="M0,88 Q100,80 200,88 V100 H0 Z" fill="#4c8a48"/>
  ${[[20, 40], [80, 46], [140, 50]].map(([x, w]) => `<rect x="${x}" y="98" width="${w}" height="26" fill="#eef7fb"/><g stroke="#c4e2ef" stroke-width="1.6">${repeat(Math.floor(w/5), i => `<path d="M${x+3+i*5},100 V${120 - (i%2)*5}"/>`)}</g>`).join('')}
  <g fill="#3f7a40"><rect x="0" y="98" width="20" height="26"/><rect x="60" y="98" width="20" height="26"/><rect x="126" y="98" width="14" height="26"/><rect x="190" y="98" width="10" height="26"/></g>
  <rect y="122" width="200" height="38" fill="#7a9a8a"/>
  <g fill="#fff" opacity=".85"><ellipse cx="40" cy="122" rx="30" ry="7"/><ellipse cx="104" cy="124" rx="34" ry="8"/><ellipse cx="166" cy="122" rx="30" ry="7"/></g>
  <g fill="#2f7a3a"><circle cx="8" cy="150" r="16"/><circle cx="194" cy="148" r="16"/></g>`],

'Angel Falls': [['#9fd0ee', '#eef7fb'], `
  <path d="M10,160 V40 Q14,30 50,30 H146 Q160,30 162,42 L168,160 Z" fill="#6d5a50"/>
  <path d="M10,40 Q14,30 50,30 H146 Q160,30 162,42 V46 H10 Z" fill="#4f8a48"/>
  <path d="M120,46 H162 L168,160 H130 Z" fill="#5a4a42"/>
  <g stroke="#58463d" stroke-width="1.2" opacity=".7"><path d="M30,50 V150 M56,50 V140 M80,52 V150 M140,52 V150"/></g>
  <path d="M98,32 Q96,70 100,110 Q104,128 96,142 H112 Q108,124 106,104 Q102,70 104,32 Z" fill="#f4fbff"/>
  <path d="M100,40 V120" stroke="#c9e6f4" stroke-width="1"/>
  ${cloud(40, 84, 1.3, .8)}${cloud(170, 98, 1.1, .8)}
  <path d="M0,136 Q50,124 100,134 T200,130 V160 H0 Z" fill="#3f7a40"/>
  <g fill="#2f6a35">${repeat(10, i => `<circle cx="${i*22+4}" cy="${142 + (i%2)*5}" r="${10 + (i%3)*2}"/>`)}</g>
  <g fill="#fff" opacity=".85"><ellipse cx="104" cy="140" rx="18" ry="6"/></g>`],

'Mitad del Mundo': [['#9fd0ee', '#eef7fb'], `
  <path d="M0,104 L30,72 L56,90 L84,62 L120,92 L150,66 L180,86 L200,74 V120 H0 Z" fill="#8fa3a0"/>
  <rect y="116" width="200" height="44" fill="#d9d2c4"/>
  <path d="M96,128 L104,128 L132,160 H68 Z" fill="#f2c230"/>
  <path d="M99,128 L101,128 L102,160 H98 Z" fill="#d9413a"/>
  <rect x="72" y="122" width="56" height="8" fill="#bfb5a2"/>
  <path d="M82,124 L88,50 H112 L118,124 Z" fill="#cfc6b4"/>
  <path d="M100,50 H112 L118,124 H100 Z" fill="#bcb29e"/>
  <rect x="96" y="104" width="8" height="18" fill="#a99f8a"/>
  <circle cx="100" cy="36" r="14" fill="#b07a3c"/>
  <g fill="none" stroke="#d9a75c" stroke-width="1.2"><ellipse cx="100" cy="36" rx="6" ry="14"/><path d="M86,36 H114 M88,29 H112 M88,43 H112 M100,22 V50"/></g>
  <rect x="94" y="48" width="12" height="3" fill="#a99f8a"/>`],

'Perito Moreno Glacier': [['#9fd0ee', '#eef7fb'], `
  <path d="M0,80 L30,36 L52,58 L80,24 L110,56 L140,30 L170,58 L200,40 V100 H0 Z" fill="#7d8ea0"/>
  <path d="M30,36 L22,48 L30,46 L36,52 L40,44 Z M80,24 L70,40 L80,36 L88,42 L92,36 Z M140,30 L130,44 L140,40 L148,46 L152,40 Z" fill="#fff"/>
  <path d="M0,72 Q60,60 120,70 Q170,74 200,68 V100 H0 Z" fill="#e7f2f8"/>
  <g fill="none" stroke="#c4dbe8" stroke-width="1.4"><path d="M10,76 Q60,66 110,76 M20,84 Q80,74 150,82 M120,72 Q160,76 196,72"/></g>
  <path d="M0,92 L8,88 L14,94 L22,86 L30,92 L38,84 L46,92 L56,86 L64,94 L74,86 L84,92 L94,84 L104,92 L114,86 L124,94 L134,86 L144,92 L154,84 L164,92 L174,86 L184,94 L200,88 V118 H0 Z" fill="#cfe6f2"/>
  <g fill="#9ccbe4">${repeat(20, i => `<path d="M${i*10+2},${92 + (i%2)*2} l3,24 h-4 Z"/>`)}</g>
  <path d="M0,104 H200 V118 H0 Z" fill="#a9d6ea"/>
  <rect y="116" width="200" height="44" fill="#5aa9b8"/>
  <g fill="#e7f2f8"><path d="M30,132 l8,-5 l10,3 l2,4 Z"/><path d="M120,144 l6,-4 l9,2 l1,3 Z"/><path d="M160,128 l5,-3 l6,2 l1,2 Z"/></g>
  <path d="M60,138 H90 M150,152 H180" stroke="#8fd0dc" stroke-width="2" stroke-linecap="round"/>`],

'Salar de Uyuni': [['#6aaee6', '#d9ecf8'], `
  <defs><linearGradient id="mirror" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9ecf8"/><stop offset="1" stop-color="#6aaee6"/></linearGradient></defs>
  ${cloud(50, 36, 1.2)}${cloud(150, 52, 1)}
  <path d="M0,80 L20,72 L40,78 L70,66 L96,78 L130,70 L160,78 L200,72 V82 H0 Z" fill="#9a8fa8"/>
  <rect y="82" width="200" height="78" fill="url(#mirror)"/>
  <path d="M0,82 L20,90 L40,84 L70,96 L96,84 L130,92 L160,84 L200,90 V82 Z" fill="#9a8fa8" opacity=".55"/>
  <g transform="translate(0 164) scale(1 -1)" opacity=".6">${cloud(50, 36, 1.2)}${cloud(150, 52, 1)}</g>
  <g fill="none" stroke="#fff" stroke-width="1" opacity=".55">${repeat(7, i => `<path d="M${-20+i*34},${150} l10,-12 h14 l10,12 l-10,12 h-14 Z"/>`)}${repeat(6, i => `<path d="M${-3+i*34},${126} l6,-7 h9 l6,7 l-6,7 h-9 Z"/>`)}</g>`],

'Nazca Lines': [['#d9a877', '#cf9c6b'], `
  <g fill="#b98a5c" opacity=".55">${repeat(60, i => `<circle cx="${(i*37)%200}" cy="${(i*53)%160}" r="${1 + (i%3)*.6}"/>`)}</g>
  <path d="M-10,150 L210,20" stroke="#ead2b4" stroke-width="3" opacity=".7"/>
  <path d="M0,10 L70,160 H110 Z" fill="#e3c4a0" opacity=".5"/>
  <g fill="none" stroke="#f6e4cc" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
    <path d="${birdHalf}"/><path d="${birdHalf}" transform="translate(200 0) scale(-1 1)"/>
    <path d="M100,40 V6"/>
  </g>`],
};
