// src/lib/repositories/supabase/mapeos.ts
// Traducción entre los datos de la app (en inglés, como `domain.ts`) y las filas de Supabase (en español,
// ver docs/supabase-esquema.md). Son funciones puras, sin red: se prueban en tests/mapeosSupabase.test.ts.
// Las reservas pasan por `Booking` (services/adaptadoresReserva.ts), así que las vistas siguen usando
// `ReservationRequest`.

import { bookingToRequest, requestToBooking } from '../../../services/adaptadoresReserva'
import { aplicarReglaDeAcompanamiento } from '../../../services/menus'
import type {
  Booking,
  BookingItem,
  BookingMeal,
  Cabin,
  CampingModality,
  CampingSite,
  CampingSiteModality,
  Dish,
  MealType,
  Payment,
  ReservationRequest,
  ServiceType
} from '../../../types/domain'
import type { ClaveAjuste } from '../../../types/settings'

// ---------------------------------------------------------------------------
// Ajustes
// ---------------------------------------------------------------------------

/** Clave que usa la app → clave de la tabla `ajustes`. */
export const CLAVE_DE_AJUSTE: Record<ClaveAjuste, string> = {
  contact_info: 'contacto',
  transfer_info: 'transferencia',
  parameters: 'parametros',
  restaurant_schedules: 'horarios_restaurante',
  camping_schedules: 'horarios_camping',
  cabin_schedules: 'horarios_cabana'
}

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

export interface FilaCabana {
  id: string
  nombre: string
  capacidad: number
  precio_noche: number
  camas: string | null
  descripcion: string | null
  imagen_principal: string | null
  imagenes: string[] | null
  caracteristicas: unknown
  en_mantencion: boolean
  activo: boolean
}

export function cabinDeFila(f: FilaCabana): Cabin {
  const caracteristicas = Array.isArray(f.caracteristicas) ? f.caracteristicas.filter((x): x is string => typeof x === 'string') : []
  return {
    id: f.id,
    name: f.nombre,
    capacity: f.capacidad,
    pricePerNight: f.precio_noche,
    ...(f.camas ? { bedsDescription: f.camas } : {}),
    ...(f.descripcion ? { description: f.descripcion } : {}),
    ...(f.imagen_principal ? { mainImage: f.imagen_principal } : {}),
    images: f.imagenes ?? [],
    features: caracteristicas,
    enMantencion: f.en_mantencion,
    isActive: f.activo
  }
}

/** Solo las columnas de los campos indicados (sirve para crear y para cambiar parcialmente). */
export function cabinAFila(c: Partial<Cabin>): Record<string, unknown> {
  const fila: Record<string, unknown> = {}
  if (c.id !== undefined) fila.id = c.id
  if (c.name !== undefined) fila.nombre = c.name
  if (c.capacity !== undefined) fila.capacidad = c.capacity
  if (c.pricePerNight !== undefined) fila.precio_noche = c.pricePerNight
  if ('bedsDescription' in c) fila.camas = c.bedsDescription ?? null
  if ('description' in c) fila.descripcion = c.description ?? null
  if ('mainImage' in c) fila.imagen_principal = c.mainImage ?? null
  if (c.images !== undefined) fila.imagenes = c.images
  if (c.features !== undefined) fila.caracteristicas = c.features
  if (c.enMantencion !== undefined) fila.en_mantencion = c.enMantencion
  if (c.isActive !== undefined) fila.activo = c.isActive
  return fila
}

export interface FilaSitio {
  id: string
  nombre: string
  descripcion: string | null
  precio_persona: number
  capacidad_min: number
  capacidad_max: number
  es_especial: boolean
  modalidades: CampingModality[]
  imagen_principal: string | null
  imagenes: string[] | null
  caracteristicas: string[] | null
  activo: boolean
}

function modalidadDe(modalidades: CampingModality[]): CampingSiteModality {
  const tieneDiario = modalidades.includes('diario')
  const tienePernoctar = modalidades.includes('pernoctar')
  if (tieneDiario && tienePernoctar) return 'ambos'
  return tieneDiario ? 'diario' : 'pernoctar'
}

function modalidadesDe(modalidad: CampingSiteModality): CampingModality[] {
  return modalidad === 'ambos' ? ['diario', 'pernoctar'] : [modalidad]
}

export function sitioDeFila(f: FilaSitio): CampingSite {
  return {
    id: f.id,
    name: f.nombre,
    ...(f.descripcion ? { description: f.descripcion } : {}),
    pricePerPerson: f.precio_persona,
    minCapacity: f.capacidad_min,
    maxCapacity: f.capacidad_max,
    isSpecial: f.es_especial,
    modality: modalidadDe(f.modalidades ?? []),
    ...(f.imagen_principal ? { image: f.imagen_principal } : {}),
    images: f.imagenes ?? [],
    features: f.caracteristicas ?? [],
    isActive: f.activo
  }
}

