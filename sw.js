const CACHE = 'asistencia-qr-20260526e';
const ASSETS = [self.location.pathname];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      // Borrar TODOS los cachés anteriores sin excepción
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(async () => {
      await self.clients.claim();
      // Notificar a todas las pestañas abiertas
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach(client => {
        client.postMessage({ type: 'SW_UPDATED' });
        // Forzar recarga directa en cada cliente
        client.navigate(client.url);
      });
    })
  );
});

// Escuchar SKIP_WAITING desde la página
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  if (url.includes('firebasejs') || url.includes('googleapis') ||
      url.includes('gstatic') || url.includes('firebaseio') ||
      url.includes('jsdelivr') || url.includes('fonts.')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // Network-first: siempre intenta red primero, caché solo si no hay red
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
