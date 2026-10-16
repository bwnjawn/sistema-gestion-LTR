// src/stores/catalogStore.ts

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Cabin, CampingSite, Dish } from '../types/domain'
import { generateUUID } from '../lib/id'
import { catalogRepository } from '../lib/repositories/catalogRepository'
import { getStorageItem, setStorageItem } from '../lib/persistence'

const DEFAULT_CABINS: Cabin[] = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Cabaña 6',
    capacity: 6,
    pricePerNight: 65000,
    bedsDescription: '1 Cama Matrimonial + 2 Literas',
    description: 'Cabaña acogedora completamente equipada con vista al bosque y estufa a leña.',
    mainImage: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80'],
    features: ['Cocina equipada', 'Estufa a leña', 'Estacionamiento', 'TV Cable']
  },
  {
    id: 'b1fecb99-9c0b-4ef8-bb6d-6bb9bd380a22',
    name: 'Cabaña 8',
    capacity: 8,
    pricePerNight: 120000,
    bedsDescription: '2 Camas Matrimoniales + 2 Literas',
    description: 'Cabaña amplia ideal para familias o grupos grandes con terraza privada.',
    mainImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'],
    features: ['Cocina equipada', 'Terraza privada', 'Estufa a leña', 'Estacionamiento']
  }
]

const DEFAULT_CAMPING: CampingSite[] = [
  {
    id: 'c2fecb99-9c0b-4ef8-bb6d-6bb9bd380a33',
    name: 'Camping Zona General',
    description: 'Espacio rodeado de naturaleza con acceso a baños, duchas con agua caliente, piscinas y zona de río.',
    pricePerPerson: 10000,
    minCapacity: 1,
    maxCapacity: 9,
    isSpecial: false,
    modality: 'pernoctar',
    image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80'],
    features: ['Agua caliente', 'Piscinas', 'Acceso al río', 'Sombra nativa']
  },
  {
    id: 'd3fecb99-9c0b-4ef8-bb6d-6bb9bd380a44',
    name: 'Espacio Grupos Grandes / Días de Campo',
    description: 'Zona exclusiva reservada para delegaciones, colegios y grupos familiares de 10 a 150 personas con terraza privada.',
    pricePerPerson: 10000,
    minCapacity: 10,
    maxCapacity: 150,
    isSpecial: true,
    modality: 'diario',
    image: 'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?auto=format&fit=crop&w=800&q=80'],
    features: ['Terraza privada', 'Zona exclusiva', 'Cancha multiuso', 'Parrillas grupales']
  }
]

const DEFAULT_DISHES: Dish[] = [
  {
    id: 'e4fecb99-9c0b-4ef8-bb6d-6bb9bd380a55',
    name: 'Asado de Cordero y Cerdo',
    price: 20000,
    description: 'Acompañado de papas al vapor, buffet de ensaladas y postre.',
    mealCategory: 'Almuerzo',
    hasSelectableSides: true,
    sideMode: 'choice',
    availableSides: ['Papas al vapor', 'Puré de papas', 'Ensalada surtida'],
    availableSideDishes: ['Papas al vapor', 'Puré de papas', 'Ensalada surtida'],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'f5fecb99-9c0b-4ef8-bb6d-6bb9bd380a66',
    name: 'Vacuno con salsa bechamel',
    price: 21000,
    description: 'Papas rústicas, buffet de ensaladas y postre.',
    mealCategory: 'Almuerzo',
    hasSelectableSides: true,
    sideMode: 'choice',
    availableSides: ['Papas rústicas', 'Puré de papas', 'Arroz con verduras', 'Ensalada surtida'],
    availableSideDishes: ['Papas rústicas', 'Puré de papas', 'Arroz con verduras', 'Ensalada surtida'],
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'g6fecb99-9c0b-4ef8-bb6d-6bb9bd380a77',
    name: 'Salmón con salsa de camarones',
    price: 21000,
    description: 'Acompañado con puré, buffet de ensaladas y pan amasado.',
    mealCategory: 'Almuerzo',
    hasSelectableSides: true,
    sideMode: 'choice',
    availableSides: ['Puré de papas', 'Papas rústicas', 'Arroz con verduras'],
    availableSideDishes: ['Puré de papas', 'Papas rústicas', 'Arroz con verduras'],
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'h7fecb99-9c0b-4ef8-bb6d-6bb9bd380a88',
    name: 'Chuletas de cerdo con puré',
    price: 13000,
    description: 'Buffet de ensaladas, pan amasado y postre.',
    mealCategory: 'Almuerzo',
    hasSelectableSides: false,
    sideMode: 'fixed',
    fixedSide: 'Puré de papas y ensaladas',
    image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'i8fecb99-9c0b-4ef8-bb6d-6bb9bd380a99',
    name: 'Desayuno Campestre Tradicional',
    price: 10800,
    description: 'Pan amasado, mermelada casera, mantequilla, huevos de campo y té/café.',
    mealCategory: 'Desayuno',
    hasSelectableSides: false,
    sideMode: 'fixed',
    fixedSide: 'Pan amasado y mermeladas',
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'j9fecb99-9c0b-4ef8-bb6d-6bb9bd380b00',
    name: 'Once Campestre Sureña',
    price: 12000,
    description: 'Sopaipillas pasadas, kuchen casero, queso fresco y café/té/mate.',
    mealCategory: 'Once',
    hasSelectableSides: false,
    sideMode: 'fixed',
    fixedSide: 'Sopaipillas y kuchen',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'
  }
]