export function sitioAFila(s: Partial<CampingSite>): Record<string, unknown> {
  const fila: Record<string, unknown> = {}
  if (s.id !== undefined) fila.id = s.id
  if (s.name !== undefined) fila.nombre = s.name
  if ('description' in s) fila.descripcion = s.description ?? null
  if (s.pricePerPerson !== undefined) fila.precio_persona = s.pricePerPerson
  if (s.minCapacity !== undefined) fila.capacidad_min = s.minCapacity
  if (s.maxCapacity !== undefined) fila.capacidad_max = s.maxCapacity
  if (s.isSpecial !== undefined) fila.es_especial = s.isSpecial
  if (s.modality !== undefined) fila.modalidades = modalidadesDe(s.modality)
  if ('image' in s) fila.imagen_principal = s.image ?? null
  if (s.images !== undefined) fila.imagenes = s.images
  if (s.features !== undefined) fila.caracteristicas = s.features
  if (s.isActive !== undefined) fila.activo = s.isActive
  return fila
}

export interface FilaPlato {
  id: string
  nombre: string
  precio: number
  descripcion: string | null
  comida: MealType
  modo_acompanamiento: 'none' | 'fixed' | 'choice'
  acompanamiento_fijo: string | null
  imagen: string | null
  activo: boolean
  plato_acompanamientos?: { acompanamientos: { nombre: string } | null }[] | null
}

export function platoDeFila(f: FilaPlato): Dish {
  const lados = (f.plato_acompanamientos ?? []).map(v => v.acompanamientos?.nombre).filter((n): n is string => !!n)
  // El desayuno y la once no llevan acompañamiento: si la base aún los tiene, se leen ya sin él.
  return aplicarReglaDeAcompanamiento({
    id: f.id,
    name: f.nombre,
    price: f.precio,
    ...(f.descripcion ? { description: f.descripcion } : {}),
    mealType: f.comida,
    sideMode: f.modo_acompanamiento,
    availableSides: f.modo_acompanamiento === 'choice' ? lados : [],
    ...(f.modo_acompanamiento === 'fixed' && f.acompanamiento_fijo ? { fixedSide: f.acompanamiento_fijo } : {}),
    ...(f.imagen ? { image: f.imagen } : {}),
    isActive: f.activo
  })
}

/** Columnas de `platos`; los acompañamientos disponibles van aparte (tabla `plato_acompanamientos`). */
export function platoAFila(d: Partial<Dish>): Record<string, unknown> {
  const fila: Record<string, unknown> = {}
  if (d.id !== undefined) fila.id = d.id
  if (d.name !== undefined) fila.nombre = d.name
  if (d.price !== undefined) fila.precio = d.price
  if ('description' in d) fila.descripcion = d.description ?? null
  if (d.mealType !== undefined) fila.comida = d.mealType
  if (d.sideMode !== undefined) fila.modo_acompanamiento = d.sideMode
  if ('fixedSide' in d || d.sideMode !== undefined) fila.acompanamiento_fijo = d.sideMode === 'fixed' ? (d.fixedSide ?? null) : null
  if ('image' in d) fila.imagen = d.image ?? null
  if (d.isActive !== undefined) fila.activo = d.isActive
  return fila
}

// ---------------------------------------------------------------------------
// Pagos
// ---------------------------------------------------------------------------

export interface FilaPago {
  id: string
  monto: number
  medio: Payment['method']
  pagado_el: string
  notas: string | null
  creado_en: string
}

export function pagoDeFila(f: FilaPago): Payment {
  return {
    id: f.id,
    amount: f.monto,
    method: f.medio,
    paidOn: f.pagado_el,
    ...(f.notas ? { notes: f.notas } : {}),
    createdAt: f.creado_en
  }
}

export function pagoAFila(p: Payment, reservaId: string, usuarioId: string | null): Record<string, unknown> {
  return {
    id: p.id,
    reserva_id: reservaId,
    monto: p.amount,
    medio: p.method,
    pagado_el: p.paidOn,
    notas: p.notes ?? null,
    registrado_por: usuarioId
  }
}

// ---------------------------------------------------------------------------
// Reservas
// ---------------------------------------------------------------------------

/**
 * Consulta que trae una reserva con sus comidas, ítems, pagos y el nombre del recurso. Los ítems cuelgan de la
 * comida (su clave foránea es (reserva, comida)), por eso van anidados dentro de `reserva_comidas`.
 */
