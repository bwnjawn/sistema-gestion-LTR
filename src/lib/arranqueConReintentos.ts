// src/lib/arranqueConReintentos.ts
// Lógica del arranque de la app (SCRUM-274), separada de la pantalla para poder probarla. Garantiza que el usuario
// nunca vea una pantalla vacía y que la app se recupere sola:
//  - Sin conexión al empezar: se avisa al instante y no se espera a que fallen las consultas.
//  - Con conexión pero sin que el servidor responda (justo al reconectar): se espera a que responda de verdad antes
//    de pedir nada, para no caer en los reintentos de renovación de sesión de Supabase.
//  - Si tarda más de lo normal: el mensaje cambia y aparece "Reintentar".
//  - Si falla: se explica y se puede reintentar; al volver internet se reintenta solo.
// Con Supabase, una sesión caducada sin internet hace que la renovación reintente unos 12 segundos y que todas las
// consultas esperen detrás: por eso hace falta avisar mientras tanto.

export interface PantallaDeArranque {
  /** Cargando normalmente. */
  mostrarCargando(): void
  /** Sigue cargando pero tarda más de lo normal. */
  mostrarDemora(reintentar: () => void): void
  /** El dispositivo no tiene internet. */
  mostrarSinConexion(reintentar: () => void): void
  /**
   * Lleva un rato sin poder hablar con el servidor. En iPhone, tras cambiar de red (modo avión, Wi-Fi o datos) la app
   * puede quedarse hasta ~2 minutos con una conexión muerta reutilizada: lo único que lo resuelve antes es cerrar la
   * app y volver a abrirla (ver docs/investigacion-red-ios.md).
   */
  mostrarSugerenciaDeReinicio(reintentar: () => void): void
  /** Hay internet pero no se pudieron cargar los datos. */
  mostrarError(reintentar: () => void): void
}

export interface OpcionesDeArranque {
  /** Carga todo lo necesario (ver `inicializarAplicacion`). Rechaza si algo falla. */
  iniciar: () => Promise<void>
  /** Se llama una sola vez, cuando todo cargó: aquí se monta la app. */
  alTerminar: () => void
  pantalla: PantallaDeArranque
  /**
   * ¿El dispositivo dice que tiene internet? Es solo una pista (`navigator.onLine` puede quedar pegado en "sin
   * internet" en iPhone): lo que decide es `comprobarServidor`. Por defecto se supone que sí.
   */
  hayConexion?: () => boolean
  /** Registra un aviso para cuando vuelva internet y devuelve la función que lo quita. */
  alRecuperarConexion: (alVolver: () => void) => () => void
  /** Segundos de espera antes de avisar que tarda más de lo normal. */
  segundosParaAvisar?: number
  /** Segundos sin que el servidor responda antes de sugerir cerrar y volver a abrir la app. */
  segundosParaSugerirReinicio?: number
  /** ¿Responde el servidor de verdad? Si se indica, no se carga nada hasta que responda. */
  comprobarServidor?: () => Promise<boolean>
  /** Cada cuántos milisegundos se vuelve a comprobar mientras el servidor no responde. */
  esperaEntreComprobacionesMs?: number
}

export const SEGUNDOS_PARA_AVISAR_DEMORA = 6
export const SEGUNDOS_PARA_SUGERIR_REINICIO = 20
export const ESPERA_ENTRE_COMPROBACIONES_MS = 2000

/** Inicia el arranque. Devuelve `reintentar` (para el botón) y `cancelar` (para las pruebas). */
export function arrancarConReintentos(opciones: OpcionesDeArranque): { reintentar: () => void; cancelar: () => void } {
  const { iniciar, alTerminar, pantalla, alRecuperarConexion, comprobarServidor } = opciones
  const hayConexion = opciones.hayConexion ?? (() => true)
  const segundos = opciones.segundosParaAvisar ?? SEGUNDOS_PARA_AVISAR_DEMORA
  const esperaMs = opciones.esperaEntreComprobacionesMs ?? ESPERA_ENTRE_COMPROBACIONES_MS
  const segundosParaSugerir = opciones.segundosParaSugerirReinicio ?? SEGUNDOS_PARA_SUGERIR_REINICIO

  let numeroDeIntento = 0
  let terminado = false
  let temporizador: ReturnType<typeof setTimeout> | undefined
  let temporizadorDeSugerencia: ReturnType<typeof setTimeout> | undefined

  function reintentar(): void {
    if (terminado) return
    const este = ++numeroDeIntento
    clearTimeout(temporizador)
    clearTimeout(temporizadorDeSugerencia)

    // Sin internet no se espera a que las consultas fallen: se avisa de inmediato
    if (!hayConexion()) {
      pantalla.mostrarSinConexion(reintentar)
      return
    }

    pantalla.mostrarCargando()
    if (!comprobarServidor) {
      cargar(este)
      return
    }
    void esperarServidor(este).then(listo => {
      if (listo) cargar(este)
    })
  }

  /** Espera a que el servidor responda. Devuelve false si mientras tanto empezó otro intento o ya terminó todo. */
  async function esperarServidor(este: number): Promise<boolean> {
    if (!comprobarServidor) return true
    let avisado = false
    for (;;) {
      const responde = await comprobarServidor()
      if (este !== numeroDeIntento || terminado) return false
      if (responde) {
        clearTimeout(temporizadorDeSugerencia)
        if (avisado) pantalla.mostrarCargando()
        return true
      }
      if (!avisado) {
        pantalla.mostrarSinConexion(reintentar)
        avisado = true
        // Si sigue sin responder pasado un rato, se sugiere cerrar y volver a abrir la app (una sola vez por intento)
        temporizadorDeSugerencia = setTimeout(() => {
          if (este === numeroDeIntento && !terminado) pantalla.mostrarSugerenciaDeReinicio(reintentar)
        }, segundosParaSugerir * 1000)
      }
      await new Promise<void>(continuar => setTimeout(continuar, esperaMs))
      if (este !== numeroDeIntento || terminado) return false
    }
  }

  function cargar(este: number): void {
    temporizador = setTimeout(() => {
      if (este === numeroDeIntento && !terminado) pantalla.mostrarDemora(reintentar)
    }, segundos * 1000)

    iniciar().then(
      () => {
        // Gana el primer intento que termine bien, aunque ya haya empezado otro
        if (terminado) return
        terminado = true
        clearTimeout(temporizador)
        clearTimeout(temporizadorDeSugerencia)
        quitarAvisoDeConexion()
        alTerminar()
      },
      error => {
        // El resultado de un intento viejo ya no importa: hay uno más nuevo en marcha
        if (este !== numeroDeIntento || terminado) return
        clearTimeout(temporizador)
        console.error('[Arranque] No se pudieron cargar los datos:', error)
        if (hayConexion()) pantalla.mostrarError(reintentar)
        else pantalla.mostrarSinConexion(reintentar)
      }
    )
  }

  // Al volver internet se reintenta solo, sin que el usuario toque nada
  const quitarAvisoDeConexion = alRecuperarConexion(() => {
    if (!terminado) reintentar()
  })

  function cancelar(): void {
    terminado = true
    clearTimeout(temporizador)
    clearTimeout(temporizadorDeSugerencia)
    quitarAvisoDeConexion()
  }

  reintentar()
  return { reintentar, cancelar }
}
