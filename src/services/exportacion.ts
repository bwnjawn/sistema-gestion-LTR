// src/services/exportacion.ts
// Exportación de solicitudes a Excel (SCRUM-275): arma las hojas como datos neutros (columnas y filas).
// El archivo .xlsx lo escribe `lib/excelSolicitudes.ts`.

import type { BookingStatus, ReservationRequest, ServiceType } from '../types/domain'
import { isoToDate, nightsBetween, todayISO } from '../lib/dates'
import { getRequestDateRange } from './availability'
import { desglosarMontos } from './cotizacion'
import { getPaymentSummary } from './payments'
import { isSingleDayRequest, SERVICE_LABELS, STATUS_LABELS } from './requests'

/** Una celda: texto, número, fecha (a medianoche UTC, para que Excel no la corra de día) o vacía. */
export type Celda = string | number | Date | null

export type FormatoColumna = 'texto' | 'entero' | 'dinero' | 'fecha'

export interface ColumnaHoja {
  titulo: string
  ancho: number
  formato: FormatoColumna
}

export interface HojaDatos {
  nombre: string
  columnas: ColumnaHoja[]
  filas: Celda[][]
  /** Hoja de registros: tabla de Excel con filtros y orden en los encabezados. */
  conFiltros: boolean
  /** Las hojas de resumen cierran con una fila de totales. */
  filaTotal: boolean
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const SERVICIOS: ServiceType[] = ['cabana', 'camping', 'restaurante', 'piscina']
const ESTADOS: BookingStatus[] = ['pending', 'confirmed', 'rejected', 'cancelled']

/** 'YYYY-MM-DD' como fecha de Excel; null si no es válida. */
function aFechaExcel(iso: string | null | undefined): Date | null {
  const d = isoToDate(iso || '')
  return d ? new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) : null
}

/** Instante ISO (createdAt) como fecha de Excel, en hora local de Chile. */
function creadaComoFecha(instante: string): Date | null {
  const f = new Date(instante)
  return isNaN(f.getTime()) ? null : new Date(Date.UTC(f.getFullYear(), f.getMonth(), f.getDate()))
}

/** Año y mes (1 a 12) según la fecha del evento: el inicio de la reserva. */
function periodoDe(req: ReservationRequest): { anio: number; mes: number } | null {
  const d = isoToDate(getRequestDateRange(req).start)
  return d ? { anio: d.getFullYear(), mes: d.getMonth() + 1 } : null
}

function comparaPorEvento(a: ReservationRequest, b: ReservationRequest): number {
  const ia = getRequestDateRange(a).start || '9999-12-31'
  const ib = getRequestDateRange(b).start || '9999-12-31'
  return ia.localeCompare(ib) || (a.createdAt || '').localeCompare(b.createdAt || '')
}

/** Rechazadas y canceladas se cuentan juntas como descartadas, igual que en la lista de solicitudes. */
function estaDescartada(status: BookingStatus): boolean {
  return status === 'rejected' || status === 'cancelled'
}

const COLUMNAS_REGISTRO: ColumnaHoja[] = [
  { titulo: 'Código', ancho: 14, formato: 'texto' },
  { titulo: 'Creada el', ancho: 12, formato: 'fecha' },
  { titulo: 'Año', ancho: 7, formato: 'entero' },
  { titulo: 'Mes', ancho: 6, formato: 'entero' },
  { titulo: 'Nombre del mes', ancho: 15, formato: 'texto' },
  { titulo: 'Servicio', ancho: 13, formato: 'texto' },
  { titulo: 'Recurso', ancho: 22, formato: 'texto' },
  { titulo: 'Estado', ancho: 12, formato: 'texto' },
  { titulo: 'Cliente', ancho: 26, formato: 'texto' },
  { titulo: 'Tipo de cliente', ancho: 15, formato: 'texto' },
  { titulo: 'Teléfono', ancho: 16, formato: 'texto' },
  { titulo: 'Correo', ancho: 28, formato: 'texto' },
  { titulo: 'Personas', ancho: 10, formato: 'entero' },
  { titulo: 'Inicio', ancho: 12, formato: 'fecha' },
  { titulo: 'Fin', ancho: 12, formato: 'fecha' },
  { titulo: 'Noches', ancho: 9, formato: 'entero' },
  { titulo: 'Subtotal', ancho: 13, formato: 'dinero' },
  { titulo: 'IVA', ancho: 12, formato: 'dinero' },
  { titulo: 'Total con IVA', ancho: 15, formato: 'dinero' },
  { titulo: 'Abono exigido', ancho: 14, formato: 'dinero' },
  { titulo: 'Pagado', ancho: 13, formato: 'dinero' },
  { titulo: 'Saldo', ancho: 13, formato: 'dinero' },
  { titulo: 'Comentarios', ancho: 40, formato: 'texto' }
]

