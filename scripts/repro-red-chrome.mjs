// scripts/repro-red-chrome.mjs
// Reproduce en un Chrome real (de escritorio) el arranque con Supabase inalcanzable y su recuperación, y muestra el
// diagnóstico temporal de la pantalla de arranque (SCRUM-274, ver docs/investigacion-red-ios.md).
//
// OJO: Chrome de escritorio NO reproduce el problema del iPhone (conexión muerta reutilizada): sirve para comprobar que
// la lógica de arranque y recuperación funciona, no para ver el defecto de iOS.
//
// Cómo usarlo (puppeteer-core no está en package.json a propósito; se instala sin guardarlo):
//   1. npm run dev -- --port 5180 --strictPort        (en una terminal)
//   2. npm i --no-save puppeteer-core                  (en otra)
//   3. node scripts/repro-red-chrome.mjs
// Ajusta URL y CHROME si tu puerto o tu ruta de Chrome son otros.

// Prueba el diagnóstico temporal en un Chrome real: la página carga, Supabase está inalcanzable, y luego vuelve.
import puppeteer from 'puppeteer-core'

const URL = 'http://localhost:5180/'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const espera = ms => new Promise(r => setTimeout(r, ms))

const navegador = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const pagina = await navegador.newPage()
await pagina.setRequestInterception(true)
let bloquear = true
pagina.on('request', r => {
  if (/supabase\.co/.test(r.url()) && bloquear) r.abort('internetdisconnected')
  else r.continue()
})

const diag = () => pagina.evaluate(() => document.getElementById('arranque-diagnostico')?.textContent ?? '(no hay diagnóstico en pantalla)')
const titulo = () => pagina.evaluate(() => (document.querySelector('.arranque__titulo')?.textContent ?? document.getElementById('app')?.innerText?.slice(0, 40) ?? ''))

await pagina.goto(URL, { waitUntil: 'domcontentloaded' })
await espera(7000)
console.log('--- Supabase BLOQUEADO (pantalla: ' + (await titulo()) + ') ---')
console.log(await diag())

bloquear = false
await espera(5000)
console.log('\n--- Supabase ALCANZABLE otra vez (pantalla: ' + (await titulo()) + ') ---')
console.log((await diag()).split('\n').slice(0, 6).join('\n'))

await navegador.close()
process.exit(0)
