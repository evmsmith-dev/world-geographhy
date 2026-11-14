import {cloud, sun, repeat, star} from './common.mjs';
const tree = (x, y, s, c = '#2f5d3a') => `<path d="M${x},${y-24*s} L${x+8*s},${y-6*s} H${x-8*s} Z M${x},${y-16*s} L${x+10*s},${y} H${x-10*s} Z" fill="${c}"/>`;
// a stepped pyramid: tiers from width w0 at the bottom (y0) to w1 at the top (y1)
const steps = (n, w0, w1, y0, y1, c1, c2, cx = 100) => repeat(n, i => { const h = (y0-y1)/n, w = w0 - (w0-w1)*i/(n-1), y = y0 - h*(i+1);
  return `<path d="M${cx-w/2},${y+h} L${cx-w/2+h*.35},${y} H${cx+w/2-h*.35} L${cx+w/2},${y+h} Z" fill="${i%2 ? c1 : c2}"/>`; });
export default {
'Statue of Liberty': [['#9fd0ee', '#e8f4fb'], `
  ${cloud(160, 30, .9)}
  <rect y="124" width="200" height="36" fill="#3f8fc0"/>
  <path d="M56,132 L64,122 H136 L144,132 Z" fill="#b9a67f"/>
  <path d="M82,124 L84,98 H116 L118,124 Z" fill="#cdb98f"/>
  <rect x="80" y="96" width="40" height="5" fill="#bfa97c"/>
  ${repeat(3, i => `<rect x="${89+i*8.5}" y="106" width="4" height="10" rx="2" fill="#a8935f"/>`)}
  <path d="M88,96 L90,64 Q91,56 96,55 H104 Q109,56 110,64 L113,96 Z" fill="#6fb39a"/>
  <path d="M102,58 L106,58 L110,64 L112,96 H102 Z" fill="#5a9f87"/>
  <path d="M92,60 L86,26 L91,25 L97,58 Z" fill="#6fb39a"/>
  <path d="M84,26 H94 L92,21 H86 Z" fill="#5a9f87"/>
  <path d="M89,21 Q84,14 89,8 Q90,14 93,12 Q95,17 89,21 Z" fill="#f2c14e"/>
  <path d="M106,66 L116,62 L120,80 L110,84 Z" fill="#5a9f87"/>
  <circle cx="100" cy="47" r="6" fill="#6fb39a"/>
  <g stroke="#6fb39a" stroke-width="2" stroke-linecap="round">${repeat(7, i => { const a = Math.PI*(1.05 + i*.15); return `<path d="M${(100+6*Math.cos(a)).toFixed(1)},${(45+6*Math.sin(a)).toFixed(1)} L${(100+12*Math.cos(a)).toFixed(1)},${(45+12*Math.sin(a)).toFixed(1)}"/>`; })}</g>
  <path d="M20,140 H50 M150,146 H185" stroke="#9ccbe6" stroke-width="2" stroke-linecap="round"/>`],

'White House': [['#9fd0ee', '#e8f4fb'], `
  ${cloud(36, 28, .8)}
  <g fill="#4f8a4a"><circle cx="14" cy="96" r="16"/><circle cx="186" cy="96" r="16"/></g>
  <rect y="114" width="200" height="46" fill="#7cb85e"/>
  <rect x="26" y="74" width="148" height="44" fill="#fbfaf6"/>
  <rect x="24" y="70" width="152" height="5" fill="#e9e6de"/>
  <g fill="#e9e6de">${repeat(19, i => `<rect x="${26+i*8}" y="66" width="3" height="4"/>`)}</g>
  <g fill="#9fb3c4">${repeat(5, i => `<rect x="${32+i*9}" y="80" width="5" height="9"/><rect x="${32+i*9}" y="98" width="5" height="11"/>`)}${repeat(5, i => `<rect x="${127+i*9}" y="80" width="5" height="9"/><rect x="${127+i*9}" y="98" width="5" height="11"/>`)}</g>
  <path d="M78,62 L100,48 L122,62 Z" fill="#fbfaf6"/><rect x="76" y="62" width="48" height="6" fill="#efede6"/>
  <g fill="#fbfaf6" stroke="#dcd8ce" stroke-width=".7">${repeat(6, i => `<rect x="${80+i*7.6}" y="68" width="4" height="50"/>`)}</g>
  <path d="M95,118 V104 Q100,98 105,104 V118 Z" fill="#9fb3c4"/>
  <rect x="99.4" y="30" width="1.2" height="20" fill="#888"/>
  <g transform="translate(100.6 30)"><rect width="14" height="9" fill="#fff"/>${repeat(4, i => `<rect y="${i*2.4}" width="14" height="1.2" fill="#c8352e"/>`)}<rect width="6" height="5" fill="#2c4a8a"/></g>
  <ellipse cx="100" cy="138" rx="22" ry="5" fill="#bfe0f0"/><path d="M100,136 V122 M96,136 Q98,126 100,122 Q102,126 104,136" stroke="#e8f6fc" stroke-width="2" fill="none"/>`],

'Mount Rushmore': [['#9fd0ee', '#e8f4fb'], `
  <path d="M0,160 V60 Q30,30 70,26 Q120,20 160,30 Q190,40 200,60 V160 Z" fill="#a7a29a"/>
  <path d="M0,160 V96 Q40,90 60,110 Q100,100 140,112 Q170,100 200,104 V160 Z" fill="#b8b3aa"/>
  ${[[46, 62, 13, 18], [80, 58, 13, 19], [110, 68, 11, 16], [146, 62, 13, 19]].map(([x, y, rx, ry]) => `
    <ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#c4bfb6"/>
    <path d="M${x-rx*.7},${y-ry*.25} Q${x},${y-ry*.45} ${x+rx*.7},${y-ry*.25}" stroke="#8f8a82" stroke-width="2" fill="none"/>
    <ellipse cx="${x-rx*.38}" cy="${y-ry*.08}" rx="${rx*.2}" ry="${ry*.07}" fill="#9a958c"/><ellipse cx="${x+rx*.38}" cy="${y-ry*.08}" rx="${rx*.2}" ry="${ry*.07}" fill="#9a958c"/>
    <path d="M${x+rx*.05},${y-ry*.05} L${x+rx*.18},${y+ry*.3} H${x-rx*.05}" fill="#a8a39a"/>
    <path d="M${x+rx*.55},${y-ry*.6} Q${x+rx*1.05},${y} ${x+rx*.5},${y+ry*.85}" stroke="#a39e95" stroke-width="3" fill="none"/>`).join('')}
  <path d="M0,160 V128 Q50,118 100,126 T200,124 V160 Z" fill="#8f8a82"/>
  ${repeat(11, i => tree(8+i*19, 160 - (i%2)*6, .9 + (i%3)*.15))}`],

'Golden Gate Bridge': [['#a9d4f0', '#eef7fb'], `
  <path d="M120,102 Q150,60 200,64 V102 Z" fill="#8a9a6a"/>
  <g fill="#fff" opacity=".85"><ellipse cx="170" cy="70" rx="40" ry="8"/><ellipse cx="190" cy="62" rx="22" ry="7"/></g>
  <rect y="100" width="200" height="60" fill="#3f8fc0"/>
  <g fill="none" stroke="#c0362c" stroke-width="2"><path d="M-6,88 Q24,72 50,30 Q100,104 150,30 Q176,72 206,88"/></g>
  <g stroke="#c0362c" stroke-width=".8">${repeat(19, i => { const x = 56+i*4.9, t = (x-50)/100, y = 30 + 4*(t*(1-t))*62; return `<path d="M${x.toFixed(1)},${y.toFixed(1)} V94"/>`; })}${repeat(7, i => { const t = (i+1)/8, x = (1-t)*(1-t)*-6 + 2*(1-t)*t*24 + t*t*50, y = (1-t)*(1-t)*88 + 2*(1-t)*t*72 + t*t*30; return `<path d="M${x.toFixed(1)},${y.toFixed(1)} V94"/><path d="M${(200-x).toFixed(1)},${y.toFixed(1)} V94"/>`; })}</g>
  <rect x="-4" y="92" width="208" height="5" fill="#b0302a"/>
  ${[50, 150].map(x => `<rect x="${x-6}" y="26" width="3.5" height="90" fill="#c0362c"/><rect x="${x+2.5}" y="26" width="3.5" height="90" fill="#c0362c"/>
    ${repeat(4, i => `<rect x="${x-6}" y="${30+i*16}" width="12" height="3" fill="#c0362c"/>`)}<rect x="${x-8}" y="114" width="16" height="6" fill="#9a8f80"/>`).join('')}
  <path d="M30,132 H70 M120,142 H170" stroke="#9ccbe6" stroke-width="2" stroke-linecap="round"/>`],

'Hollywood Sign': [['#8fc6ee', '#f3e6cf'], `
  ${sun(170, 26, 11)}
  <path d="M0,112 Q40,46 100,40 Q150,40 200,84 V160 H0 Z" fill="#8f915c"/>
  <path d="M0,124 Q60,90 120,100 Q170,104 200,96 V160 H0 Z" fill="#7a7c4a"/>
  <g fill="#fbfbf8">${repeat(9, i => { const x = 40+i*13, y = 70 - Math.sin((i+1)/10*Math.PI)*10 + i*1.4; return `<rect x="${x}" y="${y.toFixed(1)}" width="11" height="15"/>`; })}</g>
  <g stroke="#6b6650" stroke-width=".6">${repeat(9, i => { const x = 40+i*13, y = 70 - Math.sin((i+1)/10*Math.PI)*10 + i*1.4; return `<path d="M${x+3},${(y+15).toFixed(1)} v4 M${x+8},${(y+15).toFixed(1)} v4"/>`; })}</g>
  <g fill="#5d5f36"><circle cx="20" cy="120" r="7"/><circle cx="60" cy="112" r="6"/><circle cx="150" cy="108" r="6"/><circle cx="180" cy="114" r="8"/></g>
  ${[[22, 160, 70], [178, 160, 62]].map(([x, b, t]) => `<path d="M${x-1.5},${b} Q${x-3},${(b+t)/2} ${x},${t} L${x+2},${t} Q${x},${(b+t)/2} ${x+1.5},${b} Z" fill="#6b4f36"/>
    <g fill="#3f6b3a">${repeat(6, i => { const a = Math.PI*(1.0 + i*.2); return `<path d="M${x+1},${t} Q${(x+1+11*Math.cos(a)).toFixed(1)},${(t-6+11*Math.sin(a)).toFixed(1)} ${(x+1+18*Math.cos(a)).toFixed(1)},${(t+4+16*Math.sin(a)*.5).toFixed(1)} Q${(x+1+9*Math.cos(a)).toFixed(1)},${(t-1+8*Math.sin(a)).toFixed(1)} ${x+1},${t+1} Z"/>`; })}</g>`).join('')}`],

'Grand Canyon': [['#8fc6ee', '#f5e3c8'], `
  <path d="M0,54 H60 L64,50 H130 L134,54 H200 V160 H0 Z" fill="#c98b5a"/>
  <path d="M0,54 H200 V58 H0 Z" fill="#d9a06a"/>
  <path d="M0,70 L30,64 L60,74 L90,62 L120,72 L160,64 L200,72 V160 H0 Z" fill="#b8693e"/>
  <path d="M0,70 L30,64 L60,74 L90,62 L120,72 L160,64 L200,72 V76 L160,68 L120,76 L90,66 L60,78 L30,68 L0,74 Z" fill="#e0a774"/>
  <path d="M0,92 L22,84 L40,96 L70,86 L84,100 L110,88 L140,98 L170,86 L200,96 V160 H0 Z" fill="#a85a34"/>
  <path d="M60,112 L74,86 H92 L100,112 Z" fill="#b8693e"/><path d="M74,86 H92 V90 H73 Z" fill="#e0a774"/>
  <path d="M0,104 Q30,116 50,110 L80,122 L120,112 L150,124 L200,110 V160 H0 Z" fill="#8f4a2e"/>
  <path d="M60,132 Q90,122 110,130 T160,128 L170,134 Q140,138 110,134 T64,138 Z" fill="#4f9a9a"/>
  <path d="M0,124 Q30,140 60,136 L50,160 H0 Z M200,120 Q170,140 160,150 L170,160 H200 Z" fill="#7a3e26"/>
  <g stroke="#cf8d5c" stroke-width=".8" opacity=".7"><path d="M0,82 L30,78 L60,86 L90,76 L120,84 L160,78 L200,84 M0,100 L40,104 L84,108 L140,106 L200,102"/></g>`],

'Niagara Falls': [['#a9d4f0', '#eef7fb'], `
  <path d="M0,30 H200 V48 H0 Z" fill="#5f9a52"/>
  <path d="M0,44 Q100,38 200,44 V64 Q100,86 0,64 Z" fill="#5aa3c0"/>
  <path d="M0,64 Q100,86 200,64 V108 Q100,128 0,108 Z" fill="#eaf6fb"/>
  <g stroke="#bfe1ef" stroke-width="2.2">${repeat(24, i => { const x = 4+i*8.2, t = x/200, top = 64 + 4*t*(1-t)*22, bot = 108 + 4*t*(1-t)*20 - (i%3)*6; return `<path d="M${x.toFixed(1)},${(top+2).toFixed(1)} V${bot.toFixed(1)}"/>`; })}</g>
  <rect y="110" width="200" height="50" fill="#3f8fa8"/>
  <g fill="#fff" opacity=".9"><ellipse cx="40" cy="110" rx="40" ry="10"/><ellipse cx="100" cy="116" rx="46" ry="12"/><ellipse cx="166" cy="110" rx="42" ry="10"/></g>
  <g transform="translate(70 140)"><path d="M-16,0 H18 L13,7 H-12 Z" fill="#2c5aa0"/><rect x="-10" y="-7" width="20" height="7" fill="#3a6cc0"/><rect x="-6" y="-11" width="12" height="4" fill="#3a6cc0"/></g>
  <path d="M120,138 H160 M20,150 H50" stroke="#8fc7d8" stroke-width="2" stroke-linecap="round"/>`],

'Chichén Itzá': [['#9fd0ee', '#eaf5fb'], `
  ${cloud(160, 28, .8)}
  <g fill="#4f8a4a">${repeat(9, i => `<circle cx="${i*25}" cy="${112 - (i%2)*4}" r="${14 + (i%3)*2}"/>`)}</g>
  <rect y="122" width="200" height="38" fill="#86bb62"/>
  ${steps(9, 150, 74, 128, 64, '#d5c39a', '#c8b58a')}
  <path d="M88,128 L94,64 H106 L112,128 Z" fill="#b8a478"/>
  <g stroke="#9a875e" stroke-width=".8">${repeat(16, i => { const y = 126 - i*4, w = 12 - i*.38; return `<path d="M${(100-w).toFixed(1)},${y} H${(100+w).toFixed(1)}"/>`; })}</g>
  <rect x="82" y="46" width="36" height="18" fill="#d5c39a"/><rect x="80" y="44" width="40" height="4" fill="#c2af84"/>
  <g fill="#5f4f36"><rect x="88" y="52" width="6" height="12"/><rect x="97" y="52" width="6" height="12"/><rect x="106" y="52" width="6" height="12"/></g>`],

'Teotihuacan': [['#a9d4f0', '#f1ebdd'], `
  <path d="M0,86 Q40,50 80,62 Q110,46 150,58 Q180,62 200,78 V110 H0 Z" fill="#8fa093"/>
  <path d="M0,100 Q100,92 200,100 V160 H0 Z" fill="#c9b994"/>
  <path d="M100,160 L116,106 H128 L160,160 Z" fill="#b7a47e"/>
  ${steps(5, 124, 50, 116, 60, '#9b8a72', '#8c7c65', 72)}
  <path d="M66,116 L69,60 H75 L78,116 Z" fill="#7a6b56"/>
  <g stroke="#6a5c48" stroke-width=".7">${repeat(13, i => `<path d="M${66.5+i*.23},${112-i*4} H${77.5-i*.23}"/>`)}</g>
  ${steps(4, 56, 24, 106, 78, '#a3927a', '#968670', 154)}
  <g fill="#a8977c">${repeat(4, i => `<rect x="${104 - i*5}" y="${120+i*10}" width="9" height="5"/><rect x="${134 + i*7}" y="${120+i*10}" width="9" height="5"/>`)}</g>
  <g fill="#6f8f4a"><circle cx="12" cy="122" r="6"/><circle cx="188" cy="124" r="6"/></g>`],

'Panama Canal': [['#a9d4f0', '#eef7fb'], `
  <path d="M0,84 Q40,58 80,70 Q130,50 200,72 V104 H0 Z" fill="#3f7a44"/>
  <path d="M0,96 Q60,82 120,92 Q160,86 200,94 V108 H0 Z" fill="#2f6a3f"/>
  <rect y="104" width="200" height="56" fill="#9aa0a6"/>
  <rect x="0" y="100" width="128" height="34" fill="#4f8fb0"/>
  <rect x="134" y="116" width="66" height="18" fill="#4f8fb0"/>
  <rect x="128" y="96" width="6" height="40" fill="#5a5f66"/>
  <rect y="134" width="200" height="26" fill="#b4b9be"/>
  <path d="M10,104 H120 L112,124 H18 Z" fill="#2e3a4a"/><rect x="10" y="104" width="110" height="4" fill="#c0362c"/>
  ${repeat(8, i => `<rect x="${24+i*10}" y="${92}" width="9" height="12" fill="${['#d9413a', '#3a7bd5', '#f2c230', '#3fa45b'][i%4]}"/><rect x="${24+i*10}" y="${81}" width="9" height="11" fill="${['#3fa45b', '#f2c230', '#d9413a', '#3a7bd5'][i%4]}"/>`)}
  <rect x="104" y="80" width="12" height="24" fill="#f4f4f4"/><rect x="106" y="83" width="8" height="3" fill="#7aa7c7"/>
  <g transform="translate(160 104)"><rect x="-10" y="-8" width="20" height="8" fill="#e0e4e8"/><circle cx="-6" cy="0" r="2" fill="#333"/><circle cx="6" cy="0" r="2" fill="#333"/></g>`],
};
