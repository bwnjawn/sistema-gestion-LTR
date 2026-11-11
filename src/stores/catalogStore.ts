// src/stores/catalogStore.ts

import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { Cabin, CampingSite, Dish } from '../types/domain'
import { generateUUID } from '../lib/id'
import { catalogRepository } from '../lib/repositories/catalogRepository'
import { getStorageItem, setStorageItem } from '../lib/persistence'
import { DEFAULT_CABINS, DEFAULT_CAMPING, DEFAULT_DISHES, DEFAULT_GLOBAL_SIDES } from '../data/catalogoInicial'
import { migrarIdsPlatos } from '../services/migracionIds'
import { normalizarCabana, normalizarLista, normalizarPlato, normalizarSitio } from '../services/migracionCatalogo'

/** Lee una lista guardada y la lleva al modelo vigente (SCRUM-245); si cambió, la vuelve a guardar. */
function cargarNormalizado<T>(clave: string, porDefecto: T[], normalizar: (x: any) => T): T[] {
  const guardada = getStorageItem<T[]>(clave, porDefecto)
  const normalizada = normalizarLista(guardada, normalizar)
  if (normalizada !== guardada) setStorageItem(clave, normalizada)
  return normalizada
}

export const useCatalogStore = defineStore('catalog', () => {
  // Las listas completas incluyen lo dado de baja (borrado lógico). Las vistas leen solo lo activo
  // (`cabins`, `campingSites`, `dishes`); las reservas antiguas siguen encontrando lo que ya no está activo.
  const todasLasCabanas = ref<Cabin[]>(cargarNormalizado('cabins', DEFAULT_CABINS, normalizarCabana))
  const todosLosSitios = ref<CampingSite[]>(cargarNormalizado('camping_sites', DEFAULT_CAMPING, normalizarSitio))
  // Los platos guardados con id antiguos (no UUID) se migran y se vuelven a guardar (SCRUM-247)
  const platosGuardados = getStorageItem<Dish[]>('dishes', DEFAULT_DISHES)
  const platosMigrados = migrarIdsPlatos(platosGuardados)
  if (platosMigrados !== platosGuardados) setStorageItem('dishes', platosMigrados)
  const todosLosPlatos = ref<Dish[]>(cargarNormalizado('dishes', platosMigrados, normalizarPlato))
  const cabins = computed(() => todasLasCabanas.value.filter(c => c.isActive))
  const campingSites = computed(() => todosLosSitios.value.filter(s => s.isActive))
  const dishes = computed(() => todosLosPlatos.value.filter(d => d.isActive))
  const globalSideDishes = ref<string[]>(getStorageItem('global_sides', DEFAULT_GLOBAL_SIDES))

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  watch(todasLasCabanas, async (val) => {
    setStorageItem('cabins', val)
    await catalogRepository.saveCabins(val)
  }, { deep: true })

  watch(todosLosSitios, async (val) => {
    setStorageItem('camping_sites', val)
    await catalogRepository.saveCampingSites(val)
  }, { deep: true })

  watch(todosLosPlatos, async (val) => {
    setStorageItem('dishes', val)
    await catalogRepository.saveDishes(val)
  }, { deep: true })

  watch(globalSideDishes, async (val) => {
    setStorageItem('global_sides', val)
    await catalogRepository.saveGlobalSideDishes(val)
  }, { deep: true })

  async function addCabin(cabinData: Partial<Cabin>): Promise<Cabin> {
    isLoading.value = true
    error.value = null
    try {
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
      todasLasCabanas.value.push(newCabin)
      return newCabin
    } catch (e: any) {
      error.value = 'Error al agregar la cabaña.'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function updateCabin(id: string, updated: Partial<Cabin>): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const idx = todasLasCabanas.value.findIndex(c => c.id === id)
      if (idx !== -1) {
        todasLasCabanas.value[idx] = { ...todasLasCabanas.value[idx], ...updated }
      }
    } catch (e: any) {
      error.value = 'Error al actualizar la cabaña.'
    } finally {
      isLoading.value = false
    }
  }

  async function deleteCabin(id: string): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      await updateCabin(id, { isActive: false })
    } catch (e: any) {
      error.value = 'Error al eliminar la cabaña.'
    } finally {
      isLoading.value = false
    }
  }

  async function addCampingSite(siteData: Partial<CampingSite>): Promise<CampingSite> {
    isLoading.value = true
    error.value = null
    try {
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
      todosLosSitios.value.push(newSite)
      return newSite
    } catch (e: any) {
      error.value = 'Error al agregar sitio de camping.'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function updateCampingSite(id: string, updated: Partial<CampingSite>): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const idx = todosLosSitios.value.findIndex(s => s.id === id)
      if (idx !== -1) {
        todosLosSitios.value[idx] = { ...todosLosSitios.value[idx], ...updated }
      }
    } catch (e: any) {
      error.value = 'Error al actualizar sitio de camping.'
    } finally {
      isLoading.value = false
    }
  }

  async function deleteCampingSite(id: string): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      await updateCampingSite(id, { isActive: false })
    } catch (e: any) {
      error.value = 'Error al eliminar sitio de camping.'
    } finally {
      isLoading.value = false
    }
  }

  async function addDish(dishData: Partial<Dish>): Promise<Dish> {
    isLoading.value = true
    error.value = null
    try {
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
      todosLosPlatos.value.push(newDish)
      return newDish
    } catch (e: any) {
      error.value = 'Error al agregar el plato.'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function updateDish(id: string, updated: Partial<Dish>): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const idx = todosLosPlatos.value.findIndex(d => d.id === id)
      if (idx !== -1) {
        todosLosPlatos.value[idx] = { ...todosLosPlatos.value[idx], ...updated }
      }
    } catch (e: any) {
      error.value = 'Error al actualizar el plato.'
    } finally {
      isLoading.value = false
    }
  }

  async function deleteDish(id: string): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      await updateDish(id, { isActive: false })
    } catch (e: any) {
      error.value = 'Error al eliminar el plato.'
    } finally {
      isLoading.value = false
    }
  }

  async function addGlobalSideDish(name: string): Promise<void> {
    const trimmed = name.trim()
    if (trimmed && !globalSideDishes.value.includes(trimmed)) {
      globalSideDishes.value.push(trimmed)
    }
  }

  async function deleteGlobalSideDish(name: string): Promise<void> {
    globalSideDishes.value = globalSideDishes.value.filter(s => s !== name)
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
    error,
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