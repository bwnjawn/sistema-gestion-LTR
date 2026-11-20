// Avisos push (SCRUM-68). Lo carga el service worker de la PWA con `importScripts` (ver vite.config.ts).
// Recibe el aviso { titulo, cuerpo, url, etiqueta } y lo muestra; al tocarlo abre la solicitud.

self.addEventListener('push', evento => {
  let aviso = { titulo: 'Los Troncos de Repil', cuerpo: 'Hay novedades en el panel.', url: '/admin/solicitudes', etiqueta: 'aviso' }
  try {
    if (evento.data) aviso = { ...aviso, ...evento.data.json() }
  } catch {
    // Texto que no es JSON: se muestra el aviso genérico
  }
  evento.waitUntil(
    self.registration.showNotification(aviso.titulo, {
      body: aviso.cuerpo,
      icon: '/pwa-admin-192x192.png',
      badge: '/pwa-admin-192x192.png',
      tag: aviso.etiqueta,
      data: { url: aviso.url }
    })
  )
})

self.addEventListener('notificationclick', evento => {
  evento.notification.close()
  const destino = new URL(evento.notification.data?.url || '/admin/solicitudes', self.location.origin).href
  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ventanas => {
      // Si la app ya está abierta, se usa esa ventana en vez de abrir otra
      for (const ventana of ventanas) {
        if (new URL(ventana.url).origin === self.location.origin && 'navigate' in ventana) {
          return ventana.navigate(destino).then(v => (v || ventana).focus())
        }
      }
      return self.clients.openWindow(destino)
    })
  )
})
