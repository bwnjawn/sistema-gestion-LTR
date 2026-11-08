import { describe, expect, it } from 'vitest'
import { addDays, dateToISO, formatDateShort, isoToDate, nightsBetween } from '../src/lib/dates'

describe('fechas', () => {
  it('cuenta las noches entre dos fechas', () => {
    expect(nightsBetween('2026-11-13', '2026-11-16')).toBe(3)
  })

  it('devuelve 0 noches si la salida no es posterior o la fecha es inválida', () => {
    expect(nightsBetween('2026-11-13', '2026-11-13')).toBe(0)
    expect(nightsBetween('2026-11-16', '2026-11-13')).toBe(0)
    expect(nightsBetween('', '2026-11-13')).toBe(0)
  })

  it('no se desfasa con el cambio de horario', () => {
    expect(nightsBetween('2026-09-05', '2026-09-08')).toBe(3)
  })

  it('suma días cruzando de mes y año', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
    expect(addDays('basura', 1)).toBe('')
  })

  it('convierte entre texto y Date sin cambiar el día', () => {
    const fecha = isoToDate('2026-11-08')
    expect(fecha).not.toBeNull()
    expect(dateToISO(fecha as Date)).toBe('2026-11-08')
    expect(isoToDate('2026-13-40')).toBeNull()
  })

  it('formatea fechas cortas y rechaza las inválidas', () => {
    expect(formatDateShort('2026-11-08')).toBe('8 Nov')
    expect(formatDateShort('nada')).toBe('-')
  })
})