/** Hoja con una fila por solicitud, de la más próxima a la más lejana según la fecha del evento. */
export function hojaRegistros(solicitudes: ReservationRequest[], ivaVigente: number): HojaDatos {
  const filas = [...solicitudes].sort(comparaPorEvento).map((req): Celda[] => {
    const periodo = periodoDe(req)
    const { start, end } = getRequestDateRange(req)
    const montos = desglosarMontos(req, ivaVigente)
    const pago = getPaymentSummary(req)
    return [
      req.requestCode,
      creadaComoFecha(req.createdAt),
      periodo?.anio ?? null,
      periodo?.mes ?? null,
      periodo ? MESES[periodo.mes - 1] : null,
      SERVICE_LABELS[req.type],
      req.resourceName,
      STATUS_LABELS[req.status],
      req.clientName,
      req.details?.clientType ?? null,
      req.clientPhone,
      req.clientEmail || null,
      req.guestsCount,
      aFechaExcel(start),
      isSingleDayRequest(req) ? null : aFechaExcel(end),
      isSingleDayRequest(req) ? 0 : nightsBetween(start, end ?? ''),
      montos.subtotal,
      montos.iva,
      montos.total,
      req.depositRequired || 0,
      pago.totalPaid,
      pago.balance,
      req.details?.comments?.trim() || null
    ]
  })
  return { nombre: 'Registros', columnas: COLUMNAS_REGISTRO, filas, conFiltros: true, filaTotal: false }
}

interface Acumulado {
  solicitudes: number
  confirmadas: number
  pendientes: number
  descartadas: number
  montoConfirmado: number
  montoPendiente: number
  pagado: number
  /** Monto confirmado por servicio. */
  porServicio: Record<ServiceType, number>
}

function acumuladoVacio(): Acumulado {
  return {
    solicitudes: 0,
    confirmadas: 0,
    pendientes: 0,
    descartadas: 0,
    montoConfirmado: 0,
    montoPendiente: 0,
    pagado: 0,
    porServicio: { cabana: 0, camping: 0, restaurante: 0, piscina: 0 }
  }
}

/** Suma una solicitud: las descartadas cuentan como solicitud pero no aportan dinero. */
function sumar(acc: Acumulado, req: ReservationRequest): void {
  acc.solicitudes++
  if (req.status === 'confirmed') {
    acc.confirmadas++
    acc.montoConfirmado += req.totalAmount
    acc.porServicio[req.type] += req.totalAmount
  } else if (req.status === 'pending') {
    acc.pendientes++
    acc.montoPendiente += req.totalAmount
  } else if (estaDescartada(req.status)) {
    acc.descartadas++
    return
  }
  acc.pagado += getPaymentSummary(req).totalPaid
}

function sumaDeFilas(filas: Celda[][], columna: number): number {
  return filas.reduce((total, fila) => total + (typeof fila[columna] === 'number' ? (fila[columna] as number) : 0), 0)
}

/** Fila de totales: pone "Total" en `etiquetaEn` y suma las columnas numéricas desde `sumarDesde` (año y mes no se suman). */
function filaDeTotales(filas: Celda[][], columnas: ColumnaHoja[], etiquetaEn: number, sumarDesde: number): Celda[] {
  return columnas.map((c, i) => {
    if (i === etiquetaEn) return 'Total'
    if (i < sumarDesde || c.formato === 'texto' || c.formato === 'fecha') return null
    return sumaDeFilas(filas, i)
  })
}

const COLUMNAS_MES: ColumnaHoja[] = [
  { titulo: 'Año', ancho: 8, formato: 'entero' },
  { titulo: 'Mes', ancho: 7, formato: 'entero' },
  { titulo: 'Nombre del mes', ancho: 16, formato: 'texto' },
  { titulo: 'Solicitudes', ancho: 12, formato: 'entero' },
  { titulo: 'Confirmadas', ancho: 13, formato: 'entero' },
  { titulo: 'Pendientes', ancho: 12, formato: 'entero' },
  { titulo: 'Descartadas', ancho: 13, formato: 'entero' },
  { titulo: 'Monto confirmado', ancho: 18, formato: 'dinero' },
  { titulo: 'Monto pendiente', ancho: 17, formato: 'dinero' },
  { titulo: 'Pagado', ancho: 14, formato: 'dinero' },
  ...SERVICIOS.map((s): ColumnaHoja => ({ titulo: `Confirmado en ${SERVICE_LABELS[s].toLowerCase()}`, ancho: 20, formato: 'dinero' }))
]

