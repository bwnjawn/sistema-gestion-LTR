// src/lib/almacenSinConexion.ts
// Almacén clave-valor sobre IndexedDB para el modo sin conexión (SCRUM-250): copia del catálogo, los ajustes y
// la disponibilidad, y la cola de solicitudes por enviar. Si IndexedDB no existe o falla (modo privado, pruebas),
// usa la memoria: la app sigue funcionando, solo que sin guardar entre sesiones.

const NOMBRE_BD = 'ltr_sin_conexion'
const NOMBRE_TABLA = 'datos'

const enMemoria = new Map<string, string>()
let conexion: Promise<IDBDatabase | null> | null = null

function abrir(): Promise<IDBDatabase | null> {
  if (conexion) return conexion
  conexion = new Promise(resolver => {
    if (typeof indexedDB === 'undefined') return resolver(null)
    try {
      const pedido = indexedDB.open(NOMBRE_BD, 1)
      pedido.onupgradeneeded = () => pedido.result.createObjectStore(NOMBRE_TABLA)
      pedido.onsuccess = () => resolver(pedido.result)
      pedido.onerror = () => resolver(null)
      pedido.onblocked = () => resolver(null)
    } catch {
      resolver(null)
    }
  })
  return conexion
}

/** Una operación sobre la tabla. Devuelve `undefined` si IndexedDB no está disponible o la operación falla. */
async function operar<T>(modo: IDBTransactionMode, accion: (tabla: IDBObjectStore) => IDBRequest<T>): Promise<{ ok: boolean; valor?: T }> {
  const bd = await abrir()
  if (!bd) return { ok: false }
  return new Promise(resolver => {
    try {
      const pedido = accion(bd.transaction(NOMBRE_TABLA, modo).objectStore(NOMBRE_TABLA))
      pedido.onsuccess = () => resolver({ ok: true, valor: pedido.result })
      pedido.onerror = () => resolver({ ok: false })
    } catch {
      resolver({ ok: false })
    }
  })
}

/** Guarda un valor (se guarda una copia en JSON: no importa si viene de un objeto reactivo de Vue). */
export async function guardarSinConexion(clave: string, valor: unknown): Promise<void> {
  const texto = JSON.stringify(valor)
  const resultado = await operar('readwrite', tabla => tabla.put(texto, clave))
  if (!resultado.ok) enMemoria.set(clave, texto)
  else enMemoria.delete(clave)
}

/** Lo último guardado bajo `clave`, o `undefined` si no hay nada. */
export async function leerSinConexion<T>(clave: string): Promise<T | undefined> {
  const resultado = await operar<string | undefined>('readonly', tabla => tabla.get(clave) as IDBRequest<string | undefined>)
  const texto = resultado.ok ? resultado.valor : enMemoria.get(clave)
  if (typeof texto !== 'string') return undefined
  try {
    return JSON.parse(texto) as T
  } catch {
    return undefined
  }
}

export async function borrarSinConexion(clave: string): Promise<void> {
  enMemoria.delete(clave)
  await operar('readwrite', tabla => tabla.delete(clave))
}

/** Copias que solo existen mientras hay un administrador: se borran al cerrar sesión (SCRUM-250). */
export const CLAVES_DEL_ADMINISTRADOR = [
  'solicitudes',
  'admin_perfil',
  'catalogo:cabanas',
  'catalogo:camping',
  'catalogo:platos',
  'catalogo:acompanamientos'
]

export async function olvidarDatosDelAdministrador(): Promise<void> {
  await Promise.all(CLAVES_DEL_ADMINISTRADOR.map(c => borrarSinConexion(c)))
}

/** Solo para pruebas: olvida lo que haya en memoria y la conexión abierta. */
export function reiniciarAlmacenSinConexion(): void {
  enMemoria.clear()
  conexion = null
}
