import { describe, expect, it } from 'vitest'
import { horasDeComida, validarHoraComida } from '../src/services/availability'

const DESAYUNO = { start: '08:30', end: '11:00' }
const ALMUERZO = { start: '12:30', end: '14:00' }

function hora(texto: string, rango = DESAYUNO) {
  const r = validarHoraComida(texto, rango)
  return r.valida ? r.hora : null
}

describe('validarHoraComida (SCRUM-37)', () => {
  it('acepta las horas de media en media hora dentro del rango, incluidos los extremos', () => {
    expect(hora('08:30')).toBe('08:30')
    expect(hora('09:00')).toBe('09:00')
    expect(hora('10:30')).toBe('10:30')
    expect(hora('11:00')).toBe('11:00')
  })

  it('rechaza una hora que no cae en media hora', () => {
    const r = validarHoraComida('8:45', DESAYUNO)
    expect(r.valida).toBe(false)
    if (!r.valida) expect(r.mensaje).toContain('media en media hora')
    expect(hora('09:15')).toBeNull()
    expect(hora('10:10')).toBeNull()
  })

  it('rechaza horas fuera del rango, aunque sean de media hora', () => {
    const r = validarHoraComida('08:00', DESAYUNO)
    expect(r.valida).toBe(false)
    if (!r.valida) expect(r.mensaje).toBe('Elige una hora entre 08:30 y 11:00.')
    expect(hora('11:30')).toBeNull()
    expect(hora('15:00', ALMUERZO)).toBeNull()
  })

  it('el mensaje de media hora da ejemplos del rango de esa comida', () => {
    const r = validarHoraComida('13:10', ALMUERZO)
    expect(r.valida).toBe(false)
    if (!r.valida) expect(r.mensaje).toContain('12:30 o 13:00')
  })

  it('entiende las formas habituales de escribir la hora y la deja como HH:MM', () => {
    expect(hora('9:30')).toBe('09:30')
    expect(hora('9.30')).toBe('09:30')
    expect(hora('930')).toBe('09:30')
    expect(hora('1330', ALMUERZO)).toBe('13:30')
    expect(hora('13', ALMUERZO)).toBe('13:00')
    expect(hora('  10:00  ')).toBe('10:00')
  })

  it('una hora que cae en media hora de otro horario también se acepta', () => {
    expect(hora('13:00', { start: '12:45', end: '14:15' })).toBe('13:00')
    expect(hora('12:45', { start: '12:45', end: '14:15' })).toBeNull()
  })

  it('rechaza texto que no es una hora', () => {
    expect(hora('')).toBeNull()
    expect(hora('   ')).toBeNull()
    expect(hora('las nueve')).toBeNull()
    expect(hora('25:00')).toBeNull()
    expect(hora('09:75')).toBeNull()
    expect(hora('9:5')).toBeNull()
  })

  it('el mensaje de un campo vacío o ilegible orienta al cliente', () => {
    const vacio = validarHoraComida('', DESAYUNO)
    const raro = validarHoraComida('abc', DESAYUNO)
    expect(vacio.valida || raro.valida).toBe(false)
    if (!vacio.valida) expect(vacio.mensaje).toBe('Elige la hora de tu comida.')
    if (!raro.valida) expect(raro.mensaje).toContain('Elige una de la lista')
  })

  it('usa el horario que configure el administrador', () => {
    expect(hora('18:30', { start: '18:00', end: '20:00' })).toBe('18:30')
    expect(hora('20:30', { start: '18:00', end: '20:00' })).toBeNull()
  })

  it('un horario mal configurado no deja pasar nada', () => {
    expect(validarHoraComida('10:00', { start: '', end: '' }).valida).toBe(false)
  })
})

describe('horasDeComida (SCRUM-37)', () => {
  it('da todas las medias horas del horario, extremos incluidos', () => {
    expect(horasDeComida(DESAYUNO)).toEqual(['08:30', '09:00', '09:30', '10:00', '10:30', '11:00'])
    expect(horasDeComida(ALMUERZO)).toEqual(['12:30', '13:00', '13:30', '14:00'])
    expect(horasDeComida({ start: '17:00', end: '19:30' })).toHaveLength(6)
  })

  it('sigue el horario que configure el administrador', () => {
    expect(horasDeComida({ start: '13:00', end: '15:00' })).toEqual(['13:00', '13:30', '14:00', '14:30', '15:00'])
    expect(horasDeComida({ start: '12:00', end: '12:30' })).toEqual(['12:00', '12:30'])
  })

  it('un horario que no empieza en media hora solo ofrece medias horas exactas', () => {
    expect(horasDeComida({ start: '12:45', end: '14:15' })).toEqual(['13:00', '13:30', '14:00'])
  })

  it('un horario vacío, mal escrito o invertido no ofrece horas', () => {
    expect(horasDeComida({ start: '', end: '' })).toEqual([])
    expect(horasDeComida({ start: '14:00', end: '12:00' })).toEqual([])
    expect(horasDeComida({ start: 'a', end: 'b' })).toEqual([])
  })

  it('toda hora que se ofrece pasa la validación', () => {
    const rango = { start: '12:45', end: '14:15' }
    for (const h of horasDeComida(rango)) expect(validarHoraComida(h, rango).valida).toBe(true)
  })
})
