// World Geography Quiz: offline support.
// Serves the saved copy right away, then refreshes it from the website in the background.
// Only touches caches that start with "wgq-", so other apps on the same site are left alone.
// On GitHub, publishing renames the cache for each version (wgq-<time of the change>, see .github/workflows/tests.yml),
// so every update arrives as one complete set of files and devices drop the old ones. 'wgq-v8' is only for testing here.
const CACHE = 'wgq-v8';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'src/app.css',
  'src/01-helpers.js', 'src/02-topics.js', 'src/03-storage.js', 'src/04-screens.js', 'src/05-sound.js', 'src/06-players.js', 'src/07-home.js', 'src/08-map.js', 'src/09-game.js', 'src/10-find-it.js', 'src/11-easy-answers.js', 'src/12-flashcards.js', 'src/13-scores.js', 'src/14-explore.js', 'src/15-daily.js', 'src/16-world-tour.js', 'src/17-games.js', 'src/18-passport.js', 'src/19-settings.js', 'src/20-start.js',
  'data/facts.json', 'data/flags.json', 'data/usflags.json', 'data/thumbs.json',
  'data/maps/us.json', 'data/maps/world.json', 'data/maps/europe.json', 'data/maps/africa.json', 'data/maps/asia.json',
  'data/maps/oceania.json', 'data/maps/namerica.json', 'data/maps/samerica.json',
  'data/maps/europe-geo.json', 'data/maps/africa-geo.json', 'data/maps/asia-geo.json',
  'data/maps/oceania-geo.json', 'data/maps/namerica-geo.json', 'data/maps/samerica-geo.json', 'data/maps/usparks.json', 'data/maps/usregions.json', 'data/maps/uscities.json', 'data/maps/us-geo.json',
  'data/maps/europe-landmarks.json', 'data/maps/africa-landmarks.json', 'data/maps/asia-landmarks.json', 'data/maps/oceania-landmarks.json', 'data/maps/namerica-landmarks.json', 'data/maps/samerica-landmarks.json', 'data/maps/us-landmarks.json',
  'assets/icons/icon.svg', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/icons/icon-maskable-512.png',
  'assets/icons/apple-touch-icon.png', 'assets/icons/favicon-32.png',
  'assets/landmarks/abu-simbel.svg', 'assets/landmarks/acropolis.svg', 'assets/landmarks/angel-falls.svg', 'assets/landmarks/angkor-wat.svg',
  'assets/landmarks/big-ben.svg', 'assets/landmarks/borobudur.svg', 'assets/landmarks/brandenburg-gate.svg', 'assets/landmarks/burj-khalifa.svg',
  'assets/landmarks/chichen-itza.svg', 'assets/landmarks/christ-the-redeemer.svg', 'assets/landmarks/colosseum.svg',
  'assets/landmarks/eiffel-tower.svg', 'assets/landmarks/golden-gate-bridge.svg', 'assets/landmarks/grand-canyon.svg',
  'assets/landmarks/great-barrier-reef.svg', 'assets/landmarks/great-mosque-of-djenne.svg', 'assets/landmarks/great-wall-of-china.svg',
  'assets/landmarks/great-zimbabwe.svg', 'assets/landmarks/hollywood-sign.svg', 'assets/landmarks/iguazu-falls.svg', 'assets/landmarks/kremlin.svg',
  'assets/landmarks/leaning-tower-of-pisa.svg', 'assets/landmarks/machu-picchu.svg', 'assets/landmarks/milford-sound.svg',
  'assets/landmarks/mitad-del-mundo.svg', 'assets/landmarks/mount-everest.svg', 'assets/landmarks/mount-fuji.svg',
  'assets/landmarks/mount-kilimanjaro.svg', 'assets/landmarks/mount-rushmore.svg', 'assets/landmarks/nazca-lines.svg',
  'assets/landmarks/neuschwanstein-castle.svg', 'assets/landmarks/niagara-falls.svg', 'assets/landmarks/panama-canal.svg',
  'assets/landmarks/perito-moreno-glacier.svg', 'assets/landmarks/petra.svg', 'assets/landmarks/petronas-towers.svg',
  'assets/landmarks/pyramids-of-giza.svg', 'assets/landmarks/rock-churches-of-lalibela.svg', 'assets/landmarks/sagrada-familia.svg',
  'assets/landmarks/salar-de-uyuni.svg', 'assets/landmarks/statue-of-liberty.svg', 'assets/landmarks/stonehenge.svg',
  'assets/landmarks/sydney-opera-house.svg', 'assets/landmarks/table-mountain.svg', 'assets/landmarks/taj-mahal.svg',
  'assets/landmarks/teotihuacan.svg', 'assets/landmarks/terracotta-army.svg', 'assets/landmarks/twelve-apostles.svg', 'assets/landmarks/uluru.svg',
  'assets/landmarks/victoria-falls.svg', 'assets/landmarks/waitomo-glowworm-caves.svg', 'assets/landmarks/white-house.svg',
  'assets/landmarks/alamo.svg', 'assets/landmarks/cape-hatteras-lighthouse.svg', 'assets/landmarks/devils-tower.svg', 'assets/landmarks/empire-state-building.svg', 'assets/landmarks/gateway-arch.svg', 'assets/landmarks/hoover-dam.svg', 'assets/landmarks/kennedy-space-center.svg', 'assets/landmarks/liberty-bell.svg', 'assets/landmarks/monument-valley.svg', 'assets/landmarks/pearl-harbor.svg', 'assets/landmarks/space-needle.svg', 'assets/landmarks/willis-tower.svg',
  'assets/fonts/alegreya-sans-latin-400-normal.woff2', 'assets/fonts/alegreya-sans-latin-500-normal.woff2', 'assets/fonts/alegreya-sans-latin-700-normal.woff2',
  'assets/fonts/alegreya-sans-sc-latin-500-normal.woff2', 'assets/fonts/alegreya-sans-sc-latin-800-normal.woff2'
];

self.addEventListener('install', e => {
  // straight from the website, not the browser's short-term copy, which can still hold the previous version's files
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache: 'reload'})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('wgq-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// "refresh" from the page's Update button: fetch every file fresh from the website, then say when done
self.addEventListener('message', e => {
  if (e.data !== 'refresh') return;
  const port = e.ports && e.ports[0];
  e.waitUntil(caches.open(CACHE).then(cache => Promise.all(FILES.map(f =>
    fetch(f + (f.includes('?') ? '&' : '?') + 'check=' + Date.now(), {cache: 'no-store'}).then(r => r.ok ? cache.put(f, r) : null).catch(() => null)
  ))).then(() => port && port.postMessage('refreshed'), () => port && port.postMessage('failed')));
});

// a file's name in the cache is its path inside the game ("data/maps/us.json"), whatever address the game lives at
const SCOPE = new URL(self.registration.scope).pathname;
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.searchParams.has('check')) return; // update checks always go to the website
  const path = url.pathname.startsWith(SCOPE) ? url.pathname.slice(SCOPE.length) : url.pathname;
  const key = req.mode === 'navigate' ? './' : path || './';
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(key);
    const fresh = fetch(req, {cache: 'no-cache'}).then(res => { // ask the website, not the browser's own saved copy
      if (res && res.ok && res.type === 'basic') cache.put(key, res.clone());
      return res;
    }).catch(() => cached);
    return cached || fresh;
  }));
});
