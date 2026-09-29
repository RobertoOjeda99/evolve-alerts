// Evolve Alerts: recibe los avisos que firma la PC, los guarda en el historial del teléfono
// y los muestra como notificación. Tocar la notificación abre ese aviso completo en la app.
importScripts('historial.js');

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (evento) => {
  let datos = {};
  try { datos = evento.data ? evento.data.json() : {}; } catch { datos = { body: evento.data && evento.data.text() }; }
  const titulo = datos.title || 'Evolve Alerts';
  const cuerpo = datos.body || '';

  evento.waitUntil((async () => {
    // 1. Al historial. Si falla, la notificación sale igual: es lo importante.
    let guardado = { id: null, sinLeer: 0 };
    try {
      guardado = await Historial.guardar({
        titulo, cuerpo,
        completo: datos.completo || cuerpo,
        categoria: datos.categoria || 'claude',
        carpeta: datos.carpeta || '',
        evento: datos.evento || '',
        segundos: datos.segundos ?? null,
        enlace: datos.enlace || '',
      });
    } catch {}
    // 2. La notificación.
    await self.registration.showNotification(titulo, {
      body: cuerpo,
      icon: 'iconos/icono-192.png',
      badge: 'iconos/insignia-96.png',
      tag: datos.tag || undefined,
      data: { url: guardado.id ? `./#aviso-${guardado.id}` : './' },
    });
    // 3. El numerito rojo del ícono.
    try { if (guardado.sinLeer && self.navigator.setAppBadge) await self.navigator.setAppBadge(guardado.sinLeer); } catch {}
    // 4. Si la app está abierta, que se refresque sola.
    const abiertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    abiertas.forEach((c) => c.postMessage({ tipo: 'nuevo-aviso' }));
  })());
});

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const destino = new URL(evento.notification.data.url, self.registration.scope).href;
  evento.waitUntil((async () => {
    const abiertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of abiertas) {
      if ('focus' in c) { c.postMessage({ tipo: 'abrir', url: destino }); return c.focus(); }
    }
    return self.clients.openWindow(destino);
  })());
});
