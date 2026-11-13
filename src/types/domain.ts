// src/types/domain.ts

// 1. Tipos Canónicos del Sistema
/**
 * `piscina` (SCRUM-44) es una solicitud solo informativa: queda confirmada al enviarse, sin abono ni plazo,
 * y no bloquea fechas ni cupos de nada.
 */
export type ServiceType = 'cabana' | 'camping' | 'restaurante' | 'piscina'
export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled'
export type CampingModality = 'diario' | 'pernoctar'
/** Modalidades que admite un espacio de camping: una de las dos o ambas. */
export type CampingSiteModality = CampingModality | 'ambos'
/** Las tres comidas del restaurante. Siempre en minúscula; la etiqueta para mostrar sale de `ETIQUETAS_COMIDA`. */
export type MealType = 'desayuno' | 'almuerzo' | 'once'
export type SideDishMode = 'none' | 'fixed' | 'choice'
export type ClientType = 'Particular' | 'Empresa' | 'Organización' | 'Paseo escolar' | 'Institución'
export type PaymentMethod = 'transferencia' | 'efectivo' | 'debito'

// 2. Cabañas
export interface CabinFeatureObj {
  text?: string
  name?: string
  icon?: string
}

/** Forma antigua de una característica; hoy se guarda solo el texto. Solo la lee la migración del catálogo. */
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
  features?: string[]
  /** Borrado lógico: una cabaña inactiva no aparece en ninguna parte, pero las reservas que la usaron la conservan. */
  isActive: boolean
  /**
   * Marca de servicio o mantención (SCRUM-266): mientras esté activa, la cabaña no se ofrece para nuevas
   * reservas, ni al cliente ni al administrador. No tiene fechas; las reservas existentes no cambian.
   */
  enMantencion?: boolean
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
  modality: CampingSiteModality
  image?: string
  images?: string[]
  features?: string[]
  /** Borrado lógico (ver `Cabin.isActive`). */
  isActive: boolean
}

// 4. Restaurante
export interface Dish {
  id: string
  name: string
  price: number
  description?: string
  mealType: MealType
  /** `none`: sin acompañamiento · `fixed`: uno fijo (`fixedSide`) · `choice`: el cliente elige entre `availableSides`. */
  sideMode: SideDishMode
  /** Acompañamientos entre los que elige el cliente (solo con `sideMode: 'choice'`). */
  availableSides: string[]
  /** Acompañamiento incluido (solo con `sideMode: 'fixed'`). */
  fixedSide?: string
  image?: string
  /** Borrado lógico (ver `Cabin.isActive`). */
  isActive: boolean
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
  /** Comida a la que pertenece el plato. */
  mealType?: MealType
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

// 5b. Modelo de reserva para la base de datos (SCRUM-245)
// Es la forma que tendrá una reserva en Supabase (ver docs/supabase-esquema.md). Las vistas siguen usando
// `ReservationRequest`; `services/adaptadoresReserva.ts` convierte entre ambos en el borde del repositorio.

/** Un plato elegido dentro de una comida, con la copia del nombre y el precio al momento de reservar. */
export interface BookingItem {
  /** Plato del catálogo; queda nulo si el plato ya no existe. */
  dishId: string | null
  name: string
  unitPrice: number
  quantity: number
  fixedSide?: string
  /** Cantidad elegida por acompañamiento. */
  sides: Record<string, number>
}

/** Una comida de la reserva de restaurante: su hora y los platos elegidos para ella. */
export interface BookingMeal {
  mealType: MealType
  /** Hora de la comida, `HH:MM`. */
  time: string
  items: BookingItem[]
}

export interface BookingPricing {
  subtotal: number
  ivaPercentage: number
  ivaAmount: number
  total: number
  depositPercentage: number
  /** Abono exigido; 0 si el cliente está exento (Institución en restaurante). */
  depositRequired: number
}

export type BookingOrigin = 'cliente' | 'admin'

export interface Booking {
  id: string
  /** `SOL-…` si la envió el cliente, `ADM-…` si la cargó el admin. */
  code: string
  origin: BookingOrigin
  type: ServiceType
  status: BookingStatus
  clientName: string
  clientPhone: string
  clientEmail?: string
  /** Solo restaurante. */
  clientType?: ClientType
  /** Solo cabaña. */
  cabinId?: string
  /** Solo camping. */
  campingSiteId?: string
  /** Solo camping. */
  campingModality?: CampingModality
  /** `YYYY-MM-DD`. */
  startDate: string
  /** `YYYY-MM-DD`. En cabañas es la salida (el día no cuenta como ocupado); en el resto, igual a `startDate`. */
  endDate: string
  guestsCount: number
  /** Horario vigente al reservar (cabaña y camping), `HH:MM`. */
  checkInTime?: string
  checkOutTime?: string
  comments?: string
  pricing: BookingPricing
  /** Plazo del abono (ISO); solo pendientes que exigen abono. */
  depositDueAt?: string
  /** Solo restaurante: una entrada por comida elegida. */
  meals: BookingMeal[]
  payments: Payment[]
  /** Varias cabañas de una misma familia (SCRUM-265). */
  groupId?: string
  /** Sin conexión: choca con una confirmada y espera que el admin lo resuelva (SCRUM-250). */
  inConflict: boolean
  createdAt: string
  updatedAt: string
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