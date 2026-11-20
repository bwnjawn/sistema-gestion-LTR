// src/stores/settingsStore.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BusinessInfo, TransferInfo } from '../types/domain'
import type {
  AjustesGuardados,
  BusinessParametersExtended,
  CabinSchedules,
  CampingSchedules,
  CapacityRules,
  ClaveAjuste,
  ClaveFotoInicio,
  FotosInicio,
  LimiteVariedades,
  LimitesAforo,
  ReglamentoCamping,
  RestaurantSchedules
} from '../types/settings'
import { getRestaurantCapacity } from '../services/availability'
import { DEFAULT_DEPOSIT_DEADLINE_HOURS } from '../services/payments'
import {
  DEFAULT_CABIN_SCHEDULES,
  DEFAULT_CAMPING_SCHEDULES,
  DEFAULT_CONTACT,
  DEFAULT_PARAMS,
  DEFAULT_RESTAURANT_SCHEDULES,
  DEFAULT_TRANSFER,
  PRECIO_PISCINA_POR_DEFECTO,
  REGLAMENTO_CAMPING_VACIO
} from '../data/ajustesPorDefecto'
import { repositorios } from '../lib/repositories'
import { persistirConReversion } from '../lib/persistirConReversion'
import { mensajeDeError } from '../lib/errores'
import { rutaDeReglamentoCamping, validarPdf } from '../services/documentos'
import { direccionParaMostrar } from '../services/ubicacion'
import { FOTOS_INICIO_VACIAS, fotoDeInicio } from '../services/fotosInicio'

export type { BusinessParametersExtended, CapacityRules }