export const SELECT_RESERVA = '*, reserva_comidas(*, reserva_items(*)), pagos(*), cabanas(nombre), sitios_camping(nombre)'

export interface FilaReserva {
  id: string
  codigo: string
  origen: 'cliente' | 'admin'
  tipo: ServiceType
  estado: Booking['status']
  cliente_nombre: string
  cliente_telefono: string
  cliente_correo: string | null
  tipo_cliente: Booking['clientType'] | null
  cabana_id: string | null
  sitio_id: string | null
  modalidad_camping: CampingModality | null
  fecha_inicio: string
  fecha_fin: string
  personas: number
  hora_entrada: string | null
  hora_salida: string | null
  comentarios: string | null
  subtotal: number
  iva_porcentaje: number | string
  iva_monto: number
  total: number
  abono_porcentaje: number | string
  abono_exigido: number
  abono_vence_en: string | null
  evento_especial: boolean
  grupo_id: string | null
  en_conflicto: boolean
  creada_en: string
  actualizada_en: string
  reserva_comidas?: {
    comida: MealType
    hora: string
    reserva_items?: {
      comida: MealType
      plato_id: string | null
      nombre: string
      precio_unitario: number
      cantidad: number
      acompanamiento_fijo: string | null
      acompanamientos: Record<string, number> | null
    }[] | null
  }[] | null
  pagos?: (FilaPago & { creado_en: string })[] | null
  cabanas?: { nombre: string } | null
  sitios_camping?: { nombre: string } | null
}

/** `HH:MM:SS` de la base → `HH:MM`. */
function hora(valor: string | null | undefined): string | undefined {
  return valor ? valor.slice(0, 5) : undefined
}

const ORDEN_COMIDAS: MealType[] = ['desayuno', 'almuerzo', 'once']
/** Hora de respaldo si una comida antigua no tenía hora (la columna `hora` no admite vacío). */
const HORA_POR_DEFECTO: Record<MealType, string> = { desayuno: '09:00', almuerzo: '13:00', once: '17:00' }

export function bookingDeFila(f: FilaReserva): Booking {
  const comidas = [...(f.reserva_comidas ?? [])].sort((a, b) => ORDEN_COMIDAS.indexOf(a.comida) - ORDEN_COMIDAS.indexOf(b.comida))
  const meals: BookingMeal[] = comidas.map(c => ({
    mealType: c.comida,
    time: hora(c.hora) ?? '',
    items: (c.reserva_items ?? [])
      .map<BookingItem>(i => ({
        dishId: i.plato_id,
        name: i.nombre,
        unitPrice: i.precio_unitario,
        quantity: i.cantidad,
        ...(i.acompanamiento_fijo ? { fixedSide: i.acompanamiento_fijo } : {}),
        sides: { ...(i.acompanamientos ?? {}) }
      }))
  }))
  const pagos = [...(f.pagos ?? [])].sort((a, b) => a.creado_en.localeCompare(b.creado_en))

  return {
    id: f.id,
    code: f.codigo,
    origin: f.origen,
    type: f.tipo,
    status: f.estado,
    clientName: f.cliente_nombre,
    clientPhone: f.cliente_telefono,
    ...(f.cliente_correo ? { clientEmail: f.cliente_correo } : {}),
    ...(f.tipo_cliente ? { clientType: f.tipo_cliente } : {}),
    ...(f.cabana_id ? { cabinId: f.cabana_id } : {}),
    ...(f.sitio_id ? { campingSiteId: f.sitio_id } : {}),
    ...(f.modalidad_camping ? { campingModality: f.modalidad_camping } : {}),
    startDate: f.fecha_inicio,
    endDate: f.fecha_fin,
    guestsCount: f.personas,
    ...(f.hora_entrada && f.hora_salida ? { checkInTime: hora(f.hora_entrada), checkOutTime: hora(f.hora_salida) } : {}),
    ...(f.comentarios ? { comments: f.comentarios } : {}),
    pricing: {
      subtotal: f.subtotal,
      ivaPercentage: Number(f.iva_porcentaje),
      ivaAmount: f.iva_monto,
      total: f.total,
      depositPercentage: Number(f.abono_porcentaje),
      depositRequired: f.abono_exigido
    },
    ...(f.abono_vence_en ? { depositDueAt: f.abono_vence_en } : {}),
    meals,
    payments: pagos.map(pagoDeFila),
    ...(f.grupo_id ? { groupId: f.grupo_id } : {}),
    inConflict: f.en_conflicto,
    createdAt: f.creada_en,
    updatedAt: f.actualizada_en
  }
}

