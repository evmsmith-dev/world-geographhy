// World Geography Quiz: offline support.
// Serves the saved copy right away, then refreshes it from the website in the background.
// Only touches caches that start with "wgq-", so other apps on the same site are left alone.
const CACHE = 'wgq-v1';
const FILES = [
  './', 'index.html', 'app.js', 'app.css', 'us.json', 'world.json', 'europe.json', 'samerica.json', 'namerica.json', 'africa.json', 'asia.json', 'oceania.json', 'facts.json', 'flags.json', 'usflags.json', 'thumbs.json', 'manifest.webmanifest',
  'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-32.png',
  'alegreya-sans-latin-400-normal.woff2', 'alegreya-sans-latin-500-normal.woff2', 'alegreya-sans-latin-700-normal.woff2',
  'alegreya-sans-sc-latin-500-normal.woff2', 'alegreya-sans-sc-latin-800-normal.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
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

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.searchParams.has('check')) return; // update checks always go to the website
  const key = req.mode === 'navigate' ? './' : url.pathname.slice(url.pathname.lastIndexOf('/') + 1) || './';
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(key);
    const fresh = fetch(req).then(res => {
      if (res && res.ok && res.type === 'basic') cache.put(key, res.clone());
      return res;
    }).catch(() => cached);
    return cached || fresh;
  }));
});
