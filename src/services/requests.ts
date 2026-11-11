// src/services/requests.ts
// Normalización de solicitudes guardadas y armado de la información que ve el administrador.

import type {
  BookingStatus,
  Cabin,
  CampingModality,
  CampingSite,
  ClientType,
  Payment,
  RequestSchedule,
  ReservationRequest,
  SelectedMealPayload,
  ServiceType
} from '../types/domain'
import { formatDateLong, isPastDate, nightsBetween } from '../lib/dates'
import { hasUsablePhone } from '../lib/contactLinks'
import { isCabinAvailable, validateGuestCapacity } from './availability'
import { isMoveDayBlocked, isMoveStayBlocked, type CapacidadesCambioFecha } from './cambioFecha'
import { calculateBookingPrice, type PriceBreakdown, type PriceRates } from './pricing'
import { formatCLP } from '../lib/format'
import { generateUUID } from '../lib/id'

// ---------------------------------------------------------------------------
// Normalización de datos guardados con formatos anteriores
// ---------------------------------------------------------------------------

const TIPOS_ANTIGUOS: Record<string, ServiceType> = {
  cabaña: 'cabana',
  cabana: 'cabana',
  camping: 'camping',
  restaurant: 'restaurante',
  restaurante: 'restaurante'
}

const ESTADOS_ANTIGUOS: Record<string, BookingStatus> = {
  pendiente: 'pending',
  pending: 'pending',
  confirmada: 'confirmed',
  confirmed: 'confirmed',
  rechazada: 'rejected',
  rejected: 'rejected',
  cancelada: 'cancelled',
  cancelled: 'cancelled'
}

/**
 * Lleva una solicitud guardada con un formato anterior al formato actual:
 * - tipos y estados con nombres antiguos,
 * - `depositAmount` (que era el abono exigido) pasa a `depositRequired`,
 * - `details.extraPaid` (número suelto) pasa a un pago registrado,
 * - fechas de entrada y salida dentro de `details`.
 * No modifica el objeto recibido.
 */
export function normalizeRequest(raw: any): ReservationRequest {
  const type = TIPOS_ANTIGUOS[String(raw.type || '').toLowerCase()] ?? 'cabana'
  const status = ESTADOS_ANTIGUOS[String(raw.status || '').toLowerCase()] ?? 'pending'

  const details = { ...(raw.details || {}) }
  if (!details.startDate && raw.date) details.startDate = raw.date
  if (!details.endDate && /^\d{4}-\d{2}-\d{2}$/.test(raw.timeOrDuration || '')) {
    details.endDate = raw.timeOrDuration
  }

  let payments: Payment[] = Array.isArray(raw.payments) ? raw.payments : []
  if (!Array.isArray(raw.payments) && Number(details.extraPaid) > 0) {
    payments = [{
      id: generateUUID(),
      amount: Number(details.extraPaid),
      method: 'transferencia',
      paidOn: String(raw.createdAt || '').slice(0, 10),
      notes: 'Pago registrado antes de la actualización del sistema',
      createdAt: raw.createdAt || new Date().toISOString()
    }]
  }
  delete details.extraPaid

  const { depositAmount, ...rest } = raw
  return {
    ...rest,
    type,
    status,
    depositRequired: raw.depositRequired ?? depositAmount ?? 0,
    payments,
    details
  } as ReservationRequest
}

// ---------------------------------------------------------------------------
// Información ordenada para el administrador
// ---------------------------------------------------------------------------

export const SERVICE_LABELS: Record<ServiceType, string> = {
  cabana: 'Cabaña',
  camping: 'Camping',
  restaurante: 'Restaurante'
}

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada'
}

const MEAL_ORDER = ['desayuno', 'almuerzo', 'once']
const MEAL_LABELS: Record<string, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  once: 'Once'
}

export interface InfoRow {
  label: string
  value: string
  /** Texto secundario bajo el valor. */
  hint?: string
}

export interface MealItemView {
  name: string
  quantity: number
  /** Ej.: "Papas fritas ×2", "Ensalada ×1" o "Acompañamiento fijo: arroz". */
  sidesText: string
  subtotal: string
}

export interface MealGroupView {
  key: string
  label: string
  time: string
  items: MealItemView[]
}