/** Una reserva de la base como la usan las vistas (`ReservationRequest`). */
export function solicitudDeFila(f: FilaReserva): ReservationRequest {
  const ctx = {
    cabins: f.cabana_id && f.cabanas ? [{ id: f.cabana_id, name: f.cabanas.nombre }] : [],
    campingSites: f.sitio_id && f.sitios_camping ? [{ id: f.sitio_id, name: f.sitios_camping.nombre }] : []
  }
  const solicitud = bookingToRequest(bookingDeFila(f), ctx)
  if (f.evento_especial) solicitud.details = { ...solicitud.details, isSpecialEvent: true }
  return solicitud
}

function comidasEItems(b: Booking) {
  return {
    comidas: b.meals.map(m => ({ comida: m.mealType, hora: m.time || HORA_POR_DEFECTO[m.mealType] })),
    items: b.meals.flatMap(m =>
      m.items.map(i => ({
        comida: m.mealType,
        plato_id: i.dishId || null,
        nombre: i.name,
        precio_unitario: i.unitPrice,
        cantidad: i.quantity,
        acompanamiento_fijo: i.fixedSide ?? null,
        acompanamientos: i.sides
      }))
    )
  }
}

/**
 * Lo que recibe `admin_guardar_reserva`: la reserva completa. Con `conCodigo: false` el código va vacío y la base
 * asigna uno (reserva nueva); al reemplazar una existente se conserva el suyo.
 */
export function payloadGuardarReserva(req: ReservationRequest, opciones: { conCodigo: boolean }): Record<string, unknown> {
  const b = requestToBooking(req)
  return {
    id: b.id,
    codigo: opciones.conCodigo ? b.code : '',
    origen: b.origin,
    tipo: b.type,
    estado: b.status,
    cliente_nombre: b.clientName,
    cliente_telefono: b.clientPhone,
    cliente_correo: b.clientEmail ?? null,
    tipo_cliente: b.clientType ?? null,
    cabana_id: b.cabinId ?? null,
    sitio_id: b.campingSiteId ?? null,
    modalidad_camping: b.campingModality ?? null,
    fecha_inicio: b.startDate,
    fecha_fin: b.endDate,
    personas: b.guestsCount,
    hora_entrada: b.checkInTime ?? null,
    hora_salida: b.checkOutTime ?? null,
    comentarios: b.comments ?? null,
    subtotal: b.pricing.subtotal,
    iva_porcentaje: b.pricing.ivaPercentage,
    iva_monto: b.pricing.ivaAmount,
    total: b.pricing.total,
    abono_porcentaje: b.pricing.depositPercentage,
    abono_exigido: b.pricing.depositRequired,
    abono_vence_en: b.depositDueAt ?? null,
    evento_especial: req.details?.isSpecialEvent === true,
    grupo_id: b.groupId ?? null,
    en_conflicto: b.inConflict,
    creada_en: b.createdAt,
    ...comidasEItems(b)
  }
}

/** Lo que recibe `crear_solicitud` (el cliente): solo lo que elige; el precio y el abono los calcula el servidor. */
export function payloadCrearSolicitud(req: ReservationRequest): Record<string, unknown> {
  const b = requestToBooking(req)
  return {
    id: b.id,
    tipo: b.type,
    cliente_nombre: b.clientName,
    cliente_telefono: b.clientPhone,
    cliente_correo: b.clientEmail ?? null,
    tipo_cliente: b.clientType ?? null,
    fecha_inicio: b.startDate,
    fecha_fin: b.endDate,
    personas: b.guestsCount,
    comentarios: b.comments ?? null,
    cabana_id: b.cabinId ?? null,
    sitio_id: b.campingSiteId ?? null,
    modalidad_camping: b.campingModality ?? null,
    ...comidasEItems(b)
  }
}

export interface RespuestaCrearSolicitud {
  id: string
  codigo: string
  estado: Booking['status']
  total: number
  abono_exigido: number
  abono_vence_en: string | null
}

/** La solicitud como quedó en el servidor: el código, el estado, el total y el plazo los decide la base. */
export function solicitudConRespuesta(req: ReservationRequest, r: RespuestaCrearSolicitud): ReservationRequest {
  const { depositDueAt: _plazoLocal, ...resto } = req
  return {
    ...resto,
    id: r.id,
    requestCode: r.codigo,
    status: r.estado,
    totalAmount: r.total,
    depositRequired: r.abono_exigido,
    ...(r.abono_vence_en ? { depositDueAt: r.abono_vence_en } : {})
  }
}
