// src/services/cotizacion.ts
// Cotización de una solicitud (SCRUM-71): arma, sin dibujar nada, los datos que lleva el PDF y los textos
// con que el administrador la envía al cliente. El dibujo del PDF vive en `lib/pdfCotizacion.ts`.

import type { BusinessInfo, ReservationRequest, SelectedMealPayload, TransferInfo } from '../types/domain'
import { formatCLP } from '../lib/format'
import { todayISO } from '../lib/dates'
import { isSingleDayRequest, describeRequest, SERVICE_LABELS } from './requests'

export interface LineaCotizacion {
  concepto: string
  /** Texto secundario bajo el concepto (acompañamientos, por ejemplo). */
  detalle?: string
  cantidad: number
  precioUnitario: number
  total: number
}

export interface SeccionCotizacion {
  /** "Almuerzo · 13:30 hrs"; vacío cuando el servicio no se divide (cabaña, camping, piscina). */
  titulo: string
  lineas: LineaCotizacion[]
}

export interface FilaDato {
  etiqueta: string
  valor: string
}

export interface Cotizacion {
  /** Código de la solicitud: la cotización no tiene numeración propia. */
  codigo: string
  /** Fecha de emisión, `YYYY-MM-DD`. */
  emitidaEl: string
  servicio: string
  cliente: FilaDato[]
  /** Fechas y datos del servicio cotizado. */
  datos: FilaDato[]
  secciones: SeccionCotizacion[]
  subtotal: number
  /** 0 en la piscina: el valor de la entrada ya es el final. */
  ivaPorcentaje: number
  iva: number
  total: number
  /** Abono exigido; 0 si el cliente no paga abono. */
  abono: number
  comentarios?: string
  negocio: BusinessInfo
  /** Solo si hay abono que transferir. */
  transferencia?: TransferInfo
}

/** Solo se cotizan las solicitudes vivas: no tiene sentido cotizar algo rechazado o cancelado. */
export function puedeCotizarse(req: Pick<ReservationRequest, 'status'>): boolean {
  return req.status === 'pending' || req.status === 'confirmed'
}

const ORDEN_COMIDAS = ['desayuno', 'almuerzo', 'once']
const ETIQUETAS_COMIDA: Record<string, string> = { desayuno: 'Desayuno', almuerzo: 'Almuerzo', once: 'Once' }

