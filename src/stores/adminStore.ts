import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Dish {
  id: string
  name: string
  price: number
  description?: string
  mealCategory?: string
  availableSides?: string[]
}

export interface Cabin {
  id: string
  name: string
  capacity: number
  pricePerNight: number
  bedsDescription: string
  description?: string
  mainImage?: string
  images?: string[]
  features?: string[]
}

export interface CampingSite {
  id: string
  name: string
  description: string
  pricePerPerson: number
  minCapacity: number
  maxCapacity: number
  isSpecial: boolean
  modality: string
  image?: string
  images?: string[]
  features?: string[]
}

export const useAdminStore = defineStore('admin', () => {
  // Parámetros Generales
  const defaultDepositPercentage = ref(30)
  const currentDate = ref('Miércoles 21 de Octubre')
  const isConnected = ref(true)

  // Horarios Parametrizados de Camping
  const campingSchedules = ref({
    diario: {
      checkIn: '09:00',
      checkOut: '19:30',
      display: 'Día de ingreso (09:00 hrs) - Día de ingreso (19:30 hrs)'
    },
    pernoctar: {
      checkIn: '12:00',
      checkOut: '11:00',
      display: 'Día de ingreso (12:00 hrs) - Día de salida (11:00 hrs)'
    }
  })

  // Horarios Parametrizados de Cabañas
  const cabinSchedules = ref({
    checkIn: '15:00',
    checkOut: '11:00',
    display: 'Día de ingreso (15:00 hrs) - Día de salida (11:00 hrs)'
  })

  // Catálogo de Cabañas
  const cabins = ref<Cabin[]>([
    {
      id: 'cabana-1',
      name: 'Cabaña 6',
      capacity: 6,
      pricePerNight: 65000,
      bedsDescription: '1 Cama Matrimonial + 2 Literas',
      description: 'Cabaña acogedora completamente equipada con vista al bosque y estufa a leña.',
      mainImage: 'https://unsplash.com',
      images: [
        'https://unsplash.com'
      ],
      features: ['Cocina equipada', 'Estufa a leña', 'Estacionamiento', 'TV Cable']
    },
    {
      id: 'cabana-2',
      name: 'Cabaña 8',
      capacity: 8,
      pricePerNight: 120000,
      bedsDescription: '2 Camas Matrimoniales + 2 Literas',
      description: 'Cabaña amplia ideal para familias o grupos grandes con terraza privada.',
      mainImage: 'https://unsplash.com',
      images: [
        'https://unsplash.com'
      ],
      features: ['Cocina equipada', 'Terraza privada', 'Estufa a leña', 'Estacionamiento']
    }
  ])

  // Catálogo de Camping
  const campingSites = ref<CampingSite[]>([
    {
      id: 'cmp-normal',
      name: 'Camping Zona General',
      description: 'Espacio rodeado de naturaleza con acceso a baños, duchas con agua caliente, piscinas y zona de río.',
      pricePerPerson: 10000,
      minCapacity: 1,
      maxCapacity: 9,
      isSpecial: false,
      modality: 'Por el día / Pernoctar',
      image: 'https://unsplash.com',
      images: [
        'https://unsplash.com',
        'https://unsplash.com'
      ],
      features: ['Agua caliente', 'Piscinas', 'Acceso al río', 'Sombra nativa']
    },
    {
      id: 'cmp-especial',
      name: 'Espacio Grupos Grandes / Días de Campo',
      description: 'Zona exclusiva reservada para delegaciones, colegios y grupos familiares de 10 a 150 personas con terraza privada.',
      pricePerPerson: 10000,
      minCapacity: 10,
      maxCapacity: 150,
      isSpecial: true,
      modality: 'Por el día / Pernoctar',
      image: 'https://unsplash.com',
      images: [
        'https://unsplash.com',
        'https://unsplash.com'
      ],
      features: ['Terraza privada', 'Zona exclusiva', 'Cancha multiuso', 'Parrillas grupales']
    }
  ])

  // Catálogo de Platos del Restaurante (Necesario para RestaurantStep4View)
  const dishes = ref<Dish[]>([
    {
      id: 'd1',
      name: 'Asado de Cordero y Cerdo',
      price: 20000,
      description: 'Acompañado de papas al vapor y buffet de ensaladas.',
      mealCategory: 'Almuerzo'
    },
    {
      id: 'd2',
      name: 'Vacuno con salsa bechamel',
      price: 21000,
      description: 'Papas rústicas, buffet de ensaladas y postre.',
      mealCategory: 'Almuerzo'
    },
    {
      id: 'd3',
      name: 'Salmón con salsa de camarones',
      price: 21000,
      description: 'Acompañado con puré y ensaladas.',
      mealCategory: 'Almuerzo'
    },
    {
      id: 'd4',
      name: 'Chuletas de cerdo con puré',
      price: 13000,
      description: 'Buffet de ensaladas, pan amasado y postre.',
      mealCategory: 'Almuerzo'
    },
    {
      id: 'd5',
      name: 'Desayuno Campestre',
      price: 10800,
      description: 'Pan amasado, mermelada, mantequilla, té/café y jugos.',
      mealCategory: 'Desayuno'
    }
  ])

  return {
    defaultDepositPercentage,
    currentDate,
    isConnected,
    campingSchedules,
    cabinSchedules,
    cabins,
    campingSites,
    dishes
  }
})