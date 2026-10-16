// src/types/domain.ts

// 1. Tipos Canónicos del Sistema
export type ServiceType = 'cabana' | 'camping' | 'restaurante'
export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled'
export type CampingModality = 'diario' | 'pernoctar'
export type SideDishMode = 'none' | 'fixed' | 'choice'

// 2. Cabañas
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

// 3. Camping
export interface CampingSite {
  id: string
  name: string
  description?: string
  pricePerPerson: number
  minCapacity: number
  maxCapacity: number
  isSpecial: boolean
  modality: CampingModality | string
  image?: string
  images?: string[]
  features?: string[]
}

// 4. Restaurante
export interface Dish {
  id: string
  name: string
  price: number
  description?: string
  mealCategory?: 'Desayuno' | 'Almuerzo' | 'Once' | string
  hasSelectableSides?: boolean
  sideMode?: SideDishMode
  availableSides?: string[]
  availableSideDishes?: string[]
  fixedSide?: string
  image?: string
  mainImage?: string
}

export interface GlobalSideDish {
  id: string
  name: string
}

// 5. Solicitudes y Reservas
export interface SelectedMealPayload {
  id: string
  name: string
  price: number
  quantity: number
  sideSelection?: string
}

export interface ReservationRequest {
  id: string
  requestCode: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  type: ServiceType
  resourceName: string
  date: string
  timeOrDuration?: string
  guestsCount: number
  totalAmount: number
  depositAmount: number
  status: BookingStatus
  createdAt: string
  details?: {
    comments?: string
    selectedMeals?: SelectedMealPayload[]
    [key: string]: any
  }
}

// 6. Información del Negocio y Configuración
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

export interface BusinessParameters {
  defaultDepositPercentage: number
  marginPercentage: number
  currentDate: string
  isConnected: boolean
}

export interface AdminUser {
  id: string
  email: string
  name?: string
  role: 'owner' | 'admin' | 'staff'
  createdAt?: string
}