/** Resumen por año y mes del evento, en orden cronológico. Las solicitudes sin fecha van al final. */
export function hojaResumenPorMes(solicitudes: ReservationRequest[]): HojaDatos {
  const meses = new Map<string, { anio: number | null; mes: number | null; acc: Acumulado }>()
  for (const req of solicitudes) {
    const p = periodoDe(req)
    const clave = p ? `${p.anio}-${String(p.mes).padStart(2, '0')}` : 'sin-fecha'
    if (!meses.has(clave)) meses.set(clave, { anio: p?.anio ?? null, mes: p?.mes ?? null, acc: acumuladoVacio() })
    sumar(meses.get(clave)!.acc, req)
  }
  const claves = [...meses.keys()].sort((a, b) => (a === 'sin-fecha' ? 1 : b === 'sin-fecha' ? -1 : a.localeCompare(b)))
  const filas = claves.map((clave): Celda[] => {
    const { anio, mes, acc } = meses.get(clave)!
    return [
      anio, mes, mes ? MESES[mes - 1] : 'Sin fecha',
      acc.solicitudes, acc.confirmadas, acc.pendientes, acc.descartadas,
      acc.montoConfirmado, acc.montoPendiente, acc.pagado,
      ...SERVICIOS.map(s => acc.porServicio[s])
    ]
  })
  return {
    nombre: 'Resumen por mes',
    columnas: COLUMNAS_MES,
    filas: [...filas, filaDeTotales(filas, COLUMNAS_MES, 2, 3)],
    conFiltros: false,
    filaTotal: true
  }
}

const COLUMNAS_SERVICIO: ColumnaHoja[] = [
  { titulo: 'Servicio', ancho: 16, formato: 'texto' },
  { titulo: 'Solicitudes', ancho: 12, formato: 'entero' },
  { titulo: 'Confirmadas', ancho: 13, formato: 'entero' },
  { titulo: 'Pendientes', ancho: 12, formato: 'entero' },
  { titulo: 'Descartadas', ancho: 13, formato: 'entero' },
  { titulo: 'Monto confirmado', ancho: 18, formato: 'dinero' },
  { titulo: 'Monto pendiente', ancho: 17, formato: 'dinero' },
  { titulo: 'Pagado', ancho: 14, formato: 'dinero' }
]

export function hojaResumenPorServicio(solicitudes: ReservationRequest[]): HojaDatos {
  const filas = SERVICIOS.map((servicio): Celda[] => {
    const acc = acumuladoVacio()
    solicitudes.filter(r => r.type === servicio).forEach(r => sumar(acc, r))
    return [
      SERVICE_LABELS[servicio],
      acc.solicitudes, acc.confirmadas, acc.pendientes, acc.descartadas,
      acc.montoConfirmado, acc.montoPendiente, acc.pagado
    ]
  })
  return {
    nombre: 'Resumen por servicio',
    columnas: COLUMNAS_SERVICIO,
    filas: [...filas, filaDeTotales(filas, COLUMNAS_SERVICIO, 0, 1)],
    conFiltros: false,
    filaTotal: true
  }
}

const COLUMNAS_ESTADO: ColumnaHoja[] = [
  { titulo: 'Estado', ancho: 16, formato: 'texto' },
  { titulo: 'Solicitudes', ancho: 12, formato: 'entero' },
  { titulo: 'Monto total', ancho: 16, formato: 'dinero' },
  { titulo: 'Pagado', ancho: 14, formato: 'dinero' }
]

export function hojaResumenPorEstado(solicitudes: ReservationRequest[]): HojaDatos {
  const filas = ESTADOS.map((estado): Celda[] => {
    const lista = solicitudes.filter(r => r.status === estado)
    return [
      STATUS_LABELS[estado],
      lista.length,
      lista.reduce((t, r) => t + r.totalAmount, 0),
      lista.reduce((t, r) => t + getPaymentSummary(r).totalPaid, 0)
    ]
  })
  return {
    nombre: 'Resumen por estado',
    columnas: COLUMNAS_ESTADO,
    filas: [...filas, filaDeTotales(filas, COLUMNAS_ESTADO, 0, 1)],
    conFiltros: false,
    filaTotal: true
  }
}

/** Todas las hojas del libro, en el orden en que se muestran: primero los registros y después los resúmenes. */
export function construirHojas(solicitudes: ReservationRequest[], ivaVigente: number): HojaDatos[] {
  return [
    hojaRegistros(solicitudes, ivaVigente),
    hojaResumenPorMes(solicitudes),
    hojaResumenPorServicio(solicitudes),
    hojaResumenPorEstado(solicitudes)
  ]
}

/** `Solicitudes-Los-Troncos-2026-11-18.xlsx`, o con `-filtradas` si es solo lo que se veía en pantalla. */
export function nombreArchivoExcel(filtradas: boolean, hoy: string = todayISO()): string {
  return `Solicitudes-Los-Troncos-${hoy}${filtradas ? '-filtradas' : ''}.xlsx`
}
