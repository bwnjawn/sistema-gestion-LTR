// src/lib/dates.ts
// Único lugar para manejar fechas. Todas las fechas de la aplicación son texto
// 'YYYY-MM-DD' en hora local de Chile; nunca se usa toISOString() (que entrega
// la fecha en UTC y adelanta un día después de las ~21:00).

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MS_POR_DIA = 24 * 60 * 60 * 1000

interface PartesFecha {
  anio: number
  mes: number
  dia: number
}

function parsearFecha(fecha: string): PartesFecha | null {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha || '')
  if (!coincidencia) return null
  const anio = Number(coincidencia[1])
  const mes = Number(coincidencia[2])
  const dia = Number(coincidencia[3])
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null
  return { anio, mes, dia }
}

function aTexto(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

/** Fecha de hoy en hora local, como 'YYYY-MM-DD'. */
export function todayISO(): string {
  const ahora = new Date()
  return aTexto(ahora.getFullYear(), ahora.getMonth() + 1, ahora.getDate())
}

/** Muestra una fecha 'YYYY-MM-DD' como '18 Oct'. Devuelve '-' si no es válida. */
export function formatDateShort(fecha: string): string {
  const partes = parsearFecha(fecha)
  if (!partes) return '-'
  return `${partes.dia} ${MESES_CORTOS[partes.mes - 1]}`
}

/** Suma (o resta) días a una fecha 'YYYY-MM-DD'. Devuelve '' si la fecha no es válida. */
export function addDays(fecha: string, dias: number): string {
  const partes = parsearFecha(fecha)
  if (!partes) return ''
  const resultado = new Date(partes.anio, partes.mes - 1, partes.dia + dias)
  return aTexto(resultado.getFullYear(), resultado.getMonth() + 1, resultado.getDate())
}

/**
 * Noches entre la entrada y la salida. Devuelve 0 si alguna fecha no es válida
 * o si la salida no es posterior a la entrada, para que el error se note
 * en vez de cobrar una noche por defecto.
 */
export function nightsBetween(entrada: string, salida: string): number {
  const a = parsearFecha(entrada)
  const b = parsearFecha(salida)
  if (!a || !b) return 0
  // Date.UTC evita los desfases por cambio de horario de verano.
  const inicio = Date.UTC(a.anio, a.mes - 1, a.dia)
  const fin = Date.UTC(b.anio, b.mes - 1, b.dia)
  const noches = Math.round((fin - inicio) / MS_POR_DIA)
  return noches > 0 ? noches : 0
}

/** Indica si la fecha es anterior a hoy (hora local). */
export function isPastDate(fecha: string): boolean {
  const partes = parsearFecha(fecha)
  if (!partes) return false
  return aTexto(partes.anio, partes.mes, partes.dia) < todayISO()
}