function plural(cantidad: number, singular: string, pluralTexto: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : pluralTexto}`
}

function textoAcompanamientos(plato: SelectedMealPayload): string | undefined {
  const elegidos = Object.entries(plato.sides || {}).filter(([, cantidad]) => cantidad > 0)
  const partes = elegidos.map(([nombre, cantidad]) => `${nombre} x${cantidad}`)
  if (plato.fixedSide) partes.unshift(`Incluye ${plato.fixedSide}`)
  return partes.length > 0 ? partes.join(', ') : undefined
}

function seccionesDeRestaurante(req: ReservationRequest): SeccionCotizacion[] {
  const platos: SelectedMealPayload[] = req.details?.selectedMeals || []
  const horas = req.details?.mealTimes || {}
  const grupos = new Map<string, SelectedMealPayload[]>()
  for (const plato of platos) {
    const clave = (plato.mealType || 'platos').toLowerCase()
    grupos.set(clave, [...(grupos.get(clave) ?? []), plato])
  }
  const claves = [...grupos.keys()].sort((a, b) => {
    const ia = ORDEN_COMIDAS.indexOf(a)
    const ib = ORDEN_COMIDAS.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
  return claves.map(clave => ({
    titulo: [ETIQUETAS_COMIDA[clave] || 'Platos', horas[clave] ? `${horas[clave]} hrs` : ''].filter(Boolean).join(' · '),
    lineas: (grupos.get(clave) ?? []).map(plato => ({
      concepto: plato.name,
      detalle: textoAcompanamientos(plato),
      cantidad: plato.quantity,
      precioUnitario: plato.price,
      total: plato.price * plato.quantity
    }))
  }))
}

/** El precio por unidad se deduce del subtotal guardado, así la cotización siempre cuadra con lo que cobra la app. */
function unitario(subtotal: number, unidades: number): number {
  return unidades > 0 ? Math.round(subtotal / unidades) : subtotal
}

function seccionesDeEstadia(req: ReservationRequest, subtotal: number): SeccionCotizacion[] {
  const noches = Math.max(1, req.details?.pricing?.nights ?? 1)
  const personas = Math.max(1, req.guestsCount)

  if (req.type === 'cabana') {
    return [{
      titulo: '',
      lineas: [{
        concepto: req.resourceName,
        detalle: plural(noches, 'noche', 'noches'),
        cantidad: noches,
        precioUnitario: unitario(subtotal, noches),
        total: subtotal
      }]
    }]
  }

  // Camping y piscina se cobran por persona (y por noche si se pernocta)
  const unidades = req.type === 'camping' && !isSingleDayRequest(req) ? personas * noches : personas
  const detalle = unidades === personas
    ? plural(personas, 'persona', 'personas')
    : `${plural(personas, 'persona', 'personas')} x ${plural(noches, 'noche', 'noches')}`
  return [{
    titulo: '',
    lineas: [{
      concepto: req.type === 'piscina' ? 'Entrada a la piscina' : req.resourceName,
      detalle,
      cantidad: unidades,
      precioUnitario: unitario(subtotal, unidades),
      total: subtotal
    }]
  }]
}

export interface ContextoCotizacion {
  negocio: BusinessInfo
  transferencia: TransferInfo
  /** IVA vigente; solo se usa si la solicitud es antigua y no guardó su desglose. */
  ivaVigente: number
  hoy?: string
}

/** Arma la cotización de una solicitud. No modifica nada. */
export function buildCotizacion(req: ReservationRequest, ctx: ContextoCotizacion): Cotizacion {
  const vista = describeRequest(req)
  const guardado = req.details?.pricing
  const esPiscina = req.type === 'piscina'
  const ivaPorcentaje = esPiscina ? 0 : guardado?.ivaPercentage ?? ctx.ivaVigente
  const total = req.totalAmount
  const subtotal = esPiscina ? total : guardado?.subtotal ?? Math.round(total / (1 + ivaPorcentaje / 100))
  const iva = esPiscina ? 0 : guardado?.ivaAmount ?? total - subtotal

  const cliente: FilaDato[] = [
    { etiqueta: 'Cliente', valor: req.clientName },
    { etiqueta: 'Teléfono', valor: req.clientPhone }
  ]
  if (req.clientEmail) cliente.push({ etiqueta: 'Correo', valor: req.clientEmail })
  if (req.details?.clientType) cliente.push({ etiqueta: 'Tipo de cliente', valor: req.details.clientType })

  const datos: FilaDato[] = [
    ...vista.stayDates.map(fila => ({
      etiqueta: fila.label,
      valor: fila.hint ? `${fila.value} (${fila.hint.charAt(0).toLowerCase()}${fila.hint.slice(1)})` : fila.value
    })),
    ...(vista.staySummary ? [{ etiqueta: vista.staySummary.label, valor: vista.staySummary.value }] : []),
    // "Servicio" ya está en el título del bloque y "Tipo de cliente" en el bloque del cliente
    ...vista.serviceRows.filter(fila => fila.label !== 'Servicio' && fila.label !== 'Tipo de cliente').map(fila => ({ etiqueta: fila.label, valor: fila.value }))
  ]

  const secciones = req.type === 'restaurante' ? seccionesDeRestaurante(req) : seccionesDeEstadia(req, subtotal)

  return {
    codigo: req.requestCode,
    emitidaEl: ctx.hoy ?? todayISO(),
    servicio: SERVICE_LABELS[req.type],
    cliente,
    datos,
    secciones,
    subtotal,
    ivaPorcentaje,
    iva,
    total,
    abono: req.depositRequired || 0,
    comentarios: req.details?.comments?.trim() || undefined,
    negocio: ctx.negocio,
    transferencia: (req.depositRequired || 0) > 0 ? ctx.transferencia : undefined
  }
}

/** Nombre del archivo: `Cotizacion-SOL-AB12CD.pdf`, sin espacios ni caracteres raros. */
export function nombreArchivoCotizacion(codigo: string): string {
  const limpio = codigo.replace(/[^A-Za-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
  return `Cotizacion-${limpio || 'solicitud'}.pdf`
}

/** Mensaje que acompaña a la cotización cuando el administrador la manda por WhatsApp o correo. */
export function buildMensajeCotizacion(req: ReservationRequest): string {
  return (
    `Hola ${req.clientName}, te escribimos de Los Troncos de Repil. Te enviamos la cotización de tu solicitud ` +
    `${req.requestCode} por ${formatCLP(req.totalAmount)} (IVA incluido). Quedamos atentos a cualquier duda.`
  )
}

export function buildAsuntoCotizacion(req: ReservationRequest): string {
  return `Cotización ${req.requestCode} - Los Troncos de Repil`
}
