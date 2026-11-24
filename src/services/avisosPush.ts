// src/services/avisosPush.ts
// Lógica de los avisos push al administrador (SCRUM-68): en qué estado están en este dispositivo y qué texto
// mostrar. Sin acceso al navegador: `lib/avisosPush.ts` lee las capacidades reales y las pasa aquí.

export type EstadoAvisos =
  /** Este navegador, o esta forma de abrir la app, no admite avisos (o falta la clave del servidor). */
  | 'no-disponible'
  /** iPhone/iPad con la app abierta en Safari: los avisos solo funcionan con la app en la pantalla de inicio. */
  | 'instalar-app'
  /** El permiso está denegado: solo se arregla en los ajustes del teléfono o del navegador. */
  | 'bloqueado'
  | 'desactivado'
  | 'activado'

export interface CapacidadesDeAvisos {
  /** Hay clave pública VAPID en la configuración de la app. */
  hayClave: boolean
  hayServiceWorker: boolean
  hayPush: boolean
  hayNotificaciones: boolean
  permiso: NotificationPermission | 'no-soportado'
  esIos: boolean
  /** La app está abierta como app instalada (pantalla de inicio), no en una pestaña del navegador. */
  instalada: boolean
  /** Este dispositivo ya tiene una suscripción push. */
  suscrito: boolean
}

export function resolverEstadoAvisos(c: CapacidadesDeAvisos): EstadoAvisos {
  if (!c.hayClave) return 'no-disponible'
  // En iOS, Safari no ofrece `PushManager` hasta que la app se instala: se pregunta antes de mirar las capacidades
  if (c.esIos && !c.instalada) return 'instalar-app'
  if (!c.hayServiceWorker || !c.hayPush || !c.hayNotificaciones) return 'no-disponible'
  if (c.permiso === 'denied') return 'bloqueado'
  if (c.permiso === 'granted' && c.suscrito) return 'activado'
  return 'desactivado'
}

/** Textos de cada estado para la tarjeta de Ajustes. */
export const TEXTO_ESTADO_AVISOS: Record<EstadoAvisos, { titulo: string; detalle: string }> = {
  'no-disponible': {
    titulo: 'No disponible en este dispositivo',
    detalle: 'Este navegador no permite avisos. Prueba desde otro dispositivo o instala la aplicación.'
  },
  'instalar-app': {
    titulo: 'Primero instala la aplicación',
    detalle: 'En iPhone los avisos solo funcionan con la aplicación en la pantalla de inicio. En Safari toca Compartir y luego "Agregar a pantalla de inicio". Después ábrela desde ahí y vuelve a esta pantalla.'
  },
  bloqueado: {
    titulo: 'Los avisos están bloqueados',
    detalle: 'Antes dijiste que no. Para activarlos, permite las notificaciones de esta aplicación en los ajustes del teléfono o del navegador y vuelve a esta pantalla.'
  },
  desactivado: {
    titulo: 'Avisos desactivados',
    detalle: 'Activa los avisos para recibir una notificación en este dispositivo cada vez que llegue una solicitud nueva.'
  },
  activado: {
    titulo: 'Avisos activados',
    detalle: 'Este dispositivo recibe una notificación por cada solicitud nueva, aunque la aplicación esté cerrada.'
  }
}

/** La clave pública VAPID viene en base64 "seguro para URL"; el navegador la pide como bytes. */
export function claveVapidABytes(clave: string): Uint8Array {
  const relleno = '='.repeat((4 - (clave.length % 4)) % 4)
  const base64 = (clave + relleno).replace(/-/g, '+').replace(/_/g, '/')
  const binario = atob(base64)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  return bytes
}
