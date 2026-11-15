// src/stores/catalogStore.ts

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Cabin, CampingSite, Dish } from '../types/domain'
import { generateUUID } from '../lib/id'
import { repositorios } from '../lib/repositories'
import { persistirConReversion } from '../lib/persistirConReversion'
import { mensajeDeError } from '../lib/errores'

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
    const newDish: Dish = {
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
    }
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
    try {
      await persistirConReversion({
        aplicar: () => { todosLosPlatos.value[idx] = { ...previo, ...updated } },
        revertir: () => { todosLosPlatos.value[idx] = previo },
        persistir: () => repositorios().dishes.update(id, updated),
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

  async function addGlobalSideDish(name: string): Promise<void> {
    const trimmed = name.trim()
    if (!trimmed || globalSideDishes.value.includes(trimmed)) return
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
    }
  }

  async function deleteGlobalSideDish(name: string): Promise<void> {
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
    deleteGlobalSideDish
  }
})
