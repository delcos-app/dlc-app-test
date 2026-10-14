/* DLC OS 2.0 · Service worker: la app se pide primero a la red (siempre la última versión)
   y solo se usa la copia guardada si no hay conexión. Nunca guarda datos.
   v2.309.0: guarda también las dos librerías de fuera que la app necesita (Supabase, para arrancar sin conexión, y Leaflet) y, si
   la red no contesta en 6 s, usa la copia guardada. */
const CACHE = 'dlc-os-2.309.0';
const FILES = ['./', './index.html', './app.js?v=2.309.0', './config.js', './manifest.webmanifest',
               './logo-app.png', './icon-192.png', './icon-512.png', './apple-touch-180.png', './favicon.svg'];
const CDN = ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js', 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)
    .then(() => Promise.all(CDN.map(u => fetch(u, { mode: 'cors' }).then(r => r && r.ok ? c.put(u, r) : null).catch(() => null)))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (CDN.includes(u.href)) {   // librerías de fuera: la copia guardada y, si no la hay, la red
    e.respondWith(caches.match(u.href).then(c => c || fetch(e.request).then(r => { if (r && r.ok) { const k = r.clone(); caches.open(CACHE).then(x => x.put(u.href, k)); } return r; })));
    return;
  }
  if (u.origin !== location.origin) return;   // datos y el resto de CDN: siempre a la red
  if (u.pathname.includes('/manual/')) return;   // v2.204.0: el manual (fotos y vídeos) va siempre a la red y no se guarda
  const red = fetch(e.request, { cache: 'no-cache' }).then(r => {
    if (r && r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); }
    return r;
  });
  e.respondWith(new Promise(res => {
    let hecho = false;
    const fin = x => { if (!hecho) { hecho = true; res(x); } };
    const t = setTimeout(() => caches.match(e.request).then(c => { if (c) fin(c); }), 6000);
    red.then(r => { clearTimeout(t); fin(r); })
       .catch(() => { clearTimeout(t); caches.match(e.request).then(c => fin(c || caches.match('./index.html'))); });
  }));
});