export interface RequestView {
  serviceLabel: string
  statusLabel: string
  /** Título de la sección de fechas: "Fechas" o "Fecha de la visita". */
  stayTitle: string
  /** "4 personas" o "12 comensales". */
  guestsLabel: string
  /** Fechas principales: Llegada y Salida (estadía) o Fecha (visita de un día). */
  stayDates: InfoRow[]
  /** Dato que resume las fechas, fuera de las cajas: Noches (estadía) u Horario (camping de día). */
  staySummary?: InfoRow
  /** Filas con el detalle del servicio (cabaña, espacio o mesa). */
  serviceRows: InfoRow[]
  meals: MealGroupView[]
  priceRows: InfoRow[]
}

function guestsText(count: number, type: ServiceType): string {
  if (type === 'restaurante') return `${count} ${count === 1 ? 'comensal' : 'comensales'}`
  return `${count} ${count === 1 ? 'persona' : 'personas'}`
}

function buildMealGroups(req: ReservationRequest): MealGroupView[] {
  const meals: SelectedMealPayload[] = req.details?.selectedMeals || []
  const times = req.details?.mealTimes || {}
  const groups = new Map<string, MealGroupView>()

  for (const meal of meals) {
    const key = (meal.mealType || 'platos').toLowerCase()
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: MEAL_LABELS[key] || 'Platos',
        time: times[key] ? `${times[key]} hrs` : '',
        items: []
      })
    }

    const sides = Object.entries(meal.sides || {}).filter(([, count]) => count > 0)
    let sidesText = ''
    if (sides.length > 0) sidesText = sides.map(([name, count]) => `${name} ×${count}`).join(', ')
    else if (meal.fixedSide) sidesText = `Acompañamiento fijo: ${meal.fixedSide}`

    groups.get(key)!.items.push({
      name: meal.name,
      quantity: meal.quantity,
      sidesText,
      subtotal: formatCLP(meal.price * meal.quantity)
    })
  }

  return [...groups.values()].sort((a, b) => {
    const ia = MEAL_ORDER.indexOf(a.key)
    const ib = MEAL_ORDER.indexOf(b.key)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
}

export function describeRequest(req: ReservationRequest): RequestView {
  const details = req.details || {}
  const start = details.startDate || req.date
  const end = details.endDate || ''
  const nights = nightsBetween(start, end)
  const isDayVisit = req.type === 'restaurante' || (req.type === 'camping' && details.campingType === 'diario')

  const stayDates: InfoRow[] = []
  let staySummary: InfoRow | undefined
  let stayTitle = 'Fechas'

  if (isDayVisit) {
    stayTitle = 'Fecha de la visita'
    stayDates.push({ label: 'Fecha', value: formatDateLong(start) })
    if (req.type === 'camping' && details.schedule) {
      staySummary = { label: 'Horario', value: `${details.schedule.checkIn} a ${details.schedule.checkOut} hrs` }
    }
  } else {
    stayDates.push({
      label: 'Llegada',
      value: formatDateLong(start),
      hint: details.schedule ? `Desde las ${details.schedule.checkIn} hrs` : undefined
    })
    stayDates.push({
      label: 'Salida',
      value: formatDateLong(end),
      hint: details.schedule ? `Hasta las ${details.schedule.checkOut} hrs` : undefined
    })
    staySummary = { label: 'Noches', value: nights > 0 ? String(nights) : '-' }
  }

  const serviceRows: InfoRow[] = [
    { label: 'Servicio', value: SERVICE_LABELS[req.type] },
    {
      label: req.type === 'cabana' ? 'Cabaña' : req.type === 'camping' ? 'Espacio' : 'Reserva',
      value: req.resourceName
    },
    { label: req.type === 'restaurante' ? 'Comensales' : 'Personas', value: guestsText(req.guestsCount, req.type) }
  ]
  if (req.type === 'camping') {
    serviceRows.push({
      label: 'Modalidad',
      value: details.campingType === 'diario' ? 'Día de campo (sin pernoctar)' : 'Pernoctar'
    })
  }
  if (req.type === 'restaurante') {
    const meals = (details.selectedMealTypes || []).filter(Boolean)
    if (meals.length > 0) {
      serviceRows.push({
        label: 'Comidas',
        value: [...meals]
          .sort((a, b) => MEAL_ORDER.indexOf(a) - MEAL_ORDER.indexOf(b))
          .map(m => MEAL_LABELS[m] || m)
          .join(', ')
      })
    }
  }
  if (details.clientType) {
    serviceRows.push({ label: 'Tipo de cliente', value: details.clientType })
  }

  const priceRows: InfoRow[] = []
  if (details.pricing) {
    const p = details.pricing
    priceRows.push({ label: 'Subtotal', value: formatCLP(p.subtotal) })
    priceRows.push({ label: `IVA (${p.ivaPercentage}%)`, value: formatCLP(p.ivaAmount) })
  }
  priceRows.push({ label: 'Total con IVA', value: formatCLP(req.totalAmount) })

  return {
    serviceLabel: SERVICE_LABELS[req.type],
    statusLabel: STATUS_LABELS[req.status],
    stayTitle,
    guestsLabel: guestsText(req.guestsCount, req.type),
    stayDates,
    staySummary,
    serviceRows,
    meals: buildMealGroups(req),
    priceRows
  }
}

/**
 * Una solicitud pendiente que lleva 24 horas o más sin gestionarse.
 * Las que no exigen abono (institución) no alertan: no hay nada que esperar (SCRUM-264).
 */
export function isStalePending(
  req: Pick<ReservationRequest, 'status' | 'createdAt'> & Partial<Pick<ReservationRequest, 'depositRequired'>>,
  now: number = Date.now()
): boolean {
  if (req.status !== 'pending' || !req.createdAt) return false
  if (req.depositRequired === 0) return false
  const created = new Date(req.createdAt).getTime()
  if (isNaN(created)) return false
  return (now - created) / (1000 * 3600) >= 24
}

// ---------------------------------------------------------------------------
// Modificación de una solicitud por el administrador (SCRUM-59)
// ---------------------------------------------------------------------------

export interface RequestEdit {
  clientName: string
  clientPhone: string
  clientEmail: string
  guestsCount: number
  comments: string
  startDate: string
  /** Vacía en las visitas de un solo día (restaurante y camping de día). */
  endDate: string
}

export interface RequestEditContext {
  requests: ReservationRequest[]
  cabins: Cabin[]
  campingSites: CampingSite[]
  /** Porcentajes vigentes; solo se usan si la solicitud no guardó los suyos. */
  currentRates: PriceRates
  /** Cupos de restaurante y camping; sin ellos no se revisa el cupo al mover la fecha. */
  capacidades?: CapacidadesCambioFecha
}

export type RequestEditResult =
  | { ok: true; request: ReservationRequest }
  | { ok: false; message: string }

/** Solo se pueden modificar solicitudes vivas: pendientes o confirmadas. */
export function canEditRequest(req: Pick<ReservationRequest, 'status'>): boolean {
  return req.status === 'pending' || req.status === 'confirmed'
}

/** True si la solicitud es de un solo día (restaurante o camping sin pernoctar). */
export function isSingleDayRequest(req: Pick<ReservationRequest, 'type' | 'details'>): boolean {
  return req.type === 'restaurante' || (req.type === 'camping' && req.details?.campingType === 'diario')
}

/** Los datos que hoy tiene la solicitud, listos para precargar el formulario de edición. */
export function toRequestEdit(req: ReservationRequest): RequestEdit {
  return {
    clientName: req.clientName,
    clientPhone: req.clientPhone,
    clientEmail: req.clientEmail || '',
    guestsCount: req.guestsCount,
    comments: req.details?.comments || '',
    startDate: req.details?.startDate || req.date,
    endDate: isSingleDayRequest(req) ? '' : req.details?.endDate || ''
  }
}

/**
 * Valida los cambios y devuelve la solicitud ya modificada (sin tocar la original).
 * - Cambiar fechas o personas recalcula el total y el abono exigido con los porcentajes
 *   guardados en la solicitud, no con los actuales. Los pagos registrados se conservan.
 * - Una cabaña no puede quedar sobre otra reserva activa; la solicitud no choca consigo misma.
 * - Una fecha pasada solo se rechaza si el administrador la cambió.
 */
export function applyRequestEdit(
  req: ReservationRequest,
  edit: RequestEdit,
  ctx: RequestEditContext
): RequestEditResult {
  if (!canEditRequest(req)) {
    return { ok: false, message: 'Solo se pueden modificar solicitudes pendientes o confirmadas.' }
  }

  const original = toRequestEdit(req)
  const name = edit.clientName.trim()
  const email = edit.clientEmail.trim()
  const single = isSingleDayRequest(req)

  if (!name) return { ok: false, message: 'Escribe el nombre del cliente.' }
  if (!hasUsablePhone(edit.clientPhone)) return { ok: false, message: 'El teléfono está incompleto.' }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return { ok: false, message: 'El correo no es válido.' }
  if (!Number.isInteger(edit.guestsCount) || edit.guestsCount < 1) {
    return { ok: false, message: 'La cantidad de personas debe ser al menos 1.' }
  }

  const datesChanged = edit.startDate !== original.startDate || edit.endDate !== original.endDate
  const guestsChanged = edit.guestsCount !== original.guestsCount

  if (!edit.startDate) return { ok: false, message: 'Elige la fecha en el calendario.' }
  if (!single) {
    if (!edit.endDate) return { ok: false, message: 'Elige también la fecha de salida en el calendario.' }
    if (nightsBetween(edit.startDate, edit.endDate) < 1) {
      return { ok: false, message: 'La salida debe ser posterior a la llegada.' }
    }
  }
  if (datesChanged && isPastDate(edit.startDate)) {
    return { ok: false, message: 'No se puede mover la reserva a una fecha pasada.' }
  }

  const resourceId = req.details?.resourceId
  const cabin = req.type === 'cabana' ? ctx.cabins.find(c => c.id === resourceId) : undefined
  const site = req.type === 'camping' ? ctx.campingSites.find(s => s.id === resourceId) : undefined

  if (guestsChanged) {
    if (cabin) {
      const check = validateGuestCapacity(edit.guestsCount, 1, cabin.capacity)
      if (!check.isValid) return { ok: false, message: check.message! }
    }
    if (site) {
      const check = validateGuestCapacity(edit.guestsCount, site.minCapacity, site.maxCapacity)
      if (!check.isValid) return { ok: false, message: check.message! }
    }
  }

  if (datesChanged && req.type === 'cabana' && resourceId) {
    if (!isCabinAvailable(resourceId, edit.startDate, edit.endDate, ctx.requests, req.id)) {
      return { ok: false, message: 'Esa cabaña ya está reservada en esas fechas. Elige otras fechas.' }
    }
  }

  // Restaurante y camping: la fecha nueva no puede quedar sin cupo por reservas confirmadas
  if (datesChanged && ctx.capacidades && (req.type === 'restaurante' || req.type === 'camping')) {
    const sinCupo =
      isMoveDayBlocked(req, edit.startDate, ctx.requests, ctx.capacidades) ||
      (!single && isMoveStayBlocked(req, edit.startDate, edit.endDate, ctx.requests, ctx.capacidades))
    if (sinCupo) {
      return { ok: false, message: 'No queda cupo en esas fechas. Elige otras fechas.' }
    }
  }

  let totalAmount = req.totalAmount
  let depositRequired = req.depositRequired
  let pricing = req.details?.pricing

  // El restaurante cobra por platos, no por personas ni por fechas: su precio no se recalcula.
  const needsNewPrice = req.type !== 'restaurante' && (datesChanged || guestsChanged)
  if (needsNewPrice) {
    if (!cabin && !site) {
      return { ok: false, message: 'No se encontró la cabaña o el espacio original para recalcular el precio.' }
    }
    const rates: PriceRates = {
      ivaPercentage: pricing?.ivaPercentage ?? ctx.currentRates.ivaPercentage,
      depositPercentage: pricing?.depositPercentage ?? ctx.currentRates.depositPercentage
    }
    const price = calculateBookingPrice({
      ...rates,
      service: req.type,
      cabin,
      campingSite: site,
      checkInDate: edit.startDate,
      checkOutDate: edit.endDate,
      guestsCount: edit.guestsCount,
      campingType: req.details?.campingType ?? 'pernoctar',
      meals: []
    })
    if (!price || price.totalWithIva <= 0) {
      return { ok: false, message: 'No se pudo calcular el nuevo precio con esos datos.' }
    }
    totalAmount = price.totalWithIva
    depositRequired = price.depositAmount
    pricing = {
      subtotal: price.subtotal,
      ivaAmount: price.ivaAmount,
      ivaPercentage: rates.ivaPercentage,
      depositPercentage: rates.depositPercentage,
      nights: price.nights
    }
  }

  return {
    ok: true,
    request: {
      ...req,
      clientName: name,
      clientPhone: edit.clientPhone.trim(),
      clientEmail: email,
      guestsCount: edit.guestsCount,
      date: edit.startDate,
      timeOrDuration: single ? req.timeOrDuration : edit.endDate,
      totalAmount,
      depositRequired,
      details: {
        ...req.details,
        comments: edit.comments.trim(),
        startDate: edit.startDate,
        endDate: edit.endDate,
        pricing
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Armado de una solicitud desde el borrador del asistente (cliente y administrador)
// ---------------------------------------------------------------------------

export type OrigenSolicitud = 'cliente' | 'admin'

const PREFIJO_CODIGO: Record<OrigenSolicitud, string> = { cliente: 'SOL', admin: 'ADM' }

/**
 * Código de solicitud que no se repite con ninguno de los existentes.
 * `SOL-` para las del cliente y `ADM-` para las que carga el administrador.
 */
export function generateRequestCode(
  existentes: Iterable<string>,
  origen: OrigenSolicitud,
  aleatorio: () => number = Math.random
): string {
  const usados = new Set(existentes)
  const prefijo = PREFIJO_CODIGO[origen]
  for (let intento = 0; intento < 50; intento++) {
    const codigo = `${prefijo}-${Math.floor(100 + aleatorio() * 900)}`
    if (!usados.has(codigo)) return codigo
  }
  // Los códigos de 3 cifras se agotaron: pasa a 4 cifras, que es raro que choquen
  let n = 1000
  while (usados.has(`${prefijo}-${n}`)) n++
  return `${prefijo}-${n}`
}

export interface BorradorSolicitud {
  service: ServiceType
  checkInDate: string
  checkOutDate: string
  guestsCount: number
  campingType: CampingModality
  restaurantTime: string
  selectedMealTypes: string[]
  mealTimes: Record<string, string>
  selectedMeals: SelectedMealPayload[]
  clientType: ClientType
  clientName: string
  clientPhone: string
  clientEmail: string
  comments: string
  /** Cabaña o espacio de camping elegido; vacío en restaurante. */
  resourceId: string
  resourceName: string
  isSpecialEvent?: boolean
}

export interface ContextoSolicitud {
  origin: OrigenSolicitud
  requestCode: string
  /** Precio ya calculado para el borrador (única fuente de montos). */
  price: PriceBreakdown
  ivaPercentage: number
  depositPercentage: number
  schedule?: RequestSchedule
  /** Fecha de hoy, para el valor por defecto de la fecha de la reserva. */
  today: string
}

/**
 * Convierte el borrador del asistente en la solicitud que se guarda.
 * La usan el cliente y el administrador, así no hay dos formas de armar una reserva.
 * Una reserva del administrador no trae pagos: el abono se registra después en el detalle.
 */
export function buildRequestFromDraft(
  draft: BorradorSolicitud,
  ctx: ContextoSolicitud
): Omit<ReservationRequest, 'id' | 'status' | 'createdAt'> {
  const { price } = ctx
  const esAdmin = ctx.origin === 'admin'

  return {
    requestCode: ctx.requestCode,
    clientName: draft.clientName || (esAdmin ? 'Cliente sin nombre' : 'Cliente Web'),
    clientPhone: draft.clientPhone || '+56900000000',
    clientEmail: draft.clientEmail || '',
    type: draft.service,
    resourceName: draft.resourceName,
    date: draft.checkInDate || ctx.today,
    timeOrDuration: draft.checkOutDate || '1 día',
    guestsCount: draft.guestsCount,
    totalAmount: price.totalWithIva,
    depositRequired: price.depositAmount,
    payments: [],
    details: {
      comments: draft.comments,
      selectedMeals: draft.selectedMeals,
      resourceId: draft.resourceId,
      startDate: draft.checkInDate,
      endDate: draft.checkOutDate,
      campingType: draft.campingType,
      selectedMealTypes: draft.selectedMealTypes,
      mealTimes: draft.mealTimes,
      restaurantTime: draft.restaurantTime,
      clientType: draft.service === 'restaurante' ? draft.clientType : undefined,
      schedule: ctx.schedule,
      origin: ctx.origin,
      isSpecialEvent: draft.isSpecialEvent ? true : undefined,
      pricing: {
        subtotal: price.subtotal,
        ivaAmount: price.ivaAmount,
        ivaPercentage: ctx.ivaPercentage,
        depositPercentage: ctx.depositPercentage,
        nights: price.nights
      }
    }
  }
}
