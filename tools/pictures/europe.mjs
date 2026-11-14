import {cloud, sun, arches, repeat, star} from './common.mjs';
export default {
'Eiffel Tower': [['#bfe0f4', '#e8f4fb'], `
  ${cloud(38, 34)}${cloud(160, 46, .8)}
  <path d="M0,136 Q50,130 100,134 T200,132 V160 H0 Z" fill="#8cc068"/>
  <g fill="#7a5a3c">
    <path d="M56,140 L77,103 L123,103 L144,140 L127,140 Q100,110 73,140 Z"/>
    <rect x="70" y="98" width="60" height="7" rx="1.5"/>
    <path d="M79,98 L121,98 L112,68 L88,68 Z"/>
    <rect x="84" y="64" width="32" height="6" rx="1.5"/>
    <path d="M89,64 L111,64 L102.5,20 L97.5,20 Z"/>
    <rect x="96" y="13" width="8" height="8" rx="1.5"/>
    <rect x="99.2" y="4" width="1.6" height="10"/>
  </g>
  <g stroke="#a98058" stroke-width="1" opacity=".9" fill="none">
    <path d="M83,96 L117,70 M117,96 L83,70 M92,62 L106,30 M108,62 L94,30 M63,136 L80,106 M137,136 L120,106"/>
  </g>`],

'Colosseum': [['#a9d4f0', '#e6f3fb'], `
  ${cloud(160, 30, .9)}
  <rect y="124" width="200" height="36" fill="#d8c49c"/>
  <path d="M120,62 L176,70 V126 H120 Z" fill="#b8925f"/>
  ${arches(124, 4, 13, 8, 76, 92, '#7f6040')}${arches(124, 4, 13, 8, 100, 118, '#7f6040')}
  <defs><clipPath id="wall"><path d="M24,126 V60 Q70,51 118,54 L122,54 L126,66 L136,68 L140,82 L178,86 V126 Z"/></clipPath></defs>
  <path d="M24,126 V60 Q70,51 118,54 L122,54 L126,66 L136,68 L140,82 L178,86 V126 Z" fill="#dcb987"/>
  <g clip-path="url(#wall)">
    ${arches(29, 12, 13, 8, 102, 122, '#9c7a50')}${arches(29, 12, 13, 8, 82, 97, '#9c7a50')}${arches(29, 12, 13, 8, 64, 78, '#9c7a50')}
    <g fill="#ecd4ad"><rect x="20" y="98" width="170" height="3"/><rect x="20" y="79" width="170" height="2.5"/><rect x="20" y="61" width="170" height="2"/></g>
  </g>`],

'Big Ben': [['#b9cfe0', '#e8eff5'], `
  ${cloud(40, 30, .8)}
  <rect y="128" width="200" height="32" fill="#6e93a8"/>
  <path d="M0,128 H200" stroke="#8fb0c2" stroke-width="2"/>
  <g fill="#c9a465">
    <rect x="0" y="100" width="84" height="28"/><rect x="116" y="100" width="84" height="28"/>
    ${repeat(7, i => `<path d="M${4+i*12},100 l2,-8 l2,8 Z"/>`)}${repeat(7, i => `<path d="M${122+i*12},100 l2,-8 l2,8 Z"/>`)}
  </g>
  <g fill="#8f7346">${repeat(7, i => `<rect x="${5+i*11}" y="106" width="4" height="8" rx="2"/><rect x="${5+i*11}" y="117" width="4" height="7"/>`)}${repeat(7, i => `<rect x="${121+i*11}" y="106" width="4" height="8" rx="2"/><rect x="${121+i*11}" y="117" width="4" height="7"/>`)}</g>
  <rect x="88" y="62" width="24" height="68" fill="#d4b06a"/>
  <g stroke="#b08d4e" stroke-width="1"><path d="M94,64 V128 M100,64 V128 M106,64 V128"/></g>
  <rect x="84" y="38" width="32" height="26" fill="#d9b874"/>
  <circle cx="100" cy="51" r="10.5" fill="#fffaf0" stroke="#b08d4e" stroke-width="1.5"/>
  <path d="M100,51 V44 M100,51 L105,53" stroke="#3b3b3b" stroke-width="1.4" stroke-linecap="round"/>
  <rect x="88" y="28" width="24" height="10" fill="#c9a465"/>
  <g fill="#8f7346">${repeat(4, i => `<rect x="${90.5+i*5.5}" y="30" width="3" height="7" rx="1.5"/>`)}</g>
  <path d="M86,29 L100,4 L114,29 Z" fill="#4b5a66"/>
  <g fill="#4b5a66"><path d="M84,38 l2,-9 l2,9 Z M112,38 l2,-9 l2,9 Z"/></g>
  <rect x="99.3" y="1" width="1.4" height="5" fill="#4b5a66"/>`],

'Leaning Tower of Pisa': [['#a9d4f0', '#e8f4fb'], `
  ${cloud(40, 34)}${cloud(165, 52, .7)}
  <path d="M0,130 Q100,124 200,130 V160 H0 Z" fill="#86bb62"/>
  <g transform="rotate(6 100 132)">
    <rect x="80" y="112" width="40" height="20" fill="#f4efe4" stroke="#d3c8b2"/>
    ${arches(83, 5, 7, 5, 116, 130, '#d8ccb4')}
    ${repeat(6, i => `<rect x="82" y="${100-i*12}" width="36" height="12" fill="#f4efe4" stroke="#d3c8b2"/>
      <rect x="82" y="${100-i*12}" width="36" height="2" fill="#e2d8c4"/>
      ${arches(84, 6, 5.6, 3.6, 103-i*12, 111-i*12, '#d8ccb4')}`)}
    <rect x="86" y="30" width="28" height="10" fill="#f4efe4" stroke="#d3c8b2"/>
    ${arches(88.5, 4, 6.3, 4, 32, 39, '#d8ccb4')}
    <rect x="108" y="30" width="10" height="102" fill="#000" opacity=".06"/>
    <rect x="80" y="28" width="40" height="3" fill="#e2d8c4"/>
  </g>`],

'Acropolis': [['#8ec7ec', '#e3f2fb'], `
  ${sun(162, 30, 11)}
  <path d="M0,160 V118 Q20,104 40,100 L160,98 Q182,104 200,116 V160 Z" fill="#b8946a"/>
  <path d="M0,160 V130 Q30,118 60,124 Q100,112 140,122 Q170,116 200,128 V160 Z" fill="#9c7b55"/>
  <g fill="#6f8f4a"><circle cx="24" cy="132" r="7"/><circle cx="34" cy="136" r="6"/><circle cx="176" cy="136" r="7"/><circle cx="166" cy="140" r="5"/></g>
  <rect x="46" y="92" width="108" height="5" fill="#e3d6bd"/><rect x="42" y="96" width="116" height="4" fill="#d8c9ad"/>
  <g fill="#f3ebdc">${repeat(8, i => `<rect x="${52+i*13}" y="66" width="7" height="26"/>`)}</g>
  <g fill="#e1d4bc">${repeat(8, i => `<rect x="${57+i*13}" y="66" width="2" height="26"/>`)}</g>
  <rect x="46" y="58" width="108" height="8" fill="#efe5d2"/>
  <path d="M44,58 L100,42 L156,58 Z" fill="#f3ebdc"/>
  <path d="M54,56 L100,46 L146,56 Z" fill="#e6dac4"/>`],

'Sagrada Família': [['#9fd0ee', '#f0e6d6'], `
  ${cloud(32, 30, .8)}
  <rect y="130" width="200" height="30" fill="#c9b796"/>
  ${[[100, 6, 7, '#dcc49e'], [80, 22, 6, '#d6bb92'], [120, 22, 6, '#d6bb92']].map(([x, t, w, c]) =>
    `<path d="M${x-w},110 L${x-w+1},${t+40} Q${x-w+2},${t+12} ${x},${t} Q${x+w-2},${t+12} ${x+w-1},${t+40} L${x+w},110 Z" fill="${c}"/>`).join('')}
  ${[[52, 28], [68, 20], [132, 20], [148, 28]].map(([x, t]) =>
    `<path d="M${x-7},130 L${x-6},${t+40} Q${x-5},${t+12} ${x},${t} Q${x+5},${t+12} ${x+6},${t+40} L${x+7},130 Z" fill="#cfae80"/>
     <g fill="#8a6c45">${repeat(5, i => `<ellipse cx="${x}" cy="${t+44+i*12}" rx="1.6" ry="3"/>`)}</g>
     <circle cx="${x}" cy="${t-2}" r="2.6" fill="${x < 100 ? '#e0564a' : '#f2c14e'}"/>`).join('')}
  <circle cx="100" cy="4" r="3" fill="#f2c14e"/><circle cx="80" cy="20" r="2.4" fill="#5aa469"/><circle cx="120" cy="20" r="2.4" fill="#5aa469"/>
  <path d="M30,130 V108 L100,96 L170,108 V130 Z" fill="#c8a674"/>
  ${arches(82, 3, 13, 9, 108, 130, '#7d6243')}
  <g fill="#7d6243"><path d="M40,130 V116 Q45,110 50,116 V130 Z M150,130 V116 Q155,110 160,116 V130 Z"/></g>`],

'Stonehenge': [['#9ec3e0', '#f6dcb0'], `
  ${sun(100, 98, 16, '#f9d27a')}
  <path d="M0,104 Q100,96 200,104 V160 H0 Z" fill="#8cbf68"/>
  <path d="M0,130 Q100,122 200,132 V160 H0 Z" fill="#7cb15a"/>
  <g fill="#8e9196">
    ${[[30, 86, 7, 18], [42, 86, 7, 18], [68, 84, 7, 20], [80, 84, 7, 20], [118, 84, 7, 20], [130, 84, 7, 20], [156, 86, 7, 18], [168, 86, 7, 18]].map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1"/>`).join('')}
    <rect x="28" y="81" width="23" height="6" rx="1"/><rect x="66" y="79" width="23" height="6" rx="1"/><rect x="116" y="79" width="23" height="6" rx="1"/><rect x="154" y="81" width="23" height="6" rx="1"/>
  </g>
  <g fill="#7b7e83">
    ${[[14, 96, 13, 32], [32, 96, 13, 32], [74, 92, 14, 36], [94, 92, 14, 36], [140, 96, 13, 32], [158, 96, 13, 32]].map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5"/>`).join('')}
    <rect x="12" y="88" width="35" height="9" rx="1.5"/><rect x="72" y="84" width="38" height="9" rx="1.5"/><rect x="138" y="88" width="35" height="9" rx="1.5"/>
    <rect x="178" y="122" width="22" height="9" rx="2" transform="rotate(-8 189 126)"/>
  </g>
  <g fill="#a3a6ab"><rect x="12" y="88" width="35" height="3" rx="1.5"/><rect x="72" y="84" width="38" height="3" rx="1.5"/><rect x="138" y="88" width="35" height="3" rx="1.5"/></g>`],

'Neuschwanstein Castle': [['#a8d3ef', '#e8f4fb'], `
  <path d="M0,96 L40,50 L70,80 L110,36 L150,76 L178,52 L200,70 V160 H0 Z" fill="#8aa0b8"/>
  <path d="M30,62 L40,50 L50,60 Z M100,46 L110,36 L120,46 Z M170,59 L178,52 L186,60 Z" fill="#fff"/>
  <path d="M0,120 Q40,100 70,110 L100,104 Q140,98 200,112 V160 H0 Z" fill="#3f7a4c"/>
  <path d="M60,160 L72,118 L130,116 L144,160 Z" fill="#8c8c84"/>
  <path d="M0,140 Q50,128 100,140 T200,136 V160 H0 Z" fill="#2f6a3f"/>
  <g fill="#f3f1ec" stroke="#d6d2c8" stroke-width=".8">
    <rect x="82" y="66" width="44" height="52"/>
    <rect x="62" y="50" width="13" height="68"/><rect x="126" y="60" width="12" height="58"/>
    <rect x="102" y="40" width="10" height="28"/>
    <rect x="72" y="86" width="12" height="32"/>
  </g>
  <g fill="#4d6a8e">
    <path d="M80,67 L104,50 L128,67 Z"/>
    <path d="M60,51 L68.5,22 L77,51 Z"/><path d="M124,61 L132,36 L140,61 Z"/><path d="M100,41 L107,24 L114,41 Z"/><path d="M71,87 L78,74 L85,87 Z"/>
  </g>
  <g fill="#6d7f93">${repeat(4, i => `<rect x="${87+i*10}" y="76" width="4" height="7" rx="2"/><rect x="${87+i*10}" y="92" width="4" height="7" rx="2"/>`)}<rect x="66" y="62" width="4" height="7" rx="2"/><rect x="66" y="80" width="4" height="7" rx="2"/><rect x="130" y="72" width="4" height="7" rx="2"/></g>`],

'Kremlin': [['#9fcbea', '#e5f1fa'], `
  ${cloud(160, 26, .8)}
  ${[[34, 76, 8, 30], [55, 72, 10, 34], [150, 74, 8, 32]].map(([x, y, w, h]) => `<rect x="${x-w/2}" y="${y}" width="${w}" height="${h}" fill="#f1ece2"/>
    <path d="M${x-w/2-1},${y} Q${x-w/2-4},${y-8} ${x},${y-16} Q${x+w/2+4},${y-8} ${x+w/2+1},${y} Z" fill="#e2b34a"/><rect x="${x-.6}" y="${y-22}" width="1.2" height="7" fill="#e2b34a"/>`).join('')}
  <rect y="128" width="200" height="32" fill="#eef1f4"/>
  <rect y="100" width="200" height="30" fill="#b23a2e"/>
  <g fill="#b23a2e">${repeat(17, i => `<path d="M${i*12},101 V93 L${i*12+3},96 L${i*12+6},93 V101 Z"/>`)}</g>
  <rect x="84" y="62" width="32" height="68" fill="#bf4436"/>
  <rect x="84" y="62" width="32" height="4" fill="#d6d0c4"/>
  <circle cx="100" cy="76" r="7" fill="#fbf6ea" stroke="#d4a93f" stroke-width="1.6"/>
  <path d="M100,76 V71.5 M100,76 L103,77.5" stroke="#333" stroke-width="1.1" stroke-linecap="round"/>
  <path d="M94,130 V112 Q100,104 106,112 V130 Z" fill="#7a2a22"/>
  <rect x="89" y="44" width="22" height="18" fill="#bf4436"/>
  <g fill="#7a2a22">${repeat(3, i => `<rect x="${92+i*6}" y="48" width="3" height="9" rx="1.5"/>`)}</g>
  <path d="M88,45 L100,14 L112,45 Z" fill="#3f6b55"/>
  ${star(100, 10, 6, '#d6283a')}`],

'Brandenburg Gate': [['#9fcbea', '#e5f1fa'], `
  ${cloud(36, 30, .9)}
  <rect y="128" width="200" height="32" fill="#c9c2b4"/>
  <g fill="#d1bb90"><rect x="0" y="92" width="30" height="36"/><rect x="170" y="92" width="30" height="36"/></g>
  <g fill="#b9a275"><rect x="6" y="98" width="4" height="30"/><rect x="18" y="98" width="4" height="30"/><rect x="178" y="98" width="4" height="30"/><rect x="190" y="98" width="4" height="30"/></g>
  <rect x="28" y="120" width="144" height="8" fill="#cdb78c"/>
  <g fill="#e2cfa6">${repeat(6, i => `<rect x="${36+i*24}" y="76" width="9" height="44"/>`)}</g>
  <g fill="#c8b184">${repeat(6, i => `<rect x="${42+i*24}" y="76" width="3" height="44"/>`)}</g>
  <rect x="30" y="64" width="140" height="12" fill="#dcc79c"/>
  <g fill="#c2aa7c">${repeat(14, i => `<rect x="${34+i*10}" y="67" width="3" height="6"/>`)}</g>
  <path d="M58,64 V52 H142 V64 Z" fill="#d8c296"/>
  <g fill="#4e6b5a">
    <path d="M78,52 V44 Q80,38 84,40 L86,36 L88,42 L92,38 L94,44 Q98,38 102,40 L104,36 L106,42 L110,38 L112,44 Q116,38 120,40 L122,46 V52 Z"/>
    <rect x="99" y="22" width="2" height="22"/><circle cx="100" cy="21" r="4" fill="none" stroke="#4e6b5a" stroke-width="1.6"/>
    <path d="M96,44 Q100,28 104,44 Z"/>
  </g>`],
};
