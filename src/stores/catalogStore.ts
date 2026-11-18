// src/stores/catalogStore.ts

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Cabin, CampingSite, Dish } from '../types/domain'
import { generateUUID } from '../lib/id'
import { repositorios } from '../lib/repositories'
import { persistirConReversion } from '../lib/persistirConReversion'
import { mensajeDeError } from '../lib/errores'
import { aplicarReglaDeAcompanamiento, platosQueUsanAcompanamiento, validarNombreAcompanamiento } from '../services/menus'

export const useCatalogStore = defineStore('catalog', () => {
  // Las listas completas incluyen lo dado de baja (borrado lógico). Las vistas leen solo lo activo
  // (`cabins`, `campingSites`, `dishes`); las reservas antiguas siguen encontrando lo que ya no está activo.
  const todasLasCabanas = ref<Cabin[]>([])
  const todosLosSitios = ref<CampingSite[]>([])
  const todosLosPlatos = ref<Dish[]>([])
  const globalSideDishes = ref<string[]>([])
  const cabins = computed(() => todasLasCabanas.value.filter(c => c.isActive))
  const campingSites = computed(() => todosLosSitios.value.filter(s => s.isActive))
  const dishes = computed(() => todosLosPlatos.value.filter(d => d.isActive))

  const isLoading = ref(false)
  const isReady = ref(false)
  const error = ref<string | null>(null)

  /** Carga el catálogo desde los repositorios. Se llama una vez al arrancar la app. */
  async function init(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const repos = repositorios()
      const [cabanas, sitios, platos, acompanamientos] = await Promise.all([
        repos.cabins.list(),
        repos.campingSites.list(),
        repos.dishes.list(),
        repos.globalSides.list()
      ])
      todasLasCabanas.value = cabanas
      todosLosSitios.value = sitios
      todosLosPlatos.value = platos
      globalSideDishes.value = acompanamientos
      isReady.value = true
    } catch (e) {
      error.value = mensajeDeError(e, 'No se pudo cargar el catálogo.')
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Vuelve a leer el catálogo (otro administrador pudo cambiarlo). Solo cambia en pantalla lo que cambió, y se
   * pospone mientras se está guardando algo. Devuelve si lo aplicó. Si falla, lanza el error.
   */
  async function refrescar(): Promise<boolean> {
    if (isLoading.value) return false
    const repos = repositorios()
    const [cabanas, sitios, platos, acompanamientos] = await Promise.all([
      repos.cabins.list(),
      repos.campingSites.list(),
      repos.dishes.list(),
      repos.globalSides.list()
    ])
    if (isLoading.value) return false
    const asignar = <T>(destino: { value: T }, nuevo: T) => {
      if (JSON.stringify(destino.value) !== JSON.stringify(nuevo)) destino.value = nuevo
    }
    asignar(todasLasCabanas, cabanas)
    asignar(todosLosSitios, sitios)
    asignar(todosLosPlatos, platos)
    asignar(globalSideDishes, acompanamientos)
    return true
  }

  // ---------------------------------------------------------------------------
  // Cabañas
  // ---------------------------------------------------------------------------

  async function addCabin(cabinData: Partial<Cabin>): Promise<Cabin> {
    isLoading.value = true
    error.value = null
    const newCabin: Cabin = {
      id: generateUUID(),
      name: cabinData.name || 'Nueva Cabaña',
      capacity: cabinData.capacity || 1,
      pricePerNight: cabinData.pricePerNight || 0,
      bedsDescription: cabinData.bedsDescription || '',
      description: cabinData.description || '',
      mainImage: cabinData.mainImage || '',
      images: cabinData.images || (cabinData.mainImage ? [cabinData.mainImage] : []),
      features: cabinData.features || [],
      enMantencion: cabinData.enMantencion ?? false,
      isActive: true
    }
    try {
      await persistirConReversion({
        aplicar: () => { todasLasCabanas.value.push(newCabin) },
        revertir: () => { todasLasCabanas.value = todasLasCabanas.value.filter(c => c.id !== newCabin.id) },
        persistir: () => repositorios().cabins.create(newCabin),
        mensaje: 'No se pudo agregar la cabaña.'
      })
      return newCabin
    } catch (e) {
      error.value = mensajeDeError(e, 'Error al agregar la cabaña.')
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function updateCabin(id: string, updated: Partial<Cabin>): Promise<void> {
    isLoading.value = true
    error.value = null
    const idx = todasLasCabanas.value.findIndex(c => c.id === id)
    if (idx === -1) {
      isLoading.value = false
      return
    }
    const previa = todasLasCabanas.value[idx]
    try {
      await persistirConReversion({
        aplicar: () => { todasLasCabanas.value[idx] = { ...previa, ...updated } },
        revertir: () => { todasLasCabanas.value[idx] = previa },
        persistir: () => repositorios().cabins.update(id, updated),
        mensaje: 'No se pudo guardar el cambio de la cabaña.'
      })
    } catch (e) {
      error.value = mensajeDeError(e, 'Error al actualizar la cabaña.')
    } finally {
      isLoading.value = false
    }
  }

  async function deleteCabin(id: string): Promise<void> {
    await updateCabin(id, { isActive: false })
  }

  // ---------------------------------------------------------------------------
  // Camping
  // ---------------------------------------------------------------------------

  async function addCampingSite(siteData: Partial<CampingSite>): Promise<CampingSite> {
    isLoading.value = true
    error.value = null
    const newSite: CampingSite = {
      id: generateUUID(),
      name: siteData.name || 'Nuevo Espacio Camping',
      description: siteData.description || '',
      pricePerPerson: siteData.pricePerPerson || 0,
      minCapacity: siteData.minCapacity ?? 1,
      maxCapacity: siteData.maxCapacity ?? 10,
      isSpecial: siteData.isSpecial ?? false,
      modality: siteData.modality ?? 'pernoctar',
      image: siteData.image || '',
      images: siteData.images || (siteData.image ? [siteData.image] : []),
      features: siteData.features || [],
      isActive: true
    }
    try {
      await persistirConReversion({
        aplicar: () => { todosLosSitios.value.push(newSite) },
        revertir: () => { todosLosSitios.value = todosLosSitios.value.filter(s => s.id !== newSite.id) },
        persistir: () => repositorios().campingSites.create(newSite),
        mensaje: 'No se pudo agregar el espacio de camping.'
      })
      return newSite
    } catch (e) {
      error.value = mensajeDeError(e, 'Error al agregar sitio de camping.')
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function updateCampingSite(id: string, updated: Partial<CampingSite>): Promise<void> {
    isLoading.value = true
    error.value = null
    const idx = todosLosSitios.value.findIndex(s => s.id === id)
    if (idx === -1) {
      isLoading.value = false
      return
    }
    const previo = todosLosSitios.value[idx]
    try {
      await persistirConReversion({
        aplicar: () => { todosLosSitios.value[idx] = { ...previo, ...updated } },
        revertir: () => { todosLosSitios.value[idx] = previo },
        persistir: () => repositorios().campingSites.update(id, updated),
        mensaje: 'No se pudo guardar el cambio del espacio de camping.'
      })
    } catch (e) {
      error.value = mensajeDeError(e, 'Error al actualizar sitio de camping.')
    } finally {
      isLoading.value = false
    }
  }

  async function deleteCampingSite(id: string): Promise<void> {
    await updateCampingSite(id, { isActive: false })
  }

  // ---------------------------------------------------------------------------
  // Platos
  // ---------------------------------------------------------------------------

  async function addDish(dishData: Partial<Dish>): Promise<Dish> {
    isLoading.value = true
    error.value = null
    const modo = dishData.sideMode ?? 'none'
    const newDish: Dish = aplicarReglaDeAcompanamiento({
      id: generateUUID(),
      name: dishData.name || 'Nuevo Plato',
      price: dishData.price || 0,
      description: dishData.description || '',
      mealType: dishData.mealType ?? 'almuerzo',
      sideMode: modo,
      availableSides: modo === 'choice' ? dishData.availableSides ?? [] : [],
      fixedSide: modo === 'fixed' ? dishData.fixedSide ?? '' : '',
      image: dishData.image || '',
      isActive: true
    })
    try {
      await persistirConReversion({
        aplicar: () => { todosLosPlatos.value.push(newDish) },
        revertir: () => { todosLosPlatos.value = todosLosPlatos.value.filter(d => d.id !== newDish.id) },
        persistir: () => repositorios().dishes.create(newDish),
        mensaje: 'No se pudo agregar el plato.'
      })
      return newDish
    } catch (e) {
      error.value = mensajeDeError(e, 'Error al agregar el plato.')
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function updateDish(id: string, updated: Partial<Dish>): Promise<void> {
    isLoading.value = true
    error.value = null
    const idx = todosLosPlatos.value.findIndex(d => d.id === id)
    if (idx === -1) {
      isLoading.value = false
      return
    }
    const previo = todosLosPlatos.value[idx]
    // Si el plato queda en una comida sin acompañamiento (desayuno u once), se limpia lo que tenía.
    const combinado: Dish = { ...previo, ...updated }
    const resultado = aplicarReglaDeAcompanamiento(combinado)
    const cambios: Partial<Dish> =
      resultado === combinado
        ? updated
        : { ...updated, sideMode: 'none', availableSides: [], fixedSide: '', description: resultado.description }
    try {
      await persistirConReversion({
        aplicar: () => { todosLosPlatos.value[idx] = resultado },
        revertir: () => { todosLosPlatos.value[idx] = previo },
        persistir: () => repositorios().dishes.update(id, cambios),
        mensaje: 'No se pudo guardar el cambio del plato.'
      })
    } catch (e) {
      error.value = mensajeDeError(e, 'Error al actualizar el plato.')
    } finally {
      isLoading.value = false
    }
  }

  async function deleteDish(id: string): Promise<void> {
    await updateDish(id, { isActive: false })
  }

  // ---------------------------------------------------------------------------
  // Acompañamientos globales
  // ---------------------------------------------------------------------------

  /** Agrega un acompañamiento. Devuelve el mensaje de error si el nombre no es válido, o `null` si quedó guardado. */
  async function addGlobalSideDish(name: string): Promise<string | null> {
    const trimmed = name.trim()
    const invalido = validarNombreAcompanamiento(trimmed, globalSideDishes.value)
    if (invalido) return invalido
    const previa = [...globalSideDishes.value]
    try {
      await persistirConReversion({
        aplicar: () => { globalSideDishes.value = [...previa, trimmed] },
        revertir: () => { globalSideDishes.value = previa },
        persistir: () => repositorios().globalSides.add(trimmed),
        mensaje: 'No se pudo agregar el acompañamiento.'
      })
    } catch (e) {
      error.value = mensajeDeError(e, 'Error al agregar el acompañamiento.')
      return error.value
    }
    return null
  }

  /**
   * Cambia el nombre de un acompañamiento y de paso en los platos que lo ofrecen. Devuelve el mensaje de error
   * si el nombre no es válido o no se pudo guardar, o `null` si quedó guardado.
   */
  async function renameGlobalSideDish(anterior: string, nuevo: string): Promise<string | null> {
    const limpio = nuevo.trim()
    const invalido = validarNombreAcompanamiento(limpio, globalSideDishes.value, anterior)
    if (invalido) return invalido
    if (limpio === anterior) return null
    const previaLista = [...globalSideDishes.value]
    const previosPlatos = todosLosPlatos.value
    // Se actualizan todos los platos (también los dados de baja) para que no queden con el nombre viejo.
    const cambiar = (p: Dish): Dish =>
      p.availableSides.includes(anterior)
        ? { ...p, availableSides: p.availableSides.map(s => (s === anterior ? limpio : s)) }
        : p
    try {
      await persistirConReversion({
        aplicar: () => {
          globalSideDishes.value = previaLista.map(s => (s === anterior ? limpio : s))
          todosLosPlatos.value = previosPlatos.map(cambiar)
        },
        revertir: () => {
          globalSideDishes.value = previaLista
          todosLosPlatos.value = previosPlatos
        },
        persistir: async () => {
          const repos = repositorios()
          await repos.globalSides.rename(anterior, limpio)
          // Los platos guardan los nombres: se actualizan también en el repositorio.
          for (const plato of previosPlatos.filter(p => p.availableSides.includes(anterior))) {
            await repos.dishes.update(plato.id, { availableSides: cambiar(plato).availableSides })
          }
        },
        mensaje: 'No se pudo cambiar el nombre del acompañamiento.'
      })
    } catch (e) {
      error.value = mensajeDeError(e, 'Error al cambiar el nombre del acompañamiento.')
      return error.value
    }
    return null
  }

  /**
   * Quita un acompañamiento. Si algún plato activo lo ofrece, no lo quita y devuelve los nombres de esos platos
   * (más seguro que borrarlo en silencio de la carta). Si se quitó, devuelve una lista vacía.
   */
  async function deleteGlobalSideDish(name: string): Promise<string[]> {
    const enUso = platosQueUsanAcompanamiento(name, todosLosPlatos.value)
    if (enUso.length > 0) return enUso.map(p => p.name)
    const previa = [...globalSideDishes.value]
    try {
      await persistirConReversion({
        aplicar: () => { globalSideDishes.value = previa.filter(s => s !== name) },
        revertir: () => { globalSideDishes.value = previa },
        persistir: () => repositorios().globalSides.remove(name),
        mensaje: 'No se pudo quitar el acompañamiento.'
      })
    } catch (e) {
      error.value = mensajeDeError(e, 'Error al quitar el acompañamiento.')
    }
    return []
  }

  return {
    cabins,
    campingSites,
    dishes,
    todasLasCabanas,
    todosLosSitios,
    todosLosPlatos,
    globalSideDishes,
    sideDishes: globalSideDishes,
    isLoading,
    isReady,
    error,
    init,
    refrescar,
    addCabin,
    updateCabin,
    deleteCabin,
    addCampingSite,
    updateCampingSite,
    deleteCampingSite,
    addDish,
    updateDish,
    deleteDish,
    addGlobalSideDish,
    renameGlobalSideDish,
    deleteGlobalSideDish
  }
})
