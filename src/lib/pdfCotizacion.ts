// src/lib/pdfCotizacion.ts
// Dibuja el PDF de una cotización (SCRUM-71). Solo recibe datos ya armados por `services/cotizacion.ts`.
// jsPDF se carga al pulsar el botón, para no engordar la descarga inicial de la app.

import type { Cotizacion } from '../services/cotizacion'
import { formatCLP } from './format'
import { formatDateLong } from './dates'

// Medidas en milímetros sobre una hoja A4
const ANCHO = 210
const ALTO = 297
const MARGEN = 18
const ANCHO_UTIL = ANCHO - MARGEN * 2
const PIE = 22
const VERDE: [number, number, number] = [30, 70, 32]
const GRIS: [number, number, number] = [90, 96, 104]
const LINEA: [number, number, number] = [200, 204, 208]
const FONDO: [number, number, number] = [240, 244, 238]

// Columnas de la tabla: concepto | cantidad | valor unitario | total
const COL_CANTIDAD = MARGEN + ANCHO_UTIL - 78
const COL_UNITARIO = MARGEN + ANCHO_UTIL - 32
const COL_TOTAL = MARGEN + ANCHO_UTIL

export async function generarPdfCotizacion(cot: Cotizacion): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = MARGEN

  const salto = (alto: number) => {
    if (y + alto > ALTO - PIE) {
      doc.addPage()
      y = MARGEN
    }
  }
  const texto = (t: string, x: number, opciones: { negrita?: boolean; tam?: number; color?: [number, number, number]; alinear?: 'left' | 'right' } = {}) => {
    doc.setFont('helvetica', opciones.negrita ? 'bold' : 'normal')
    doc.setFontSize(opciones.tam ?? 10)
    doc.setTextColor(...(opciones.color ?? [26, 29, 32]))
    doc.text(t, x, y, { align: opciones.alinear ?? 'left' })
  }
  const separador = () => {
    doc.setDrawColor(...LINEA)
    doc.setLineWidth(0.2)
    doc.line(MARGEN, y, MARGEN + ANCHO_UTIL, y)
  }

  // Encabezado
  doc.setFillColor(...VERDE)
  doc.rect(0, 0, ANCHO, 30, 'F')
  y = 14
  texto('Los Troncos de Repil', MARGEN, { negrita: true, tam: 18, color: [255, 255, 255] })
  y = 21
  texto('Cotización de servicios', MARGEN, { tam: 11, color: [255, 255, 255] })
  y = 14
  texto(cot.codigo, MARGEN + ANCHO_UTIL, { negrita: true, tam: 13, color: [255, 255, 255], alinear: 'right' })
  y = 21
  texto(`Emitida el ${formatDateLong(cot.emitidaEl)}`, MARGEN + ANCHO_UTIL, { tam: 10, color: [255, 255, 255], alinear: 'right' })
  y = 42

  // Datos en dos bloques: cliente y servicio
  const bloque = (titulo: string, filas: { etiqueta: string; valor: string }[]) => {
    salto(10 + filas.length * 6)
    texto(titulo.toUpperCase(), MARGEN, { negrita: true, tam: 9, color: VERDE })
    y += 2
    separador()
    y += 5
    for (const fila of filas) {
      const lineas: string[] = doc.setFontSize(10).splitTextToSize(fila.valor, ANCHO_UTIL - 42)
      salto(lineas.length * 5 + 1)
      texto(fila.etiqueta, MARGEN, { tam: 10, color: GRIS })
      doc.setFont('helvetica', 'bold').setTextColor(26, 29, 32)
      doc.text(lineas, MARGEN + 42, y)
      y += lineas.length * 5 + 1
    }
    y += 4
  }
  bloque('Cliente', cot.cliente)
  bloque(`Servicio: ${cot.servicio}`, cot.datos)

  // Tabla de precios
  const encabezadoTabla = () => {
    salto(16)
    doc.setFillColor(...FONDO)
    doc.rect(MARGEN, y - 4.5, ANCHO_UTIL, 7, 'F')
    texto('Detalle', MARGEN + 2, { negrita: true, tam: 9, color: VERDE })
    texto('Cant.', COL_CANTIDAD, { negrita: true, tam: 9, color: VERDE, alinear: 'right' })
    texto('Valor unit.', COL_UNITARIO, { negrita: true, tam: 9, color: VERDE, alinear: 'right' })
    texto('Total', COL_TOTAL - 2, { negrita: true, tam: 9, color: VERDE, alinear: 'right' })
    y += 7
  }
  texto('PRECIOS', MARGEN, { negrita: true, tam: 9, color: VERDE })
  y += 5
  encabezadoTabla()

  for (const seccion of cot.secciones) {
    if (seccion.titulo) {
      salto(14)
      texto(seccion.titulo, MARGEN + 2, { negrita: true, tam: 10, color: VERDE })
      y += 5
    }
    for (const linea of seccion.lineas) {
      const nombre: string[] = doc.setFont('helvetica', 'bold').setFontSize(10).splitTextToSize(linea.concepto, COL_CANTIDAD - MARGEN - 22)
      const detalle: string[] = linea.detalle
        ? doc.setFont('helvetica', 'normal').setFontSize(9).splitTextToSize(linea.detalle, COL_CANTIDAD - MARGEN - 22)
        : []
      const alto = nombre.length * 5 + detalle.length * 4.2 + 2
      if (y + alto > ALTO - PIE) {
        doc.addPage()
        y = MARGEN
        encabezadoTabla()
      }
      const yInicial = y
      doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(26, 29, 32)
      doc.text(nombre, MARGEN + 2, y)
      if (detalle.length > 0) {
        doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...GRIS)
        doc.text(detalle, MARGEN + 2, y + nombre.length * 5 - 0.5)
      }
      y = yInicial
      texto(String(linea.cantidad), COL_CANTIDAD, { alinear: 'right' })
      texto(formatCLP(linea.precioUnitario), COL_UNITARIO, { alinear: 'right' })
      texto(formatCLP(linea.total), COL_TOTAL - 2, { negrita: true, alinear: 'right' })
      y = yInicial + alto
      separador()
      y += 5
    }
  }

  // Totales
  const fila = (etiqueta: string, valor: string, fuerte = false) => {
    salto(9)
    texto(etiqueta, COL_TOTAL - 95, { negrita: fuerte, tam: fuerte ? 12 : 10, color: fuerte ? VERDE : [26, 29, 32] })
    texto(valor, COL_TOTAL - 2, { negrita: fuerte, tam: fuerte ? 12 : 10, color: fuerte ? VERDE : [26, 29, 32], alinear: 'right' })
    y += fuerte ? 8 : 6
  }
  y += 1
  if (cot.ivaPorcentaje > 0) {
    fila('Subtotal', formatCLP(cot.subtotal))
    fila(`IVA (${cot.ivaPorcentaje}%)`, formatCLP(cot.iva))
  }
  fila(cot.ivaPorcentaje > 0 ? 'Total con IVA' : 'Total', formatCLP(cot.total), true)
  if (cot.abono > 0) fila('Abono para reservar', formatCLP(cot.abono))
  else y += 2

  // Datos de transferencia del abono
  if (cot.transferencia) {
    const t = cot.transferencia
    const filas = [
      { etiqueta: 'Banco', valor: t.bank },
      { etiqueta: 'Tipo de cuenta', valor: t.accountType },
      { etiqueta: 'N° de cuenta', valor: t.accountNumber },
      { etiqueta: 'Titular', valor: t.holderName },
      { etiqueta: 'RUT', valor: t.holderRut },
      { etiqueta: 'Correo', valor: t.email }
    ].filter(f => f.valor)
    if (filas.length > 0) {
      y += 3
      bloque('Datos para transferir el abono', filas)
    }
  }

  if (cot.comentarios) {
    y += 1
    bloque('Comentarios del cliente', [{ etiqueta: 'Nota', valor: cot.comentarios }])
  }

  // Pie en todas las páginas: contacto del negocio
  const contacto = [cot.negocio.phone1, cot.negocio.email, cot.negocio.address].filter(Boolean).join('  ·  ')
  const paginas = doc.getNumberOfPages()
  for (let pagina = 1; pagina <= paginas; pagina++) {
    doc.setPage(pagina)
    doc.setDrawColor(...LINEA)
    doc.line(MARGEN, ALTO - 16, MARGEN + ANCHO_UTIL, ALTO - 16)
    doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...GRIS)
    const lineas: string[] = doc.splitTextToSize(contacto, ANCHO_UTIL - 20)
    doc.text(lineas, MARGEN, ALTO - 11)
    doc.text(`${pagina} / ${paginas}`, MARGEN + ANCHO_UTIL, ALTO - 11, { align: 'right' })
  }

  return doc.output('blob')
}
