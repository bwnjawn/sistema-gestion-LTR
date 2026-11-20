import { describe, expect, it } from 'vitest'
import { filasResumenBorrador, type EntradaResumen } from '../src/services/resumenBorrador'

const base: EntradaResumen = {
  servicio: 'cabana', fechaInicio: '', fechaFin: '', personas: 2, recurso: '', modalidadCamping: 'pernoctar', comidas: []
}

describe('filasResumenBorrador', () => {
  it('solo muestra lo elegido: sin fechas ni cabaña queda solo la cantidad de personas', () => {
    expect(filasResumenBorrador(base)).toEqual([{ etiqueta: 'Personas', valor: '2' }])
  })

  it('cabaña con fechas muestra llegada, salida y noches', () => {
    const filas = filasResumenBorrador({ ...base, recurso: 'Cabaña 6', fechaInicio: '2026-12-12', fechaFin: '2026-12-14' })
    expect(filas.map(f => f.etiqueta)).toEqual(['Cabaña', 'Llegada', 'Salida', 'Noches', 'Personas'])
    expect(filas.find(f => f.etiqueta === 'Noches')?.valor).toBe('2')
  })

  it('camping de un día no muestra "Hasta"', () => {
    const filas = filasResumenBorrador({ ...base, servicio: 'camping', modalidadCamping: 'diario', fechaInicio: '2026-12-12', fechaFin: '2026-12-13' })
    expect(filas.map(f => f.etiqueta)).toEqual(['Modalidad', 'Desde', 'Personas'])
  })

  it('restaurante muestra las comidas elegidas', () => {
    const filas = filasResumenBorrador({ ...base, servicio: 'restaurante', fechaInicio: '2026-12-12', comidas: ['Almuerzo', 'Once'] })
    expect(filas.find(f => f.etiqueta === 'Comidas')?.valor).toBe('Almuerzo, Once')
  })
})
