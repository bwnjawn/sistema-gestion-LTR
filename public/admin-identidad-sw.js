// Se suma al service worker (importScripts en vite.config.ts).
// Cuando el teléfono ya tiene la app en caché, /admin se responde desde ahí con el HTML del
// cliente. Aquí se le pone la identidad del administrador (manifest, ícono y título) para que
// "Agregar a inicio" en iPhone abra el panel y no la portada del cliente. Ver worker/index.js.
self.addEventListener('fetch', (evento) => {
  const peticion = evento.request
  if (peticion.mode !== 'navigate') return
  const ruta = new URL(peticion.url).pathname
  if (ruta !== '/admin' && !ruta.startsWith('/admin/')) return

  evento.respondWith((async () => {
    const guardada = await caches.match('/index.html', { ignoreSearch: true })
    if (!guardada) return fetch(peticion)
    const html = (await guardada.text())
      .replace(/(<link rel="manifest" href=")[^"]*(")/, '$1/manifest-admin.webmanifest$2')
      .replace(/(<link rel="apple-touch-icon" href=")[^"]*(")/, '$1/apple-touch-icon-admin.png$2')
      .replace(/(<meta name="theme-color" content=")[^"]*(")/, '$1#000000$2')
      .replace('</head>', '<meta name="apple-mobile-web-app-title" content="Admin Troncos"></head>')
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
  })())
})
