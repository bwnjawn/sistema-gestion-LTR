// Worker de Cloudflare: atiende /admin y /admin/* (el resto lo sirven los archivos estáticos) y,
// una vez al día, hace un ping a Supabase para que el proyecto no se pause por inactividad (SCRUM-292).
//
// Por qué existe: iOS lee el manifest, el ícono y el título del HTML que recibe al
// "Agregar a inicio". Como la app es de una sola página, /admin recibía el HTML del
// cliente (manifest con start_url "/") y el ícono abría la portada del cliente.
// Aquí se entrega ese mismo HTML con la identidad del administrador ya escrita.
// El cambio equivalente en el navegador está en src/router/index.ts (aplicarIdentidadDeApp)
// y, para cuando el service worker responde desde caché, en public/admin-identidad-sw.js.

import { mantenerActivaLaBase } from './pingSupabase.js'

export default {
  // Lo llama Cloudflare según `triggers.crons` de wrangler.jsonc. Si el ping falla, el error queda en los logs.
  async scheduled(_controlador, env, ctx) {
    ctx.waitUntil(mantenerActivaLaBase(env))
  },

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
