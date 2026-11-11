// src/services/adaptadoresReserva.ts
// Adaptadores entre el modelo plano de las vistas (`ReservationRequest`) y el modelo de la base de datos
// (`Booking`, ver docs/supabase-esquema.md). Son funciones puras: se usan en el borde del repositorio, así
// las vistas no cambian (SCRUM-245). El cableado a los repositorios es SCRUM-246.
//
// Lo que NO viaja a `Booking` (no tiene columna): `details.isSpecialEvent` (evento especial, SCRUM-261, bloqueada),
// `details.restaurantTime` (campo antiguo; la hora vive en `meals[].time`), `details.nights` (se calcula desde las
// fechas) y los campos `count` y `sideSelections` de los platos (copias de `quantity` y `sides`).

import { nightsBetween } from '../lib/dates'
import type {
  Booking,
  BookingItem,
  BookingMeal,
  BookingOrigin,
  BookingPricing,
  Cabin,
  CampingSite,
  Dish,
  MealType,
  ReservationRequest,
  RequestPricing,
  SelectedMealPayload
} from '../types/domain'
import { normalizarComida } from './migracionCatalogo'
import { ORDEN_COMIDAS } from './menus'

/** Catálogo que usa el adaptador para completar nombres y la comida de platos antiguos. */
export interface ContextoAdaptador {
  cabins?: Pick<Cabin, 'id' | 'name'>[]
  campingSites?: Pick<CampingSite, 'id' | 'name'>[]
  dishes?: Pick<Dish, 'id' | 'mealType'>[]
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Una solicitud de camping de día o de restaurante ocupa un solo día; el resto, de entrada a salida. */
function ocupaUnDia(req: Pick<ReservationRequest, 'type' | 'details'>): boolean {
  return req.type === 'restaurante' || (req.type === 'camping' && req.details?.campingType === 'diario')
}

function origenDe(req: ReservationRequest): BookingOrigin {
  const declarado = req.details?.origin
  if (declarado === 'admin' || declarado === 'cliente') return declarado
  return req.requestCode.startsWith('ADM-') ? 'admin' : 'cliente'
}

function comidaDelPlato(plato: SelectedMealPayload, ctx: ContextoAdaptador, respaldo: MealType): MealType {
  if (plato.mealType) return normalizarComida(plato.mealType)
  const delCatalogo = ctx.dishes?.find(d => d.id === plato.id)?.mealType
  return delCatalogo ?? respaldo
}

function elegidasComoComidas(req: ReservationRequest, ctx: ContextoAdaptador): BookingMeal[] {
  if (req.type !== 'restaurante') return []
  const detalle = req.details ?? {}
  const platos = Array.isArray(detalle.selectedMeals) ? detalle.selectedMeals : []
  const tiposElegidos = (detalle.selectedMealTypes ?? []).map(normalizarComida)
  // Una comida que tiene platos pero no figuraba en `selectedMealTypes` también cuenta
  const respaldo: MealType = tiposElegidos[0] ?? 'almuerzo'
  const porComida = new Map<MealType, BookingItem[]>()
  for (const t of tiposElegidos) porComida.set(t, [])

  for (const p of platos) {
    const comida = comidaDelPlato(p, ctx, respaldo)
    const items = porComida.get(comida) ?? []
    items.push({
      dishId: p.id || null,
      name: p.name,
      unitPrice: p.price,
      quantity: p.quantity,
      ...(p.fixedSide ? { fixedSide: p.fixedSide } : {}),
      sides: { ...(p.sides ?? {}) }
    })
    porComida.set(comida, items)
  }

  const horas = detalle.mealTimes ?? {}
  return ORDEN_COMIDAS.filter(c => porComida.has(c)).map(c => ({
    mealType: c,
    time: horas[c] ?? detalle.restaurantTime ?? '',
    items: porComida.get(c) ?? []
  }))
}

/** Precio de una solicitud antigua que no guardó su desglose: se reparte lo que se sabe, sin inventar el IVA. */
function precioDe(req: ReservationRequest): BookingPricing {
  const p = req.details?.pricing
  if (p) {
    return {
      subtotal: p.subtotal,
      ivaPercentage: p.ivaPercentage,
      ivaAmount: p.ivaAmount,
      total: req.totalAmount,
      depositPercentage: p.depositPercentage,
      depositRequired: req.depositRequired
    }
  }
  return {
    subtotal: req.totalAmount,
    ivaPercentage: 0,
    ivaAmount: 0,
    total: req.totalAmount,
    depositPercentage: req.totalAmount > 0 ? Math.round((req.depositRequired / req.totalAmount) * 100) : 0,
    depositRequired: req.depositRequired
  }
}

// ---------------------------------------------------------------------------
// ReservationRequest → Booking
// ---------------------------------------------------------------------------

export function requestToBooking(req: ReservationRequest, ctx: ContextoAdaptador = {}): Booking {
  const detalle = req.details ?? {}
  const inicio = detalle.startDate || req.date
  const fin = ocupaUnDia(req) ? inicio : detalle.endDate || inicio
  const recurso = detalle.resourceId || undefined

  return {
    id: req.id,
    code: req.requestCode,
    origin: origenDe(req),
    type: req.type,
    status: req.status,
    clientName: req.clientName,
    clientPhone: req.clientPhone,
    ...(req.clientEmail ? { clientEmail: req.clientEmail } : {}),
    ...(req.type === 'restaurante' && detalle.clientType ? { clientType: detalle.clientType } : {}),
    ...(req.type === 'cabana' && recurso ? { cabinId: recurso } : {}),
    ...(req.type === 'camping' && recurso ? { campingSiteId: recurso } : {}),
    ...(req.type === 'camping' ? { campingModality: detalle.campingType ?? 'pernoctar' } : {}),
    startDate: inicio,
    endDate: fin,
    guestsCount: req.guestsCount,
    ...(detalle.schedule ? { checkInTime: detalle.schedule.checkIn, checkOutTime: detalle.schedule.checkOut } : {}),
    ...(detalle.comments ? { comments: detalle.comments } : {}),
    pricing: precioDe(req),
    ...(req.depositDueAt ? { depositDueAt: req.depositDueAt } : {}),
    meals: elegidasComoComidas(req, ctx),
    payments: req.payments.map(p => ({ ...p })),
    inConflict: false,
    createdAt: req.createdAt,
    // La solicitud no guarda cuándo se modificó por última vez
    updatedAt: req.createdAt
  }
}

// ---------------------------------------------------------------------------
// Booking → ReservationRequest
// ---------------------------------------------------------------------------

function nombreDelRecurso(b: Booking, ctx: ContextoAdaptador): string {
  if (b.type === 'restaurante') return 'Restaurante'
  if (b.type === 'cabana') return ctx.cabins?.find(c => c.id === b.cabinId)?.name ?? 'Cabaña'
  return ctx.campingSites?.find(s => s.id === b.campingSiteId)?.name ?? 'Camping'
}

export function bookingToRequest(b: Booking, ctx: ContextoAdaptador = {}): ReservationRequest {
  const unDia = b.type === 'restaurante' || (b.type === 'camping' && b.campingModality === 'diario')
  const noches = unDia ? 1 : nightsBetween(b.startDate, b.endDate)
  const pricing: RequestPricing = {
    subtotal: b.pricing.subtotal,
    ivaAmount: b.pricing.ivaAmount,
    ivaPercentage: b.pricing.ivaPercentage,
    depositPercentage: b.pricing.depositPercentage,
    nights: noches
  }

  const selectedMeals: SelectedMealPayload[] = b.meals.flatMap(m =>
    m.items.map(i => ({
      id: i.dishId ?? '',
      name: i.name,
      price: i.unitPrice,
      quantity: i.quantity,
      mealType: m.mealType,
      ...(i.fixedSide ? { fixedSide: i.fixedSide } : {}),
      sides: { ...i.sides }
    }))
  )
  const mealTimes: Record<string, string> = {}
  for (const m of b.meals) mealTimes[m.mealType] = m.time

  return {
    id: b.id,
    requestCode: b.code,
    clientName: b.clientName,
    clientPhone: b.clientPhone,
    clientEmail: b.clientEmail ?? '',
    type: b.type,
    resourceName: nombreDelRecurso(b, ctx),
    date: b.startDate,
    timeOrDuration: unDia ? '1 día' : b.endDate,
    guestsCount: b.guestsCount,
    totalAmount: b.pricing.total,
    depositRequired: b.pricing.depositRequired,
    payments: b.payments.map(p => ({ ...p })),
    status: b.status,
    createdAt: b.createdAt,
    ...(b.depositDueAt ? { depositDueAt: b.depositDueAt } : {}),
    details: {
      comments: b.comments ?? '',
      selectedMeals,
      resourceId: b.cabinId ?? b.campingSiteId ?? '',
      startDate: b.startDate,
      endDate: unDia ? '' : b.endDate,
      ...(b.campingModality ? { campingType: b.campingModality } : {}),
      selectedMealTypes: b.meals.map(m => m.mealType),
      mealTimes,
      ...(b.clientType ? { clientType: b.clientType } : {}),
      ...(b.checkInTime && b.checkOutTime ? { schedule: { checkIn: b.checkInTime, checkOut: b.checkOutTime } } : {}),
      origin: b.origin,
      pricing
    }
  }
}
