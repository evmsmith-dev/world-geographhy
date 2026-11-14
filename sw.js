// World Geography Quiz: offline support.
// Serves the saved copy right away, then refreshes it from the website in the background.
// Only touches caches that start with "wgq-", so other apps on the same site are left alone.
// Change the version when files move, so devices drop the old copies (v2: files moved into folders).
const CACHE = 'wgq-v2';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'src/app.js', 'src/app.css',
  'data/facts.json', 'data/flags.json', 'data/usflags.json', 'data/thumbs.json',
  'data/maps/us.json', 'data/maps/world.json', 'data/maps/europe.json', 'data/maps/africa.json', 'data/maps/asia.json',
  'data/maps/oceania.json', 'data/maps/namerica.json', 'data/maps/samerica.json',
  'data/maps/europe-geo.json', 'data/maps/africa-geo.json', 'data/maps/asia-geo.json',
  'data/maps/oceania-geo.json', 'data/maps/namerica-geo.json', 'data/maps/samerica-geo.json',
  'assets/icons/icon.svg', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/icons/icon-maskable-512.png',
  'assets/icons/apple-touch-icon.png', 'assets/icons/favicon-32.png',
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
    const fresh = fetch(req).then(res => {
      if (res && res.ok && res.type === 'basic') cache.put(key, res.clone());
      return res;
    }).catch(() => cached);
    return cached || fresh;
  }));
});