export const useSettingsStore = defineStore('settings', () => {
  // Estado inicial: los valores de fábrica. `init()` los reemplaza por lo que haya guardado el administrador.
  const contactInfo = ref<BusinessInfo>({ ...DEFAULT_CONTACT })
  const transferInfo = ref<TransferInfo>({ ...DEFAULT_TRANSFER })
  const restaurantSchedules = ref<RestaurantSchedules>(structuredClone(DEFAULT_RESTAURANT_SCHEDULES))
  const campingSchedules = ref<CampingSchedules>(structuredClone(DEFAULT_CAMPING_SCHEDULES))
  const cabinSchedules = ref<CabinSchedules>({ ...DEFAULT_CABIN_SCHEDULES })
  const parameters = ref<BusinessParametersExtended>(structuredClone(DEFAULT_PARAMS))
  const campingRules = ref<ReglamentoCamping>({ ...REGLAMENTO_CAMPING_VACIO })
  const fotosInicio = ref<FotosInicio>({ ...FOTOS_INICIO_VACIAS })

  const isLoading = ref(false)
  const isReady = ref(false)
  const error = ref<string | null>(null)

  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)

  function updateOnlineStatus() {
    isOnline.value = typeof navigator !== 'undefined' ? navigator.onLine : true
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
  }

  const currentDateDynamic = computed(() => {
    const now = new Date()
    const str = now.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
    return str.charAt(0).toUpperCase() + str.slice(1)
  })

  /** Carga los ajustes guardados desde el repositorio. Se llama una vez al arrancar la app. */
  async function init(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const repo = repositorios().settings
      const [contacto, transferencia, restaurante, camping, cabana, parametros, reglamento, fotos] = await Promise.all([
        repo.get('contact_info', DEFAULT_CONTACT),
        repo.get('transfer_info', DEFAULT_TRANSFER),
        repo.get('restaurant_schedules', DEFAULT_RESTAURANT_SCHEDULES),
        repo.get('camping_schedules', DEFAULT_CAMPING_SCHEDULES),
        repo.get('cabin_schedules', DEFAULT_CABIN_SCHEDULES),
        repo.get('parameters', DEFAULT_PARAMS),
        repo.get('camping_rules', REGLAMENTO_CAMPING_VACIO),
        repo.get('fotos_inicio', FOTOS_INICIO_VACIAS)
      ])
      campingRules.value = reglamento
      fotosInicio.value = { ...FOTOS_INICIO_VACIAS, ...fotos }
      contactInfo.value = contacto
      // Lo guardado antes de que existieran campos nuevos se completa con los de fábrica
      transferInfo.value = { ...DEFAULT_TRANSFER, ...transferencia }
      restaurantSchedules.value = restaurante
      campingSchedules.value = camping
      cabinSchedules.value = cabana
      parameters.value = parametros
      isReady.value = true
    } catch (e) {
      error.value = mensajeDeError(e, 'No se pudieron cargar los ajustes.')
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Vuelve a leer los ajustes (otro administrador pudo cambiarlos). Solo cambia en pantalla lo que cambió, y se
   * pospone mientras se está guardando algo. Devuelve si los aplicó. Si falla, lanza el error.
   */
  async function refrescar(): Promise<boolean> {
    if (isLoading.value) return false
    const repo = repositorios().settings
    repo.invalidar()
    const [contacto, transferencia, restaurante, camping, cabana, parametros, reglamento, fotos] = await Promise.all([
      repo.get('contact_info', DEFAULT_CONTACT),
      repo.get('transfer_info', DEFAULT_TRANSFER),
      repo.get('restaurant_schedules', DEFAULT_RESTAURANT_SCHEDULES),
      repo.get('camping_schedules', DEFAULT_CAMPING_SCHEDULES),
      repo.get('cabin_schedules', DEFAULT_CABIN_SCHEDULES),
      repo.get('parameters', DEFAULT_PARAMS),
      repo.get('camping_rules', REGLAMENTO_CAMPING_VACIO),
      repo.get('fotos_inicio', FOTOS_INICIO_VACIAS)
    ])
    if (isLoading.value) return false
    const asignar = <T>(destino: { value: T }, nuevo: T) => {
      if (JSON.stringify(destino.value) !== JSON.stringify(nuevo)) destino.value = nuevo
    }
    asignar(contactInfo, contacto)
    asignar(transferInfo, { ...DEFAULT_TRANSFER, ...transferencia })
    asignar(restaurantSchedules, restaurante)
    asignar(campingSchedules, camping)
    asignar(cabinSchedules, cabana)
    asignar(parameters, parametros)
    asignar(campingRules, reglamento)
    asignar(fotosInicio, { ...FOTOS_INICIO_VACIAS, ...fotos })
    return true
  }

  /** Cambia un ajuste en pantalla, lo guarda y, si falla, lo deja como estaba y avisa. */
  async function guardarAjuste<K extends ClaveAjuste>(
    clave: K,
    destino: { value: AjustesGuardados[K] },
    nuevo: AjustesGuardados[K],
    mensaje: string
  ): Promise<boolean> {
    const previo = destino.value
    isLoading.value = true
    error.value = null
    try {
      await persistirConReversion({
        aplicar: () => { destino.value = nuevo },
        revertir: () => { destino.value = previo },
        persistir: () => repositorios().settings.save(clave, nuevo),
        mensaje
      })
      return true
    } catch (e) {
      error.value = mensajeDeError(e, mensaje)
      return false
    } finally {
      isLoading.value = false
    }
  }

  /** Hay un reglamento del camping para mostrar al cliente. */
  const tieneReglamentoCamping = computed(() => campingRules.value.url !== '')

  /**
   * Sube el PDF del reglamento del camping y reemplaza el anterior. Devuelve el mensaje de error si algo falla
   * (archivo inválido, sin conexión…), o `null` si quedó guardado.
   */
  async function subirReglamentoCamping(archivo: File): Promise<string | null> {
    const invalido = validarPdf(archivo)
    if (invalido) return invalido
    const docs = repositorios().documents
    const anterior = campingRules.value
    let subido
    try {
      subido = await docs.subir(archivo, rutaDeReglamentoCamping())
    } catch (e) {
      error.value = mensajeDeError(e, 'No se pudo subir el archivo.')
      return error.value
    }
    const nuevo: ReglamentoCamping = {
      nombre: archivo.name,
      url: subido.url,
      ruta: subido.ruta,
      actualizadoEn: new Date().toISOString()
    }
    const guardado = await guardarAjuste('camping_rules', campingRules, nuevo, 'No se pudo guardar el reglamento.')
    if (!guardado) {
      // No quedó referenciado: se borra para no dejar archivos sueltos
      await docs.eliminar(subido.ruta).catch(() => {})
      return error.value ?? 'No se pudo guardar el reglamento.'
    }
    if (anterior.ruta) await docs.eliminar(anterior.ruta).catch(() => {})
    return null
  }

  /** Quita el reglamento del camping: el cliente deja de verlo. Devuelve el mensaje de error, o `null` si se quitó. */
  async function quitarReglamentoCamping(): Promise<string | null> {
    const anterior = campingRules.value
    const guardado = await guardarAjuste('camping_rules', campingRules, { ...REGLAMENTO_CAMPING_VACIO }, 'No se pudo quitar el reglamento.')
    if (!guardado) return error.value ?? 'No se pudo quitar el reglamento.'
    if (anterior.ruta) await repositorios().documents.eliminar(anterior.ruta).catch(() => {})
    return null
  }

  /** La foto que se ve en la tarjeta del inicio: la del administrador o, sin ella, la provisoria. */
  function fotoInicio(clave: ClaveFotoInicio): string {
    return fotoDeInicio(fotosInicio.value, clave)
  }

  /** Cambia la foto de una tarjeta del inicio (`''` vuelve a la provisoria). Devuelve el mensaje de error, o `null` si quedó guardada. */
  async function cambiarFotoInicio(clave: ClaveFotoInicio, foto: string): Promise<string | null> {
    const mensaje = 'No se pudo guardar la foto.'
    const guardado = await guardarAjuste('fotos_inicio', fotosInicio, { ...fotosInicio.value, [clave]: foto }, mensaje)
    return guardado ? null : error.value ?? mensaje
  }

  /** La referencia de la dirección que se muestra al cliente: la escrita por el administrador o la de siempre (SCRUM-281). */
  const direccionDelLocal = computed(() => direccionParaMostrar(contactInfo.value.address))
  const capacityRulesActuales = computed<CapacityRules>(() => ({ ...DEFAULT_PARAMS.capacityRules, ...parameters.value.capacityRules }))
  const restaurantCapacity = computed(() => getRestaurantCapacity(capacityRulesActuales.value.restaurantSpaces))
  const limitesAforo = computed<LimitesAforo>(() => ({
    restaurantePersonas: restaurantCapacity.value,
    campingPersonas: capacityRulesActuales.value.maxCampingPeopleCapacity
  }))

  const limiteVariedades = computed<LimiteVariedades>(() => ({
    umbralPersonas: capacityRulesActuales.value.menuLargeGroupThreshold,
    maxVariedades: capacityRulesActuales.value.maxMenuVarietiesLargeGroup
  }))

  const phone1Clean = computed(() => contactInfo.value.phone1.replace(/\s+/g, ''))
  const phone2Clean = computed(() => contactInfo.value.phone2.replace(/\s+/g, ''))

  async function updateContactInfo(info: Partial<BusinessInfo>): Promise<boolean> {
    return guardarAjuste('contact_info', contactInfo, { ...contactInfo.value, ...info }, 'No se pudo guardar la información de contacto.')
  }

  async function updateTransferInfo(info: Partial<TransferInfo>): Promise<boolean> {
    return guardarAjuste('transfer_info', transferInfo, { ...transferInfo.value, ...info }, 'No se pudieron guardar los datos de transferencia.')
  }

  async function updateParameters(params: Partial<BusinessParametersExtended>): Promise<boolean> {
    return guardarAjuste('parameters', parameters, { ...parameters.value, ...params }, 'No se pudieron guardar los parámetros del negocio.')
  }

  async function updateCapacityRules(rules: Partial<CapacityRules>): Promise<boolean> {
    return guardarAjuste(
      'parameters',
      parameters,
      { ...parameters.value, capacityRules: { ...parameters.value.capacityRules, ...rules } },
      'No se pudieron guardar las reglas de aforo.'
    )
  }

  async function updateCampingSchedules(horarios: CampingSchedules): Promise<boolean> {
    return guardarAjuste('camping_schedules', campingSchedules, horarios, 'No se pudieron guardar los horarios de camping.')
  }

  async function updateRestaurantSchedules(horarios: RestaurantSchedules): Promise<boolean> {
    return guardarAjuste('restaurant_schedules', restaurantSchedules, horarios, 'No se pudieron guardar los horarios del restaurante.')
  }

  async function updateCabinSchedules(horarios: CabinSchedules): Promise<boolean> {
    return guardarAjuste('cabin_schedules', cabinSchedules, horarios, 'No se pudieron guardar los horarios de las cabañas.')
  }

  return {
    contactInfo,
    direccionDelLocal,
    transferInfo,
    restaurantSchedules,
    campingSchedules,
    cabinSchedules,
    parameters,
    campingRules,
    fotosInicio,
    fotoInicio,
    cambiarFotoInicio,
    tieneReglamentoCamping,
    isLoading,
    isReady,
    error,
    init,
    refrescar,
    defaultDepositPercentage: computed(() => parameters.value.defaultDepositPercentage ?? 30),
    depositDeadlineHours: computed(() => parameters.value.depositDeadlineHours || DEFAULT_DEPOSIT_DEADLINE_HOURS),
    ivaPercentage: computed(() => parameters.value.ivaPercentage ?? 19),
    poolEntryPrice: computed(() => parameters.value.poolEntryPrice ?? PRECIO_PISCINA_POR_DEFECTO),
    marginPercentage: computed(() => parameters.value.marginPercentage ?? 10),
    // Se completa con los valores de fábrica: los parámetros guardados antes de SCRUM-244 no traían los espacios.
    capacityRules: capacityRulesActuales,
    restaurantCapacity,
    limitesAforo,
    limiteVariedades,
    currentDate: currentDateDynamic,
    isConnected: isOnline,
    phone1Clean,
    phone2Clean,
    updateContactInfo,
    updateTransferInfo,
    updateParameters,
    updateCapacityRules,
    updateCampingSchedules,
    updateRestaurantSchedules,
    updateCabinSchedules,
    subirReglamentoCamping,
    quitarReglamentoCamping
  }
})
