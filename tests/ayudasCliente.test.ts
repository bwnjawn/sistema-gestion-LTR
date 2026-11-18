import { describe, expect, it } from 'vitest'
import { ayudaDelPaso, AYUDA_ULTIMO_PASO } from '../src/components/ui/ayudasCliente'
import { WIZARD_STEPS } from '../src/services/wizard'
import type { ServiceType } from '../src/types/domain'

const SERVICIOS: ServiceType[] = ['cabana', 'camping', 'restaurante', 'piscina']

describe('ayudas del flujo del cliente (SCRUM-272)', () => {
  it('el último paso de cada flujo lleva la ayuda "Antes de enviar"', () => {
    for (const servicio of SERVICIOS) {
      const total = WIZARD_STEPS[servicio].length
      expect(ayudaDelPaso(servicio, total, total)).toBe(AYUDA_ULTIMO_PASO)
    }
  })

  it('llevan ayuda los pasos con reglas que no se ven a simple vista', () => {
    expect(ayudaDelPaso('camping', 1, 4)?.titulo).toBe('Modalidad y fecha')
    expect(ayudaDelPaso('restaurante', 1, 4)?.titulo).toBe('Fecha, comidas y hora')
    expect(ayudaDelPaso('restaurante', 2, 4)?.titulo).toBe('Elegir el menú')
    expect(ayudaDelPaso('piscina', 1, 3)?.titulo).toBe('Cuándo reservar la piscina')
  })

  it('los pasos autoexplicativos no llevan ayuda', () => {
    expect(ayudaDelPaso('cabana', 1, 4)).toBeNull()
    expect(ayudaDelPaso('cabana', 2, 4)).toBeNull()
    expect(ayudaDelPaso('cabana', 3, 4)).toBeNull()
    expect(ayudaDelPaso('camping', 3, 4)).toBeNull()
    expect(ayudaDelPaso('restaurante', 3, 4)).toBeNull()
    expect(ayudaDelPaso('piscina', 2, 3)).toBeNull()
  })
})
