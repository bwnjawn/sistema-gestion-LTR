// src/types/domain.ts

// 1. Tipos Canónicos del Sistema
export type ServiceType = 'cabana' | 'camping' | 'restaurante'
export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled'
export type CampingModality = 'diario' | 'pernoctar'
export type SideDishMode = 'none' | 'fixed' | 'choice'
export type ClientType = 'Particular' | 'Empresa' | 'Organización' | 'Paseo escolar' | 'Institución'
export type PaymentMethod = 'transferencia' | 'efectivo' | 'debito'

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
  /** Comida a la que pertenece el plato (desayuno, almuerzo, once). */
  mealType?: string
  /** Acompañamiento fijo del plato, si tiene. */
  fixedSide?: string
  /** Cantidad elegida por acompañamiento. */
  sides?: Record<string, number>
  sideSelection?: string
}

/** Pago registrado por el administrador sobre una solicitud. */
export interface Payment {
  id: string
  amount: number
  method: PaymentMethod
  /** Fecha en que se recibió el pago (YYYY-MM-DD). */
  paidOn: string
  notes?: string
  createdAt: string
}

/** Desglose de precio guardado al enviar la solicitud. */
export interface RequestPricing {
  subtotal: number
  ivaAmount: number
  ivaPercentage: number
  depositPercentage: number
  nights: number
}

/** Horario vigente al momento de la solicitud. */
export interface RequestSchedule {
  checkIn: string
  checkOut: string
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
  /** Abono que el cliente debe transferir para asegurar la reserva. */
  depositRequired: number
  /** Pagos efectivamente recibidos. El abono pagado se calcula desde aquí. */
  payments: Payment[]
  status: BookingStatus
  createdAt: string
  /**
   * Hasta cuándo debe llegar el abono (ISO), solo en solicitudes pendientes: corre desde que se envía
   * la solicitud (SCRUM-264). Si vence sin el abono, se marca "Abono vencido"; el admin decide qué hacer.
   * Las confirmadas y las que no exigen abono no tienen plazo.
   */
  depositDueAt?: string
  details?: {
    comments?: string
    selectedMeals?: SelectedMealPayload[]
    clientType?: ClientType
    resourceId?: string
    startDate?: string
    endDate?: string
    campingType?: CampingModality
    selectedMealTypes?: string[]
    mealTimes?: Record<string, string>
    pricing?: RequestPricing
    schedule?: RequestSchedule
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

/** Datos bancarios que ve el cliente en el paso 4 para transferir el abono. */
export interface TransferInfo {
  bank: string
  accountType: string
  accountNumber: string
  holderName: string
  holderRut: string
  email: string
}

export interface BusinessParameters {
  defaultDepositPercentage: number
  /** Horas que tiene el cliente para abonar desde que el admin confirma. */
  depositDeadlineHours?: number
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