const DEFAULT_GLOBAL_SIDES: string[] = [
  'Papas al vapor',
  'Papas rústicas',
  'Puré de papas',
  'Arroz con verduras',
  'Ensalada surtida',
  'Ensalada a la chilena'
]

export const useCatalogStore = defineStore('catalog', () => {
  const cabins = ref<Cabin[]>(getStorageItem('cabins', DEFAULT_CABINS))
  const campingSites = ref<CampingSite[]>(getStorageItem('camping_sites', DEFAULT_CAMPING))
  const dishes = ref<Dish[]>(getStorageItem('dishes', DEFAULT_DISHES))
  const globalSideDishes = ref<string[]>(getStorageItem('global_sides', DEFAULT_GLOBAL_SIDES))

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  watch(cabins, async (val) => {
    setStorageItem('cabins', val)
    await catalogRepository.saveCabins(val)
  }, { deep: true })

  watch(campingSites, async (val) => {
    setStorageItem('camping_sites', val)
    await catalogRepository.saveCampingSites(val)
  }, { deep: true })

  watch(dishes, async (val) => {
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
        features: cabinData.features || []
      }
      cabins.value.push(newCabin)
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
      const idx = cabins.value.findIndex(c => c.id === id)
      if (idx !== -1) {
        cabins.value[idx] = { ...cabins.value[idx], ...updated }
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
      cabins.value = cabins.value.filter(c => c.id !== id)
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
        modality: siteData.modality || 'pernoctar',
        image: siteData.image || '',
        images: siteData.images || (siteData.image ? [siteData.image] : []),
        features: siteData.features || []
      }
      campingSites.value.push(newSite)
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
      const idx = campingSites.value.findIndex(s => s.id === id)
      if (idx !== -1) {
        campingSites.value[idx] = { ...campingSites.value[idx], ...updated }
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
      campingSites.value = campingSites.value.filter(s => s.id !== id)
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
      const newDish: Dish = {
        id: generateUUID(),
        name: dishData.name || 'Nuevo Plato',
        price: dishData.price || 0,
        description: dishData.description || '',
        mealCategory: dishData.mealCategory || 'Almuerzo',
        hasSelectableSides: dishData.hasSelectableSides ?? true,
        sideMode: dishData.sideMode || (dishData.hasSelectableSides ? 'choice' : 'fixed'),
        availableSides: dishData.availableSides || [],
        availableSideDishes: dishData.availableSideDishes || dishData.availableSides || [],
        fixedSide: dishData.fixedSide || '',
        image: dishData.image || dishData.mainImage || '',
        mainImage: dishData.mainImage || dishData.image || ''
      }
      dishes.value.push(newDish)
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
      const idx = dishes.value.findIndex(d => d.id === id)
      if (idx !== -1) {
        dishes.value[idx] = { ...dishes.value[idx], ...updated }
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
      dishes.value = dishes.value.filter(d => d.id !== id)
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