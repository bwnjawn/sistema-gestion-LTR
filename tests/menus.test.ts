import { describe, expect, it } from 'vitest'
import {
  LIMITE_VARIEDADES_POR_DEFECTO,
  aplicaLimiteVariedades,
  aplicarReglaDeAcompanamiento,
  comidaAdmiteAcompanamiento,
  comidaTieneLimiteDeVariedades,
  platosQueUsanAcompanamiento,
  puedeAgregarVariedad,
  superaLimiteVariedades,
  validarNombreAcompanamiento,
  validarPlato
} from '../src/services/menus'
import type { Dish } from '../src/types/domain'

const LIMITE = LIMITE_VARIEDADES_POR_DEFECTO

describe('límite de variedades de menú para grupos grandes (solo almuerzo, SCRUM-294)', () => {
  it('no aplica a grupos de 30 personas o menos', () => {
    expect(aplicaLimiteVariedades(30, LIMITE, 'almuerzo')).toBe(false)
    expect(puedeAgregarVariedad(30, 10, LIMITE, 'almuerzo')).toBe(true)
  })

  it('aplica desde 31 personas', () => {
    expect(aplicaLimiteVariedades(31, LIMITE, 'almuerzo')).toBe(true)
  })

  it('con un grupo grande se pueden agregar platos al almuerzo hasta llegar a 3 distintos', () => {
    expect(puedeAgregarVariedad(40, 2, LIMITE, 'almuerzo')).toBe(true)
    expect(puedeAgregarVariedad(40, 3, LIMITE, 'almuerzo')).toBe(false)
  })

  it('el desayuno y la once no tienen límite aunque el grupo sea grande', () => {
    for (const comida of ['desayuno', 'once'] as const) {
      expect(comidaTieneLimiteDeVariedades(comida)).toBe(false)
      expect(aplicaLimiteVariedades(100, LIMITE, comida)).toBe(false)
      expect(puedeAgregarVariedad(100, 10, LIMITE, comida)).toBe(true)
      expect(superaLimiteVariedades(100, 10, LIMITE, comida)).toBe(false)
    }
  })

  it('detecta un almuerzo con más de 3 variedades cuando el grupo creció', () => {
    expect(superaLimiteVariedades(40, 5, LIMITE, 'almuerzo')).toBe(true)
    expect(superaLimiteVariedades(40, 3, LIMITE, 'almuerzo')).toBe(false)
    expect(superaLimiteVariedades(20, 5, LIMITE, 'almuerzo')).toBe(false)
  })

  it('respeta valores distintos si el administrador los cambia', () => {
    const limite = { umbralPersonas: 50, maxVariedades: 2 }
    expect(puedeAgregarVariedad(40, 5, limite, 'almuerzo')).toBe(true)
    expect(puedeAgregarVariedad(51, 2, limite, 'almuerzo')).toBe(false)
  })
})

const plato = (extra: Partial<Dish> = {}): Dish => ({
  id: 'p-1',
  name: 'Asado',
  price: 10000,
  mealType: 'almuerzo',
  sideMode: 'choice',
  availableSides: ['Ensalada', 'Papas'],
  isActive: true,
  ...extra
})

describe('acompañamientos y validación de platos (SCRUM-229)', () => {
  it('encuentra los platos activos que ofrecen un acompañamiento a elección', () => {
    const platos = [
      plato({ id: 'a', name: 'Asado' }),
      plato({ id: 'b', name: 'Pollo', availableSides: ['Papas'] }),
      plato({ id: 'c', name: 'Sopa', sideMode: 'none', availableSides: [] }),
      plato({ id: 'd', name: 'Viejo', isActive: false })
    ]
    expect(platosQueUsanAcompanamiento('Ensalada', platos).map(p => p.name)).toEqual(['Asado'])
    expect(platosQueUsanAcompanamiento('Papas', platos).map(p => p.name)).toEqual(['Asado', 'Pollo'])
    expect(platosQueUsanAcompanamiento('Arroz', platos)).toEqual([])
  })

  it('el nombre de un acompañamiento no puede estar vacío ni repetido (sin distinguir mayúsculas)', () => {
    const existentes = ['Ensalada', 'Papas']
    expect(validarNombreAcompanamiento('  ', existentes)).toBeTruthy()
    expect(validarNombreAcompanamiento('ensalada ', existentes)).toBeTruthy()
    expect(validarNombreAcompanamiento('Arroz', existentes)).toBeNull()
  })

  it('al renombrar se puede conservar el nombre o cambiar solo las mayúsculas, pero no tomar el de otro', () => {
    const existentes = ['Ensalada', 'Papas']
    expect(validarNombreAcompanamiento('Ensalada', existentes, 'Ensalada')).toBeNull()
    expect(validarNombreAcompanamiento('ENSALADA', existentes, 'Ensalada')).toBeNull()
    expect(validarNombreAcompanamiento('papas', existentes, 'Ensalada')).toBeTruthy()
  })

  it('un plato fijo exige el acompañamiento y uno a elección exige al menos una opción', () => {
    expect(validarPlato(plato())).toBeNull()
    expect(validarPlato(plato({ sideMode: 'choice', availableSides: [] }))).toBeTruthy()
    expect(validarPlato(plato({ sideMode: 'fixed', fixedSide: '  ' }))).toBeTruthy()
    expect(validarPlato(plato({ sideMode: 'fixed', fixedSide: 'Pan amasado' }))).toBeNull()
    expect(validarPlato(plato({ sideMode: 'none', availableSides: [] }))).toBeNull()
    expect(validarPlato(plato({ name: ' ' }))).toBeTruthy()
  })
})

describe('desayuno y once no llevan acompañamiento (SCRUM-229)', () => {
  it('solo el almuerzo admite acompañamiento', () => {
    expect(comidaAdmiteAcompanamiento('almuerzo')).toBe(true)
    expect(comidaAdmiteAcompanamiento('desayuno')).toBe(false)
    expect(comidaAdmiteAcompanamiento('once')).toBe(false)
  })

  it('un plato de desayuno queda sin acompañamiento y lo fijo pasa a la descripción', () => {
    const p = aplicarReglaDeAcompanamiento(
      plato({ mealType: 'desayuno', sideMode: 'fixed', fixedSide: 'Pan amasado', availableSides: [], description: 'Té o café' })
    )
    expect(p.sideMode).toBe('none')
    expect(p.availableSides).toEqual([])
    expect(p.fixedSide).toBeUndefined()
    expect(p.description).toBe('Té o café. Pan amasado')
  })

  it('no repite en la descripción lo que ya estaba escrito ahí', () => {
    const p = aplicarReglaDeAcompanamiento(
      plato({ mealType: 'once', sideMode: 'fixed', fixedSide: 'Sopaipillas', availableSides: [], description: 'Sopaipillas pasadas y kuchen' })
    )
    expect(p.description).toBe('Sopaipillas pasadas y kuchen')
  })

  it('el almuerzo y un plato ya limpio no cambian (misma referencia)', () => {
    const almuerzo = plato()
    expect(aplicarReglaDeAcompanamiento(almuerzo)).toBe(almuerzo)
    const limpio = plato({ mealType: 'once', sideMode: 'none', availableSides: [] })
    expect(aplicarReglaDeAcompanamiento(limpio)).toBe(limpio)
  })

  it('validarPlato no exige acompañamientos en desayuno ni once', () => {
    expect(validarPlato(plato({ mealType: 'desayuno', sideMode: 'choice', availableSides: [] }))).toBeNull()
  })
})
