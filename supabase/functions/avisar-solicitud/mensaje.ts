// Texto del aviso push de una solicitud nueva (SCRUM-68). Sin dependencias, para usarlo en la Edge Function (Deno)
// y probarlo desde Vitest. Por la pantalla de bloqueo, el aviso NO lleva teléfono, correo, precio ni comentarios.

export interface DatosAviso {
  id: string
  codigo: string
  tipo: 'cabana' | 'camping' | 'restaurante' | 'piscina' | string
  clienteNombre: string
  fechaInicio: string // AAAA-MM-DD
  fechaFin: string // AAAA-MM-DD
  personas: number
}

export interface AvisoPush {
  titulo: string
  cuerpo: string
  /** Ruta de la app que se abre al tocar el aviso. */
  url: string
  /** Identifica el aviso: uno por solicitud, así un reenvío no lo duplica. */
  etiqueta: string
}

const NOMBRE_TIPO: Record<string, string> = {
  cabana: 'Cabaña',
  camping: 'Camping',
  restaurante: 'Restaurante',
  piscina: 'Piscina'
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function partes(fecha: string): { dia: number; mes: number } {
  const [, mes, dia] = fecha.split('-').map(Number)
  return { dia, mes }
}

/** "12 de enero", "12 al 14 de enero" o "30 de enero al 2 de febrero". */
export function describirFechas(fechaInicio: string, fechaFin: string): string {
  const a = partes(fechaInicio)
  if (fechaInicio === fechaFin) return `${a.dia} de ${MESES[a.mes - 1]}`
  const b = partes(fechaFin)
  if (a.mes === b.mes) return `${a.dia} al ${b.dia} de ${MESES[b.mes - 1]}`
  return `${a.dia} de ${MESES[a.mes - 1]} al ${b.dia} de ${MESES[b.mes - 1]}`
}

export function armarAviso(datos: DatosAviso): AvisoPush {
  const tipo = NOMBRE_TIPO[datos.tipo] ?? 'Solicitud'
  const personas = datos.personas === 1 ? '1 persona' : `${datos.personas} personas`
  return {
    titulo: `Nueva solicitud · ${tipo}`,
    cuerpo: `${datos.clienteNombre} · ${describirFechas(datos.fechaInicio, datos.fechaFin)} · ${personas}`,
    url: `/admin/solicitudes?solicitud=${encodeURIComponent(datos.id)}`,
    etiqueta: `solicitud-${datos.id}`
  }
}
