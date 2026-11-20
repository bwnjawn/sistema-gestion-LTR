import { describe, expect, it } from 'vitest'
import {
  armarComida,
  armarHorarioCabana,
  armarHorarioCamping,
  describirHorario,
  opcionesDeHora,
  validarHorarioDelDia,
  validarRangoComida
} from '../src/services/horarios'

describe('opcionesDeHora (SCRUM-280)', () => {
  it('ofrece de media en media hora, de 00:00 a 23:30', () => {
    const horas = opcionesDeHora()
    expect(horas).toHaveLength(48)
    expect(horas[0]).toBe('00:00')
    expect(horas[1]).toBe('00:30')
    expect(horas[47]).toBe('23:30')
  })

  it('conserva una hora guardada que no cae en media hora, en su lugar', () => {
    const horas = opcionesDeHora('09:15')
    expect(horas).toHaveLength(49)
    expect(horas.indexOf('09:15')).toBe(horas.indexOf('09:00') + 1)
  })

  it('no agrega una hora que ya está ni un texto que no es una hora', () => {
    expect(opcionesDeHora('15:00')).toHaveLength(48)
    expect(opcionesDeHora('tarde')).toHaveLength(48)
    expect(opcionesDeHora('')).toHaveLength(48)
  })
})

describe('validarRangoComida', () => {
  it('acepta un rango normal, incluso de una sola hora', () => {
    expect(validarRangoComida('12:30', '14:00')).toBeNull()
    expect(validarRangoComida('13:00', '13:00')).toBeNull()
  })

  it('rechaza que la última hora sea antes de la primera', () => {
    expect(validarRangoComida('14:00', '12:30')).toContain('antes de la primera')
  })

  it('rechaza un rango sin ninguna media hora exacta', () => {
    expect(validarRangoComida('12:35', '12:55')).toContain('media hora')
  })

  it('rechaza horas que no se entienden', () => {
    expect(validarRangoComida('', '14:00')).not.toBeNull()
  })
})

describe('validarHorarioDelDia', () => {
  it('el camping por el día debe salir después de entrar', () => {
    expect(validarHorarioDelDia('09:00', '19:30')).toBeNull()
    expect(validarHorarioDelDia('19:30', '09:00')).toContain('después del ingreso')
    expect(validarHorarioDelDia('09:00', '09:00')).not.toBeNull()
  })
})

describe('lo que se guarda', () => {
  it('una comida guarda el rango y las horas que ve el cliente (las medias horas, extremos incluidos)', () => {
    expect(armarComida('12:45', '14:15')).toEqual({ start: '12:45', end: '14:15', times: ['13:00', '13:30', '14:00'] })
    expect(armarComida('08:30', '11:00').times).toEqual(['08:30', '09:00', '09:30', '10:00', '10:30', '11:00'])
  })

  it('el texto del horario distingue salir el mismo día de salir otro día', () => {
    expect(describirHorario('09:00', '19:30', true)).toBe('Día de ingreso (09:00 hrs) - Día de ingreso (19:30 hrs)')
    expect(describirHorario('15:00', '11:00', false)).toBe('Día de ingreso (15:00 hrs) - Día de salida (11:00 hrs)')
  })

  it('cabaña y camping actualizan también el texto, para que no quede uno viejo', () => {
    expect(armarHorarioCabana('16:00', '12:00')).toEqual({
      checkIn: '16:00',
      checkOut: '12:00',
      display: 'Día de ingreso (16:00 hrs) - Día de salida (12:00 hrs)'
    })
    const camping = armarHorarioCamping({ ingreso: '10:00', salida: '20:00' }, { ingreso: '13:00', salida: '12:00' })
    expect(camping.diario.display).toBe('Día de ingreso (10:00 hrs) - Día de ingreso (20:00 hrs)')
    expect(camping.pernoctar).toEqual({
      checkIn: '13:00',
      checkOut: '12:00',
      display: 'Día de ingreso (13:00 hrs) - Día de salida (12:00 hrs)'
    })
  })
})
