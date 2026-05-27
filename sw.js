const CACHE = 'asistencia-qr-20260526b';
const ASSETS = [self.location.pathname];

self.addEventListener('install', e => {
  // Activar inmediatamente sin esperar a que cierren las pestañas
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
});

self.addEventListener('activate', e => {
  // Tomar control inmediato de todas las pestañas abiertas
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  // Firebase y CDN: siempre desde red
  if (url.includes('firebasejs') || url.includes('googleapis') ||
      url.includes('gstatic') || url.includes('firebaseio') ||
      url.includes('jsdelivr') || url.includes('fonts.')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // App shell: RED PRIMERO siempre — nunca sirve caché desactualizado
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
