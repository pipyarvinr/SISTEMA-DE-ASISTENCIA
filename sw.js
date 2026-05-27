// ══ SERVICE WORKER — AsistenciaQR v3 ══
// Cambia CACHE_VERSION cada vez que publiques cambios
const CACHE_VERSION = 'asistencia-v3';

const ARCHIVOS_ESENCIALES = [
  './index.html',
  './manifest.json',
  './logo.jpeg'
];

// ── INSTALL: cachea los archivos esenciales ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(ARCHIVOS_ESENCIALES))
  );
  // NO llamar skipWaiting aquí — esperará a que no haya clientes activos,
  // o hasta que el index.html llame postMessage({ type: 'SKIP_WAITING' })
});

// ── ACTIVATE: borra cachés viejos ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: red primero, caché como respaldo ──
self.addEventListener('fetch', e => {
  // Solo interceptar GET del mismo origen
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // No interceptar Firebase, Google Fonts, CDNs — dejar pasar directo
  if (!url.origin.includes(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Guardar copia fresca en caché
        const copia = res.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(e.request, copia));
        return res;
      })
      .catch(() => caches.match(e.request)) // si no hay red, usar caché
  );
});

// ── MESSAGE: recibe SKIP_WAITING desde index.html ──
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    // Avisar a todos los clientes que el SW se actualizó
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' }));
    });
  }
});
