import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Dish {
 id: string
 name: string
 price: number
 description?: string
 mealCategory?: string
 hasSelectableSides?: boolean
 availableSides?: string[]
 availableSideDishes?: string[]
 fixedSide?: string
 image?: string
 mainImage?: string
}

export interface CabinFeatureObj {
 text?: string
 name?: string
 icon?: string
}

export type CabinFeature = string | CabinFeatureObj

export interface Cabin {
 id: string
 name: string
 capacity: number
 pricePerNight: number
 bedsDescription?: string
 description?: string
 mainImage?: string
 images?: string[]
 features?: CabinFeature[]
}

export interface CampingSite {
 id: string
 name: string
 description?: string
 pricePerPerson: number
 minCapacity: number
 maxCapacity: number
 isSpecial: boolean
 modality: string
 image?: string
 images?: string[]
 features?: string[]
}

export interface BusinessInfo {
 phone1: string
 phone2: string
 email: string
 websiteDisplay: string
 websiteUrl: string
 instagramUser: string
 instagramUrl: string
 address: string
 mapsUrl: string
 iframeMapUrl: string
}

export const useAdminStore = defineStore('admin', () => {
 // Parámetros Generales Editables
 const defaultDepositPercentage = ref(30)
 const marginPercentage = ref(10)
 const currentDate = ref('Miércoles 21 de Octubre')
 const isConnected = ref(true)

 // Información de Contacto Reactiva
 const contactInfo = ref({
   phone1: '+56 9 8502 5056',
   phone2: '+56 9 9588 3385',
   email: 'lostroncosderepil@gmail.com',
   websiteDisplay: 'www.lostroncosderepil.cl',
   websiteUrl: 'https://www.lostroncosderepil.cl',
   instagramUser: '@lostroncosderepil',
   instagramUrl: 'https://instagram.com/lostroncosderepil',
   address: 'Sector Repil s/n, Comuna de Fresia, Región de Los Lagos, Chile',
   mapsUrl: 'https://maps.google.com/?q=-41.1500,-73.4167',
   iframeMapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30000!2d-73.4167!3d41.1500!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDA5JzAwLjAiUyA3M8KwMjUnMDAuMCJX!5e0!3m2!1ses!2scl!4v162000000000'
 })

 const phone1Clean = computed(() => contactInfo.value.phone1.replace(/\s+/g, ''))
 const phone2Clean = computed(() => contactInfo.value.phone2.replace(/\s+/g, ''))

 // Horarios
 const restaurantSchedules = ref({
   desayuno: { start: '08:30', end: '11:00', times: ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00'] },
   almuerzo: { start: '12:30', end: '14:00', times: ['12:30', '13:00', '13:30', '14:00'] },
   once: { start: '17:00', end: '19:30', times: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30'] }
 })

 const campingSchedules = ref({
   diario: { checkIn: '09:00', checkOut: '19:30', display: 'Día de ingreso (09:00 hrs) - Día de ingreso (19:30 hrs)' },
   pernoctar: { checkIn: '12:00', checkOut: '11:00', display: 'Día de ingreso (12:00 hrs) - Día de salida (11:00 hrs)' }
 })

 const cabinSchedules = ref({
   checkIn: '15:00',
   checkOut: '11:00',
   display: 'Día de ingreso (15:00 hrs) - Día de salida (11:00 hrs)'
 })

 // Cabañas
 const cabins = ref([
   {
     id: 'cabana-1',
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
     id: 'cabana-2',
     name: 'Cabaña 8',
     capacity: 8,
     pricePerNight: 120000,
     bedsDescription: '2 Camas Matrimoniales + 2 Literas',
     description: 'Cabaña amplia ideal para familias o grupos grandes con terraza privada.',
     mainImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
     images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'],
     features: ['Cocina equipada', 'Terraza privada', 'Estufa a leña', 'Estacionamiento']
   }
 ])

 // Camping
 const campingSites = ref([
   {
     id: 'cmp-normal',
     name: 'Camping Zona General',
     description: 'Espacio rodeado de naturaleza con acceso a baños, duchas con agua caliente, piscinas y zona de río.',
     pricePerPerson: 10000,
     minCapacity: 1,
     maxCapacity: 9,
     isSpecial: false,
     modality: 'pernoctar',
     image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
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
     modality: 'diario',
     image: 'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?auto=format&fit=crop&w=800&q=80',
     features: ['Terraza privada', 'Zona exclusiva', 'Cancha multiuso', 'Parrillas grupales']
   }
 ])

 // Acompañamientos Globales
 const globalSideDishes = ref([
   'Papas al vapor',
   'Papas rústicas',
   'Puré de papas',
   'Arroz con verduras',
   'Ensalada surtida',
   'Ensalada a la chilena'
 ])
 const sideDishes = globalSideDishes

 // Platos
 const dishes = ref([
   {
     id: 'd1',
     name: 'Asado de Cordero y Cerdo',
     price: 20000,
     description: 'Acompañado de papas al vapor, buffet de ensaladas y postre.',
     mealCategory: 'Almuerzo',
     image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
     hasSelectableSides: true,
     availableSides: ['Papas al vapor', 'Puré de papas', 'Ensalada surtida'],
     availableSideDishes: ['Papas al vapor', 'Puré de papas', 'Ensalada surtida']
   },
   {
     id: 'd2',
     name: 'Vacuno con salsa bechamel',
     price: 21000,
     description: 'Papas rústicas, buffet de ensaladas y postre.',
     mealCategory: 'Almuerzo',
     image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
     hasSelectableSides: true,
     availableSides: ['Papas rústicas', 'Puré de papas', 'Arroz con verduras', 'Ensalada surtida'],
     availableSideDishes: ['Papas rústicas', 'Puré de papas', 'Arroz con verduras', 'Ensalada surtida']
   },
   {
     id: 'd3',
     name: 'Salmón con salsa de camarones',
     price: 21000,
     description: 'Acompañado con puré, buffet de ensaladas y pan amasado.',
     mealCategory: 'Almuerzo',
     image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
     hasSelectableSides: true,
     availableSides: ['Puré de papas', 'Papas rústicas', 'Arroz con verduras'],
     availableSideDishes: ['Puré de papas', 'Papas rústicas', 'Arroz con verduras']
   },
   {
     id: 'd4',
     name: 'Chuletas de cerdo con puré',
     price: 13000,
     description: 'Buffet de ensaladas, pan amasado y postre.',
     mealCategory: 'Almuerzo',
     image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=800&q=80',
     hasSelectableSides: false,
     fixedSide: 'Puré de papas y ensaladas'
   },
   {
     id: 'd5',
     name: 'Desayuno Campestre Tradicional',
     price: 10800,
     description: 'Pan amasado, mermelada casera, mantequilla, huevos de campo y té/café.',
     mealCategory: 'Desayuno',
     image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80',
     hasSelectableSides: false,
     fixedSide: 'Pan amasado y mermeladas'
   },
   {
     id: 'd6',
     name: 'Once Campestre Sureña',
     price: 12000,
     description: 'Sopaipillas pasadas, kuchen casero, queso fresco y café/té/mate.',
     mealCategory: 'Once',
     image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
     hasSelectableSides: false,
     fixedSide: 'Sopaipillas y kuchen'
   }
 ])

 // ACCIONES
 async function updateContactInfo(info: Partial<BusinessInfo>) {
   contactInfo.value = { ...contactInfo.value, ...info }
 }

 async function updateCategorySchedules(params: {
   depositPercentage?: number
   marginPct?: number
   cabinCheckIn?: string
   cabinCheckOut?: string
   campingDiarioIn?: string
   campingDiarioOut?: string
   campingPernoctarIn?: string
   campingPernoctarOut?: string
   desayunoStart?: string
   desayunoEnd?: string
   almuerzoStart?: string
   almuerzoEnd?: string
   onceStart?: string
   onceEnd?: string
 }) {
   if (params.depositPercentage !== undefined) defaultDepositPercentage.value = params.depositPercentage
   if (params.marginPct !== undefined) marginPercentage.value = params.marginPct
   if (params.cabinCheckIn && params.cabinCheckOut) {
     cabinSchedules.value.checkIn = params.cabinCheckIn
     cabinSchedules.value.checkOut = params.cabinCheckOut
     cabinSchedules.value.display = `Día de ingreso (${params.cabinCheckIn} hrs) - Día de salida (${params.cabinCheckOut} hrs)`
   }
   if (params.campingDiarioIn && params.campingDiarioOut) {
     campingSchedules.value.diario.checkIn = params.campingDiarioIn
     campingSchedules.value.diario.checkOut = params.campingDiarioOut
     campingSchedules.value.diario.display = `Día de ingreso (${params.campingDiarioIn} hrs) - Día de ingreso (${params.campingDiarioOut} hrs)`
   }
   if (params.campingPernoctarIn && params.campingPernoctarOut) {
     campingSchedules.value.pernoctar.checkIn = params.campingPernoctarIn
     campingSchedules.value.pernoctar.checkOut = params.campingPernoctarOut
     campingSchedules.value.pernoctar.display = `Día de ingreso (${params.campingPernoctarIn} hrs) - Día de salida (${params.campingPernoctarOut} hrs)`
   }
   if (params.desayunoStart && params.desayunoEnd) {
     restaurantSchedules.value.desayuno.start = params.desayunoStart
     restaurantSchedules.value.desayuno.end = params.desayunoEnd
   }
   if (params.almuerzoStart && params.almuerzoEnd) {
     restaurantSchedules.value.almuerzo.start = params.almuerzoStart
     restaurantSchedules.value.almuerzo.end = params.almuerzoEnd
   }
   if (params.onceStart && params.onceEnd) {
     restaurantSchedules.value.once.start = params.onceStart
     restaurantSchedules.value.once.end = params.onceEnd
   }
 }

 async function addDish(dishData: Partial<Dish>) {
   const newDish: Dish = {
     id: `dish-${Date.now()}`,
     name: dishData.name || 'Nuevo Plato',
     price: dishData.price || 0,
     description: dishData.description || '',
     mealCategory: dishData.mealCategory || 'Almuerzo',
     hasSelectableSides: dishData.hasSelectableSides ?? true,
     availableSides: dishData.availableSides || [],
     availableSideDishes: dishData.availableSideDishes || [],
     fixedSide: dishData.fixedSide || '',
     image: dishData.image || dishData.mainImage || '',
     mainImage: dishData.mainImage || dishData.image || ''
   }
   dishes.value.push(newDish)
   return newDish
 }

 async function updateDish(id: string, updated: Partial<Dish>) {
   const idx = dishes.value.findIndex(d => d.id === id)
   if (idx !== -1) {
     dishes.value[idx] = {
       ...dishes.value[idx],
       ...updated
     }
   }
 }

 async function deleteDish(id: string) {
   dishes.value = dishes.value.filter(d => d.id !== id)
 }

 async function addCabin(cabinData: Partial<Cabin>) {
   const newCabin: Cabin = {
     id: `cabana-${Date.now()}`,
     name: cabinData.name || 'Nueva Cabaña',
     capacity: cabinData.capacity || 1,
     pricePerNight: cabinData.pricePerNight || 0,
     bedsDescription: cabinData.bedsDescription || '',
     description: cabinData.description || '',
     mainImage: cabinData.mainImage || '',
     images: cabinData.images || [],
     features: cabinData.features || []
   }
   cabins.value.push(newCabin)
   return newCabin
 }

 async function updateCabin(id: string, updated: Partial<Cabin>) {
   const idx = cabins.value.findIndex(c => c.id === id)
   if (idx !== -1) {
     cabins.value[idx] = {
       ...cabins.value[idx],
       ...updated
     }
   }
 }

 async function deleteCabin(id: string) {
   cabins.value = cabins.value.filter(c => c.id !== id)
 }

 async function addCampingSite(siteData: Partial<CampingSite>) {
   const newSite: CampingSite = {
     id: `cmp-${Date.now()}`,
     name: siteData.name || 'Nuevo Sitio Camping',
     description: siteData.description || '',
     pricePerPerson: siteData.pricePerPerson || 0,
     minCapacity: siteData.minCapacity ?? 1,
     maxCapacity: siteData.maxCapacity ?? 10,
     isSpecial: siteData.isSpecial ?? false,
     modality: siteData.modality || 'pernoctar',
     image: siteData.image || '',
     images: siteData.images || [],
     features: siteData.features || []
   }
   campingSites.value.push(newSite)
   return newSite
 }

 async function updateCampingSite(id: string, updated: Partial<CampingSite>) {
   const idx = campingSites.value.findIndex(s => s.id === id)
   if (idx !== -1) {
     campingSites.value[idx] = {
       ...campingSites.value[idx],
       ...updated
     }
   }
 }

 async function deleteCampingSite(id: string) {
   campingSites.value = campingSites.value.filter(s => s.id !== id)
 }

 async function addGlobalSideDish(name: string) {
   const trimmed = name.trim()
   if (trimmed && !globalSideDishes.value.includes(trimmed)) {
     globalSideDishes.value.push(trimmed)
   }
 }

 async function deleteGlobalSideDish(name: string) {
   globalSideDishes.value = globalSideDishes.value.filter(s => s !== name)
 }

 return {
   defaultDepositPercentage,
   marginPercentage,
   currentDate,
   isConnected,
   contactInfo,
   phone1Clean,
   phone2Clean,
   restaurantSchedules,
   campingSchedules,
   cabinSchedules,
   cabins,
   campingSites,
   globalSideDishes,
   sideDishes,
   dishes,
   updateContactInfo,
   updateCategorySchedules,
   addDish,
   updateDish,
   deleteDish,
   addCabin,
   updateCabin,
   deleteCabin,
   addCampingSite,
   updateCampingSite,
   deleteCampingSite,
   addGlobalSideDish,
   deleteGlobalSideDish
 }
})