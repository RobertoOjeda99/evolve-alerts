// Evolve Alerts: recibe los avisos que firma la PC y los muestra como notificación.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (evento) => {
  let datos = {};
  try { datos = evento.data ? evento.data.json() : {}; } catch { datos = { body: evento.data && evento.data.text() }; }
  const titulo = datos.title || 'Evolve Alerts';
  evento.waitUntil(self.registration.showNotification(titulo, {
    body: datos.body || '',
    icon: 'iconos/icono-192.png',
    badge: 'iconos/insignia-96.png',
    tag: datos.tag || undefined,
    data: { url: datos.url || './' },
  }));
});

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const destino = new URL(evento.notification.data.url, self.registration.scope).href;
  evento.waitUntil((async () => {
    const abiertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of abiertas) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow(destino);
  })());
});
