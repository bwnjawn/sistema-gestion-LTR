// Arranca la app en modo local (localStorage, sin Supabase) en el puerto 5180, sin tocar el .env.
// Uso: npm run dev:local. Los datos de este modo viven aparte de los del `npm run dev` (otro puerto).
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const env = { ...process.env, VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' }
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const hijo = spawn(process.execPath, [vite, '--port', '5180', '--strictPort', ...process.argv.slice(2)], { env, stdio: 'inherit' })
hijo.on('exit', codigo => process.exit(codigo ?? 0))
