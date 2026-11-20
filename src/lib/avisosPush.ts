// src/lib/avisosPush.ts
// Acceso al navegador para los avisos push (SCRUM-68): permiso, service worker y suscripción. Solo habla con las
// APIs del navegador; guardar la suscripción en la base lo hace el repositorio. La lógica de estados está en
// `services/avisosPush.ts`.

import { claveVapidABytes, type CapacidadesDeAvisos } from '../services/avisosPush'

/** Clave pública VAPID (la privada vive solo como secreto de la Edge Function). */
const CLAVE_VAPID: string | undefined = import.meta.env.VITE_VAPID_PUBLIC_KEY

export interface SuscripcionDelNavegador {
  endpoint: string
  p256dh: string
  auth: string
}

function esIos(): boolean {
  const ua = navigator.userAgent
  // iPadOS 13+ se presenta como Mac: se distingue por la pantalla táctil
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

function estaInstalada(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

async function suscripcionActual(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    const registro = await navigator.serviceWorker.getRegistration()
    return (await registro?.pushManager.getSubscription()) ?? null
  } catch {
    return null
  }
}

export async function leerCapacidadesDeAvisos(): Promise<CapacidadesDeAvisos> {
  const hayNotificaciones = typeof Notification !== 'undefined'
  return {
    hayClave: !!CLAVE_VAPID,
    hayServiceWorker: 'serviceWorker' in navigator,
    hayPush: 'PushManager' in window,
    hayNotificaciones,
    permiso: hayNotificaciones ? Notification.permission : 'no-soportado',
    esIos: esIos(),
    instalada: estaInstalada(),
    suscrito: !!(await suscripcionActual())
  }
}

function aSuscripcion(s: PushSubscription): SuscripcionDelNavegador {
  const json = s.toJSON()
  return { endpoint: s.endpoint, p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' }
}

/**
 * Pide el permiso (si hace falta) y suscribe este dispositivo. Devuelve la suscripción, o `null` si la persona
 * no dio el permiso. Debe llamarse desde un toque del usuario: iOS no deja pedir el permiso de otra forma.
 */
export async function suscribirDispositivo(): Promise<SuscripcionDelNavegador | null> {
  if (!CLAVE_VAPID) throw new Error('Falta la clave de los avisos en la configuración de la aplicación.')
  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') return null
  const registro = await navigator.serviceWorker.ready
  const existente = await registro.pushManager.getSubscription()
  const suscripcion =
    existente ??
    (await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: claveVapidABytes(CLAVE_VAPID) as BufferSource
    }))
  return aSuscripcion(suscripcion)
}

/** Cancela la suscripción de este dispositivo y devuelve su endpoint (para borrarla de la base), o null si no había. */
export async function cancelarSuscripcionDelDispositivo(): Promise<string | null> {
  const suscripcion = await suscripcionActual()
  if (!suscripcion) return null
  const endpoint = suscripcion.endpoint
  await suscripcion.unsubscribe()
  return endpoint
}

/** El endpoint de este dispositivo, si ya está suscrito. */
export async function endpointDelDispositivo(): Promise<string | null> {
  return (await suscripcionActual())?.endpoint ?? null
}
