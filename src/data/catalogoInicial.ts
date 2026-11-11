// src/data/catalogoInicial.ts
// Datos semilla del catálogo: lo que ve la app la primera vez, antes de que el admin lo edite.
// Todos los id deben ser UUID válidos (una columna `uuid` de Postgres rechaza cualquier otro valor):
// lo comprueba tests/migracionIds.test.ts. Los id antiguos de platos se migran en services/migracionIds.ts.

import type { Cabin, CampingSite, Dish } from '../types/domain'

export const DEFAULT_CABINS: Cabin[] = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Cabaña 6',
    capacity: 6,
    pricePerNight: 65000,
    bedsDescription: '1 Cama Matrimonial + 2 Literas',
    description: 'Cabaña acogedora completamente equipada con vista al bosque y estufa a leña.',
    mainImage: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80'],
    features: ['Cocina equipada', 'Estufa a leña', 'Estacionamiento', 'TV Cable'],
    enMantencion: false,
    isActive: true
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
    features: ['Cocina equipada', 'Terraza privada', 'Estufa a leña', 'Estacionamiento'],
    enMantencion: false,
    isActive: true
  }
]

export const DEFAULT_CAMPING: CampingSite[] = [
  {
    id: 'c2fecb99-9c0b-4ef8-bb6d-6bb9bd380a33',
    name: 'Camping Zona General',
    description: 'Espacio rodeado de naturaleza con acceso a baños, duchas con agua caliente, piscinas y zona de río.',
    pricePerPerson: 10000,
    minCapacity: 1,
    maxCapacity: 9,
    isSpecial: false,
    modality: 'ambos',
    image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80'],
    features: ['Agua caliente', 'Piscinas', 'Acceso al río', 'Sombra nativa'],
    isActive: true
  },
  {
    id: 'd3fecb99-9c0b-4ef8-bb6d-6bb9bd380a44',
    name: 'Espacio Grupos Grandes / Días de Campo',
    description: 'Zona exclusiva reservada para delegaciones, colegios y grupos familiares de 10 a 150 personas con terraza privada.',
    pricePerPerson: 10000,
    minCapacity: 10,
    maxCapacity: 150,
    isSpecial: true,
    modality: 'ambos',
    image: 'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?auto=format&fit=crop&w=800&q=80'],
    features: ['Terraza privada', 'Zona exclusiva', 'Cancha multiuso', 'Parrillas grupales'],
    isActive: true
  }
]

export const DEFAULT_DISHES: Dish[] = [
  {
    id: 'e4fecb99-9c0b-4ef8-bb6d-6bb9bd380a55',
    name: 'Asado de Cordero y Cerdo',
    price: 20000,
    description: 'Acompañado de papas al vapor, buffet de ensaladas y postre.',
    mealType: 'almuerzo',
    sideMode: 'choice',
    availableSides: ['Papas al vapor', 'Puré de papas', 'Ensalada surtida'],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    isActive: true
  },
  {
    id: 'f5fecb99-9c0b-4ef8-bb6d-6bb9bd380a66',
    name: 'Vacuno con salsa bechamel',
    price: 21000,
    description: 'Papas rústicas, buffet de ensaladas y postre.',
    mealType: 'almuerzo',
    sideMode: 'choice',
    availableSides: ['Papas rústicas', 'Puré de papas', 'Arroz con verduras', 'Ensalada surtida'],
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    isActive: true
  },
  {
    id: 'a6fecb99-9c0b-4ef8-bb6d-6bb9bd380a77',
    name: 'Salmón con salsa de camarones',
    price: 21000,
    description: 'Acompañado con puré, buffet de ensaladas y pan amasado.',
    mealType: 'almuerzo',
    sideMode: 'choice',
    availableSides: ['Puré de papas', 'Papas rústicas', 'Arroz con verduras'],
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    isActive: true
  },
  {
    id: 'b7fecb99-9c0b-4ef8-bb6d-6bb9bd380a88',
    name: 'Chuletas de cerdo con puré',
    price: 13000,
    description: 'Buffet de ensaladas, pan amasado y postre.',
    mealType: 'almuerzo',
    sideMode: 'fixed',
    availableSides: [],
    fixedSide: 'Puré de papas y ensaladas',
    image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=800&q=80',
    isActive: true
  },
  {
    id: 'c8fecb99-9c0b-4ef8-bb6d-6bb9bd380a99',
    name: 'Desayuno Campestre Tradicional',
    price: 10800,
    description: 'Pan amasado, mermelada casera, mantequilla, huevos de campo y té/café.',
    mealType: 'desayuno',
    sideMode: 'fixed',
    availableSides: [],
    fixedSide: 'Pan amasado y mermeladas',
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80',
    isActive: true
  },
  {
    id: 'd9fecb99-9c0b-4ef8-bb6d-6bb9bd380b00',
    name: 'Once Campestre Sureña',
    price: 12000,
    description: 'Sopaipillas pasadas, kuchen casero, queso fresco y café/té/mate.',
    mealType: 'once',
    sideMode: 'fixed',
    availableSides: [],
    fixedSide: 'Sopaipillas y kuchen',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    isActive: true
  }
]

export const DEFAULT_GLOBAL_SIDES: string[] = [
  'Papas al vapor',
  'Papas rústicas',
  'Puré de papas',
  'Arroz con verduras',
  'Ensalada surtida',
  'Ensalada a la chilena'
]
