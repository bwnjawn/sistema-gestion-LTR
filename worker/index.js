// Worker de Cloudflare: solo atiende /admin y /admin/*. El resto lo sirven los archivos estáticos.
//
// Por qué existe: iOS lee el manifest, el ícono y el título del HTML que recibe al
// "Agregar a inicio". Como la app es de una sola página, /admin recibía el HTML del
// cliente (manifest con start_url "/") y el ícono abría la portada del cliente.
// Aquí se entrega ese mismo HTML con la identidad del administrador ya escrita.
// El cambio equivalente en el navegador está en src/router/index.ts (aplicarIdentidadDeApp)
// y, para cuando el service worker responde desde caché, en public/admin-identidad-sw.js.

export default {
  async fetch(request, env) {
    const respuesta = await env.ASSETS.fetch(new Request(new URL('/', request.url), request))
    const tipo = respuesta.headers.get('content-type') || ''
    if (!tipo.includes('text/html')) return respuesta

    return new HTMLRewriter()
      .on('link[rel="manifest"]', { element: (el) => el.setAttribute('href', '/manifest-admin.webmanifest') })
      .on('link[rel="apple-touch-icon"]', { element: (el) => el.setAttribute('href', '/apple-touch-icon-admin.png') })
      .on('meta[name="theme-color"]', { element: (el) => el.setAttribute('content', '#000000') })
      .on('head', {
        element: (el) => el.append('<meta name="apple-mobile-web-app-title" content="Admin Troncos">', { html: true })
      })
      .transform(respuesta)
  }
}
