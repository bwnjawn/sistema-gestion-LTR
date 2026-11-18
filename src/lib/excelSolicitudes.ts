// src/lib/excelSolicitudes.ts
// Escribe el archivo .xlsx de las solicitudes (SCRUM-275) a partir de las hojas armadas por `services/exportacion.ts`.
// exceljs se carga al pulsar el botón, para no engordar la descarga inicial de la app.

import type { FormatoColumna, HojaDatos } from '../services/exportacion'

const VERDE = 'FF1E4620'
const FORMATOS: Record<FormatoColumna, string | undefined> = {
  texto: undefined,
  entero: '#,##0',
  dinero: '"$"#,##0',
  fecha: 'dd-mm-yyyy'
}

export const TIPO_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export async function generarExcelSolicitudes(hojas: HojaDatos[]): Promise<Blob> {
  const modulo: any = await import('exceljs')
  const ExcelJS = modulo.default ?? modulo
  const libro = new ExcelJS.Workbook()
  libro.creator = 'Los Troncos de Repil'
  libro.created = new Date()

  for (const hoja of hojas) {
    const ws = libro.addWorksheet(hoja.nombre, { views: [{ state: 'frozen', ySplit: 1 }] })
    hoja.columnas.forEach((c, i) => {
      ws.getColumn(i + 1).width = c.ancho
    })

    if (hoja.conFiltros && hoja.filas.length > 0) {
      // Tabla de Excel: los encabezados traen filtros y orden, y las filas alternan color
      ws.addTable({
        name: 'Registros',
        ref: 'A1',
        headerRow: true,
        totalsRow: false,
        style: { theme: 'TableStyleMedium7', showRowStripes: true },
        columns: hoja.columnas.map(c => ({ name: c.titulo, filterButton: true })),
        rows: hoja.filas
      })
    } else {
      ws.addRow(hoja.columnas.map(c => c.titulo))
      hoja.filas.forEach(fila => ws.addRow(fila))
      ws.getRow(1).eachCell((celda: any) => {
        celda.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE } }
        celda.alignment = { vertical: 'middle', wrapText: true }
      })
      if (hoja.filaTotal && hoja.filas.length > 0) {
        ws.getRow(ws.rowCount).eachCell({ includeEmpty: true }, (celda: any) => {
          celda.font = { bold: true }
          celda.border = { top: { style: 'thin' } }
        })
      }
    }

    // Formato de cada columna (fechas, dinero, enteros) en todas sus filas
    hoja.columnas.forEach((c, i) => {
      const formato = FORMATOS[c.formato]
      if (!formato) return
      for (let fila = 2; fila <= ws.rowCount; fila++) ws.getCell(fila, i + 1).numFmt = formato
    })
    ws.getRow(1).height = 30
  }

  const datos: ArrayBuffer = await libro.xlsx.writeBuffer()
  return new Blob([datos], { type: TIPO_XLSX })
}
