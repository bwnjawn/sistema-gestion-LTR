import { describe, expect, it } from 'vitest'
import {
  LIMITE_VARIEDADES_POR_DEFECTO,
  aplicaLimiteVariedades,
  puedeAgregarVariedad,
  superaLimiteVariedades
} from '../src/services/menus'

const LIMITE = LIMITE_VARIEDADES_POR_DEFECTO

describe('límite de variedades de menú para grupos grandes', () => {
  it('no aplica a grupos de 30 personas o menos', () => {
    expect(aplicaLimiteVariedades(30, LIMITE)).toBe(false)
    expect(puedeAgregarVariedad(30, 10, LIMITE)).toBe(true)
  })

  it('aplica desde 31 personas', () => {
    expect(aplicaLimiteVariedades(31, LIMITE)).toBe(true)
  })

  it('con un grupo grande se pueden agregar platos hasta llegar a 3 distintos', () => {
    expect(puedeAgregarVariedad(40, 2, LIMITE)).toBe(true)
    expect(puedeAgregarVariedad(40, 3, LIMITE)).toBe(false)
  })

  it('detecta una comida con más de 3 variedades cuando el grupo creció', () => {
    expect(superaLimiteVariedades(40, 5, LIMITE)).toBe(true)
    expect(superaLimiteVariedades(40, 3, LIMITE)).toBe(false)
    expect(superaLimiteVariedades(20, 5, LIMITE)).toBe(false)
  })

  it('respeta valores distintos si el administrador los cambia', () => {
    const limite = { umbralPersonas: 50, maxVariedades: 2 }
    expect(puedeAgregarVariedad(40, 5, limite)).toBe(true)
    expect(puedeAgregarVariedad(51, 2, limite)).toBe(false)
  })
})
