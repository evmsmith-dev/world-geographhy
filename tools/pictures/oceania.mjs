import {cloud, sun, repeat} from './common.mjs';
// one of the Sydney Opera House's shells, from x (back) leaning forward to x+w, h tall, standing on y
const shell = (x, w, h, y = 106) => `<path d="M${x},${y} C${x},${y-h*.55} ${x+w*.25},${y-h} ${x+w*.62},${y-h} L${x+w},${y} Z" fill="#fbfbf8"/>
  <path d="M${x+w*.62},${y-h} L${x+w},${y} L${x+w*.82},${y} Z" fill="#dfe3e6"/>
  <path d="M${x+w*.2},${y} C${x+w*.22},${y-h*.5} ${x+w*.38},${y-h*.82} ${x+w*.62},${y-h}" fill="none" stroke="#e3e6e8" stroke-width="1"/>`;
// a little fish
const fish = (x, y, s, c, flip) => `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><ellipse cx="0" cy="0" rx="8" ry="4.5" fill="${c}"/><path d="M6,0 L13,-5 L13,5 Z" fill="${c}"/><circle cx="-4.5" cy="-1" r="1.2" fill="#123"/><path d="M-1,-4 V4" stroke="#fff" stroke-width="1.4" opacity=".8"/></g>`;
// a glowworm: a dot of blue-green light with a soft glow, and sometimes a hanging silk thread
const glow = (x, y, r, thread) => `${thread ? `<path d="M${x},${y} v${thread}" stroke="#5fd8c8" stroke-width=".5" opacity=".5"/>` : ''}<circle cx="${x}" cy="${y}" r="${r*2.6}" fill="#7ff6e0" opacity=".16"/><circle cx="${x}" cy="${y}" r="${r}" fill="#b8fff2"/>`;
const rnd = (i, k) => ((Math.sin(i*12.9898 + k*78.233) * 43758.5453) % 1 + 1) % 1; // the same "random" numbers every time
export default {
'Sydney Opera House': [['#9fd0ee', '#e6f3fb'], `
  ${cloud(160, 26, .8)}
  <path d="M-10,98 Q30,40 70,98" fill="none" stroke="#9aaebf" stroke-width="4"/>
  <path d="M-10,98 H74" stroke="#9aaebf" stroke-width="3"/>
  <g stroke="#9aaebf" stroke-width="1">${repeat(7, i => { const x = -2 + i*10, y = 98 - Math.sin(Math.PI*(x+10)/80)*58*.98; return `<path d="M${x},${y.toFixed(1)} V98"/>`; })}</g>
  <rect y="104" width="200" height="56" fill="#3f8fc0"/>
  <rect x="26" y="104" width="156" height="12" fill="#d9b98a"/><rect x="26" y="114" width="156" height="4" fill="#c4a272"/>
  ${shell(36, 36, 30)}${shell(52, 34, 22)}${shell(74, 52, 56)}${shell(96, 46, 42)}${shell(118, 36, 30)}${shell(134, 40, 44)}${shell(152, 28, 26)}
  <path d="M20,132 H60 M110,140 H170" stroke="#9ccbe6" stroke-width="2" stroke-linecap="round"/>`],

'Uluru': [['#e9846a', '#fcd9a8'], `
  ${sun(160, 40, 12, '#ffe2a0')}
  <path d="M0,118 Q100,112 200,118 V160 H0 Z" fill="#d6763f"/>
  <path d="M12,122 Q14,98 36,90 Q60,82 110,80 Q160,82 180,92 Q192,102 192,122 Z" fill="#c4562f"/>
  <path d="M36,90 Q60,82 110,80 Q160,82 180,92 Q150,88 110,87 Q60,88 36,90 Z" fill="#dd7442"/>
  <g stroke="#9e3f20" stroke-width="1.4" fill="none">${repeat(9, i => `<path d="M${44+i*16},${86 + (i%2)*2} q${i%2 ? 3 : -3},14 ${i%3 - 1},34"/>`)}</g>
  <path d="M0,130 Q100,122 200,132 V160 H0 Z" fill="#c9672f"/>
  <g fill="#9aa86a">${repeat(9, i => `<ellipse cx="${10+i*23}" cy="${140 + (i%3)*6}" rx="7" ry="3"/>`)}</g>`],

'Great Barrier Reef': [['#4cc3dc', '#0f6f9a'], `
  <g fill="#fff" opacity=".12"><path d="M40,0 L60,0 L30,160 L10,160 Z"/><path d="M110,0 L124,0 L104,160 L90,160 Z"/><path d="M170,0 L180,0 L170,160 L160,160 Z"/></g>
  <path d="M0,136 Q100,126 200,136 V160 H0 Z" fill="#e8d9a8"/>
  <g fill="none" stroke="#f07aa0" stroke-width="5" stroke-linecap="round"><path d="M30,140 V112 M30,124 L18,106 M30,120 L42,100 M42,100 V92 M18,106 V96"/></g>
  <circle cx="72" cy="136" r="14" fill="#c8b45a"/><g fill="none" stroke="#a8963e" stroke-width="1.2"><path d="M62,132 q5,-6 10,0 t10,0 M64,140 q5,-6 10,0 t8,0"/></g>
  <path d="M120,142 Q104,110 112,90 Q130,100 138,86 Q150,108 136,142 Z" fill="#9b6fd0"/>
  <g stroke="#7b52b0" stroke-width=".9">${repeat(6, i => `<path d="M128,142 L${108+i*7},${96 + (i%2)*6}"/>`)}</g>
  <g fill="#f59a42">${repeat(7, i => `<ellipse cx="${166+i*4}" cy="${138 - (i%2)*4}" rx="2" ry="9" transform="rotate(${-30+i*10} ${166+i*4} 140)"/>`)}</g>
  <g fill="#5bbf8a">${repeat(5, i => `<path d="M${88+i*3},144 q-4,-14 ${i%2 ? 3 : -3},-26" fill="none" stroke="#5bbf8a" stroke-width="2.2"/>`)}</g>
  ${fish(60, 60, 1.3, '#f7a531')}${fish(150, 46, 1, '#ffd43b', true)}${fish(166, 76, .8, '#ffd43b', true)}${fish(96, 84, .9, '#ff7a59')}
  <g transform="translate(120 104) rotate(-12)"><ellipse rx="14" ry="10" fill="#6b8f4a"/><path d="M-12,-2 Q-24,-12 -20,0 Z M12,-2 Q24,-12 20,0 Z M-10,6 L-18,12 L-8,9 Z M10,6 L18,12 L8,9 Z" fill="#7ea35a"/><circle cx="17" cy="-1" r="5" fill="#7ea35a"/>
    <g fill="none" stroke="#55753a" stroke-width="1"><path d="M-8,-6 L0,-2 L8,-6 M-8,6 L0,2 L8,6 M0,-2 V2"/></g></g>
  <g fill="#e8f8ff" opacity=".7"><circle cx="54" cy="44" r="2"/><circle cx="50" cy="34" r="1.5"/><circle cx="55" cy="26" r="1"/></g>`],

'Twelve Apostles': [['#b4dcf2', '#eef7fb'], `
  ${cloud(60, 28, .9)}
  <rect y="88" width="200" height="72" fill="#3c8cc0"/>
  <path d="M130,92 L140,62 H200 V160 H118 Z" fill="#d9a868"/>
  <path d="M140,62 H200 V70 H139 Z" fill="#6f9e4f"/>
  <path d="M130,92 L140,62 L146,62 L138,160 H118 Z" fill="#c4914f"/>
  ${[[26, 74, 12], [56, 66, 14], [86, 80, 10], [108, 70, 12]].map(([x, t, w]) => `<path d="M${x-w/2},132 L${x-w/2+2},${t+4} Q${x},${t-2} ${x+w/2-2},${t+4} L${x+w/2},132 Z" fill="#dcae6e"/><path d="M${x+1},${t} Q${x+w/2-2},${t+2} ${x+w/2-2},${t+4} L${x+w/2},132 H${x+2} Z" fill="#c4914f"/><path d="M${x-w/2+2},${t+4} Q${x},${t-3} ${x+w/2-2},${t+4} Z" fill="#7da35a"/>`).join('')}
  <g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".85"><path d="M14,134 q6,-3 12,0 M44,134 q8,-3 16,0 M78,134 q6,-3 14,0 M100,134 q8,-3 16,0 M112,150 q10,-3 20,0 M30,148 h20 M70,154 h22"/></g>`],

'Milford Sound': [['#c4dceb', '#eef5f9'], `
  ${cloud(150, 24, 1, .9)}
  <path d="M0,112 L0,40 L24,70 L36,112 Z" fill="#4c6b5c"/>
  <path d="M30,112 L84,12 L124,112 Z" fill="#3d5d50"/>
  <path d="M84,12 L124,112 H96 Z" fill="#2f4d41"/>
  <path d="M84,12 L78,26 L86,22 L82,34 L92,26 Z" fill="#fff"/>
  <path d="M110,112 L150,48 L200,30 V112 Z" fill="#4c6b5c"/>
  <path d="M168,44 Q166,80 170,112" stroke="#fff" stroke-width="2.4" fill="none"/>
  <rect y="110" width="200" height="50" fill="#2f6f86"/>
  <g transform="translate(0 222) scale(1 -1)" opacity=".3"><path d="M30,112 L84,12 L124,112 Z" fill="#1f3d34"/><path d="M110,112 L150,48 L200,30 V112 Z" fill="#1f3d34"/></g>
  <g transform="translate(130 128)"><path d="M-12,0 H14 L10,6 H-10 Z" fill="#fff"/><rect x="-6" y="-5" width="12" height="5" fill="#e8eef2"/><rect x="2" y="-9" width="2" height="4" fill="#d9413a"/></g>`],

'Waitomo Glowworm Caves': [['#0a1626', '#12293f'], `
  <path d="M0,0 H200 V24 Q180,36 160,22 Q140,40 120,24 Q100,34 80,20 Q60,38 40,22 Q20,34 0,24 Z" fill="#060d17"/>
  <g fill="#060d17">${repeat(10, i => `<path d="M${10+i*20},${24 + (i%3)*3} l4,${10 + (i%4)*4} l4,-${10 + (i%4)*4} Z"/>`)}</g>
  ${repeat(46, i => glow((rnd(i, 1)*196+2).toFixed(1), (30 + rnd(i, 2)*64).toFixed(1), .9 + rnd(i, 3)*.9, rnd(i, 4) > .6 ? (6 + rnd(i, 5)*14).toFixed(0) : 0))}
  <rect y="116" width="200" height="44" fill="#071320"/>
  <g opacity=".45">${repeat(16, i => `<circle cx="${(rnd(i, 1)*196+2).toFixed(1)}" cy="${(124 + rnd(i, 6)*30).toFixed(1)}" r="1" fill="#7ff6e0"/>`)}</g>
  <path d="M60,128 H140 L132,136 H68 Z" fill="#1d2f42"/>
  <g fill="#1d2f42">${repeat(5, i => `<circle cx="${78+i*11}" cy="122" r="3.4"/><rect x="${75+i*11}" y="122" width="6" height="7"/>`)}</g>`],
};
