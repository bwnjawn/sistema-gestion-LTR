// src/services/requests.ts
// Normalización de solicitudes guardadas y armado de la información que ve el administrador.

import type {
  BookingStatus,
  Payment,
  ReservationRequest,
  SelectedMealPayload,
  ServiceType
} from '../types/domain'
import { formatDateLong, nightsBetween } from '../lib/dates'
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
  /** Frase principal: "Desde el Sáb 18 Oct 2026 hasta el Mar 21 Oct 2026 (3 noches)". */
  stayHeadline: string
  /** "4 personas" o "12 comensales". */
  guestsLabel: string
  /** Filas del recuadro "Estadía" o "Visita". */
  stayRows: InfoRow[]
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

  const stayRows: InfoRow[] = []
  let stayHeadline = ''

  if (isDayVisit) {
    stayHeadline = `El ${formatDateLong(start)}`
    stayRows.push({ label: 'Fecha', value: formatDateLong(start) })
    if (req.type === 'camping' && details.schedule) {
      stayRows.push({ label: 'Horario', value: `${details.schedule.checkIn} a ${details.schedule.checkOut} hrs` })
    }
  } else {
    const nightsText = nights > 0 ? ` (${nights} ${nights === 1 ? 'noche' : 'noches'})` : ''
    stayHeadline = `Desde el ${formatDateLong(start)} hasta el ${formatDateLong(end)}${nightsText}`
    stayRows.push({
      label: 'Llegada',
      value: formatDateLong(start),
      hint: details.schedule ? `Desde las ${details.schedule.checkIn} hrs` : undefined
    })
    stayRows.push({
      label: 'Salida',
      value: formatDateLong(end),
      hint: details.schedule ? `Hasta las ${details.schedule.checkOut} hrs` : undefined
    })
    stayRows.push({ label: 'Noches', value: nights > 0 ? String(nights) : '-' })
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
    stayHeadline,
    guestsLabel: guestsText(req.guestsCount, req.type),
    stayRows,
    serviceRows,
    meals: buildMealGroups(req),
    priceRows
  }
}

/** Una solicitud pendiente que lleva 24 horas o más sin gestionarse. */
export function isStalePending(req: Pick<ReservationRequest, 'status' | 'createdAt'>, now: number = Date.now()): boolean {
  if (req.status !== 'pending' || !req.createdAt) return false
  const created = new Date(req.createdAt).getTime()
  if (isNaN(created)) return false
  return (now - created) / (1000 * 3600) >= 24
}
