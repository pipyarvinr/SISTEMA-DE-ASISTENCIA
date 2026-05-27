// SW NUCLEAR - se autodestruye y fuerza descarga completa
self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    (async () => {
      // Borrar TODOS los cachés sin excepción
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      // Tomar control de todos los clientes
      await self.clients.claim();
      // Obtener todos los clientes incluyendo PWA instalada
      const clients = await self.clients.matchAll({ 
        type: 'window', 
        includeUncontrolled: true 
      });
      // Forzar navegación en cada cliente (recarga dura)
      for (const client of clients) {
        try { await client.navigate(client.url); } catch(e) {}
      }
      // Desregistrarse a sí mismo para que no interfiera más
      await self.registration.unregister();
    })()
  );
});

// No cachear NADA - pasar todo directo a la red
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request));
});
